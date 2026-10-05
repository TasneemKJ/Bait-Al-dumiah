# Iteration 8 implementation plan — Grow a Jasmine Arch

Status: prepared handoff after the accepted 9319d55 scene-play correction. Implementation has not started. Refresh the live repository, PR and pending checks before following this plan.

## 1. Establish the actual owned-plant contracts

Read AGENTS.md and the accepted iteration ledger. Locate owned decoration creation, selection/activation, tending, movement/removal, serialization/restore and world rendering. Confirm the maximum supported plant count (currently 12: four rooms × three slots) and capture a real baseline with one plant and the maximum. Preserve branch/main changes and the existing development PR.

Concrete source anchors to refresh: simulation.restore() reconstructs IDs and whitelists retained fields; useDecor() enforces the existing daily watering stamp; world.render() reuses meshes and rewrites transforms/visibility; object-interactions.js owns pick bounds; placement-preview.js constructs move previews; object-ui.js currently disables watered plants in both primary and inspector actions. Preserve the old once-per-day watering action in the optional inspector, while the primary actual-plant activation opens shaping even after watering. Shaping never calls useDecor(), writes its stamps, or grants care. Extend the existing activity allowlist and room framing for the selected plant's actual room, including upper-floor height, with pause/busy/held-input ownership guards. Preserve any carried story item unchanged; owned plants must not consume or advance it. In sceneObjectAction(), route the owned-plant primary before the generic usable branch, retaining the inspector's existing use-object watering branch. Both a second actual scene touch and keyboard discovery activation must enter shaping.

Use the accompanying exactly-twenty-idea specification as the chosen scope. Do not add a second game, another reward path or a separate map keyed to reconstructed numeric decoration IDs.

## 2. Implement the smallest complete arrangement model

Put authoritative placement, range/separation validation and ownership/cancellation rules in the existing simulation boundary. Cover valid variation, one-tip invalid recovery, completed arrangement changes, two-plant independence, old/malformed saves, movement/removal and unchanged economy/story behavior with meaningful tests. Keep intermediate grab state transient.

Reuse the work activity ownership and lifecycle conventions where appropriate. Avoid a second gesture controller that competes with room selection or the current tea/sewing/chime owner.

## 3. Build the real plant surface and shared input

Create three visible filled handles, a continuous trellis and a readable flowering result. Use a pointer grab offset with bounded direct following, actual keyboard selection/hold/release, and the same placement rules for every input. Add English/Shami contextual copy through src/i18n.js and preserve standard focus restoration.

Keep each arrangement attached to its owned object, not global shared material/geometry state. Refresh the cached mesh when a completed shape changes, keep selection bounds and moving previews faithful, and avoid applying owned-plant growth to restoration scenery built by the same constructor. Integrate active-plant visibility in world.render() instead of fighting its next frame. Put the updateable trellis in a plant-local child group and preserve root watering scale/rotation. Explicitly dispose mutable geometry on replacement/removal; the existing generic removal path does not guarantee that for unmapped materials. A move preview currently caches only by catalog ID, so supply the selected record's arrangement and invalidate/update that variant while keeping purchase previews untrained. Use the existing room representation at rest and detailed geometry only while that plant is active. Add only narrow, reversible cutaways proven necessary by actual foreground intersections.

## 4. Verify a genuine full player journey

Start with the real buy/select route. Play before/partial/invalid/complete/reshape/return/move/reload states by mouse, keyboard and phone touch. Verify target envelopes over the full movement domain, DOM clearance, pointer/key cancellation and a real hidden tab. Check two independent plants and resident-present/absent cases without awarding any new care or story progress. Delete an earlier decoration before save/reload to force retained plants' numeric IDs to change. Include quarter-turn rotation, removal and fresh repurchase, second-touch and keyboard shaping before/after watering, and water stamps unchanged by shaping. Preserve the existing inspector-based watering journey and its rendered scale, daily disabling, and reload assertions. Check selection envelopes with the normal watering scale and rotation.

Retain original screenshots and current wall/simulation observations. If direct local browser execution is still unavailable, use the repository's hosted CI; do not repeat known failing native launches or describe source-only evaluation as a browser run.

## 5. Review, measure and commit

Run required gates, independently review substantial source changes and inspect original images on the actual merge/head tree. Compare normal and maximum-owned-plant performance to the measured baseline under unchanged gates. Resolve defects instead of weakening tests.

Commit and publish the completed coherent iteration, update the existing draft PR and ledger with precise results/limits, and leave the continuation state suitable for the next nonoverlapping run. Then generate a new set of exactly twenty ideas before the following iteration. Stop and disable the existing continuation if the user asks.
