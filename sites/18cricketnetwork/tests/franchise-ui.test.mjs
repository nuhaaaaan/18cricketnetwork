import test from 'node:test';
import assert from 'node:assert/strict';
import {franchisePage,bindFranchise} from '../public/franchise.js';
import {FRANCHISE_KINDS} from '../public/franchise-model.js';
test('organisation UI opens real API workspace, escapes evidence, changes departments and builds typed forms',async()=>{
 const priorLocation=globalThis.location,priorDocument=globalThis.document;const requests=[];let rendered=0;
 const workspace={id:'test-org',name:'<script>private</script>',kind:'franchise',season:'2027',currency:'USD',role:'owner',version:2,members:[{email:'owner@example.test',userId:'ui-owner',status:'active',role:'owner'}],entries:[{id:'test-scout',kind:'scouting',title:'<img src=x>',fields:{player:'Synthetic player',notes:'<script>unsafe</script>'},status:'draft',createdBy:'ui-owner',createdAt:'2027-01-01'}],audit:[]};
 const c={user:()=> 'ui-owner',api:async path=>{requests.push(path);return path==='franchise'?[{id:'test-org',role:'owner'}]:workspace},render:()=>rendered++};
 try{globalThis.location={search:'?org=test-org'};franchisePage(c);await new Promise(resolve=>setImmediate(resolve));let html=franchisePage(c);assert.deepEqual(requests,['franchise','franchise/test-org']);assert.match(html,/&lt;script&gt;private/);assert.ok(!html.includes('data-area="medical"'));assert.match(html,/Operational pilot/);assert.match(html,/Separate|separate/);
 const node={dataset:{franchise:'area',area:'scouting'}};globalThis.document={querySelectorAll:s=>s==='[data-franchise]'?[node]:[],querySelector:()=>null};bindFranchise(c);await node.onclick();html=franchisePage(c);assert.match(html,/18 Scout/);assert.match(html,/&lt;img src=x&gt;/);assert.ok(!html.includes('<script>unsafe</script>'));
 node.dataset={franchise:'add'};globalThis.document.querySelector=s=>s==='#franchiseKind'?{value:'scouting'}:null;bindFranchise(c);await node.onclick();html=franchisePage(c);assert.match(html,/id="franchiseEntry"/);for(const field of FRANCHISE_KINDS.scouting.fields)assert.ok(html.includes('name="'+field.key+'"'));assert.ok(rendered>=3);
 }finally{globalThis.location=priorLocation;globalThis.document=priorDocument}
});
