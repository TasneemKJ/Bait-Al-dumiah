# Living house expansion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Connect active activities to visible room restoration and persistent mastery.
**Architecture:** Simulation owns activity and renovation rules; DOM and Three.js adapt its state. Reuse existing content/assets.
**Tech Stack:** Native JS, Three.js 0.180.0, Node tests, existing Python browser checks.
**Spec:** docs/superpowers/specs/2026-10-04-living-house-expansion.md

## Global Constraints
Preserve save key/version, English/Arabic, local assets, cute-and-creepy identity, reduced motion, 44px controls and existing game behavior. No production deploy/merge.

## Review Focus
Repeated reloads must preserve reward caps; instant dawn must not refresh activities; malformed nested saves must remain safe; practice must not farm bonds; mobile/Arabic controls must fit.

### Task 1: Activity and restoration simulation
**Files:** src/content.js, src/simulation.js, tests/activities.test.mjs.
**Interfaces:** beginActivity(s,id), activityInput(s,choice), activityPattern(s,id), activityLevel(s,id), restorationReady(s,room), restoreRoom(s,room). Results use existing {ok,reason} contract.
- [ ] Write behavioral tests and observe missing-feature failures.
- [ ] Add activity content, whitelisted save fields, capped earned progression and room restoration.
- [ ] Run node --test tests/activities.test.mjs; npm run verify. Commit.

### Task 2: Activity UX and world restoration
**Files:** src/ui.js, src/main.js, src/i18n.js, src/activities.css, src/render/restoration.js, src/render/world.js, index.html.
**Interfaces:** consume Task 1 rules and state; dispatch begin-activity/activity-input/restore-room. Renderer consumes s.restoration only.
- [ ] Add tests for bilingual keys and restoration arrangement state.
- [ ] Implement compact entry, pattern interaction, result, restoration costs/locks and contextual objectives; reuse local models.
- [ ] Run npm run verify; construction checks; browser flow. Inspect available screenshots. Commit.

### Task 3: Verification and checkpoint
**Files:** scripts/expansion_check.py, docs/superpowers/iteration-ledger.md, README.md.
- [ ] Test complete activity, wrong input, save/reload, restore, Arabic/mobile and reduced motion.
- [ ] Run repository gates, review diff, resolve meaningful defects, retain concrete evidence.
- [ ] Push feature branch and open PR, keep ongoing iteration ledger; configure recurring improvement task.
