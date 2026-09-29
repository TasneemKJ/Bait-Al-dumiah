// Pure visual score: no saved state, random timers, or cumulative transforms.
// A paused simulation supplies the same elapsed time, so every cue holds still.
const unit = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const smooth = value => { const x = unit(value); return x*x*(3-2*x); };
export function nightFrame(elapsed, nightMix, reducedMotion = false) {
 const t = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
 const night = unit(nightMix), phase = t % 72;
 const passage = smooth((phase-12)/5) * (1-smooth((phase-23)/6));
 const breath = reducedMotion ? .5 : .5+.5*Math.sin(t*.17);
 return {
  shadow: reducedMotion ? 0 : night*.24*passage,
  shadowX: reducedMotion ? 0 : -.22+.44*smooth((phase-12)/17),
  door: night*(.12+.18*breath),
  lamp: 1-night*(reducedMotion ? .02 : .02+.02*Math.sin(t*.29)),
  ripple: reducedMotion ? 0 : .5+.5*Math.sin(t*.63),
 };
}
