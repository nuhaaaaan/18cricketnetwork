import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
await build({entryPoints:['public/maps-library-source.js'],outfile:'public/maps-library.js',bundle:true,format:'esm',platform:'browser',minify:true});
await copyFile('node_modules/leaflet/dist/leaflet.css','public/leaflet.css');
