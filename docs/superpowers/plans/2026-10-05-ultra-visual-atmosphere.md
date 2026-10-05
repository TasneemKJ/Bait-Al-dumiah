# Ultra Visual Atmosphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Bait Al-dumiah room-specific miniature-film lighting and richer day/night depth while preserving the cute-creepy domestic tone.
**Architecture:** Add a pure per-room practical-light policy and create four persistent Three.js point lights once in `world.js`; update intensity/color only during render.
**Tech Stack:** Three.js 0.180, native ES modules, node:test.
**Spec:** docs/superpowers/specs/2026-10-05-ultra-visual-atmosphere-design.md

## Global Constraints
- Preserve no-gore/no-jump-scare tone, low chrome, direct object play, WebGL recovery and quality policy.
- No simulation mutation from render, save change, remote asset, analytics, post-processing package or per-frame light creation.

## Review Focus
- Room profiles stay warm and distinct at night.
- Day intensity remains subtle.
- Low quality can suppress extra shadows without removing light identity.
- Invalid room/mix input falls back safely.
- Focus/work activities remain readable.

---

### Task 1: Room practical-light policy
**Files:** Modify `tests/atmosphere-policy-refinement.test.mjs`; Modify `src/render/visual-policy.js`.
**Interfaces:** Produces `roomLighting(roomId, mix)` with `color`, `intensity`, `distance`.
- [ ] Add failing tests for four distinct night profiles, subtle day values and invalid fallback.
- [ ] Run focused node:test; expect FAIL because `roomLighting` is absent.
- [ ] Implement the pure policy.
- [ ] Re-run focused test; expect PASS.
- [ ] Commit.

### Task 2: Persistent room practicals
**Files:** Modify `src/render/world.js`; Modify `README.md` or design record as appropriate.
**Interfaces:** Consumes `roomLighting`.
- [ ] Add source/behavior assertions that four persistent lights are created once and only values update per frame.
- [ ] Run focused test; expect FAIL.
- [ ] Create one point light per authored room and update its color/intensity/distance from policy; retain global house light behavior and quality budget.
- [ ] Run `npm test`, `npm run build`, `npm run test:browser`.
- [ ] Commit.
