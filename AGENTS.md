# Agent guide

Read README.md and the design in docs/superpowers/specs/ before changing the game.
- Keep the cute-and-creepy Levantine miniature-home identity; no gore or jump scares.
- Simulation state belongs in src/simulation.js, never in meshes or UI callbacks.
- New visible copy must exist in English and Arabic in src/i18n.js.
- Preserve the public save key and version unless a tested migration accompanies the change.
- Keep all runtime dependencies and artwork local; do not add analytics or remote assets.
- Respect the low-chrome playfield, 44px control targets, reduced motion and audio gesture boundaries.
- Write behavioral tests, run npm run verify and npm run test:browser, inspect screenshots, and state any unverified behavior honestly.
- Do not merge or deploy to production without a user request.
