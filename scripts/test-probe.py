import ast,json,subprocess,unittest
from pathlib import Path
SOURCE=Path(__file__).with_name('probe.py');tree=ast.parse(SOURCE.read_text());ns={};functions=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['sampled','quantile','home_landscape_fits']];exec(compile(ast.Module(body=functions,type_ignores=[]),str(SOURCE),'exec'),ns)
class Tests(unittest.TestCase):
 def test_quantiles_and_empty(self):
  self.assertIsNone(ns['quantile']([],.5));self.assertEqual(ns['quantile']([100,2,5],.5),5)
 def test_profile_categories_preserve_total_sample_wall(self):
  p={'nodes':[{'id':1,'callFrame':{'functionName':'root','url':''},'children':[2,3,4]},{'id':2,'callFrame':{'functionName':'draw','url':'http://localhost/src/render/world.js'}},{'id':3,'callFrame':{'functionName':'tick','url':'http://localhost/src/simulation.js'}},{'id':4,'callFrame':{'functionName':'(idle)','url':''}}],'samples':[2,3,4],'timeDeltas':[2000,3000,5000]};r=ns['sampled'](p);self.assertEqual(r['sampledStackWallMs'],{'render/engine':2,'simulation':3,'(idle)':5});self.assertEqual(r['samples'],3)
 def test_instrumentation_preserves_gl_receiver_arguments_and_return(self):
  init=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name)and t.id=='INIT'for t in n.targets))
  script="const vm=require('node:vm');let cb,clock=0;class GL{drawElements(x){if(!(this instanceof GL))throw Error('receiver');return x}}const w={WebGLRenderingContext:GL,requestAnimationFrame:f=>{cb=f;return 17}};const context={window:w,performance:{now:()=>++clock}};vm.runInNewContext(INIT,context);w.__renderProbe.active=true;const g=new GL;const id=w.requestAnimationFrame(()=>g.drawElements('ok'));if(id!==17||cb(50)!=='ok'||w.__renderProbe.drawCalls!==1||w.__renderProbe.frames[0].draws!==1)throw Error('changed semantics');".replace('INIT',json.dumps(init));r=subprocess.run(['node','-e',script],capture_output=True,text=True);self.assertEqual(r.returncode,0,r.stderr)
 def test_original_load_failure_is_recorded_before_diagnostic_readiness(self):
  fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='navigate');s=ast.get_source_segment(SOURCE.read_text(),fn);self.assertIn("wait_until='load',timeout=60000",s);self.assertLess(s.index("report['errors'].append"),s.index('page.wait_for_function'));self.assertIn("originalLoadError",s)
 def test_acceptance_measures_hidden_resize_and_real_back(self):
  s=SOURCE.read_text();self.assertIn("drawCalls']==0",s);self.assertIn("first.set_viewport_size({'width':844,'height':390})",s);self.assertIn("[data-home-action=back]",s);self.assertIn("frozen(first)==initial",s);self.assertIn("localStorage.getItem('bait-al-dumiah.v1')",s)
 def test_screenshots_are_normal_speed_only(self):
  fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='shot');s=ast.get_source_segment(SOURCE.read_text(),fn);self.assertLess(s.index('if RATE!=1:return'),s.index('page.screenshot'))
 def test_no_second_navigation_obscures_targeted_acceptance(self):
  s=SOURCE.read_text();self.assertNotIn("new_page(context,'second')",s);self.assertNotIn("dispatchEvent",s)
 def test_home_preview_contract_uses_current_canvas_design_and_backing_ratio(self):
  fixture={'canvasRect':{'w':472.625,'h':366},'viewport':{'w':844,'h':390},'canvasPixels':{'w':708,'h':549,'clientW':473,'clientH':366}}
  self.assertTrue(ns['home_landscape_fits'](fixture));fixture['canvasPixels']['w']=390;self.assertFalse(ns['home_landscape_fits'](fixture))
if __name__=='__main__':unittest.main()
