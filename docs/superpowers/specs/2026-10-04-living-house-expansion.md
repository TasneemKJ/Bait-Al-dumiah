# Living house expansion

The user requests substantial visual, gameplay, loop and retention improvements, autonomous execution until stopped, and 20 ideas before each iteration. Target experience: a satisfying 9/10; no measured rating or retention claim without players. Preserve the cute-and-creepy Levantine home, bilingual copy, local dependencies, save key/version, reduced motion and accessible controls.

## Iteration 1: twenty ideas
1. Active tea sequence; 2. Sewing pattern puzzle; 3. Lullaby sequence; 4. Room restoration tiers; 5. Visible restoration rewards; 6. A house-wide chapter track; 7. Mastery records; 8. First-success celebrations; 9. A rotating featured activity; 10. Transparent activity earnings; 11. Gentle mistake recovery; 12. No timer pressure; 13. Direct scene activity access; 14. Contextual next objective; 15. Playfield-first activity controls; 16. Room completion recap; 17. Resident favourite activity; 18. Persistent progress on reload; 19. Accessible keyboard patterns; 20. Restored night illumination.

Selected: three activities, restoration across all four rooms, mastery, contextual next step and visible upgrades. These form one loop: play a short activity → earn buttons and grow a bond → restore a room → see the house change → try a harder sequence. Alternatives: enlarge the shop (more spending but same passive verbs); add visitors (narrative breadth but same click loop). Active play addresses the core deficiency first.

## Rules
Tea, stitch and lullaby each have a deterministic 3–5 input sequence, resident/room and four icon choices. Patterns remain visible; mistakes reset the attempt without charging or removing anything. Progress is serializable and simulation-owned. Rewards are paid only on actual sequence completion, no client-submitted score. First two rewarded completions per activity require 20 seconds of unpaused play between them; day refresh requires the existing 60-second day gate. Practice remains available after the reward cap and earns no buttons/bond/mastery. Mastery is earned only from rewarded completions, at thresholds 2/5/9; level changes sequence length and one-time bonus. This bounds currency and bond farming.

Each room restores at 45/85/140 buttons. Tier 1 needs one earned mastery point in its themed activity (parlor uses tea); tier 2 needs three; tier 3 needs six. Restoration does not replace decor slots and cannot be refunded. All costs/requirements are visible. Existing version-1 saves gain safe defaults and nested counters are clamped/whitelisted. Old care, wishes, visitor mystery and refunds keep working.

## Presentation
Reuse existing authored local Three.js furniture, textiles, lamps and plants for restoration arrangements. Each tier reveals a distinct room vignette and warmer lighting. A compact activities entry and contextual objective lead into a short modal activity with large icon inputs, pattern preview, progress and result. New copy is English and Shami Arabic. Pause/reduced motion remain respected; activities advance only on deliberate input, not timers.

## Verification
Behavioral tests: invalid input, complete sequences, mistakes, cap/cooldown, pause, instant-dawn exploit, restore costs/prerequisites, old/tampered saves and practice farming. Node suite/build, repository browser flow, actual 3D construction and screenshots. Cloud browser has no WebGL2 and local URLs are blocked; use repository software-WebGL checks/CI for render evidence, report limitations honestly. Work on feature branch; do not merge or deploy production.
