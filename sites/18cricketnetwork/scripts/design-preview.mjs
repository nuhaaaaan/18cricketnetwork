import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {shell} from '../web/shell.js';
const [css,js,logo]=await Promise.all([readFile('app/globals.css','utf8'),readFile('public/app.js','utf8'),readFile('public/logo.jpeg')]);
const sourceJs=js.replace('async function init(){render();try{',`async function init(){render();if(window.DESIGN_PREVIEW){$('#connection').innerHTML='<div class="notice">UNPUBLISHED DESIGN PREVIEW · Explore every section. Records, sign-in and the assistant connect through the saved application’s server at deployment.</div>';$('#aiMode').textContent='Design preview · backend not running';return;}try{`);
const bundled=await build({stdin:{contents:sourceJs,resolveDir:process.cwd()+'/public',loader:'js'},bundle:true,write:false,format:'iife'});const previewJs=bundled.outputFiles[0].text;
await writeFile('design-preview.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>18CricketNetwork | Unpublished design preview</title><style>${css}</style></head><body>${shell.replace('/logo.jpeg','data:image/jpeg;base64,'+logo.toString('base64'))}<script>window.DESIGN_PREVIEW=true;${previewJs.replaceAll('</script','<\\/script')}</script></body></html>`);
