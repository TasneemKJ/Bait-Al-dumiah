# Ultra Visual & Atmosphere Overhaul — Design

Date: 2026-10-05

## Intent

Make Bait Al-dumiah feel like a high-end miniature film set: warm Levantine domestic detail, porcelain/material richness and subtle cute-creepy life after dark. Preserve the caring tone, low-chrome house view, direct object play and the explicit no-gore/no-jump-scare rule.

## Success criteria

- Every room has a distinct practical-light identity while still belonging to one house.
- Porcelain, wood, brass, textile, glass and enamel respond differently under day/night light.
- The cutaway house gains stronger depth and contact shadows without becoming murky.
- Moonlight, dust and moth/firefly cues make night feel alive rather than empty.
- Dolls remain readable and endearing; atmosphere never turns them into horror figures.
- No new menu-heavy workflow, remote asset, analytics, save-format change or runtime dependency.
- WebGL2 fallback/recovery and quality policy remain intact.

## Direction

### 1. Miniature cinematography

Extend `src/render/atmosphere.js` and the existing lighting policy. Strengthen day/night sky separation, moon halo direction, depth fog and practical-light falloff while keeping ACES/tone mapping stable.

### 2. Room-specific practical light

Use existing house lights and owned keepsake lights. Different rooms receive restrained temperature/shape identity:
- tea kitchen: warm amber/enamel reflections;
- rose parlor: softer rose/walnut bounce;
- sewing room: focused task light and textile relief;
- moon bedroom: cooler moon edge plus warm bedside pools.

No gameplay state is derived from lighting.

### 3. Material response

Improve contact and highlights on porcelain faces/hands, metal trim, glazed tea pieces, carved wood and textiles. Reuse existing geometry/material owners; do not attach UI badges to objects.

### 4. Living night

Expand deterministic dust/moth paths and courtyard night cues with bounded counts. Add rare curtain/textile breathing or plant movement only where existing render owners already animate decorative materials. Reduced motion makes the scene still but retains lighting state.

### 5. Depth and composition

Tune fog/contact shadows so the cutaway reads as layered rooms rather than one flat dollhouse plane. Foreground frame and room focus keep objects/dolls clear on mobile.

## Architecture

Three.js remains the renderer. Changes stay in `src/render/` and existing visual policy; simulation state remains in `src/simulation.js`. No mesh callback mutates simulation. Prefer updating existing light/material instances over creating new objects per frame.

## Failure and performance handling

- Respect quality budget, pixel ratio and shadow toggles.
- Bound particles and light counts.
- Avoid additional post-processing packages/passes.
- WebGL context loss and recovery behavior stay unchanged.
- Low quality lowers atmospheric density/shadow cost first.

## Verification

Add focused tests for visual-policy/atmosphere state and object counts where appropriate. Run:
1. `npm test`
2. `npm run build`
3. `npm run test:browser`
4. screenshot review of whole-house day/night plus each focused room and at least one work activity.

## Non-goals

No jump scares, gore, survival punishment, new economy loop, menu-first redesign, remote textures, save-key change or replacement of the existing dolls/house.
