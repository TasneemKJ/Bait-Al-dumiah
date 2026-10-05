# Reclaim the miniature: mobile composition

Date: 2026-10-05. Bounded UI/render presentation batch.

## Grounded direction
The original 390×844 kitchen-focus image from baseline commit `5e1d9dfb02d5c3e40b3fdef0fa460fb05a3cd228` leaves roughly 120px between the house plinth and its first lower controls. Its expanded clue covers upper-room art and still says “Look in the Kitchen” after arrival. The 1280×800 original confirms the dispersed hierarchy. Both actual PNGs were inspected before source changes. The following foley-only source commit `648e5f339b2da47f2649c62ce576d10dc0f95b5d` preserves these visual conditions.

Choose presentation-aware safe framing, a folded thread-paper clue, and one restrained material-led navigation edge. Keep the four-room world, its physical verbs and accessible DOM equivalents. Do not enlarge all prop hit boxes, add a physics engine, create new menus, or claim a retention score.

## Contract
- Actual visible HUD rectangles, measured only on meaningful layout changes, supply camera insets. Renderer never reads the DOM; simulation and saves never receive these values.
- Idle portrait browsing reserves the two-row edge only. Ribbon, held-item and feedback states reserve space only while present. Folded clues retain a separate 44px accessible expansion control and never auto-fold while a player is using them.
- The short 360×640 view recovers room scale. Width-bound 390×844 retains the horizontal room envelope and places its selected room toward the lower safe edge, replacing the old empty band with the house. Keep at least 10px horizontal containment for authored edge bounds.
- Arrival replaces the repeated room-navigation label with a localized object name. The action still follows the safe room-focus route and never activates an object, spends, or advances progress.
- Four named room choices, discovery, home, tools, sound and pause retain semantic controls, focus rings and 44px targets. Physical rituals retain independent camera/HUD ownership. House framing ignores ritual docks and remeasures on exit.
- On crowded phones, an object's response is written within its existing selection ribbon and the optional visitor invitation yields until selection is dismissed. No extra notification panel covers the room.
- Ignore unchanged hidden/class writes from animation and inactive adapters; an unchanged UI tick must not even schedule repeated layout reads or reset a player's manual camera.
- No save schema/key, economy, story chain, dependency, artwork, audio or quality-policy changes. Contact/material art remains a separate later slice so comparison can attribute this batch accurately.

## Twenty ideas: IDEAL and 5Ws


Each item records Identify/Define (I/D), Explore/Act (E/A), and Look back (L). “Why” describes a player benefit hypothesis, never a measured retention claim.

| # / lens | Who / when / where | What and why | I/D | E/A | L |
|---|---|---|---|---|---|
| 1 Composition | Phone player; idle browsing; selected room | Reclaim unused ribbon space so the miniature receives attention | Fixed 308px reserve wastes scene | Choose state-aware safe framing; selected now | Compare projected bounds and phone screenshots |
| 2 UI | New/returning player; reading next clue; screen edge | Fold long clue to keep readable guidance without covering art | Expanded card dominates | Compare short note vs small expandable paper; selected now | Check full clue retrieval, focus and overlap |
| 3 Controls | Touch/keyboard player; room navigation; bottom edge | Material-led room labels and one quiet tools cluster | Three floating rows read as app chrome | Consolidate visual treatment, keep DOM semantics; selected now | Measure 44px targets and active room in both locales |
| 4 Self-teaching | New player; arrives in target room; mint tin | Arrival-aware clue lets the prop become the destination | Same room-navigation instruction repeats | Contextual label/cue; selected within clue work | Room focus does not advance story or spend currency |
| 5 Visuals | Phone player; first object touch; kitchen counter | A red thread peeking from tin makes its story visible | Referent is small and beige-adjacent | Author a few thread segments; defer art slice | Read at phone scale; no neighbor occlusion |
| 6 Materials | All players; object closeup; tin | Distinct enamel rim/highlight gives tin a metal identity | Matte mint resembles cabinetry | Reuse cached finish approach; defer | Day/night screenshots and stable material count |
| 7 Materials | All players; earned bear replay; bedroom | Woven cloth and repaired red seam reinforce the handmade reward | Bear uses wood-colored primitives | Dedicated cloth finish, preserve earned patch; defer | Earned/not-earned, phone/desktop, no save change |
| 8 Depth | Low-quality phone player; all browsing; floor contacts | Stronger existing contact masks ground furniture | Shadows off leaves broad flat areas | Tune existing masks before adding resources; defer | Low quality images; no extra shadow maps |
| 9 Atmosphere | Player at dusk; room transitions; windows | Slightly stronger lattice direction makes time feel physical | Daylight is diffuse at phone scale | Tune existing window patches; defer | Floor motifs and objects remain readable |
| 10 Atmosphere | Night player; quiet browsing; practical lamps | Warm pools with cool edges separate room identities | Needs night evidence before changes | Review existing lighting first; defer | Same-state day/night pairs, face readability |
| 11 Game feel | Touch player; opens tin; existing lid | Brief weighty settle matches current metal foley | Audio alone has limited visual consequence | Tiny bounded lid settle; defer | Paused/reduced-motion end pose; no repeated reward |
| 12 Game feel | Touch player; rocks earned bear; bed | Soft delayed cloth response makes replay satisfying | Existing response is subtle rotation | One bounded body response, no physics engine; defer | Stop cleanly and remain still when paused |
| 13 Audio | Sound-enabled player; successful object action; tin/bear | Sync existing foley to visible contact | Current slice already owns sound | Preserve rather than add sound system; no new work | Gesture/mute/pause/dispose checks and listen |
| 14 Writing | Arabic/English player; clue arrival; edge note | Short warm copy names the actual next verb | Navigation text can be redundant | Bilingual contextual copy; selected if needed | RTL wrapping and native-quality Arabic review |
| 15 Accessibility | Keyboard/reduced-motion player; every state; HUD/world | Keep physical mood with predictable controls | Cosmetic minimalism can hide functionality | Preserve labeled DOM fallback and visible focus; invariant | Tab order, 44px, announcements, instant camera |
| 16 Loop/balance | Story player; clue/cue interaction; all rooms | Better discoverability without reward changes | Presentation changes risk auto-actions | Route existing commands only; invariant | Buttons, wishes and story snapshot unchanged on focus |
| 17 Replayability | Returning player; revisits completed keepsake; bedroom/parlor | Readable earned objects invite existing free replay | Replay can be buried behind labels | Let earned art remain visibly distinct; later slice | No duplicate chapter reward or mastery farming |
| 18 Data safety | Returning player; reload/rotate; any room | Changes preserve household progress | Camera/UI state should not enter saves | Keep presentation ephemeral, save key v1; invariant | Existing save restores; carried items survive |
| 19 Performance | Phone player; room switching; renderer | Detail stays local and bounded | New decorative materials can break batching | Reuse caches, no new post-process/light budget; invariant | Calls/triangles, resource growth, emulated throttle |
| 20 Release/stability | Every player; published load/context recovery; whole game | Evidence matches the actual delivered build | Model tests can pass bad composition | Stamp renders to head and inspect all key states; selected verification | Current commit, matching bytes, no fallback/errors |


## Verification and acceptance
Three behavior regressions were observed failing before implementation: idle short-phone zoom stayed 1.172, width-bound phone placement recovered zero pixels, and arrival repeated its room-navigation label. They pass after the policy/context change.

Numeric reference with measured-edge-like insets top137/bottom124:
- 360×640 kitchen authored bounds grow from 155px to about 240px high, with about 2.4× projected room area; zoom1.172→1.815. Require at least 45% height improvement in the comparable idle shot.
- 390×844 kitchen authored bounds retain x14–376 and260px height while moving from y221–481 to approximately y390–650. Require at least 100px downward placement recovery, unchanged scale within 1%, and all edge props in view.
- Default whole-house reset remains independent of presentation reservations. Top rooms keep their 3.2-world-unit relationship to ground-floor rooms.

Source checks cover inset geometry, all room edge corners, unchanged home reset, arrival without mutation, bilingual copy, observer deduplication, work-HUD isolation and short-landscape target sizing. The real-DOM UI suite additionally covers folded/expanded clue, visible book icon, five-point hit tests, rebuild/focus stability, ribbon reservations, ritual exit and crowded night feedback.

Rendered acceptance is pending fresh exact-commit browser evidence. Required touch/EN/AR matrix: 360×640,390×844,412×915,844×390, plus 568×320 and existing 360×320 short-landscape stress. Capture whole house, all four rooms, folded/open clue, selection, carrying, crowded night response, discovery/tools open, night and return from tea/sewing/chimes. Include 4× CPU observations. Run original story, physical ritual, UI and art regressions; inspect original PNGs and compare identical state/locale/viewport pairs. Unit totals and build success are not visual acceptance.
