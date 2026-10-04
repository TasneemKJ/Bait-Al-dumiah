# Iteration 5 implementation plan

Spec: ../specs/2026-10-04-physical-tea.md. The twenty-idea brainstorm precedes all implementation.

1. Simulation owner writes failing physical-flow, economy, guest-step and save tests; implements the shared tea contract in simulation.js/content.js; adapts old sequence tests without losing behavioral coverage.
2. Art owner builds the authored pot/cups/tray renderer, isolates original tea-set meshes before batching, and adds construction/pose/budget checks. No simulation or integration edits.
3. Input/UI owner builds pointer/keyboard ownership, compact bilingual work strip and CSS, and removes tea answer-grid presentation. Adds meaningful gesture/copy tests. No world/main edits.
4. Root integrates the renderer, fixed camera policy, projection/picking, main dispatch, pause/cleanup and shared UI visibility. Adds camera bounds coverage and read-only tea diagnostics.
5. Browser owner updates legacy tea routes and guest story completion and builds a dedicated physical tea journey with real inputs, failure evidence and unchanged reward/restoration assertions. Native browser is unavailable; do not relaunch it.
6. Root adds the dedicated CI job, runs source/build/art construction checks, reviews each patch and fixes integration issues. Publish a coherent checkpoint after local verification.
7. Independently review the whole playable change, then inspect actual CI screenshots and full game/tea/story regression results. Fix concrete failures and commit verification checkpoints.
8. Record exact accepted commits, limitations and evidence in the iteration ledger and PR. Begin a new set of twenty ideas for the next physical activity/visual improvement. No production merge/deploy.

Shared-file ownership: simulation/content/activity+story rules tests → gameplay_audit; tea-table/house/art-tea tests → visual_audit; tea-ui/tea-input/tea.css/i18n/activities-ui/input-copy tests → tea_input; browser scripts only → browser_baseline; world/camera/main/story-ui/ui/stylesheets/workflows/docs → root. Coordinate before crossing ownership. Agents do not commit; root commits each coherent iteration/checkpoint.
