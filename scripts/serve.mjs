import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'.');const port=Number(process.env.PORT||4177);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json','.jpg':'image/jpeg'};
const developmentVendor={
 '/vendor/three.module.min.js':'node_modules/three/build/three.module.min.js',
 '/vendor/three.core.min.js':'node_modules/three/build/three.core.min.js',
 '/vendor/OrbitControls.js':'node_modules/three/examples/jsm/controls/OrbitControls.js',
 '/credits.txt':'CREDITS.md',
};
createServer(async(req,res)=>{
 try{const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+(url==='/'?'/index.html':url));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 if(root===process.cwd()&&developmentVendor[url])file=path.resolve(root,developmentVendor[url]);
 try{if(!(await stat(file)).isFile())throw Error('not file')}catch{if(root===process.cwd())file=path.resolve(root,'public','.'+url)}
 const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(bytes);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log(`Dollhouse at http://127.0.0.1:${port}`));
