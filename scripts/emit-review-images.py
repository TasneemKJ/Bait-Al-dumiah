"""Transport selected original CI screenshots through read-only job logs.

PNG artifacts remain the canonical files. This optional review step does not
resize, redraw, crop or otherwise modify them.
"""
import base64
import hashlib
import json
import os
from pathlib import Path
import struct
import sys

SELECTED = {
    'tea': {
        'desktop': ['02-desktop-spill', '06-desktop-served'],
        'phone': [
            '08-arabic-phone-overfilled', '09-arabic-phone-served',
            '10-small-phone-guest-empty', '11-small-phone-guest-served',
            '12-arabic-landscape-night-empty', '14-arabic-landscape-night-served',
            '15-phone-night-empty',
        ],
        'progression': [
            '16-small-phone-three-cup-empty',
            '17-arabic-three-cup-ready', '18-arabic-three-cup-served',
        ],
    },
    'chimes': {
        'desktop': ['00-bedroom-mobile', '01-instrument', '02-held-charm', '03-finished-mobile', '05-earned-constellation'],
        'phone': [
            '00-bedroom-mobile', '01-instrument', '02-touch-held', '03-finished-mobile',
            '04-arabic-320x568', '04-arabic-667x320', '05-earned-constellation',
        ],
    },
    'stitch': {
        'desktop': [
            '01-desktop-empty', '02-desktop-mid-stitch',
            '03-desktop-loose-thread', '06-desktop-finished',
        ],
        'phone': [
            '09-small-phone-bear-seam', '10-small-phone-bear-finished',
            '11-bear-patch', '11b-earned-moon-instrument', '12-arabic-landscape-night',
            '13-phone-night-finished',
        ],
        'progression': [
            '14-small-phone-diamond', '15-small-phone-jasmine',
            '16-arabic-jasmine-ready', '17-arabic-jasmine-finished',
        ],
    },
}

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/emit-review-images.py artifacts/FAMILY/SCENARIO')
    directory = Path(sys.argv[1]).resolve()
    artifacts = (Path(__file__).resolve().parents[1] / 'artifacts').resolve()
    family, scenario = directory.parent.name, directory.name
    if directory.parent.parent != artifacts or family not in SELECTED or scenario not in SELECTED[family]:
        raise SystemExit('Review images must be a known physical-play scenario inside artifacts.')
    failure = directory / 'failure-state.json'
    if failure.is_file() and failure.resolve().is_relative_to(artifacts):
        if failure.stat().st_size <= 256 * 1024:
            observed = json.loads(failure.read_text())
            print('SCENE_FAILURE_STATE ' + json.dumps(observed, separators=(',', ':')), flush=True)
        else:
            print('SCENE_FAILURE_STATE_TOO_LARGE', flush=True)
    names = list(SELECTED[family][scenario])
    if (directory / 'failure.png').is_file():
        names.append('failure')
    for name in names:
        path = directory / (name + '.png')
        if not path.is_file():
            print('SCENE_IMAGE_MISSING ' + name, flush=True)
            continue
        if not path.resolve().is_relative_to(artifacts):
            raise SystemExit('Review image resolves outside artifacts.')
        data = path.read_bytes()
        if len(data) < 24 or len(data) > 4 * 1024 * 1024 or data[:8] != b'\x89PNG\r\n\x1a\n':
            raise SystemExit('Expected an original PNG no larger than 4 MiB: ' + name)
        width, height = struct.unpack('>II', data[16:24])
        encoded = base64.b64encode(data).decode('ascii')
        meta = {
            'name': name, 'scenario': scenario, 'activity': family,
            'sourceCommit': os.environ.get('GITHUB_SHA', 'local'),
            'width': width, 'height': height, 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest(),
            'base64Length': len(encoded),
        }
        print('SCENE_IMAGE_BEGIN ' + json.dumps(meta), flush=True)
        for start in range(0, len(encoded), 12000):
            print('SCENE_IMAGE_DATA ' + encoded[start:start + 12000], flush=True)
        print('SCENE_IMAGE_END ' + name, flush=True)

if __name__ == '__main__':
    main()
