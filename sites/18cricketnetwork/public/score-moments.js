import {activeEvents,calculateMatch} from './scoring-engine.js';
const credited=new Set(['bowled','caught','lbw','stumped','hit_wicket']);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function appendedEvent(before,after){
  const a=before?.events,b=after?.events;
  return before?.id===after?.id&&Array.isArray(a)&&Array.isArray(b)&&b.length===a.length+1&&a.every((e,i)=>equal(e,b[i]))?b.at(-1):null;
}
// Conservative innings-only milestones. No cross-match hat-trick inference.
export function deliveryMoments(before,after){
  const ball=appendedEvent(before,after);if(!ball||!after.proScoring)return [];
  if(ball.eventType==='close')return [{kind:'innings',title:'INNINGS CLOSED',detail:'Recorded by the scorer'}];
  if(ball.eventType==='target')return [{kind:'target',title:'REVISED TARGET',detail:`${ball.target} · umpire-entered target`}];
  if(ball.eventType==='status')return [{kind:'status',title:ball.status==='paused'?'PLAY PAUSED':ball.status==='abandoned'?'MATCH ABANDONED':'PLAY RESUMED',detail:ball.note||'Recorded umpire decision'}];
  if(ball.eventType!=='delivery')return [];
  const old=calculateMatch(before),next=calculateMatch(after),index=ball.innings||1;
  const a=old.innings.find(s=>s.index===index),s=next.innings.find(s=>s.index===index);if(!a||!s)return [];
  const name=s.batters[ball.strikerId]?.name||'Batter',bow=s.bowlers[ball.bowlerId];
  const moments=[],add=(kind,title,detail)=>moments.push({kind,title,detail});
  if(ball.boundary===4||ball.boundary===6)add(ball.boundary===6?'six':'four',ball.boundary===6?'SIX':'FOUR',ball.runType==='bat'?name:ball.runType==='bye'?'Four byes':ball.runType==='legbye'?'Four leg byes':'Wide boundary');
  if(ball.dismissal){
    const out=s.batters[ball.outId];add('wicket','WICKET',`${out?.name||'Batter'} · ${ball.dismissal.replaceAll('_',' ')}`);
    if(out?.runs===0)add('duck','DUCK',`${out.name} · 0 from ${out.balls} ball${out.balls===1?'':'s'}`);
    const own=activeEvents(after).filter(e=>e.eventType==='delivery'&&(e.innings||1)===index&&e.bowlerId===ball.bowlerId);
    const last=own.slice(-3);
    if(last.length===3&&last.every(e=>e.legal&&credited.has(e.dismissal))&&!(own.length>3&&own.at(-4).legal&&credited.has(own.at(-4).dismissal)))add('hattrick','HAT-TRICK',`${bow?.name||'Bowler'} · three consecutive credited wickets`);
  }
  const batter=s.batters[ball.strikerId],previous=a.batters[ball.strikerId];
  if(batter&&previous)for(const threshold of [50,100,150,200,250,300])if(previous.runs<threshold&&batter.runs>=threshold)add('milestone',threshold===100?'CENTURY':`${threshold} RUNS`,`${batter.name} · ${batter.runs} (${batter.balls})`);
  if(bow&&a.bowlers[ball.bowlerId]?.wickets<5&&bow.wickets>=5)add('fivefor','FIVE-WICKET HAUL',bow.name);
  if(!ball.dismissal&&s.partnershipRuns>=50&&Math.floor(a.partnershipRuns/50)<Math.floor(s.partnershipRuns/50))add('partnership',`${Math.floor(s.partnershipRuns/50)*50} PARTNERSHIP`,`${s.partnershipRuns} runs · ${s.partnershipBalls} legal balls`);
  if(ball.noBallRuns)add('freehit',s.freeHit?'FREE HIT':'NO BALL','Umpire-recorded no-ball');
  if(ball.legal&&s.overBalls===0&&!ball.dismissal&&bow?.overRuns[s.overIndex-1]===0)add('maiden','MAIDEN OVER',bow.name);
  if(!old.result&&next.result&&next.status!=='abandoned')add('result',next.result==='Match tied'?'MATCH TIED':'MATCH COMPLETE',next.result);
  return moments;
}

export function createMomentTracker(){let previous=null,highWater=0;return {
  corrected:false,
  observe(match){const same=previous?.id===match.id;this.corrected=!!same&&!equal(previous.events,match.events)&&(!appendedEvent(previous,match)||match.events?.at(-1)?.eventType==='undo');const moments=same&&(match.events||[]).length>highWater?deliveryMoments(previous,match):[];highWater=same?Math.max(highWater,(match.events||[]).length):(match.events||[]).length;previous=JSON.parse(JSON.stringify(match));return moments;},
  reset(){previous=null;highWater=0;this.corrected=false;}
};}
