# Forty reference-game iterations — ledger

Plan: `docs/research/REFERENCE-GAMES-2026-10-14.md`. One line per shipped iteration:
n · title · reference · what changed · test.

- 01 · Today sheet with three daily errands · Cozy Grove · new Today panel leads House Tools; three seeded errands per day from real house actions (care, basket, rituals, keepsakes, visitor); actions mark them done with a notice; refresh only after a full day; grove record whitelisted in restore() · tests/grove-errands.test.mjs
- 02 · Collect a finished errand for lantern embers · Cozy Grove · done errands show a Collect button in Today; collecting is the only payout (one ember, no buttons), once; ember count on the sheet; cmd-grove.js command module · tests/grove-errands.test.mjs (collect once, by hand)
