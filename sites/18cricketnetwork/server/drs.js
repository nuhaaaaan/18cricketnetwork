import {canAdminMatch} from './governance.js';
import {videoMoment} from '../public/match-report.js';
import {DRS_VERSION,REVIEW_TYPES,validateObservations,evaluateReview,RULE_SOURCE} from '../public/drs-rules.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const fail=(m,s=400)=>{throw Object.assign(Error(m),{status:s})};
const now=()=>new Date().toISOString();
const row=async(DB,id)=>{const r=await DB.prepare("SELECT * FROM records WHERE id=? AND type='matches'").bind(id).first();if(!r)fail('Match not found',404);return r};
const control=async(DB,r,user)=>{if(!await canAdminMatch(DB,r,user))fail('Only the match owner or appointed competition admins may manage DRS',403)};
const text=(s,max)=>{if(typeof s!=='string'||!s.trim()||s.length>max)fail('Add a valid explanation');return s.trim()};
export async function drsReadiness(DB,matchId){
 const s=await DB.prepare('SELECT * FROM drs_setups WHERE match_id=?').bind(matchId).first(),issues=[],views=[];
 if(!s)return {ready:false,issues:['Configure DRS with two distinct camera views first.'],views,automatedDetection:false};
 const d=JSON.parse(s.data);
 for(const role of ['bowler_end','square_leg']){
  const id=d[role],r=await DB.prepare('SELECT * FROM hardware_devices WHERE id=? AND owner=?').bind(id,s.owner).first();
  const device=r?JSON.parse(r.data):{},connected=!!r?.token_hash&&!device.disabled&&Date.parse(device.lastSeen)>Date.now()-300000;
  const sessions=(await DB.prepare('SELECT * FROM camera_sessions WHERE device_id=? AND match_id=? AND owner=?').bind(id,matchId,s.owner).all()).results;
  const session=sessions.find(x=>JSON.parse(x.data).status==='recording');
  views.push({role,deviceId:id,name:device.name||'Unavailable camera',connected,recording:!!session,sessionId:session?.id||null});
  if(!connected)issues.push(role+': camera heartbeat/credential unavailable.');if(!session)issues.push(role+': recording has not been acknowledged by the camera.');
 }
 const sessions=views.map(v=>v.sessionId);if(!d.syncConfirmed||sessions.some((id,i)=>!id||id!==d.syncSessions?.[i]))issues.push('An operator must confirm frame/time alignment for the current two recording sessions.');
 if(d.bowler_end===d.square_leg)issues.push('Two distinct cameras are required.');
 return {ready:issues.length===0,issues,views,automatedDetection:false,mode:'human-assisted',rulesVersion:DRS_VERSION,syncSource:'operator declaration, not automatic calibration',setupVersion:s.version};
}
export async function drs(request,env,path,user,body){
 if(path[0]!=='drs')return null;const DB=env.DB,r=await row(DB,path[1]),method=request.method,canManage=await canAdminMatch(DB,r,user),match=JSON.parse(r.data);
 const setup=await DB.prepare('SELECT * FROM drs_setups WHERE match_id=?').bind(r.id).first();
 if(method==='GET'){
  const reviews=(await DB.prepare('SELECT * FROM drs_reviews WHERE match_id=? ORDER BY created DESC LIMIT 100').bind(r.id).all()).results.map(x=>({...JSON.parse(x.data),id:x.id,version:x.version,status:x.status,created:x.created,stale:x.source_version!==r.version}));
  return json({matchId:r.id,matchVersion:r.version,canManage,setup:setup?{...JSON.parse(setup.data),version:setup.version}:null,readiness:await drsReadiness(DB,r.id),reviews,rulesSource:RULE_SOURCE,mode:'human-assisted',playerReviews:'Not enabled: captain identity, official timing and competition allowances require integration.'});
 }
 await control(DB,r,user);const b=await body();
 if(path[2]==='setup'&&method==='POST'){
  if(b.version!==(setup?.version||0))fail('DRS setup changed. Reload.',409);
  if(typeof b.bowler_end!=='string'||typeof b.square_leg!=='string'||b.bowler_end===b.square_leg)fail('Select two distinct cameras: bowler-end and square-leg.');
  for(const id of [b.bowler_end,b.square_leg]){const cam=await DB.prepare('SELECT * FROM hardware_devices WHERE id=? AND owner=?').bind(id,user).first();if(!cam||JSON.parse(cam.data).disabled)fail('Choose active cameras registered to your account.');}
  const data={bowler_end:b.bowler_end,square_leg:b.square_leg,placementNote:text(b.placementNote,1000),syncConfirmed:false,rulesVersion:DRS_VERSION,mode:'human-assisted',updatedBy:user};
  if(b.syncConfirmed===true){
   data.syncSessions=[];for(const id of [b.bowler_end,b.square_leg]){const sessions=(await DB.prepare('SELECT * FROM camera_sessions WHERE device_id=? AND match_id=? AND owner=?').bind(id,r.id,user).all()).results;const session=sessions.find(x=>JSON.parse(x.data).status==='recording');if(!session)fail('Start both camera sessions and wait for camera acknowledgements before confirming alignment.');data.syncSessions.push(session.id)}
   data.syncConfirmed=true;data.syncConfirmedAt=now();
  }
  if(setup){const result=await DB.prepare('UPDATE drs_setups SET owner=?,data=?,version=version+1,updated=? WHERE match_id=? AND version=?').bind(user,JSON.stringify(data),now(),r.id,setup.version).run();if(!result.meta.changes)fail('DRS setup changed. Reload.',409)}else{try{await DB.prepare('INSERT INTO drs_setups(match_id,owner,data,updated) VALUES(?,?,?,?)').bind(r.id,user,JSON.stringify(data),now()).run()}catch(e){if(/unique|constraint/i.test(e.message))fail('DRS setup changed. Reload.',409);throw e}}
  return json({ok:true});
 }
 if(path[2]==='reviews'&&!path[3]&&method==='POST'){
  if(!setup)fail('Configure two camera views first.');if(b.matchVersion!==r.version)fail('Match changed. Reload.',409);
  if(!REVIEW_TYPES[b.type]||!['out','not_out','no_decision'].includes(b.originalDecision))fail('Select review type and original decision.');
  const index=Number(b.eventIndex),event=match.events?.[index];if(!Number.isInteger(index)||index<0||!event||event.eventType!=='delivery')fail('Choose an existing scored delivery.');
  // Review referrals currently entered by authorised officials only; do not pretend a captain request was timed.
  if(b.referral&&b.referral!=='umpire')fail('Player-review requests are not enabled. Use an umpire referral.');
  const id=crypto.randomUUID(),data={type:b.type,originalDecision:b.originalDecision,eventIndex:index,eventSnapshot:event,referral:'umpire',openedBy:user,setupSnapshot:JSON.parse(setup.data),rulesVersion:DRS_VERSION,scorecardChanged:false};
  const inserted=await DB.prepare('INSERT INTO drs_reviews(id,match_id,source_version,data,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND version=?)').bind(id,r.id,r.version,JSON.stringify(data),now(),r.id,r.version).run();if(!inserted.meta.changes)fail('Match changed. Reload.',409);return json({id},201);
 }
 if(path[2]==='reviews'&&path[3]&&method==='POST'){
  const review=await DB.prepare('SELECT * FROM drs_reviews WHERE id=? AND match_id=?').bind(path[3],r.id).first();if(!review)fail('Review not found',404);if(review.status!=='open')fail('Finalised reviews are immutable.',409);if(review.version!==b.version||review.source_version!==r.version)fail('Review or scorecard changed. Open a new review against the current delivery.',409);
  const data=JSON.parse(review.data);let observations;try{observations=validateObservations(data.type,b.observations)}catch(e){fail(e.message)}
  if(!Array.isArray(b.evidence)||b.evidence.length!==2)fail('Attach both distinct camera replay references.');
  const roles=new Set(),evidence=[];for(const item of b.evidence){if(!['bowler_end','square_leg'].includes(item.role)||roles.has(item.role))fail('One replay per required camera view.');roles.add(item.role);const seconds=Number(item.seconds);if(!Number.isFinite(seconds)||seconds<0||seconds>86400||!videoMoment(item.url,seconds))fail('Use supported HTTPS YouTube/Vimeo replay URLs and valid timestamps.');evidence.push({role:item.role,url:item.url,seconds,source:'official-entered',deviceId:data.setupSnapshot[item.role]})}
  const aligned=b.aligned===true;if(!aligned)observations.clearEvidence='no';const evaluation=evaluateReview(data.type,observations,data.originalDecision);
  const decision=b.decision;if(!['out','not_out','retain_original','four','six','no_boundary','no_ball','fair_delivery','wide','not_wide'].includes(decision))fail('Select final decision.');
  const dismissal=['lbw','run_out','stumped','caught','bowled','hit_wicket'].includes(data.type),valid=dismissal?['out','not_out','retain_original']:data.type==='boundary'?['four','six','no_boundary','retain_original']:data.type==='no_ball'?['no_ball','fair_delivery','retain_original']:data.type==='wide'?['wide','not_wide','no_ball','retain_original']:['retain_original'];if(!valid.includes(decision))fail('Decision does not match review type.');
  if(evaluation.recommendation==='inconclusive'&&decision!=='retain_original')fail('Insufficient/unsupported evidence: retain the original decision.');
  if(evaluation.recommendation!=='inconclusive'&&decision!=='retain_original'&&decision!==evaluation.recommendation)fail('Decision conflicts with the entered evidence. Correct the observations first.');
  Object.assign(data,{observations,evidence,aligned,evaluation,decision,reason:text(b.reason,2000),decidedBy:user,decidedAt:now(),scorecardChanged:false});
  const changed=await DB.prepare("UPDATE drs_reviews SET data=?,status='decided',version=version+1 WHERE id=? AND version=? AND status='open' AND EXISTS(SELECT 1 FROM records WHERE id=? AND version=?)").bind(JSON.stringify(data),review.id,review.version,r.id,r.version).run();if(!changed.meta.changes)fail('Review or scorecard changed. Reload.',409);return json({ok:true,evaluation,scorecardChanged:false});
 }
 fail('DRS operation not found',404);
}
