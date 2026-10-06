import base64,hashlib,io,json,os,zipfile
from pathlib import Path
root=Path('artifacts/render-probe');report=json.loads((root/'report.json').read_text());assert report['sourceCommit']==os.environ['SOURCE_SHA']
buf=io.BytesIO()
with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED)as z:
 for p in sorted(root.glob('*.json')):z.writestr(p.name,p.read_bytes())
data=buf.getvalue();assert len(data)<=2*1024*1024,'Diagnostic packet exceeds transport bound';encoded=base64.b64encode(data).decode();meta={'sourceCommit':report['sourceCommit'],'sourceTree':report['sourceTree'],'cpuThrottleRate':report['cpuThrottleRate'],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'base64Length':len(encoded),'format':'zip of unchanged JSON profile/frame/report files'}
print('DIAG_PACKET_BEGIN '+json.dumps(meta),flush=True)
for i in range(0,len(encoded),12000):print('DIAG_PACKET_DATA '+encoded[i:i+12000],flush=True)
print('DIAG_PACKET_END',flush=True)
