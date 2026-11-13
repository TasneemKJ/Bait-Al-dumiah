// The static build: one minified game.js and one game.css (esbuild), three.js beside them as before.
// A production build replaces src/debug-seam.js with an empty installDebug, so ?debug=1 does nothing
// in a shipped copy. BAIT_DEBUG=1 keeps the seam for the browser checks (scripts/*.py).
// Usage: node scripts/build.mjs [outDir]
import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(root,process.argv[2]??'dist'),debug=process.env.BAIT_DEBUG==='1';
await rm(out,{recursive:true,force:true});await mkdir(path.join(out,'vendor'),{recursive:true});
await cp(path.join(root,'public'),out,{recursive:true});
await cp(path.join(root,'CREDITS.md'),path.join(out,'credits.txt'));
for(const file of ['three.module.min.js','three.core.min.js'])await cp(path.join(root,'node_modules/three/build',file),path.join(out,'vendor',file));
await cp(path.join(root,'node_modules/three/examples/jsm/controls/OrbitControls.js'),path.join(out,'vendor/OrbitControls.js'));
await cp(path.join(root,'node_modules/three/LICENSE'),path.join(out,'vendor/THREE-LICENSE.txt'));

const html=await readFile(path.join(root,'index.html'),'utf8');
const styles=[...html.matchAll(/<link rel="stylesheet" href="\.\/(src\/[^"]+\.css)">/g)].map(m=>m[1]);
const noSeam={name:'no-debug-seam',setup(b){b.onLoad({filter:/[\\/]src[\\/]debug-seam\.js$/},
 ()=>({contents:'export function installDebug(){}',loader:'js'}))}};
const common={bundle:true,minify:true,legalComments:'none',logLevel:'warning',target:['safari15','chrome100']};
await build({...common,entryPoints:[path.join(root,'src/main.js')],outfile:path.join(out,'game.js'),format:'esm',
 external:['three','three/addons/*'],plugins:debug?[]:[noSeam]});
await build({...common,stdin:{contents:styles.map(s=>`@import "./${s}";`).join('\n'),resolveDir:root,loader:'css'},
 outfile:path.join(out,'game.css')});
let page=html;for(const s of styles)page=page.replace(`<link rel="stylesheet" href="./${s}">`,'');
page=page.replace('</title>','</title><link rel="stylesheet" href="./game.css">')
 .replace('src="./src/main.js"','src="./game.js"');
if(page.includes('./src/'))throw new Error('index.html still points into src/');
await writeFile(path.join(out,'index.html'),page);
console.log(`Static 3D game built in ${path.relative(root,out)}/ (bundled, minified${debug?', debug seam kept':''}).`+
 ' All runtime dependencies are local.');
