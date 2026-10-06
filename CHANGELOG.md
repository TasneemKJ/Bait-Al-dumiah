# Changelog
Each merged batch adds an entry and a `vX.Y.Z` tag.

## Unreleased
- Accessibility: Larger text now also scales the HUD card text (clue, wishes, buttons and cozy counters) and the story ribbon copy; card anchors, safe areas and 44px targets are untouched.
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
