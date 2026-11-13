import sys,base64
from playwright.sync_api import sync_playwright
RAW='/tmp/bait-shots'; OUT=sys.argv[1]
C={'ar':[('01-night','بيتٌ صغير، وثلاث أرواح صغيرة'),('02-house','اعتنِ بالدمى في بيتها'),('03-kitchen','لكلّ دميةٍ غرفةٌ وحكاية'),('04-tea','حضّر الشاي بيدك'),('06-whispers','اكشف أسرار البيت ليلةً بعد ليلة')],
   'en':[('01-night','A tiny home. Three little souls.'),('02-house','Care for the dolls in their home'),('03-kitchen','Every doll has a room and a story'),('04-tea','Brew the tea by hand'),('06-whispers','Uncover the house\'s secrets, night by night')]}
NAMES=['01-night','02-house','03-dolls','04-tea','05-whispers']
with sync_playwright() as p:
  b=p.chromium.launch(headless=True); pg=b.new_page(viewport={'width':1320,'height':2868})
  for L,items in C.items():
    for i,(f,cap) in enumerate(items):
      img=base64.b64encode(open(f'{RAW}/{L}/{f}.png','rb').read()).decode()
      font="'DecoType Naskh','Geeza Pro',serif" if L=='ar' else "Georgia,'Times New Roman',serif"
      size=116 if L=='ar' else 92
      night=f=='01-night'
      bg='radial-gradient(120% 60% at 50% 0%,#3d3150 0%,#2a2236 50%,#1b1624 100%)' if night else 'radial-gradient(120% 60% at 50% 0%,#fbf3ec 0%,#f1e3da 55%,#e6d2cb 100%)'
      ink='#f6dfe6' if night else '#5b3f57'; line='#c995a8'
      html=f'''<html dir="{'rtl' if L=='ar' else 'ltr'}"><body style="margin:0;width:1320px;height:2868px;overflow:hidden;background:{bg};font-family:{font}">
<div style="position:absolute;top:150px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:26px">
<span style="width:150px;height:2px;background:linear-gradient(90deg,transparent,{line})"></span>
<span style="width:18px;height:18px;border-radius:50%;background:{line};box-shadow:0 0 18px {line}"></span>
<span style="width:150px;height:2px;background:linear-gradient(270deg,transparent,{line})"></span></div>
<div style="position:absolute;top:205px;left:70px;right:70px;text-align:center;color:{ink};font-size:{size}px;line-height:1.25">{cap}</div>
<div style="position:absolute;top:470px;left:110px;width:1100px;height:2384px;border-radius:64px;overflow:hidden;
border:4px solid {line};box-shadow:0 0 0 10px rgba(201,149,168,.15),0 40px 110px rgba(60,30,50,.35)">
<img src="data:image/png;base64,{img}" style="width:100%;height:100%;display:block;object-fit:cover"></div></body></html>'''
      pg.set_content(html); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/{L}/{NAMES[i]}.png')
  b.close()
