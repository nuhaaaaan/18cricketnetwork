import test from 'node:test';
import assert from 'node:assert/strict';
import {aggregateRankings} from '../server/rankings.js';
// Synthetic scorecards exist only in isolated tests; they are never seeded or published.
function match(id){return {id,version:1,proScoring:true,overs:10,teamA:'Team A',teamB:'Team B',squads:{A:[{id:'a',name:'A'},{id:'a2',name:'A2'}],B:[{id:'b',name:'B'},{id:'b2',name:'B2'}]},rankingMetadata:{recordVersion:1,format:'T10',season:'2026',city:'Boston',teamIds:{A:'ta',B:'tb'},captains:{A:'a',B:'b'},keepers:{A:'a2',B:'b2'}},events:[{eventType:'select',innings:1,strikerId:'a',nonStrikerId:'a2',bowlerId:'b'},...Array.from({length:20},()=>({eventType:'delivery',innings:1,strikerId:'a',bowlerId:'b',runs:2,batRuns:2,wideRuns:0,noBallRuns:0,byeRuns:0,legByeRuns:0,legal:true,faced:true,boundary:0})),{eventType:'close',innings:1},{eventType:'close',innings:2}]}}
test('empty, live, unreviewed, changed and duplicate scorecards do not manufacture rankings',()=>{
 assert.equal(aggregateRankings([]).eligibleMatches,0);
 const m=match('1');assert.equal(aggregateRankings([{...m,rankingMetadata:null}]).eligibleMatches,0);
 assert.equal(aggregateRankings([{...m,version:2}]).eligibleMatches,0);
 assert.equal(aggregateRankings([{...m,events:[]}]).eligibleMatches,0);
 assert.equal(aggregateRankings([m,m]).eligibleMatches,1);
 assert.deepEqual(aggregateRankings([m]).batting,[]);
});
test('actual ledger totals, explicit captaincy and stable team identities determine rankings',()=>{
 const matches=['1','2','3'].map(match),r=aggregateRankings(matches,{format:'T10',season:'2026'});
 assert.equal(r.batting[0].runs,120);assert.equal(r.batting[0].balls,60);assert.equal(r.batting[0].battingAverage,null);
 assert.equal(r.bowling[0].bowlingBalls,60);assert.equal(r.captaincy.find(p=>p.id==='a').score,100);
 assert.equal(r.teams.find(p=>p.id==='ta').wins,3);
 assert.deepEqual(r.fielding,[]);assert.deepEqual(r.wicketkeeping,[]);
 assert.equal(aggregateRankings(matches,{city:'Bangalore'}).eligibleMatches,0);
 assert.equal(aggregateRankings(matches,{format:'T20'}).eligibleMatches,0);
 assert.deepEqual(aggregateRankings(matches.map(m=>({...m,rankingMetadata:{...m.rankingMetadata,captains:{}}}))).captaincy,[]);
});
