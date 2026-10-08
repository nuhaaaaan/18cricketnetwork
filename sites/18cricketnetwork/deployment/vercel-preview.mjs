import usa from '../data/usa-venues-researched.json' with {type:'json'};
import india from '../data/india-venues-researched.json' with {type:'json'};

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const pending='This preview supports browsing. Account services, persistent storage and transactions must be connected before registration or orders can open.';

// Public reference data is real researched source material, not user activity.
// Never delegate requests to the hosted API: its identity headers are trusted
// only inside Sites, and can be forged on an independent deployment.
export function vercelPreview(request){
  const url=new URL(request.url);
  if(request.method!=='GET'&&request.method!=='HEAD')return json({error:pending,code:'LAUNCH_SETUP_REQUIRED'},503);
  if(url.pathname==='/api/status')return json({mode:'public-preview',database:false,ai:false,user:null,email:null,name:null,message:pending});
  if(url.pathname==='/api/health')return json({status:'preview',transactionsEnabled:false,authenticationEnabled:false,databaseConnected:false});
  if(url.pathname==='/api/directory/venues'){
    const all=[...usa,...india].map(v=>({...v,owner:null,version:1,bookingStatus:'directory-only',ownershipStatus:'unclaimed'}));
    const filters=Object.fromEntries(['country','kind','state','city','q'].map(k=>[k,(url.searchParams.get(k)||'').toLowerCase()]));
    const venues=all.filter(v=>(!filters.country||v.country.toLowerCase()===filters.country)&&(!filters.kind||v.kind===filters.kind)&&(!filters.state||v.state.toLowerCase()===filters.state)&&(!filters.city||v.city.toLowerCase().includes(filters.city))&&(!filters.q||[v.name,v.city,v.state,v.address].join(' ').toLowerCase().includes(filters.q)));
    const counts={total:all.length,US:{ground:0,practice:0,academy:0},IN:{ground:0,practice:0,academy:0}};
    for(const v of all)counts[v.country][v.kind]++;
    return json({venues,counts,filtered:venues.length,states:[...new Set(all.filter(v=>!filters.country||v.country.toLowerCase()===filters.country).map(v=>v.state))].sort(),isAdmin:false,coverage:'Researched directory, not exhaustive. Confirm access and availability with operators. Venue claims and bookings are not open on this preview.'});
  }
  return json({error:pending,code:'LAUNCH_SETUP_REQUIRED'},503);
}
