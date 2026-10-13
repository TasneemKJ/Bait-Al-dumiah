"""Reproducible native 1080x1920 bilingual film; start the repo server on PORT first.
Browser rendering yields the shared GPU lock between configurable short batches.
"""
from pathlib import Path
import os,base64,subprocess,time,fcntl,json,io
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'film'/'exports';OUT.mkdir(parents=True,exist_ok=True)
FPS=12;FRAMES=60*FPS;WIDE=os.environ.get('FILM_LAYOUT')=='wide'
WIDTH=int(os.environ.get('FILM_WORLD_WIDTH','1920' if WIDE else '1080'))
HEIGHT=WIDTH*9//16 if WIDE else WIDTH*16//9;PORT=os.environ.get('PORT','4214')
SIZE='1920x1080' if WIDE else '1080x1920';TAG='wide-' if WIDE else ''
QUERY_SUFFIX='&wide' if WIDE else ''
BATCH=int(os.environ.get('FILM_BATCH','24'))
score=ROOT/'film'/'score.wav';score_source=ROOT/'scripts/film/score.py'
if not score.exists() or score.stat().st_mtime<score_source.stat().st_mtime:
 subprocess.run(['python3',str(score_source)],check=True)
errors=[]
with sync_playwright() as p,open('/tmp/browser.lock','w') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,
  args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--renderer-process-limit=1'])
 page=browser.new_page(viewport={'width':540,'height':960});page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(f'http://127.0.0.1:{PORT}/scripts/film/preview.html?width={WIDTH}&height={HEIGHT}{QUERY_SUFFIX}',timeout=180000)
 page.wait_for_function('window.filmReady',timeout=180000)
 fcntl.flock(lock,fcntl.LOCK_UN)
 encoders=[];logs=[];pending=[]
 for lang in ['en','ar']:
  log=open(OUT/f'{TAG}{lang}-encode.log','w');logs.append(log)
  pending.append((OUT/f'.{lang}-{SIZE}.rendering.mp4',OUT/f'bait-al-dumiah-{lang}-{SIZE}.mp4'))
  encoders.append(subprocess.Popen(['ffmpeg','-y','-v','error','-f','image2pipe','-vcodec','mjpeg',
   '-r',str(FPS),'-i','pipe:0','-i',str(score),'-c:v','libx264','-preset','fast','-crf','23',
   '-threads','1','-vf','fps=24','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-af',
   'loudnorm=I=-16:TP=-1.8:LRA=9','-ar','48000','-t','60','-movflags','+faststart',
   str(pending[-1][0])],stdin=subprocess.PIPE,stderr=log))
 try:
  start=time.monotonic()
  for begin in range(0,FRAMES,BATCH):
   fcntl.flock(lock,fcntl.LOCK_EX)
   try:
    for frame in range(begin,min(begin+BATCH,FRAMES)):
     pair=page.evaluate('t=>renderPair(t)',frame/FPS)
     for lang,encoder,data in zip(['en','ar'],encoders,pair):
      content=base64.b64decode(data.split(',')[1]);encoder.stdin.write(content)
      if frame in [3*FPS,15*FPS,22*FPS,30*FPS,38*FPS,45*FPS,57*FPS]:
       (OUT/f'{TAG}{lang}-{frame//FPS:02d}.jpg').write_bytes(content)
   finally:fcntl.flock(lock,fcntl.LOCK_UN)
   print(f'{min(begin+BATCH,FRAMES)}/{FRAMES} frames, {time.monotonic()-start:.1f}s',flush=True)
   time.sleep(.05)
  if WIDE:
   fcntl.flock(lock,fcntl.LOCK_EX)
   try:
    for lang in ['en','ar']:
     data=page.evaluate('lang=>renderPoster(lang)',lang)
     poster=Image.open(io.BytesIO(base64.b64decode(data.split(',')[1])))
     poster.resize((1280,720),Image.Resampling.LANCZOS).save(
      OUT/f'bait-al-dumiah-{lang}-thumbnail-1280x720.jpg',quality=96)
   finally:fcntl.flock(lock,fcntl.LOCK_UN)
 finally:
  for encoder in encoders:
   encoder.stdin.close()
  statuses=[encoder.wait() for encoder in encoders]
  for log in logs:log.close()
  browser.close()
 assert statuses==[0,0],statuses
 assert not errors,errors
 # Never replace publishing files with interrupted or short encodes.
 for temporary,final in pending:
  info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(temporary)]))
  video=next(s for s in info['streams'] if s['codec_type']=='video')
  assert int(video['nb_frames'])==1440 and abs(float(info['format']['duration'])-60)<.05
 for temporary,final in pending:temporary.replace(final)
(OUT/f'{TAG}production.json').write_text(json.dumps({'seconds':60,'capture_fps':12,'fps':24,'cadence':'each captured 3D frame held twice','width':1920 if WIDE else 1080,'height':1080 if WIDE else 1920,
 'world_width':WIDTH,'world_height':HEIGHT,'source':'actual local Three house and dolls',
 'captions':'native browser canvas shaping','sound':'original procedural music box; no narration'},indent=2))
