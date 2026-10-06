"""Contrast and tap-target audit (local, private port). For every visible leaf text in the
home view and in the Settings sheet it measures WCAG contrast of the computed text colour
against the pixels actually behind it (text is made transparent, a screenshot is taken and the
median background in the text box is sampled), interactive elements must also be hit-testable; pointer-events:none HUD text is measured wherever it is on screen (a modal sheet hides the HUD).
It also measures every visible control against 44 CSS px. EN and AR, 360x640, 390x844,
844x390, Larger text off and on. Usage: PORT=4391 CHROMIUM_PATH=... python3 scripts/a11y_audit.py
Writes artifacts/a11y.json and prints counts plus the worst offenders."""
import json,os,statistics,subprocess,time,urllib.request,io
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
PORT=os.environ.get('PORT','4391');BASE=f'http://127.0.0.1:{PORT}'
VIEWS=[(360,640)] if os.environ.get('A11Y_SELFTEST') else [(360,640),(390,844),(844,390)]
SAVE={'version':1,'day':2,'clock':60,'elapsed':300,'cares':8,'hints':{'night':True,'calm':True}}
def lum(c):
 c=[x/255 for x in c[:3]];c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c];return .2126*c[0]+.7152*c[1]+.0722*c[2]
def ratio(a,b):
 x,y=sorted([lum(a),lum(b)]);return (y+.05)/(x+.05)
JS_TEXT='''()=>{const out=[];const all=[...document.querySelectorAll('#ui *, #loading *')];
for(const e of all){if(e.closest('svg'))continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)===0)continue;
 let own='';for(const n of e.childNodes)if(n.nodeType===3)own+=n.textContent;own=own.trim();if(!own)continue;
 const r=e.getBoundingClientRect();if(r.width<2||r.height<2||r.right<0||r.bottom<0||r.left>innerWidth||r.top>innerHeight)continue;
 const cx=Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),cy=Math.min(innerHeight-1,Math.max(0,r.top+r.height/2));
 const modal=document.querySelector('#sheet[open]');if(modal&&!e.closest('#sheet'))continue;
 if(cs.pointerEvents!=='none'){const hit=document.elementFromPoint(cx,cy);if(!hit||!(hit===e||e.contains(hit)||hit.contains(e)))continue}
 const sh=e.closest('#sheet');if(sh){const q=sh.getBoundingClientRect();if(cx<q.left||cx>q.right||cy<q.top||cy>q.bottom)continue}
 let op=1;for(let n=e;n&&n!==document.body;n=n.parentElement)op*=parseFloat(getComputedStyle(n).opacity);
 out.push({text:own.slice(0,40),sel:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''),color:cs.color,op,size:parseFloat(cs.fontSize),weight:parseInt(cs.fontWeight)||400,x:r.left,y:r.top,w:r.width,h:r.height})}
return out}'''
JS_CTRL='''()=>{const out=[];for(const e of document.querySelectorAll('#ui button,#ui a[href],#ui select,#ui input,#ui [role=button],#ui summary')){
 const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||e.disabled&&false)continue;
 let el=e,hidden=false;for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'){hidden=true;break}}
 const r=e.getBoundingClientRect();if(hidden||r.width<1||r.height<1)continue;
 if(e.type==='checkbox'||e.type==='file'){const l=e.closest('label');const lr=l?l.getBoundingClientRect():r;out.push({sel:e.tagName.toLowerCase()+'['+e.type+']',label:(l?.textContent||'').trim().slice(0,30),w:lr.width,h:lr.height});continue}
 out.push({sel:e.tagName.toLowerCase()+(e.dataset.action?'['+e.dataset.action+']':''),label:(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,30),w:r.width,h:r.height})}
return out}'''
def run():
 srv=subprocess.Popen(['node','scripts/serve.mjs','dist'],cwd=ROOT,env={**os.environ,'PORT':PORT},stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 res={'contrast':[],'targets':[],'texts':0,'ctrls':0};errs=[]
 try:
  with sync_playwright() as p:
   opts={'headless':True,'args':['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
   if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
   b=p.chromium.launch(**opts)
   for w,h in VIEWS:
    for loc in ('en','ar'):
     for big,night in ((False,False),(True,False),(False,True),(True,True)) if not os.environ.get('A11Y_SELFTEST') else ((False,False),):
      c=b.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,device_scale_factor=1);pg=c.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
      st=dict(SAVE);st['clock']=150 if night else 60;st['settings']={'locale':loc,'muted':True,'reducedMotion':True,'quality':'low','largeText':big}
      pg.add_init_script("localStorage.setItem('bait-al-dumiah.v1',%s)"%json.dumps(json.dumps(st)))
      pg.goto(BASE+'/?debug=1');pg.wait_for_selector('[data-action="toggle-tools"]',timeout=120000);pg.wait_for_timeout(2500)
      if os.environ.get('A11Y_SELFTEST'):pg.add_style_tag(content='.house-status strong{color:#e8dcc8!important}.dock button{min-height:30px!important}')
      for state in ('home','settings'):
       if state=='settings':
        pg.locator('[data-action="toggle-tools"]').click();pg.locator('[data-action="panel-settings"]').click();pg.wait_for_timeout(600)
       tag=f'{loc}-{w}x{h}-{"big" if big else "std"}-{"night" if night else "day"}-{state}'
       texts=pg.evaluate(JS_TEXT);ctrls=pg.evaluate(JS_CTRL)
       pg.add_style_tag(content='#ui *,#ui *::before,#ui *::after{color:transparent!important;text-shadow:none!important;caret-color:transparent!important}svg.icon{opacity:0!important}')
       pg.wait_for_timeout(150)
       img=Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
       pg.evaluate("document.querySelectorAll('style').forEach(s=>{if(s.textContent.includes('color:transparent!important'))s.remove()})")
       for t in texts:
        x0,y0=max(0,int(t['x'])),max(0,int(t['y']));x1,y1=min(w,int(t['x']+t['w'])),min(h,int(t['y']+t['h']))
        if x1-x0<2 or y1-y0<2:continue
        px=list(img.crop((x0,y0,x1,y1)).getdata());bg=tuple(int(statistics.median(ch)) for ch in zip(*px))
        import re
        m=[float(v) for v in re.findall(r'[\d.]+',t['color'])];fg=m[:3];a=(m[3] if len(m)>3 else 1)*t['op']
        fgc=tuple(a*f+(1-a)*g for f,g in zip(fg,bg));r=ratio(fgc,bg)
        large=t['size']>=24 or (t['size']>=18.66 and t['weight']>=700);need=3 if large else 4.5
        res['texts']+=1
        if r<need:res['contrast'].append({'view':tag,'text':t['text'],'sel':t['sel'],'ratio':round(r,2),'need':need,'size':t['size'],'fg':[round(v) for v in fgc],'bg':list(bg)})
       for cdef in ctrls:
        res['ctrls']+=1
        if min(cdef['w'],cdef['h'])<43.5:res['targets'].append({'view':tag,**{k:(round(v,1) if isinstance(v,float) else v) for k,v in cdef.items()}})
       if state=='settings':pg.locator('#sheet [data-action="close"]').click()
      c.close()
   b.close()
 finally:srv.terminate()
 res['errors']=errs;return res
if __name__=='__main__':
 r=run();(OUT/'a11y.json').write_text(json.dumps(r,indent=1,ensure_ascii=False))
 uniq=lambda L,k:{tuple(x[i] for i in k) for x in L}
 print('texts measured',r['texts'],'| contrast failures',len(r['contrast']),'unique',len(uniq(r['contrast'],['sel','text'])))
 print('controls measured',r['ctrls'],'| under 44px',len(r['targets']),'unique',len(uniq(r['targets'],['sel','label'])))
 seen=set()
 for x in sorted(r['contrast'],key=lambda x:x['ratio']):
  k=(x['sel'],x['text'])
  if k in seen:continue
  seen.add(k);print('C',x['ratio'],'/',x['need'],x['sel'],repr(x['text']),x['view'],x['fg'],x['bg'])
  if len(seen)>=30:break
 seen=set()
 for x in sorted(r['targets'],key=lambda x:min(x['w'],x['h'])):
  k=(x['sel'],x['label'])
  if k in seen:continue
  seen.add(k);print('T',x['w'],'x',x['h'],x['sel'],repr(x['label']),x['view'])
  if len(seen)>=30:break
 print('errors',r['errors'])
