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

test('real venue directory filters do not invent availability or ownership',async()=>{
  const all=await vercelPreview(new Request('https://preview.local/api/directory/venues')).json();
  assert.ok(all.counts.total>0);assert.equal(all.venues.length,all.counts.total);
  assert.ok(all.venues.every(v=>v.sources.length&&v.bookingStatus==='directory-only'&&!v.owner));
  const india=await vercelPreview(new Request('https://preview.local/api/directory/venues?country=IN&kind=ground')).json();
  assert.ok(india.venues.length>0);assert.ok(india.venues.every(v=>v.country==='IN'&&v.kind==='ground'));
  assert.equal(india.counts.total,all.counts.total);assert.equal(india.isAdmin,false);
});
