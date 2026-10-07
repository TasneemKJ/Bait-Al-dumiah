// Unit conversions for what the player reads on screen. Rules and state stay in simulation.js.

// Degrees of the clock face swept by the day so far; a corrupt clock reads as dawn.
export const daySweepDegrees=s=>Number.isFinite(s.clock)?Math.max(0,Math.min(240,s.clock))*1.5:0;
// Whole-number percent of a cup's fill or target (0-1 scale).
export const teaPercent=value=>Math.round(Math.max(0,value)*100);
// Whole-number percent of the cloth for a needle or guide coordinate (-1..1 scale).
export const stitchCoordinate=value=>Math.round(value*100);
