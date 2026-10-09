import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {parseIngredients,foodDisclosure,healthRating,restaurantRating,importIngredientFile} from '../public/health-rating.js';
import {validateAccount} from '../server/account.js';
const meal=(ingredients,extra={})=>foodDisclosure({ingredients,ingredientsComplete:true,healthPolicyAccepted:true,preparation:'Steamed',...extra});
test('disclosure parser enforces quantities, uniqueness, compound expansion and complete policy',()=>{
 assert.equal(parseIngredients('ingredient,grams,organic\nbrown rice,100,yes')[0].organic,true);
 for(const bad of ['rice','rice,0,no','rice,-1,no','rice,NaN,no','rice,10,maybe','rice,10,no\norganic rice,20,yes'])assert.throws(()=>parseIngredients(bad));
 assert.throws(()=>foodDisclosure({ingredients:'rice,10,no',preparation:'Steamed'}),/Confirm/);
 assert.throws(()=>meal('rice,10,no',{nutrition:{sodiumMg:-10}}));
 assert.throws(()=>meal('rice,10,no',{nutrition:{addedSugarG:'unknown'}}));
});
test('unknowns produce no score; organic claims and water cannot boost nutrition scores',()=>{
 assert.equal(healthRating(meal('unknown sauce,20,no')).score,null);
 for(const name of ['constructor','__proto__','toString'])assert.equal(healthRating(meal(name+',20,no')).score,null);
 const a=healthRating(meal('brown rice,100,no')),b=healthRating(meal('brown rice,100,yes\nwater,1000,no'));
 assert.equal(a.score,b.score);assert.equal(b.organicClaimCount,1);
 assert.equal(healthRating(meal('water,100,no')).score,null);
 assert.ok(healthRating(meal('chickpeas,100,no')).score>healthRating(meal('sugar,100,yes')).score);
});
test('cooking and declared nutrition penalties apply; missing nutrition is labelled',()=>{
 const a=healthRating(meal('chickpeas,100,no')),b=healthRating(meal('chickpeas,100,no',{preparation:'Deep-fried',nutrition:{sodiumMg:900,addedSugarG:20,saturatedFatG:8,fiberG:4}}));
 assert.equal(a.score-b.score,4.5);assert.match(a.status,/incomplete/);assert.match(b.status,/declared/);assert.equal(b.flags.length,3);
});
test('restaurant averages require all available menu meals and do not use inventory after publication',()=>{
 const a={...meal('chickpeas,100,no'),available:true},b={...meal('sugar,100,no'),available:true},unknown={...meal('unmapped ingredient,50,no'),available:true};
 assert.equal(restaurantRating(a,[a,b]).score,5.5);assert.equal(restaurantRating(a,[a,unknown]).score,null);assert.equal(restaurantRating(a,[a,{...unknown,available:false}]).score,9);
 assert.match(restaurantRating(a,[]).basisLabel,/inventory/);
});
test('Python and Worker inference agree and exported parameters are reproducible',()=>{
 execFileSync('python3',['models/health_rating.py','--export','--check']);
 for(const data of [meal('brown rice,200,yes\nchickpeas,80,no\nolive oil,12,no'),meal('sugar,100,yes',{preparation:'Deep-fried'}),meal('unmapped thing,10,no'),meal('chickpeas,100,no',{nutrition:{sodiumMg:1000,addedSugarG:20,saturatedFatG:8}})]){const py=JSON.parse(execFileSync('python3',['models/health_rating.py'],{input:JSON.stringify(data),encoding:'utf8'}));assert.equal(py.score,healthRating(data).score)}
});
test('file import rejects oversized/image uploads and restaurant account signup requires inventory',async()=>{
 assert.equal(await importIngredientFile({name:'recipe.csv',size:40,text:async()=> 'ingredient,grams,organic\nrice,100,no'}),'rice,100,no');
 await assert.rejects(importIngredientFile({name:'recipe.png',size:10}));await assert.rejects(importIngredientFile({name:'recipe.txt',size:30000}));
 const p={name:'Test owner',city:'Test city',country:'US',organization:'Test kitchen',roles:['restaurant'],primaryRole:'restaurant',termsAccepted:true,privacyAccepted:true};assert.throws(()=>validateAccount(p),/Confirm/);const v=validateAccount({...p,ingredientInventory:'rice,100,no',ingredientsComplete:true,healthPolicyAccepted:true});assert.equal(v.restaurantHealthDisclosure.ingredientRows.length,1);
});
