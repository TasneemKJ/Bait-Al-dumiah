# Iteration 3 — Reactive keepsakes

The direct-selection pass made objects reachable, but owned keepsakes still only support inventory management. This iteration turns four keepsakes into small toys with persistent, visible consequences. IDEAL and the five Ws frame the problem: players need to know what can be touched, who benefits, what changed, where it changed, when it can be repeated, and why it matters.

## Twenty ideas before implementation
1. Water an owned plant and see its leaves perk up.
2. Switch an owned lamp on/off with a visible light response.
3. Wind a music box and hear a gesture-gated short melody.
4. Rock the moon mobile with reduced-motion-safe feedback.
5. Cuddle a teddy and animate the room resident’s response.
6. Smooth a rug with a small dust/shine response.
7. Give each object a daily tended indicator.
8. Let interactions briefly highlight the affected doll’s comfort.
9. Show earned mastery growth on the completion card.
10. Display the next restoration goal directly after a ritual.
11. Make restored lamp tiers strengthen actual room night lighting.
12. Replace the kitchen’s mislabeled stage-three music box with its promised fourth cup.
13. Animate successful ritual steps through the corresponding scene prop.
14. Add gentle room-specific ambient object motions.
15. Make inactive object affordances quietly visible on hover/touch focus.
16. Build a four-part chapter quest around care, ritual, placement and discovery.
17. Add optional daily house challenges with cosmetic badges.
18. Add a visitor’s room-specific request.
19. Show a personal keepsake history after several uses.
20. Improve night screenshot evidence by waiting for the actual lighting transition.

Selected: 1–4, 7, 11, 12 and 20. These extend the scene-selection system with real verbs and immediate visual feedback. Ideas 5–6 can follow using the same rule boundary after this interaction vocabulary is validated. Ideas 8–10 and 16–19 are broader progression work and would dilute this pass. Idea 13 requires prop animation plumbing independent of owned objects. Idea 14–15 improves ambiance/discovery but adds less agency.

Alternatives: awarding buttons for every object use would produce a click farm; one daily currency reward would turn optional play into a chore; cosmetic animation without state would disappear on reload. The chosen design stores useful object state but gives no currency, mastery, bond, care, milestone, or comfort reward.

## Simulation contract
- `useDecor(state,id)` accepts an owned plant, lamp, music box, or mobile. Unknown IDs return `invalid`; owned bear/rug return `notInteractive`. Neither path mutates state.
- Plant: first watering per in-game house day stores `tendedDay=state.day`; another watering that day returns `alreadyTended` without mutation. A later house day allows watering again. Advancing the clock early can reset this optional response, but never grants a reward.
- Lamp: every use toggles `active`; this remains available and persistent. `tendedDay` records the latest house day when switched on or off.
- Music box and mobile: every use records `lastUse=state.elapsed` and `tendedDay=state.day`; no reward or cooldown. The timestamp only drives a five-second visual response and may resume briefly after reload.
- `place` initializes `rotation=0`, `originRoom`, `active=false`, `tendedDay=0`, and `lastUse=-10`. `moveDecor`, `rotateDecor`, and `useDecor` never change currency or doll/game progression.
- Restore whitelists booleans, clamps `tendedDay` to `0..state.day`, clamps `lastUse` to `-10..state.elapsed`, and defaults old version-one saves. Save key/version stay unchanged.

## Presentation contract
- Owned interactive keepsake sheets include one prominent localized action and a status line. Plants show watered today; lamps show on/off; music boxes and mobiles show tended today. Bear/rug retain move/turn/pack only.
- Successful actions close the sheet to reveal the room, play a local gesture-gated effect when audio is already enabled, show a localized notice, and keep the room focused.
- Watered plants rise/relax gently. Active owned lamps create a warm local point light and brighter shade at night. Wound music boxes turn for five seconds. Rocked mobiles sway for five seconds; reduced motion applies the final state without continuous motion. Animation is renderer-owned and simulation remains serializable.
- Restoration tier-two lamps add bounded warm practical light only when earned; no extra shadows. Kitchen tier three uses an actual procedural cup. All objects use local procedural assets.
- Screenshot evidence waits for night mix above 0.99 and captures watered plant, active lamp, music box response, mobile response, restored lamps and the fourth cup.

## Accessibility and safety
Every new action has English and Shami Arabic copy, a 44px DOM control, keyboard/touch access through the existing object sheet, and a text status independent of color. No timers block play. No punishment, analytics, remote assets, new dependencies, production merge or deployment. Browser evidence must cover save/reload, reduced motion, invalid IDs, repeated plant use, and no reward mutation.
