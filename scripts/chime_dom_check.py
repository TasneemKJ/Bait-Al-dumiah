"""DOM/controller contract checks with an explicit mocked world-hit adapter.
No WebGL/pixel or browser-origin persistence claim is made by this fixture.
The separate chime_check.py uses actual rendered hits over HTTP.
"""
import json,os,posixpath,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,value):
 checks.append({'name':name,'passed':bool(value)})
 assert value,name
with sync_playwright() as p:
 opts={'headless':True}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 page=browser.new_page(viewport={'width':1280,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 css='\n'.join((ROOT/'src'/n).read_text() for n in ['styles.css','chime.css'])
 page.set_content('<html><head><style>'+css+'</style></head><body><div id="app"><canvas id="world" tabindex="0"></canvas><div id="ui"></div></div></body></html>')
 modules={}
 for path in (ROOT/'src').rglob('*.js'):
  name='fixture/'+path.relative_to(ROOT/'src').as_posix()
  modules[name]=re.sub(r'from\s*([\'"])(\.{1,2}/[^\'"]+)\1',lambda m:'from '+json.dumps(posixpath.normpath(posixpath.join(posixpath.dirname(name),m[2]))),path.read_text())
 page.evaluate('''async sources=>{
  const imports={};for(const [id,code] of Object.entries(sources))imports[id]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);
  window.sim=await import('fixture/simulation.js');const {createChimeUI}=await import('fixture/chime-ui.js');window.s=sim.createState();
  const host=document.querySelector('#ui'),canvas=document.querySelector('#world');
  window.commands=[];
  window.dispatch=(action,value)=>{
   commands.push(action);
   if(action==='chime-grab')sim.grabChime(s,value);if(action==='chime-pull')sim.pullChime(s,value);if(action==='chime-release')sim.releaseChime(s);if(action==='chime-cancel')sim.cancelChime(s);
   if(action==='chime-replay'){if(s.activities.active.phase==='finished'){sim.endActivity(s);sim.beginActivity(s,'lullaby')}else sim.replayChimes(s)}
   if(action==='chime-exit'){sim.endActivity(s);canvas.focus()}
  };
  window.controller=createChimeUI(host,canvas,()=>s,dispatch,{pick:(x,y)=>Math.abs(x-640)<24&&y<200?'moon':Math.min(3,Math.max(0,Math.floor((x-300)/160))),pullSpan:()=>80});
  sim.beginActivity(s,'lullaby');controller.update();canvas.focus();let last=performance.now();
  function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;controller.update(dt);sim.step(s,dt);requestAnimationFrame(frame)}requestAnimationFrame(frame);
 }''',modules)
 page.wait_for_function("s.activities.active.phase==='echo'")
 page.mouse.click(340,400)
 check('a plain pointer tap cannot advance the song',page.evaluate('s.activities.active.cursor===0&&s.activities.active.held===null'))
 page.mouse.move(340,400);page.mouse.down();page.mouse.move(340,440)
 check('DOM pointer input owns a real simulation pull',page.evaluate('s.activities.active.held===0&&s.activities.active.pull===.5'))
 page.mouse.move(-10,440);page.mouse.up()
 check('outside release cancels without playing a note',page.evaluate('s.activities.active.cursor===0&&s.activities.active.held===null'))
 page.keyboard.down('Space');page.wait_for_function('s.activities.active.pull>=.3');page.keyboard.up('Space')
 check('keyboard hold/release uses the same validated physical completion step',page.evaluate('s.activities.active.cursor===1'))
 # This fixture tests input ownership, not the musical task: use the authored
 # pattern to send subsequent real keyboard gestures, with no progress writes.
 selected=0
 pattern=page.evaluate('s.activities.active.pattern')
 for note in list(reversed(pattern))[1:]:
  while selected!=note:page.keyboard.press('ArrowRight');selected=(selected+1)%4
  page.keyboard.down('Space');page.wait_for_function('s.activities.active.pull>=.3');page.keyboard.up('Space')
 check('physical keyboard play ends with retained finished state and one reward',page.evaluate('s.activities.active.phase==="finished"&&s.activities.mastery.lullaby===1&&s.buttons===43'))
 check('completed work offers no answer buttons or modal',page.locator('[data-choice],dialog[open]').count()==0 and page.locator('.chime-playfield button').count()==1)
 for locale in ['en','ar']:
  for width,height in [(320,568),(390,844),(667,320),(844,390)]:
   page.set_viewport_size({'width':width,'height':height});page.evaluate("locale=>{s.settings.locale=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';controller.update()}",locale)
   value=page.locator('.chime-work-strip').evaluate('(e)=>{const b=e.getBoundingClientRect(),x=e.querySelector("button").getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.bottom<=innerHeight&&x.width>=44&&x.height>=44&&e.scrollHeight<=e.clientHeight+1}')
   check(f'{locale} work strip and exit fit {width}x{height} with 44px target',value)
 page.locator('.chime-exit').click();page.wait_for_function('s.activities.active===null')
 check('leaving restores canvas focus and its non-application role',page.evaluate('document.activeElement.id==="world"&&!document.querySelector("#world").hasAttribute("role")'))
 check('controller journey has zero JavaScript errors',not errors)
 browser.close()
out=ROOT/'artifacts/chime-dom-checks.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(checks,indent=2));print(json.dumps({'passed':len(checks),'total':len(checks)},indent=2))
