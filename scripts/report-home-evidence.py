"""Small exact-source summaries and lossless canonical PNG log transport."""
import base64,hashlib,json,os,struct
from pathlib import Path
source=os.environ['SOURCE_SHA'];journey=os.environ['JOURNEY']
if journey=='home-entry':
 directories=[Path('artifacts/home-entry')]
 selected=[f'{locale}-{size}-{view}.png' for locale in ['en','ar'] for size,view in [('320x568','home'),('390x844','home'),('844x390','home'),('390x844','preferences')]]
 selected += [f'{locale}-{stage}.png' for locale in ['en','ar'] for stage in ['01-first-play','02-real-thread','03-real-seam-entry','04-after-120-real-seconds','05-returning-continue','read-failure','audio-failure','failure-state']]
else:
 directories=[Path('artifacts/scene-stability/all'),Path('artifacts/scene-stability/home-landscape')]
 selected=['en-upper-prop.png','en-held-selected.png','ar-upper-prop.png','ar-held-selected.png','ar-selected-landscape.png','en-after-two-taps.png','ar-after-two-taps.png','en-unreachable-before.png','ar-unreachable-before.png']
used=0
for d in directories:
 p=d/'results.json';summary={'sourceCommit':source,'journey':journey,'directory':str(d),'reportPresent':p.is_file()}
 if p.is_file():
  r=json.loads(p.read_text());checks=r.get('checks',[]);summary.update(checks=len(checks),passed=sum(c.get('passed') is True for c in checks),failed=[c for c in checks if c.get('passed') is not True],errors=r.get('errors',[]))
  for observation in r.get('observations',[]):
   if 'actualGapMs' in observation:print('UNCHANGED_INPUT_TIMING '+json.dumps({k:observation.get(k) for k in ['case','locale','requestedGapMs','actualGapMs','target']}))
 print('BAIT_HOME_GATE_RESULT '+json.dumps(summary,ensure_ascii=False))
 for p in d.glob('*failure*.json'):print('FAILURE_OBSERVATION '+p.read_text()[:24000])
 for name in selected:
  path=d/name
  if not path.is_file():continue
  data=path.read_bytes()
  if len(data)>2*1024*1024 or used+len(data)>8*1024*1024:
   print('IMAGE_TRANSPORT_SKIPPED '+str(path));continue
  assert data[:8]==b'\x89PNG\r\n\x1a\n'
  used+=len(data);width,height=struct.unpack('>II',data[16:24]);encoded=base64.b64encode(data).decode()
  print('SCENE_IMAGE_BEGIN '+json.dumps({'path':str(path.relative_to(Path('artifacts'))),'sourceCommit':source,'revision':'home-slice','width':width,'height':height,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'base64Length':len(encoded)}))
  for i in range(0,len(encoded),12000):print('SCENE_IMAGE_DATA '+encoded[i:i+12000])
  print('SCENE_IMAGE_END '+str(path.relative_to(Path('artifacts'))))
