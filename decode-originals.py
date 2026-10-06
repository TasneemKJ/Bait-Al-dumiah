"""Recover canonical original PNGs from a downloaded Actions log ZIP or directory.
Never prints image bytes. Validates every payload against the capture SHA-256.
Usage: python decode-image-logs.py LOG_ZIP_OR_DIRECTORY OUTPUT_DIRECTORY
"""
import base64
import hashlib
import json
from pathlib import Path
import re
import struct
import sys
import os
import zipfile

source, output = map(Path, sys.argv[1:3])
output.mkdir(parents=True, exist_ok=True)
if source.is_dir():
    files = ((str(p), p.read_text(errors='replace')) for p in sorted(source.rglob('*.txt')))
elif zipfile.is_zipfile(source):
    archive = zipfile.ZipFile(source)
    files = ((name, archive.read(name).decode('utf-8', errors='replace')) for name in archive.namelist() if name.endswith('.txt'))
else:
    files = [(source.name, source.read_text(errors='replace'))]
results = []
seen = set()
for filename, text in files:
    metadata = None
    chunks = []
    for line in text.splitlines():
        line = line.lstrip('\ufeff')
        line = re.sub(r'^\d{4}-\d{2}-\d{2}T\S+\s+', '', line)
        if line.startswith('SCENE_IMAGE_BEGIN '):
            metadata = json.loads(line.split('SCENE_IMAGE_BEGIN ', 1)[1])
            chunks = []
        elif metadata and line.startswith('SCENE_IMAGE_DATA '):
            chunks.append(line.split('SCENE_IMAGE_DATA ', 1)[1].strip())
        elif metadata and line.startswith('SCENE_IMAGE_END '):
            encoded = ''.join(chunks)
            assert len(encoded) == metadata['base64Length'], (filename, 'truncated payload')
            data = base64.b64decode(encoded, validate=True)
            assert len(data) == metadata['bytes'] <= 4 * 1024 * 1024
            assert data[:8] == b'\x89PNG\r\n\x1a\n'
            assert struct.unpack('>II', data[16:24]) == (metadata['width'], metadata['height'])
            assert hashlib.sha256(data).hexdigest() == metadata['sha256']
            commit = metadata['sourceCommit']
            assert re.fullmatch('[0-9a-f]{40}', commit)
            revision = metadata['revision']
            assert revision == 'home-integrated'
            assert metadata['evidenceRole']=='visual-1x' and metadata['cpuThrottleRate']==1
            assert metadata['behavioral120SecondEvidence'] is False
            assert metadata['sourceTree']==os.environ['EXPECTED_SOURCE_TREE']
            assert metadata['reviewedSourceDigest']==os.environ['EXPECTED_SOURCE_DIGEST']
            image_name = Path(metadata['path']).name
            assert image_name.endswith('.png')
            assert commit == os.environ['EXPECTED_SOURCE_SHA']
            assert '..' not in Path(metadata['path']).parts
            name = revision + '-' + commit[:12] + '-' + image_name
            if name not in seen:
                (output / name).write_bytes(data)
                (output / (name + '.json')).write_text(json.dumps(metadata, indent=2))
                seen.add(name)
                results.append({'file': name, 'sourceCommit': commit, 'sha256': metadata['sha256'], 'bytes': len(data), 'log': filename})
            metadata = None
            chunks = []
(output / 'decoded-originals.json').write_text(json.dumps(results, indent=2))
print(json.dumps({'decoded': len(results), 'output': str(output), 'files': results}, indent=2))
if not results:
    raise SystemExit('No complete original image payloads found.')
