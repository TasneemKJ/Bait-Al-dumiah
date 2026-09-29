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

## Iteration 2: the closed door
A scripted 14-day playthrough found that a reasonable player reached Family, every whisper and a fully decorated house by about day 6 (around 22 minutes of active play). After that, buttons piled up with nothing to buy (about 960 by day 14).
- **The closed door** (`DOOR_STEPS`) is a lore-tied button sink of 40/60/80/100/150. *Borrow the eleventh key* needs closeness level 3 with Sami, which pays off his third memory. *Open the fifth room* needs all six whispers. Each step is authored text, and the ending keeps the mystery.
- **Visitor gifts** (`GIFT_COST` 12, one a night, only after the door opens) give back the eight `VISITOR_GIFTS` in order. After all eight, it stays a small soothing nightly ritual.
- Two more milestones: `door-open` (30) and `all-gifts` (40).
- In the same playthrough, the door finishes on day 6 and the last gift arrives on day 13 (about 50 minutes). Spending on the door and gifts cuts day-14 savings from about 960 to about 540 buttons.
