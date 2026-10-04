# Physical Sewing Implementation Plan

> **For agentic workers:** Use Superpowers tests-first implementation and independent task review. Root owns integration/commits; disjoint workers start only after accepted design and current tea evidence.

**Status: approved design; runtime not yet implemented.** Physical-tea acceptance and original-image review are complete at b1940fc. The workspace transport remains disconnected. Workers may preserve disjoint source changes in unreferenced GitHub review commits; root owns integrated branch publication. Supplemental pure-JavaScript numeric checks do not replace Node/build/browser CI.

**Goal:** Replace embroidery's answer menu with continuous two-dimensional cloth tracing and a physical bear-mending introduction.

**Architecture:** Serializable simulation/pure numeric contour geometry judge movement, paid vertex capture, coverage, repair and rewards. Dynamic Three.js shows the same needle/thread state; pointer/keyboard supply raw targets through a fixed work camera. Existing shared completion economy and derived story inventory preserve ownership.

**Tech Stack:** existing ES modules, local Three.js, Node tests, Python Playwright; no new dependencies.

**Spec:** docs/superpowers/specs/2026-10-04-physical-sewing.md

## Global constraints

- Save bait-al-dumiah.v1/version1; discard active sessions/capture on restore.
- Two rewarded completions per earned day,20-second unpaused cooldown,thresholds0/2/5/9; practice score never multiplies currency.
- Global clock/frame-cap policy unchanged; low-FPS pacing is separate future design.
- English/Shami,44px real targets,pause/reduced motion/audio gesture boundary,local dependencies/art.
- Root reviews/integrates/publishes coherent checkpoints; no production merge/deploy.

## Review focus

- Sparse motion crosses a bend: sweep actual trajectory, budget capture physically, never skip.
- .01–.03 endpoint offsets and146.4° jasmine turn: earned incoming approach routes through exact vertex without free arc/score.
- Finger/grip/wholeboard at667×320: real44px surfaces and full[-1,1] both-pose bounds must fit.
- Pause/cancel/repair/reload: no stale capture/pressed ownership, finished sections/mistakes/economy retained.
- Mend vs ritual at shared machine: keep red thread until finished and award no story-mode ritual benefits.

## File responsibilities

| Unit | Files | Boundary |
| --- | --- | --- |
| Geometry/rules | src/content.js,src/simulation.js,optional src/stitch-path.js | Numeric paths/sweep/capture/economy/save |
| Rule tests | tests/stitch-play.test.mjs,tests/activities.test.mjs,tests/story-play.test.mjs | Real controls and simulation ticks |
| Art | src/render/sewing-play.js,src/render/house.js,src/render/story-props.js,tests/art-sewing-checks.js | Real needle/cloth/trail/patch/targets |
| Input/copy | src/stitch-input.js,src/stitch-ui.js,src/stitch.css,src/i18n.js,src/activities-ui.js,tests/stitch-input.test.mjs,tests/stitch-copy.test.mjs | Gesture/keyboard ownership/strip |
| Integration | src/main.js,src/render/world.js,src/render/stitch-camera.js,src/ui.js,src/story-ui.js,index.html,tests/stitch-camera.test.mjs | Work picking/camera/cleanup |
| Acceptance | scripts/stitch_check.py,existing affected harnesses,.github/workflows/expansion.yml,README.md,iteration ledger | Genuine input/regression evidence |

### Task1: Numeric coverage, paid corner capture and economy/story

**Produces:** STITCH_TABLE/STITCH_PATTERNS,controlStitch(s,{x,y,pressed}),releaseStitch(s),unpickStitch(s),finishStitch(s),stitchStatus(s),generic endActivity(s). Exact spec geometry/path/state fields; status supplies authored sections/accepted trail/completed prefix/next guide/ready/result/best.

- [ ] Write failing coverage tests for stationary needle,endpoint teleport,bend chord,reverse/future-edge skipping and valid2D traces; run node --test tests/stitch-play.test.mjs and record RED.
- [ ] Implement sequential swept coverage at .02 spacing,.11 corridor,.90units/sec. Initialize needle/rawtarget first contour point,section/distance0,pressed/loose false,capture null.
- [ ] Add RED tests for valid .01–.03 near-corner/final offsets,146.4°jasmine turn,raw-only valid capture entry,cadence equivalence,disk-entry no free progress,acceptedarc<=actualtravel.
- [ ] Implement .04vertex disks and serializable capture. Split sweep at exact entry/arrival; share .90*dt budget/count travel; cap assisted alignment at entry weight; assistance cannot arm another corner. Keep rawtarget separate.
- [ ] Test release/cancel/pause clearing capture, stationary fresh press unable to arm, new paid forward rearm inside the disk, local unpick preserving finished prefix/cumulative measurements, and terminal finish/idempotence. Implement through one cleanup boundary.
- [ ] Test lifted arrow-only motion and actual-front continuity: unchanged-needle regrab, hover-ahead rejection, backward crossing then forward recovery, and sparse samples spanning the front. Keep lifted movement out of coverage and score.
- [ ] Test final-contour freeze for a large finishing tick and further held/raw-target motion. Preserve released explicit finish as the only payout/story boundary.
- [ ] Route standard finish through shared economy; test2daily/cooldown/quickdawn,best record without care/bond/comfort/earnings,and played-difficulty slot.
- [ ] Test red-thread start,guarded internal advance,no ritual side effects,unfinished/finished reload; update story fixtures to actual controls/ticks.
- [ ] Whitelist four bounded stitchRecords; reject old stitch integer/study/recall path while retaining tea/lullaby tests.
- [ ] Run targeted rules then npm test; report exact results/concurrent failures. Worker does not update branch refs; remote review commits are allowed.

### Task2: Visible work, supported board and lasting bear patch

**Consumes:** Task1status/constants. **Produces:** createSewingPlay(parent) with root/update(state)/targets/points()/status(),real userData.stitch needle/spool/cloth targets.

- [ ] Add constructed assertions for tip contact/lift,actual trail/finished-section persistence,loose loop/repair,visible assisted needle motion,terminal cloth and restored redbear patch.
- [ ] Build cloth[-.35,.891,.05],board[-.35,.850,.05],size[1.68,.06,1.15],scale/hoop.46,gripHeight.38 (+.10released),spool[.65,0,.03],finish[-.65,0,.15].
- [ ] Use filled spherical/camera-facing grip/spool diameter.35;flatcloth .35×.54 x/z;boardedgepadding.015. Preserve machine/oldspools.
- [ ] Isolate entire studiochair beforebatch;hide duringwork/restoreexit. Add two batched floor-to-board supports x-.90/.20,z.52 (+24tris). Assert rear-.525/basefront-.58 clearance.055/worldcloth[-2.75,4.351,.05].
- [ ] Check reduced-motion/ray targets/no extra lights or shadowmaps; measure below5000visibletris/24draws and statically import art checks into CI fixture.
- [ ] Report measured geometry/visibility and unverified screenshot behavior; no shared rule/input/integration edits.

### Task3: Actual grip pointer and normalized keyboard controls

**Produces:** createStitchUI(host,canvas,getState,dispatch,{pick,pointAt}) → update(dt)/cancel()/dispose(). pick→needle|spool|cloth|null;pointAt→normalized{x,y}|null. Exact stitch-* dispatches from spec.

- [ ] Write failing ownership/graboffset/foreignbutton/multitouch/sparsemovement/drag-to-tap/cancel tests.
- [ ] Implement pointer capture and arrow/Space,U/Enter/Escape controls supplying rawtarget/pressed only. Normalize diagonal direction to same .90units/sec; test equal straight/diagonal speed.
- [ ] Test pause/hidden/blur/resize/modal/disposal release/captureclear and unrelated-input exclusion;focuscanvas onentry.
- [ ] Add bilingual key tests and compact status/Exit strip,transition-only announcements,44pxcontrols,reachable pause/sound.
- [ ] Remove physical stitch active answer grid;optional catalog/restoration remains outsidework.
- [ ] Run input/copy tests and npm test;report field/reason assumptions to root.

### Task4: Safe work camera and main integration

**Produces:** stitchFraming(width,height);world stitchAt(x,y),stitchPointAt(x,y),stitchPositions(),read-only opt-in diagnostics.

- [ ] Test exact safeareas/eyeOffset[0,12,14]/zoom1.8/span=max(1.85/aspect,1.32*height/usable)/cloth+.26y;full[-1,1]gripbounds incontact+released poses/wholeboard/edgepadding.
- [ ] Verify667×320real target44px and grip-tip36px. Reviewed construction reference:44.55px target,36.72pxseparation,2.37pxtop,4.39pxboardmargin,finish44.55×44.73. New implementation measures these; supplied numbers do not replace screenshots.
- [ ] Integrate workart once,camera/pick priority,normalorbit disabled/restored,and chair/resident presentation restored onall exits.
- [ ] Wire standard/mend start,rawcontrols,release,unpick,finish,replay,exit;guard story completion internally and retain carriedbear UI.
- [ ] Cleanup incompatible transitions/reset and pause/hidden/resize/modal/contextloss;defensive simulationpause release;keep tea/lullaby/story/decorroutes.
- [ ] Run npm run verify and constructed art/camera checks.

### Task5: Genuine-input CI, original images and publication

- [ ] Add scripts/stitch_check.py with actual projected traces/touch/keyboard,not score/statewrites. Exercise offseam failure/localrepair,nearvertexfairness,cancelassist,releasedfinish,freepractice,idempotence,and firststorybear.
- [ ] Capture empty/mid/mistake/repaired/ready/finished desktop,320/390pxArabicphone,night,667pxlandscape. Verify finger-clearance/44pxactualgeometry/no modal/zeroerrors.
- [ ] Update intentional stitch routes in existing story/expansion/browser tests while retaining tea rewards/restoration/high-detail budgets.
- [ ] Add dedicated CI;run npm run verify,npm run test:browser,affected art/story/expansion/sewing jobs. Keep unsupported native-browser limits explicit;no clock changes to accelerateacceptance.
- [ ] Obtain independent integrated review,inspect originalscreenshots,fix concrete failures and rerun required gates.
- [ ] Root integrates/commits/pushes coherent iteration,checks exactheadref/CI,updates README/ledger;only then begins another twenty-idea cycle.

## Self-review and handoff

All review risks map to explicit numeric/input/camera/browser tests. Exact geometry,rawcontrol/state/capture/score/command fields,storyguard,economy andsave come from spec. There is no timing/inventory/shop subsystem in this plan. Root has accepted the current tea evidence and this design. Runtime implementation and its independent Node/build/browser/visual acceptance remain to be completed.
