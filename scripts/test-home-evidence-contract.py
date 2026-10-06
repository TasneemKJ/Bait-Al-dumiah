"""Lossless transport and exact-source guard tests; no native browser involved."""
import base64, hashlib, importlib.util, json, os, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
class Contracts(unittest.TestCase):
 def setUp(self):self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.env={**os.environ,'SOURCE_SHA':'a'*40,'SOURCE_TREE':'b'*40,'SOURCE_DIGEST':'c'*64,'HOME_ACCEPTANCE_MODE':'visual-1x','EXPECTED_SOURCE_SHA':'a'*40,'EXPECTED_SOURCE_TREE':'b'*40,'EXPECTED_SOURCE_DIGEST':'c'*64}
 def tearDown(self):self.temp.cleanup()
 def fixture(self,mode='visual-1x',rate=1):
  directory=self.root/'artifacts/home-entry'/mode;directory.mkdir(parents=True);self.env['HOME_ACCEPTANCE_MODE']=mode
  record={'path':'visual-1x-unit-fixture.png','sourceCommit':'a'*40,'sourceTree':'b'*40,'reviewedSourceDigest':'c'*64,'evidenceRole':mode,'cpuThrottleRate':rate,'behavioral120SecondEvidence':False,'width':1,'height':1,'bytes':len(PNG),'sha256':hashlib.sha256(PNG).hexdigest()}
  (directory/record['path']).write_bytes(PNG);data={'sourceCommit':'a'*40,'sourceTree':'b'*40,'reviewedSourceDigest':'c'*64,'evidenceRole':mode,'checks':[{'name':'unit fixture only','passed':True}],'errors':[],'observations':[],'captures':[record],'captureErrors':[]}
  for name in ['results.json','capture-manifest.json']:(directory/name).write_text(json.dumps(data))
  return directory,data
 def run_report(self):return subprocess.run([sys.executable,str(HERE/'report-home-evidence.py')],cwd=self.root,env=self.env,text=True,capture_output=True)
 def test_original_transport_and_decode_preserve_exact_bytes_and_labels(self):
  self.fixture();reported=self.run_report();self.assertEqual(reported.returncode,0,reported.stderr);log=self.root/'originals.log';log.write_text(reported.stdout)
  decoded=subprocess.run([sys.executable,str(ROOT/'decode-originals.py'),str(log),str(self.root/'decoded')],cwd=self.root,env=self.env,text=True,capture_output=True);self.assertEqual(decoded.returncode,0,decoded.stderr)
  images=list((self.root/'decoded').glob('*.png'));self.assertEqual(len(images),1);self.assertEqual(images[0].read_bytes(),PNG);meta=json.loads(Path(str(images[0])+'.json').read_text());self.assertEqual(meta['evidenceRole'],'visual-1x');self.assertEqual(meta['cpuThrottleRate'],1);self.assertEqual(meta['sourceTree'],'b'*40)
 def test_4x_cannot_be_mislabeled_as_a_normal_speed_original(self):
  self.fixture(rate=4);result=self.run_report();self.assertNotEqual(result.returncode,0);self.assertIn('not labeled as separate normal-speed',result.stderr)
 def test_behavioral_context_rejects_any_screenshot_artifact(self):
  self.fixture(mode='behavior-4x',rate=4);result=self.run_report();self.assertNotEqual(result.returncode,0);self.assertIn('must never produce screenshots',result.stderr)
 def test_byte_tampering_cannot_pass_transport(self):
  directory,data=self.fixture();(directory/data['captures'][0]['path']).write_bytes(PNG+b'extra');result=self.run_report();self.assertNotEqual(result.returncode,0);self.assertIn('bytes/hash/dimensions mismatch',result.stderr)
 def test_exact_source_manifest_detects_changes_and_unresolved_commit_placeholders(self):
  source=self.root/'source';source.mkdir();p=source/'example.js';p.write_text('export const unit = true;');record={'path':'example.js','sha256':hashlib.sha256(p.read_bytes()).hexdigest()};digest=hashlib.sha256((record['path']+'\0'+record['sha256']+'\n').encode()).hexdigest();manifest=self.root/'source-manifest.json';manifest.write_text(json.dumps({'sourceDigest':digest,'fullSourceFiles':[record]}));env={**self.env,'SOURCE_DIGEST':digest}
  command=[sys.executable,str(HERE/'verify-home-source.py'),str(manifest),'--source-root',str(source),'--files-only'];passed=subprocess.run(command,env=env,text=True,capture_output=True);self.assertEqual(passed.returncode,0,passed.stderr)
  unresolved=subprocess.run(command[:-1],env={**env,'SOURCE_SHA':'__UNRESOLVED__'},text=True,capture_output=True);self.assertNotEqual(unresolved.returncode,0);self.assertIn('Unresolved or invalid SOURCE_SHA',unresolved.stderr)
  p.write_text('changed');failed=subprocess.run(command,env=env,text=True,capture_output=True);self.assertNotEqual(failed.returncode,0);self.assertIn('Source mismatch: example.js',failed.stderr)
if __name__=='__main__':unittest.main()
