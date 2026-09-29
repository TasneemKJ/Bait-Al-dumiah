"""Inspect actual resident models in a fixed Three.js studio, separately from gameplay.
The built-game suite remains mandatory. These images are model-inspection views,
not screenshots of the game's normal camera. Baseline comes from git, not a remake.
"""
import io, json, os, subprocess, tarfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/dolls';OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:4188'; BEFORE=os.environ.get('DOLL_BASELINE','f77a7eafc8e179cbc56fef8fcbec39b6e45811ab')
server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':'4188'},stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
html='''<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#f1e6d7;font:15px Georgia;color:#65505a}canvas{display:block;width:900px;height:900px}header{position:absolute;top:25px;left:30px}small{display:block;font:11px sans-serif;letter-spacing:1px;margin-top:7px}</style><script type="importmap">{"imports":{"three":"/vendor/three.module.min.js"}}</script></head><body><header><span id="label"></span><small>RESIDENT MODEL INSPECTION · ACTUAL GAME GEOMETRY</small></header><canvas id="model"></canvas></body></html>'''
setup='''async()=>{
 const T=await import('three');const {createDolls}=await import('/src/render/dolls.js');const {createState}=await import('/src/simulation.js');
 const scene=new T.Scene();scene.background=new T.Color(0xf1e6d7);const parent=new T.Group();scene.add(parent);const view=createDolls(parent),state=createState();
 const renderer=new T.WebGLRenderer({canvas:document.querySelector('#model'),antialias:true});renderer.setSize(900,900,false);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const camera=new T.OrthographicCamera(-1.02,1.02,1.02,-1.02,.1,50);
 scene.add(new T.HemisphereLight(0xfff0df,0xa391a4,1.5));const key=new T.DirectionalLight(0xffe8ce,2.8);key.position.set(-3,5,5);scene.add(key);const fill=new T.DirectionalLight(0xc6d6e8,1.1);fill.position.set(3,2,3);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(20,20),new T.MeshStandardMaterial({color:0xe7d8c6,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
 window.inspector={render(id='lina',action='idle',time=1.8,yaw=0,face=false){
  view.dolls.forEach(v=>{v.root.rotation.y=id==='all'?0:yaw});state.elapsed=time;state.settings.reducedMotion=action==='idle';state.dolls.forEach(d=>{d.action=d.id===id?action:'idle';d.lastCare=0;d.actionUntil=4});view.update(state,.1,id,0);
  view.dolls.forEach((v,i)=>{v.root.position.set(id==='all'?(i-1)*1.08:0,0,0);v.root.rotation.y=id==='all'?0:yaw;v.root.visible=id==='all'||v.id===id;v.halo.visible=false});
  const span=id==='all'?1.85:face?.43:1.02;camera.left=-span;camera.right=span;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();const target=face?1.11:.77;camera.position.set(0,target+.12,8);camera.lookAt(0,target,0);renderer.render(scene,camera);
  document.querySelector('#label').textContent=(id==='all'?'Lina · Noor · Sami':id[0].toUpperCase()+id.slice(1))+' — '+action;
  let invalid=0;parent.traverse(o=>{if(![...o.position,...o.scale,...o.quaternion].every(Number.isFinite))invalid++});
  return {id,action,invalid,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};
 }};
}'''
results=[];errors=[]
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**opts)
  versions=['after']
  try:
   archive=subprocess.check_output(['git','archive',BEFORE,'src'],cwd=ROOT,stderr=subprocess.DEVNULL)
   with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
    baseline={entry.name:tar.extractfile(entry).read().decode('utf-8') for entry in tar.getmembers() if entry.isfile() and entry.name.endswith('.js')}
   versions.insert(0,'before')
  except subprocess.CalledProcessError:baseline=None
  for version in versions:
   context=browser.new_context(viewport={'width':900,'height':900},device_scale_factor=1)
   page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.route(BASE+'/inspection',lambda route:route.fulfill(status=200,content_type='text/html',body=html))
   if version=='before':
    def original_source(route):
     path=route.request.url.removeprefix(BASE+'/').split('?')[0]
     if path not in baseline:raise AssertionError('Baseline module missing: '+path)
     route.fulfill(status=200,content_type='text/javascript',body=baseline[path])
    page.route(BASE+'/src/**',original_source)
   page.goto(BASE+'/inspection');page.evaluate(setup)
   samples=[('lina','idle',1.8,0,False),('noor','idle',1.8,0,False),('sami','idle',1.8,0,False),('lina','idle',1.8,.35,True),('all','idle',1.8,0,False)]
   if version=='after':samples += [('lina','tea',1.8,0,False),('noor','rest',1.8,0,False),('sami','play',1.8,0,False),('lina','soothe',1.8,0,False),('lina','tea',1.3,.42,True),('lina','tea',3.8,0,False)]
   for id,action,t,yaw,face in samples:
    label=f'{version}-{id}-{action}'+('-face' if face else '')+('-lowered' if t==3.8 else '')
    result=page.evaluate('(args)=>window.inspector.render(...args)',[id,action,t,yaw,face]);result['capture']=label;results.append(result)
    assert result['invalid']==0 and result['triangles']>1000, result
    page.screenshot(path=str(OUT/f'{label}.png'),timeout=60000)
   context.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=10)
 (OUT/'model-results.json').write_text(json.dumps({'baseline':BEFORE,'views':results,'errors':errors},indent=2))
if errors:raise SystemExit(1)
print(json.dumps({'model_views':len(results),'errors':errors}))
