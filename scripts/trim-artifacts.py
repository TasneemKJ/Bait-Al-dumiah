"""Shrink failure evidence: <=3 screenshots as ~800px JPEG q60, JSON/log tails only, nothing over 200 KB kept."""
import sys,shutil
from pathlib import Path
src=Path('artifacts');out=Path('failure-evidence');shutil.rmtree(out,ignore_errors=True);out.mkdir()
label=sys.argv[1] if len(sys.argv)>1 else 'run'
MAX=200_000;TAIL=8000
for f in sorted(src.rglob('*')) if src.exists() else []:
 if not f.is_file():continue
 name='__'.join(f.relative_to(src).parts)
 if f.suffix in('.json','.log','.txt'):
  data=f.read_bytes()[-TAIL:]
  if len(data)<=MAX:(out/name).write_bytes(data)
imgs=[f for f in sorted(src.rglob('*.png')) if 'failure' in f.name][:3] if src.exists() else []
try:
 from PIL import Image
 for f in imgs:
  im=Image.open(f).convert('RGB');im.thumbnail((800,800*4));im.save(out/(f.stem+'.jpg'),quality=60,optimize=True)
except Exception as e:(out/'images-skipped.txt').write_text(str(e))
(out/'label.txt').write_text(label)
