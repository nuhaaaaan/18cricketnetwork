// Frontend transport only. No replacement backend or authentication service.
export class NetworkError extends Error {
 constructor(message,{status=0,code='NETWORK_ERROR',details}={}){super(message);this.name='NetworkError';this.status=status;this.code=code;this.details=details;}
}
const pending=()=>new NetworkError('The approved standalone API gateway must be configured first.',{code:'INTEGRATION_REQUIRED'});
export function createCricketClient({baseUrl,getAccessToken,fetchImpl=globalThis.fetch,timeoutMs=15000}={}){
 let base=null;
 if(baseUrl){try{base=new URL(baseUrl);}catch{throw pending();}
  if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.hostname.endsWith('.chatgpt.site'))throw pending();
  if(!['','/','/api','/api/'].includes(base.pathname))throw pending();base=new URL('/api/',base.origin);
 }
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)throw Error('Invalid timeout');
 async function request(path,{method='GET',body,signal,anonymous=false}={}){
  if(!base)throw pending();
  if(typeof path!=='string'||!path||path.startsWith('/')||path.includes('\\')||path.includes('#')||/^(?:[a-z]+:|\/\/)/i.test(path))throw Error('Invalid API path');
  const url=new URL(path,base);let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{throw Error('Invalid API path');}if(url.origin!==base.origin||!decoded.startsWith('/api/')||decoded.includes('\\')||decoded.split('/').includes('..'))throw Error('Invalid API path');
  if(!['GET','POST','PUT','PATCH','DELETE'].includes(method))throw Error('Unsupported method');
  if(anonymous&&(!['GET'].includes(method)||path!=='status'))throw Error('Only status can be requested anonymously');
  const token=anonymous?null:await getAccessToken?.();
  if(!anonymous&&(typeof token!=='string'||!token.trim()))throw new NetworkError('Sign in using the approved identity provider.',{status:401,code:'SIGN_IN_REQUIRED'});
  const controller=new AbortController(),onAbort=()=>controller.abort();signal?.addEventListener('abort',onAbort,{once:true});if(signal?.aborted)controller.abort();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await fetchImpl(url.toString(),{method,headers:{Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store'});
   let data;try{data=await response.json();}catch{throw new NetworkError('The API returned an unexpected response.',{status:response.status,code:'INVALID_RESPONSE'});}
   if(!response.ok)throw new NetworkError(data.error||'Request failed.',{status:response.status,code:data.code||({401:'SIGN_IN_REQUIRED',403:'ACCESS_DENIED',409:'REFRESH_REQUIRED',429:'RATE_LIMITED',503:'INTEGRATION_REQUIRED'})[response.status]||'REQUEST_FAILED',details:data});
   return data;
  }catch(error){if(error instanceof NetworkError)throw error;throw new NetworkError(controller.signal.aborted?'Request cancelled or timed out.':'Could not reach the API. No change has been confirmed.',{code:controller.signal.aborted?'CANCELLED':'NETWORK_ERROR'});}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',onAbort);}
 }
 const key=id=>{if(typeof id!=='string'||!id.trim())throw Error('A record ID is required');return encodeURIComponent(id);};
 return Object.freeze({request,status:()=>request('status',{anonymous:true}),account:()=>request('account'),saveAccount:(data,version)=>request('account',{method:'POST',body:{data,version}}),network:()=>request('data'),scorecard:id=>request('scorecard/'+key(id)),setupMatch:(id,payload)=>request('match-setup/'+key(id),{method:'POST',body:payload}),scoreMatch:(id,payload)=>request('score/'+key(id),{method:'POST',body:payload}),createRecord:(type,data)=>request('records',{method:'POST',body:{type,data}}),updateRecord:(id,data,version)=>request('records/'+key(id),{method:'PUT',body:{data,version}})});
}
