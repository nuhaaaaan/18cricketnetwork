import {calculateMatch} from './scoring-engine.js';
export const COMPETITION_FORMATS=['Round-robin','Double round-robin','Swiss','Knockout','IPL playoffs','Groups + Super stage'];
export function nrrContribution(match){
 const v=calculateMatch(match),a=v.first,b=v.second;
 if(!v.result||v.rules.multiInnings||v.resultDetail.kind==='no_result')return null;
 let runsA=a.runs,ballsA=['all_out','quota_reached'].includes(a.closureReason)?a.quota:a.balls,ballsB=['all_out','quota_reached'].includes(b.closureReason)?b.quota:b.balls;
 if(v.dls?.eventType==='dls_result'){runsA=v.dls.parScore;ballsA=b.balls;ballsB=b.balls;}
 else if(v.dls){runsA=v.dls.target-1;ballsA=b.quota;}
 if(!ballsA||!ballsB)return null;
 return {A:{runsFor:runsA,ballsFor:ballsA,runsAgainst:b.runs,ballsAgainst:ballsB},B:{runsFor:b.runs,ballsFor:ballsB,runsAgainst:runsA,ballsAgainst:ballsA}};
}
function fraction(s){return s.ballsFor&&s.ballsAgainst?{n:BigInt(s.runsFor)*BigInt(s.ballsAgainst)-BigInt(s.runsAgainst)*BigInt(s.ballsFor),d:BigInt(s.ballsFor)*BigInt(s.ballsAgainst)}:{n:0n,d:1n};}
function compareNRR(a,b){const x=fraction(a),y=fraction(b),delta=x.n*y.d-y.n*x.d;return delta>0n?-1:delta<0n?1:0;}
export function standings(matches,rules={}){
 const rateUnit=matches.filter(m=>m.proScoring).every(m=>calculateMatch(m).rules.size===5)?5:6;
 const rows=new Map(),seen=new Set(),points={win:2,tie:1,noResult:1,loss:0,draw:1,...rules.points};
 const get=name=>{if(!rows.has(name))rows.set(name,{name,played:0,won:0,lost:0,tied:0,noResult:0,drawn:0,points:0,runsFor:0,ballsFor:0,runsAgainst:0,ballsAgainst:0});return rows.get(name)};
 for(const m of matches){if(m.id&&seen.has(m.id))continue;if(m.id)seen.add(m.id);const a=get(m.teamA),b=get(m.teamB);if(!m.proScoring)continue;
  const v=calculateMatch(m);if(!v.result)continue;a.played++;b.played++;
  if(v.resultDetail.kind==='no_result'){a.noResult++;b.noResult++;a.points+=points.noResult;b.points+=points.noResult;}
  else if(v.resultDetail.kind==='draw'){a.drawn++;b.drawn++;a.points+=points.draw;b.points+=points.draw;}
  else if(!v.resultDetail.winner){a.tied++;b.tied++;a.points+=points.tie;b.points+=points.tie;}
  else {const winner=v.resultDetail.winner==='A'?a:b,loser=winner===a?b:a;winner.won++;loser.lost++;winner.points+=points.win;loser.points+=points.loss;}
  const contribution=nrrContribution(m);if(contribution)for(const [row,key]of [[a,'A'],[b,'B']])for(const field of ['runsFor','ballsFor','runsAgainst','ballsAgainst'])row[field]+=contribution[key][field];
 }
 const sorted=[...rows.values()].sort((a,b)=>b.points-a.points||b.won-a.won||compareNRR(a,b));let rank=0,previous=null;
 return sorted.map((row,index)=>{const equal=previous&&previous.points===row.points&&previous.won===row.won&&compareNRR(previous,row)===0;if(!equal)rank=index+1;previous=row;return {...row,rank,nrr:row.ballsFor&&row.ballsAgainst?rateUnit*(row.runsFor/row.ballsFor-row.runsAgainst/row.ballsAgainst):null,provisional:true};});
}
export function tournamentPlan(teams,format='Round-robin'){
 if(!Array.isArray(teams)||teams.length<2||teams.length>32||new Set(teams).size!==teams.length)throw Error('Select 2–32 distinct teams');
 if(!COMPETITION_FORMATS.includes(format))throw Error('Unsupported tournament structure');
 const fixtures=[];
 if(format==='Round-robin'||format==='Double round-robin'){let rotating=[...teams];if(rotating.length%2)rotating.push(null);for(let round=1;round<rotating.length;round++){for(let i=0;i<rotating.length/2;i++){const a=rotating[i],b=rotating.at(-i-1);if(a&&b)fixtures.push({round,teamA:round%2?a:b,teamB:round%2?b:a});}rotating=[rotating[0],rotating.at(-1),...rotating.slice(1,-1)];}if(format==='Double round-robin')fixtures.push(...fixtures.map(f=>({...f,round:f.round+rotating.length-1,teamA:f.teamB,teamB:f.teamA})));}
 else if(format==='IPL playoffs'){if(teams.length!==4)throw Error('IPL playoff seeding requires four ranked teams');fixtures.push({id:'Q1',teamA:teams[0],teamB:teams[1]},{id:'E',teamA:teams[2],teamB:teams[3]},{id:'Q2',teamA:'loser:Q1',teamB:'winner:E'},{id:'F',teamA:'winner:Q1',teamB:'winner:Q2'});}
 else if(format==='Knockout'){let size=2;while(size<teams.length)size*=2;let entrants=[...teams,...Array(size-teams.length).fill(null)],round=1;while(entrants.length>1){const next=[];for(let i=0;i<entrants.length/2;i++){const id=`R${round}M${i+1}`,a=entrants[i],b=entrants.at(-i-1);fixtures.push({id,round,teamA:a,teamB:b,bye:!a||!b});next.push(!a?b:!b?a:'winner:'+id);}entrants=next;round++;}}
 else if(format==='Swiss'){fixtures.push(...teams.slice(0,Math.floor(teams.length/2)).map((a,i)=>({round:1,teamA:a,teamB:teams[i+Math.ceil(teams.length/2)]})));if(teams.length%2)fixtures.push({round:1,teamA:teams[Math.floor(teams.length/2)],teamB:null,bye:true});}
 else {const groups=[teams.filter((_,i)=>i%2===0),teams.filter((_,i)=>i%2===1)];if(groups.some(g=>g.length<2))throw Error('Group stages require at least four teams');for(const [i,g]of groups.entries())fixtures.push(...tournamentPlan(g).fixtures.map(f=>({...f,group:i+1})));}
 return {format,teams,fixtures,provisional:true,notes:'Fixture planning only. Later Swiss rounds, group qualification and winner references require organizer adjudication before scheduling real matches.'};
}
