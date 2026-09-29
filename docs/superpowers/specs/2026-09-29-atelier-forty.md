# Forty further doll refinements

The user interrupted a merge request with a new request for a massive doll improvement and forty iterations. Do not merge this batch. Continue in the existing feature branch and keep the cute residents / unsettling house distinction. The reference is the actual b99bf28 models, not a generated concept image.

## Intent and choices
Fix the remaining wide lower faces, oversized head-to-body relationship, lumpy fringe, identical apron-dominated bodies and stiff care poses. Keep Lina (pink/plaits), Noor (mint/bun), Sami (purple/glasses/dungarees) recognizable. Prefer cohesive, sculpted, hand-painted toy forms to added beads or realistic anatomy. No white eye sockets, sharp jaws, horror faces or excess menus. Do not count test totals as an aesthetic verdict.

## Boundaries
Rendering and character presentation only. Save format, simulation, economy, IDs, authored audio and dependencies are unchanged. Local artwork and existing Three.js 0.180.0 only. Existing <388 first-scene draw-call / <400k triangle gates stay mandatory. Portraits and game use the same rig. Pause, reduced motion, keyboard, mobile and Arabic remain supported.

## Execution
Forty distinct source/test passes, each with a failing regression observed before implementation and a passing cumulative art/unit/build/UI gate. Keep a local commit and diff for each; publish four grouped checkpoints to PR #1. Retain actual model and gameplay screenshots at 10/20/30/40, inspect them, and correct detected defects before calling a checkpoint verified. No claim of 40 full-device playtests. Baseline local source tree was verified equal to GitHub tree 1145a15d91e73321ae8b07989870d80cddebf662. Local browser exposes no WebGL2, so normal GitHub Actions supplies rendered evidence; do not change browser policy.

## Review risks
Eyes/smile/nose must lie on the new face at three-quarter views; hair must not erase eyes or spectacle rims; clothes must not swallow hands in care poses; feet must stay on the floor; all character-specific resources must reuse memory across portrait rebuilds. Obsolete aesthetic tests must be explicitly replaced when a rejected shape changes, never silently disabled.
