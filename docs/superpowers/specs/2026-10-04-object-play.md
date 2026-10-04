# Iteration 2 — A house you can touch

User steering: interactions are minimal; players should interact with and select objects. Proceed autonomously under the original instruction. Use IDEAL and the five Ws internally to identify the gap, define observable outcomes, explore options, act, and learn from actual checks.

## Twenty ideas before implementation
1. Tap the tea set to make tea with Lina.
2. Tap the sewing machine to embroider with Sami.
3. Tap Noor’s bed to play the moon song or offer rest.
4. Select placed keepsakes directly in the scene.
5. Move a keepsake without paying for it again.
6. Rotate a keepsake in quarter turns.
7. Pack a selected keepsake for its existing full refund.
8. Give selected objects a visible frame and contextual title.
9. Offer keyboard and touch equivalents for scene selection.
10. Add subtle interactive object markers in a focused room.
11. Turn embroidery into a study-and-recall challenge with free hints.
12. Turn the moon song into a reverse echo puzzle.
13. Keep tea a guided recipe for a gentle entry point.
14. Show each ritual’s rule before its first input.
15. Give successful activity steps a small visual response.
16. Add room-specific object stories.
17. Let players water each plant.
18. Add draggable doll placement.
19. Build a four-room chapter board with one-time rewards.
20. Let the restored lamps change the room’s night ambience.

Selected: 1–14 and 16. They connect object selection to existing simulation actions and remove the strongest interaction gap. Defer watering, dragging, chapter rewards, and more lighting to keep this pass centered on direct object play. Also clear stale ritual completion after reset. Retain a guided tea ritual, add explicit study/recall embroidery, and a reversed moon-song echo; never impose a timer or charge for a mistake or hint.

Alternatives considered: cosmetic hover-only selection is easy but adds little play; a physics sandbox is broad and conflicts with the existing fixed-slot/save architecture. Contextual object play reuses reliable rules and adds meaningful agency immediately.

## Contract
- Four permanent selectable props: kitchen tea set (tea ritual/Lina tea care), studio sewing machine (stitch ritual/Sami play care), bedroom moon bed (lullaby ritual/Noor rest care), parlor sofa (Lina play care). Stable IDs, authored visible-object pick boxes, no remote assets.
- A compact object list shows the permanent prop plus at most three owned decoration slots in a focused room. Each screen button has a 44px target and accessible translated name. Scene picking must preserve drag-vs-tap discrimination and placement slot priority.
- Selecting a prop/decor reveals a contextual sheet and focuses its room. A thin selection frame surrounds its world-space bounds, remains at the selected object, and clears on close/reset/new selection. Closing a sheet restores keyboard focus to the originating object control when still connected.
- Decoration selection supports inspect, rotate, move via the existing placement preview, and full refund. Move is atomic; invalid/occupied destinations leave source intact; the current slot is a valid no-op; move/rotation spend no currency and grant no bond/mastery/rewards. Preserve each decoration’s originRoom when moving so refund removes its original placement comfort instead of granting that bonus again. Save rotation as integer 0–3; older saves default 0; malformed rotation sanitizes to 0.
- Embroidery begins in study mode, explicitly starts recall, hides the pattern while recalling, offers a free persistent hint toggle. Tea inputs retain visible guided steps. Lullaby accepts the displayed pattern in reverse order, with numbered reverse cues. Activity rules remain in simulation. Daily caps, cooldowns, save sanitation, and mistake reset remain intact.
- Reset clears all transient selections, placement move IDs, and activity completion feedback.
- English and Shami Arabic; save key bait-al-dumiah.v1/version 1; local artwork/dependencies; no analytics; no production merge/deploy.

## Evidence
Behavior tests for relocation, rotation, study transitions, hints, reverse answer and existing reward limits. DOM checks for localized contextual actions, 44px controls, keyboard focus and reduced motion. Software-WebGL browser clicks use actual projected pick centers and verify matching selection/action/state; screenshots of focused selection, moved object, and Arabic phone. Retain baseline full browser regression and geometry budget. No numeric fun/retention rating claim without player research.
