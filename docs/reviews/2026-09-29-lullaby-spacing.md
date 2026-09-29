# Quiet-night refinement

Base: 0fb06ce079c0f7c038d8938c6dda830453a63817. Its complete Shami/audio/courtyard
integration was preserved when the branch advanced during this continuation.
The earlier local stone-batching attempt was not force-pushed over it.

## Changes
The original 16-beat melody now has two silent 2.6-second beats each night phrase,
with no drone or pluck created on those beats. Daytime stays melodic with a longer
phrase-ending pause. Volume limits and the original pitches remain unchanged.

An enable-generation token prevents a delayed AudioContext resume from overriding
mute or disposal. Enabling sound from an open, paused settings sheet suspends the
context again until play resumes. No new context, timer or catch-up loop is added.
The completely transparent daytime door glow is no longer submitted for rendering.

## Tests and review
Six new Node regressions failed against the integrated base before implementation:
three score rules and three asynchronous audio-lifecycle cases. The audio API stub
covers only the deferred browser-resume boundary; real synthesis remains covered by
OfflineAudioContext checks. Two further construction checks failed for rest-beat
voice creation and unnecessary daytime glow. Two guards were green beforehand and
are not presented as new failing regressions.

Local cumulative verification: 48 Node tests and static build, 179 artwork/input/
audio checks and 12 UI/layout checks pass. Full-game and atmosphere CI plus final
screenshot review are required before this checkpoint is called fully verified.

Friendly dolls, embroidery, relocated courtyard fountain, Shami copy, simulation,
save format, economy, IDs, dependencies and existing performance gates are preserved.
No schedule, force push, merge or production promotion. Waveform tests do not claim
perceptual listening review, and Chromium does not certify physical phones or Safari.

## Rendered fixture correction
Run 36558925626 passed all 41 ordinary gameplay checks, 48 Node tests, 179 artwork
checks and 12 UI checks. Its additional atmosphere check timed out waiting for
nightMix: the fixture wrote a night save into the outgoing page, but main.js
correctly autosaved its live daytime state again on pagehide. No game save code
is changed. The fixture now seeds the incoming document with add_init_script
before the app reads storage, and explicitly asserts that the seeded night and
Arabic locale loaded. Initial state/visual diagnostics are retained.

The atmosphere step now runs before the longer ordinary gameplay suite, with
its own early screenshot artifact. All original assertions remain mandatory;
this changes diagnostic ordering rather than reducing verification. Runtime
files are unchanged from 3eaf895. The measured first-scene counters on that
commit were 386 calls / 381,595 triangles, within the existing strict budgets.
