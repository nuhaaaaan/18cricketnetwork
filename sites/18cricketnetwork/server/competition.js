import {standings,tournamentPlan,COMPETITION_FORMATS} from '../public/competition-engine.js';
import {competitionAdmin} from './governance.js';
const json=data=>Response.json(data,{headers:{'Cache-Control':'no-store'}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
export async function competition(request,env,path,user,body){
 if(path[0]!=='competition')return null;
 const r=await env.DB.prepare("SELECT * FROM records WHERE id=? AND type IN ('tournaments','leagues')").bind(path[1]).first();if(!r)fail('Competition not found',404);
 const d=JSON.parse(r.data),rows=(await env.DB.prepare("SELECT * FROM records WHERE type='matches'").all()).results;
 const matches=rows.map(m=>({...JSON.parse(m.data),id:m.id,version:m.version})).filter(m=>m.tournamentId===r.id||m.leagueId===r.id);
 if(request.method==='GET')return json({id:r.id,version:r.version,rules:d.competitionRules||null,plan:d.competitionPlan||null,standings:standings(matches,d.competitionRules),sourceVersions:matches.map(m=>({id:m.id,version:m.version})),provisional:true});
 if(request.method!=='POST')fail('Method not allowed',405);if(!await competitionAdmin(env.DB,r.id,user))fail('Competition admin required',403);
 const b=await body();if(b.version!==r.version)fail('Competition changed. Refresh.',409);
 if(!COMPETITION_FORMATS.includes(b.structure))fail('Select a tournament structure');
 const rules={version:1,structure:b.structure,points:{}};for(const key of ['win','tie','noResult','loss','draw']){const value=Number(b.points?.[key]??({win:2,tie:1,noResult:1,loss:0,draw:1}[key]));if(!Number.isInteger(value)||value<0||value>20)fail('Invalid points policy');rules.points[key]=value;}
 if(!Array.isArray(b.teamIds))fail('Select seeded team records');const names=[];
 for(const id of b.teamIds){const team=await env.DB.prepare("SELECT data FROM records WHERE id=? AND type='teams'").bind(id).first();if(!team)fail('Team not found');names.push(JSON.parse(team.data).name);}
 let plan;try{plan=tournamentPlan(names,b.structure)}catch(e){fail(e.message)}
 const next={...d,competitionRules:rules,competitionPlan:{...plan,teamIds:b.teamIds,updatedBy:user,updatedAt:new Date().toISOString()}};
 const updated=await env.DB.prepare('UPDATE records SET data=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(next),r.id,r.version).run();if(!updated.meta.changes)fail('Competition changed. Refresh.',409);
 return json({ok:true,plan,version:r.version+1});
}
