# Forty reference-game iterations — ledger

Plan: `docs/research/REFERENCE-GAMES-2026-10-14.md`. One line per shipped iteration:
n · title · reference · what changed · test.

- 01 · Today sheet with three daily errands · Cozy Grove · new Today panel leads House Tools; three seeded errands per day from real house actions (care, basket, rituals, keepsakes, visitor); actions mark them done with a notice; refresh only after a full day; grove record whitelisted in restore() · tests/grove-errands.test.mjs
- 02 · Collect a finished errand for lantern embers · Cozy Grove · done errands show a Collect button in Today; collecting is the only payout (one ember, no buttons), once; ember count on the sheet; cmd-grove.js command module · tests/grove-errands.test.mjs (collect once, by hand)
- 03 · Tend the courtyard lantern · Cozy Grove (bonfire) · Today opens with a lantern card (CSS brass fanous, level name, warmth meter); Tend spends all held embers as warmth; six thresholds (cold wick to lighting the lane), level-up notice, no decay · tests/grove-lantern.test.mjs
- 04 · The courtyard lantern grows in 3D · Cozy Grove (bonfire) · brass fanous on the courtyard tiles mirroring the fountain; flame, glass warmth, glow sprite and floor pool follow the lantern level and night, flicker only with motion; touching it opens Today (351 calls measured) · tests/grove-lantern-render.test.mjs
- 05 · Colour returns to the house · Cozy Grove · scene saturation rises from 0.88 to full with the lantern level (CSS filter on the canvas, removed entirely at the top level, eased transition); houses saved before the lantern start at level 2 so returning players never lose colour · tests/grove-lantern.test.mjs (colour + legacy warmth)
