"""Real DOM regression tests for UI, independent of WebGL availability."""
from pathlib import Path
import re,json,os,posixpath
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
 # Mirror production CSS order and resolve the complete source graph. A new
 # simulation dependency must never silently disappear from this DOM fixture.
 css_names=re.findall(r'<link[^>]+href="\./src/([^"<>]+\.css)"',(ROOT/'index.html').read_text())
 css='\n'.join((ROOT/'src'/name).read_text() for name in css_names)
 page.set_content('<html><head><meta name="theme-color" content="#fff"><style>'+css+'</style></head><body><div id="app"><canvas id="world"></canvas><div id="ui"></div></div></body></html>')
 modules={}
 for file in (ROOT/'src').rglob('*.js'):
  name='fixture/'+file.relative_to(ROOT/'src').as_posix()
  def resolve(match):
   target=posixpath.normpath(posixpath.join(posixpath.dirname(name),match[2]))
   return 'from '+json.dumps(target)
  modules[name]=re.sub(r'from\s*([\'\"])(\.{1,2}/[^\'\"]+)\1',resolve,file.read_text())
 # A household past its first care: a new house's first clue is Lina's wish (dfbae13); these checks read the story clue.
 page.evaluate('''async modules=>{
  const imports={};for(const [id,source] of Object.entries(modules))imports[id]=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);
  const {createState}=await import('fixture/simulation.js');const {createUI}=await import('fixture/ui.js');
  window.fixtureState=createState();fixtureState.cares=1;window.fixtureUI=createUI(document.querySelector('#ui'),()=>fixtureState,(action,value)=>{window.lastAction={action,value};if(action==='panel-state'){fixtureState.paused=Boolean(value&&value!=='activities');window.fixtureStory?.clear();window.fixtureObjects?.update()}if(action==='inspect-object')fixtureUI.openObject(value)});
  {const {createKeyRing}=await import('fixture/key-ring.js');const {translate}=await import('fixture/i18n.js');window.fixtureViews=createKeyRing(document.querySelector('#ui'),()=>fixtureState,{t:k=>translate(fixtureState.settings.locale,k),store:()=>true})}
  const {createStoryUI}=await import('fixture/story-ui.js');window.fixtureStory=createStoryUI(document.querySelector('#ui'),()=>fixtureState,(action,value)=>{window.lastAction={action,value};if(action==='inspect-object')fixtureUI.openObject(value)});
  const {createHouseAccess}=await import('fixture/house-access.js');const {translate:tr}=await import('fixture/i18n.js');window.fixtureObjects=createHouseAccess(document.querySelector('#ui'),()=>fixtureState,{t:k=>tr(fixtureState.settings.locale,k),onPick:pick=>{if(pick?.object){window.lastAction={action:'select-object',value:pick.object};fixtureStory.select(pick.object)}else window.lastAction={action:'access',value:pick}}});window.fixtureObjects.collapse=()=>{};
 }''',modules)
 page.evaluate("fixtureUI.open('settings');fixtureUI.refresh();fixtureUI.close();fixtureUI.tick()")
 actual=page.evaluate('[fixtureState.paused,document.querySelector(".pause-overlay").hidden]')
 results=[{'name':'closing settings (the fuse box, where Pause lives) leaves the house unpaused','passed':actual==[False,True],'actual':actual}]
 page.evaluate('fixtureState.clock=120;fixtureUI.tick()');page.locator('#light-button').hover();page.wait_for_timeout(220)
 colors=page.locator('#light-button').evaluate('(el)=>[getComputedStyle(el).color,getComputedStyle(el).backgroundColor]')
 ratio=contrast(*colors)
 results.append({'name':'night light-toggle hover has 4.5:1 contrast','passed':ratio>=4.5,'contrast':round(ratio,2),'colors':colors})
 # Rooms are reached through the house itself and the hidden house list; the key ring replaced the bar.
 page.evaluate('fixtureViews.update();fixtureObjects.update()')
 results.append({'name':'the house list names all four rooms','passed':page.evaluate("[...document.querySelectorAll('.house-access button')].length")>=4})
 studio=page.evaluate('''async()=>{const m=await import('fixture/house-access.js');return m.accessEntries(fixtureState).findIndex(e=>e.pick.roomTap==='studio')}''')
 page.locator(f'.house-access [data-access="{studio}"]').evaluate('b=>{b.focus();b.click()}')
 results.append({'name':'the house list dispatches the stable room ID','passed':page.evaluate('lastAction.action==="access" && lastAction.value.roomTap==="studio"')})
 page.set_viewport_size({'width':390,'height':844})
 bounds=page.locator('.key-ring [data-key]').evaluate_all('(els)=>els.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))')
 results.append({'name':'key ring keys meet mobile 44px targets','passed':bool(bounds) and all(b['width']>=44 and b['height']>=44 for b in bounds)})
 clue=page.evaluate('''()=>{const toggle=document.querySelector('.clue-toggle'),copy=document.querySelector('#objective-detail'),r=toggle.getBoundingClientRect(),before=getComputedStyle(copy).display;toggle.click();const after=getComputedStyle(copy).display,expanded=toggle.getAttribute('aria-expanded');toggle.click();return {w:r.width,h:r.height,before,after,expanded,back:getComputedStyle(copy).display}}''')
 results.append({'name':'phone clue chip toggle is a 44px target and opens/closes the clue text','passed':clue['w']>=44 and clue['h']>=44 and clue['before']=='none' and clue['after']!='none' and clue['expanded']=='true' and clue['back']=='none','clue':clue})
 page.evaluate("fixtureUI.open('decorate')")
 page.locator('[data-action=choose-item][data-id=plant]').click()
 page.evaluate('fixtureViews.update()')
 results.append({'name':'the key ring never covers decoration placement controls','passed':not page.locator('.key-ring').is_visible()})
 page.locator('[data-action=placement-cancel]').click();page.evaluate('fixtureViews.update()')
 results.append({'name':'the key ring returns after placement cancellation','passed':page.locator('.key-ring').is_visible()})
 for locale in ['en','ar']:
  page.evaluate("locale=>{fixtureState.settings.locale=locale;fixtureUI.refresh();fixtureViews.update()}",locale)
  readable=page.locator('.key-ring .ring-tag').evaluate_all('(els)=>els.length>=2&&els.every(e=>getComputedStyle(e).display!=="none"&&parseFloat(getComputedStyle(e).fontSize)>=9.5&&e.scrollWidth<=e.clientWidth+1)')
  results.append({'name':f'{locale} key tags are visible without overflow','passed':readable})
 for height in [390,320]:
  page.set_viewport_size({'width':844,'height':height})
  overlaps=page.evaluate("""()=>{
   const a=document.querySelector('.key-ring').getBoundingClientRect();
   return ['.time-tools','.house-status','.camera-tools','.objective'].filter(selector=>{const b=document.querySelector(selector).getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top})
  }""")
  results.append({'name':f'landscape {height}px key ring does not obscure other HUD controls','passed':not overlaps,'overlaps':overlaps})
 page.set_viewport_size({'width':1440,'height':1000})
 page.evaluate("fixtureState.settings.locale='en';fixtureState.achieved=['first-care'];fixtureUI.refresh();fixtureUI.open('journal');fixtureUI.toast('Milestone reward collected')")
 page.locator('#sheet [data-action="claim"]').click()
 results.append({'name':'collecting in an open sheet keeps its notice visible after re-render','passed':page.locator('#sheet .panel-notice').inner_text()=='Milestone reward collected' and page.evaluate('lastAction.action==="claim" && lastAction.value==="first-care"')})
 page.evaluate("fixtureUI.close();fixtureUI.open('journal')")
 results.append({'name':'reopening a sheet does not repeat a stale notice','passed':page.locator('#sheet .panel-notice').count()==0})
 page.evaluate("fixtureUI.close();fixtureState.wishes=['lina','noor','sami'];fixtureState.decor=[{id:1,item:'plant',room:'kitchen',slot:0}];fixtureState.achieved=[];fixtureState.clock=130;fixtureState.lastSecretDay=fixtureState.day;fixtureState.activities.mastery.tea=1;fixtureState.story.chapter=3;fixtureUI.tick()")
 results.append({'name':'after tonight\'s whisper the objective points to morning, not a dead end','passed':page.evaluate('fixtureUI.objective().action==="light"')})
 page.evaluate("fixtureUI.close();fixtureState.story.chapter=0;fixtureState.story.step=0;fixtureState.settings.locale='en';fixtureUI.refresh()")
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');fixtureState.paused=false;sim.beginActivity(fixtureState,'tea');for(const cup of sim.teaStatus(fixtureState).cups){sim.controlTea(fixtureState,{aim:cup.x/.45,tilt:.64,pressed:true});while(sim.teaStatus(fixtureState).cups.find(c=>c.id===cup.id).fill<cup.target-.025)sim.step(fixtureState,.05);sim.releaseTea(fixtureState)}sim.serveTea(fixtureState);sim.endActivity(fixtureState);fixtureUI.open('activities');}''')
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');for(let i=0;i<21;i++)sim.step(fixtureState,1);fixtureUI.tick()}''')
 results.append({'name':'ritual reward button updates after cooldown while sheet stays open','passed':'Play' in page.locator('.ritual-card [data-id="tea"]').inner_text()})
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');sim.beginActivity(fixtureState,'lullaby');fixtureUI.setActivityResult(null)}''')
 results.append({'name':'physical moon play cannot render the obsolete answer grid','passed':page.locator('[data-choice]').count()==0 and page.evaluate('fixtureState.activities.active.phase==="listen"')})
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');sim.endActivity(fixtureState);fixtureUI.setActivityResult(null)}''')
 page.evaluate('''async()=>{const sim=await import('fixture/simulation.js');fixtureState.activities.completed.tea=2;fixtureState.dayTime=61;fixtureState.clock=239;sim.step(fixtureState,1);fixtureUI.tick()}''')
 results.append({'name':'fresh dawn updates activity cap without reopening the sheet','passed':'Both rewards' not in page.locator('.ritual-card').first.inner_text()})
 page.evaluate('fixtureUI.close()')
 for locale in ['en','ar']:
  page.set_viewport_size({'width':320,'height':740})
  page.evaluate("locale=>{fixtureState.settings.locale=locale;fixtureUI.refresh();fixtureViews.update()}",locale)
  valid=page.locator('.key-ring button:visible').evaluate_all('(els)=>els.length>=2&&els.every(e=>{const b=e.getBoundingClientRect();return b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth})')
  # a214d88: the rituals' Sound and Pause pair is the one dock left, hidden in the house; none is visible here.
  results.append({'name':f'320px {locale} key ring stays in bounds with 44px targets','passed':valid and page.locator('.dock:visible').count()==0})
 for locale in ['en','ar']:
  page.set_viewport_size({'width':667,'height':375})
  page.evaluate("locale=>{fixtureState.settings.locale=locale;fixtureUI.refresh();fixtureViews.update()}",locale)
  reachable=page.locator('.key-ring button:visible').evaluate_all('(els)=>els.length>0&&els.every(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return Boolean(hit&&e.contains(hit))})')
  results.append({'name':f'{locale} 667px landscape key ring receives actual pointer input','passed':reachable})
 page.set_viewport_size({'width':390,'height':844})
 page.evaluate("fixtureState.settings.locale='ar';fixtureUI.refresh();document.querySelector('#ui').dataset.focusRoom='kitchen';fixtureViews.update();fixtureObjects.update()")
 tea=page.evaluate('''async()=>{const m=await import('fixture/house-access.js');return m.accessEntries(fixtureState).findIndex(e=>e.pick.object==='prop:tea-set')}''')
 page.locator(f'.house-access [data-access="{tea}"]').evaluate('b=>{b.focus();b.click()}')
 results.append({'name':'accessible object control dispatches stable selection key','passed':page.evaluate('lastAction.action==="select-object" && lastAction.value==="prop:tea-set"')})
 results.append({'name':'accessible selection shows nonmodal localized object ribbon','passed':page.locator('.object-ribbon').is_visible() and not page.locator('dialog[open]').count() and not page.evaluate('fixtureState.paused') and 'الشاي' in page.locator('.object-ribbon').inner_text()})
 page.locator('[data-scene-action="inspect"]').click()
 results.append({'name':'selected prop offers localized activity and care actions','passed':page.locator('.object-detail [data-id="tea"]').count()==1 and page.locator('.object-detail [data-care="tea"]').count()==1 and 'الشاي' in page.locator('#sheet-title').inner_text()})
 page.locator('[data-action="close"]').click()
 # 56f0fdd: focus returns to the opener (the ribbon's inspect button), or to the House key when the opener is gone.
 results.append({'name':'closing optional object inspection returns focus to its opener, or the House key when it is gone','passed':page.evaluate('''()=>{const a=document.activeElement,o=document.querySelector('[data-scene-action="inspect"]'),shown=e=>e&&e.isConnected&&e.getClientRects().length>0;
  return (shown(o)?a===o:a.matches('.key-ring [data-key="house"]'))&&a.getBoundingClientRect().width>=44}''')})
 page.evaluate("fixtureState.decor=[{id:1,item:'plant',room:'kitchen',slot:0,rotation:0,originRoom:'kitchen',active:false,tendedDay:0,lastUse:-10}];fixtureUI.refresh();fixtureUI.openObject('decor:1')")
 action=page.locator('.object-detail [data-action="use-object"]')
 results.append({'name':'owned keepsake use is a bilingual mobile-safe primary action','passed':action.count()==1 and action.get_attribute('data-id')=='1' and action.evaluate('(e)=>{const b=e.getBoundingClientRect();return b.width>=44&&b.height>=44}')})
 page.evaluate("fixtureState.settings.locale='en';fixtureState.decor[0].tendedDay=fixtureState.day;fixtureUI.refresh()")
 results.append({'name':'tended status is textual and same-day watering is disabled','passed':action.is_disabled() and 'Watered today' in page.locator('.object-detail [role="status"]').inner_text()})
 page.locator('[data-action="close"]').click()
 for locale in ['en','ar']:
  page.set_viewport_size({'width':320,'height':740})
  page.evaluate("locale=>{fixtureState.settings.locale=locale;fixtureUI.refresh();fixtureObjects.update()}",locale)
  page.locator('.house-access button').first.focus()
  valid=page.locator('.house-access button:visible').evaluate_all('(els)=>els.length>0&&els.every(e=>{const b=e.getBoundingClientRect();return b.height>=44&&b.left>=0&&b.right<=innerWidth})')
  results.append({'name':f'{locale} the focused house list fits 320px phones with 44px targets','passed':valid})
  page.evaluate("document.activeElement.blur()")
  results.append({'name':f'{locale} unfocused, the house list takes no room on screen','passed':page.locator('.house-access').evaluate('e=>e.getBoundingClientRect().width<=1')})
 for locale in ['en','ar']:
  page.set_viewport_size({'width':667,'height':375})
  page.evaluate("locale=>{fixtureState.settings.locale=locale;fixtureState.decor=[{id:1,item:'plant',room:'kitchen',slot:0},{id:2,item:'bear',room:'kitchen',slot:1},{id:3,item:'lamp',room:'kitchen',slot:2}];fixtureUI.refresh();fixtureObjects.update()}",locale)
  last=page.locator('.house-access button').last;last.focus();last.scroll_into_view_if_needed()
  visible=last.evaluate('(e)=>{const b=e.getBoundingClientRect(),n=e.parentElement.getBoundingClientRect();return b.top>=n.top-1&&b.bottom<=n.bottom+1&&b.bottom<=innerHeight&&b.left>=0&&b.right<=innerWidth}')
  results.append({'name':f'{locale} populated house list keeps its last entry reachable on a 667px landscape phone','passed':visible})
  page.evaluate("document.activeElement.blur()")
 page.evaluate("fixtureUI.beginMove(1);fixtureUI.open('settings')")
 results.append({'name':'opening a menu cancels relocation UI and stale move identity','passed':page.evaluate('fixtureUI.moveId===null') and not page.locator('.placement').is_visible()})
 # Unchanged HUD content must preserve the real parsed DOM across ticks.
 page.evaluate("fixtureUI.close();fixtureUI.clearObject();fixtureStory.clear();fixtureUI.collapseTools();fixtureState.story.chapter=0;fixtureState.story.step=0;fixtureState.settings.locale='en';fixtureState.clock=0;fixtureUI.refresh()")
 results.extend(page.evaluate(r'''async()=>{
  const {icon}=await import('fixture/icons.js');
  const action=()=>document.querySelector('#objective-action'),light=()=>document.querySelector('#light-button');
  const label=button=>button.querySelector('span')?.textContent;
  const matchesIcon=(svg,name)=>{const expected=document.createElement('template');expected.innerHTML=icon(name);return Boolean(svg?.isEqualNode(expected.content.firstElementChild))};
  const remember=elements=>elements.map(el=>({el,nodes:[...el.childNodes]}));
  const unchanged=tracked=>tracked.every(({el,nodes})=>el.isConnected&&el.childNodes.length===nodes.length&&nodes.every((node,index)=>node===el.childNodes[index]&&node.isConnected));
  const stable=elements=>{const tracked=remember(elements);for(let i=0;i<10;i++)fixtureUI.tick();return unchanged(tracked)};
  const objectiveMatches=ico=>label(action())===fixtureUI.objective().label&&document.querySelector('#objective-copy').textContent===fixtureUI.objective().copy&&matchesIcon(action().firstElementChild,ico)&&matchesIcon(action().lastElementChild,'arrow');
  const checks=[];
  const initial=[action(),light(),document.querySelector('[data-story-heading]')],tracked=remember(initial);
  let focusStable=true;
  for(const button of initial.slice(0,2)){button.focus();stable(initial);focusStable=focusStable&&document.activeElement===button}
  checks.push({name:'unchanged HUD ticks preserve objective/light children, heading text node and keyboard focus',passed:unchanged(tracked)&&focusStable});
  const firstLabel=label(action()),firstNodes=remember([action()]);
  fixtureState.story.step=1;fixtureUI.tick();
  const stepUpdated=label(action())!==firstLabel&&!unchanged(firstNodes)&&objectiveMatches('bear')&&stable([action()]);
  const oldIcon=action().firstElementChild;
  fixtureState.story.chapter=1;fixtureState.story.step=0;fixtureUI.tick();
  checks.push({name:'changed story step and chapter update objective content once and then remain stable',passed:stepUpdated&&action().firstElementChild!==oldIcon&&objectiveMatches('music')&&document.querySelector('[data-story-heading]').textContent===fixtureUI.t('story-lost-song-title')&&stable([action(),document.querySelector('[data-story-heading]')])});
  fixtureState.clock=0;fixtureUI.tick();
  const dayCorrect=label(light())===fixtureUI.t('night')&&matchesIcon(light().firstElementChild,'moon'),moon=light().firstElementChild;
  fixtureState.clock=120;fixtureUI.tick();
  const sun=light().querySelector('svg > circle[cx="12"][cy="12"][r="4"]');
  light().focus();
  checks.push({name:'day/night changes update the light label and sun geometry while unchanged ticks preserve it',passed:dayCorrect&&label(light())===fixtureUI.t('dawn')&&Boolean(sun)&&matchesIcon(light().firstElementChild,'sun')&&light().firstElementChild!==moon&&stable([light()])&&document.activeElement===light()});
  const localized=[];let localeCorrect=true;
  for(const locale of ['ar','en']){
   const previous=[action(),light()];fixtureState.settings.locale=locale;fixtureUI.refresh();
   const current=[action(),light()];current[0].focus();
   localeCorrect=localeCorrect&&current.every((el,index)=>el!==previous[index]&&!previous[index].isConnected)&&document.documentElement.lang===locale&&document.documentElement.dir===(locale==='ar'?'rtl':'ltr')&&objectiveMatches('music')&&label(light())===fixtureUI.t('dawn')&&matchesIcon(light().firstElementChild,'sun')&&stable(current)&&document.activeElement===current[0];
   localized.push({locale,objective:label(action()),light:label(light())});
  }
  checks.push({name:'Arabic/English HUD rebuilds populate new nodes with translated text and stable SVG children',passed:localeCorrect&&localized[0].objective!==localized[1].objective&&localized[0].light!==localized[1].light,labels:localized});
  return checks;
 }'''))
 # Test the normal house controls separately from the physical work surfaces.
 page.evaluate(r'''() => {
  window.fixtureHudRect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
  window.fixtureHudInside=r=>Object.values(r).every(Number.isFinite)&&r.width>0&&r.height>0&&r.left>=-1e-6&&r.top>=-1e-6&&r.right<=innerWidth+1e-6&&r.bottom<=innerHeight+1e-6;
  window.fixtureHudProbe=el=>{
   if(!el)return {valid:false,key:'missing'};
   const rect=fixtureHudRect(el),style=getComputedStyle(el),label=(el.getAttribute('aria-label')||el.textContent).trim();
   const hits=[[0,0],[-20,0],[20,0],[0,-20],[0,20]].map(([dx,dy])=>{const x=rect.left+rect.width/2+dx,y=rect.top+rect.height/2+dy,hit=document.elementFromPoint(x,y);return {x,y,reachable:Boolean(hit&&el.contains(hit))}});
   return {key:el.id||el.dataset.room||el.dataset.action||el.dataset.object||(el.hasAttribute('data-object-toggle')?'discovery':el.tagName),label,rect,hits,valid:Boolean(el.getClientRects().length&&style.display!=='none'&&style.visibility==='visible'&&Number(style.opacity)>0&&label&&rect.width>=44-1e-6&&rect.height>=44-1e-6&&fixtureHudInside(rect)&&hits.every(hit=>hit.reachable))};
  };
 }''')
 for locale in ['en','ar']:
  for width in [667,568,480,360]:
   page.set_viewport_size({'width':width,'height':320})
   page.evaluate(r'''locale=>{
   fixtureUI.close();fixtureUI.clearObject();fixtureStory.clear();fixtureUI.collapseTools();
   fixtureState.settings.locale=locale;fixtureState.story.chapter=0;fixtureState.story.step=0;
   fixtureState.decor=['plant','bear','lamp'].map((item,index)=>({id:index+1,item,room:'kitchen',slot:index,rotation:0,originRoom:'kitchen',active:false,tendedDay:0,lastUse:-10}));
   fixtureUI.refresh();const host=document.querySelector('#ui');host.dataset.focusRoom='kitchen';host.dataset.focusDoll='';
   fixtureViews.update();fixtureObjects.update();fixtureStory.update();
  }''',locale)
   hud=page.evaluate(r'''() => {
   const visible=el=>el.getClientRects().length&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility==='visible';
   const keys=[...document.querySelectorAll('.key-ring [data-key]')].filter(visible),ring=fixtureHudRect(document.querySelector('.key-ring'));
   const controls=[document.querySelector('#objective-action'),...keys].map(fixtureHudProbe);
   const clue=fixtureHudRect(document.querySelector('.objective'));
   const overlaps=ring.left<clue.right&&ring.right>clue.left&&ring.top<clue.bottom&&ring.bottom>clue.top;
   return {controls,ring,overlaps,passed:controls.length>=3&&new Set(controls.map(c=>c.key+c.label)).size===controls.length&&controls.every(c=>c.valid)&&!overlaps&&fixtureHudInside(ring)};
  }''')
   hud['namedRing']=page.get_by_role('navigation',name=page.evaluate("fixtureUI.t('keyRing')"),exact=True).count()==1
   hud['namedHouseList']=page.get_by_role('navigation',name=page.evaluate("fixtureUI.t('houseAccess')"),exact=True).count()==1
   results.append({'name':f'{locale} {width}x320 the clue and the key ring are clear 44px controls with five reachable points','passed':hud['passed'] and hud['namedRing'] and hud['namedHouseList'],'observed':hud})
   page.evaluate('fixtureObjects.update()')
   entries=page.locator('.house-access button')
   ends=[]
   for endpoint in [entries.first,entries.last]:
    endpoint.focus();endpoint.scroll_into_view_if_needed()
    ends.append(endpoint.evaluate(r'''el=>{
    const r=fixtureHudRect(el),list=fixtureHudRect(el.closest('.house-access'));
    return {r,list,passed:r.height>=44&&fixtureHudInside(list)&&r.top>=list.top-1&&r.bottom<=list.bottom+1}
   }'''))
   results.append({'name':f'{locale} {width}x320 the focused house list keeps its first and last entries reachable','passed':entries.count()>=2 and all(end['passed'] for end in ends),'observed':ends})
   page.evaluate("document.activeElement.blur()")
 # Folded clue and measured playfield contract, exercised in the real DOM.
 page.evaluate('''async()=>{
  const {createPlayfieldLayout}=await import('fixture/playfield-layout.js');
  window.fixtureLayoutUpdates=[];
  window.fixtureLayout=createPlayfieldLayout(document.querySelector('#ui'),value=>fixtureLayoutUpdates.push(value));
 }''')
 for locale in ['en','ar']:
  for width,height in [(360,640),(390,844),(412,915),(844,390)]:
   page.set_viewport_size({'width':width,'height':height})
   page.evaluate('''locale=>{
    fixtureUI.close();fixtureUI.collapseTools();fixtureStory.clear();fixtureObjects.collapse();
    fixtureState.settings.locale=locale;fixtureState.story.chapter=0;fixtureState.story.step=0;fixtureState.clock=0;fixtureState.paused=false;
    document.querySelector('#ui').dataset.focusRoom='kitchen';fixtureUI.refresh();fixtureViews.update();fixtureStory.update();fixtureObjects.update();
   }''',locale)
   toggle=page.locator('[data-action="toggle-clue"]')
   if toggle.get_attribute('aria-expanded')=='true':toggle.click()
   page.wait_for_timeout(60)
   folded=page.locator('.objective').evaluate('''e=>{
    const r=e.getBoundingClientRect(),a=e.querySelector('#objective-action'),b=e.querySelector('.clue-toggle');
    const controls=[a,b].map(fixtureHudProbe);
    return {height:r.height,area:r.width*r.height,controls,arrived:e.dataset.arrived,label:a.textContent,detailHidden:e.querySelector('#objective-detail').hidden,foldIconVisible:getComputedStyle(b.querySelector('.icon')).display!=='none',insets:fixtureLayoutUpdates.at(-1)};
   }''')
   results.append({'name':f'{locale} {width}x{height} folded clue has separate reachable action and 44px unfold control','passed':folded['detailHidden'] and folded['foldIconVisible'] and folded['arrived']=='true' and all(c['valid'] for c in folded['controls']) and (height<width or folded['height']<=76 and folded['area']<19000),'observed':folded})
   toggle.click()
   page.wait_for_timeout(60)
   expanded=page.locator('.objective').evaluate('''e=>({visible:!e.querySelector('#objective-detail').hidden,copy:e.querySelector('#objective-copy').textContent,insets:fixtureLayoutUpdates.at(-1)})''')
   page.evaluate('fixtureUI.refresh();fixtureViews.update();fixtureStory.update();fixtureObjects.update()')
   results.append({'name':f'{locale} {width}x{height} full clue stays available through HUD rebuild','passed':expanded['visible'] and bool(expanded['copy']) and page.locator('[data-action="toggle-clue"]').get_attribute('aria-expanded')=='true' and page.locator('#objective-copy').is_visible()})
   page.locator('[data-action="toggle-clue"]').click()
   results.append({'name':f'{locale} {width}x{height} folding keeps keyboard focus on its visible toggle','passed':page.evaluate('document.activeElement.matches("[data-action=toggle-clue]")')})
   if height>width:
    page.wait_for_timeout(60)
    idle=page.evaluate('fixtureLayoutUpdates.at(-1)')
    page.evaluate("fixtureStory.select('prop:mint-tin')")
    page.wait_for_timeout(60)
    selected=page.evaluate('fixtureLayoutUpdates.at(-1)')
    page.evaluate('fixtureStory.clear()')
    page.wait_for_timeout(60)
    restored=page.evaluate('fixtureLayoutUpdates.at(-1)')
    results.append({'name':f'{locale} {width}x{height} only an actually visible selection reserves ribbon space','passed':selected['bottom']>=idle['bottom']+60 and restored==idle and idle['bottom']<=140,'observed':{'idle':idle,'selected':selected,'restored':restored}})
   page.wait_for_timeout(60)
   stable=page.evaluate('''async()=>{const before=fixtureLayoutUpdates.length;for(let i=0;i<10;i++)fixtureUI.tick();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return fixtureLayoutUpdates.length===before}''')
   results.append({'name':f'{locale} {width}x{height} unchanged UI ticks do not reframe the player camera','passed':stable})
 for locale in ['en','ar']:
  page.set_viewport_size({'width':360,'height':640})
  page.evaluate("""locale=>{
   fixtureStory.clear();fixtureState.settings.locale=locale;fixtureState.story.chapter=0;fixtureState.story.step=1;fixtureState.clock=180;
   document.querySelector('#ui').dataset.focusRoom='kitchen';fixtureUI.refresh();fixtureViews.update();fixtureObjects.update();fixtureStory.select('prop:tea-set');fixtureStory.respond('storyNotHere');fixtureUI.tick();
  }""",locale)
  page.wait_for_timeout(60)
  crowded=page.evaluate("""()=>({insets:fixtureLayoutUpdates.at(-1),inline:document.querySelector('.ribbon-feedback')?.textContent,separate:!!document.querySelector('.scene-response'),visitor:getComputedStyle(document.querySelector('.visitor-hint')).display})""")
  results.append({'name':locale+' short-phone night response stays within the selected ribbon and leaves a real room band','passed':bool(crowded['inline']) and not crowded['separate'] and crowded['visitor']=='none' and 640-crowded['insets']['top']-crowded['insets']['bottom']>=120,'observed':crowded})
 page.evaluate('fixtureStory.clear();fixtureState.story.step=0;fixtureUI.tick();fixtureStory.update()')
 page.wait_for_timeout(60)
 for activity in ['tea','stitch','chime']:
  before=page.evaluate('fixtureLayoutUpdates.length')
  page.evaluate("activity=>document.querySelector('#ui').dataset[activity+'Active']='true'",activity)
  page.wait_for_timeout(60)
  during=page.evaluate('fixtureLayoutUpdates.length')
  page.evaluate("activity=>document.querySelector('#ui').dataset[activity+'Active']='false'",activity)
  page.wait_for_timeout(60)
  after=page.evaluate('fixtureLayoutUpdates.length')
  results.append({'name':activity+' work dock never becomes a house footer reservation, and exit remeasures','passed':during==before and after==before+1})
 page.evaluate('fixtureLayout.dispose()')
 print(json.dumps(results,indent=2));browser.close()
 if any(not r['passed'] for r in results):raise SystemExit(1)
