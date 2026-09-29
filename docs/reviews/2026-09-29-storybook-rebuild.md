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
- [ ] Run unit/build, existing UI and artwork tests; document superseded art assumptions.
- [ ] Publish a source checkpoint on the existing PR and inspect controlled before/after
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
