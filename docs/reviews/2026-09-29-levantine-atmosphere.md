# Levantine household and restrained dread

## User direction
Continue refining without scheduled jobs or repeated approval requests. Keep the dolls approachable, introduce Levantine character, and add some dread through the house and sound. Commit tested batches regularly through the GitHub plugin.

## Scope and constraints
Use shared Shami Arabic, not a claim to one city's dialect. English remains available; existing locale IDs, resident IDs, economy and save version stay intact. Original embroidery is inspired by regional craft, not a replica of a particular village costume. No gore, jump scares, religious caricature, new dependencies or external runtime assets.

## Batches
1. Shami interface, resident wishes and six unresolved household mysteries.
2. Original cross-stitch clothing panels, linen/indigo/rosewood palette and brass details without changing friendly anatomy or increasing mesh submissions.
3. Deterministic slow night cues: warm lamps against cool dusk, window silhouettes and a closed door's light; still under pause and reduced motion.
4. Gesture-gated plucked lullaby, room tone and soft distant wood taps; no catch-up burst after pause. Verify ordinary gameplay, Arabic portrait/landscape, sounds and screenshots.

## Current evidence
Batch 1: three new copy regressions failed on the recovered source, then passed. All 39 Node tests, build, 152 artwork/input checks and 12 DOM/layout checks passed locally. The old exact MSA close-up assertion was changed to verify the selected locale's current text; the assertion was not removed. The full-game Arabic header expectation follows the new household label.

## Publishing
Baseline PR head: e7d3eb49b63ab655c2ce98c5370078aa700be02e. Local workspace was recovered from its source snapshot on an isolated feature branch. GitHub plugin reads initially worked, but both create_tree and get_repo then returned ConnectorClientError 404 "Link not found". This describes the earlier interruption, not the resumed publishing status below. Tested local batches were retained while the connection was unavailable; never replace the branch with an older tree.

## Cultural reference
UNESCO, "The art of embroidery in Palestine, practices, skills, knowledge and rituals", nomination 01722: https://ich.unesco.org/en/RL/the-art-of-embroidery-in-palestine-practices-skills-knowledge-and-rituals-01722
The garment panels here are original game designs, not historical reconstruction. No cultural source asset is copied into the game.


## 10:14 continuation: recovered and published work
The saved Shami patch was recovered against the exact e7d3eb4 source tree.
Local reruns passed 39 unit tests, 152 artwork checks and 12 layout checks.
GitHub writes recovered: d904978 publishes the deterministic night-score tests;
8e97ec7 publishes the courtyard, fountain, embroidery and their construction tests.
The Shami and audio integration is the next publishing checkpoint.

The first actual scene run 36556040678 failed the unchanged <388 draw-call gate
at 389 calls / 381,597 triangles. Its screenshot also showed the fountain behind
the centered room toolbar. The correction combines opaque masonry colors into
one vertex-colored draw batch and moves the basin left, outside the toolbar.
No geometry or rendering-budget assertion is removed. The new tighter local
construction-call check was already green before that correction; it is not
claimed as a new failing regression. The fountain-position check did fail first.

The art fixture's relative dynamic import could not resolve from a Blob URL;
it was corrected to the fixture's existing project/ import-map convention.
Local HTTP gameplay previews return ERR_BLOCKED_BY_ADMINISTRATOR. Browser policy
was not modified; actual HTTP screenshots come from repository CI.

Original cross-stitch panels are craft-inspired designs, not reconstructed
village dress. Courtyard references: The Metropolitan Museum of Art,
The Damascus Room, https://www.metmuseum.org/essays/the-damascus-room .
The fountain, inward-facing details and contrasting masonry inform this fictional
miniature. The retained pitched roof is not a claim of reconstructing that room.

The new audio uses original synthesized plucks, a low sustained tone and distant
wood taps. It is not a sampled or faithfully reproduced oud. Audio is off until
an explicit gesture, voices are released on mute/pause, and resumed scheduling
never plays a missed-note backlog. Offline audio checks validate finite output,
attack/decay, peak amplitude and scheduling; they do not certify perceived sound.

No scheduler, merge, new dependency, runtime network asset or save migration.
Full source-bound final CI and image review remain required before completion.

## Integrated local verification
The pending Shami patch is now combined with the courtyard review corrections
and the original audio score. All 42 Node tests/build, 175 artwork/input/audio
checks and 12 UI checks pass locally. A new mandatory CI check exercises the
shipped Shami scene, reduced motion, sound toggle and an actual offline WAV
render. Its HTTP result and new screenshots remain pending until CI completes.
The workflow has a bounded 20-minute deadline for the additional suite; none
of the earlier full-game or budget assertions was removed.
