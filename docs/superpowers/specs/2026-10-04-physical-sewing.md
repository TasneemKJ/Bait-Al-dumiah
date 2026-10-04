# Planned iteration 6 — A thread that remembers your hands

**Status: approved for iteration 6 implementation; runtime not yet implemented.** Root has accepted physical tea at b1940fc: 35 desktop, 63 phone, 34 earned-progression and 6 genuine-tab-visibility checks pass. Root inspected all twelve emitted original desktop, phone, guest, night, landscape and three-cup PNGs; their actual PR-merge checkout tree is identical to b1940fc. This design includes the independently reviewed corner-rearm, final-freeze and lifted-motion continuity clarifications. The execution workspace remains disconnected; no local checks are claimed.

## Twenty ideas before design

1. Lift a real needle from Sami's sewing table instead of opening an answer menu.
2. Guide the needle in two dimensions across an actual cloth hoop.
3. Hold to lower the needle and stitch along a visible contour.
4. Release to lift the needle and stop safely without losing the work.
5. Leave a continuous colored stitch trail behind completed portions of the seam.
6. Show a loose thread loop at a mistake, explaining what needs repair in the scene.
7. Unpick the current section through a real spool while retaining finished sections.
8. Choose thread color through optional physical spools, without an earnings advantage.
9. Author leaf, diamond, jasmine and heart patterns that read as household embroidery.
10. Increase contour complexity through earned mastery without adding a countdown.
11. Use a short bear seam as the first story's physical red-thread introduction.
12. Preserve the repaired bear's visible red seam and patch beside Noor's pillow.
13. Keep a saved practice best based on accuracy and cumulative thread travel.
14. Rotate a motif between rounds to encourage two-dimensional control rather than recall.
15. Finish by touching the completed cloth beside Sami, leaving a visible tableau.
16. Explore a handwheel-fed machine seam as an alternative physical sewing model.
17. Explore pulling a moon mobile through chime targets as the next bedroom activity.
18. Explore winding the recovered music cabinet with directional crank control.
19. Frame hoop, needle, spool and finish target safely on portrait and landscape phones.
20. Provide continuous keyboard needle movement and held stitching through the same rules.

## Purpose and selection

The user requests continued, substantial scene play and rejects a game based on menus, buttons and toasts. Physical tea gives the kitchen a continuous skill loop. Embroidery and lullaby still use an answer-grid modal, and interactStory still mends the first bear through one machine action. The next slice adds a different spatial skill and makes it part of that early story.

Select ideas 1–7, 9–13, 15, 19 and 20. Defer optional color choice and motif rotation until basic control is validated. Ideas 16–18 are alternatives for later loops. No new activity menu, shop or daily task board.

**Physical model: move one held needle over stationary cloth.** This is two-dimensional contour following, distinct from tea's horizontal aim and vertical tilt. A moving hoop beneath an anchored machine needle is plausible but less readable with the current static machine, and would need feed-direction explanation. A moon mobile is promising later but introduces oscillation, possible timing pressure and audio-accessibility requirements. Needle/cloth contact gives the clearest next visual feedback.

## Player loop

Touch the machine twice to enter the studio work view. Pick up the needle by its elevated brass grip. Drag around the visible guide while holding it down; actual thread grows behind its tip. The next unfinished contour remains visible ahead of the hand. Release at any time to lift the needle.

Leaving the current seam produces one loose loop and stops acceptance of further stitches. Release and touch the spool to unpick only the current section. Finished sections remain on the cloth. There is no entry fee, deadline, household-need penalty or complete-round reset. Repair returns the needle to the start of the unfinished section; cumulative mistakes remain in the score.

After all sections are sewn, the cloth becomes a finish target. Release, then touch it to finish. It rests beside Sami in a terminal tableau with the completed stitch trail and a compact result line. Touch the grip to begin a new standard round after explicit cleanup; touch the finished cloth to return to the studio. Exit remains the only required conventional action.

The red-thread story opens a two-section bear seam rather than immediately giving the repaired bear. Completing and finishing it returns the existing mended-bear item. The placed bear carries an actual red stitch/patch in its room tableau, including after reload. No color choice interrupts this introduction.

## Shared geometry and authored contours

STITCH_TABLE in src/content.js fixes these values:

| Field | Value | Meaning |
| --- | --- | --- |
| room | studio | Rendering adds existing room origin |
| x, y, z | -.35, .891, .05 | Cloth plane center relative to the room |
| clothScale | .46 | One normalized unit in each cloth direction |
| hoopRadius | .46 | Outer working hoop radius |
| gripHeight | .38 | Grip above tip, preserving finger clearance |
| boardSize | [1.68,.06,1.15] | Supported fold-out cream working board |
| boardEdgePadding | .015 | Minimum authored edge padding |
| spoolOffset | [.65,0,.03] | Repair spool relative to cloth center |
| finishOffset | [-.65,0,.15] | Finished cloth relative to center |
| gripDiameter | .35 | Filled spherical/camera-facing grip pick geometry |
| spoolDiameter | .35 | Filled spherical/camera-facing repair pick geometry |
| finishSize | [.35,.54] | Flat finished-cloth pick geometry in x/z |

The board center is [-.35,.850,.05] locally; cloth world center is [-2.75,4.351,.05] after studio origin and house root y. Board rear edge -.525 leaves .055 ahead of the machine base's front edge -.58. Neither cloth nor guide enters the machine. Two slim supports near local x -.90 and .20, z .52 extend from the floor to board underside. Batch these boxes together (+24 triangles). The extension has visible physical support.

Normalized needle x,y lie in [-1,1]. World x = table.x + x*clothScale; world z = table.z + y*clothScale. Tip touches cloth while pressed and lifts .10 world units when released. Grip follows at gripHeight above the tip. Preserve the initial pointer-to-tip grab offset. Grip and spool pick geometry is filled/spherical or camera-facing, not a thin ring whose bounding box exaggerates its actual target.

The reviewed construction geometry at 667×320 gives target diameter 44.55px, grip-tip separation 36.72px, top margin 2.37px, board margin 4.39px, and finish target 44.55×44.73px. These are supplied construction evidence, not rendered screenshot acceptance or local checks performed during this disconnected recovery. Implementation must verify the full [-1,1] grip range in both contact/released poses and the whole board inside the safe rectangle, respecting .015 edge padding. Original phone screenshots remain required.

STITCH_PATTERNS contains stable IDs and ordered sections, each a polyline of at least three finite points inside radius .80. Neighboring sections share endpoints:

- Story bear-seam: [[[-.58,-.05],[-.30,-.20],[0,-.05]], [[0,-.05],[.30,.15],[.58,-.05]]].
- Level 0 leaf: [[[-.60,0],[-.30,-.40],[0,-.60]], [[0,-.60],[.30,-.30],[.60,0]], [[.60,0],[.20,.35],[-.60,0]]].
- Level 1 diamond: four sections through anchors [[-.60,0],[0,-.60],[.60,0],[0,.60],[-.60,0]]; each midpoint is the endpoints' midpoint multiplied by 1.20.
- Level 2 jasmine: five sections through anchors [[0,-.68],[.65,-.21],[.40,.55],[-.40,.55],[-.65,-.21],[0,-.68]]; each midpoint is the endpoints' midpoint multiplied by .45, making visible inward bends.
- Level 3 heart: eight sections through anchors [[0,-.15],[.35,-.45],[.65,-.15],[.40,.35],[0,.65],[-.40,.35],[-.65,-.15],[-.35,-.45],[0,-.15]]; each midpoint is the endpoints' midpoint.

Difficulty changes shape/section count. Corridor tolerance stays .11 normalized units; physical targets remain at least 44px. Paths remain visible; no memory/reverse-answer mechanic remains for stitch.

## Simulation, coverage and exact-corner fairness

Rules belong in src/simulation.js. A pure numeric contour helper may be extracted to src/stitch-path.js to keep simulation readable; no Three.js, UI or input state there.

Serializable active state:

    {id:'stitch', mode:'ritual'|'mend', phase:'sew'|'finished', level,
     patternId, section, distance, needle:{x,y}, target:{x,y}, pressed,
     loose, travel, alignmentTravel, repairs,
     capture:null|{section,edge,point:{x,y},alignmentWeight}, result}

Target is the latest raw normalized input and remains separate from actual needle/capture routing. At every session start, needle and target equal the first point of the first section, with section/distance zero and pressed/loose false. Completed sections are the prefix before section; distance is accepted arc distance in the current section.

Needle travel is limited to .90 normalized units per simulation second. Existing bounded step dt advances toward the raw target, except during the defined physical vertex capture. Controls never directly move the needle or submit progress. All movement, including assistance, shares the single .90*dt distance budget and counts actual travel. The global clock/frame cap is unchanged.

Sweep actual movement at spacing no greater than .02. Judge only the active section's next contiguous polyline edge. Project samples onto that edge, require distance at most .11, and advance accepted arc only continuously from the previous accepted position, by no more than actual traveled length plus epsilon 1e-6. Crossing future edges/sections, moving backwards or reaching an endpoint without covering its contour cannot skip work. Advance an edge only after actual coverage completes it; preserve finished sections. A loose loop latches until local repair. Stationary needle earns no progress; a stationary pointer may coexist with a visibly moving bounded needle.

### Physically paid vertex capture

Exact corners must be fair without giving free progress. Use a .04-normalized-unit disk around the current edge endpoint, including final section/round endpoints.

A capture may arm during a NEW valid forward raw-target-driven sweep, including one that starts inside the endpoint disk after cancellation. At the first eligible point, the needle must be within .04 of the current endpoint, accepted incoming arc must be within .04 of the edge end, actual movement and accepted forward arc must both increase, and endpoint distance must decrease. The sweep must satisfy the existing corridor, continuity and actual-travel bounds. A stationary fresh press, invalid/off-corridor approach, future-edge intersection or assisted movement cannot arm capture. No retreat outside the disk is required after cancellation. Merely entering the disk grants no endpoint/section advancement.

At the first eligible point, store section/edge/exact endpoint and the entry alignment weight in capture. Route actual needle movement through that exact vertex before pursuing the latest raw target. Split the sweep at the first eligible point (the mathematical disk entry when approaching from outside) and exact vertex arrival, so different event/frame cadences consume equivalent distance, coverage and score. Spend the remaining movement budget traveling from entry to vertex; only actual paid coverage may complete the incoming edge. If budget expires first, retain capture for the next step. After actual vertex arrival, clear capture, advance the fully covered edge through normal rules, and use any remaining budget toward the latest raw target, except at the final contour. Assistance itself cannot arm another corner; any later capture must arise from new eligible raw-driven forward movement.

Assisted movement alignment credit is capped at the alignment weight at disk entry, even when routing closer to the exact seam. All assistance travel counts in travel; accepted arc never exceeds actual traveled length. This is a visible movement correction, not a snap or fabricated score.

Release/cancel/pause stops movement and clears capture. releaseStitch also fixes target at current needle to prevent residual pursuit. Pausing through integration invokes release; defensively clear capture/pressed at the simulation pause boundary as well. Fresh stationary pressing cannot resume or rearm a canceled capture; the player must make a new valid forward approach, which may start inside the disk. Update the visible needle/trail from actual state throughout.

When the last edge is actually covered and the needle reaches the final vertex, immediately freeze the actual needle there and clear capture. Do not spend the frame's remaining movement budget. Subsequent held input or raw-target changes cannot add travel, alignment, loose loops or repairs. Keep phase sew awaiting release and explicit finish. Endpoint arrival grants no result, payout or story advancement. The freeze condition is completed contour coverage, not presentation ready, because the pointer may still be held.

### Lifted motion and seam continuity

While released, explicit arrow input may move the lifted needle toward a new raw target at the same bounded .90 rate. This adds no coverage, stitched travel, alignment credit or capture. Release/cancel fixes target at the current needle and clears capture, stopping existing pursuit; subsequent explicit input may reposition it again.

The last accepted stitch front is derived from the current section and accepted arc distance. Hovering never moves that front. Pressed movement may extend the seam only when its actual swept trajectory reaches or crosses the front within the current edge's corridor. Split at that crossing and accept only the subsequent contiguous forward portion, subject to the existing actual-travel bound. A needle already at the accepted front can continue immediately.

If hovering placed the needle ahead of the front, repressing there or moving farther ahead cannot add progress or arm capture. Return across the front, then move forward to resume; no exact stationary landing is required. Failing this continuity condition alone does not latch a loose loop. Normal off-corridor movement after valid engagement retains the mistake rule. Derive engagement per sweep; no extra saved attachment subsystem is needed. Pointer regrabbing starts from the actual grip, preserves its offset, and never resets needle or coverage.

Required fairness cases include valid .01–.03 offsets near ordinary corners/final endpoints and jasmine's approximately 146.4° acute turn; invalid chord/future-edge approaches; equivalent cadence across disk entry/vertex arrival; repeated cancellation and paid rearm inside the disk; unchanged-needle regrab; lifted repositioning and front-crossing recovery; final-tick overshoot/held input after completion; and accepted arc <= actual travel.

## Repair, scoring and public commands

Pressed movement adds actual length to travel. AlignmentTravel adds length weighted by max(0,1-corridorDistance/.11), with invalid samples contributing zero and assisted samples capped as above. Repairs do not reset cumulative totals.

Finish score is round(100 * alignmentTravel/travel * min(1,requiredContourLength/travel)), clamped 0..100. No score for empty/unfinished paths. This measures accuracy and inefficient travel without a timer or repair exploit.

- beginActivity(state,'stitch'): starts standard physical sewing; existing session returns activityBusy.
- controlStitch(state,{x,y,pressed}): finite normalized coordinates/boolean only; reject extra fields and paused/non-sewing/finished input; update raw target/ownership only.
- releaseStitch(state): clear pressed/capture and fix target at current needle, including while paused; never finish/repair.
- unpickStitch(state): released/unpaused sewing, with loose loop or partially sewn current section; clear only current distance/loose/capture, put needle/target at that section's start, increment repairs, retain completed sections and cumulative measurements.
- finishStitch(state): unpaused/released, no loose loop/capture and every section complete; pay/advance once, keep terminal finished with immutable result.
- stitchStatus(state): read-only snapshot including active fields, authored sections, completed prefix, accepted trail, next guide point, ready and numeric best; null outside stitch.
- endActivity(state): release physical tea and stitch before clearing active. Explicit cleanup precedes replay.

activityInput rejects stitch with stitchPhysical; activityAnswer returns no stitch answer. Study/recall/hint commands reject physical stitch without mutation. Lullaby remains unchanged.

Standard finish uses shared completion economy: two rewarded completions per earned day, 20-second unpaused cooldown, thresholds 0/2/5/9 and existing reward/bond/comfort/restoration rules. Score never multiplies currency. Practice changes only better activities.stitchRecords[level], four numeric bests/nulls, and transient work. Played difficulty selects record slot even if finishing raises mastery.

At mended-friend step 1, interactStory('prop:sewing-machine') starts mode mend, returns startedActivity:'stitch' and retains red-thread. Valid finishing verifies that step and internally advances; result.storyResult is the existing response. No ritual payout, record, mastery, bond, comfort, daily-cap or cooldown changes. Cancel/reload retains red thread. Lost-song cylinder repair remains unchanged.

Finished commands cannot pay again. Invalid control/repair/finish preserves state, apart from explicit release safety. Reasons: existing pausedActivity/activityBusy/invalid/storyNotHere; new stitchPhysical/stitchNotActive/stitchFinished/stitchHeld/stitchNotReady/stitchNoRepair. All visible copy is English and Shami.

Save key bait-al-dumiah.v1 and version 1 remain. Restore clamps four finite stitchRecords to integers 0..100, defaults missing/malformed entries to null, and discards active sessions (including capture). Permanent bear patch derives from completed story, not renderer flags. No analytics, remote assets/dependencies, purchase or offline decay.

## Scene, input and camera

createSewingPlay(parent) in src/render/sewing-play.js returns root/update(state)/targets/points()/status(). Stable keys needle/spool/cloth live on real meshes with userData.stitch. Dynamic geometry shows actual accepted thread, loose loop, tip contact/lift, routed corner motion, red bear patch and terminal cloth. Renderer never judges coverage. No extra lights/shadow maps; rig below 5,000 visible triangles and at most 24 draws. Bear retains red seam after reload.

Retain studio, machine and original spools. Isolate entire studio chair before batching; hide during work and restore on every exit. Board is a supported fold-out extension. Obstructing residents may hide during work as presentation only, restoring on exit. Reduced motion stops decorative sway, never necessary needle/contact/trail feedback.

stitchFraming(width,height) uses validated camera poses, eyeOffset [0,12,14], zoom1.8. Safe areas: portrait top90/bottom176; desktop top72/bottom132; short landscape top68/bottom112; height<=340 top60/bottom92. Effective vertical span=max(1.85/aspect,1.32*height/usableHeight), target cloth center plus .26 world y and safe-area centering offset. Add studio origin and house root y .26. Full board and all normalized grip positions in both poses fit; verify geometry dimensions/evidence above. Disable orbit during work; restore all limits on exit.

createStitchUI(host,canvas,getState,dispatch,{pick,pointAt}) owns gesture/keyboard state only, exposes update(dt)/cancel()/dispose(). Actual grip starts one primary pointer, grab offset preserved; foreign pointers/buttons ignored. Release/cancel/lost capture/Escape/pause/blur/hidden tab/resize/modal/context loss/disposal lift needle and clear capture. Drags never become spool/cloth taps. Projected grip remains at least36px above tip on320px phone; upcoming contour stays beyond finger, verified by screenshots.

Arrows move raw target at .90 normalized units/second; normalize diagonal vector before rate*bounded dt so two arrows are no faster than one. Held Space stitches, U unpicks, Enter finishes/returns, Escape exits. Ignore unrelated inputs/inactive work; focus canvas on entry. Dispatch stitch-control/release/unpick/finish/replay/exit.

Compact instruction/status strip and Exit preserve pause/sound. No answer grid, automatic result modal or toast queue. Accessible section/mistake/finish announcements, not every needle sample.

## Acceptance and separate future work

Tests precede rules: no stationary progress, endpoint teleport, bend chord or future-edge skip; forward continuous 2D coverage, physical vertex fairness and cadence equivalence; local repair/retained waste; invalid/paused input, foreign pointers/cancellation, terminal finish, reward protections, best records, guarded story, cancel/reload and old/tampered saves. Keep tea/lullaby/care/decor/restoration regressions.

Art tests measure real contact/trail persistence, loose loop/patch/reload, reduced motion, target surfaces, full-range framing and budgets. Genuine mouse/touch/keyboard tests trace contours rather than submit correctness. Capture empty/mid/mistake/repaired/ready/finished desktop,320/390px Arabic phone,night and667px landscape. Verify finger clearance,44px geometry,no modal,zero errors and original image readability. Exact-head full/story/expansion/sewing CI and independent integrated review precede acceptance. Root commits/publishes after review; no production merge/deploy.

**Separate future candidate: low-FPS foreground pacing.** Tea evidence shows the existing100ms frame cap can advance passive foreground time slowly under software rendering. Passive time/direct-input motion need separate design to avoid unseen catch-up pours or stitches. Sewing does not change global clock/reward eligibility as an acceptance workaround.
