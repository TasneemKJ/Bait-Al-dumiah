# The size of memory / بيت على قدّ الذكرى

A 60-second cinematic visit to **Bait Al-Dumiah / بيت الدمية**. Actual local Three.js house and residents; original procedural music-box score and porcelain/wood resonances; no voice recording, external artwork, service credentials or remote runtime assets.

`exports/bait-al-dumiah-en-1080x1920.mp4` and `exports/bait-al-dumiah-ar-1080x1920.mp4` are reviewable production outputs. They are intentionally outside `public/` and `dist/`: the game offers the same film as a live read-only screening and retains its distribution budget.

## Reproduce

Requirements: Node 22.12+, `npm ci`, Python with Playwright, Pillow and NumPy, Chromium, FFmpeg. No changed dependency lockfile is needed for production tools.

```sh
npm run verify
PORT=4214 node scripts/serve.mjs
# In another terminal, at this repository root:
FILM_WORLD_WIDTH=720 PORT=4214 CHROMIUM_PATH=/usr/bin/chromium python scripts/film/render.py
```

The renderer takes one real 3D frame per timestamp, then composes English and Arabic separately with browser-native shaping and native 1080×1920 captions. Encoders use one thread each, H.264 CRF23 / yuv420p / 24fps (each 12fps captured frame held twice, a miniature stop-motion cadence) and AAC 160kbps, normalized toward -16 LUFS and -1.8dB true peak. It shares `/tmp/browser.lock` in 24-frame batches. `FILM_WORLD_WIDTH` can explicitly lower the world-render buffer (default 1080); output captions remain full resolution. `exports/production.json` records the chosen source dimensions. Standard/physical source materials become broad-lit Phong materials for the screening, preserving the authored geometry, paint and fabric maps. The game itself retains its original rendering.

Sources: `src/render/film-scene.js` (shots, scene and canvas composition), `src/i18n.js` (all visible bilingual copy), `src/film-sound.js` (gesture-only screening score), `scripts/film/score.py` (offline score), and `scripts/film/render.py` (production).

The film is read-only: it constructs a fresh simulation snapshot solely for posing the resident meshes, never steps or saves it. Settings → Watch the film pauses the real house and its audio. Closing restores Settings focus. Hiding the page pauses; deliberate Play resumes. Reduced motion keeps camera and actors still within each shot. The first-launch opening remains separate, lasts 12 seconds, is immediately skippable and uses the existing `introSeen` save flag.

Browser evidence: `python scripts/film/check.py` (server already running); screenshots and results go to `/tmp/dumiah-cinema-check`. General game checks remain `npm run test:browser`.

Selected reviewed production uses a 720×1280 world buffer with native 1080×1920 type and composition, 12 captured poses per second held twice in the 24fps stream. This keeps the handcrafted doll movement deliberate and avoids optical-flow interpolation. Full native-world rendering remains reproducible through `FILM_WORLD_WIDTH=1080`.

## YouTube widescreen pack

The landscape film uses its own 16:9 perspective camera and lower third, never a crop or padded portrait. Native-world resolution is measured in `wide-production.json`; final output is 1920×1080. Reproduce after reviewing the full-size prototypes:

```sh
# Server remains PORT=4214 node scripts/serve.mjs
FILM_LAYOUT=wide FILM_WORLD_WIDTH=1280 FILM_BATCH=48 PORT=4214 CHROMIUM_PATH=/usr/bin/chromium python scripts/film/render.py
node scripts/film/captions.mjs
```

Widescreen movies: `exports/bait-al-dumiah-en-1920x1080.mp4` and `exports/bait-al-dumiah-ar-1920x1080.mp4`. All four movies have matching `.srt` UTF-8 sidecars, generated from the actual shot boundaries (0, 8, 17, 26, 35, 44, 52, 60 seconds). Subtitles accompany already burned-in text, so enable them only when useful; avoid duplicate on-screen captions. The 12fps captured poses are held twice in each 24fps file.

Thumbnails: `exports/bait-al-dumiah-en-thumbnail-1280x720.jpg` and Arabic counterpart. Upload copy, suggested titles/tags and credits are in `youtube-upload-copy.md`. `exports/SHA256SUMS.txt` identifies final publishing files. These are local publishing materials; no YouTube upload has occurred.

## Live playback on slower devices
The live screening measures its own draw cost. A frame taking more than 180 ms switches that visit to one still 3D pose per shot; reduced-motion visits use this immediately. Captions, original audio and the 60-second wall clock continue between poses, and rendering resumes only at a shot boundary. Pause stops the clock and voices; close retires the renderer and audio context. Offline films never use this adaptive policy and retain the authored 12-pose camera cadence.

Selected YouTube production: 1280×720 world, native 1920×1080 text/composition. Full-native prototype took 1.67–2.62 seconds per bilingual frame on the shared software renderer; 1280-world prototype took 0.97–1.33 seconds and retained the miniature's fabric and hair detail. The selected camera/type samples were inspected full size. Wide production uses 48-frame lock batches to prioritize YouTube while portrait production yields every 24 frames. `FILM_WORLD_WIDTH=1920` remains available for full-native world reproduction.

After both render passes complete, run `python scripts/film/verify-exports.py`. It verifies all four 60-second H.264/AAC files, 24fps/1,440-frame streams, stereo 48 kHz audio, fast-start placement, seven-cue UTF-8 sidecars, both cover dimensions and production metadata, then writes `exports/media-verification.json` and `exports/SHA256SUMS.txt`.

Production now encodes into ignored `.rendering.mp4` files and promotes both language outputs only after FFprobe confirms each full 60-second, 1,440-frame stream. Interrupted exports cannot replace publishing filenames. The private screening tableau grounds the rendered feet (including compacted rigs), adds small ceramic prop bases and contact shadows, and emits kettle steam from its lid. `wide-preview.py` also executes the native three-resident grounding regression and writes measured before/after floor elevations into its benchmark report.
