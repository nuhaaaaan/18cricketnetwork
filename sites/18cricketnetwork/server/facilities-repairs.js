const fail=(m,s=400)=>{throw Object.assign(Error(m),{status:s})};
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const now=()=>new Date().toISOString(),uuid=()=>crypto.randomUUID();
const str=(v,max=200)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail('Missing or invalid text');return v.trim()};
const num=(v,min,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail('Invalid number');return v};
const decode=r=>({...JSON.parse(r.data),id:r.id,owner:r.owner,provider:r.provider,version:r.version,created:r.created});
const all=async(DB,sql,...args)=>(await DB.prepare(sql).bind(...args).all()).results;
async function row(DB,table,id){const r=await DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first();if(!r)fail('Record not found',404);return r}
async function save(DB,table,r,d,slotKey){let q=DB.prepare(`UPDATE ${table} SET data=?,version=version+1${slotKey===null?',slot_key=NULL':''} WHERE id=? AND version=?`).bind(JSON.stringify(d),r.id,r.version);if(!(await q.run()).meta.changes)fail('Record changed. Refresh before retrying.',409)}
export function bookingFee(price){const totalMinor=Math.round(price*100),commissionMinor=Math.round(totalMinor*.05);return {totalMinor,commissionMinor,providerMinor:totalMinor-commissionMinor,basisPoints:500}}
const equipment=['Bat','Ball','Pads','Gloves','Helmet','Shoes','Bag','Other equipment'];
function location(d){const country=d.country;if(!['US','IN'].includes(country))fail('Choose USA or India');return {name:str(d.name,120),city:str(d.city,100),address:str(d.address,500),country,currency:country==='IN'?'INR':'USD',lat:num(d.lat,-90,90),lng:num(d.lng,-180,180)}}
function localTime(zone){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:parts.year+'-'+parts.month+'-'+parts.day,hour:Number(parts.hour)}}
export async function facilitiesRepairs(request,env,path,user,body){
 if(!['nets','repairs'].includes(path[0]))return null;
 const DB=env.DB,method=request.method,isNet=path[0]==='nets',listingTable=isNet?'facility_listings':'repair_providers',orderTable=isNet?'net_bookings':'repair_orders';
 if(path[1]==='listings'){
  if(method==='GET')return json((await all(DB,`SELECT * FROM ${listingTable} ORDER BY updated DESC LIMIT 500`)).map(decode));
  if(method==='POST'){
   const b=await body(),base=location(b.data||{}),raw=b.data;let d;
   if(isNet){if(b.commissionAccepted!==true)fail('Accept the 5% booking commission');const lanes=num(raw.lanes,1,20),open=num(raw.open,0,22),close=num(raw.close,1,23);if(![lanes,open,close].every(Number.isInteger)||close<=open)fail('Choose valid lane count and opening hours');if(!Array.isArray(raw.days)||!raw.days.length||raw.days.some(x=>!Number.isInteger(x)||x<0||x>6))fail('Choose opening days');try{new Intl.DateTimeFormat('en',{timeZone:raw.timezone}).format()}catch{fail('Choose a valid IANA timezone')};d={...base,hourlyPrice:num(raw.hourlyPrice,.01,100000),lanes,open,close,days:[...new Set(raw.days)],timezone:raw.timezone,cancellationPolicy:str(raw.cancellationPolicy,1000),commissionBps:500,commissionAcceptedAt:now()}}
   else{if(!Array.isArray(raw.equipment)||!raw.equipment.length||raw.equipment.some(x=>!equipment.includes(x)))fail('Choose equipment you repair');d={...base,equipment:[...new Set(raw.equipment)],startingPrice:num(raw.startingPrice,0,100000),turnaroundDays:num(raw.turnaroundDays,1,90),bio:str(raw.bio,1500),shipping:raw.shipping===true,terms:str(raw.terms,1000)}}
   if(path[2]){const r=await row(DB,listingTable,path[2]);if(r.owner!==user)fail('Listing owner required',403);if(b.version!==r.version)fail('Listing changed',409);await save(DB,listingTable,r,d);return json({id:r.id})}
   const id=uuid();await DB.prepare(`INSERT INTO ${listingTable}(id,owner,data,updated) VALUES(?,?,?,?)`).bind(id,user,JSON.stringify(d),now()).run();return json({id},201);
  }
 }
 if(isNet&&path[1]==='slots'&&method==='GET'){
  const r=await row(DB,listingTable,path[2]),d=JSON.parse(r.data),date=new URL(request.url).searchParams.get('date');validateDate(date);
  const current=localTime(d.timezone),weekday=new Date(date+'T12:00:00Z').getUTCDay();
  const occupied=await all(DB,'SELECT slot_key FROM net_bookings WHERE facility_id=? AND slot_key IS NOT NULL',r.id);
  const slots=[];if(date>=current.date&&d.days.includes(weekday))for(let lane=1;lane<=d.lanes;lane++)for(let hour=d.open;hour<d.close;hour++){const key=[r.id,date,lane,hour].join('|');slots.push({lane,hour,available:!(date===current.date&&hour<=current.hour)&&!occupied.some(s=>s.slot_key===key)})}
  return json({date,timezone:d.timezone,hourlyPrice:d.hourlyPrice,currency:d.currency,slots});
 }
 if(path[1]==='orders'){
  if(method==='GET'){if(path[2]){const r=await row(DB,orderTable,path[2]);if(r.owner!==user&&r.provider!==user)fail('Order access denied',403);return json(decode(r))}return json((await all(DB,`SELECT * FROM ${orderTable} WHERE owner=? OR provider=? ORDER BY created DESC LIMIT 300`,user,user)).map(decode))}
  if(method==='POST'&&!path[2]){
   const b=await body(),r=await row(DB,listingTable,b.listingId),p=JSON.parse(r.data);if(r.owner===user)fail('You cannot book your own listing');if(b.listingVersion!==r.version)fail('Listing changed. Review the new price and terms.',409);
   const id=uuid(),stamp=now();let d;
   if(isNet){validateDate(b.date);const current=localTime(p.timezone),lane=num(b.lane,1,p.lanes),hour=num(b.hour,p.open,p.close-1);if(!Number.isInteger(lane)||!Number.isInteger(hour)||!p.days.includes(new Date(b.date+'T12:00:00Z').getUTCDay())||b.date<current.date||(b.date===current.date&&hour<=current.hour))fail('Choose a future available slot');if(b.policyAccepted!==true)fail('Accept the facility cancellation terms');const key=[r.id,b.date,lane,hour].join('|');d={listingId:r.id,name:p.name,address:p.address,lat:p.lat,lng:p.lng,date:b.date,lane,hour,timezone:p.timezone,currency:p.currency,fee:bookingFee(p.hourlyPrice),cancellationPolicy:p.cancellationPolicy,status:'reserved',paymentStatus:'not_collected',history:[{status:'reserved',at:stamp}]};try{await DB.prepare('INSERT INTO net_bookings(id,facility_id,owner,provider,slot_key,data,created) VALUES(?,?,?,?,?,?,?)').bind(id,r.id,user,r.owner,key,JSON.stringify(d),stamp).run()}catch(e){if(/unique/i.test(e.message))fail('That slot was just booked. Choose another.',409);throw e}}
   else{if(b.policyAccepted!==true)fail('Accept the repairer terms');if(!p.equipment.includes(b.equipment))fail('This repairer does not offer that equipment service');if(!['Drop-off','Ship-in'].includes(b.delivery)||b.delivery==='Ship-in'&&!p.shipping)fail('Choose an offered handover method');d={listingId:r.id,name:p.name,address:p.address,equipment:b.equipment,description:str(b.description,2000),delivery:b.delivery,terms:p.terms,currency:p.currency,status:'requested',paymentStatus:'not_collected',history:[{status:'requested',at:stamp}],shipping:{}};await DB.prepare('INSERT INTO repair_orders(id,owner,provider,data,created) VALUES(?,?,?,?,?)').bind(id,user,r.owner,JSON.stringify(d),stamp).run()}
   return json({id},201);
  }
  if(method==='POST'&&path[2]){
   const r=await row(DB,orderTable,path[2]);if(r.owner!==user&&r.provider!==user)fail('Order access denied',403);const b=await body(),d=JSON.parse(r.data),provider=r.provider===user,owner=r.owner===user;if(b.version!==r.version)fail('Order changed. Refresh.',409);const stamp=now();
   if(isNet){if(b.action==='cancel'&&['reserved','confirmed'].includes(d.status)){if(!owner&&!provider)fail('Not allowed',403);d.status='cancelled';d.history.push({status:d.status,at:stamp,by:provider?'facility':'customer'});await save(DB,orderTable,r,d,null);return json({ok:true})}if(provider&&b.action==='confirm'&&d.status==='reserved')d.status='confirmed';else if(provider&&b.action==='complete'&&d.status==='confirmed'){const current=localTime(d.timezone);if(d.date>current.date||d.date===current.date&&d.hour>=current.hour)fail('Session has not ended yet');d.status='completed'}else fail('Invalid booking transition',409)}
   else{
    if(b.action==='quote'&&provider&&d.status==='requested'){d.quoteMinor=Math.round(num(b.price,.01,100000)*100);d.quoteNote=str(b.note,1000);d.status='quoted'}
    else if(b.action==='approve_quote'&&owner&&d.status==='quoted')d.status='approved';
    else if(b.action==='cancel'&&['requested','quoted','approved'].includes(d.status))d.status='cancelled';
    else if(b.action==='received'&&provider&&d.status==='approved')d.status='received';
    else if(b.action==='repairing'&&provider&&d.status==='received')d.status='repairing';
    else if(b.action==='ready'&&provider&&d.status==='repairing')d.status='ready';
    else if(b.action==='dispatch'&&provider&&d.status==='ready'&&d.delivery==='Ship-in'){d.status='return_shipped';d.shipping.returnTracking=str(b.tracking,100);d.shipping.returnCarrier=str(b.carrier,50)}
    else if(b.action==='complete'&&owner&&['ready','return_shipped'].includes(d.status))d.status='completed';
    else if(b.action==='shipping'&&d.delivery==='Ship-in'&&!['cancelled','completed'].includes(d.status)){
     const leg=provider?'return':'inbound';if(owner&&d.status!=='approved'||provider&&!['ready','return_shipped'].includes(d.status))fail('Shipping not available at this stage',409);
     let asset=null;if(b.labelAssetId){const a=await DB.prepare('SELECT * FROM assets WHERE id=? AND owner=?').bind(b.labelAssetId,user).first();if(!a||!['application/pdf','image/png','image/jpeg','image/webp'].includes(a.mime))fail('Upload a carrier label PDF or image you own');asset=a.id}
     d.shipping[leg]={carrier:str(b.carrier,50),tracking:str(b.tracking,100),labelAssetId:asset};
    }else fail('Invalid repair transition',409);
   }
   d.history.push({status:b.action,at:stamp,by:provider?'provider':'customer'});if(d.history.length>100)fail('Order update limit reached');await save(DB,orderTable,r,d);return json({ok:true});
  }
 }
 if(!isNet&&path[1]==='label'&&method==='GET'){
  const r=await row(DB,orderTable,path[2]);if(r.owner!==user&&r.provider!==user)fail('Order access denied',403);const d=JSON.parse(r.data);return json({kind:'repair reference',id:r.id,name:d.name,payload:'18CN-REPAIR:'+r.id,barcode:r.id,address:d.address,notice:'Repair identification only. This QR/barcode is not postage or a carrier drop-off code. Purchase a carrier label separately.',carrierDocument:null});
 }
 return json({error:'Endpoint not found'},404);
}
function validateDate(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)fail('Choose a valid calendar date')}
