# Doll refinement rendered checkpoints

## Pass 10 — 38923ed
CI run 36537059381 passed: 36 unit tests/build, 120 artwork checks, 12 UI checks, 41 full-game checks, no recorded browser errors. First scene: 380 calls / 357,237 triangles. The downloaded artifact digest matches GitHub metadata.

Inspected the actual model trio, Lina face and normal phone Noor closeup. The smaller head, rounded chin and fitted eye surfaces improve the face/body relationship. Remaining high-priority findings: oversized lobed hair, colored torso covering the neck, oversized shoulder puffs and large identical aprons. These are addressed by the planned hair and clothing groups, not by adding unrelated decoration. Studio views are controlled inspections of actual game geometry, not normal gameplay images.

## Pass 20 — 05a3e00
A11–A20 reshape hair: a fitted lower scalp, thinner asymmetrically tapered locks, separate six/five/six-section fringes, three-strand tapered plaits, a low wrapped bun, tapered temple locks, smaller hair ribbons and directional painted hair tones. CI run 36538883976 passed: 130 artwork checks, 36 unit tests/build, 12 UI checks and 41 full-game checks; no browser errors. First scene: 379 calls / 363,573 triangles. Downloaded digests match. Inspected the actual trio and normal phone closeup: hair is thinner and continuous, the bun no longer dominates the silhouette, and the glasses are unobscured. The torso and apron findings remain assigned to 21–30. The old two-strand/four-fringe aesthetic requirements were explicitly replaced with three/six while retaining depth, contour, glasses clearance and animation-pivot guards.

Author self-review. Same strict game/render-budget gates; no merge or production promotion. Physical-phone frame rates and Safari remain unverified.

## Pass 30 — af99a39
The ten new passes replace the torso, sleeves and forearms, tailor Sami’s trousers, separately drape the two dresses, round the apron/pocket silhouettes, separate shirt fabrics, shape flat shoe soles and project collars onto the actual bodice surface. All 140 art checks, 36 unit tests/build and 12 UI checks pass locally. The old absolute skirt-width and apron-depth assumptions were explicitly replaced with fitted garment bounds; cutout lace, rounded-hem, surface topology, gameplay and budget checks remain. Pass 27’s texture sample was corrected to use a normalized canvas coordinate and rerun RED against the preceding implementation before confirming GREEN. No artistic result is claimed from test totals alone.

CI run 36541212211 passed: 140 artwork checks, 36 unit tests/build, 12 UI checks and 41 full-game checks; no browser errors. First scene: 379 calls / 375,685 triangles. Both early model and full evidence ZIP digests match GitHub metadata. Inspected the trio, Lina tea, Sami body and normal phone Noor closeup. Fitted shirts, smaller aprons and separate fabric palettes are visible in both studio and normal gameplay. Review found straps standing away from the shoulder and socks cutting through Sami's cuffs; the final two passes address those concrete problems rather than the lower-priority camera changes originally queued.

## Pass 40 — implemented, final rendered gate pending
A31–A38 add sole-vertex-based floor correction, support-leg weight shift, a closer two-hand tea hold, non-intersecting claps, a cheek-supporting sleep palm without floating feet, inward reassurance palms, coordinated care gaze and settled-expression geometry caching. A39–A40 fit both kinds of shoulder straps to the actual bodice surface and blend trouser tops/cuffs around the body and knit socks. The existing portrait/camera controls are preserved.

All 150 art checks, 36 unit tests/build and 12 UI checks pass locally. Each of the forty pass records includes an observed failing new assertion, a passing cumulative gate, a separate local commit and a source diff. A31's initial bounding-box test counted empty corners of a rotated bounding box; it was replaced with a check of actual transformed shoe vertices, then rerun RED against the preceding source before GREEN. A40's first shape exceeded the unchanged A24 width limit; reducing its upper inset resolved that failure without changing the test.

Ruling: replace the planned final portrait/camera tweaks with the two visible garment-contact defects from checkpoint 30. Their raycast tests pin actual contact and occlusion. No additional iteration count is assigned to test-harness corrections or documentation. The final CI source identity, result, visual review and build evidence will be recorded on PR #1 after they are obtained.

### Final closeup review correction
The A40 studio images exposed a background-colored gap between Noor’s outer fringe and the core hair at the .4-radian inspection angle. Direct camera rays confirmed the gap was empty space, not paint or lighting. An inset, shared-material surface now joins the two sweeps; the new raycast regression was observed failing before that correction and passing afterward. This supplements A14’s hair refinement and is not counted as a forty-first pass. The corrected rendered comparison and full-game result remain mandatory before final handoff.

The corrected multi-angle review also exposed two smaller background slits in Sami’s side part. The same shared-material joining technique now closes the side-part layers, with a second failing-then-passing camera-ray regression. Both review corrections belong to the existing hair passes; the batch remains forty counted refinements. The independent spectacle-clearance regression still passes.
