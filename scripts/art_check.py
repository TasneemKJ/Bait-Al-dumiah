"""Construct and inspect the actual Three.js artwork in a DOM fixture (no GPU).
Full rendered checks remain in play_check.py; these checks cannot certify pixels.
"""
import json, os, posixpath, re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]

def sources():
    files = {f'project/{p.relative_to(ROOT).as_posix()}': p.read_text() for p in (ROOT/'src').rglob('*.js')}
    for p in (ROOT/'tests').glob('art-*-checks.js'):
        files[f'project/tests/{p.name}'] = p.read_text()
    files['three/addons/controls/OrbitControls.js'] = (ROOT/'node_modules/three/examples/jsm/controls/OrbitControls.js').read_text()
    for name in ['three.module.min.js', 'three.core.min.js']:
        files['vendor/'+name] = (ROOT/'node_modules/three/build'/name).read_text()
    for name, source in files.items():
        def resolve(m):
            target = posixpath.normpath(posixpath.join(posixpath.dirname(name), m[2]))
            return 'from '+json.dumps(target)
        files[name] = re.sub(r'from\s*([\'"])(\.{1,2}/[^\'"]+)\1', resolve, source)
    return files

with sync_playwright() as p:
    opts = {'headless': True}
    if os.environ.get('CHROMIUM_PATH'): opts['executable_path'] = os.environ['CHROMIUM_PATH']
    browser = p.chromium.launch(**opts)
    page = browser.new_page()
    page.set_content('<!doctype html><html><head></head><body>Artwork construction fixture</body></html>')
    results = page.evaluate('''async sources => {
      const imports={};
      for(const [id,code] of Object.entries(sources)) imports[id]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
      imports.three=imports['vendor/three.module.min.js'];
      const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);
      const results=[];
      for(const id of Object.keys(sources).filter(id=>id.startsWith('project/tests/art-')&&id.endsWith('-checks.js')).sort()){
        const suite=await import(id);results.push(...await suite.runArtChecks());
      }
      return results.sort((a,b)=>a.name.localeCompare(b.name));
    }''', sources())
    browser.close()
output = Path(os.environ.get('ART_RESULTS', ROOT/'artifacts/art-checks.json'))
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(results, indent=2))
failed = [r for r in results if not r['passed']]
print(json.dumps({'passed':len(results)-len(failed),'total':len(results),'failed':failed},indent=2))
raise SystemExit(bool(failed))
