"""Measures the intro caption's WCAG contrast against the pixels actually rendered behind it.

For one moment of the intro it holds the caption at full opacity, reads the ink colour and the line boxes of
the text, then hides only the glyphs and their halo (the paper plate stays) and screenshots those boxes. Every
sampled pixel is a background the ink must read against, so the result is the worst ratio over all of them.
No image library is needed: Chromium's screenshots are plain 8-bit PNGs, decoded here with zlib.
"""
import struct,zlib

AA=4.5
HOLD='intro-contrast-hold'
PROBE='''([mode,id])=>{
 const line=document.querySelector('.intro-layer:not([hidden]) .intro-line');if(!line)return null;
 let style=document.getElementById(id);
 if(mode==='off'){style?.remove();return true}
 if(!style){style=document.createElement('style');style.id=id;document.head.append(style)}
 style.textContent='.intro-line{opacity:1!important;transform:none!important}'+
  (mode==='bare'?'.intro-line{color:transparent!important;text-shadow:none!important}':'');
 if(mode!=='hold')return true;
 const range=document.createRange();range.selectNodeContents(line);
 const rects=[...range.getClientRects()].filter(r=>r.width>1&&r.height>1).map(r=>({x:r.left,y:r.top,w:r.width,h:r.height}));
 return {ink:getComputedStyle(line).color,text:line.textContent,rects};
}'''

def decode_png(data):
 """RGB rows of an 8-bit, non-interlaced RGB or RGBA PNG."""
 assert data[:8]==b'\x89PNG\r\n\x1a\n','not a PNG'
 pos,idat=8,b''
 while pos<len(data):
  size,kind=struct.unpack('>I4s',data[pos:pos+8]);body=data[pos+8:pos+8+size];pos+=12+size
  if kind==b'IHDR':width,height,depth,colour,_,_,interlace=struct.unpack('>IIBBBBB',body)
  elif kind==b'IDAT':idat+=body
 assert depth==8 and colour in (2,6) and not interlace,'unsupported PNG'
 bpp=3 if colour==2 else 4;stride=width*bpp;raw=zlib.decompress(idat);rows=[];prev=bytearray(stride)
 for y in range(height):
  kind=raw[y*(stride+1)];line=bytearray(raw[y*(stride+1)+1:(y+1)*(stride+1)])
  for i in range(stride):
   a=line[i-bpp] if i>=bpp else 0;b=prev[i];c=prev[i-bpp] if i>=bpp else 0
   if kind==1:line[i]=(line[i]+a)&255
   elif kind==2:line[i]=(line[i]+b)&255
   elif kind==3:line[i]=(line[i]+(a+b)//2)&255
   elif kind==4:
    p=a+b-c;pa,pb,pc=abs(p-a),abs(p-b),abs(p-c)
    line[i]=(line[i]+(a if pa<=pb and pa<=pc else b if pb<=pc else c))&255
  rows.append([tuple(line[x*bpp:x*bpp+3]) for x in range(width)]);prev=line
 return rows

def luminance(rgb):
 def channel(v):
  v/=255;return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
 r,g,b=rgb;return .2126*channel(r)+.7152*channel(g)+.0722*channel(b)

def ratio(a,b):
 la,lb=sorted((luminance(a),luminance(b)),reverse=True);return (la+.05)/(lb+.05)

def parse_colour(text):
 parts=text[text.index('(')+1:text.index(')')].replace('/',' ').replace(',',' ').split()
 return tuple(round(float(p)) for p in parts[:3])

def measure(page):
 """The caption's worst contrast right now: {ratio, ink, worst, pixels, text}, or None with no caption shown."""
 held=page.evaluate(PROBE,['hold',HOLD])
 if not held or not held['rects']:
  page.evaluate(PROBE,['off',HOLD]);return None
 try:
  page.evaluate(PROBE,['bare',HOLD]);page.wait_for_timeout(50)
  ink=parse_colour(held['ink']);worst=None;count=0
  for r in held['rects']:
   clip={'x':max(0,r['x']),'y':max(0,r['y']),'width':max(1,r['w']),'height':max(1,r['h'])}
   for row in decode_png(page.screenshot(clip=clip,timeout=120000)):
    for pixel in row:
     count+=1;value=ratio(ink,pixel)
     if worst is None or value<worst[0]:worst=(value,pixel)
 finally:
  page.evaluate(PROBE,['off',HOLD])
 return {'ratio':round(worst[0],2),'ink':ink,'worst':worst[1],'pixels':count,'text':held['text']}
