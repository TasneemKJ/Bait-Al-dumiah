"""Execute native-route harness seams with a fake browser. Not play evidence."""
import ast, copy, hashlib, json, tempfile, unittest
from pathlib import Path
SOURCE=Path(__file__).parent/'review-home-entry.py';TREE=ast.parse(SOURCE.read_text());SAVE='bait-al-dumiah.v1'
def fresh(step=0):return {'elapsed':0,'paused':False,'settings':{'largeText':False},'story':{'chapter':0,'step':step,'lastAction':None,'lastActionAt':-10},'buttons':36}
class Store:
 def __init__(self,value=None):self.raw=None if value is None else json.dumps(value)
class Pending:
 def __init__(self,value):self.value=value
 def __enter__(self):return self
 def __exit__(self,*args):return False
class Locator:
 def __init__(self,page,selector):self.page=page;self.selector=selector
 def is_hidden(self):return not self.page.entered
 def get_attribute(self,key):return '' if key=='inert' and not self.page.entered else None
 def wait_for(self,**kwargs):
  if 'reload' in self.selector:assert self.page.reload_needed,'Reload recovery is missing'
 def tap(self,**kwargs):assert self.selector=='.file-button';self.page.actions.append('file-chooser')
class Page:
 def __init__(self,store):self.store=store;self.s=fresh();self.entered=False;self.reload_needed=False;self.read_failed=False;self.events=[];self.writes=[];self.actions=[];self.imported_path=None;self.expected=store.raw;self.closed=False
 def locator(self,selector):return Locator(self,selector)
 def goto(self,url):self.s=json.loads(self.store.raw) if self.store.raw else fresh();self.s['paused']=True;self.expected=self.store.raw;self.entered=False;self.events=[];self.writes=[]
 def reload(self):self.goto('unit')
 def bring_to_front(self):pass
 def close(self):self.closed=True
 def wait_for_timeout(self,ms):assert ms==1000
 def wait_for_function(self,expression,arg=None):
  if 'largeText===value' in expression:assert self.s['settings']['largeText']==arg
  elif 'story.step===0' in expression:assert self.s['story']['step']==0
  elif 'story.step===1' in expression:assert self.s['story']['step']==1
  else:raise AssertionError(expression)
 def evaluate(self,expression,*args):
  if expression.startswith('homeEvidence.inputs.filter'):return self.events
  if expression=='homeEvidence.writes':return self.writes
  if expression=='(key)=>localStorage.removeItem(key)':self.store.raw=None;self.actions.append('fault-delete');return
  if 'intentional entry-time read failure' in expression:self.read_failed=True;self.actions.append('fault-read');return
  if expression=='() => {Storage.prototype.getItem=window.failureOriginalGet;}':self.read_failed=False;self.actions.append('restore-getter');return
  raise AssertionError('Unexpected JS, including any state injection: '+expression)
 def read(self):
  if self.read_failed:raise RuntimeError('fixture read failure')
  return self.store.raw
 def write(self):self.store.raw=json.dumps(self.s);self.expected=self.store.raw;self.writes.append({'key':SAVE})
 def expect_download(self,**kwargs):
  content=json.dumps(self.s).encode()
  class Download:
   def save_as(self,path):Path(path).write_bytes(content)
  return Pending(Download())
 def expect_file_chooser(self,**kwargs):
  page=self
  class Chooser:
   def set_files(self,path):page.imported_path=Path(path);page.s=json.loads(Path(path).read_bytes());page.entered=True;page.write()
  return Pending(Chooser())
class Context:
 def __init__(self,store):self.store=store;self.pages=[]
 def new_page(self):page=Page(self.store);self.pages.append(page);return page
 def close(self):pass

def load(directory):
 nodes=[n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name in {'restore_getter','open_settings','legitimate_save_routes','changed_entry_fixture','late_entry_fixture'}];observations=[];inventories=[];fixtures=[]
 def check(name,passed):assert passed,name
 def tap(page,selector):
  page.actions.append(selector)
  if 'largeText' in selector:page.s['settings']['largeText']=not page.s['settings']['largeText'];page.write()
  elif 'reset-yes' in selector:
   settings=page.s['settings'];page.s=fresh();page.s['settings']=settings;page.write()
  elif 'data-home-action="play"' in selector:
   if page.read_failed or page.store.raw!=page.expected:page.reload_needed=True
   else:raise AssertionError('Fault was not established before Play')
  for action in ['save-export','reset-prompt','reset-yes']:
   if action in selector:page.events.append({'gameAction':action,'trusted':True})
 def fixture(*args):
  context=Context(Store());page=context.new_page();fixtures.append(page);return context,page,None
 def enter(page):page.entered=True;page.write()
 ns={'OUT':directory,'json':json,'hashlib':hashlib,'SAVE':SAVE,'URL':'unit','state':lambda p:copy.deepcopy(p.s),'raw':lambda p:p.read(),'check':check,'tap':tap,'observe':lambda name,**data:observations.append({'name':name,**data}),'geometry':lambda page,name,actions:inventories.append(actions),'shot':lambda *args:False,'home_ready':lambda p:None,'canonical_writes':lambda p:p.writes,'page_in_context':lambda ctx,*args:ctx.new_page(),'fixture':fixture,'enter':enter}
 exec(compile(ast.Module(body=nodes,type_ignores=[]),str(SOURCE),'exec'),ns);return ns,observations,inventories,fixtures
class Contracts(unittest.TestCase):
 def setUp(self):self.temp=tempfile.TemporaryDirectory();self.out=Path(self.temp.name)
 def tearDown(self):self.temp.cleanup()
 def test_real_control_sequence_roundtrips_the_unedited_export_file(self):
  ns,observations,_,_=load(self.out);page=Page(Store(fresh(1)));page.s=fresh(1);page.entered=True;ns['legitimate_save_routes'](page,'en');self.assertEqual(page.s['story']['step'],1);self.assertEqual(page.imported_path,self.out/'en-native-export.json');self.assertEqual(observations[-1]['exportSha256'],observations[-1]['importSha256']);self.assertIn('[data-action="reset-yes"]',page.actions);self.assertIn('file-chooser',page.actions)
 def test_changed_entry_comes_from_another_tabs_real_setting_action(self):
  ns,observations,inventories,_=load(self.out);store=Store(fresh(1));context=Context(store);active=Page(store);active.s=fresh(1);active.entered=True;before=store.raw;ns['changed_entry_fixture'](context,active,'ar');self.assertNotEqual(store.raw,before);self.assertEqual(active.s['story']['step'],1);self.assertTrue(context.pages[0].reload_needed);self.assertTrue(context.pages[0].closed);self.assertEqual(inventories,[['reload','preferences']]);self.assertIn('native tab',observations[-1]['fault'])
 def test_late_deleted_save_stays_absent_after_attempted_entry(self):
  ns,observations,inventories,fixtures=load(self.out);ns['late_entry_fixture'](None,'en','entry-deleted');self.assertIsNone(fixtures[0].store.raw);self.assertEqual(fixtures[0].actions,['fault-delete','[data-home-action="play"]']);self.assertFalse(observations[-1]['progressionInjected']);self.assertEqual(inventories,[['reload','preferences']])
 def test_late_read_failure_restores_native_getter_only_after_rejection(self):
  ns,observations,_,fixtures=load(self.out);ns['late_entry_fixture'](None,'ar','entry-read-failed');self.assertEqual(fixtures[0].actions,['fault-read','[data-home-action="play"]','restore-getter']);self.assertFalse(fixtures[0].entered);self.assertTrue(observations[-1]['stateBindingUnchanged'])
if __name__=='__main__':unittest.main()
