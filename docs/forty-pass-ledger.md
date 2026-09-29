# Forty visual refinement passes

Base: `e3ffe29b18b894305baabb7706d1f7fd664caab6`. Forty concrete implementation/test passes, each with a regression test and a separate local source commit. Changes are transferred to the existing PR in four batch commits. The local commit IDs below identify the retained source-history bundle; they are not additional GitHub commit URLs.

Every pass ran the cumulative real-DOM/Three.js construction assertions and `npm run verify` (36 Node tests plus the production build). Actual WebGL screenshots and full-game checks run at the batch checkpoints, not forty separate full-device playtests. Original gameplay, saves and audio content remain unchanged.

| Pass | Local source commit | Concrete refinement | Art assertions passing |
|---|---|---|---|
| 01 | `3c0d46f` | Share radial masks for lamps and contact shadows | 1 |
| 02 | `eb80a49` | Batch opaque artwork by material while preserving transforms | 2 |
| 03 | `f2d7a7d` | Add restrained walnut grain relief | 3 |
| 04 | `2259484` | Add woven thread relief to cloth and doll clothing | 4 |
| 05 | `cedb365` | Glaze porcelain tea cups and saucers | 5 |
| 06 | `0d03d23` | Replace solid lamp cones with open pleated shades | 6 |
| 07 | `9897199` | Replace capsule curtains with six draped fabric panels | 7 |
| 08 | `9ee2e25` | Add scalloped valances above the windows | 8 |
| 09 | `71d079e` | Add transparent lace tea-table doilies | 9 |
| 10 | `9ea4202` | Replace bead eaves with carved scalloped trim | 10 |
| 11 | `481345e` | Arrange five miniature pastries on a brass counter tray | 11 |
| 12 | `07c969f` | Add a glazed utensil crock with wooden spoons | 12 |
| 13 | `306232c` | Hang a folded striped tea towel beside the sink | 13 |
| 14 | `5c23c9c` | Label pantry jars with miniature botanical motifs | 14 |
| 15 | `8e247e4` | Open a hand-illustrated storybook beside the parlor tea cup | 15 |
| 16 | `db56ae4` | Stitch a floral cushion motif and four corner tassels | 16 |
| 17 | `0b56221` | Place five lavender sprigs in a glazed bookcase vase | 17 |
| 18 | `0a0fcc4` | Hang a floral embroidery hoop with stretched linen and brass clamp | 18 |
| 19 | `7426589` | Lay brass scissors and a curled measuring tape on the sewing desk | 19 |
| 20 | `c6acdf9` | Finish the moon-bedroom quilt with patchwork, thread relief and piping | 20 |
| 21 | `f045665` | Give sleepy residents a tilted head and a tucked-hand resting pose | 21 |
| 22 | `2221162` | Articulate alternating tiny steps while preserving still and paused poses | 22 |
| 23 | `cf14a8c` | Let selected dolls meet the camera gently and freeze poses correctly on pause | 23 |
| 24 | `e0b050d` | Animate short, smooth, independently timed porcelain-doll blinks | 24 |
| 25 | `3a44963` | Let three soft steam wisps rise from the held tea cup | 25 |
| 26 | `3c4a6d1` | Replace reassurance diamonds with three softly rising hearts | 26 |
| 27 | `b732929` | Show a small floating crescent during a resident’s nap | 27 |
| 28 | `38c5886` | Let the shy visitor acknowledge a greeting with a smile and soft nod | 28 |
| 29 | `8cd840c` | Replace white fireplace ovals with gently moving amber flame layers | 29 |
| 30 | `80084c5` | Give hanging curtains a slow breeze with reliable pause and reduced-motion behavior | 30 |
| 31 | `e95543b` | Cast three soft window-pane light patterns across the tiled floors | 31 |
| 32 | `4412199` | Guide a bounded number of slow fireflies around the garden lanterns | 32 |
| 33 | `f56fc37` | Restore warmth and readable porcelain faces with a gentle shadowless front fill | 33 |
| 34 | `9c8b158` | Ease room-camera visits while retaining instant reduced-motion and whole-house resets | 34 |
| 35 | `74ba2b6` | Frame the selected room with four restrained golden corner marks | 35 |
| 36 | `9ad605d` | Preview translucent keepsakes in their room before spending any buttons | 36 |
| 37 | `7b1c69c` | Identify a focused resident with a small translated name label, not another menu | 37 |
| 38 | `ef45fa4` | Use larger short English and Arabic room captions on phones | 38 |
| 39 | `ddfbed8` | Show the day-night cycle around the existing time icon without another HUD panel | 39 |
| 40 | `56d17ef` | Replace the hanging roof ornament with a true brass crescent and tighten the visual budget | 40 |

## Rendered reviews

### Rendered checkpoint 10 — 7b651a7
CI run 36478761838 passed the 36 Node tests/build, 10 DOM checks, 10 artwork construction checks and all 31 built-game checks. All recorded source hashes match the local pass-10 commit. Inspected desktop night, desktop sewing-room closeup and Arabic phone bedroom closeup. Curtains now have visible fabric folds; eaves read as carved wood rather than beads. The scene remains legible, with no removed content. Calls fell from 388 at the preceding upgrade to 282 (27.3%); triangles are 351,217. This is a renderer-counter comparison, not physical-phone frame-rate evidence. Review findings for later planned passes: doll faces remain too cool/dim at night; the fireplace flames are uniform white ovals; the moon is still a ring with an overlaid disk; mobile room closeups could prioritize the selected room more tightly. These map to passes 29, 33, 34 and 40.

### Rendered checkpoint 20 — 271e219
CI run 36480571110 passed all existing tests and the cumulative 20 construction assertions. Inspected the sewing-room closeup, Arabic mobile bedroom and whole-house day view. The embroidery hoop and stitched quilt read as distinct handcrafted details without blocking dolls or controls. Counters: 314 calls / 366,721 triangles; still below the preceding upgrade's 388 calls and below the stricter 400k target. No new blocking pixel issue found; previously noted night-face and camera-framing refinements remain queued. The next capture suite adds actual tea, sleep and parlor-night views to inspect the new reactions and fireplace rather than relying only on geometry tests.

### Rendered checkpoint 30 — 325bff5
CI run 36482579553 passed all 31 built-game checks, 30 art assertions, 36 Node tests/build and 10 DOM checks. Fifteen captures now include tea, sleep and parlor-night reactions. Inspected those three full-size images: the held cup is upright; the nap head pose and crescent read correctly; layered fireplace flames replace the earlier white ovals. The night faces still benefit from the warm fill already implemented in pass 33. The remaining hanging ring-and-disk moon is assigned to pass 40. Renderer counters: 340 calls, 366,145 triangles, 44 textures. No physical-device frame-rate claim.

### Final local and integration gate
The final local gate contains 40 art-change assertions plus one additional input regression, 36 Node tests/build, and 12 DOM layout checks. Review caught an Escape-cancellation bug when placement form controls held focus; its new key-event test was observed failing before the narrow fix. The full-game ownership and cancellation checks now also drive Escape. This correction is not counted as another iteration.

The final built-game suite retains all previous behavior and geometry gates, adds placement-preview checks, tightens the whole-house target below 400,000 triangles and 388 draw calls, and records sixteen views. The exact final CI result, source commit, build artifact and screenshot review are recorded on PR #1 after execution. A test definition is not a claimed passing run.

## Review limits
Author self-review, not an independent audit. Local Chromium disallows HTTP navigation; no browser policies were changed. Real DOM, Canvas2D and Three geometry tests run locally, while the existing GitHub Actions Chromium/software-WebGL environment provides rendered evidence. These results do not certify Safari, physical-phone GPU frame rates, or perceptual audio quality. No merge, force push or production promotion is authorized by this work.
