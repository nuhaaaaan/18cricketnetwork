import {membershipPlans,planQuote} from '../public/membership-plans.js';
const roles={marketplace:'vendor',recruitment:'talent_scout',academies:'academy',coaches:'coach',grounds:'ground_owner',teams:'team_manager',tournaments:'tournament_organizer',services:'service_provider',players:'player',media:'fan',pickup:'practice_facility',facility:'practice_facility',repair:'service_provider'};
function listingRole(r){const d=JSON.parse(r.data);return r.type==='grounds'&&d.type==='Indoor nets'?'practice_facility':roles[r.type]}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
const now=()=>new Date().toISOString();
const rows=async(DB,sql,...args)=>(await DB.prepare(sql).bind(...args).all()).results;
export function goldActive(m){return m?.status==='gold'&&Number.isFinite(Date.parse(m.expires))&&Date.parse(m.expires)>Date.now()}
async function gold(DB,user,role){return goldActive(await DB.prepare('SELECT * FROM memberships WHERE owner=? AND role=?').bind(user,role).first())}
async function target(DB,id){let r=await DB.prepare('SELECT * FROM records WHERE id=?').bind(id).first();if(!r){const f=await DB.prepare('SELECT * FROM facility_listings WHERE id=?').bind(id).first(),p=await DB.prepare('SELECT * FROM repair_providers WHERE id=?').bind(id).first();r=f?{...f,type:'facility'}:p?{...p,type:'repair'}:null}if(!r||!roles[r.type])fail('Choose a business or player listing',404);return r}
export async function memberships(request,env,path,user,body){
 if(path[0]!=='business')return null;
 const DB=env.DB,method=request.method,url=new URL(request.url);
 if(path[1]==='plans'&&method==='GET')return json({plans:membershipPlans,interval:'month',basic:0,billingEnabled:false});
 if(path[1]==='membership'&&method==='GET')return json({memberships:(await rows(DB,'SELECT * FROM memberships WHERE owner=?',user)).map(m=>({...m,effectiveTier:goldActive(m)?'18Gold':'18Basic'}))});
 if(path[1]==='upgrade'&&method==='POST'){
  const b=await body();let quote;try{quote=planQuote(b.role,b.country)}catch(e){fail(e.message)}
  return json({quote,checkoutEnabled:false,message:'Subscription checkout is not configured. No payment collected and no Gold access activated.'});
 }
 // Operator-only time-limited pilot grants. This is not a payment-verification endpoint.
 if(path[1]==='grant'&&method==='POST'){
  if(!env.PLATFORM_ADMIN_EMAIL||request.headers.get('oai-authenticated-user-email')?.toLowerCase()!==env.PLATFORM_ADMIN_EMAIL.toLowerCase())fail('Operator access required',403);
  const b=await body();try{planQuote(b.role,b.country)}catch(e){fail(e.message)}
  if(typeof b.owner!=='string'||!b.owner||b.owner.length>200||!Number.isFinite(Date.parse(b.expires))||Date.parse(b.expires)<=Date.now()||Date.parse(b.expires)>Date.now()+31*86400000)fail('Provide an owner and a pilot expiry within 31 days');
  await DB.prepare("INSERT INTO memberships(owner,role,country,status,expires,updated) VALUES(?,?,?,'gold',?,?) ON CONFLICT(owner,role) DO UPDATE SET country=excluded.country,status='gold',expires=excluded.expires,updated=excluded.updated").bind(b.owner,b.role,b.country,b.expires,now()).run();return json({ok:true,pilot:true});
 }
 if(path[1]==='visit'&&method==='POST'){
  const b=await body();if(b.consent!==true)return json({tracked:false});
  const r=await target(DB,b.recordId);if(r.owner===user)return json({tracked:false});
  // Only a daily pseudonymous hash is retained; no IP, email, cookies, or cross-site identity.
  const day=now().slice(0,10),bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(r.id+':'+day+':'+user));
  const visitor=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
  await DB.prepare('DELETE FROM listing_visits WHERE day<?').bind(new Date(Date.now()-90*86400000).toISOString().slice(0,10)).run();
  await DB.prepare('INSERT OR IGNORE INTO listing_visits(record_id,owner,visitor,day,created) VALUES(?,?,?,?,?)').bind(r.id,r.owner,visitor,day,now()).run();return json({tracked:true});
 }
 if(path[1]==='lead'&&method==='POST'){
  const b=await body(),r=await target(DB,b.recordId);if(r.owner===user)fail('You cannot enquire on your own listing');
  if(b.consent!==true)fail('Consent to share your contact details is required');
  const email=request.headers.get('oai-authenticated-user-email');if(!email)fail('A verified account email is required',401);
  if(typeof b.name!=='string'||!b.name.trim()||b.name.length>120||typeof b.message!=='string'||!b.message.trim()||b.message.length>2000)fail('Enter your name and an enquiry up to 2,000 characters');
  const recent=await DB.prepare('SELECT COUNT(*) AS n FROM business_leads WHERE visitor=? AND created>?').bind(user,new Date(Date.now()-3600000).toISOString()).first();if(recent.n>=10)fail('Please wait before sending more enquiries',429);
  try{await DB.prepare('INSERT INTO business_leads(id,record_id,owner,visitor,name,email,message,consent_version,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),r.id,r.owner,user,b.name.trim(),email,b.message.trim(),'contact-sharing-v1',now(),now()).run()}catch(e){if(/unique/i.test(e.message))fail('You already enquired on this listing',409);throw e}
  return json({ok:true},201);
 }
 if(path[1]==='lead'&&path[2]&&method==='DELETE'){
  const result=await DB.prepare('DELETE FROM business_leads WHERE id=? AND visitor=?').bind(path[2],user).run();if(!result.meta.changes)fail('Enquiry not found',404);return json({ok:true});
 }
 if(path[1]==='my-enquiries'&&method==='GET')return json(await rows(DB,'SELECT id,record_id,name,email,message,created FROM business_leads WHERE visitor=? ORDER BY created DESC LIMIT 100',user));
 if(path[1]==='lead'&&path[2]&&method==='PATCH'){
  const r=await DB.prepare('SELECT * FROM business_leads WHERE id=? AND owner=?').bind(path[2],user).first();if(!r)fail('Lead not found',404);
  const listing=await target(DB,r.record_id);if(!await gold(DB,user,listingRole(listing)))fail('Active 18Gold is required',403);
  const b=await body();if(!['new','contacted','qualified','converted','closed'].includes(b.status))fail('Invalid lead stage');
  await DB.prepare('UPDATE business_leads SET status=?,updated=? WHERE id=? AND owner=?').bind(b.status,now(),r.id,user).run();return json({ok:true});
 }
 if(path[1]==='dashboard'&&method==='GET'){
  const role=url.searchParams.get('role')||'vendor';if(!membershipPlans.some(p=>p.role===role))fail('Invalid role');
  const listings=[...await rows(DB,'SELECT id,type,data FROM records WHERE owner=?',user),...(await rows(DB,'SELECT id,data FROM facility_listings WHERE owner=?',user)).map(r=>({...r,type:'facility'})),...(await rows(DB,'SELECT id,data FROM repair_providers WHERE owner=?',user)).map(r=>({...r,type:'repair'}))].filter(r=>listingRole(r)===role);
  const ids=new Set(listings.map(r=>r.id));
  const enabled=await gold(DB,user,role);if(!enabled)return json({tier:'18Basic',role,listings:listings.length,locked:true});
  const since=new Date(Date.now()-30*86400000).toISOString();
  const visits=(await rows(DB,'SELECT record_id,day,COUNT(*) AS visits FROM listing_visits WHERE owner=? AND day>=? GROUP BY record_id,day',user,since.slice(0,10))).filter(v=>ids.has(v.record_id));
  const leads=(await rows(DB,'SELECT * FROM business_leads WHERE owner=? AND created>=? ORDER BY created DESC LIMIT 1000',user,since)).filter(l=>ids.has(l.record_id)).map(({visitor,owner,...l})=>l);
  const total=visits.reduce((n,v)=>n+v.visits,0);
  return json({tier:'18Gold',role,windowDays:30,visits:total,enquiries:leads.length,conversionRate:total?Math.round(leads.length/total*1000)/10:null,conversionNote:'Enquiries / consented daily listing visits. Enquiries can arrive without analytics consent, so this is not an attribution metric.',daily:visits,leads,listings:listings.map(r=>({id:r.id,name:JSON.parse(r.data).name,visits:visits.filter(v=>v.record_id===r.id).reduce((n,v)=>n+v.visits,0),enquiries:leads.filter(l=>l.record_id===r.id).length}))});
 }
 return json({error:'Business endpoint not found'},404);
}
