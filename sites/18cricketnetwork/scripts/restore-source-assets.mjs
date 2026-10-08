import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('source-assets/manifest.json',root),'utf8'));
for(const asset of manifest.assets){const target=new URL(asset.path,root);if(existsSync(target)&&createHash('sha256').update(readFileSync(target)).digest('hex')===asset.sha256)continue;const bytes=Buffer.from(asset.parts.map(part=>readFileSync(new URL('source-assets/'+part,root),'utf8').trim()).join(''),'base64');if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Asset integrity failed: '+asset.path);writeFileSync(target,bytes);console.log('Restored original asset: '+asset.path)}
