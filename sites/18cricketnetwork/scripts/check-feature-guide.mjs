import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FEATURES} from '../public/feature-guide.js';
const manifest=JSON.parse(readFileSync(new URL('../docs/feature-guide-review.json',import.meta.url),'utf8'));
const failures=[];
for(const f of FEATURES){const hash=createHash('sha256');for(const file of f.sources)hash.update(file+'\0').update(readFileSync(new URL('../'+file,import.meta.url)));hash.update(JSON.stringify({offer:f.offer,policy:f.policy,practice:f.practice,limits:f.limits}));if(manifest[f.id]!==hash.digest('hex'))failures.push(f.id)}
if(failures.length){console.error('Feature guides need review after source changes: '+failures.join(', '));console.error('Update public/feature-guide.js, then refresh docs/feature-guide-review.json after reviewing all affected guides. See docs/DOCUMENTATION-RELEASE-CHECKLIST.md.');process.exitCode=1}else console.log('All '+FEATURES.length+' feature guides match their reviewed source.');
