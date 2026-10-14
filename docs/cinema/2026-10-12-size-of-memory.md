# The size of memory — production brief

A tender, uncanny portrait of a miniature Levantine home, made from the actual procedural house and residents. No gore, jump scares, external media, narration or rewards. The user delegated the creative decisions and requested local completion without approval interruptions.

IDEAL / 5Ws: a new mobile player arrives at the threshold, feels invited rather than hurried, sees where care happens in this small house, and returns because its inhabitants feel remembered. Returning players choose the film from Settings; canonical progress never advances during a screening.

Twenty explored ideas: (1) porcelain macro; (2) roof-to-room crane; (3) tea steam; (4) gold sewing thread; (5) three resident portraits; (6) moon chime silhouette; (7) closed door hint; (8) lamplit welcome; (9) cream-paper captions; (10) Levantine Arabic story; (11) music-box motif; (12) porcelain contact foley; (13) wooden hinge resonance; (14) caption-only silent readability; (15) stable reduced-motion shots; (16) 44px immediate skip; (17) once-only save flag reuse; (18) focus restoration; (19) bounded landscape player; (20) deterministic local export.

Selected: all support a single 60-second film and the existing 12-second opening. Deferred: narration, new game mechanics, rewards and external asset services.

Palette: porcelain #fbf4e9, rose #b57d91, ink #342537, brass #c5a575, moon #8eacc7. Display: Georgia; Arabic: browser's local Arabic serif; utility: sans-serif. Signature: a small house appears monumental through low, close perspective lenses; the camera studies objects as memories. Typography rests in a dark plum lower margin without covering the focal object.

Shots: 0–8 threshold / whole miniature; 8–17 tea with Lina; 17–26 sewing with Sami; 26–35 Noor and moonlight; 35–44 hanging moon; 44–52 quiet closed doorway; 52–60 welcome home / whole house. Every line holds at least 6 seconds. Original score: sparse D/F/A music-box notes, low wood resonances, porcelain partials; no voice.

Implementation: retain the existing save-compatible first-launch intro and its gesture audio; lengthen three beats to 4 seconds each. Optional live film uses its own read-only scene/state, never a player's world. Runtime shipping excludes MP4 exports. Local Chromium production renders native 1080×1920 frames, H.264/AAC, 24fps. Same deterministic camera/captions in runtime and export. Validation: repository verify, EN/AR mobile matrix, throttle, opening lifecycle, film focus/keyboard/visibility/reduced-motion, still review, ffprobe and loudness inspection.

## YouTube extension
The owner added a publishing-quality widescreen deliverable. Same seven-shot story and source assets, genuinely recomposed with a 16:9 perspective camera, closer establishing/final cameras and a dedicated readable lower third. Native 1920×1080 world/output is measured before selecting production resolution; no portrait padding or crop. EN/AR 1280×720 covers and upload copy accompany the files, without publishing. The existing 20-idea exploration remains this iteration's basis; distribution budget, save ownership, localization and all approved portrait work remain intact.

## Grounding review, 2026-10-13
Actual full-size wide kitchen proof showed visually weak contact under the rounded kettle/vase and residents. This is one focused corrective pass, not multiple manufactured iterations. Selected private-tableau fixes: matching burner under kettle, ceramic bases under three vases, sole-bound floor placement, localized contact shadows, remove gameplay wish/selection rings, and attach steam to the kettle lid. Gameplay geometry is preserved. Regenerated renders and media checks were accepted on 2026-10-14; see final acceptance below.

### Wide export acceptance — 2026-10-14
Both completed 1920×1080 EN/AR H.264/AAC exports passed 60-second / 1,440-frame / 24fps stream checks and full decode. Actual encoded score: −15.67 LUFS integrated, −1.80 dBTP (both languages). Native decoded samples viewed at 3/15/22/30/38/45/57 seconds, including both final cards; both 1280×720 covers viewed. The accepted private-scene feet and prop contacts survive encoding, and captions remain legible. Scratch evidence: `/tmp/five-film-review/dumiah-decoded/1920x1080-verification.json`. Portrait production was still pending at this wide checkpoint; it subsequently completed as recorded below.


### Complete production acceptance — 2026-10-14
Portrait EN/AR exports also passed full decode, 60-second / 1,440-frame / 24fps checks and −15.67 LUFS / −1.80 dBTP measurement. Viewed native decoded en03, ar15, en22, ar30, en38, en45 and both final cards; the upper portrait title hierarchy and grounded props/feet remain clear. The four-file gate, four seven-cue sidecars, two covers, fast-start metadata, stereo 48kHz AAC and production dimensions pass; `film/exports/media-verification.json` and `SHA256SUMS.txt` identify the accepted files.

The first manifest gate rejected the valid full-range 8-bit 4:2:0 stream because FFprobe names it `yuvj420p` rather than `yuv420p`. The verifier now requires `pc` for `yuvj420p` and reports the actual pixel format, range and color space; the renderer makes those existing range/color-space tags explicit. The approved encoded pixels were preserved without retranscoding. Final source verification passed 546 tests, lint/build and the 428,976-byte gzip JS budget. Combined browser acceptance: 56 core checks, story drag/drop smoke, eight bilingual phone film layouts, lifecycle/error recovery, and 4× CPU held-pose fallback. Visibility testing covers synthetic document events, not a real headed tab switch; software throttle is not a physical-phone FPS claim.
