import {build} from 'esbuild';
await build({entryPoints:['public/labels-source.js'],outfile:'public/labels-library.js',bundle:true,format:'esm',platform:'browser',minify:true});
