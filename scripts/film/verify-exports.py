"""Verify final local publishing files and write their exact SHA-256 manifest."""
import hashlib,json,subprocess
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'film'/'exports'
results=[];files=[]
for size in ['1080x1920','1920x1080']:
 width,height=map(int,size.split('x'))
 for lang in ['en','ar']:
  movie=OUT/f'bait-al-dumiah-{lang}-{size}.mp4'
  info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)]))
  video=next(s for s in info['streams'] if s['codec_type']=='video')
  audio=next(s for s in info['streams'] if s['codec_type']=='audio')
  assert (video['width'],video['height'])==(width,height)
  assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
  assert video['avg_frame_rate']=='24/1' and int(video['nb_frames'])==1440
  assert abs(float(info['format']['duration'])-60)<.05
  assert audio['codec_name']=='aac' and audio['sample_rate']=='48000' and audio['channels']==2
  prefix=movie.read_bytes()[:1024*1024];assert 0<prefix.find(b'moov')<prefix.find(b'mdat')
  subtitle=movie.with_suffix('.srt');text=subtitle.read_text(encoding='utf8')
  assert text.count(' --> ')==7 and '00:01:00,000' in text
  results.append({'file':movie.name,'seconds':float(info['format']['duration']),
   'size':size,'bytes':movie.stat().st_size,'video':'H.264/yuv420p/24fps','audio':'AAC/stereo/48kHz',
   'captured_poses_per_second':12,'native_type':True,'subtitle':subtitle.name})
  files.extend([movie,subtitle])
for lang in ['en','ar']:
 path=OUT/f'bait-al-dumiah-{lang}-thumbnail-1280x720.jpg'
 assert Image.open(path).size==(1280,720);files.append(path)
for name in ['production.json','wide-production.json']:
 path=OUT/name;info=json.loads(path.read_text());assert info['capture_fps']==12 and info['fps']==24;files.append(path)
(OUT/'media-verification.json').write_text(json.dumps(results,indent=2))
files.append(OUT/'media-verification.json')
(OUT/'SHA256SUMS.txt').write_text(''.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n' for path in sorted(files)))
print(json.dumps(results,indent=2));print('All four movies, four sidecars and two covers verified; SHA256SUMS.txt written.')
