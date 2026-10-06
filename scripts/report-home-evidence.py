"""Keep 4x behavioral evidence separate from 1x lossless original PNG transport."""
import base64, hashlib, json, os, struct
from pathlib import Path

def report():
 source=os.environ['SOURCE_SHA'];tree=os.environ['SOURCE_TREE'];digest=os.environ['SOURCE_DIGEST'];mode=os.environ['HOME_ACCEPTANCE_MODE']
 if mode not in {'behavior-4x','visual-1x'}:raise ValueError('Unknown evidence role')
 directory=Path('artifacts/home-entry')/mode;result_path=directory/'results.json';capture_path=directory/'capture-manifest.json'
 summary={'sourceCommit':source,'sourceTree':tree,'reviewedSourceDigest':digest,'evidenceRole':mode,'cpuThrottleRate':4 if mode=='behavior-4x' else 1,'reportPresent':result_path.is_file()}
 if not result_path.is_file():print('BAIT_HOME_GATE_RESULT '+json.dumps(summary));raise ValueError('Native results are missing')
 result=json.loads(result_path.read_text());capture=json.loads(capture_path.read_text())
 for item in [result,capture]:
  if item.get('sourceCommit')!=source or item.get('sourceTree')!=tree or item.get('reviewedSourceDigest')!=digest or item.get('evidenceRole')!=mode:raise ValueError('Evidence identity mismatch')
 checks=result.get('checks',[]);summary.update(checks=len(checks),passed=sum(c.get('passed') is True for c in checks),failed=[c for c in checks if c.get('passed') is not True],errors=result.get('errors',[]),captureErrors=result.get('captureErrors',[]))
 records=capture.get('captures',[])
 if records!=result.get('captures',[]):raise ValueError('Capture manifest differs from native results')
 summary['originals']=len(records);print('BAIT_HOME_GATE_RESULT '+json.dumps(summary,ensure_ascii=False))
 for observation in result.get('observations',[]):
  if 'actualGapMs' in observation or 'actualElapsedMs' in observation:print('HOME_NATIVE_TIMING '+json.dumps(observation,ensure_ascii=False))
 for failure in directory.glob('*failure*.json'):print('FAILURE_OBSERVATION '+failure.read_text()[:24000])
 if mode=='behavior-4x':
  if records or list(directory.glob('*.png')):raise ValueError('Behavioral 4x context must never produce screenshots')
  return
 used=0
 for record in records:
  name=record['path'];path=directory/name
  if Path(name).name!=name or not name.endswith('.png'):raise ValueError('Unsafe original path')
  if record.get('evidenceRole')!='visual-1x' or record.get('cpuThrottleRate')!=1 or record.get('behavioral120SecondEvidence') is not False:raise ValueError('Original is not labeled as separate normal-speed evidence')
  if record.get('sourceCommit')!=source or record.get('sourceTree')!=tree or record.get('reviewedSourceDigest')!=digest:raise ValueError('Original source identity mismatch')
  content=path.read_bytes();dimensions=struct.unpack('>II',content[16:24]);sha=hashlib.sha256(content).hexdigest()
  if content[:8]!=b'\x89PNG\r\n\x1a\n' or len(content)!=record['bytes'] or sha!=record['sha256'] or dimensions!=(record['width'],record['height']):raise ValueError('Original bytes/hash/dimensions mismatch')
  if len(content)>2*1024*1024 or used+len(content)>8*1024*1024:raise ValueError('Original transport exceeds its explicit byte bound: '+name)
  used+=len(content);encoded=base64.b64encode(content).decode();metadata={**record,'path':str(path.relative_to('artifacts')),'revision':'home-integrated','base64Length':len(encoded)}
  print('SCENE_IMAGE_BEGIN '+json.dumps(metadata,ensure_ascii=False))
  for i in range(0,len(encoded),12000):print('SCENE_IMAGE_DATA '+encoded[i:i+12000])
  print('SCENE_IMAGE_END '+str(path.relative_to('artifacts')))
 if not records:raise ValueError('No normal-speed originals were captured')

if __name__=='__main__':report()
