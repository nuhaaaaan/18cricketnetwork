import {readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
const failures=[];
const sensitive=/(?:^|\/)(?:\.env(?:\..*)?|\.git|\.dev\.vars(?:\..*)?|[^/]+\.(?:pem|key|sqlite|db|bak|log))$/i;
const keyPatterns=[/\b(?:sk_live_|rk_live_|sk-proj-)[A-Za-z0-9_-]{20,}/,/\b(?:ghp_|github_pat_)[A-Za-z0-9_]{25,}/,/\bAKIA[A-Z0-9]{16}\b/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/mongodb(?:\+srv)?:\/\/[^\s/]+:[^\s/]+@/];
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
for(const file of tracked){if(sensitive.test(file)&&!file.endsWith('.env.example'))failures.push('Tracked sensitive file: '+file);}
function scan(dir){for(const name of readdirSync(dir)){const file=join(dir,name);const st=statSync(file);if(st.isDirectory()){scan(file);continue;}if(sensitive.test(file)||file.endsWith('.map'))failures.push('Exposed file: '+file);if(/\.(?:js|mjs|json|html|css|txt)$/.test(file)&&st.size<5000000){const data=readFileSync(file,'utf8');if(keyPatterns.some(p=>p.test(data)))failures.push('Potential credential in served asset: '+file);}}}
scan('public');if(process.argv.includes('--build')){if(!existsSync('dist/client'))failures.push('Build output missing');else scan('dist/client');}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('Security artifact checks passed: no tracked runtime credentials or exposed source maps/key files.');
