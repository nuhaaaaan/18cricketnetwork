import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {entryDecision,profileComplete,POLICY_VERSION} from '../public/entry-policy.js';
import {validateAccount} from '../server/account.js';
import {authShell} from '../web/auth-shell.js';
const input={name:'Test member',city:'Boston',country:'US',roles:['player'],primaryRole:'player',termsAccepted:true,privacyAccepted:true};
test('entry policy fails closed for missing identity, profile, acknowledgements and preview spoofing',()=>{
 const p=validateAccount(input);assert.equal(entryDecision(null,p),'welcome');assert.equal(entryDecision('user',null),'onboarding');assert.equal(entryDecision('user',{...p,consent:undefined}),'onboarding');assert.equal(entryDecision('user',p),'network');assert.equal(entryDecision('forged',p,true),'welcome');assert.equal(profileComplete({...p,consent:{...p.consent,policyVersion:'old'}}),false);
});
test('consent is explicit and stored server-side; phone stays optional and arbitrary fields are ignored',()=>{
 assert.throws(()=>validateAccount({...input,termsAccepted:false}),/terms/);assert.throws(()=>validateAccount({...input,privacyAccepted:'true'}),/privacy/);
 const p=validateAccount({...input,consent:{acceptedAt:'fake'},password:'never stored',admin:true});assert.equal(p.consent.policyVersion,POLICY_VERSION);assert.ok(Number.isFinite(Date.parse(p.consent.acceptedAt)));assert.equal(p.password,undefined);assert.equal(p.admin,undefined);assert.equal(p.phone,undefined);
});
test('welcome labels unavailable providers truthfully, offers animation controls and required acknowledgements',()=>{
 const html=authShell('signup');for(const p of ['Google','Apple','WhatsApp'])assert.match(html,new RegExp('Continue with '+p));assert.equal((html.match(/disabled aria-describedby="providerNotice"/g)||[]).length,3);assert.match(html,/welcome-globe/);assert.match(html,/authMotionToggle/);assert.match(html,/name="privacyAccepted" type="checkbox" required/);assert.match(html,/name="termsAccepted" type="checkbox" required/);assert.match(html,/not verified/);
});
test('every feature page has a server gate, while sign-in and policies remain reachable',()=>{
 const root=new URL('../app/',import.meta.url);for(const d of readdirSync(root,{withFileTypes:true}).filter(d=>d.isDirectory()&&!['login','signup','policies','api'].includes(d.name))){const f=new URL(d.name+'/page.tsx',root);try{assert.match(readFileSync(f,'utf8'),/<NetworkGate>/);}catch(err){if(err.code!=='ENOENT')throw err;}}
 assert.match(readFileSync(new URL('page.tsx',root),'utf8'),/<NetworkGate>/);assert.match(readFileSync(new URL('network-gate.tsx',root),'utf8'),/preview\?null:await getChatGPTUser/);
});
