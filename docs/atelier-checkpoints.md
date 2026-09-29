# Doll refinement rendered checkpoints

## Pass 10 — 38923ed
CI run 36537059381 passed: 36 unit tests/build, 120 artwork checks, 12 UI checks, 41 full-game checks, no recorded browser errors. First scene: 380 calls / 357,237 triangles. The downloaded artifact digest matches GitHub metadata.

Inspected the actual model trio, Lina face and normal phone Noor closeup. The smaller head, rounded chin and fitted eye surfaces improve the face/body relationship. Remaining high-priority findings: oversized lobed hair, colored torso covering the neck, oversized shoulder puffs and large identical aprons. These are addressed by the planned hair and clothing groups, not by adding unrelated decoration. Studio views are controlled inspections of actual game geometry, not normal gameplay images.

## Pass 20 — 05a3e00
A11–A20 reshape hair: a fitted lower scalp, thinner asymmetrically tapered locks, separate six/five/six-section fringes, three-strand tapered plaits, a low wrapped bun, tapered temple locks, smaller hair ribbons and directional painted hair tones. CI run 36538883976 passed: 130 artwork checks, 36 unit tests/build, 12 UI checks and 41 full-game checks; no browser errors. First scene: 379 calls / 363,573 triangles. Downloaded digests match. Inspected the actual trio and normal phone closeup: hair is thinner and continuous, the bun no longer dominates the silhouette, and the glasses are unobscured. The torso and apron findings remain assigned to 21–30. The old two-strand/four-fringe aesthetic requirements were explicitly replaced with three/six while retaining depth, contour, glasses clearance and animation-pivot guards.

Author self-review. Same strict game/render-budget gates; no merge or production promotion. Physical-phone frame rates and Safari remain unverified.

## Pass 30 — pending rendered verification
The ten new passes replace the torso, sleeves and forearms, tailor Sami’s trousers, separately drape the two dresses, round the apron/pocket silhouettes, separate shirt fabrics, shape flat shoe soles and project collars onto the actual bodice surface. All 140 art checks, 36 unit tests/build and 12 UI checks pass locally. The old absolute skirt-width and apron-depth assumptions were explicitly replaced with fitted garment bounds; cutout lace, rounded-hem, surface topology, gameplay and budget checks remain. Pass 27’s texture sample was corrected to use a normalized canvas coordinate and rerun RED against the preceding implementation before confirming GREEN. No artistic result is claimed from test totals alone.
