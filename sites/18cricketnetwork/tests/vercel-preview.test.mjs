import test from 'node:test';
import assert from 'node:assert/strict';
import {vercelPreview} from '../deployment/vercel-preview.mjs';

test('independent preview rejects identity spoofing and every write',async()=>{
  const headers={'oai-authenticated-user-id':'admin','oai-authenticated-user-email':'owner@example.com'};
  const status=await vercelPreview(new Request('https://preview.local/api/status',{headers})).json();
  assert.equal(status.user,null);assert.equal(status.database,false);
  for(const method of ['POST','PUT','DELETE','PATCH']){
    const r=vercelPreview(new Request('https://preview.local/api/records',{method,headers}));
    assert.equal(r.status,503);assert.equal((await r.json()).code,'LAUNCH_SETUP_REQUIRED');
  }
  assert.equal(vercelPreview(new Request('https://preview.local/api/account',{headers})).status,503);
});

test('independent preview denies venue feature access before authentication activation',async()=>{
 const r=vercelPreview(new Request('https://preview.local/api/directory/venues'));
 assert.equal(r.status,503);assert.equal((await r.json()).code,'LAUNCH_SETUP_REQUIRED');
});
