"""Execute the native harness's exact init script without launching a browser."""
import ast,json,subprocess,sys
from pathlib import Path
path=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).parent/'review-home-entry.py')
tree=ast.parse(path.read_text());nodes=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='fixture']
instrument=next(n for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='INSTRUMENT' for t in n.targets))
class Page:
 def set_default_timeout(self,*args):pass
 def on(self,*args):pass
 def goto(self,*args):pass
class CDP:
 def send(self,*args):pass
class Context:
 def __init__(self):self.scripts=[]
 def add_init_script(self,s):self.scripts.append(s)
 def new_page(self):return Page()
 def new_cdp_session(self,page):return CDP()
class Browser:
 def new_context(self,**kwargs):self.context=Context();return self.context
namespace={'home_ready':lambda p:None,'tap':lambda *a:None,'URL':'fixture','errors':[],'MODE':'behavior-4x','CPU_RATE':4,'profiles':{}}
exec(compile(ast.Module(body=[instrument,*nodes],type_ignores=[]),str(path),'exec'),namespace)
failure=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='failure_fixture')
setup=failure.body[:2]
results=[]
for kind in ['normal','read-failure','invalid-save','audio-failure']:
 extra=None
 if kind!='normal':
  ns={'kind':kind};exec(compile(ast.Module(body=setup,type_ignores=[]),str(path),'exec'),ns);extra=ns['extra']
 browser=Browser();namespace['fixture'](browser,'en',extra);scripts=browser.context.scripts
 program='''const vm=require('node:vm');const input=JSON.parse(process.argv[1]);
 class Storage{constructor(){this.data=new Map()}getItem(k){return this.data.get(k)??null}setItem(k,v){this.data.set(k,v)}};
 class AudioContext{resume(){return Promise.resolve()}};
 const sandbox={Storage,AudioContext,localStorage:new Storage(),performance:{now:()=>123},navigator:{userActivation:{isActive:false}},document:{elementFromPoint:()=>null},addEventListener:()=>{}};
 sandbox.window=sandbox;vm.createContext(sandbox);for(const script of input.scripts)vm.runInContext(script,sandbox);
 let read;try{read=sandbox.localStorage.getItem('bait-al-dumiah.v1')}catch{read='read-failed'}
 let audio;try{new sandbox.AudioContext();audio='available'}catch{audio='unavailable'}
 process.stdout.write(JSON.stringify({instrumented:!!sandbox.homeEvidence,read,audio,writes:sandbox.homeEvidence?.writes}));'''
 result=subprocess.run(['node','-e',program,json.dumps({'scripts':scripts})],capture_output=True,text=True)
 assert result.returncode==0,result.stderr
 actual=json.loads(result.stdout)
 assert actual['instrumented'],f'{kind}: init script was not executed'
 assert len(scripts)==1,f'{kind}: multiple init scripts have unspecified execution order'
 if kind=='read-failure':assert actual['read']=='read-failed' and actual['writes']==[]
 if kind=='invalid-save':assert actual['read']=='{invalid-json' and actual['writes']==[]
 if kind=='audio-failure':assert actual['audio']=='unavailable'
 results.append({'case':kind,**actual})
print(json.dumps({'passed':len(results),'cases':results},indent=2))
