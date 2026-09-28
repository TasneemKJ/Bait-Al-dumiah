# Living dollhouse: first playable design

## Intent
Build the user's empty Bait-Al-dumiah repository into a genuine 3D cute-and-creepy dollhouse simulation, not a landing page or a static scene. Read Al-ejar, Al-bayyara, souq-al-layl and Al-nafetha as references without changing those repositories.

## Direction and assumptions
A caretaker looks into an open miniature Levantine home. Mint, blush and buttercream rooms, porcelain dolls, patterned tiles, shutters, jasmine, brass lamps and a tiny tea service establish belonging. Blue-hour light, a shy sheet ghost, an occasionally restless music box and journal discoveries introduce unease without gore, jump scares or war themes. Assume mobile-first, English/Arabic and short relaxed play sessions, consistent with the reference games.

## First playable scope
Four furnished rooms, three dolls with distinct appearances, selectable residents, hunger/energy/comfort simulation, four contextual care actions, earned button currency, bounded decoration placement with cancellation and full refunds, day/night progression, care wishes, a six-entry mystery journal, optional synthesized music/ambience, pause, sound/quality/motion settings and validated local saves. Room furnishing changes the scene and comfort. All operations must show their cost and effect. No offline punishment; hidden tabs pause.

## Interaction and presentation
Orthographic cutaway camera, bounded orbit and pinch/scroll zoom, tap a doll or use a residents panel. Keyboard-equivalent DOM controls. One compact objective, small household status and a bottom tool dock. Secondary panels closed by default, with focus management and Escape. On phones, use a bottom sheet and retain the house as the focal point. 44px minimum primary targets. English/Arabic direction and copy switch together.

## Architecture
Native JavaScript ES modules with Three.js 0.180.0. Pure simulation owns all saveable state; renderer is an adapter. Procedurally authored meshes and original canvas textures avoid external asset requests. Small Node static build/serve scripts; bundled local Three modules in production. No backend, accounts, payments or analytics. No physics engine needed for constrained placement. Versioned, whitelisted save parsing; bounded timers and counters; explicit WebGL failure/context-loss handling.

## Success and validation
Node tests cover needs, rewards, purchases/refunds, invalid commands, timing, save tampering and deterministic mystery progression. Real Chromium tests exercise a complete care/decorate/night/save loop, mobile touch targets, Arabic, reduced motion, pause and rendering errors. Capture desktop, mobile and nighttime screenshots and inspect them before the PR. Report first-playable limits honestly; do not claim broad device or production certification.
