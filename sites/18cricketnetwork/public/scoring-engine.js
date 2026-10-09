import {matchRules} from './cricket-formats.js';
export const DISMISSALS=['bowled','caught','lbw','stumped','hit_wicket','run_out','obstructing_field','hit_ball_twice','timed_out','retired_out'];
const BW=new Set(['bowled','caught','lbw','stumped','hit_wicket']),NB=new Set(['run_out','obstructing_field','hit_ball_twice']),WD=new Set(['run_out','obstructing_field','hit_wicket','stumped']);
const whole=(v,min=0,max=9999)=>Number.isInteger(Number(v))&&Number(v)>=min&&Number(v)<=max;
const reject=m=>{throw Error(m)};
const overs=(b,size=6)=>Math.floor(b/size)+'.'+b%size;
function bowlerCap(s,r,id){
 if(s.tieBreakRound)return r.tieBreakBalls;
 if(r.multiInnings)return null;
 if(s.quota>=r.quota)return r.maxBowlerBalls;
 const units=Math.floor(s.quota/r.size),base=r.key==='Hundred'&&units<10?2:Math.floor(units/5),extra=r.key==='Hundred'&&units<10?0:units%5;
 const used=s.bowlers[id]?.balls||0,otherExtra=Object.values(s.bowlers).filter(b=>b.id!==id&&b.balls>base*r.size).length;
 let cap=(base+(extra&&(used>base*r.size||otherExtra<extra)?1:0))*r.size;
 if(used>cap&&s.bowlerId===id&&s.overBalls)cap=used+r.size-s.overBalls;
 return Math.min(r.maxBowlerBalls,Math.max(r.size,cap));
}
export function activeEvents(match){
 const events=(match.events||[]).map((e,i)=>({...e,id:e.id||'legacy:'+i})),voided=new Set(events.filter(e=>e.eventType==='undo').map(e=>e.targetEventId));
 return events.filter(e=>e.eventType!=='undo'&&!voided.has(e.id));
}
function innings(match,index,side,r,round=null){
 const bat=match.squads?.[side]||[],bowl=match.squads?.[side==='A'?'B':'A']||[];
 return {index,side,team:side==='A'?match.teamA:match.teamB,tieBreakRound:round,size:r.size,runs:0,wickets:0,balls:0,totalDeliveries:0,overs:'0.0',rate:0,quota:round?r.tieBreakBalls:r.quota,wicketLimit:round?Math.min(2,bat.length-1):(bat.length||11)-1,
  extras:{wide:0,noball:0,bye:0,legbye:0,penalty:0},
  batters:Object.fromEntries(bat.map(p=>[p.id,{id:p.id,name:p.name,runs:0,balls:0,fours:0,sixes:0,status:'did_not_bat',dismissal:null}])),
  bowlers:Object.fromEntries(bowl.map(p=>[p.id,{id:p.id,name:p.name,balls:0,runs:0,wickets:0,wides:0,noballs:0,maidens:0,overRuns:{}}])),
  strikerId:null,nonStrikerId:null,bowlerId:null,previousBowler:null,consecutiveSets:0,freeHit:false,closed:false,closureReason:null,overIndex:0,overBalls:0,overBowlers:[],partnershipRuns:0,partnershipBalls:0,partnerships:[],fallOfWickets:[],retired:[],deliveries:[],notes:[]};
}
function endPartnership(s,e){s.partnerships.push({batters:[s.strikerId,s.nonStrikerId].filter(Boolean),runs:s.partnershipRuns,balls:s.partnershipBalls,endEventId:e.id});s.partnershipRuns=0;s.partnershipBalls=0;}
function endOver(s,r){
 const ids=[...new Set(s.overBowlers)],last=ids.at(-1)||s.bowlerId;
 if(ids.length===1&&s.bowlers[last].overRuns[s.overIndex]===0)s.bowlers[last].maidens++;
 s.consecutiveSets=s.previousBowler===last?s.consecutiveSets+1:1;s.previousBowler=last;s.bowlerId=null;s.overIndex++;s.overBalls=0;s.overBowlers=[];
 if(r.key!=='Hundred'||s.overIndex%2===0)[s.strikerId,s.nonStrikerId]=[s.nonStrikerId,s.strikerId];
}
const done=s=>s.closed||s.wickets>=s.wicketLimit||s.quota!==null&&s.overIndex*s.size+s.overBalls>=s.quota;
const result=(winner,kind,margin,text)=>({winner,kind,margin,text});
function outcome(m,all,r,targetOverride,override){
 if(override)return override;const [a,b,c,d]=all;
 if(r.multiInnings){
  if(done(a)&&done(b)&&done(c)){
   const own=all.filter(s=>s.index<=3&&s.side===c.side).reduce((n,s)=>n+s.runs,0),other=all.filter(s=>s.index<=3&&s.side!==c.side).reduce((n,s)=>n+s.runs,0);
   if(own<other){const winner=c.side==='A'?'B':'A';return result(winner,'innings',other-own,`${winner==='A'?m.teamA:m.teamB} won by an innings and ${other-own} runs`);}
   const target=own-other+1;
   if(d.runs>=target)return result(d.side,'wickets',d.wicketLimit-d.wickets,`${d.team} won by ${d.wicketLimit-d.wickets} wickets`);
   if(done(d))return d.runs===target-1?result(null,'tie',0,'Match tied'):result(c.side,'runs',target-1-d.runs,`${c.team} won by ${target-1-d.runs} runs`);
  }return null;
 }
 if(!done(a))return null;const target=targetOverride||a.runs+1;if(b.runs<target&&!done(b))return null;
 let main=b.runs>=target?result('B','wickets',b.wicketLimit-b.wickets,`${m.teamB} won by ${b.wicketLimit-b.wickets} wickets`):b.runs===target-1?result(null,'tie',0,'Match tied'):result('A','runs',target-1-b.runs,`${m.teamA} won by ${target-1-b.runs} runs`);
 if(targetOverride)main.text+=' (revised target)';
 if(main.kind!=='tie'||all.length===2)return main;
 const x=all.at(-2),y=all.at(-1);if(!done(x)||y.runs<=x.runs&&!done(y))return null;
 if(y.runs===x.runs)return result(null,'tie',0,'Match tied after tie-break');
 const winner=y.runs>x.runs?y.side:x.side;return result(winner,'tie_break',null,`${winner==='A'?m.teamA:m.teamB} won the ${r.key==='Hundred'?'Super Five':'Super Over'} (round ${x.tieBreakRound})`);
}
export function calculateMatch(match){
 const r=matchRules(match),all=[innings(match,1,'A',r),innings(match,2,'B',r)];if(r.multiInnings)all.push(innings(match,3,'A',r),innings(match,4,'B',r));
 let targetOverride=null,status='live',override=null,dls=null,followOn=false;
 for(const e of activeEvents(match)){
  if(e.eventType==='follow_on'){followOn=true;all[2]=innings(match,3,'B',r);all[3]=innings(match,4,'A',r);continue;}
  if(e.eventType==='tie_break'){const index=all.length+1,round=(index-1)/2,side=round%2?'B':'A';all.push(innings(match,index,side,r,round),innings(match,index+1,side==='A'?'B':'A',r,round));continue;}
  const s=all.find(i=>i.index===(e.innings||1));if(!s)continue;
  if(e.eventType==='select'){s.strikerId=e.strikerId;s.nonStrikerId=e.nonStrikerId;s.bowlerId=e.bowlerId;for(const id of [s.strikerId,s.nonStrikerId])if(s.batters[id]&&['did_not_bat','retired_hurt'].includes(s.batters[id].status))s.batters[id].status='not_out';continue;}
  if(e.eventType==='close'){endPartnership(s,e);s.closed=true;s.closureReason=e.reason||'umpire_closed';if(e.note)s.notes.push(e.note);continue;}
  if(e.eventType==='status'){s.notes.push(e.note);status=e.status;override=e.status==='abandoned'?result(null,'no_result',null,'Match abandoned / no result'):e.status==='drawn'?result(null,'draw',null,'Match drawn'):null;continue;}
  if(e.eventType==='dls_result'){dls=e;status='abandoned';const diff=s.runs-e.parScore;override=diff===0?result(null,'tie',0,'Match tied (DLS par score)'):result(diff>0?'B':'A','dls',Math.abs(diff),`${diff>0?match.teamB:match.teamA} won by ${Math.abs(diff)} runs (DLS)`);continue;}
  if(e.eventType==='target'){targetOverride=e.target;all[1].quota=e.maxBalls;dls=e.method==='DLS'?e:null;s.notes.push(e.note);continue;}
  if(e.eventType==='quota'){s.quota=e.maxBalls;s.notes.push(e.note);continue;}
  if(e.eventType==='retire'){const b=s.batters[e.playerId];if(!b)continue;endPartnership(s,e);b.status=e.out?'out':'retired_hurt';b.dismissal=e.out?(e.dismissal||'retired_out'):null;if(e.out){s.wickets++;s.fallOfWickets.push({runs:s.runs,wickets:s.wickets,overs:overs(s.balls,r.size),playerId:e.playerId,eventId:e.id});}s.retired.push({playerId:e.playerId,out:e.out});if(s.strikerId===e.playerId)s.strikerId=null;if(s.nonStrikerId===e.playerId)s.nonStrikerId=null;continue;}
  if(e.eventType==='penalty'){const recipient=all.find(i=>i.index===e.beneficiary);if(recipient){recipient.runs+=e.runs;recipient.extras.penalty+=e.runs;recipient.notes.push(e.note);}continue;}
  if(e.eventType==='strike'){[s.strikerId,s.nonStrikerId]=[s.nonStrikerId,s.strikerId];s.notes.push(e.note);continue;}
  if(e.eventType==='over'){endOver(s,r);s.notes.push(e.note);continue;}
  if(e.eventType==='dead'){s.notes.push(e.note);if(e.legal){s.balls++;s.overBalls++;const bow=s.bowlers[e.bowlerId];if(bow){bow.balls++;bow.overRuns[s.overIndex]??=0;s.overBowlers.push(e.bowlerId);}if(s.overBalls===r.size)endOver(s,r);}continue;}
  if(e.eventType!=='delivery')continue;
  const bat=s.batters[e.strikerId],bow=s.bowlers[e.bowlerId];if(!bat||!bow)continue;
  s.runs+=e.runs;s.totalDeliveries++;s.extras.wide+=e.wideRuns;s.extras.noball+=e.noBallRuns;s.extras.bye+=e.byeRuns;s.extras.legbye+=e.legByeRuns;bat.runs+=e.batRuns;
  if(e.faced)bat.balls++;if(e.boundary===4&&e.batRuns>=4)bat.fours++;if(e.boundary===6&&e.batRuns>=6)bat.sixes++;
  const charge=e.batRuns+e.wideRuns+e.noBallRuns;bow.runs+=charge;bow.wides+=e.wideRuns;bow.noballs+=e.noBallRuns;bow.overRuns[s.overIndex]=(bow.overRuns[s.overIndex]||0)+charge;s.overBowlers.push(e.bowlerId);
  if(e.legal){s.balls++;s.overBalls++;bow.balls++;s.partnershipBalls++;}s.partnershipRuns+=e.runs;
  if(e.dismissal){const out=s.batters[e.outId];endPartnership(s,e);out.status='out';out.dismissal=e.dismissal;out.fielderId=e.fielderId||null;out.secondaryFielderId=e.secondaryFielderId||null;out.bowlerId=BW.has(e.dismissal)?e.bowlerId:null;s.wickets++;if(BW.has(e.dismissal))bow.wickets++;s.fallOfWickets.push({runs:s.runs,wickets:s.wickets,overs:overs(s.balls,r.size),playerId:e.outId,eventId:e.id});if(e.outId===s.strikerId)s.strikerId=null;if(e.outId===s.nonStrikerId)s.nonStrikerId=null;}
  if(e.changeEnds)[s.strikerId,s.nonStrikerId]=[s.nonStrikerId,s.strikerId];if(e.legal&&s.overBalls===r.size)endOver(s,r);
  s.freeHit=r.freeHit&&(e.noBallRuns>0||s.freeHit&&!e.legal);s.deliveries.push(e);
 }
 for(const s of all){s.overs=s.overIndex+'.'+s.overBalls;s.rate=s.balls?+(s.runs*r.size/s.balls).toFixed(2):0;s.isClosed=done(s);if(!s.closureReason&&s.isClosed)s.closureReason=s.wickets>=s.wicketLimit?'all_out':'quota_reached';for(const b of Object.values(s.batters))b.strikeRate=b.balls?+(b.runs*100/b.balls).toFixed(2):0;for(const b of Object.values(s.bowlers)){b.overs=overs(b.balls,r.size);b.economy=b.balls?+(b.runs*r.size/b.balls).toFixed(2):0;}}
 const first=all[0],second=all[1],firstDone=done(first),detail=outcome(match,all,r,targetOverride,override);let s=all.find(i=>!done(i))||all.at(-1);
 if(detail)s=r.multiInnings?[...all].reverse().find(i=>i.deliveries.length||i.closed)||first:all.at(-1);
 let target=null;if(!r.multiInnings&&s.index===2&&firstDone)target=targetOverride||first.runs+1;
 if(s.tieBreakRound&&s.index%2===0)target=all[s.index-2].runs+1;
 if(r.multiInnings&&s.index===4)target=all.filter(i=>i.index<4&&i.side!==s.side).reduce((n,i)=>n+i.runs,0)-all.filter(i=>i.index<4&&i.side===s.side).reduce((n,i)=>n+i.runs,0)+1;
 const remaining=s.quota===null?null:Math.max(0,s.quota-s.overIndex*r.size-s.overBalls),requiredRate=target&&!detail&&remaining>0?+((target-s.runs)*r.size/remaining).toFixed(2):0;
 return {first,second,innings:all,firstDone,target,targetOverride,maxBalls2:second.quota,current:s.index,state:s,result:detail?.text||null,resultDetail:detail,status,rules:r,dls,followOn,ballsRemaining:remaining,requiredRate,
  situation:detail?.text||(target?`Target ${target} · Need ${Math.max(0,target-s.runs)}${remaining===null?'':` from ${remaining} balls`}`:`${s.team} batting · innings ${s.index}${r.multiInnings?' of 4':''}`)};
}
export function appendCommand(match,input){
 const v=calculateMatch(match),s=v.state,r=v.rules,command=input.command||'delivery',e={id:globalThis.crypto.randomUUID(),eventType:command,innings:v.current,at:new Date().toISOString(),rulesVersion:r.rulesVersion,...(input.commandId?{commandId:input.commandId}:{})};
 const note=()=>{if(!input.note?.trim())reject('Record the umpire decision / reason');e.note=String(input.note).slice(0,500);};
 if(command==='undo'){const last=activeEvents(match).at(-1);if(!last)reject('No event to undo');e.targetEventId=last.id;e.note=String(input.note||'Scorer correction: undo last active event').slice(0,500);}
 else if(command==='penalty'){if(!whole(input.beneficiary,1,v.innings.length)||Number(input.runs)!==5)reject('Award five penalty runs to a recorded innings');note();e.beneficiary=Number(input.beneficiary);e.runs=5;}
 else if(command==='tie_break'){if(r.multiInnings||v.resultDetail?.kind!=='tie'||v.status!=='live')reject('Tie-break requires a completed tied limited-overs match');note();}
 else if(command==='status'){note();if(!['live','paused','abandoned','drawn'].includes(input.status)||input.status==='drawn'&&!r.multiInnings)reject('Invalid match status');if(v.result&&v.status==='live')reject('Match is complete. Undo the result event to correct it.');e.status=input.status;}
 else{
  if(v.result)reject('Match is complete. Undo a correction before scoring.');if(v.status!=='live')reject('Resume this match before scoring.');
  if(command==='select'){
   if(!input.strikerId||!input.nonStrikerId||input.strikerId===input.nonStrikerId||!s.batters[input.strikerId]||!s.batters[input.nonStrikerId])reject('Choose two different batters from the batting squad');
   for(const p of [input.strikerId,input.nonStrikerId])if(s.batters[p].status==='out')reject('A dismissed batter cannot return');if(!s.bowlers[input.bowlerId])reject('Choose a bowler from the fielding squad');
   if(s.bowlerId&&s.bowlerId!==input.bowlerId&&s.overBalls!==0){if(input.approvedReplacement!==true)reject('A bowler change mid-over requires an umpire-approved replacement');note();}
   if(!s.bowlerId&&s.previousBowler===input.bowlerId&&(r.key!=='Hundred'||s.consecutiveSets>=2))reject('A bowler cannot bowl consecutive overs / more than two consecutive five-ball sets');
   const cap=bowlerCap(s,r,input.bowlerId||s.bowlerId);if(cap!==null&&s.bowlers[input.bowlerId].balls>=cap)reject('This bowler has reached the innings limit');
   if(s.tieBreakRound&&r.key!=='Hundred'){const earlier=v.innings.filter(i=>i.tieBreakRound&&i.index<s.index);for(const p of [input.strikerId,input.nonStrikerId])if(earlier.some(i=>i.batters[p]?.status==='out'))reject('A batter dismissed in an earlier tie-break cannot return');if(earlier.some(i=>i.tieBreakRound===s.tieBreakRound-1&&i.bowlers[input.bowlerId]?.balls>0))reject('The previous tie-break bowler cannot bowl this round');}
   if(s.strikerId&&input.strikerId!==s.strikerId||s.nonStrikerId&&input.nonStrikerId!==s.nonStrikerId)reject('Replace only the vacant batter position');Object.assign(e,{strikerId:input.strikerId,nonStrikerId:input.nonStrikerId,bowlerId:input.bowlerId});
  }else if(command==='follow_on'){if(!r.multiInnings||v.current!==3||s.balls||s.strikerId||v.followOn||v.first.runs-v.second.runs<r.followOnLead)reject('Follow-on requires completed first innings and the configured lead');note();}
  else if(command==='close'){e.reason=input.reason||'umpire_closed';if(['declared','forfeited'].includes(e.reason)&&!r.multiInnings)reject('Declarations / forfeited innings require multi-innings cricket');e.note=String(input.note||'Innings closed by scorer').slice(0,500);}
  else if(command==='target'){if(r.multiInnings||s.tieBreakRound||v.current!==2||!whole(input.target,1)||!whole(input.maxBalls,Math.max(1,s.balls),v.second.quota||300))reject('Enter the official target and reduced total legal balls for the chase');note();e.target=Number(input.target);e.maxBalls=Number(input.maxBalls);e.method=input.method==='DLS'?'DLS':'official';if(e.method==='DLS'&&!String(input.calculationReference||'').trim())reject('DLS requires the official calculation reference');e.calculationReference=String(input.calculationReference||'').slice(0,200);}
  else if(command==='quota'){if(r.multiInnings||s.tieBreakRound||!whole(input.maxBalls,Math.max(1,s.balls),s.quota))reject('Enter a reduced innings quota, not below balls already bowled');note();e.maxBalls=Number(input.maxBalls);}
  else if(command==='dls_result'){if(r.multiInnings||s.tieBreakRound||v.current!==2||s.balls<r.minResultBalls||!whole(input.parScore,0)||!String(input.calculationReference||'').trim())reject('DLS result requires minimum play and an official par-score calculation reference');note();e.parScore=Number(input.parScore);e.calculationReference=String(input.calculationReference).slice(0,200);}
  else if(command==='over'){if(!s.overBalls||!s.bowlerId)reject('There is no active partial over to close');note();}
  else if(command==='strike'){if(!s.strikerId||!s.nonStrikerId)reject('Select both batters before switching ends');note();}
  else if(command==='timed_out'){if(!s.batters[input.playerId]||s.batters[input.playerId].status!=='did_not_bat'||s.strikerId&&s.nonStrikerId)reject('Choose an incoming batter for the umpire timed-out decision');note();e.eventType='retire';e.playerId=input.playerId;e.out=true;e.dismissal='timed_out';}
  else if(command==='retire'){if(![s.strikerId,s.nonStrikerId].includes(input.playerId))reject('Select a current batter');note();e.playerId=input.playerId;e.out=input.out===true;}
  else if(command==='dead'){note();e.legal=input.countsInOver===true;if(e.legal&&!s.bowlerId)reject('Select a bowler before recording a counting dead ball');e.bowlerId=s.bowlerId;}
  else if(command==='delivery'){
   if(!s.strikerId||!s.nonStrikerId||!s.bowlerId)reject('Select striker, non-striker and bowler first');const cap=bowlerCap(s,r,input.bowlerId||s.bowlerId);if(cap!==null&&s.bowlers[s.bowlerId].balls>=cap)reject('This bowler has reached the innings limit');
   const type=input.runType||'bat',nb=input.noBall===true,boundary=Number(input.boundary||0),runs=Number(input.runs||0);if(!['bat','bye','legbye','wide'].includes(type)||nb&&type==='wide')reject('A no-ball overrides a wide. Select no-ball and the correct run type.');if(![0,4,6].includes(boundary)||boundary===6&&type!=='bat')reject('Six is a bat boundary only');if(!whole(runs)||boundary&&(input.overthrow===true?boundary!==4||runs<4:runs!==boundary))reject('Enter valid runs excluding the one-run penalty');
   const crossed=Number(input.completedRuns??(boundary?0:runs)),short=Number(input.shortRuns||0);if(!whole(crossed)||!whole(short,0,Math.min(runs,crossed))||boundary&&short&&input.overthrow!==true)reject('Invalid completed / short runs');if(type==='legbye'&&input.legByeAllowed!==true)reject('Confirm the umpire awarded leg byes');
   if(input.overthrow===true&&typeof input.changeEnds!=='boolean')reject('Confirm batting ends for an overthrow boundary');const dismissal=input.dismissal||null,outId=input.outId||s.strikerId;
   if(dismissal){if(!DISMISSALS.includes(dismissal)||!['run_out','obstructing_field'].includes(dismissal)&&outId!==s.strikerId||![s.strikerId,s.nonStrikerId].includes(outId))reject('Invalid dismissal or batter');if(['timed_out','retired_out'].includes(dismissal))reject('Record this dismissal using retirement / non-delivery controls');if((nb||s.freeHit)&&!NB.has(dismissal))reject('This dismissal is not permitted on a no-ball / free hit');if(type==='wide'&&!nb&&!s.freeHit&&!WD.has(dismissal))reject('This dismissal is not permitted on a wide');if(['caught','bowled','lbw','hit_wicket','stumped','hit_ball_twice'].includes(dismissal)&&runs>0)reject('Running / bat runs are disallowed for this dismissal');if(['run_out','obstructing_field'].includes(dismissal)&&typeof input.changeEnds!=='boolean')reject('For a run-out or obstruction, confirm ends according to the umpire');}
   for(const p of [input.fielderId,input.secondaryFielderId])if(p&&!s.bowlers[p])reject('Choose a fielder from the fielding squad');if(input.secondaryFielderId&&input.secondaryFielderId===input.fielderId)reject('Primary and secondary fielders must differ');
   let allowed=runs-short;const penalty=nb?r.noBallPenalty:type==='wide'?r.widePenalty:0;
   if(v.target&&!boundary&&!dismissal)allowed=Math.min(allowed,Math.max(0,v.target-s.runs-penalty));if(dismissal&&v.target&&s.runs+penalty>=v.target)reject('The winning extra ends the match before this dismissal');
   Object.assign(e,{kind:dismissal?'wicket':type==='bat'?'run':type,runType:type,strikerId:s.strikerId,nonStrikerId:s.nonStrikerId,bowlerId:s.bowlerId,batRuns:type==='bat'?allowed:0,wideRuns:type==='wide'?r.widePenalty+allowed:0,noBallRuns:nb?r.noBallPenalty:0,byeRuns:type==='bye'?allowed:0,legByeRuns:type==='legbye'?allowed:0,legal:type!=='wide'&&!nb,faced:type!=='wide',boundary:input.overthrow===true?0:boundary,overthrowBoundary:input.overthrow===true?boundary:0,completedRuns:crossed,shortRuns:short,dismissal,outId:dismissal?outId:null,fielderId:input.fielderId||null,secondaryFielderId:input.secondaryFielderId||null,changeEnds:['caught','bowled','lbw','hit_wicket','stumped','hit_ball_twice'].includes(dismissal)?false:typeof input.changeEnds==='boolean'?input.changeEnds:crossed%2===1});e.runs=e.batRuns+e.wideRuns+e.noBallRuns+e.byeRuns+e.legByeRuns;
  }else reject('Unknown scoring command');
 }
 return {...match,events:[...(match.events||[]),e]};
}
export function playerPerformance(match,playerId){
 const v=calculateMatch(match),battingInnings=v.innings.filter(s=>!s.tieBreakRound&&s.batters[playerId]).map(s=>({...s.batters[playerId],innings:s.index})),bowlingInnings=v.innings.filter(s=>!s.tieBreakRound&&s.bowlers[playerId]).map(s=>({...s.bowlers[playerId],innings:s.index}));if(!battingInnings.length&&!bowlingInnings.length)return null;
 const sum=(rows,keys)=>Object.fromEntries(keys.map(k=>[k,rows.reduce((n,b)=>n+b[k],0)]));const batting=battingInnings.length?{...battingInnings[0],...sum(battingInnings,['runs','balls','fours','sixes'])}:null,bowling=bowlingInnings.length?{...bowlingInnings[0],...sum(bowlingInnings,['balls','runs','wickets','maidens','wides','noballs'])}:null;
 if(batting)batting.strikeRate=batting.balls?+(batting.runs*100/batting.balls).toFixed(2):0;if(bowling){bowling.overs=overs(bowling.balls,v.rules.size);bowling.economy=bowling.balls?+(bowling.runs*v.rules.size/bowling.balls).toFixed(2):0;}
 return {playerId,name:batting?.name||bowling?.name,match:match.name,date:match.date||null,opposition:match.squads.A.some(p=>p.id===playerId)?match.teamB:match.teamA,batting,bowling,battingInnings,bowlingInnings,result:v.result||'Match in progress',source:'Recorded match scorecard; tie-break statistics excluded'};
}
