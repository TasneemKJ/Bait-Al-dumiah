# Iteration 5 — A pot, a steady hand, a welcome

## Purpose

The user asks for substantial autonomous improvements and rejects a game built around menus, buttons and toasts. Iteration 4 establishes object selection, carried-item combinations and permanent story consequences. Its real story journey passes, with screenshot review fixes published separately. The weakest repeatable loop remains tea's four answer buttons. Replace that activity with continuous play on the actual kitchen table, and use it in the guest's story so the new mechanic is part of the main journey.

Keep the handmade Levantine home, local assets, bilingual copy, version-one saves, gentle tone, pause and reduced-motion behavior. Do not claim a measured retention or subjective 9/10 score. No production merge or deployment.

## Twenty ideas considered before this iteration

1. Pick up the actual teapot in a close view of the kitchen table.
2. Slide its spout over separate porcelain cups.
3. Tilt the pot with a vertical drag to control the flow.
4. Stop pouring immediately when the player releases it.
5. Show amber tea rising inside open cup geometry.
6. Etch the requested fill level into each cup.
7. Let players top up a short cup or empty a full one without restarting.
8. Change the target levels and number of cups as mastery grows.
9. Reward better aim and less waste with a saved personal best.
10. Replace embroidery answers with a needle following a seam in a later pass.
11. Replace the moon-song answers with a moving mobile in a later pass.
12. Serve the actual completed tray, with a resident response.
13. Give the table a phone-safe close working view.
14. Give a single pointer exclusive ownership of the pot while it is held.
15. Offer arrow-key aiming and held-Space pouring through the same simulation.
16. Start another practice from the pot itself.
17. Connect successful service to the existing room-restoration progression.
18. Let Lina acknowledge a served tray inside the house.
19. Save a separate best service score for each difficulty.
20. Preserve release, pause, tab visibility and reduced-motion behavior throughout the activity.

Selected: 1–9 and 12–20 as one physical tea-service loop. Ideas 10 and 11 are future independent iterations. Guest tea becomes a one-cup introduction within its existing story step. No extra shop or activity submenu is introduced.

## Player loop

Touch the tea set, then touch it again to enter the table. For the guest story, dropping the jasmine sprig onto the tea set enters the same table with one cup. Move the pot sideways and drag down to tilt it. The stream follows its actual spout; cups fill only while tea physically lands within an opening. Release near the engraved gold line. A spill is visible, and tapping an overfilled cup empties that cup for another try. There is no timer, entry fee or lost inventory.

When all cups are within their target bands, the actual tray becomes a serving target. Release the pot and touch the tray to serve. Keep the completed tea visible in a terminal served tableau; touching the tray again returns to the room, and touching the pot starts a new standard practice. The small supporting strip reports progress and the result. It never opens an automatic result modal. Exit remains a 44px control.

The guest's sprig remains in inventory until a valid served cup advances the existing story step. The player then carries that cup to the doorstep through the existing scene drop. Cancel/reload keeps the sprig and allows a fresh attempt. Guest service pays no ritual reward and updates no ritual best, mastery, bonds, caps or cooldown.

## Shared simulation and geometry contract

`TEA_TABLE` in content.js provides renderer/input geometry constants only: `room:'kitchen'`, `x:-.53`, `y:.779`, `z:.10`, `aimSpan:.45`, `cupZ:.14`, `cupRadius:.112`, `cupOuterRadius:.14`, `cupHeight:.24`. Renderer adds the kitchen room origin and house root y. Standard two cups use local x ±.23; three cups use -.33, 0, .33; guest uses 0. No renderer decides whether a pour succeeds.

Simulation state adds `activities.teaRecords:[null,null,null,null]` for four difficulty bests. The active tea record is serializable:

```
{id:'tea', phase:'pour'|'served', mode:'ritual'|'guest', level,
 cups:[{id,x,target,fill}], aim, tilt, pressed, spills, poured, result}
```

Aim is normalized -1..1 and maps to `aim * TEA_TABLE.aimSpan`. Tilt is 0..1; pressed is a boolean. Flow starts above .15 tilt and scales to approximately .55 cup volumes per simulation second. `step()` integrates fill, overflow and misses with its existing bounded dt. Fill caps at 1.2; overflow counts as spill. Target tolerance is ±.07; cup aperture uses `cupRadius`. Total poured is cumulative and never resets on emptying. Final score uses closeness to target and useful liquid divided by total poured, so repairs cannot erase waste. No input may submit a correct answer, cup index to fill, score or elapsed duration.

Level 0/1 uses two cups; level 2/3 uses three. Target levels vary within .60–.80 from stable level/day/mastery inputs, without concealed or moving requirements. A changed target always changes the visible engraved marker.

Public commands:

- `beginActivity(state,'tea')` begins standard service through the existing entry point. It rejects another active pouring activity instead of silently replacing it. A served tea can be explicitly replayed after its cleanup.
- `controlTea(state,{aim,tilt,pressed})` validates finite values and boolean ownership, then updates only continuous input. Reject paused/non-tea/served input without mutation.
- `releaseTea(state)` clears pressed/tilt even while paused; it never changes phase or payout.
- `emptyTeaCup(state,id)` empties one cup while released and unpaused, preserving cumulative poured/spill history. Require a valid cup and overfill; short cups are simply topped up.
- `serveTea(state)` requires unpaused pouring phase, released input and every cup in its band. It calculates and records the result once, then makes phase served terminal. Repeated serve fails without mutation.
- `teaStatus(state)` is a read-only presentation snapshot or null. It includes mode, phase, level, aim, tilt, pressed, flow, aimedCup, spills, poured, result, best, cups with ready/overfilled flags, and overall ready.
- `endActivity(state)` explicitly clears the active record and input. Integration uses this cleanup for Exit, resets and incompatible transitions.

Extract the existing ritual completion economy into one helper shared by sequence rituals and tea. Preserve exactly two rewarded completions per earned day, 20 simulation-second cooldown, current reward/mastery/bond/bonus formulas and restoration prerequisites. Practice can improve a best but earns no currency, mastery, bond or comfort. Do not make score a currency multiplier.

`activityInput()` rejects tea and `activityAnswer()` returns no tea solution. Keep stitch and lullaby working unchanged. `interactStory()` at guest-tea step 2 starts guest mode and returns a recognizable `startedActivity:'tea'` response without advancing. Successful guest serve validates the current story step and invokes an internal guarded advance, not public `interactStory()` recursion. The served result carries the normal story response in `storyResult`; it does not duplicate a payout.

Restore whitelists bounded tea bests and discards all active sessions, as existing rituals do. Missing bests become null. Save key `bait-al-dumiah.v1` and version 1 remain unchanged. Reloading an unfinished guest pour restores the sprig, while reloading after service restores the guest cup.

## Artwork and camera contract

Create `createTeaTable(parent)` in render/tea-table.js, returning `{root, update(state), targets, status(), points()}`. `targets` is a stable list of authored hit meshes with `userData.tea` set to `pot`, `cup:0` etc., or `tray`. `points()` returns local/world anchor vectors for diagnostic projection of those actual targets. `status()` reports actual pot/stream/fill/served poses, not desired simulation outcomes. Active rendering follows `teaStatus()` only.

Use a mint enamel pot with a cream motif and brass rim, substantial open porcelain cups, visible amber surfaces, etched target bands and a brass tray. Model real open cup interiors with lathed walls. Keep the pour spout anchored to its aim point while the pot rotates; translation must account for the rotated spout offset. Streams terminate at the receiving surface, or at the tray on a miss. Spill patches and a warm serving accent communicate the result. Reduced motion suppresses decorative sway/steam, while necessary aiming and fill feedback remains visible. No additional lights or shadow maps. Target budget under 5,000 added visible triangles and about 16–24 draws; measure it.

Before house batching, group only the original kitchen tabletop cups/plate/snack into a named `kitchen-original-tea-set` group with noBatch=true and expose it from createHouse(). Hide that group during the activity, not the table, runner or room. Restore it on exit. Keep the nearby kettle as room scenery.

Add a validated optional eyeOffset to camera-motion poses, preserving the existing default. The work view uses eyeOffset [0,12,14], at least 2.0 world units across a portrait phone, and an effective table target around kitchen x-.53, house y+1.10, z.18. The width was refined from the initial 1.85 estimate using actual pot-extreme bounds; the 320px cup target remains at least 44px wide. Derive framing from viewport safe areas. On landscape the rig must fit in the available height with a usable cup size. Disable orbit damping/input and allow the working polar angle during play; restore every normal control limit on exit. Cancel active camera flights before entering the fixed view.

The renderer exposes `teaAt(x,y)`, `teaAimAt(x,y)` and `teaPositions()` for real input and read-only diagnostics. Active work owns canvas picking; ordinary doll/object picking is unavailable inside it. Hide obstructing kitchen residents only as a presentation rule while pouring, then restore them; serving may show a localized Lina reaction if it fits the table view.

## Input and UI contract

`createTeaUI(host,canvas,getState,dispatch,{pick,aimAt})` owns transient gesture and keyboard state, never simulation progress. `pick(x,y)` returns the authored target key; `aimAt(x,y)` returns normalized aim. It exposes update(dt), cancel(), dispose(). Dispatch names: `tea-control`, `tea-release`, `tea-empty`, `tea-serve`, `tea-replay`, `tea-exit`.

Pointer down must begin on the actual pot. Capture one primary pointer; ignore extra pointers and nonprimary buttons. Initial press does not pour. Horizontal motion moves aim; downward travel sets tilt with a clearly explained threshold and controllable range. Pointerup/cancel/lost capture, Escape, pause, hidden tab, modal/context loss and disposal all release input. Tap an overfilled cup to empty it; tap the tray to serve/leave; tap the served pot to replay. Drags must never become accidental cup/tray taps.

Focus the canvas on entry. ArrowLeft/Right continuously move the same aim, held Space pours at a usable tilt, E empties the aimed overfilled cup and Enter serves/returns. Ignore these shortcuts in unrelated inputs or when the work view is inactive/paused. Escape exits after canceling input. Expose current cup/target/fill and readiness accessibly without rapidly announcing every frame.

`tea.css` hides unrelated brand/objective/room/object/camera controls during active work, leaves sound and pause reachable, and places the small instruction/status strip outside the table. The only necessary conventional action is Exit; no full-screen modal, answer grid or toast queue. All visible copy and reason strings are English + Shami in i18n.js. Update the optional activities catalog's tea description and prevent its old active sequence markup from rendering tea.

## Verification and acceptance

Write simulation tests before implementation: exact landing versus gaps, continuous fill, overflow, release, local correction and cumulative waste, invalid input no-mutation, pause/release, busy ownership, terminal serve, both standard reward caps and guest story transition, malformed/old saves and personal-best persistence. Old sequence tests continue checking stitch/lullaby; tea gets stronger physical tests rather than deleted coverage. Pure gesture and camera tests cover pointer ownership, cancel and safe working bounds.

Construct art with measured geometry/target bounds and assert stream alignment, actual rising surfaces, cup target marks, no extra lights, original tea set visibility and reduced-motion/served poses. Use static imports so the artwork fixture resolves the new suite.

Real browser acceptance uses only genuine mouse/touch/keyboard events and read-only diagnostics. Enter from the scene; demonstrate a miss, partial fill, overfill/empty and correction; finish two-cup service and prove a practice cannot farm rewards; run a guest cup and return to the doorstep; pause while held; cancel on Escape/visibility; reload bests and guest inventory. Capture empty, mid-pour, spill, ready and served states on desktop, 320px, 390px, Arabic, landscape and night. Assert controls and actual pot/cup/tray targets remain reachable, no JS errors, no automatic modal and geometry budget. Preserve existing full-game and restoration regression gates. Inspect original captures and get an independent review before acceptance. Commit the iteration and any evidence-driven fixes, then begin the next twenty-idea pass.
