# Iteration 8 — Grow a Jasmine Arch

Status: prepared design for the next iteration; the scene-play correction is accepted at 9319d55. Implementation has not started. Refresh the live ledger and pending checks before beginning.
Repository: TasneemKJ/Bait-Al-dumiah. Preserve the live AGENTS.md, accepted head, existing draft PR and version-one save.

## Player outcome

An owned plant becomes something the player can shape with their hands. They lift three jasmine shoots, place them along a curved trellis, correct an awkward placement locally, and leave a flowering arrangement in the room. Returning to the same plant shows their own arrangement and allows further reshaping.

This extends the house's lasting object play. The result belongs to an object the player already owns and can move between rooms. It adds expression and a visible reason to revisit a room without adding currency, a mastery ladder or an absence penalty. Better retention remains a design hypothesis to test with players.

## Twenty ideas considered before this iteration

1. Train three jasmine shoots along a curved trellis.
2. Repot a crowded plant and settle its soil.
3. Root jasmine cuttings in a shared planter.
4. Arrange and press flowers between real pages.
5. Shape a clay bird ornament.
6. Press miniature ma’amoul into a wooden mold.
7. Brush a resident’s loose hair.
8. Wipe smudges from a resident’s porcelain hands.
9. Roll an olivewood ball with a resident.
10. Play peekaboo with a folding fan.
11. Pose a lasting household portrait.
12. Rotate and fit courtyard mosaic pieces.
13. Fit wooden window-lattice pieces.
14. Assemble a small colored-glass pane.
15. Polish a brass doorplate.
16. Align and seat a door-hinge pin.
17. Turn a miniature mirror to reveal a reflected motif.
18. Align and press a small book’s cover and spine.
19. Lay courtyard stepping stones.
20. Sweep dust from a painted floor border.

## Selected scope

Choose idea 1: train three shoots on an already-owned jasmine plant. It connects direct manipulation to an existing decoration, creates a visible lasting result, and differs from the accuracy-based sewing and phrase-memory chimes. Repotting and rooting cuttings are possible later extensions; neither is included in this iteration.

The complete loop is: notice the plant, select it, lift a shoot, choose a trellis position, place the remaining shoots, see a flowering arrangement, return to the room, and reshape it later. A first valid arrangement should be possible without opening a tools menu, reading a tutorial dialog, buying a new item or completing another reward grind.

## Entry and scene behavior

Use the owned plant's existing scene-selection route. Its primary contextual activation enters a close work view centered on that same decoration, including after it has been watered today. Keep the existing once-per-day watering action separately available in the optional object inspector with its existing eligibility and effect. Arrangement entry, placement and completion must not call the watering command, change tendedDay/lastUse, or create a care, story or economy grant. Do not let the old watered-today disabled state disable the primary shaping interaction.

Keep the player in the actual house scene. The view should retain enough of the plant, pot, room and surroundings to make ownership legible, while keeping all usable handles visible. Handle obstructions by identifying and narrowly controlling the actual occluding geometry, as in the accepted sewing cutaway; do not validate only against a private target list. Restore any temporary framing or cutaway on every exit.

The pot and trellis remain stationary during shaping. Three filled leaf or loop handles expose the shoot tips. A held tip follows the pointer directly within its permitted domain while preserving the initial grab offset, so selecting a handle does not jump the shoot. This is bounded positioning, not the sewing needle's limited pursuit speed or tracing score.

## Placement rules and recovery

The three tips use ordered continuous positions along the trellis:

| Shoot | Minimum | Maximum |
|---|---:|---:|
| Left | -0.90 | -0.15 |
| Middle | -0.45 | 0.45 |
| Right | 0.15 | 0.90 |

Adjacent placed positions must differ by at least 0.45. Both [-0.80, 0, 0.80] and [-0.65, -0.10, 0.55] are valid examples. Values represent normalized positions on the authored trellis, not screen pixels.

Show local, calm feedback when a held shoot is too close to its neighbor. On an invalid release, restore only that shoot's last valid placement. Keep the other two placements and the player's completed arrangement. Do not reset the whole plant, deduct resources, start a timer or punish an imprecise touch.

After all three valid placements are made, the arrangement flowers visibly. The player may continue reshaping it; there is no forced result dialog. Retain the exact chosen positions rather than snapping all valid plants to one canonical shape. Do not expose a row of answer buttons, numbered target pegs or a hidden automatic solution.

## Input and accessibility

- Mouse and touch use the visible handles, one primary owner, real pointer capture and an actual release.
- Q/E selects a shoot. Holding Space lifts it; releasing Space places it. Arrow keys move the held shoot; Shift provides a smaller adjustment.
- Escape first cancels a held shoot safely, then leaves the work view when nothing is held.
- Enter or the broad visible pot saucer returns to the room. Preserve standard focus restoration.
- Each actual input target has a visible, filled 44px minimum envelope at every supported camera size, including 320px portrait and the shortest supported landscape.
- English and Shami copy belongs in src/i18n.js, following the existing locale overlay/catalog contract. Give brief contextual instructions and meaningful placement announcements; avoid per-frame live-region chatter.
- Pause, tab hiding, blur, pointer cancellation, rotation and disposal clear ownership. A later OS release cannot apply a canceled placement or emit a reward.
- Reduced motion preserves immediate state feedback while removing decorative swaying. Audio is optional and begins only after a user gesture.

The work surface keeps only the plant, a compact instruction/status area, sound/pause and a clear exit. Optional object discovery remains available before entry. New implementation details must not appear in player-facing copy.

## Persistence and existing systems

Store a completed arrangement inline on its existing owned-decoration record. The current restore path reconstructs numeric decoration IDs, so a separate saved map keyed by those IDs would attach arrangements to the wrong object; do not use that approach.

Validate the entire arrangement on restore: three finite positions, each in its allowed range, ordered with the minimum separation. Missing or invalid arrangement data falls back to the original untrained plant. Active grabs and intermediate work ownership do not survive reload. Old saves keep the same key and version.

Moving or quarter-turn rotating a trained plant preserves its arrangement. Selling or removing it follows the existing ownership/refund rules, including comfort attributed to its original room; a repurchased plant starts untrained. Two owned plants keep distinct arrangements. Include a restore case that removes an earlier decoration before saving so surviving numeric IDs actually change. Do not accidentally spread a trained shape through a shared mutable geometry or material.

Update the existing cached owned-plant mesh when its arrangement changes. Keep its scene-selection bounds and its placement/moving preview consistent with the retained shape. Apply trained growth only to the correct owned plant; the shared furniture constructor also builds unowned restoration scenery. Coordinate the active work view with world.render() so its per-frame visibility/transform updates cannot reveal a hidden duplicate. Retain the existing 1.08 watering response and quarter-turn transform on the owned root; shape the trellis in a plant-local child group. Dispose replaced or removed mutable garden geometry explicitly so repeated reshaping and removal do not retain unused buffers.

The carried-object story's jasmine window remains a separate story object. Training a purchased plant cannot consume an inventory item, advance the story, repeat a chapter reward, alter a wish, teleport a resident or change a resident's room. A cosmetic resident reaction may be shown only when that resident is actually present; it must not change care, bond or economy.

## Art and performance

Preserve the miniature house's walnut, cream, muted brass and green palette. Use local procedural geometry/materials; no external asset service, new dependency, light or shadow map. A flowering result should read at room scale through shape and a small number of blooms.

Normal room views need only inexpensive retained plant detail. Detailed active manipulation geometry should exist for the one active plant. The current slot rules allow at most 12 owned plants (four rooms with three slots each); confirm those rules in the live source. Measure that maximum supported owned-plant state before implementation, then measure it again after adding the feature. Record draw calls, triangles and the cost of the active work view under the existing budgets. If the baseline maximum already exceeds a gate, address that concrete cost with visually reviewed geometry/batching work; do not silently waive or raise the budget.

Inspect actual original before, partial, flowering, returned-room and reloaded-room images, including English/Shami, daylight/night, small portrait and short landscape. A numeric target hit is not proof that a foreground object does not cover it.

## Acceptance

1. A genuine new-player route buys or owns a plant through the existing flow and enters work by selecting the real object.
2. Real desktop drag can position each shoot at two different valid arrangements. Invalid release restores only the held shoot.
3. Real keyboard input completes an arrangement, safely cancels a held tip, leaves with focus restored, and cannot commit from a later key release.
4. Real Arabic phone touch completes and reshapes the plant at supported small portrait and short landscape sizes.
5. Actual bounds and full visible-scene rays prove every handle's 44px envelope and safe DOM clearance across its full allowed range.
6. A genuine hidden-tab journey clears ownership and stays still before and after foreground return until a new gesture.
7. Actual return, move, quarter-turn rotation and reload preserve the same completed positions on the correct owned plant; moving previews and selection bounds show the retained shape. A second plant remains independent, including after deleting an earlier record and restoring reassigned IDs. Removal/repurchase and invalid/old saves follow their defined fallbacks.
8. Economy, care, bond, wishes, existing bests, daily watering and carried stories retain their exact rules, including resident-present and resident-absent cases. Watering remains usable in the inspector once per day; shaping remains usable both before and after watering without modifying its stamps.
9. Current source/build/DOM/art/gameplay gates remain intact. Original images are inspected on the exact tested tree.
10. Commit this coherent iteration only with its honest verification status and update the existing PR/ledger. Do not claim measured retention or a nine-out-of-ten rating from automated tests.

## Out of scope

New currencies, streaks, paid items, additional chapters, repotting, cuttings, real-time absence decay, account systems, analytics, generic crafting menus and production deployment are excluded.
