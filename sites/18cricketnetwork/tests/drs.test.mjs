import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateReview,validateObservations} from '../public/drs-rules.js';
const lbw={clearEvidence:'yes',noBall:'no',freeHit:'no',batFirst:'no',pitch:'inline',impact:'inline',shot:'yes',trajectory:'hitting'};
test('LBW never invents tracking or umpire call; legality and leg-side exceptions apply',()=>{
 assert.equal(evaluateReview('lbw',lbw).recommendation,'inconclusive');
 for(const extra of [{noBall:'yes'},{freeHit:'yes'},{pitch:'leg'},{batFirst:'yes'},{impact:'leg'},{impact:'off',shot:'yes'}])assert.equal(evaluateReview('lbw',{...lbw,...extra}).recommendation,'not_out');
 assert.equal(evaluateReview('lbw',{...lbw,trajectory:'umpires_call'},'out').recommendation,'inconclusive');
});
const run={clearEvidence:'yes',liveBall:'yes',wicketBroken:'yes',outOfGround:'yes',fielderContact:'yes',injuryEscape:'no',keeperOnly:'no',attemptingRun:'yes',striker:'yes',noBall:'yes',specialCase:'no'};
test('Run-out supports no-balls but preserves grounding, injury and keeper-only exceptions',()=>{
 assert.equal(evaluateReview('run_out',run).recommendation,'out');
 for(const extra of [{outOfGround:'no'},{wicketBroken:'no'},{liveBall:'no'},{injuryEscape:'yes'},{fielderContact:'no'},{keeperOnly:'yes',attemptingRun:'no'}])assert.equal(evaluateReview('run_out',{...run,...extra}).recommendation,'not_out');
 assert.equal(evaluateReview('run_out',{...run,specialCase:'yes'}).recommendation,'inconclusive');
 assert.equal(evaluateReview('run_out',{...run,keeperOnly:'yes',attemptingRun:'no',noBall:'no'}).recommendation,'inconclusive');
 assert.equal(evaluateReview('run_out',{...run,clearEvidence:'no'}).recommendation,'inconclusive');
});
test('Stumping, catches and wickets require explicit legal evidence',()=>{
 const stump={...run,noBall:'no',freeHit:'no',keeperOnly:'yes',attemptingRun:'no'};assert.equal(evaluateReview('stumped',stump).recommendation,'out');assert.equal(evaluateReview('stumped',{...stump,noBall:'yes'}).recommendation,'not_out');
 const caught={clearEvidence:'yes',noBall:'no',freeHit:'no',batContact:'yes',groundContact:'no',completeControl:'yes',fairBoundaryCatch:'yes'};assert.equal(evaluateReview('caught',caught).recommendation,'out');assert.equal(evaluateReview('caught',{...caught,fairBoundaryCatch:'unknown'}).recommendation,'inconclusive');assert.equal(evaluateReview('caught',{...caught,groundContact:'yes'}).recommendation,'not_out');
 assert.equal(evaluateReview('bowled',{clearEvidence:'yes',noBall:'no',freeHit:'no',wicketBroken:'yes',deliveredBall:'yes'}).recommendation,'out');
 assert.equal(evaluateReview('hit_wicket',{clearEvidence:'yes',noBall:'no',freeHit:'yes',hitOwnWicket:'yes',qualifyingAction:'yes'}).recommendation,'not_out');
});
test('Boundary, no-ball precedence, unknown and invalid inputs fail safely',()=>{
 assert.equal(evaluateReview('boundary',{clearEvidence:'yes',boundaryTouched:'yes',batContact:'yes',bounced:'no'}).recommendation,'six');assert.equal(evaluateReview('boundary',{clearEvidence:'yes',boundaryTouched:'yes',batContact:'no',bounced:'no'}).recommendation,'four');
 assert.equal(evaluateReview('wide',{clearEvidence:'yes',noBall:'yes',wideConfirmed:'yes'}).recommendation,'no_ball');
 assert.equal(evaluateReview('no_ball',{clearEvidence:'yes',footFault:'yes'}).recommendation,'no_ball');
 assert.equal(evaluateReview('caught',{}).recommendation,'inconclusive');assert.throws(()=>validateObservations('lbw',{pitch:'fake'}));assert.throws(()=>evaluateReview('fake',{}));assert.equal(evaluateReview('other',{clearEvidence:'yes'}).recommendation,'inconclusive');
});
