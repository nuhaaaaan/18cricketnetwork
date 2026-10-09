export const RULES_VERSION='18-scoring-2026-10-v2';
export const FORMATS={
 T10:{label:'T10',overs:10,size:6,maxBowlerBalls:12,minResultBalls:30},
 T20:{label:'T20',overs:20,size:6,maxBowlerBalls:24,minResultBalls:30},
 ODI:{label:'ODI / 50 overs',overs:50,size:6,maxBowlerBalls:60,minResultBalls:120},
 '40 overs':{label:'40 overs',overs:40,size:6,maxBowlerBalls:48,minResultBalls:120},
 Hundred:{label:'100-ball cricket',overs:20,size:5,maxBowlerBalls:20,minResultBalls:25},
 Test:{label:'Test',overs:0,size:6,maxBowlerBalls:null,multiInnings:true},
 'First-class':{label:'First-class / multi-day',overs:0,size:6,maxBowlerBalls:null,multiInnings:true},
 Custom:{label:'Custom limited overs',overs:20,size:6,maxBowlerBalls:24,minResultBalls:30}
};
export function formatKey(value,overs=20){
 if(FORMATS[value])return value;
 return ({'50 overs':'ODI','100 balls':'Hundred','100-ball':'Hundred',T100:'Hundred',test:'Test','ODI / 50 overs':'ODI'}[value])||({10:'T10',20:'T20',40:'40 overs',50:'ODI'}[overs])||'Custom';
}
export function matchRules(match){
 const c=match.scoringConfig||{},key=formatKey(c.formatKey||match.format,Number(match.overs)),p=FORMATS[key],size=Number(c.ballsPerOver||p.size);
 return {...p,key,size,quota:p.multiInnings?null:Number(match.overs)*size,freeHit:!p.multiInnings&&c.freeHit!==false,
  maxBowlerBalls:p.multiInnings?null:Number(c.maxBowlerBalls||(c.maxBowlerOvers?c.maxBowlerOvers*size:p.maxBowlerBalls)),
  widePenalty:Number(c.widePenalty||1),noBallPenalty:Number(c.noBallPenalty||1),minResultBalls:Number(c.minResultBalls??p.minResultBalls),
  followOnLead:Number(c.followOnLead||200),tieBreakBalls:key==='Hundred'?5:6,rulesVersion:c.rulesVersion||'legacy-v1'};
}
