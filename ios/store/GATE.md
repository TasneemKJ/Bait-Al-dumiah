# Studio gate — بيت الدمية · Bait Al-dumiah (iPhone), 2026-11-13

Verdict: **HOLD** (reasons at the end). Everything below was run, not read, unless it says otherwise.

Tools (scratchpad, not shipped): a Playwright **WebKit** bot with touch at 390x844 that only follows what is on
screen (the clue button, sheets, the 3D objects at their projected points, real drags for the needle and the teapot,
real pulls on the moon chimes), in "app mode" (a fake TasKit handler that answers like the App Store); a geometry
checker; a week simulation on the game's own rule functions; the iOS suite on the simulator `Bait Al-dumiah 6.9`
(`010B410B-2ECE-4C99-BEFF-BF47F7DFF8DC`, iPhone 18 Pro Max class, iOS 27.2).

## 1. Cold play and pacing

| Measure | Band | Before | After | Change |
|---|---|---|---|---|
| Play → in the house | — | 1.3–1.7 s (intro skipped with its own 44pt Skip) | same | — |
| First meaningful action | < 10 s | the first tap is the clue, ~2 s after entering | same | — |
| First reward | < 30 s (gate < 10 s) | **114 s (en), 93 s (ar)**: the clue led with the whole first story chapter | **7.8 s (ar)**; en 22 s after Play of which 15 s was the loaded machine's intro, ~7 s after entering | first clue is Lina's tea, which the intro has just named (dfbae13) |
| Taps to first delight | — | 25–28 taps | 4–7 taps | same fix |
| Longest dead air, first 10 min | < 20 s | none found: the clue always offers an act (day-one quiet stretch has its own line) | same | — |
| Longest stretch with nothing new, first 10 min | < 3 min | under 2 min (story beats ~every 5–20 s, then wishes, rituals, night, whispers) | same | — |
| Natural stopping point | 5–15 min | each night: after the whisper the clue says "That is all for tonight. Another night, another secret." The first comes at ~2.5 min game time; a casual player meets it at 8–12 min | journal now offers the morning instead of a dead "Greet" (fix commit 5f3e0a7) | — |
| First sight of the paid unlock | after a real win, ≥ 3 min, never blocking | only where the closed door stands (journal, after whispers) and in Settings; the clue never points at it | same | — |
| Reading load per beat | ≤ 40 words | story clues 12–25 words; store card notes 38–40 words | same | — |
| Console errors / unhandled rejections | 0 | **0** in 15 min (en) and 10 min (ar) | 0 | — |
| Reload mid-game | save returns | day, buttons, cares, journal identical after reload; intro not replayed | same | — |
| Background | pauses, resumes | elapsed frozen while hidden (215.1 s before and after 5 s hidden), save written on hide | same | — |

Bugs and friction the bot found, all fixed with a test seen failing first: the first reward after ~100 s (above);
**a second keepsake always aimed at the kitchen's first spot**, so Place only said "That spot already has something
lovely" (b57cd08); **the journal kept offering Greet the visitor after the night's
whisper** (5f3e0a7). Left: the 3-chapter story can be finished in ~2 minutes by an efficient player (it is short
by design; whispers and restorations carry the days after).

### A simulated week (two 4-minute sessions a real day, no time skipping, rules from `src/simulation.js`)
| Real day | New that day (free app) |
|---|---|
| 1 | all three stories, first wishes, first keepsake, first ritual, kitchen/liwan/studio/bedroom restored to tier 1, whispers 1–2 |
| 2 | whispers 3–4, closeness levels, more keepsakes |
| 3 | whispers 5–6 (`all-whispers`), restorations tier 2, the ending note |
| 4 | the *family* milestone, last tier-2 restorations |
| 5–7 | daily wishes and rituals only; buttons pile up (270 → 709) with nothing left to buy |

With The Fifth Room the door's mendings arrive on days 1–5 and the visitor's gifts from day 6 (one a night).
**Free content lasts ~45–60 minutes of real play** (about six short sessions). Days 5–7 are empty of new things in
the free app: logged in TODO.md ("After 1.0"); no cheap honest beat was added in this pass. **Economy:** income never
runs away in a session (wishes and rituals have daily caps, the basket 9 a day), but in the free app buttons have no
sink after the keepsakes and restorations (~day 5). Progression: restoration 45 → 85 → 140 (≤ 1.9x), door 40 → 60 → 80
→ 100 → 150 (≤ 1.5x): no step over 2.5x, no wall that only time or money clears.

## 2. Overlaps and 3. screens (WebKit, 3x, app mode, a mid-game save; 18 screens each)

Screens per size and language: home, preferences, play, clue open, tools open, every sheet (household, rituals,
decorate, journal, journal at the door, settings, store card top and bottom), placement bar, night, paused, the tea
ritual. Checks: elementFromPoint at the centre and four corners, sibling intersections > 2 px, clipped or spilling
text, off-screen, targets < 44 pt.

| Size | en before | en after | ar before | ar after |
|---|---|---|---|---|
| SE 375x667 | 4 (two selects 19 px tall, two placement selects 18 px) | 2* | 4 (same) | 2* |
| mini 375x812 | 4 | 2* | 4 | 2* |
| 16 393x852 | 4 | 2* | 4 | 2* |
| Pro Max 440x956 | 4 | 3* | 4 | 3* |

\* The remaining findings are the settings switches (52x30), whose tap target is their whole label row (44 pt):
deliberate. Also deliberate: the pause overlay covers the HUD (it is the pause). Seen by eye: checkboxes were drawn as
**blank white squares** on iPhone WebKit and every sheet's close button carried a heavy focus ring on touch: fixed
(rose-thread switches, 44 pt selects in the house's paper, no ring on touch). Screenshots: scratchpad `geo-before/`
and `geo/` (`<size>-<lang>-<screen>.png`). Landscape: the app locks portrait (`UISupportedInterfaceOrientations_iPhone
= UIInterfaceOrientationPortrait`, committed). iPad: not a target (TARGETED_DEVICE_FAMILY 1); the SE pass covers
compatibility mode, and nothing assumes a notch (insets come from `env(safe-area-inset-*)`). Large text: the game's
own Large text switch was not re-measured in this pass. Real simulators: the 6.9" ran the full suite and the store
card test (44 pt, on screen, both languages); a second, small simulator (`Bait Al-dumiah SE`,
`64148262-FB11-4D27-A500-F21B19000D53`) was created but the machine's CoreSimulator was too loaded by parallel agents
to capture from it: **not done**.

## 4. Sound and touch
Every control press: a soft wooden tap and an 8 ms haptic (Taptic Engine in the app), switchable in Settings; an
interrupted audio context resumes on the next touch (tests in `tests/touch-feedback.test.mjs`). Ambience: the
synthesized music-box bed and room tone, night knocks, the canary's trill (now inside the synth's range; it had been
clamped to one note). The silent switch silences the game (`ambientAudio: true`).

## 5. Suites, archive
`npm run verify`: see the final report (573+ node tests, lint, build within the 500 KiB JS budget). iOS: 28 tests
(config 5, StoreKit 16, real page 7). Archive: `/tmp/BaitAlDumiah.xcarchive`, team FJ3FMYPK3P.

## Studio bar

| Item | Status | Evidence |
|---|---|---|
| Never stuck; double taps | PASS | 25 min of bot play in two languages, no state it could not leave; buy buttons disable while the App Store answers |
| First challenge won, no purchase or wait needed | PASS | the free arc ends with all six whispers and three stories without the door |
| Teaching by doing; help findable | PASS | the clue teaches each step; Settings → Help repeats the rules |
| Kill mid-action, relaunch | PASS (page) | save on hide/pagehide; vault copy every 30 s and on background (TasKit); not re-run on device |
| Background 10 s / 10 min / 24 h | PASS | the house runs on its own clock, not the wall clock: hidden time is frozen; no offline rewards to double |
| Damaged saves | PASS | empty, truncated, garbage, `null`, version 99, future field, negative/huge values: each loads a repaired house, never throws |
| Clock tampering | N/A | no wall-clock time in the rules |
| Interruptions | PASS | pause on hide, audio resumes on touch; portrait lock |
| Purchases: buy, cancel, fail, pending, restore, refund, expiry | PASS | BaitStoreTests (16) + page tests; the card says each outcome in plain words in both languages |
| Prices from StoreKit; subscription card complete | PASS | price only from the bridge in `<bdi dir=ltr>`; length, price per period, benefit, renewal line, Terms, Privacy, Restore, Manage |
| Store never before a win, never blocking | PASS | only at the door and in Settings |
| Nothing bought taken back; asked from StoreKit | PASS | `src/access.js`; nothing in the save (test) |
| Arabic and English first-class | PASS | both languages on every screen; dolls are «قلوب» not «أرواح» (fixed) |
| Language follows device on first launch | OPEN | the first launch is English unless chosen in Preferences; not changed in this pass |
| Reduce motion | PASS (existing) | `prefers-reduced-motion` and a switch; still shots for the intro |
| Contrast 4.5:1 | NOT MEASURED | |
| Body text ≥ 15 pt on SE | **FAIL** | sheet text is 11–12 px unless Large text is on; logged in TODO.md |
| Accessible names | PASS (existing) | icon buttons carry hidden labels in both languages |
| Playable with sound off | PASS | every cue is also a line or a glow |
| Silent switch, no stacked loops | PASS | ambient session; voices tracked and stopped on pause |
| Cold launch < 3 s | PARTIAL | home ready 4.2 s in WebKit on a heavily loaded machine; launch colour matches the first paint |
| Frame time | PARTIAL | WebKit 3x, 30 s in play: p50 17 ms, p95 26 ms, 3 frames > 100 ms (machine shared with other builds); real device untested |
| Memory / leaks | PARTIAL | DOM 304 → 491 after 100 journal open/close (the journal kept in the closed sheet, once); not proven flat |
| Zero console errors | PASS | 0 in 25 min of play |
| Offline | PASS | zero requests outside the app's own origin in a session |
| Privacy manifest true | PASS | no data collected; no network; StoreKit only |
| No placeholders / debug UI | PASS | debug hooks only with `?debug=1` or a DEBUG build argument |
| Version, support, privacy in Settings | FIXED | db33ec8 |
| Age rating true | FIXED | Horror/Fear Infrequent/Mild, 9+ (listing.json `age`) |
| Export compliance | PASS | `ITSAppUsesNonExemptEncryption = NO` |
| Feel: answer within 100 ms | PASS | press tap + haptic on every control |
| Settings: sound, haptics, language, restore, manage, support, privacy, version | FIXED | haptics, support, privacy, version added; music is part of Sound (one switch) |
| Start over | PASS (existing) | Settings → Start a new house, with confirmation |
| Reason to return | PARTIAL | "Another night, another secret"; nothing earned while away (no offline play) |
| Share moment | **MISSING** | logged in TODO.md |
| Credits / signature | FIXED | Settings signature and three.js credit |

## Why HOLD
1. **tas-games still says "no purchases"**: `bait-al-dumiah/support.html` ("Are there purchases or ads? No. The whole
   game is free"), `privacy.html` ("no purchases") and `index.html` ("No death, no ads, no purchases") contradict the
   app. They must say that purchases are handled by Apple and collect nothing, before submission.
2. Body text below 15 pt on the smallest phone; no share moment; free days 5–7 have nothing new.
3. Not seen on a real iPhone: WebGL speed and heat, the canary in the liwan, haptics on the Taptic Engine.
4. The store screenshots are real 6.9" app captures from the earlier session's build (the scenes are unchanged by this
   pass); fresh captures from this build, and the small-simulator pass, were blocked by the shared simulator service.
