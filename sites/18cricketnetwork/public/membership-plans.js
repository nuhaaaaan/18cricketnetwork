// Monthly local-market prices. Non-seller prices are proposed launch tiers.
export const membershipPlans = [
  {role:'vendor',label:'Gear sellers',usd:49,inr:1988,approved:true},
  {role:'talent_scout',label:'Talent scouts',usd:39,inr:1499},
  {role:'academy',label:'Academies',usd:59,inr:2499},
  {role:'coach',label:'Coaches, including mindset coaches',usd:29,inr:999},
  {role:'ground_owner',label:'Ground owners',usd:49,inr:1988},
  {role:'practice_facility',label:'Practice facilities',usd:39,inr:1499},
  {role:'team_manager',label:'Teams & clubs',usd:29,inr:999},
  {role:'tournament_organizer',label:'Tournament organizers',usd:49,inr:1988},
  {role:'umpire',label:'Umpires',usd:19,inr:699},
  {role:'service_provider',label:'Cricket service providers',usd:29,inr:999},
  {role:'player',label:'Players',usd:9,inr:299},
  {role:'fan',label:'Fans & supporters',usd:5,inr:149}
];
export function planQuote(role,country){
  const plan=membershipPlans.find(p=>p.role===role);
  if(!plan||!['US','IN'].includes(country))throw Error('Choose a supported role and country');
  return {role,country,currency:country==='IN'?'INR':'USD',amountMinor:(country==='IN'?plan.inr:plan.usd)*100,interval:'month',proposed:!plan.approved};
}
