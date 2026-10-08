// Runtime-independent rules: shared by the website, Worker and future mobile clients.
export const DRS_VERSION='18-assisted-2026-10-08';
export const RULE_SOURCE='https://images.icc-cricket.com/image/upload/prd/bsxcho7ufe2pjban0wjp.pdf';
export const REVIEW_TYPES={lbw:'LBW',run_out:'Run-out',stumped:'Stumping',caught:'Catch / edge / boundary catch',bowled:'Bowled',hit_wicket:'Hit wicket',boundary:'Boundary 4 / 6',no_ball:'No-ball',wide:'Wide',other:'Dead ball / obstruction / other umpire decision'};
export const FACTS={
 noBall:['No-ball delivery','no','yes'],freeHit:['Free-hit delivery','no','yes'],clearEvidence:['Evidence is clear at the decision instant','no','yes'],
 batFirst:['Bat contacted before body (simultaneous counts as bat first)','no','yes'],pitch:['First pitching point','inline','off','leg','full_toss'],impact:['First body impact','inline','off','leg','umpires_call'],shot:['Genuine attempt to play with bat','no','yes'],trajectory:['Approved tracking outcome','hitting','missing','umpires_call'],
 liveBall:['Ball was live at wicket break','no','yes'],wicketBroken:['Wicket fairly broken','no','yes'],outOfGround:['Batter out of ground at break (consider regained ground)','no','yes'],fielderContact:['Ball contacted a fielder before wicket break','no','yes'],injuryEscape:['Left previously grounded position to avoid injury','no','yes'],keeperOnly:['Keeper broke wicket without another fielder','no','yes'],attemptingRun:['Batter was attempting a run','no','yes'],striker:['Batter is the striker','no','yes'],specialCase:['Runner / early non-striker departure / unusual circumstances','no','yes'],
 batContact:['Bat / glove holding bat contact established','no','yes'],groundContact:['Ball touched ground before catch completion','no','yes'],completeControl:['Fielder controlled ball and own movement','no','yes'],fairBoundaryCatch:['Catch meets current boundary rules (all contacts checked)','no','yes'],deliveredBall:['Delivered ball broke wicket without another player contact','no','yes'],hitOwnWicket:['Batter broke own wicket during qualifying action','no','yes'],qualifyingAction:['Hit wicket timing/action confirmed by umpire','no','yes'],boundaryTouched:['Ball / ball-holding fielder reached boundary','no','yes'],bounced:['Ball bounced after bat before boundary','no','yes'],footFault:['Front/back-foot no-ball established at landing','no','yes'],otherNoBall:['Other no-ball infringement established','no','yes'],wideConfirmed:['Wide under competition movement/reach rules','no','yes']
};
export const CHECKLISTS={lbw:['noBall','freeHit','clearEvidence','batFirst','pitch','impact','shot','trajectory'],run_out:['clearEvidence','liveBall','wicketBroken','outOfGround','fielderContact','injuryEscape','keeperOnly','attemptingRun','striker','noBall','specialCase'],stumped:['clearEvidence','liveBall','wicketBroken','outOfGround','keeperOnly','attemptingRun','injuryEscape','noBall','freeHit','specialCase'],caught:['clearEvidence','noBall','freeHit','batContact','groundContact','completeControl','fairBoundaryCatch'],bowled:['clearEvidence','noBall','freeHit','wicketBroken','deliveredBall'],hit_wicket:['clearEvidence','noBall','freeHit','hitOwnWicket','qualifyingAction'],boundary:['clearEvidence','boundaryTouched','batContact','bounced'],no_ball:['clearEvidence','footFault','otherNoBall'],wide:['clearEvidence','noBall','wideConfirmed'],other:['clearEvidence']};
export function validateObservations(type,raw){
 if(!REVIEW_TYPES[type]||!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid review observations');
 const out={};for(const key of CHECKLISTS[type]){const value=raw[key]??'unknown';if(!['unknown',...FACTS[key].slice(1)].includes(value))throw Error('Invalid observation: '+key);out[key]=value}return out;
}
export function evaluateReview(type,raw,original='not_out'){
 const o=validateObservations(type,raw),result=(recommendation,reason)=>({recommendation,reason,rulesVersion:DRS_VERSION,source:RULE_SOURCE,automatedDetection:false});
 const unknown=reason=>result('inconclusive',reason),not=reason=>result('not_out',reason),yes=k=>o[k]==='yes',no=k=>o[k]==='no';
 if(type==='other')return unknown('On-field/third umpire must assess the applicable law and competition conditions.');
 if(o.clearEvidence!=='yes')return unknown('Unclear, missing or unsynchronised evidence: retain the on-field decision.');
 if(['lbw','stumped','caught','bowled','hit_wicket'].includes(type)){
  if(yes('noBall')||yes('freeHit'))return not('This dismissal is unavailable on a no-ball or free hit.');
  if(!no('noBall')||!no('freeHit'))return unknown('Confirm delivery legality and free-hit status first.');
 }
 if(type==='lbw'){
  if(yes('batFirst'))return not('Bat first, including simultaneous bat/body contact, excludes LBW.');
  if(o.pitch==='leg')return not('Ball pitched outside leg stump.');
  if(o.impact==='leg'||o.impact==='off'&&yes('shot'))return not('Impact fails the LBW requirements.');
  if(!no('batFirst')||!['inline','off','full_toss'].includes(o.pitch)||!['inline','off','umpires_call'].includes(o.impact)||o.impact==='off'&&!no('shot'))return unknown('Establish pitching, first contact, impact and shot attempt.');
  // No connected approved tracking provider: manual trajectory values cannot authorise an OUT recommendation.
  return unknown('Approved ball tracking is not connected. A selected trajectory is not measured evidence; LBW prediction/umpire’s call cannot be verified.');
 }
 if(type==='run_out'||type==='stumped'){
  if(yes('specialCase'))return unknown('Runner or non-striker early departure requires the umpire’s specific-law assessment.');
  if(no('liveBall')||no('wicketBroken')||no('outOfGround')||yes('injuryEscape'))return not('Live-ball, fair wicket break, ground or injury-exception requirement failed.');
  if(['liveBall','wicketBroken','outOfGround'].some(k=>!yes(k))||!no('injuryEscape')||!no('specialCase'))return unknown('Establish the exact wicket-break instant, grounding and exceptions.');
  if(type==='stumped'){
   if(no('keeperOnly')||yes('attemptingRun'))return not('Not a stumping: assess run-out instead.');
   if(!yes('keeperOnly')||!no('attemptingRun'))return unknown('Confirm keeper-only contact and no run attempted.');
  }else{
   if(no('fielderContact'))return not('Delivered ball did not contact a fielder before breaking the wicket.');
   if(!yes('fielderContact'))return unknown('Confirm fielder contact.');
   if(!['yes','no'].includes(o.noBall)||!['yes','no'].includes(o.keeperOnly)||!['yes','no'].includes(o.attemptingRun)||!['yes','no'].includes(o.striker))return unknown('Check the keeper-only/no-ball/striker/run-attempt exceptions.');
   if(yes('striker')&&yes('keeperOnly')&&no('attemptingRun'))return yes('noBall')?not('No-ball, striker not attempting a run, keeper alone: no run-out.'):unknown('Assess as stumping, which takes priority in these circumstances.');
  }
  return result('out','Entered evidence satisfies the dismissal checklist; umpire must confirm.');
 }
 if(type==='caught'){
  if(no('batContact')||yes('groundContact')||no('completeControl')||no('fairBoundaryCatch'))return not('Bat contact, clean catch, control or lawful boundary catch requirement failed.');
  if(!yes('batContact')||!no('groundContact')||!yes('completeControl')||!yes('fairBoundaryCatch'))return unknown('Establish contact, clean catch, control and all boundary contacts; no automated edge detector is connected.');
  return result('out','Human-entered clean-catch evidence satisfies the checklist; umpire must confirm.');
 }
 if(type==='bowled'){if(no('wicketBroken')||no('deliveredBall'))return not('Bowled requirements failed.');return yes('wicketBroken')&&yes('deliveredBall')?result('out','Delivered ball fairly broke the wicket.'):unknown('Confirm delivery contact and wicket break.');}
 if(type==='hit_wicket'){if(no('hitOwnWicket')||no('qualifyingAction'))return not('Hit-wicket requirements failed.');return yes('hitOwnWicket')&&yes('qualifyingAction')?result('out','Umpire-entered qualifying action broke own wicket.'):unknown('Confirm action, timing and wicket break.');}
 if(type==='boundary'){if(no('boundaryTouched'))return result('no_boundary','No boundary contact established.');if(!yes('boundaryTouched')||!['yes','no'].includes(o.batContact)||!['yes','no'].includes(o.bounced))return unknown('Establish boundary contact, bat contact and whether ball bounced.');return result(yes('batContact')&&no('bounced')?'six':'four','Check overthrows/penalties separately; this classifies ordinary ball-to-boundary evidence.');}
 if(type==='no_ball'){if(yes('footFault')||yes('otherNoBall'))return result('no_ball','Umpire-entered infringement established.');return no('footFault')&&no('otherNoBall')?result('fair_delivery','No entered no-ball infringement.'):unknown('Check foot landing and other infringements.');}
 if(type==='wide'){if(yes('noBall'))return result('no_ball','No-ball overrides wide.');if(!no('noBall')||!['yes','no'].includes(o.wideConfirmed))return unknown('Wide requires competition-specific umpire assessment.');return result(yes('wideConfirmed')?'wide':'not_wide','Umpire-entered wide assessment; no automatic line detector.');}
 return unknown('Umpire assessment required.');
}
