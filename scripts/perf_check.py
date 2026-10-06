"""Phone performance budget check: 390x844 touch, 4x CPU throttle, built game over HTTP.
Software WebGL (SwiftShader) rasterises on the CPU, so wall-clock frame time here measures the
software GPU, not a phone. The gated frame budget is the median CPU time of one animation-frame callback (simulation,
scene update and WebGL command submission) under 4x CPU throttle, which models a mid-range
phone's CPU cost; 33 ms keeps 30 fps headroom. TaskDuration and SwiftShader frame time are reported
for information only: a CPU profile shows the main thread about 96% idle, waiting on the software GPU. Writes artifacts/perf.json."""
import json,os,subprocess,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from game_entry import enter_game
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
PORT=os.environ.get('PORT','4177');BASE=os.environ.get('PLAY_URL',f'http://127.0.0.1:{PORT}')
BUDGET={'dist_kb':2048,'ready_s':25,'triangles':400000,'calls':388,'frame_cpu_ms':33}
def dist_kb():return round(sum(f.stat().st_size for f in (ROOT/'dist').rglob('*') if f.is_file())/1024)
server=None
if not os.environ.get('PLAY_URL'):
 server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':PORT},stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
result={'budget':BUDGET}
try:
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  b=p.chromium.launch(**opts);c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=3);pg=c.new_page()
  cdp=c.new_cdp_session(pg);cdp.send('Emulation.setCPUThrottlingRate',{'rate':4});cdp.send('Performance.enable')
  # Time each animation-frame callback: the game's CPU cost per frame, independent of how slowly SwiftShader presents.
  pg.add_init_script('''(()=>{const raf=window.requestAnimationFrame.bind(window);window.__frameCost=[];window.requestAnimationFrame=cb=>raf(ts=>{const t0=performance.now();try{cb(ts)}finally{window.__frameCost.push(performance.now()-t0)}})})()''')
  errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  t=time.time();pg.goto(BASE+'/?debug=1');pg.wait_for_function('window.dollhouse?.state && !document.querySelector("#loading")',timeout=180000);enter_game(pg);result['ready_s']=round(time.time()-t,2)
  pg.wait_for_timeout(2000);pg.evaluate('window.__frameCost.length=0')
  metrics=lambda:{m['name']:m['value'] for m in cdp.send('Performance.getMetrics')['metrics']};m0=metrics()
  frames=pg.evaluate('''()=>new Promise(r=>{const out=[];let last=performance.now();const end=last+5000;function f(now){out.push(now-last);last=now;if(now<end)requestAnimationFrame(f);else r(out)}requestAnimationFrame(f)})''')
  pg.wait_for_function('window.__frameCost.length>=12',timeout=120000);cost=sorted(pg.evaluate('window.__frameCost'));result['frame_cpu_ms']=round(cost[len(cost)//2],1);result['frame_cpu_p90_ms']=round(cost[int(len(cost)*.9)],1);result['frame_samples']=len(cost)
  m1=metrics();n=max(1,len(frames)-1);result['task_per_frame_ms']=round((m1['TaskDuration']-m0['TaskDuration'])*1000/n,1);result['script_per_frame_ms']=round((m1['ScriptDuration']-m0['ScriptDuration'])*1000/n,1)
  frames=sorted(frames[1:]) or [0];result['swiftshader_median_frame_ms']=round(frames[len(frames)//2],1);result['swiftshader_p90_frame_ms']=round(frames[int(len(frames)*.9)],1);result['frames']=len(frames)
  stats=pg.evaluate('window.dollhouse.stats()');result['triangles']=stats['triangles'];result['calls']=stats['calls'];result['errors']=errors
  b.close()
 result['dist_kb']=dist_kb()
 result['failed']=[k for k in BUDGET if result.get(k) is None or result[k]>BUDGET[k]]+(['errors'] if result.get('errors') else [])
finally:
 if server:server.terminate()
(OUT/'perf.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
raise SystemExit(1 if result.get('failed') else 0)
