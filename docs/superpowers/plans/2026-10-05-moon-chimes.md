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
- [ ] Run Node, DOM, constructed-art and real-browser journeys; inspect evidence.
- [ ] Commit iteration and update existing PR without production deployment.

Locale data is extracted verbatim to locale-data.js; i18n.js remains the public
entry point and the home of all new copy. This preserves existing exports and
fallbacks without duplicating the old catalog.

Source, DOM and artwork-construction checks pass locally. HTTP/WebGL journeys and
original screenshot review remain pending on the published candidate; they are
not represented as completed by the checked implementation tasks.
