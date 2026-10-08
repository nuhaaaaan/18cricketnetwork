import {admin} from './payments.js';
import {canAdminMatch} from './governance.js';
import {videoMoment} from '../public/match-report.js';
import {validateProduct} from './market.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
const now=()=>new Date().toISOString();
const text=(v,max=200)=>String(v||'').trim().slice(0,max);
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const key=()=> 'cam_'+[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
const decode=r=>({...JSON.parse(r.data),id:r.id,version:r.version});
const planned=[{id:'18-match-camera',name:'18 Match Camera',type:'Camera',bio:'Planned 18 Shop match-recording camera offering. Manufacturer, model, price and stock will be announced after supplier selection and integration testing.',availability:'coming_soon',compatibility:'unverified',price:null,stock:0},{id:'18-camera-mount-kit',name:'18 Camera Mount & Power Kit',type:'Camera accessories',bio:'Planned mounting and power accessories for our camera offering. Mount fit, contents, safety specifications, price and stock are not confirmed.',availability:'coming_soon',compatibility:'unverified',price:null,stock:0}];
async function catalog(DB){
 await DB.batch(planned.map(p=>DB.prepare('INSERT OR IGNORE INTO hardware_catalog(id,data,updated) VALUES(?,?,?)').bind(p.id,JSON.stringify(p),now())));
 const rows=(await DB.prepare('SELECT * FROM hardware_catalog ORDER BY id').all()).results.map(decode);
 for(const p of rows)if(p.recordId){const live=await DB.prepare("SELECT data FROM records WHERE id=? AND type='marketplace'").bind(p.recordId).first();if(live){const d=JSON.parse(live.data);p.price=d.price;p.currency=d.currency;p.stock=d.stock}else{p.availability='unavailable';p.recordId=null;p.stock=0}}
 return rows;
}
async function matchAccess(DB,id,user){const r=await DB.prepare("SELECT * FROM records WHERE id=? AND type='matches'").bind(id).first();if(!r)fail('Choose a recorded match',404);if(r.owner!==user&&!await canAdminMatch(DB,r,user))fail('Only the match scorer or competition admin can connect capture sessions',403);return r}
async function device(DB,id,user){const r=await DB.prepare('SELECT * FROM hardware_devices WHERE id=? AND owner=?').bind(id,user).first();if(!r)fail('Camera not found in your account',404);return r}
async function update(DB,table,r,data){const terminal=table==='camera_sessions'&&['completed','failed'].includes(data.status);const q=await DB.prepare(`UPDATE ${table} SET data=?,version=version+1${terminal?',active_slot=NULL':''} WHERE id=? AND version=?`).bind(JSON.stringify(data),r.id,r.version).run();if(!q.meta.changes)fail('Record changed. Reload.',409)}
export async function ingestCamera(request,env){
 const token=request.headers.get('Authorization')?.match(/^Bearer (cam_[a-f0-9]{64})$/)?.[1];if(!token)fail('Camera credential required',401);
 const r=await env.DB.prepare('SELECT * FROM hardware_devices WHERE token_hash=?').bind(await hash(token)).first();if(!r)fail('Invalid or revoked camera credential',401);const d=JSON.parse(r.data);if(d.disabled)fail('Camera disabled',403);
 const raw=await request.text();if(raw.length>12000)fail('Telemetry request too large',413);let b;try{b=JSON.parse(raw)}catch{fail('Invalid JSON')}
 if(b.action==='heartbeat'){
  d.lastSeen=now();d.firmware=text(b.firmware,80);await update(env.DB,'hardware_devices',r,d);
  const sessions=(await env.DB.prepare('SELECT * FROM camera_sessions WHERE device_id=? ORDER BY created DESC LIMIT 30').bind(r.id).all()).results;
  const commands=[];for(const s of sessions){const data=JSON.parse(s.data);if(!['requested','stop_requested'].includes(data.status))continue;try{await matchAccess(env.DB,s.match_id,r.owner);commands.push({id:s.id,matchId:s.match_id,command:data.status==='requested'?'start':'stop'})}catch{}}
  return json({ok:true,serverTime:d.lastSeen,commands});
 }
 if(!['recording_started','recording_completed','recording_failed'].includes(b.action))fail('Unsupported camera event');
 const s=await env.DB.prepare('SELECT * FROM camera_sessions WHERE id=? AND device_id=?').bind(b.sessionId,r.id).first();if(!s)fail('Capture session not found',404);await matchAccess(env.DB,s.match_id,r.owner);const sd=JSON.parse(s.data);
 if(sd.status==='completed'&&b.action==='recording_completed')return json({ok:true,duplicate:true});
 if(['completed','failed'].includes(sd.status))fail('Capture session is closed',409);
 if(b.action==='recording_started'){if(sd.status!=='requested')fail('Capture start is not pending',409);sd.status='recording';sd.startedAt=now()}
 if(b.action==='recording_failed'){sd.status='failed';sd.error='Camera reported capture failure';sd.endedAt=now()}
 if(b.action==='recording_completed'){
  if(!['recording','stop_requested'].includes(sd.status))fail('Camera must confirm capture start first',409);
  if(!videoMoment(b.recordingUrl,0))fail('Recording delivery currently supports HTTPS YouTube or Vimeo links');
  if(!Number.isInteger(b.durationSeconds)||b.durationSeconds<1||b.durationSeconds>86400)fail('Provide a valid recorded duration');
  sd.status='completed';sd.recordingUrl=b.recordingUrl;sd.durationSeconds=b.durationSeconds;sd.endedAt=now();sd.source='device-reported';
 }
 await update(env.DB,'camera_sessions',s,sd);return json({ok:true,status:sd.status});
}
export async function hardware(request,env,path,user,body){
 if(path[0]!=='hardware')return null;const DB=env.DB,method=request.method,isAdmin=admin(request,env);
 if(path[1]==='catalog'&&method==='GET')return json({shopName:'18 Shop',official:true,products:await catalog(DB),canManage:isAdmin});
 if(path[1]==='catalog'&&path[2]&&method==='POST'){
  if(!isAdmin)fail('Only the platform operator can publish 18 Shop hardware',403);await catalog(DB);const r=await DB.prepare('SELECT * FROM hardware_catalog WHERE id=?').bind(path[2]).first();if(!r)fail('Hardware product not found',404);const b=await body();if(b.version!==r.version)fail('Listing changed. Reload.',409);
  const profile=await DB.prepare('SELECT data FROM seller_profiles WHERE owner=?').bind(user).first();if(!profile||!JSON.parse(profile.data).returnPolicyDeclaration?.accepted)fail('Declare seller shipping and return policies in Marketplace seller settings before activating hardware sales');
  if(!b.manufacturer?.trim()||!b.model?.trim()||!b.specifications?.trim()||!b.warranty?.trim())fail('Provide the actual manufacturer, model, specifications and warranty');
  if(typeof b.price!=='number'||!Number.isFinite(b.price)||b.price<=0||!Number.isInteger(b.stock)||b.stock<1)fail('Set the actual sale price and available stock');
  const prev=JSON.parse(r.data),product=validateProduct({name:text(b.name||prev.name,160),type:prev.type,condition:'New',brand:text(b.manufacturer,80),bio:text(b.specifications,3500)+'\nWarranty: '+text(b.warranty,400),price:b.price,stock:b.stock,currency:b.currency,country:b.country||'US',shippingFee:Number(b.shippingFee||0),useStorePolicy:true});
  let recordId=prev.recordId;const existing=recordId?await DB.prepare("SELECT * FROM records WHERE id=? AND owner=? AND type='marketplace'").bind(recordId,user).first():null;if(recordId&&!existing)fail('Linked hardware product is unavailable. Contact the platform operator.',409);
  recordId=recordId||crypto.randomUUID();const p={...product,hardwareCatalogId:r.id};const payload=JSON.stringify(p);
  const next={...prev,name:p.name,manufacturer:product.brand,model:text(b.model),specifications:product.bio,warranty:text(b.warranty,400),price:product.price,currency:product.currency,stock:product.stock,availability:'listed',compatibility:b.integrationTested===true?'operator-tested':'unverified',recordId};
  const writeProduct=existing?DB.prepare('UPDATE records SET data=?,version=version+1 WHERE id=? AND owner=? AND version=? AND EXISTS(SELECT 1 FROM hardware_catalog WHERE id=? AND version=?)').bind(payload,recordId,user,existing.version,r.id,r.version):DB.prepare('INSERT INTO records(id,type,owner,data,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM hardware_catalog WHERE id=? AND version=?)').bind(recordId,'marketplace',user,payload,now(),r.id,r.version);
  const writes=await DB.batch([writeProduct,DB.prepare('UPDATE hardware_catalog SET data=?,version=version+1,updated=? WHERE id=? AND version=? AND EXISTS(SELECT 1 FROM records WHERE id=? AND owner=? AND data=?)').bind(JSON.stringify(next),now(),r.id,r.version,recordId,user,payload)]);if(!writes.every(w=>w.meta.changes))fail('Listing or inventory changed. Reload before publishing.',409);return json({ok:true,recordId});
 }
 if(path[1]==='enquiries'){
  if(method==='GET'){const rows=isAdmin?(await DB.prepare('SELECT * FROM hardware_enquiries ORDER BY created DESC LIMIT 500').all()).results:(await DB.prepare('SELECT * FROM hardware_enquiries WHERE owner=? ORDER BY created DESC LIMIT 100').bind(user).all()).results;return json(rows.map(r=>({...r,data:JSON.parse(r.data)})))}
  if(method==='POST'){const b=await body();await catalog(DB);if(!await DB.prepare('SELECT id FROM hardware_catalog WHERE id=?').bind(b.productId).first())fail('Choose an 18 Shop product');if(b.consent!==true||!text(b.message,2000))fail('Add your requirements and agree that 18 Shop may contact you about this enquiry');const recent=await DB.prepare('SELECT COUNT(*) AS n FROM hardware_enquiries WHERE owner=? AND created>?').bind(user,new Date(Date.now()-3600000).toISOString()).first();if(recent.n>=5)fail('Please wait before sending another enquiry',429);const id=crypto.randomUUID();await DB.prepare('INSERT INTO hardware_enquiries(id,owner,product_id,data,created) VALUES(?,?,?,?,?)').bind(id,user,b.productId,JSON.stringify({message:text(b.message,2000),email:request.headers.get('oai-authenticated-user-email')||null,consent:true}),now()).run();return json({id},201)}
 }
 if(path[1]==='devices'){
  if(method==='GET'){const rows=(await DB.prepare('SELECT * FROM hardware_devices WHERE owner=? ORDER BY created DESC').bind(user).all()).results;return json(rows.map(r=>{const d=decode(r);return {...d,connected:!d.disabled&&!!d.lastSeen&&Date.now()-Date.parse(d.lastSeen)<300000,credentialActive:!!r.token_hash}}))}
  if(method==='POST'&&!path[2]){const b=await body(),serial=text(b.serial,160),name=text(b.name,120),model=text(b.model,120);if(!serial||!name||!model||b.recordingConsent!==true)fail('Enter a camera name, model, serial and acknowledge recording permissions');const serialHash=await hash(serial.toLowerCase());if(await DB.prepare('SELECT id FROM hardware_devices WHERE serial_hash=?').bind(serialHash).first())fail('This serial is already registered; contact the operator if ownership changed',409);const id=crypto.randomUUID(),created=now();await DB.prepare('INSERT INTO hardware_devices(id,owner,serial_hash,data,created,updated) VALUES(?,?,?,?,?,?)').bind(id,user,serialHash,JSON.stringify({name,model,serial,disabled:false,recordingConsent:true,registration:'owner-entered',compatibility:'unverified'}),created,created).run();return json({id},201)}
  if(method==='POST'&&path[2]){const r=await device(DB,path[2],user),b=await body();if(b.version!==r.version)fail('Camera changed. Reload.',409);const d=JSON.parse(r.data);if(path[3]==='credential'){if(d.disabled)fail('Camera is disabled');const token=key();const q=await DB.prepare('UPDATE hardware_devices SET token_hash=?,version=version+1,updated=? WHERE id=? AND version=?').bind(await hash(token),now(),r.id,r.version).run();if(!q.meta.changes)fail('Camera changed. Reload.',409);return json({token,deviceId:r.id,ingestUrl:new URL('/api/hardware/ingest',request.url).href,protocol:'18-camera-v1'})}if(path[3]==='disable'){d.disabled=true;const changed=await DB.prepare('UPDATE hardware_devices SET token_hash=NULL,data=?,version=version+1,updated=? WHERE id=? AND version=?').bind(JSON.stringify(d),now(),r.id,r.version).run();if(!changed.meta.changes)fail('Camera changed. Reload.',409);const sessions=(await DB.prepare('SELECT * FROM camera_sessions WHERE active_slot=?').bind(r.id).all()).results;for(const s of sessions){const sd=JSON.parse(s.data);sd.status='failed';sd.error='Connection revoked by owner; remote recording stop is not guaranteed';sd.endedAt=now();await update(DB,'camera_sessions',s,sd)}return json({ok:true})}}
 }
 if(path[1]==='sessions'){
  if(method==='GET')return json((await DB.prepare('SELECT * FROM camera_sessions WHERE owner=? ORDER BY created DESC LIMIT 200').bind(user).all()).results.map(r=>({...decode(r),deviceId:r.device_id,matchId:r.match_id})));
  if(method==='POST'&&!path[2]){const b=await body(),r=await device(DB,b.deviceId,user);if(JSON.parse(r.data).disabled||!r.token_hash)fail('Connect an active device credential first');await matchAccess(DB,b.matchId,user);const active=(await DB.prepare('SELECT data FROM camera_sessions WHERE device_id=?').bind(r.id).all()).results.some(s=>['requested','recording','stop_requested'].includes(JSON.parse(s.data).status));if(active)fail('This camera already has an active capture session',409);const id=crypto.randomUUID();try{const inserted=await DB.prepare('INSERT INTO camera_sessions(id,device_id,active_slot,owner,match_id,data,created) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM hardware_devices WHERE id=? AND version=? AND token_hash IS NOT NULL)').bind(id,r.id,r.id,user,b.matchId,JSON.stringify({status:'requested',requestedAt:now(),title:text(b.title||'Match recording',160)}),now(),r.id,r.version).run();if(!inserted.meta.changes)fail('Camera credentials changed. Reload.',409)}catch(e){if(/unique|constraint/i.test(e.message))fail('This camera already has an active capture session',409);throw e}return json({id,status:'requested'},201)}
  if(method==='POST'&&path[2]){const s=await DB.prepare('SELECT * FROM camera_sessions WHERE id=? AND owner=?').bind(path[2],user).first();if(!s)fail('Session not found',404);const b=await body();if(b.version!==s.version)fail('Session changed. Reload.',409);const d=JSON.parse(s.data);if(!['requested','recording'].includes(d.status))fail('Session is not active');d.status=d.status==='requested'?'failed':'stop_requested';d.error=d.status==='failed'?'Cancelled before device start':undefined;await update(DB,'camera_sessions',s,d);return json({ok:true})}
 }
 fail('Hardware operation not found',404);
}
