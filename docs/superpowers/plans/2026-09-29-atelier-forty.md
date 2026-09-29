# Forty further doll refinements implementation plan

Use superpowers:executing-plans and test-driven-development.

**Goal:** A visible improvement in doll silhouette, expressions, hair, clothing and acting, not a larger detail count.
**Architecture:** Refine the current face/hair/wardrobe/acting adapters and preserve the simulation. Reuse the existing articulated rig, geometric batching, actual-model portraits and inspection harness.
**Tech stack:** JavaScript, Three.js 0.180.0, Node tests, Python Playwright.
**Spec:** docs/superpowers/specs/2026-09-29-atelier-forty.md

## Global constraints
No merge. No simulation/save/economy/audio/ID/dependency changes. No external assets. Preserve strict <388 calls/<400k triangles in the full game. Rendering screenshots, not construction assertions alone, judge the art.

## Review focus
Facial attachment at three angles; hair/eye/glasses clearance; garment/hand contact; grounded gait; still/paused pose and resource reuse. Pin each changed condition in `tests/art-atelier-checks.js` and retain the existing functional suites.

## Pass sequence
For each checkbox: add a concrete geometry/material/behavior assertion to `tests/art-atelier-checks.js`, run `CHROMIUM_PATH=/usr/bin/chromium python scripts/art_check.py` and inspect the expected failure, implement only that refinement, rerun cumulative art + `npm run verify` + `scripts/ui_check.py`, then commit and ledger. All source paths below are under `src/render/`.

- [x] 01–10 Face/body balance (`dolls.js`, `doll-face.js`): balanced head scale, cheek contour, surface attachment, eye shape, painted upper lid, expressive smile, integrated button nose, tucked ears, complexion, visible neck.
- [ ] 11–20 Hair (`doll-hair.js`, `doll-hair-grain.js`, `doll-couture.js`): quiet scalp, flattened tapered locks, individual Lina/Noor/Sami fringes, tapered plaits, wrapped bun, side locks, smaller sewn bows, directional grain.
- [ ] 21–30 Clothing/form (`dolls.js`, `doll-wardrobe.js`, `doll-acting.js`, `doll-couture.js`, `doll-trimmings.js`): torso, sleeves, hands, trouser legs, dress drape, rounded apron, contrasting knit, shaped pockets, footwear, garment contact.
- [ ] 31–40 Acting/presentation (`doll-acting.js`, `doll-expression.js`, `dolls.js`, existing portrait/camera adapters): grounded gait, weight transfer, tea, clapping, sleep, reassurance, bounded gaze/blink, expression caching, portrait clarity, mobile framing.

At each ten-pass checkpoint publish the tested changes, retrieve early model previews and complete gameplay results, inspect images and write findings. Adjust subsequent tasks when images identify a higher-value defect; record the ruling. After 40, compare final to exact b99bf28 and provide real before/after images, local history and verification evidence. Do not merge.
