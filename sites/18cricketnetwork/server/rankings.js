import {calculateMatch} from '../public/scoring-engine.js';
import {admin} from './payments.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const fail=(m,s=400)=>{throw Object.assign(Error(m),{status:s})};
export const rankingPolicy={version:1,minMatches:3,battingBalls:60,bowlingBalls:36,metrics:{batting:'Total recorded bat runs',bowling:'Bowler-credited wickets',fielding:'Attributed catches and run-outs, excluding designated wicketkeepers',wicketkeeping:'Attributed catches and stumpings by designated wicketkeepers',captaincy:'Wins / (wins + losses) × 100; ties excluded',teams:'Wins / (wins + losses) × 100; ties excluded'},notes:'Formats and seasons are separate. Equal primary metrics share rank. No invented ratings, dropped-catch counts, captain roles or net run rate.'};
export function aggregateRankings(matches,filters={}){
 const players=new Map(),teams=new Map(),seen=new Set();let eligibleMatches=0;
 const get=(id,name)=>{if(!players.has(id))players.set(id,{id,name,matches:0,innings:0,runs:0,balls:0,outs:0,bowlingBalls:0,conceded:0,wickets:0,catches:0,runOuts:0,keeperMatches:0,keeperCatches:0,stumpings:0,captainMatches:0,captainWins:0,captainLosses:0,captainTies:0});return players.get(id)};
 for(const m of matches){const meta=m.rankingMetadata;if(!m.id||seen.has(m.id)||!meta||!m.proScoring||meta.recordVersion!==m.version)continue;
  if(Object.entries(filters).some(([k,v])=>v&&!(k==='season'&&v==='all-time')&&meta[k]!==v))continue;
  const v=calculateMatch(m);if(!v.result||v.status==='abandoned'||v.status==='paused')continue;
  eligibleMatches++;seen.add(m.id);
  const winner=v.second.runs>=v.target?'B':v.second.runs===v.target-1?'tie':'A';
  for(const side of ['A','B']){
   const squad=m.squads[side],keeper=meta.keepers?.[side],captain=meta.captains?.[side];
   for(const p of squad){const s=get(p.id,p.name);s.matches++;if(p.id===keeper)s.keeperMatches++;if(p.id===captain){s.captainMatches++;if(winner===side)s.captainWins++;else if(winner==='tie')s.captainTies++;else s.captainLosses++}}
   const teamId=meta.teamIds[side];if(!teams.has(teamId))teams.set(teamId,{id:teamId,name:side==='A'?m.teamA:m.teamB,matches:0,wins:0,losses:0,ties:0});const t=teams.get(teamId);t.matches++;if(winner===side)t.wins++;else if(winner==='tie')t.ties++;else t.losses++;
  }
  for(const innings of [v.first,v.second]){
   for(const b of Object.values(innings.batters)){const s=players.get(b.id);if(b.status!=='did_not_bat'){s.innings++;s.runs+=b.runs;s.balls+=b.balls;if(b.status==='out')s.outs++}}
   for(const b of Object.values(innings.bowlers)){const s=players.get(b.id);s.bowlingBalls+=b.balls;s.conceded+=b.runs;s.wickets+=b.wickets}
   const fieldingSide=innings.index===1?'B':'A';
   for(const d of innings.deliveries){const s=players.get(d.fielderId);if(!s||!meta.keepers?.[fieldingSide])continue;const keeper=meta.keepers[fieldingSide]===d.fielderId;if(d.dismissal==='caught'){if(keeper)s.keeperCatches++;else s.catches++}if(d.dismissal==='stumped'&&keeper)s.stumpings++;if(d.dismissal==='run_out'&&!keeper)s.runOuts++}
  }
 }
 const p=[...players.values()].map(s=>({...s,battingAverage:s.outs?s.runs/s.outs:null,strikeRate:s.balls?s.runs*100/s.balls:null,economy:s.bowlingBalls?s.conceded*6/s.bowlingBalls:null}));
 function ranks(list,score){const sorted=list.map(s=>({...s,score:score(s)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));let rank=0,last=null;return sorted.map((s,i)=>{if(last!==s.score)rank=i+1;last=s.score;return {...s,rank}})}
 return {policy:rankingPolicy,eligibleMatches,batting:ranks(p.filter(s=>s.matches>=3&&s.innings>=3&&s.balls>=60),s=>s.runs),bowling:ranks(p.filter(s=>s.matches>=3&&s.bowlingBalls>=36),s=>s.wickets),fielding:ranks(p.filter(s=>s.matches>=3&&s.catches+s.runOuts>0),s=>s.catches+s.runOuts),wicketkeeping:ranks(p.filter(s=>s.keeperMatches>=3&&s.keeperCatches+s.stumpings>0),s=>s.keeperCatches+s.stumpings),captaincy:ranks(p.filter(s=>s.captainWins+s.captainLosses>=3),s=>s.captainWins*100/(s.captainWins+s.captainLosses)),teams:ranks([...teams.values()].filter(s=>s.wins+s.losses>=3),s=>s.wins*100/(s.wins+s.losses))};
}
export async function rankings(request,env,path,user,body){
 if(path[0]!=='rankings')return null;const DB=env.DB;
 if(request.method==='POST'&&path[1]==='review'){
  if(!admin(request,env))fail('Platform reviewer required',403);const b=await body();
  const r=await DB.prepare("SELECT * FROM records WHERE id=? AND type='matches'").bind(b.matchId).first();if(!r)fail('Match not found',404);if(r.version!==b.version)fail('Scorecard changed. Review again.',409);
  const m=JSON.parse(r.data),v=calculateMatch(m);if(!m.proScoring||!v.result||v.status!=='live')fail('Only completed attributed scorecards can be reviewed');
  const meta={};for(const key of ['city','state','country','league','season','format']){if(typeof b[key]!=='string'||!b[key].trim()||b[key].length>100)fail('Supply verified '+key);meta[key]=b[key].trim()}
  if(!['T10','T20','40 overs','50 overs'].includes(meta.format))fail('Choose a supported format');
  if(Number(m.overs)!==({'T10':10,'T20':20,'40 overs':40,'50 overs':50}[meta.format]))fail('Format must match the recorded overs');
  meta.tournamentId=m.tournamentId||'';meta.teamIds={};meta.captains={};meta.keepers={};
  for(const side of ['A','B']){const team=await DB.prepare("SELECT data FROM records WHERE id=? AND type='teams'").bind(b.teamIds?.[side]||'').first();if(!team||JSON.parse(team.data).name!==m[side==='A'?'teamA':'teamB'])fail('Select the actual team record for each side');meta.teamIds[side]=b.teamIds[side];for(const [key,target]of [['captains',meta.captains],['keepers',meta.keepers]]){const id=b[key]?.[side]||null;if(id&&!m.squads[side].some(p=>p.id===id))fail('Captain / keeper must be in the recorded squad');target[side]=id}}
  if(meta.teamIds.A===meta.teamIds.B)fail('Teams must be distinct');
  const id=r.id,stamp=new Date().toISOString();meta.recordVersion=r.version;meta.reviewedAt=stamp;meta.reviewedBy=user;
  await DB.prepare('INSERT INTO ranking_reviews(match_id,data,updated) VALUES(?,?,?) ON CONFLICT(match_id) DO UPDATE SET data=excluded.data,updated=excluded.updated').bind(id,JSON.stringify(meta),stamp).run();return json({ok:true});
 }
 if(request.method==='GET'){
  const rows=(await DB.prepare("SELECT r.*,v.data AS review FROM records r JOIN ranking_reviews v ON v.match_id=r.id WHERE r.type='matches'").all()).results;
  const matches=rows.map(r=>({...JSON.parse(r.data),id:r.id,version:r.version,rankingMetadata:JSON.parse(r.review)}));
  const keys=['city','state','country','league','tournamentId','season','format'],url=new URL(request.url),filters=Object.fromEntries(keys.map(k=>[k,url.searchParams.get(k)||'']));
  if(!filters.format||!filters.season)return json({policy:rankingPolicy,requires:['format','season'],facets:Object.fromEntries(keys.map(k=>[k,[...new Set(matches.filter(m=>m.version===m.rankingMetadata.recordVersion).map(m=>m.rankingMetadata[k]).filter(Boolean))].sort()])),eligibleMatches:0,batting:[],bowling:[],fielding:[],wicketkeeping:[],captaincy:[],teams:[]});
  return json(aggregateRankings(matches,filters));
 }
 return json({error:'Endpoint not found'},404);
}
