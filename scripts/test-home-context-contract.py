"""Execute context, screenshot and real-clock seams; no browser or server launch."""
import ast, base64, hashlib, json, os, struct, subprocess, sys, tempfile, time, unittest
from datetime import datetime, timezone
from pathlib import Path
SOURCE=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).parent/'review-home-entry.py'
TREE=ast.parse(SOURCE.read_text())
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
class Page:
 def __init__(self):self.shots=0;self.waits=[];self.now=35000;self.fail=False
 def screenshot(self,path,**kwargs):
  self.shots+=1
  if self.fail:raise TimeoutError('instrumented screenshot timeout')
  Path(path).write_bytes(PNG);return PNG
 def evaluate(self,expression,*args):
  if expression=='performance.now()':return self.now
  if expression=='homeEvidence.inputs.length':return 4
  raise AssertionError(expression)
 def wait_for_timeout(self,ms):self.waits.append(ms);self.now+=ms
 def set_default_timeout(self,*args):pass
 def on(self,*args):pass
 def goto(self,*args):pass
class CDP:
 def __init__(self):self.calls=[]
 def send(self,*args):self.calls.append(args)
class Context:
 def __init__(self):self.scripts=[];self.page=Page();self.cdp=CDP()
 def add_init_script(self,s):self.scripts.append(s)
 def new_page(self):return self.page
 def new_cdp_session(self,p):return self.cdp
class Browser:
 def __init__(self):self.contexts=[]
 def new_context(self,**kwargs):c=Context();self.contexts.append(c);return c

def load(mode,directory):
 wanted={'shot','fixture','finish_observation','failure_fixture','restore_getter'}
 nodes=[n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name in wanted or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in {'INSTRUMENT','SELECTED_CAPTURES'} for t in n.targets)]
 observed=[];checks=[]
 def check(name,value):checks.append((name,value));assert value,name
 env={'MODE':mode,'CPU_RATE':4 if mode=='behavior-4x' else 1,'OUT':directory,'profiles':{},'captures':{},'capture_errors':[],'failed_capture_pages':set(),'os':os,'time':time,'datetime':datetime,'timezone':timezone,'json':json,'struct':struct,'hashlib':hashlib,'errors':[],'URL':'unit-fixture','home_ready':lambda p:None,'tap':lambda *a:None,'state':lambda p:{'elapsed':23.5},'visible':lambda *a:[],'observe':lambda name,**data:observed.append({'name':name,**data}),'check':check}
 exec(compile(ast.Module(body=nodes,type_ignores=[]),str(SOURCE),'exec'),env)
 return env,observed,checks
class Contracts(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.directory=Path(self.temp.name);self.saved={k:os.environ.get(k) for k in ['SOURCE_SHA','SOURCE_TREE','SOURCE_DIGEST']};os.environ.update(SOURCE_SHA='a'*40,SOURCE_TREE='b'*40,SOURCE_DIGEST='c'*64)
 def tearDown(self):
  self.temp.cleanup()
  for k,v in self.saved.items():
   if v is None:os.environ.pop(k,None)
   else:os.environ[k]=v
 def test_behavioral_context_cannot_take_any_screenshot(self):
  ns,_,_=load('behavior-4x',self.directory);browser=Browser();_,page,cdp=ns['fixture'](browser)
  page.fail=True;ns['shot'](page,'en-390x844-home');ns['shot'](page,'en-failure-state');self.assertEqual(page.shots,0);self.assertEqual(cdp.calls,[('Emulation.setCPUThrottlingRate',{'rate':4})]);self.assertEqual(ns['captures'],{})
 def test_visual_is_a_distinct_normal_speed_context_and_preserves_original_pixels(self):
  ns,_,_=load('visual-1x',self.directory);browser=Browser();first,page,cdp=ns['fixture'](browser);second,_,_=ns['fixture'](browser,'ar');self.assertIsNot(first,second);self.assertEqual(cdp.calls,[('Emulation.setCPUThrottlingRate',{'rate':1})]);ns['shot'](page,'en-390x844-home');record=ns['captures']['en-390x844-home'];self.assertEqual((self.directory/record['path']).read_bytes(),PNG);self.assertEqual(record['sha256'],hashlib.sha256(PNG).hexdigest());self.assertEqual(record['cpuThrottleRate'],1);self.assertEqual(record['evidenceRole'],'visual-1x');self.assertFalse(record['behavioral120SecondEvidence']);self.assertEqual(record['sourceTree'],'b'*40)
 def test_failed_capture_is_recorded_and_never_retried_in_that_context(self):
  ns,_,_=load('visual-1x',self.directory);_,page,_=ns['fixture'](Browser());page.fail=True
  with self.assertRaises(TimeoutError):ns['shot'](page,'en-390x844-home')
  ns['shot'](page,'en-failure-state');self.assertEqual(page.shots,1);self.assertEqual(len(ns['capture_errors']),1);self.assertFalse(ns['capture_errors'][0]['retry'])
 def test_unselected_capture_is_not_rendered(self):
  ns,_,_=load('visual-1x',self.directory);_,page,_=ns['fixture'](Browser());ns['shot'](page,'en-360x640-preferences');self.assertEqual(page.shots,0)
 def test_behavior_uses_real_wait_and_reports_simulation_separately(self):
  ns,observed,checks=load('behavior-4x',self.directory);page=Page();ns['finish_observation'](page,'en',5000,time.monotonic(),'unit-clock');self.assertEqual(page.waits,[90000]);self.assertEqual(observed[0]['actualElapsedMs'],120000);self.assertEqual(observed[0]['simulationSecondsSinceFreshEntry'],23.5);self.assertTrue(observed[0]['minimum120SecondGate']);self.assertIn('pythonWallSinceEntryCallMs',observed[0])
 def test_visual_context_never_claims_the_behavioral_120_second_gate(self):
  ns,observed,_=load('visual-1x',self.directory);page=Page();ns['finish_observation'](page,'ar',5000,time.monotonic(),'unit-clock');self.assertEqual(page.waits,[]);self.assertFalse(observed[0]['minimum120SecondGate']);self.assertEqual(observed[0]['actualElapsedMs'],30000)
 def test_exact_getter_restoration_is_void_returning(self):
  expressions=[n.args[0].value for n in ast.walk(TREE) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='evaluate' and n.args and isinstance(n.args[0],ast.Constant) and isinstance(n.args[0].value,str) and 'Storage.prototype.getItem=window.failureOriginalGet' in n.args[0].value];self.assertEqual(expressions,['() => {Storage.prototype.getItem=window.failureOriginalGet;}'])
 def test_read_failure_requires_reload_instead_of_entering_a_fallback_house(self):
  ns,observed,_=load('behavior-4x',self.directory);page=Page();taps=[];inventories=[]
  class Locator:
   def is_visible(self):return True
   def inner_text(self):return 'Play'
   def is_hidden(self):return True
   def get_attribute(self,name):return ''
   def wait_for(self,**kwargs):pass
  page.locator=lambda selector:Locator()
  page.evaluate=lambda expression,*args:[] if expression=='homeEvidence.writes' else None
  class ClosedContext:
   def close(self):pass
  ns.update(fixture=lambda *args:(ClosedContext(),page,None),raw=lambda p:'unknown protected save',state=lambda p:{'elapsed':0,'paused':True},canonical_writes=lambda p:[],tap=lambda p,selector:taps.append(selector),geometry=lambda p,label,actions:inventories.append(actions),enter=lambda *args:(_ for _ in ()).throw(AssertionError('read failure must never enter stale state')))
  ns['failure_fixture'](None,'en','read-failure');self.assertEqual(taps,['[data-home-action="play"]']);self.assertEqual(inventories,[['reload','preferences']]);self.assertTrue(observed[-1]['entryRejected']);self.assertTrue(observed[-1]['explicitReloadVisible'])
if __name__=='__main__':unittest.main(argv=[sys.argv[0]])
