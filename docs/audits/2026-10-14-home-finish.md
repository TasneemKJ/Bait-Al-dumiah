# Home finish-line review — 2026-10-14

This batch is stacked on the House Tools safe-area repair in PR #53.

## Player-facing changes

- A saved night house paints as night on the first Home frame instead of briefly starting from the daytime lighting state.
- Home has a dedicated night surface and control treatment so the entry screen belongs to the same house hour as the miniature.
- Home preview rendering is capped at 15 fps while the simulation is inactive.
- Renderer pixel density follows device-pixel-ratio changes even when the selected quality tier does not change.
- Short-lived feedback belongs to the sheet that caused it. Persistent storage/save warnings remain global.

No save schema, gameplay economy, story copy, interaction verbs, audio content, dependency, workflow or deployment change is introduced.

## Verification

The regression file was observed RED against the PR #53 source before implementation: five of six new checks failed. After implementation:

- `node --test tests/finish-line-home.test.mjs`: 6/6 passed.
- `npm run verify`: lint passed; 539/539 native tests passed; production build passed.
- Built JavaScript: 419,860 / 512,000 bytes gzip.

The first full gate caught one repo architecture rule violation (a 135-character line in `render/world.js`). The declaration was split and the complete gate was rerun successfully.

## Remaining acceptance

This is a draft until current-source browser/device review is repeated for English and Arabic Home/Preferences, saved day/night entry, rotation, safe areas, reduced motion and Safari/physical-device rendering. The earlier PR #53 should land first or this PR should be rebased before merge.

This batch is not counted as 400 full-game design iterations.
