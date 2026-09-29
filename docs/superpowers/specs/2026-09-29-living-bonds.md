# Living bonds: gameplay depth

## Problem
After the first day the loop ran out: each doll wished for the same thing every day, `bond` was stored but never used, needs had no effect on anything, and the mystery went forward whether or not the house was cared for.

## Design
- **Rotating wishes.** `wishFor(state, doll)` is deterministic from the day. Day one keeps the authored wish (the browser contract and first-session tutorial). Later days draw from each doll's `wishes` list in `content.js`. A wished-for action skips the "already content" refusal.
- **Closeness.** `BOND_LEVELS` = 0/15/35/60/90. Care gives 4 closeness; a wish adds 4 more; reassurance at night adds 2 more; the favourite room multiplies by 1.5. Each new level pays 5×level buttons and raises the wish reward by 2. Levels 1–3 unlock authored memories.
- **Favourites.** `favRoom` slows comfort fading (×0.6). `favItem` in the doll's room lowers the contentment threshold from 55 to 45.
- **Sewing basket.** A content doll sews one button per 40 s of unpaused play into `basket`, at most `SEW_DAILY` (9) a day. The basket is collected explicitly, so spending and refunds stay exact.
- **Full house and streak.** The third wish of a day pays 4 + 2×min(streak, 5). The streak continues when yesterday was also a full house.
- **Milestones.** Conditions are checked after each action and step. A reached milestone is added to `achieved` and waits in the journal until collected (`milestones` holds the collected IDs).
- **Whisper gating.** `SECRET_COZY` sets the coziness each whisper needs. The first two are free; later ones ask for a cozier house. A refusal returns `needed` so the UI can name the target.
- **Notices.** The simulation adds transient `events`. `main.js` drains them into a paced toast queue, so rewards never overwrite one another. Events are never restored from a save.

## Save compatibility
The save key and `version: 1` are unchanged. New fields (`streak`, `lastFullDay`, `sewnToday`, `basket`, `earnedToday`, `achieved`, `milestones`) are whitelisted and clamped in `restore()`. An earlier save missing them loads with safe defaults, and it earns its milestones retroactively as collectable rewards (tested).

## Boundaries kept
No offline decay, no loss, no punishment: nothing is taken away, and a streak that lapses just starts again. All copy is in English and Shami Arabic, with gender-neutral phrasing wherever a shared string names Lina (feminine) or Noor/Sami (masculine).
