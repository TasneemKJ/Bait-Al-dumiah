# TODO

## Done this iteration
- [x] play_check honours `PORT`; CI fast gate, failure-only trimmed artifacts, weekly full suite.
- [x] Objective step counter no longer wraps on narrow landscape cards (test: `tests/mobile-hud.test.mjs`).
- [x] Mobile home-screen check: no overflow, no sub-44px targets at 360x640, 390x844, 412x915, 844x390 (English).

## Open
- [ ] Arabic/RTL mobile screenshots and panels (household, journal, settings, night) reviewed.
- [ ] Portrait 390 camera crops the roof edges; consider a slightly wider framing.
- [ ] Explicit save schema version with tested migrations; export/import of the save.
- [ ] Open Graph/Twitter metadata and preview image from the real dollhouse; web manifest and icons.
- [ ] CREDITS.md (written), link from game settings and README.
- [ ] Performance budgets measured under 4x CPU throttle in the weekly suite.
- [ ] Move to current majors of GitHub Actions after checking latest release tags; Dependabot for npm, pip and actions.
- [ ] Tag `vX.Y.Z` after each merge.

## Brainstorm (iteration 2026-10-05, 20 ideas)
Chosen: nowrap counter (UI/UX, mobile), docs set (stability for later sessions). Others, not yet built: first-night greeting hint (onboarding), soft lullaby swell at dusk (audio), return-day greeting from dolls (retention), collection page for visitor gifts (replayability), save export (data safety), wider portrait framing (visuals), lower-poly fallback on weak phones (performance), larger text option (accessibility), gamepad rail for room tabs (controls), Levantine proverb on loading (writing), dust motes in sunbeams (atmosphere), tea steam particles (game feel), jasmine scent journal entry (authenticity), share card (release), error-boundary retry button (stability), nightly gift choice (loop), daily wish hint glow (self-teaching), pause-on-hidden toast (session), button-economy dashboard (balance), seed-varied dolls' wishes (replayability).
