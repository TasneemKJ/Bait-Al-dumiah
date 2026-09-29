"""Same-camera studies of the actual garment/prop components, not gameplay shots.
The ordinary gameplay and atmosphere suites remain independent mandatory gates.
"""
import io, json, os, subprocess, tarfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/craft';OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:4191'
BEFORE=os.environ.get('ART_BASELINE','967feea3d9582801e07fe3c87f4d4c5d839ef1f4')
results=[];errors=[]
archive=subprocess.check_output(['git','archive',BEFORE,'src'],cwd=ROOT)
with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
 baseline={m.name:tar.extractfile(m).read().decode('utf-8') for m in tar.getmembers() if m.isfile() and m.name.endswith('.js')}
server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':'4191'},stdout=subprocess.DEVNULL)
HTML='''<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#f1e6d7;color:#574451;font:15px Georgia}canvas{display:block;width:1000px;height:800px}
header{position:absolute;top:25px;left:30px}small{display:block;font:10px sans-serif;letter-spacing:1.5px;margin-top:8px}
</style><script type="importmap">{"imports":{"three":"/vendor/three.module.min.js"}}</script></head>
<body><header><span id="label"></span><small>ACTUAL GAME COMPONENTS · FIXED-LIGHT MATERIAL STUDY</small></header><canvas id="craft"></canvas></body></html>'''
SETUP='''async()=>{
 const T=await import('three'),{createDolls}=await import('/src/render/dolls.js');
 const {createState}=await import('/src/simulation.js'),{cup,box,ring,palette}=await import('/src/render/primitives.js');
 const scene=new T.Scene();scene.background=new T.Color(0xf1e6d7);
 const group=new T.Group();scene.add(group);const view=createDolls(group),state=createState();
 state.settings.reducedMotion=true;view.update(state,0,null,0);
 for(const d of view.dolls){d.root.position.set(0,0,0);d.root.visible=false;d.halo.visible=false;}
 const renderer=new T.WebGLRenderer({canvas:document.querySelector('#craft'),antialias:true});
 renderer.setSize(1000,800,false);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const camera=new T.OrthographicCamera(-.6,.6,.48,-.48,.01,30);
 scene.add(new T.HemisphereLight(0xfff0df,0xa391a4,1.5));
 const key=new T.DirectionalLight(0xffe8ce,2.8);key.position.set(-3,5,5);scene.add(key);
 const fill=new T.DirectionalLight(0xc6d6e8,1.1);fill.position.set(3,2,3);scene.add(fill);
 const tea=new T.Group();scene.add(tea);cup(tea,0,0,0);
 box(tea,0,-.038,0,.44,.042,.32,palette.wood,true);
 ring(tea,.15,-.013,.01,.038,.006,palette.gold,true);
 const labels={lina:'Lina · rose cloth and embroidered linen',noor:'Noor · sage cloth and embroidered linen',sami:'Sami · indigo cloth, braces and brass',tea:'Painted tea ware · waxed walnut · brushed brass'};
 window.craftStudy={render(id){
  view.dolls.forEach(d=>{d.root.visible=d.id===id;d.root.rotation.y=-.08});tea.visible=id==='tea';
  const span=id==='tea'?.215:.385,target=id==='tea'?.055:.665;
  camera.left=-span*1.25;camera.right=span*1.25;camera.top=span;camera.bottom=-span;
  camera.position.set(id==='tea'?.16:0,target+(id==='tea'?.19:.07),id==='tea'?1.4:6);
  camera.lookAt(0,target,0);camera.updateProjectionMatrix();renderer.render(scene,camera);
  document.querySelector('#label').textContent=labels[id];
  return {id,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures};
 }};
}'''
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**opts)
  for version in ['before','after']:
   context=browser.new_context(viewport={'width':1000,'height':800},device_scale_factor=1)
   page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.route(BASE+'/study',lambda route:route.fulfill(status=200,content_type='text/html',body=HTML))
   if version=='before':
    def old_source(route):
     path=route.request.url.removeprefix(BASE+'/').split('?')[0]
     if path not in baseline:raise AssertionError('Missing baseline module: '+path)
     route.fulfill(status=200,content_type='text/javascript',body=baseline[path])
    page.route(BASE+'/src/**',old_source)
   page.goto(BASE+'/study');page.evaluate(SETUP)
   for id in ['lina','noor','sami','tea']:
    metrics=page.evaluate('id=>craftStudy.render(id)',id)
    if metrics['triangles']<100:raise AssertionError('No actual component geometry rendered')
    metrics['version']=version;results.append(metrics)
    page.screenshot(path=str(OUT/f'{version}-{id}.png'),timeout=60000)
   context.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=10)
 (OUT/'results.json').write_text(json.dumps({'baseline':BEFORE,'views':results,'errors':errors},indent=2))
if errors:raise SystemExit(1)
print(json.dumps({'craft_views':len(results),'errors':errors}))
