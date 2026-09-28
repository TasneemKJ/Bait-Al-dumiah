# First-playable verification — 28 September 2026

## Evidence
The complete initial integration (5668598) passed GitHub Actions run 36456473752: 21 Node tests, production build, and 23 Chromium play-flow checks. Artifacts retain 10 screenshots covering desktop day/night, doll care, catalogue, first whisper, Arabic settings, Arabic phone night, English phone day, phone care and landscape. Source downloaded from CI matches the authored local JavaScript and styles.

The browser check drives the built HTTP application, not a mocked renderer. The first scene rendered 118,976 triangles in 255 calls with 50 geometries and 12 textures. These are renderer counters, not a claim of frame rate on physical phones. Build size was approximately 0.82 MiB uncompressed with local Three.js and no runtime network services.

## Screenshot review and fixes
The author reviewed desktop day/night and phone English/Arabic screenshots. The four rooms and three dolls are visible; the house remains the visual focus. Two issues were reproduced with independent real-DOM tests: closing refreshed settings left a stale pause icon, and the night-toggle hover had 1.12:1 text contrast. Both tests were observed failing before fixes and passing afterward. The corrected hover contrast is 7.5:1. The camera hint also received its own backing so the house base does not erase its text. These regressions now run in CI before the full game play-check.

## Deliberate scope
This is a playable foundation, not a production-readiness certificate. Room reassignment is immediate; there is no stair pathfinding. Decoration uses fixed slots, not freeform physics. Assets are procedural rather than final sculpted models. Browser checks use Chromium and software WebGL; Safari, physical mobile GPU performance and perceptual audio quality need separate testing. Review was a self-review by the author, not an independent reviewer.

## Integration decision
The feature branch advanced concurrently with a CI-only commit. Its checkout credential hardening and source-workspace artifact were retained, with one server owner in the final browser workflow. No forced ref update or merge to main was performed.
