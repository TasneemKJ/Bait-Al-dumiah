"""Real DOM regression tests for UI, independent of WebGL availability."""
from pathlib import Path
import re,json,os
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ.get('UI_SOURCE_DIR',Path(__file__).resolve().parents[1]))

def contrast(a,b):
 def light(rgb):
  values=[float(x)/255 for x in re.findall(r'[\d.]+',rgb)[:3]]
  values=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in values]
  return sum(x*w for x,w in zip(values,[.2126,.7152,.0722]))
 x,y=sorted([light(a),light(b)])
 return (y+.05)/(x+.05)

with sync_playwright() as p:
 options={'headless':True}
 if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**options)
 page=browser.new_page(viewport={'width':1440,'height':1000})
 css='\n'.join(((ROOT/'src'/name).read_text() if (ROOT/'src'/name).exists() else '') for name in ['styles.css','accessibility.css','visual-upgrade.css','doll-portraits.css','gameplay.css','activities.css'])
 page.set_content('<html><head><meta name="theme-color" content="#fff"><style>'+css+'</style></head><body><div id="app"><canvas id="world"></canvas><div id="ui"></div></div></body></html>')
 modules={}
 for name in ['content','simulation','i18n','icons','resident-portraits','activities-ui','ui','render/room-views']:
  file=ROOT/'src'/f'{name}.js'
  if not file.exists():continue
  source=file.read_text()
  if name.startswith('render/'):source=source.replace("from '../","from './")
  source=re.sub(r'from\s*([\'"])\./([^\'"]+)\1',lambda m:'from "fixture/'+m[2]+'"',source)
  modules['fixture/'+name+'.js']=source
 page.evaluate('''async modules=>{
  const imports={};for(const [id,source] of Object.entries(modules))imports[id]=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);
  const {createState}=await import('fixture/simulation.js');const {createUI}=await import('fixture/ui.js');
  window.fixtureState=createState();window.fixtureUI=createUI(document.querySelector('#ui'),()=>fixtureState,(action,value)=>{window.lastAction={action,value};if(action==='panel-state')fixtureState.paused=Boolean(value&&value!=='activities')});
  try {const {createRoomViews}=await import('fixture/render/room-views.js');window.fixtureViews=createRoomViews(document.querySelector('#ui'),()=>fixtureState,id=>{window.lastAction={action:'focus-room',value:id}})} catch {}
 }''',modules)
 page.evaluate("fixtureUI.open('settings');fixtureUI.refresh();fixtureUI.close();fixtureUI.tick()")
 actual=page.locator('.dock [data-action="pause"]').get_attribute('aria-pressed')
 results=[{'name':'pause button follows effective state after settings close','passed':actual=='false','actual':actual}]
 page.evaluate('fixtureState.clock=120;fixtureUI.tick()');page.locator('#light-button').hover();page.wait_for_timeout(220)
 colors=page.locator('#light-button').evaluate('(el)=>[getComputedStyle(el).color,getComputedStyle(el).backgroundColor]')
 ratio=contrast(*colors)
 results.append({'name':'night light-toggle hover has 4.5:1 contrast','passed':ratio>=4.5,'contrast':round(ratio,2),'colors':colors})
 page.evaluate('window.fixtureViews?.update()')
 buttons=page.locator('.room-views button')
 results.append({'name':'four distinct room closeup controls are present','passed':buttons.count()==4})
 if buttons.count()==4:
  page.locator('[data-room=studio]').click()
  results.append({'name':'closeup control dispatches stable room ID','passed':page.evaluate('lastAction.action==="focus-room" && lastAction.value==="studio"')})
  page.set_viewport_size({'width':390,'height':844})
  bounds=buttons.evaluate_all('(els)=>els.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))')
  results.append({'name':'room closeup controls meet mobile 44px targets','passed':all(b['width']>=44 and b['height']>=44 for b in bounds)})
  page.evaluate("fixtureUI.open('decorate')")
  page.locator('[data-action=choose-item][data-id=plant]').click()
  page.evaluate('fixtureViews.update()')
  results.append({'name':'room navigation never covers decoration placement controls','passed':not page.locator('.room-views').is_visible()})
  page.locator('[data-action=placement-cancel]').click();page.evaluate('fixtureViews.update()')
  results.append({'name':'room navigation returns after placement cancellation','passed':page.locator('.room-views').is_visible()})
  page.evaluate("fixtureState.settings.locale='ar';fixtureUI.refresh();fixtureViews.update()")
  results.append({'name':'room buttons survive HUD rebuilds and translate to Arabic','passed':page.locator('.room-views button').count()==4 and page.locator('[data-room=kitchen]').get_attribute('aria-label')=='مطبخ الشاي' and 'المطبخ' in page.locator('.room-views').inner_text()})
  for locale in ['en','ar']:
   page.evaluate("locale=>{fixtureState.settings.locale=locale;fixtureUI.refresh();fixtureViews.update()}",locale)
   readable=page.locator('.room-views .room-short').evaluate_all('(els)=>els.length===4&&els.every(e=>getComputedStyle(e).display!=="none"&&parseFloat(getComputedStyle(e).fontSize)>=10.5&&e.getBoundingClientRect().width<=e.parentElement.getBoundingClientRect().width)')
   results.append({'name':f'{locale} phone room names are visible without tiny type or overflow','passed':readable})
  for height in [390,320]:
   page.set_viewport_size({'width':844,'height':height})
   overlaps=page.evaluate("""()=>{
    const a=document.querySelector('.room-views').getBoundingClientRect();
    return ['.time-tools','.house-status','.camera-tools','.objective','.dock'].filter(selector=>{const b=document.querySelector(selector).getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top})
   }""")
   results.append({'name':f'landscape {height}px room controls do not obscure other HUD controls','passed':not overlaps,'overlaps':overlaps})
 page.set_viewport_size({'width':1440,'height':1000})
 page.evaluate("fixtureState.settings.locale='en';fixtureState.achieved=['first-care'];fixtureUI.refresh();fixtureUI.open('journal');fixtureUI.toast('Milestone reward collected')")
 page.locator('#sheet [data-action="claim"]').click()
 results.append({'name':'collecting in an open sheet keeps its notice visible after re-render','passed':page.locator('#sheet .panel-notice').inner_text()=='Milestone reward collected' and page.evaluate('lastAction.action==="claim" && lastAction.value==="first-care"')})
 page.evaluate("fixtureUI.close();fixtureUI.open('journal')")
 results.append({'name':'reopening a sheet does not repeat a stale notice','passed':page.locator('#sheet .panel-notice').count()==0})
 page.evaluate("fixtureUI.close();fixtureState.wishes=['lina','noor','sami'];fixtureState.decor=[{id:1,item:'plant',room:'kitchen',slot:0}];fixtureState.achieved=[];fixtureState.clock=130;fixtureState.lastSecretDay=fixtureState.day;fixtureState.activities.mastery.tea=1;fixtureUI.tick()")
 results.append({'name':'after tonight\'s whisper the objective points to morning, not a dead end','passed':page.evaluate('fixtureUI.objective().action==="light"')})
 page.evaluate("fixtureUI.close();fixtureState.settings.locale='en';fixtureUI.refresh()")
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');fixtureState.paused=false;sim.beginActivity(fixtureState,'tea');for(const c of fixtureState.activities.active.pattern)sim.activityInput(fixtureState,c);fixtureUI.open('activities');}''')
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');for(let i=0;i<21;i++)sim.step(fixtureState,1);fixtureUI.tick()}''')
 results.append({'name':'ritual reward button updates after cooldown while sheet stays open','passed':'Play' in page.locator('.ritual-card [data-id="tea"]').inner_text()})
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');sim.beginActivity(fixtureState,'tea');fixtureUI.setActivityResult(null);document.querySelector('[data-choice]').focus();let result;for(const c of fixtureState.activities.active.pattern)result=sim.activityInput(fixtureState,c);fixtureUI.setActivityResult(result);}''')
 results.append({'name':'ritual completion retains meaningful keyboard focus in its result','passed':page.evaluate('document.activeElement.matches(".ritual-result button")')})
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');fixtureState.activities.completed.tea=2;fixtureState.dayTime=61;fixtureState.clock=239;sim.step(fixtureState,1);fixtureUI.tick()}''')
 results.append({'name':'fresh dawn updates activity cap without reopening the sheet','passed':'Both rewards' not in page.locator('.ritual-card').first.inner_text()})
 page.evaluate('fixtureUI.close()')
 for locale in ['en','ar']:
  page.set_viewport_size({'width':320,'height':740})
  page.evaluate("locale=>{fixtureState.settings.locale=locale;fixtureUI.refresh();fixtureViews.update()}",locale)
  valid=page.locator('.dock button').evaluate_all('(els)=>els.every(e=>{const b=e.getBoundingClientRect();return b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth})')
  results.append({'name':f'320px {locale} dock stays in bounds with 44px targets','passed':valid})
 print(json.dumps(results,indent=2));browser.close()
 if any(not r['passed'] for r in results):raise SystemExit(1)
