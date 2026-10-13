"""Original score: hand-tuned music-box partials, wooden bass, porcelain taps."""
import math, wave
import numpy as np

def write_score(path):
    rate=48000
    track=np.zeros((60*rate,2),dtype=np.float64)
    notes=[293.665,349.228,440,587.33,440,349.228,329.628,440]
    def tone(start,freq,length,amp,pan=0):
        n=min(int(length*rate),len(track)-int(start*rate))
        if n<=0:return
        t=np.arange(n)/rate
        env=np.minimum(1,t/.012)*np.exp(-t*2.9/length)
        env*=np.minimum(1,(length-t)/.08)
        sig=sum(level*np.sin(2*math.pi*freq*ratio*t) for ratio,level in [(1,1),(2.76,.18),(5.4,.06)])
        sig*=env*amp
        at=int(start*rate)
        track[at:at+n,0]+=sig*math.sqrt((1-pan)/2)
        track[at:at+n,1]+=sig*math.sqrt((1+pan)/2)
    for beat in range(40):
        at=beat*1.5
        tone(at,notes[beat%8],2.8,.11,math.sin(beat*.8)*.3)
        if beat%4==0:tone(at,73.416,3.8,.08)
        if beat%6==2:tone(at+.12,980,.5,.025,.25)
    # A quiet resolved final chord; silence fades naturally before the last frame.
    for i,f in enumerate([146.832,293.665,349.228,440]):tone(55+i*.16,f,4,.07)
    fade=np.minimum(1,np.arange(len(track))/rate/1.2)*np.minimum(1,(60-np.arange(len(track))/rate)/2.2)
    track*=fade[:,None]
    track*=.75/max(.01,np.max(np.abs(track)))
    with wave.open(str(path),'wb') as out:
        out.setnchannels(2);out.setsampwidth(2);out.setframerate(rate)
        out.writeframes((np.clip(track,-1,1)*32767).astype('<i2').tobytes())

if __name__=='__main__':
    from pathlib import Path
    write_score(Path(__file__).resolve().parents[2]/'film'/'score.wav')
