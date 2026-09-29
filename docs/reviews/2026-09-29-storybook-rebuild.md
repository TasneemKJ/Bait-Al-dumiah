# Storybook doll rebuild

Scope: continue the user's requested doll improvements on PR #1, based on
15d2bd80ed67e786d40094b425be5cd8261d9727. This is an integrated character-art
correction, not a numbered forty-pass claim and not a new game subsystem.

## Diagnosis and direction
The round-face correction removed the alien anatomy, but the models still read
as a smooth helmet over a flat cone: nearly identical faces, empty forehead,
flat bibs, straight socks and bead shoes. More ornaments would not fix those
silhouettes. Rebuild those existing presentation components as storybook
collectible dolls: swept, tapered hair masses, individual rounded cheek profiles,
quiet painted eyes, visibly gathered bell skirts, curved sewn pinafores and
shaped footwear. Preserve Lina's rose/plaits, Noor's sage/bun and Sami's
lilac/glasses/dungarees identities. Keep horror in the house, not facial anatomy.

## Implementation and evidence plan
- [x] Add geometry/texture/rig regression requirements and observe baseline failures.
- [x] Rebuild face, scalp/fringe and dress/wardrobe surfaces together.
- [x] Preserve independent joints, care actions, quiet expressions and saved state.
- [x] Run unit/build, existing UI and artwork tests; document superseded art assumptions.
- [x] Publish a source checkpoint on the existing PR and inspect controlled before/after
  model renders plus actual game/phone captures from CI. Correct observed defects.
- [ ] Record exact final tests, source identity, rendered evidence and review limits.

No gameplay/economy/save changes, dependencies, force pushes, merge or production
promotion. Retain the existing whole-house <388 draw-call / <400k triangle gate.
Local Chromium refuses HTTP navigation (ERR_BLOCKED_BY_ADMINISTRATOR); its policies
are not changed. Local construction tests are allowed; rendered verification uses
the repository's existing GitHub Actions workflow. A green test does not certify
artistic approval.

## Art-test migration
D14 now requires broad lofted fringe rather than cylindrical tubes. The lace
geometry follows the returning bell hem; D48's existing width, transparency and
vertex-budget assertions are retained. No game, save, pause, input, portrait-cache
or render-budget test has been weakened or removed.
Five new model requirements failed against the baseline before implementation;
the finite-pose integration check was already passing and is not called a new
red/green regression.


## Rendered checkpoint and correction
Source `5fb5850e1cb61b3df3f5c35e84c8816d33b15f49` passed CI run
36520560227: 36 unit tests/build, 109 artwork/input checks, 12 DOM/layout
checks and 41 full-game Chromium assertions. Twenty controlled model captures
(seven before, thirteen after) and eighteen normal game screenshots were produced.
The comparison uses the exact preceding `15d2bd8` modules in both source sets;
before/after idle camera, lights and still poses are the same.

All 38 views were inspected in contact sheets. Full-size inspection covered
Lina's face and tea pose, Sami's face, the trio and the phone Noor closeup.
The new fringe, fitted cloth and shoe silhouettes are visibly different, but
Sami's lowest lock crossed the upper brass rim in the three-quarter face view,
making the otherwise closed spectacles look broken. Passing construction and
gameplay checks did not catch that visual defect.

A new raycast regression checks both complete upper rims at three head angles
(-0.4, 0, +0.4 rad). It failed against that checkpoint and passes after raising
only the lower Sami fringe control points. No rim geometry was hidden or removed.
The CI workflow now retains the model images as a separate early artifact so
visual review need not wait for the longer full-game play-through. The full-game
checks, final screenshot requirements and budgets remain unchanged.

Checkpoint counters: 374 calls / 356,373 triangles, compared with 373 calls /
340,325 triangles before the rebuild. These are renderer counters, not physical
phone frame rates. Re-review and the exact final CI result are recorded on PR #1;
this document does not claim the corrected head has passed a not-yet-run render.
