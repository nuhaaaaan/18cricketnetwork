const fail=m=>{throw Object.assign(Error(m),{status:400})};
const text=(v,label,max=120)=>{if(v===undefined||v===null)return '';if(typeof v!=='string'||v.length>max)fail('Invalid '+label);return v.trim()};
export function validateMatchSetup(raw,squads){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('Invalid match setup');
  const teams={};
  for(const side of ['A','B']){
    const t=raw.teams?.[side];if(!t)fail('Assign a captain and wicketkeeper to each team');
    for(const role of ['captainId','wicketkeeperId'])if(!squads[side].some(p=>p.id===t[role]))fail('Captain and wicketkeeper must be in their team’s playing squad');
    teams[side]={captainId:t.captainId,wicketkeeperId:t.wicketkeeperId};
  }
  const officials={};for(const key of ['bowlerEnd','squareLeg','thirdUmpire','referee','scorer'])officials[key]=text(raw.officials?.[key],key);
  if(!officials.bowlerEnd||!officials.squareLeg)fail('Enter both on-field umpire names');
  const tossWinner=text(raw.tossWinner,'toss winner'),tossDecision=text(raw.tossDecision,'toss decision');
  if(tossWinner||tossDecision){if(!['A','B'].includes(tossWinner)||!['bat','bowl'].includes(tossDecision))fail('Complete the toss details');if((tossWinner==='A')!==(tossDecision==='bat'))fail('Team A must be the first batting side. Arrange the teams before configuring scoring.');}
  return {teams,officials,tossWinner,tossDecision,venue:text(raw.venue,'venue'),pitch:text(raw.pitch,'pitch'),timezone:text(raw.timezone,'timezone'),competitionRound:text(raw.competitionRound,'round'),ballType:text(raw.ballType,'ball type'),notes:text(raw.notes,'match notes',1000)};
}
