import Script from 'next/script';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from './chatgpt-auth';
import {authShell} from '../web/auth-shell.js';
import {entryDecision} from '../public/entry-policy.js';
export async function NetworkGate({children}:{children:React.ReactNode}){
 const preview=!!process.env.VERCEL||process.env.CRICKET_DEPLOYMENT==='vercel-preview';
 const user=preview?null:await getChatGPTUser();let profile=null;
 if(user&&env.DB){try{const row=await env.DB.prepare('SELECT data FROM accounts WHERE owner=?').bind(user.userId).first() as {data:string}|null;profile=row?JSON.parse(row.data):null;}catch{profile=null;}}
 const decision=entryDecision(user,profile,preview);
 if(decision==='network')return <>{children}</>;
 return <><div dangerouslySetInnerHTML={{__html:authShell(decision==='onboarding'?'signup':'login')}}/><Script src="/auth.js" type="module" strategy="afterInteractive"/></>;
}
