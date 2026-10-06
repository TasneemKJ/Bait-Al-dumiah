import ast,json,subprocess,sys
from pathlib import Path
source=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).parent/'review-home-entry.py').read_text()
expressions=[n.args[0].value for n in ast.walk(ast.parse(source)) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='evaluate' and n.args and isinstance(n.args[0],ast.Constant) and isinstance(n.args[0].value,str) and 'Storage.prototype.getItem=window.failureOriginalGet' in n.args[0].value]
assert len(expressions)==1
script='''const vm=require('node:vm');class Storage{getItem(k){if(!(this instanceof Storage))throw new TypeError('Illegal invocation');return 'kept';}}const store=new Storage();const context={Storage,localStorage:store,window:{failureOriginalGet:Storage.prototype.getItem}};Storage.prototype.getItem=function(){throw Error('fixture read refused')};const result=vm.runInNewContext(EXPRESSION,context);if(typeof result==='function')result();if(store.getItem('key')!=='kept')throw Error('getter not restored');console.log('getter restored without invoking an unbound native method');'''.replace('EXPRESSION',json.dumps(expressions[0]))
r=subprocess.run(['node','-e',script],capture_output=True,text=True);print(r.stdout+r.stderr);raise SystemExit(r.returncode)
