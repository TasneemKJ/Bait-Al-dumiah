import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;
function python(source,args=[]){const result=spawnSync('python',['-c',source,...args],{cwd:root,encoding:'utf8'});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);return result.stdout}

test('native entry clicks the actual Home control once and never retries or mutates state',()=>{
 python(`
import importlib.util, sys
sys.path.insert(0, 'scripts')
assert importlib.util.find_spec('game_entry'), 'a separate genuine Home activation helper is required'
from game_entry import enter_game
class Page:
 def __init__(self, fail=False, intro=False): self.calls=[]; self.fail=fail; self.intro=intro
 def wait_for_function(self, expression, **kwargs): self.calls.append(('wait', expression, kwargs))
 def locator(self, selector): self.calls.append(('locator', selector)); return self
 def count(self): self.calls.append(('count',)); return 1 if self.intro else 0
 def click(self, **kwargs):
  self.calls.append(('click', kwargs))
  if self.fail: raise RuntimeError('real click blocked')
page=Page(); enter_game(page)
assert [call[0] for call in page.calls] == ['wait','locator','click','wait','locator','count','wait'], page.calls
assert page.calls[1][1] == '#home [data-home-action="play"]'
assert '#loading' in page.calls[0][1]
assert 'play' in page.calls[-1][1] and '#ui' in page.calls[-1][1] and 'intro' in page.calls[-1][1]
assert all(call[-1].get('timeout') == 60000 for call in page.calls if call[0] in ('wait','click'))
# A first launch: the player's real Skip control is tapped once, never state injection.
first=Page(intro=True); enter_game(first)
assert [call[0] for call in first.calls].count('click')==2, first.calls
assert ('locator','.intro-layer .intro-skip') in first.calls
blocked=Page(True)
try: enter_game(blocked)
except RuntimeError as error: assert str(error)=='real click blocked'
else: raise AssertionError('a failed real click must fail acceptance, never bypass or retry')
assert [call[0] for call in blocked.calls].count('click')==1
`);
});

const scripts=['play_check.py','atmosphere_check.py','scene_stability_check.py','chime_check.py','expansion_check.py','story_check.py','tea_check.py','stitch_check.py','visibility_check.py','scene_input_check.py'];
for(const file of scripts)test(file+' enters through real Home input at every game navigation boundary',()=>{
 python(`
import ast,sys
from pathlib import Path
name=sys.argv[1]; tree=ast.parse((Path('scripts')/name).read_text()); count=0
assert any(isinstance(n,ast.ImportFrom) and n.module=='game_entry' and any(a.name=='enter_game' for a in n.names) for n in ast.walk(tree)), name+' must import explicit entry'
def navigation(node):
 return isinstance(node,ast.Expr) and isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Attribute) and isinstance(node.value.func.value,ast.Name) and node.value.func.value.id=='page' and node.value.func.attr in ('goto','reload')
def named(node,name): return isinstance(node,ast.Expr) and isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Name) and node.value.func.id==name
for parent in ast.walk(tree):
 for _,value in ast.iter_fields(parent):
  if not isinstance(value,list): continue
  for index,node in enumerate(value):
   if not navigation(node): continue
   count+=1; following=value[index+1:]
   if following and named(following[0],'foreground'): following=following[1:]
   assert following and named(following[0],'enter_game'), name+':'+str(node.lineno)+' navigates without real Home activation'
assert count>0, name+' has no audited navigation'
print(name,count)
`,[file]);
});

test('scene readiness remains observational and the stability whole-house case explicitly resets camera',()=>{
 const readiness=readFileSync(new URL('../scripts/scene_gestures.py',import.meta.url),'utf8');
 assert.doesNotMatch(readiness,/enter_game|\.click\(|\.tap\(|dispatch\(/);
 const stability=readFileSync(new URL('../scripts/scene_stability_check.py',import.meta.url),'utf8');
 const section=stability.slice(stability.indexOf("if GROUP in ('all', 'reachability'):"),stability.indexOf("check(locale+' whole-house"));
 assert.match(section,/fixture\(browser,locale,motion,360,640,4\)[\s\S]*page\.locator\('\[data-action="camera"\]:visible'\)\.click\(\)[\s\S]*scene_ready\(page\)[\s\S]*select_at\(page,'prop:mint-tin'\)/);
});

test('expansion whole-house oracle: the first touch opens the room, the second selects, and drift, a missing room, occlusion or a UI-owned click fail it',()=>{
 python(`
import ast
from pathlib import Path
source=Path('scripts/expansion_check.py').read_text(); tree=ast.parse(source)
keep=[node for node in tree.body if (isinstance(node,ast.FunctionDef) and node.name=='check_whole_house_selection') or
 (isinstance(node,ast.Assign) and getattr(node.targets[0],'id','') in ('LISTEN','OBSERVE'))]
assert len([n for n in keep if isinstance(n,ast.FunctionDef)])==1, 'expansion must verify the whole-house route to selection'
assert 'after_distance/before_distance>1.5' not in source
class Locator:
 def __init__(self,page): self.page=page
 def click(self): self.page.events.append('camera')
class Mouse:
 def __init__(self,page): self.page=page
 def click(self,x,y): self.page.events.append(('click',x,y)); self.page.clicks+=1
class Page:
 def __init__(self, defect=None): self.defect=defect; self.events=[]; self.clicks=0; self.mouse=Mouse(self)
 def locator(self,selector):
  assert selector=='[data-action="camera"]:visible';return Locator(self)
 def tea(self): return {'key':'prop:tea-set','x':320,'y':420} if self.clicks==0 else {'key':'prop:tea-set','x':200,'y':500}
 def evaluate(self,expression,arg=None):
  if expression=='window.dollhouse.objects()': return [self.tea()]
  if 'addEventListener' in expression: self.events.append('listen');return None
  if 'const visual' not in expression: return True
  d=self.defect;first=self.clicks==1;p=self.tea()
  return {'point':{'x':p['x']+(30 if d=='drift' and not first else 0),'y':p['y']},
   'focusedRoom':None if d=='focus' and first else 'kitchen','selected':None if first else 'prop:tea-set',
   'ribbon':not first,'modal':False,'paused':False,'owner':'ribbon' if d=='occluded' and not first else 'world',
   'event':{'x':arg['x'],'y':arg['y'],'owner':'ribbon' if d=='event' and first else 'world'}}
def check(name,value): assert value,name
def ready(page): page.events.append('ready')
namespace={'check':check,'scene_ready':ready}
exec(compile(ast.Module(body=keep,type_ignores=[]),'expansion-selection','exec'),namespace)
run=namespace['check_whole_house_selection']; page=Page(); result=run(page)
assert page.events==['camera','ready','listen',('click',320,420),'ready','listen',('click',200,500),'ready'],page.events
assert result['selected']=='prop:tea-set' and result['point']=={'x':200,'y':500}
for defect in ['drift','focus','occluded','event']:
 page=Page(defect)
 try: run(page)
 except AssertionError: pass
 else: raise AssertionError('oracle accepted '+defect)
 assert [e for e in page.events if isinstance(e,tuple)][0]==('click',320,420),'never re-aims the first touch'
`);
});
