# Changelog
Each merged batch adds an entry and a `vX.Y.Z` tag.

## Unreleased
- Atmosphere: soft warm light pools on the floor under the parlor lamp and every owned lamp (brightness follows the lamp), and a faint steam wisp from the kitchen kettle while Lina is idle. No new lights; steam is static under reduced motion and hidden when paused.
- Atmosphere: golden hour. For about half a minute before night the sky gains a warm horizon band, the key light turns amber and the windows glow warm; it hands over to the night look and is zero for the rest of the day.
- Writing: one calm day-one line ("The house breathes out...") after the opening burst, once, only after the player has cared for someone; stored in the optional whitelisted `hints.calm`.
- Arabic copy: counts read as "label: n / total" (no number before a plural noun), reward wording matches, and the clue button no longer joins a kashida to the article or says "in the sleeping"; a contract test scans digits, placeholders and these rules. Pacing: `scripts/pacing-curve.mjs` and `docs/audits/2026-10-06-pacing.md` publish the first measured curve.
- Self-teaching: after day 3 the wish ring returns at half strength, only in daylight and only after the player has gone 75 s without caring for anyone; any care puts it out, and it is steady under reduced motion.
- Onboarding: the first time night falls (naturally or by the light button) a one-time line points at the visitor button; stored as the optional whitelisted `hints.night` flag, so existing saves with history never see it.
- Retention: while the residents wave on a returning load, the camera glances at the busiest room for about 2.6 s and then returns; skipped under reduced motion, or if the player touched or pressed a key first.
- Arabic: the light-switch label "خلّي الليل يجي" stays on one line in the narrow time card at 320-412px wide (it wrapped at 360 before).
- Accessibility: Larger text now also scales the HUD card text (clue, wishes, buttons and cozy counters) and the story ribbon copy; card anchors, safe areas and 44px targets are untouched.
- Audio: a soft D-minor chord swells once (about 4 s, slow attack) when day turns to night while sound is on; never on load, while muted or paused.
- Retention: when a returning player opens the house, the residents wave one after another (reuses the greeting pose; skipped under reduced motion and on a first visit).
- Replayability: the visitor's gifts become a keepsake shelf with a small hand-drawn picture for each of the eight gifts, locked slots shown as soft stars, and tonight's gift highlighted (still under reduced motion).
- Self-teaching: in the first three days a soft gold ring breathes under any idle resident whose wish is still unspoken; it goes out when the wish is granted and is steady under reduced motion.
- Accessibility: a Larger text setting (saved, off by default, lazily whitelisted) scales the settings, household and journal panels.
- Writing: the loading card shows a Levantine saying, "الجار قبل الدار", with its English line.

## 0.2.0 - 2026-10-05
- Phone portrait: the clue folds into a compact chip with an unread dot and opens on tap; HUD cards keep an 8-12px gutter; the whole house, roof included, fits at 360-412px wide.
- Save safety: explicit save version with a tested migration path; unreadable or newer saves are kept under `bait-al-dumiah.v1.backup` instead of being overwritten; export and import a save file from Settings.
- Release readiness: web manifest and icons, Open Graph/Twitter preview, in-game privacy note and credits link, ASSET_REQUESTS.md.
- Performance: written budgets and `scripts/perf_check.py` (390x844, dpr 3, 4x CPU throttle) in the weekly full suite. Measured: ready 15.4 s, frame CPU median 27.1 ms (budget 33), 384k triangles, 334 calls, dist 1.38 MB. All met.
- Fixed (from #20): room lamps were matched by list index, but the list also holds window glass, so lamps got the fallback kitchen profile. Lamps are now tagged by room, with behavioural tests.
- Retention: welcome-back line; competitive study in docs/COMPETITIVE.md.
- CI: preview.yml on checkout/setup-node v7 (the rest arrived via #19); playwright 1.63 (#17); three 0.186 declined (#18: it drops the minified builds this game ships).

## 0.1.1 - 2026-10-05 (PR #16)
- Fixed: objective step counter wraps on narrow landscape phones.
- Tooling: play_check honours PORT; fast-gate CI, weekly full suite, failure-only trimmed artifacts.
- Docs: guidance set (AGENTS, CLAUDE, ARCHITECTURE, DESIGN, DESIGN_RULES, TODO, NEXT_ITERATION_PROMPT, CREDITS).
