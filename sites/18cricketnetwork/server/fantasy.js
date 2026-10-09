import {FANTASY_POLICY,fantasyRole,validateFantasy,fantasyPoints,entryPoints,RING_POLICY} from '../public/fantasy-engine.js';
import {canAdminMatch} from './governance.js';
const fail=(m,s=400)=>{throw Object.assign(Error(m),{status:s})};
const json=(d,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'no-store'}});
const stamp=()=>new Date().toISOString();
const selection=b=>({playerIds:b.playerIds,captainId:b.captainId,viceCaptainId:b.viceCaptainId,benchIds:b.benchIds||[]});
export async function fantasy(request,env,path,user,body){
 if(path[0]!=='fantasy')return null;const DB=env.DB,method=request.method;
 if(path[1]==='contests'&&path.length===2){
  if(method==='GET'){const rows=(await DB.prepare('SELECT * FROM cricket_contests ORDER BY created DESC LIMIT 100').all()).results;return json({policy:FANTASY_POLICY,contests:rows.map(r=>({id:r.id,owner:r.owner,version:r.version,matchId:r.match_id,lockAt:r.lock_at,...JSON.parse(r.data)})),ringPolicy:RING_POLICY});}
  if(method==='POST'){
   const b=await body(),match=await DB.prepare("SELECT * FROM records WHERE id=? AND type='matches'").bind(b.matchId).first();if(!match)fail('Match not found',404);if(!await canAdminMatch(DB,match,user))fail('Only match staff can create its fantasy contest',403);
   const m=JSON.parse(match.data);if(!m.proScoring||(m.events||[]).some(e=>e.eventType==='delivery'))fail('Configure squads and create the contest before the first delivery');
   if(typeof b.name!=='string'||!b.name.trim()||b.name.length>120)fail('Enter a contest name');if(typeof b.lockAt!=='string'||!Number.isFinite(Date.parse(b.lockAt)))fail('Enter a valid lock time');const lockAt=new Date(b.lockAt).toISOString();if(lockAt<=stamp())fail('Choose a future lock time');
   if(!Array.isArray(b.pool)||b.pool.length!==m.squads.A.length+m.squads.B.length)fail('Supply the nominated contest player pool');
   const pool=[],seen=new Set();for(const p of b.pool){if(seen.has(p.id))fail('Duplicate pool player');seen.add(p.id);const side=['A','B'].find(side=>m.squads[side].some(q=>q.id===p.id));if(!side)fail('Pool player is not nominated');const player=m.squads[side].find(q=>q.id===p.id),role=fantasyRole(p.role||player.role),creditMinor=Number(p.creditMinor);if(!role||!Number.isInteger(creditMinor)||creditMinor<1||creditMinor>10000)fail('Every pool player needs a valid role and credit price');pool.push({id:p.id,name:player.name,side,role,creditMinor});}
   for(const [role,[min]]of Object.entries(FANTASY_POLICY.roles))if(pool.filter(p=>p.role===role).length<min)fail('The pool cannot satisfy '+role+' composition');if(pool.length<11)fail('Fantasy needs at least eleven pool players');
   const id=crypto.randomUUID(),data={name:b.name.trim(),pool,policy:FANTASY_POLICY,sourceVersion:match.version,createdBy:user};await DB.prepare('INSERT INTO cricket_contests(id,match_id,owner,lock_at,data,created) VALUES(?,?,?,?,?,?)').bind(id,match.id,user,lockAt,JSON.stringify(data),stamp()).run();return json({id},201);
  }
 }
 const contest=await DB.prepare('SELECT * FROM cricket_contests WHERE id=?').bind(path[2]||'').first();if(!contest)fail('Contest not found',404);const d=JSON.parse(contest.data),match=await DB.prepare("SELECT * FROM records WHERE id=? AND type='matches'").bind(contest.match_id).first();if(!match)fail('Underlying match missing',409);const m=JSON.parse(match.data),locked=stamp()>=contest.lock_at||(m.events||[]).some(e=>e.eventType==='delivery');
 if(method==='GET'){
  const scores=fantasyPoints(m,d.policy),entries=(await DB.prepare('SELECT * FROM cricket_entries WHERE contest_id=?').bind(contest.id).all()).results,sorted=entries.map(r=>({id:r.id,mine:r.owner===user,points:entryPoints(JSON.parse(r.data),scores.points)})).sort((a,b)=>b.points-a.points);let rank=0,last=null;
  const leaderboard=sorted.map((row,i)=>{if(row.points!==last)rank=i+1;last=row.points;return {...row,rank}}),mine=entries.find(r=>r.owner===user);
  return json({id:contest.id,version:contest.version,...d,locked,lockAt:contest.lock_at,matchId:match.id,matchVersion:match.version,myEntry:mine?{...JSON.parse(mine.data),version:mine.version}:null,leaderboard,provisional:scores.provisional,matchResult:scores.matchResult});
 }
 if(method==='POST'&&path[3]==='entry'){
  const b=await body(),s=selection(b),validation=validateFantasy(d.pool,s,d.policy);if(!validation.valid)return json({error:'Invalid XI',...validation},422);if(locked)fail('Contest locked by time or first delivery',423);if(b.contestVersion!==contest.version)fail('Contest changed. Refresh.',409);
  const existing=await DB.prepare('SELECT * FROM cricket_entries WHERE contest_id=? AND owner=?').bind(contest.id,user).first();if(existing&&existing.version!==b.version||!existing&&b.version)fail('Entry changed. Refresh.',409);
  const serialized=JSON.stringify({...s,submittedAt:stamp(),policyVersion:d.policy.version});
  // Lock and match state are rechecked inside the write statement, not only before validation.
  const allowed="EXISTS(SELECT 1 FROM cricket_contests c JOIN records r ON r.id=c.match_id WHERE c.id=? AND c.version=? AND c.lock_at>? AND NOT EXISTS(SELECT 1 FROM json_each(json_extract(r.data,'$.events')) e WHERE json_extract(e.value,'$.eventType')='delivery'))";
  const query=existing?DB.prepare('UPDATE cricket_entries SET data=?,version=version+1 WHERE id=? AND version=? AND '+allowed).bind(serialized,existing.id,existing.version,contest.id,contest.version,stamp()):DB.prepare('INSERT INTO cricket_entries(id,contest_id,owner,data,created) SELECT ?,?,?,?,? WHERE '+allowed).bind(crypto.randomUUID(),contest.id,user,serialized,stamp(),contest.id,contest.version,stamp());
  try{const result=await query.run();if(!result.meta.changes)fail('Entry locked or changed during submission',409)}catch(e){if(/unique/i.test(e.message))fail('Entry already submitted. Refresh.',409);throw e;}
  return json({ok:true,validation});
 }
 fail('Endpoint not found',404);
}
