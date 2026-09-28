# Doll-focused refinement design

## Intent
The user requests forty more iterations focused on the dolls in Bait-Al-dumiah. Continue the established implementation/test-pass workflow and update existing PR #1. This batch is D01–D40 (following the previous forty house-wide passes).

## Art direction
Collectible, hand-painted porcelain-and-cloth residents: a softly tapered jaw, shallow almond eyes, warm painted cheeks, sculpted rather than beaded hair, sewn clothing and articulated hands. Lina remains a rose tea hostess with plaits, Noor a mint sleepy dreamer with a bun, Sami a lilac tinkerer with glasses and dungarees. No gore, cracking skin, jump scares or aggressive horror. The creepy note is restrained nighttime curiosity.

## Boundaries
Pure simulation, save key/version, economy, room IDs, authored audio and runtime dependencies stay unchanged. New geometry, textures, rig state and camera state belong exclusively to presentation modules. All portrait controls translate to English and Arabic and meet 44px targets. Main remains untouched; update the existing feature branch without force pushes.

## Verification contract
Every numbered pass has a concrete source change, a regression observed failing before the change and passing afterward, and a local commit. Run the cumulative artwork tests and unit/build suite each pass. Keep an auditable ledger and export this batch’s local Git history and RED/GREEN logs. Review actual model portraits and built-game captures at four ten-pass checkpoints; do not call these forty device playtests. Preserve all existing behavior/budget assertions. Final whole-house budget remains below 400,000 triangles and 388 draw calls.

## Technical design
Split face, hair/wardrobe and acting helpers out of the growing doll factory as each part is changed. Construct shared geometry/material caches once, but never share mutable per-resident expression state. Keep eyes, forearms, legs and hair pivots independently transformable. Make the portrait renderer reuse actual model geometry, use bounded offscreen targets, and dispose temporary GPU targets. Portrait camera and UI changes must reset correctly after resize, room movement, new-house, and reduced-motion toggles.

## Review risks
Painted eyes must remain on the face and not clip at a three-quarter view. Hand and cup poses must not intersect the chin. Separate slow presentation transitions from paused time. Batching must not absorb animated descendants. No extra renderer or retained target per UI rebuild. Local browser has no WebGL2; render evidence is from the existing GitHub Actions Chromium/software-WebGL environment. Self-review is not an independent audit or a physical-phone frame-rate measurement.
