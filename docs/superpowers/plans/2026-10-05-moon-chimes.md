# Moon Chimes Implementation Plan

**Goal:** Replace the last sequence-button ritual with a directly manipulated
bedroom instrument and visible earned progress.
**Architecture:** Commands and phases in simulation.js; renderer consumes read-only
status; a separate input adapter maps real pointer/keyboard gestures to commands.
**Tech stack:** Existing JavaScript/Three.js 0.180.0, local assets, Node tests and Playwright.
**Spec:** docs/superpowers/specs/2026-10-05-moon-chimes.md

## Constraints and review focus
Save key/version and economic caps unchanged. No new dependencies or remote assets.
Bilingual copy in i18n.js, 44px targets, low-chrome playfield, reduced motion, audio
permission. Check repeated release, lost capture, simultaneous inputs, fresh-page
unmute boundaries and viewport changes while holding.

- [x] Write red behavioral tests for listen phase and pluck-only completion.
- [x] Implement validated chime state/commands and reuse the economic boundary.
- [x] Test mistakes, free replay, terminal idempotence, save and pause invariants.
- [x] Build authored chime mesh, persistent mastery constellation and framing.
- [x] Add pointer/keyboard controller, localized work strip and audio cues.
- [x] Integrate work ownership, object entry, active/exit paths and read-only diagnostics.
- [x] Replace obsolete grid assertions with physical-input coverage.
- [x] Run Node, DOM, constructed-art and dedicated real-browser chime journeys; inspect evidence.
- [ ] Complete corrected cross-ritual and whole-branch regression acceptance.
- [x] Commit iteration and update existing PR without production deployment.

Locale data is extracted verbatim to locale-data.js; i18n.js remains the public
entry point and the home of all new copy. This preserves existing exports and
fallbacks without duplicating the old catalog.

Feature e5160c8 passed both real HTTP/WebGL chime jobs in workflow 37239781505.
Original desktop/phone opening, held, completed and returned-bedroom screenshots
were inspected, including Arabic small/landscape views. A wider phone journey
still expected the removed lullaby dialog; the follow-up corrects that test and
adds an unfinished-Escape regression. Corrected local checks pass 233 source
tests/build, 37 global DOM, 17 controller DOM and 308 constructed-art checks.
Exact-head cross-ritual results and the separate sewing correction remain open;
see docs/reviews/2026-10-05-moon-chimes-checkpoint.md.
