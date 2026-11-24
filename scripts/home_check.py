"""Home screen gate (2026-11-24 redesign): every text line on Home reads at WCAG AA on the pixels really drawn
behind it, at eight phone and iPad sizes, in English and Arabic, for a new player (morning), a returning player
(night, restored house, keepsakes) and the Preferences view. It also checks that the controls are 44pt and
inside the screen, that no word box overlaps another, that nothing scrolls sideways, and that the iPad gets
iPad type. HOME_SIZES=1366x1024,... narrows the sizes. Serves dist/ (`npm run build:debug` first). Honours PORT (default 4419) and CHROMIUM_PATH.
Contrast: each line's ink against the worst pixel in its boxes with the glyphs hidden (caption_contrast.py).
"""
import json,os,subprocess,sys,time,urllib.request
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from caption_contrast import decode_png,ratio,parse_colour,AA
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];PORT=os.environ.get('PORT','4419');URL=f'http://127.0.0.1:{PORT}/?debug=1'
SIZES=[(375,667),(390,844),(430,932),(768,1024),(820,1180),(1024,1366),(1366,1024),(844,390)]
if os.environ.get('HOME_SIZES'):SIZES=[tuple(map(int,s.split('x'))) for s in os.environ['HOME_SIZES'].split(',')]
SEED='''import {createState,place} from './src/simulation.js';import {SAVE_KEY} from './src/content.js';
const s=createState();s.introSeen=true;s.day=12;s.elapsed=2200;s.clock=150;s.buttons=900;s.cares=180;s.streak=6;
s.restoration={kitchen:3,parlor:3,studio:3,bedroom:3};s.story={chapter:3,step:0,lastAction:null,lastActionAt:-10};
for(const a of [['lamp','parlor',0],['plant','kitchen',1],['rug','bedroom',0],['bear','studio',2]])place(s,...a);
console.log(JSON.stringify({key:SAVE_KEY,value:JSON.stringify(s)}));'''
TEXT='#home .home-title>span,#home .home-preferences-title,#home button,#home .home-notice'
PROBE='''([mode,selector])=>{let style=document.getElementById('home-check');
 if(mode==='off'){style?.remove();return true}
 if(!style){style=document.createElement('style');style.id='home-check';document.head.append(style)}
 style.textContent=mode==='bare'?selector+'{color:transparent!important;text-shadow:none!important}':'';
 if(mode!=='hold')return true;
 return [...document.querySelectorAll(selector)].filter(n=>n.offsetParent&&n.textContent.trim()).map(n=>{
  const range=document.createRange();range.selectNodeContents(n);const b=n.getBoundingClientRect();
  return {text:n.textContent.trim().slice(0,40),ink:getComputedStyle(n).color,button:n.tagName==='BUTTON',
   font:parseFloat(getComputedStyle(n).fontSize),box:{x:b.left,y:b.top,w:b.width,h:b.height},
   rects:[...range.getClientRects()].filter(r=>r.width>1&&r.height>1).map(r=>({x:r.left,y:r.top,w:r.width,h:r.height}))}})}'''

def worst_contrast(rows,line,W,H):
 """The line's worst ratio over the pixels in its boxes, from one bare screenshot of the whole view."""
 ink=parse_colour(line['ink']);worst=None;seen=set()
 for r in line['rects']:
  x0,y0=max(0,int(r['x'])),max(0,int(r['y']));x1,y1=min(W,int(r['x']+r['w']+.999)),min(H,int(r['y']+r['h']+.999))
  for row in rows[y0:y1]:
   for pixel in set(row[x0:x1])-seen:
    seen.add(pixel);value=ratio(ink,pixel)
    if worst is None or value<worst:worst=value
 return worst

def overlap(a,b):
 return min(a['x']+a['w'],b['x']+b['w'])-max(a['x'],b['x'])>2 and min(a['y']+a['h'],b['y']+b['h'])-max(a['y'],b['y'])>2

def check_view(page,name,W,H,failures,report):
 page.evaluate(PROBE,['off',TEXT]);lines=page.evaluate(PROBE,['hold',TEXT]);page.evaluate(PROBE,['bare',TEXT])
 page.wait_for_timeout(60)
 try:
  rows=decode_png(page.screenshot())
  for line in lines:
   value=worst_contrast(rows,line,W,H);report.append((name,line['text'],round(value or 0,2)))
   print(f'  {name} {line["text"]!r} {round(value or 0,2)}',flush=True)
   if value is None or value<AA:failures.append(f'{name}: "{line["text"]}" contrast {value}')
 finally:page.evaluate(PROBE,['off',TEXT])
 for line in lines:
  b=line['box']
  if b['x']<-1 or b['y']<-1 or b['x']+b['w']>W+1 or b['y']+b['h']>H+1:failures.append(f'{name}: "{line["text"]}" off screen')
  if line['button'] and (b['h']<44 or b['w']<44):failures.append(f'{name}: "{line["text"]}" under 44pt')
 boxes=[l['box'] for l in lines]
 for i in range(len(boxes)):
  for j in range(i+1,len(boxes)):
   if overlap(boxes[i],boxes[j]):failures.append(f'{name}: "{lines[i]["text"]}" overlaps "{lines[j]["text"]}"')
 if page.evaluate('document.documentElement.scrollWidth>innerWidth'):failures.append(f'{name}: scrolls sideways')
 if W>=700 and H>=700 and 'prefs' not in name:
  title=next((l for l in lines if l['text'] and not l['button']),None)
  play=next((l for l in lines if l['button']),None)
  if not title or title['font']<52:failures.append(f'{name}: iPad title under 52px ({title and title["font"]})')
  if not play or play['box']['h']<64:failures.append(f'{name}: iPad Play under 64px tall')

def main():
 seed=json.loads(subprocess.run(['node','--input-type=module','-e',SEED],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
 server=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':PORT},stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
 failures,report=[],[]
 try:
  for _ in range(100):
   try:urllib.request.urlopen(URL,timeout=1);break
   except Exception:time.sleep(.1)
  options={'headless':True,'args':['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  with sync_playwright() as p:
   browser=p.chromium.launch(**options)
   for W,H in SIZES:
    for lang in ['en','ar']:
     for kind in ['new','returning']:
      ctx=browser.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=min(W,H)<700,
        locale='ar-SA' if lang=='ar' else 'en-US')
      if kind=='returning':
       value=json.loads(seed['value']);value['settings']['locale']=lang;value['settings']['reducedMotion']=True
       ctx.add_init_script('localStorage.setItem('+json.dumps(seed['key'])+','+json.dumps(json.dumps(value))+')')
      page=ctx.new_page();page.goto(URL,wait_until='networkidle')
      print('home_check:',kind,lang,W,H,flush=True)
      page.wait_for_function('window.dollhouse && !document.querySelector("#loading")',timeout=180000)
      page.wait_for_timeout(1500);name=f'{kind}-{lang}-{W}x{H}'
      check_view(page,name,W,H,failures,report)
      page.locator('#home [data-home-action="preferences"]').click();page.wait_for_timeout(200)
      check_view(page,'prefs-'+name,W,H,failures,report)
      ctx.close()
   browser.close()
 finally:server.terminate()
 low=min(report,key=lambda r:r[2]) if report else None
 print(f'home_check: {len(report)} text lines measured; lowest {low}')
 for f in failures:print('FAIL',f)
 if failures:sys.exit(1)
 print('home_check: PASS')

if __name__=='__main__':main()
