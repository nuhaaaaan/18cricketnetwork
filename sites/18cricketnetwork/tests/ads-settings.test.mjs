import test from 'node:test';import assert from 'node:assert/strict';import{DatabaseSync}from'node:sqlite';import{adsSettings,validateCampaign,validateSettings}from'../server/ads-settings.js';import{quoteAd}from'../public/ads-model.js';
function fixture(){
 const db=new DatabaseSync(':memory:');
 const statement=(sql,args=[])=>({
  bind(...values){return statement(sql,values)},
  async first(){return db.prepare(sql).get(...args)},
  async all(){return {results:db.prepare(sql).all(...args)}},
  async run(){return {meta:{changes:db.prepare(sql).run(...args).changes}}}
 });
 return {DB:{prepare:sql=>statement(sql),batch:stmts=>Promise.all(stmts.map(s=>s.run()))}};
}

const campaign={title:'Local coaching',description:'Weekly sessions',destination:'https://example.com/coaching',region:'Worcester',category:'coaching',plan:'starter',policyAccepted:true};
test('Prices are server-derived and unmeasured traffic does not invent reach',()=>{assert.equal(quoteAd('starter').priceMinor,499);assert.equal(quoteAd('network').priceMinor,29900);assert.equal(quoteAd('network').estimatedImpressions,0);assert.equal(quoteAd('club',200).estimatedImpressions,200);assert.equal(validateCampaign({...campaign,priceMinor:1}).priceMinor,499);assert.throws(()=>validateCampaign({...campaign,destination:'javascript:alert(1)'}));assert.throws(()=>validateCampaign({...campaign,destination:'https://user:pass@example.com'}));assert.throws(()=>validateSettings({theme:'invalid'}));assert.throws(()=>validateSettings({marketing:'yes'}))});
test('Campaigns and preferences are owner scoped; history strips queries and is deleted on opt out',async()=>{const env=fixture();const call=async(path,method='GET',b={},user='alice')=>{const r=await adsSettings(new Request('https://test/api/'+path,{method}),env,path.split('/'),user,async()=>b);return{status:r.status,data:await r.json()}};const created=await call('ads','POST',campaign);assert.equal(created.status,201);assert.equal((await call('ads','GET',{},'bob')).data.length,0);await assert.rejects(()=>call('ads/'+created.data.id,'POST',{action:'cancel'},'bob'),/not found/);await assert.rejects(()=>call('ads/'+created.data.id,'POST',{action:'activate'}),/Only cancel/);assert.equal((await call('ads')).data[0].paymentStatus,'not_collected');await call('preferences','POST',{linkHistory:true});await call('preferences/links','POST',{url:'https://example.com/path?token=secret#private'});assert.equal((await call('preferences/links')).data[0].url,'https://example.com/path');assert.equal((await call('preferences/links','GET',{},'bob')).data.length,0);await call('preferences','POST',{linkHistory:false});assert.equal((await call('preferences/links')).data.length,0);await call('ads/'+created.data.id,'POST',{action:'cancel'});assert.equal((await call('ads')).data[0].status,'cancelled')});
