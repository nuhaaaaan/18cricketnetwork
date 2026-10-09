import test from 'node:test';import assert from 'node:assert/strict';import{DatabaseSync}from'node:sqlite';import{careers,validateJob}from'../server/careers.js';
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

const job={name:'Club coach',organization:'Community club',location:'Boston',bio:'Train club players',compensation:'USD 30 / hour',requirements:'Coaching experience',category:'Coaching',level:'Grassroots',contract:'Part-time',workMode:'On-site',deadline:'2099-12-01',authorized:true,cricketRelated:true};
test('Job validation requires genuine authorization and valid eligibility fields',()=>{assert.equal(validateJob(job).verification.includes('not independently'),true);assert.throws(()=>validateJob({...job,authorized:false}));assert.throws(()=>validateJob({...job,deadline:'2099-02-31'}));assert.throws(()=>validateJob({...job,level:'ICC verified'}))});
test('Applicant and poster permissions protect the complete application lifecycle',async()=>{const env=fixture();await env.DB.prepare('CREATE TABLE records(id TEXT PRIMARY KEY,type TEXT,owner TEXT,data TEXT,created TEXT,version INTEGER DEFAULT 1)').run();await env.DB.prepare('CREATE TABLE accounts(owner TEXT PRIMARY KEY,data TEXT)').run();await env.DB.prepare('INSERT INTO accounts VALUES(?,?)').bind('player',JSON.stringify({name:'Applicant'})).run();const call=async(path,method='GET',b={},user='poster')=>{const r=await careers(new Request('https://test/api/'+path,{method}),env,path.split('/'),user,async()=>b);return{status:r.status,data:await r.json()}};const j=await call('careers','POST',job);assert.equal(j.status,201);await call('careers/'+j.data.id+'/apply','POST',{cover:'My coaching experience',consent:true},'player');await assert.rejects(()=>call('careers/'+j.data.id+'/applicants','GET',{},'stranger'),/Only the poster/);const list=(await call('careers/'+j.data.id+'/applicants')).data;assert.equal(list.length,1);await assert.rejects(()=>call('careers/application/'+list[0].id,'POST',{status:'selected'},'stranger'),/Only the poster/);await call('careers/application/'+list[0].id,'POST',{status:'shortlisted'});assert.equal((await call('careers/applications','GET',{},'player')).data[0].status,'shortlisted');await call('careers/application/'+list[0].id,'POST',{status:'withdrawn'},'player');await assert.rejects(()=>call('careers/application/'+list[0].id,'POST',{status:'selected'}),/withdrawn/);await assert.rejects(()=>call('careers/'+j.data.id+'/close','POST',{},'player'),/Only the poster/);await call('careers/'+j.data.id+'/close','POST',{});assert.equal((await call('careers')).data[0].status,'closed')});
