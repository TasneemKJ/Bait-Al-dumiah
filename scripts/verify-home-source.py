"""Fail closed unless the source checkout matches the reviewed pure candidate."""
import argparse, hashlib, json, os, re, subprocess
from pathlib import Path

def verify(root,manifest,files_only=False):
 data=json.loads(manifest.read_text());records=data['fullSourceFiles'];digest=hashlib.sha256(''.join(r['path']+'\0'+r['sha256']+'\n' for r in records).encode()).hexdigest()
 if digest!=data['sourceDigest']:raise ValueError('Manifest source digest is inconsistent')
 if os.environ.get('SOURCE_DIGEST')!=digest:raise ValueError('Reviewed source digest is not the approved digest')
 for record in records:
  relative=Path(record['path'])
  if relative.is_absolute() or '..' in relative.parts:raise ValueError('Unsafe manifest path')
  path=root/relative
  if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=record['sha256']:raise ValueError('Source mismatch: '+record['path'])
 if not files_only:
  for key in ['SOURCE_SHA','SOURCE_TREE']:
   if not re.fullmatch('[0-9a-f]{40}',os.environ.get(key,'')):raise ValueError('Unresolved or invalid '+key)
  for expr,key in [('HEAD','SOURCE_SHA'),('HEAD^{tree}','SOURCE_TREE')]:
   actual=subprocess.check_output(['git','rev-parse',expr],cwd=root,text=True).strip()
   if actual!=os.environ[key]:raise ValueError('Checkout identity mismatch: '+key)
  tracked=set(subprocess.check_output(['git','ls-files'],cwd=root,text=True).splitlines());expected={r['path'] for r in records}
  if tracked!=expected:raise ValueError('Tracked source inventory differs from reviewed candidate')
 return {'sourceDigest':digest,'files':len(records),'commitAndTreeChecked':not files_only}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('manifest',type=Path);parser.add_argument('--source-root',type=Path,default=Path.cwd());parser.add_argument('--files-only',action='store_true');args=parser.parse_args()
 print(json.dumps(verify(args.source_root,args.manifest,args.files_only),indent=2))
