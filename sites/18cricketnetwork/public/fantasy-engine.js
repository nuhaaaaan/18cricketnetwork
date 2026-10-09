import {calculateMatch} from './scoring-engine.js';
export const FANTASY_POLICY={version:'18-free-fantasy-v1',size:11,budget:10000,maxFromTeam:7,roles:{WK:[1,4],BAT:[3,6],AR:[1,4],BOWL:[3,6]},points:{run:1,four:1,six:2,wicket:25,catch:8,stumping:12,runOut:12,assist:6},notes:'Free-to-play only. Credits use hundredths. One entry per member per contest. No cash prizes or paid entry.'};
export function fantasyRole(role){return ({Wicketkeeper:'WK',Batter:'BAT','All-rounder':'AR',Bowler:'BOWL',WK:'WK',BAT:'BAT',AR:'AR',BOWL:'BOWL'})[role]||null;}
export function validateFantasy(pool,selection,policy=FANTASY_POLICY){
 const errors=[],ids=selection.playerIds||[],byId=new Map(pool.map(p=>[p.id,p])),counts={WK:0,BAT:0,AR:0,BOWL:0},teams={},players=ids.map(id=>byId.get(id)).filter(Boolean);
 if(ids.length!==policy.size||new Set(ids).size!==ids.length)errors.push('Select exactly 11 distinct players');
 if(players.length!==ids.length)errors.push('One or more players are outside the locked contest pool');
 let credits=0;for(const p of players){if(!(p.role in counts))errors.push('A selected player has no valid fantasy role');else counts[p.role]++;credits+=p.creditMinor;teams[p.side]=(teams[p.side]||0)+1;}
 for(const [role,[min,max]]of Object.entries(policy.roles))if(counts[role]<min||counts[role]>max)errors.push(`${role} requires ${min}–${max} players`);
 if(credits>policy.budget)errors.push('The 100-credit budget is exceeded');if(Object.values(teams).some(n=>n>policy.maxFromTeam))errors.push('Maximum seven players from a real team');
 if(!ids.includes(selection.captainId)||!ids.includes(selection.viceCaptainId)||selection.captainId===selection.viceCaptainId)errors.push('Choose distinct selected captain and vice-captain');
 const bench=selection.benchIds||[];if(bench.length>4||new Set(bench).size!==bench.length||bench.some(id=>ids.includes(id)||!byId.has(id)))errors.push('Bench needs up to four distinct unused pool players');
 return {valid:errors.length===0,errors,credits,counts};
}
export function autoSwap(pool,selection,confirmedDNP,policy=FANTASY_POLICY){
 let next={...selection,playerIds:[...selection.playerIds],benchIds:[...(selection.benchIds||[])]},swaps=[];
 // A caller must supply authoritative participation, never infer DNP from zero points.
 for(const outgoing of selection.playerIds.filter(id=>confirmedDNP.includes(id))){
  for(const incoming of next.benchIds.filter(id=>!confirmedDNP.includes(id))){const candidate={...next,playerIds:next.playerIds.map(id=>id===outgoing?incoming:id),captainId:next.captainId===outgoing?incoming:next.captainId,viceCaptainId:next.viceCaptainId===outgoing?incoming:next.viceCaptainId,benchIds:next.benchIds.filter(id=>id!==incoming)};
   if(validateFantasy(pool,candidate,policy).valid){next=candidate;swaps.push({outgoing,incoming});break;}
  }
 }
 return {selection:next,swaps};
}
export function fantasyPoints(match,policy=FANTASY_POLICY){
 const v=calculateMatch(match),totals={},p=policy.points;const add=(id,n)=>{if(id)totals[id]=(totals[id]||0)+n};
 for(const s of v.innings.filter(i=>!i.tieBreakRound)){
  for(const b of Object.values(s.batters))add(b.id,b.runs*p.run+b.fours*p.four+b.sixes*p.six);
  for(const b of Object.values(s.bowlers))add(b.id,b.wickets*p.wicket);
  for(const e of s.deliveries){if(e.dismissal==='caught')add(e.fielderId,p.catch);if(e.dismissal==='stumped')add(e.fielderId,p.stumping);if(e.dismissal==='run_out'){add(e.fielderId,e.secondaryFielderId?p.assist:p.runOut);add(e.secondaryFielderId,p.assist);}}
 }
 return {points:totals,provisional:!v.result,matchResult:v.result};
}
export function entryPoints(selection,points){return selection.playerIds.reduce((sum,id)=>sum+(points[id]||0)*(id===selection.captainId?2:id===selection.viceCaptainId?1.5:1),0);}
export const RING_POLICY={version:'18-rings-v1',minContests:10,minCohort:100,upgradeWeeks:2,downgradeWeeks:3,demotionBuffer:5};
export function ringForPercentile(topPercent){return topPercent<=1?'Elite':topPercent<=5?'Diamond':topPercent<=15?'Platinum':topPercent<=35?'Gold':topPercent<=65?'Silver':'Bronze';}
export function ringSnapshot({percentile,contests,cohort,previous=null,week},policy=RING_POLICY){
 if(contests<policy.minContests||cohort<policy.minCohort)return {ring:null,status:'provisional',week,policyVersion:policy.version};
 const desired=ringForPercentile(percentile),levels=['Bronze','Silver','Gold','Platinum','Diamond','Elite'],current=previous?.ring||desired;
 if(previous?.week===week)return previous;
 const direction=levels.indexOf(desired)-levels.indexOf(current),upgrade=direction>0?(previous?.upgradeStreak||0)+1:0;
 const buffered=ringForPercentile(Math.max(0,percentile-policy.demotionBuffer)),downgrade=levels.indexOf(buffered)<levels.indexOf(current)?(previous?.downgradeStreak||0)+1:0;
 return {ring:upgrade>=policy.upgradeWeeks||downgrade>=policy.downgradeWeeks?desired:current,status:'eligible',upgradeStreak:upgrade,downgradeStreak:downgrade,week,policyVersion:policy.version};
}
