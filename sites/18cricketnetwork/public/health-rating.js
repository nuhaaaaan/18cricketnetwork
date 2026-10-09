import {HEALTH_MODEL as M} from './health-model.js';
const invalid=message=>Object.assign(Error(message),{status:400});
export const HEALTH_POLICY_VERSION='18-food-disclosure-2026-10-v1';
export const PREPARATIONS=Object.keys(M.preparationPenalties);
export const normalizeIngredient=name=>String(name).trim().toLowerCase().replace(/\s+/g,' ').replace(/^organic /,'');
const ruleFor=name=>Object.hasOwn(M.ingredients,normalizeIngredient(name))?M.ingredients[normalizeIngredient(name)]:null;
// Strict, deliberately simple upload format: ingredient,grams,organic (yes/no).
export function parseIngredients(value){
 if(typeof value!=='string'||value.length>10000)throw invalid('Ingredient disclosure must be text, up to 10,000 characters');
 const lines=value.trim().split(/\r?\n/).filter(x=>x.trim());if(/^ingredient\s*[,|]/i.test(lines[0]||''))lines.shift();
 if(!lines.length||lines.length>100)throw invalid('List 1–100 ingredients, one per line: ingredient, grams, yes/no');
 const seen=new Set();return lines.map((line,i)=>{const parts=line.split(/[,|]/).map(x=>x.trim());if(parts.length!==3)throw invalid('Line '+(i+1)+': use ingredient, grams, yes/no. Expand sauces and compound ingredients into their components.');const [name,qty,organic]=parts,grams=Number(qty),key=normalizeIngredient(name);if(!key||name.length>100||!Number.isFinite(grams)||grams<=0||grams>100000||!['yes','no'].includes(organic.toLowerCase())||seen.has(key))throw invalid('Line '+(i+1)+': use a distinct ingredient, positive grams and organic yes/no');seen.add(key);return {name,grams,organic:organic.toLowerCase()==='yes'};});
}
export function ingredientText(rows){return (rows||[]).map(r=>`${r.name},${r.grams},${r.organic?'yes':'no'}`).join('\n')}
export function foodDisclosure(d,{inventory=false}={}){
 if(d.ingredientsComplete!==true||d.healthPolicyAccepted!==true)throw invalid('Confirm complete ingredients (including oils, sauces, additives and garnishes) and the 18 food health policy');
 const raw=inventory?d.ingredientInventory:d.ingredients,ingredientRows=parseIngredients(raw),preparation=inventory?'Raw':d.preparation;
 if(!PREPARATIONS.includes(preparation))throw invalid('Select a cooking method');
 const nutrition={};for(const key of ['sodiumMg','addedSugarG','saturatedFatG','fiberG']){const v=d.nutrition?.[key];if(v===undefined||v===null||v==='')continue;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>(key==='sodiumMg'?100000:100))throw invalid('Enter valid per-100g nutrition values');nutrition[key]=v;}
 const evidence=d.organicEvidence||'';if(typeof evidence!=='string'||evidence.length>2000)throw invalid('Organic evidence reference must be up to 2,000 characters');
 return {ingredientRows,ingredientsComplete:true,healthPolicyAccepted:true,healthPolicyVersion:HEALTH_POLICY_VERSION,preparation,nutrition,organicEvidence:evidence.trim()};
}
export function healthRating(d){
 const rows=d.ingredientRows||[],unknown=rows.filter(r=>!ruleFor(r.name)).map(r=>r.name);
 const breakdown=rows.map(r=>({...r,...(ruleFor(r.name)||{group:'Needs review',score:null})}));
 const mass=breakdown.reduce((a,r)=>a+(r.score===null?0:r.grams),0),nutrients=d.nutrition||{};
 const flags=Object.entries(M.nutrientPenalties).filter(([k,[threshold]])=>Number(nutrients[k])>threshold).map(([key,[threshold,penalty]])=>({key,threshold,penalty}));
 let score=null;if(rows.length&&d.ingredientsComplete&&d.healthPolicyAccepted&&!unknown.length&&mass){score=breakdown.reduce((a,r)=>a+(r.score===null?0:r.grams*r.score),0)/mass-(M.preparationPenalties[d.preparation]??0.5)-flags.reduce((a,r)=>a+r.penalty,0);score=Math.round(Math.max(0,Math.min(10,score))*10)/10;}
 const completeNutrition=['sodiumMg','addedSugarG','saturatedFatG','fiberG'].every(k=>typeof nutrients[k]==='number');
 return {score,modelVersion:M.version,engine:'Local expert rules',status:score===null?'Needs ingredient review':completeNutrition?'Provisional · nutrition declared':'Provisional · nutrition incomplete',unknown,breakdown,flags,preparationPenalty:M.preparationPenalties[d.preparation]??0.5,organicClaimCount:rows.filter(r=>r.organic).length,coverage:rows.length?Math.round((rows.length-unknown.length)*100/rows.length):0,basis:'Mass-weighted ingredient index with cooking and declared per-100g nutrition adjustments. Water and seasonings are neutral. Organic claims do not increase this nutrition score.',limits:'Platform heuristic based on restaurant declarations, not independent testing, medical advice, food-safety certification or an allergen guarantee. No trained-model accuracy has been established.'};
}
export function restaurantRating(profile,menu){const items=menu.filter(m=>m.available),ratings=items.map(healthRating),rated=ratings.filter(r=>r.score!==null);if(!items.length){const r=healthRating(profile||{});return {...r,basisLabel:'Ingredient inventory only · menu rating pending',ratedMeals:0,totalMeals:0};}return {score:rated.length===items.length?Math.round(rated.reduce((a,r)=>a+r.score,0)/items.length*10)/10:null,status:'Provisional · menu average',basisLabel:'Equal average of all available menu items; every item must be rated',ratedMeals:rated.length,totalMeals:items.length,modelVersion:M.version};}
export async function importIngredientFile(file){if(!file||!file.name.match(/\.(csv|txt)$/i)||file.size>10000)throw invalid('Upload a TXT or simple CSV ingredient list up to 10 KB');const raw=await file.text();return ingredientText(parseIngredients(raw));}
