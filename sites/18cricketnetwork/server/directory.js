import {admin} from './payments.js';
import usa from '../data/usa-venues-researched.json' with {type:'json'};
import india from '../data/india-venues-researched.json' with {type:'json'};
const fail=(m,s=400)=>{throw Object.assign(Error(m),{status:s})};
const json=d=>new Response(JSON.stringify(d),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const stamp=()=>new Date().toISOString();
const text=(v,max=500)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail('Missing or invalid claim details');return v.trim()};
const decode=r=>({...JSON.parse(r.data),id:r.id,owner:r.owner,version:r.version,kind:r.kind,country:r.country});
const evidenceTypes=['Business license','Lease','Property deed','Operator authorization','Municipal permit','Utility bill'];
export async function ensureResearchedVenues(DB){
 // Reference data imports belong outside schema migrations. Insert missing IDs
 // only; never overwrite an operator assignment, newer facts or existing rows.
 const existing=new Set((await DB.prepare('SELECT id FROM directory_venues').all()).results.map(r=>r.id));
 const missing=[...usa,...india].filter(v=>!existing.has(v.id));
 for(let i=0;i<missing.length;i+=20)await DB.batch(missing.slice(i,i+20).map(v=>DB.prepare('INSERT OR IGNORE INTO directory_venues(id,kind,country,data,created) VALUES(?,?,?,?,?)').bind(v.id,v.kind,v.country,JSON.stringify({...v,bookingStatus:'directory-only',ownershipStatus:'unclaimed'}),'2026-10-07T17:15:00Z')));
}
export async function directory(request,env,path,user,body){if(path[0]!=='directory')return null;const DB=env.DB,method=request.method,isAdmin=admin(request,env),url=new URL(request.url);
 if(path[1]==='venues'&&method==='GET'){
  await ensureResearchedVenues(DB);
  const all=(await DB.prepare('SELECT * FROM directory_venues ORDER BY country,kind,id').all()).results;
  const filters=Object.fromEntries(['country','kind','state','city','q'].map(k=>[k,(url.searchParams.get(k)||'').toLowerCase()]));
  const venues=all.map(decode).filter(v=>(!filters.country||v.country.toLowerCase()===filters.country)&&(!filters.kind||v.kind===filters.kind)&&(!filters.state||v.state.toLowerCase()===filters.state)&&(!filters.city||v.city.toLowerCase().includes(filters.city))&&(!filters.q||[v.name,v.city,v.state,v.address].join(' ').toLowerCase().includes(filters.q)));
  const counts={total:all.length,US:{ground:0,practice:0,academy:0},IN:{ground:0,practice:0,academy:0}};for(const v of all)counts[v.country][v.kind]++;
  return json({venues,counts,filtered:venues.length,states:[...new Set(all.filter(v=>!filters.country||v.country.toLowerCase()===filters.country).map(v=>JSON.parse(v.data).state))].sort(),isAdmin,coverage:'Researched directory, not exhaustive. Sources verify venue identity/location, not current access, rates or availability.'});
 }
 if(path[1]==='claims'&&method==='GET'){
  const rows=(await DB.prepare(isAdmin?'SELECT c.*,v.data AS venue_data,a.email FROM venue_claims c JOIN directory_venues v ON c.venue_id=v.id LEFT JOIN accounts a ON a.owner=c.owner ORDER BY c.created DESC LIMIT 500':'SELECT c.*,v.data AS venue_data,a.email FROM venue_claims c JOIN directory_venues v ON c.venue_id=v.id LEFT JOIN accounts a ON a.owner=c.owner WHERE c.owner=? ORDER BY c.created DESC LIMIT 100').bind(...(isAdmin?[]:[user])).all()).results;
  return json(rows.map(r=>({...r,data:JSON.parse(r.data),venue:JSON.parse(r.venue_data),venue_data:undefined})));
 }
 if(path[1]==='claims'&&method==='POST'&&!path[2]){
  const b=await body(),venue=await DB.prepare('SELECT * FROM directory_venues WHERE id=?').bind(b.venueId).first();if(!venue)fail('Choose a listed venue',404);if(venue.owner)fail('This venue already has a verified operator. Contact platform support for an ownership dispute.',409);if(b.venueVersion!==venue.version)fail('Venue changed. Refresh.',409);
  const account=await DB.prepare('SELECT * FROM accounts WHERE owner=?').bind(user).first();if(!account)fail('Complete your account registration before requesting seller verification',403);
  const requiredRole={ground:'ground_owner',practice:'practice_facility',academy:'academy'}[venue.kind];if(!JSON.parse(account.data).roles?.includes(requiredRole))fail('Add the matching ground owner, practice facility or academy category to your account first',403);
  if(b.authorityConfirmed!==true||b.documentConsent!==true)fail('Confirm authority to operate the venue and consent to private proof verification');
  if(!Array.isArray(b.evidence)||!b.evidence.length||b.evidence.length>5)fail('Attach 1–5 proof documents');if(!b.evidence.some(e=>['Lease','Property deed','Operator authorization','Municipal permit'].includes(e.type)))fail('Include a lease, deed, operator authorization or municipal permit proving operating rights');
  const evidence=[],seen=new Set();for(const e of b.evidence){if(!evidenceTypes.includes(e.type)||seen.has(e.assetId))fail('Invalid or duplicate evidence');seen.add(e.assetId);const asset=await DB.prepare('SELECT * FROM assets WHERE id=? AND owner=?').bind(e.assetId,user).first();if(!asset||asset.purpose!=='ownership-proof')fail('Upload private ownership proof under your own account',403);evidence.push({assetId:asset.id,type:e.type})}
  const data={organization:text(b.organization,200),relationship:text(b.relationship,200),contactEmail:account.email,note:text(b.note,2000),evidence,authorityConfirmed:true,documentConsent:true,venueVersion:venue.version};
  const pending=await DB.prepare("SELECT id FROM venue_claims WHERE venue_id=? AND owner=? AND status='pending'").bind(venue.id,user).first();if(pending)fail('You already have a pending request for this venue',409);
  const id=crypto.randomUUID();try{await DB.prepare('INSERT INTO venue_claims(id,venue_id,owner,data,created) VALUES(?,?,?,?,?)').bind(id,venue.id,user,JSON.stringify(data),stamp()).run()}catch(e){if(/unique/i.test(e.message))fail('A request is already pending',409);throw e}return json({id,status:'pending',message:'Seller ownership request submitted. Venue access stays unclaimed until platform verification.'});
 }
 if(path[1]==='claims'&&path[2]&&method==='POST'){
  if(!isAdmin)fail('Platform verifier required',403);const b=await body(),claim=await DB.prepare('SELECT * FROM venue_claims WHERE id=?').bind(path[2]).first();if(!claim)fail('Claim not found',404);if(claim.status!=='pending'||b.version!==claim.version)fail('Claim changed or already decided',409);if(!['approved','rejected'].includes(b.status))fail('Choose approve or reject');const reason=text(b.reason,1000),at=stamp();if(b.status==='approved'&&b.operatingRightsVerified!==true)fail('Inspect documents and verify identity, venue address and operating rights before approval');
  const queries=[DB.prepare("UPDATE venue_claims SET status=?,reason=?,reviewed_by=?,reviewed_at=?,version=version+1 WHERE id=? AND version=? AND status='pending' AND (?='rejected' OR EXISTS(SELECT 1 FROM directory_venues WHERE id=venue_claims.venue_id AND owner IS NULL))").bind(b.status,reason,user,at,claim.id,claim.version,b.status)];
  if(b.status==='approved')queries.push(DB.prepare('UPDATE directory_venues SET owner=?,version=version+1 WHERE id=? AND owner IS NULL AND changes()=1').bind(claim.owner,claim.venue_id));
  const results=await DB.batch(queries);if(!results[0].meta.changes||b.status==='approved'&&!results[1].meta.changes)fail('Another verification already changed this venue',409);return json({ok:true,status:b.status});
 }
 if(path[1]==='mine'&&method==='GET')return json((await DB.prepare('SELECT * FROM directory_venues WHERE owner=?').bind(user).all()).results.map(decode));
 return new Response(JSON.stringify({error:'Directory endpoint not found'}),{status:404});
}
