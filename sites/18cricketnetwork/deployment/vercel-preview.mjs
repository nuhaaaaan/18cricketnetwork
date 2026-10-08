const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const pending='Sign in and complete onboarding before accessing features. Standalone authentication and persistent storage must be activated first.';
// Never trust Sites identity headers on an independent deployment.
export function vercelPreview(request){
 const url=new URL(request.url);
 if(request.method==='GET'||request.method==='HEAD'){
  if(url.pathname==='/api/status')return json({mode:'public-preview',database:false,ai:false,user:null,email:null,name:null,message:pending});
  if(url.pathname==='/api/health')return json({status:'preview',transactionsEnabled:false,authenticationEnabled:false,databaseConnected:false});
 }
 return json({error:pending,code:'LAUNCH_SETUP_REQUIRED'},503);
}
