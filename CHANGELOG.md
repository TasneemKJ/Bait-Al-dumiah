# Changelog
Each merged batch adds an entry and a `vX.Y.Z` tag.

## 0.2.0 - 2026-10-05
- Phone portrait: the clue folds into a compact chip with an unread dot and opens on tap; HUD cards keep an 8-12px gutter; the whole house, roof included, fits at 360-412px wide.
- Save safety: explicit save version with a tested migration path; unreadable or newer saves are kept under `bait-al-dumiah.v1.backup` instead of being overwritten; export and import a save file from Settings.
- Release readiness: web manifest and icons, Open Graph/Twitter preview, in-game privacy note and credits link, ASSET_REQUESTS.md.
- Performance: written budgets and `scripts/perf_check.py` (4x CPU throttle) in the weekly full suite.
- CI: actions moved to current majors (checkout, setup-node, setup-python, upload-artifact v7).

## 0.1.1 - 2026-10-05 (PR #16)
- Fixed: objective step counter wraps on narrow landscape phones.
- Tooling: play_check honours PORT; fast-gate CI, weekly full suite, failure-only trimmed artifacts.
- Docs: guidance set (AGENTS, CLAUDE, ARCHITECTURE, DESIGN, DESIGN_RULES, TODO, NEXT_ITERATION_PROMPT, CREDITS).
