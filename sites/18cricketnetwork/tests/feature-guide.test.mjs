import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {FEATURES,featureAbout,featureGuidePage} from '../public/feature-guide.js';
test('Every navigation feature has meaningful policies, practices, limitations and reviewed source',()=>{
 const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),modules=source.match(/const modules=\{([^\n]+)\};/)[1],keys=[...modules.matchAll(/(?:^|,)\s*(\w+):\[/g)].map(x=>x[1]).filter(x=>x!=='about');
 assert.equal(new Set(FEATURES.map(x=>x.id)).size,FEATURES.length);for(const key of keys)assert.ok(FEATURES.some(x=>x.id===key),key+' needs a guide');for(const f of FEATURES){for(const k of ['offer','policy','practice','limits'])assert.ok(f[k].length>35);assert.ok(f.sources.length);assert.match(featureAbout(f.id),/Best practices/)}assert.match(execFileSync(process.execPath,['scripts/check-feature-guide.mjs'],{cwd:new URL('../',import.meta.url),encoding:'utf8'}),/feature guides match/);
});
test('Feature guide renders actual tiers and distinguishes pilot limits',()=>{globalThis.location={search:''};const html=featureGuidePage();assert.match(html,/\$49/);assert.match(html,/₹1988/);assert.match(html,/Proposed price/);assert.match(html,/billing is not enabled/);assert.match(html,/Not ICC-certified/);assert.match(html,/video uploads await/);assert.match(html,/Private pilot/);assert.equal(featureAbout('about'),'')});
test('Portable image source is complete and restores the exact original asset',()=>{const root=new URL('../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('source-assets/manifest.json',root),'utf8'));for(const a of manifest.assets){const restored=Buffer.from(a.parts.map(p=>readFileSync(new URL('source-assets/'+p,root),'utf8').trim()).join(''),'base64');assert.equal(createHash('sha256').update(restored).digest('hex'),a.sha256);assert.deepEqual(restored,readFileSync(new URL(a.path,root)))} });
