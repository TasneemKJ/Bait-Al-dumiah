"""Real DOM regression tests for UI, independent of WebGL availability."""
from pathlib import Path
import re,json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]

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
 css='\n'.join((ROOT/'src'/name).read_text() for name in ['styles.css','accessibility.css'])
 page.set_content('<html><head><meta name="theme-color" content="#fff"><style>'+css+'</style></head><body><div id="app"><canvas id="world"></canvas><div id="ui"></div></div></body></html>')
 modules={}
 for name in ['content','simulation','i18n','icons','ui']:
  source=(ROOT/'src'/f'{name}.js').read_text()
  source=re.sub(r'from\s*([\'"])\./([^\'"]+)\1',lambda m:'from "fixture/'+m[2]+'"',source)
  modules['fixture/'+name+'.js']=source
 page.evaluate('''async modules=>{
  const imports={};for(const [id,source] of Object.entries(modules))imports[id]=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);
  const {createState}=await import('fixture/simulation.js');const {createUI}=await import('fixture/ui.js');
  window.fixtureState=createState();window.fixtureUI=createUI(document.querySelector('#ui'),()=>fixtureState,(action,value)=>{if(action==='panel-state')fixtureState.paused=Boolean(value)});
 }''',modules)
 page.evaluate("fixtureUI.open('settings');fixtureUI.refresh();fixtureUI.close();fixtureUI.tick()")
 actual=page.locator('.dock [data-action="pause"]').get_attribute('aria-pressed')
 results=[{'name':'pause button follows effective state after settings close','passed':actual=='false','actual':actual}]
 page.evaluate('fixtureState.clock=120;fixtureUI.tick()');page.locator('#light-button').hover();page.wait_for_timeout(220)
 colors=page.locator('#light-button').evaluate('(el)=>[getComputedStyle(el).color,getComputedStyle(el).backgroundColor]')
 ratio=contrast(*colors)
 results.append({'name':'night light-toggle hover has 4.5:1 contrast','passed':ratio>=4.5,'contrast':round(ratio,2),'colors':colors})
 print(json.dumps(results,indent=2));browser.close()
 if any(not r['passed'] for r in results):raise SystemExit(1)
