# Craft direction: a cared-for house with an unsettled memory

## Intent
Ultra-fine artwork, not an accumulation of decorations. Keep the approved friendly
resident anatomy, Levantine/Shami setting and quiet environmental dread. The user
requested autonomous refinement; this is a bounded material/artwork pass on the
existing renderer, not a new gameplay system. No scheduler or production merge.

## Visual philosophy
**Read in three distances.** At whole-house scale, rooms, faces and warm practical
lights lead. At room scale, joinery, silhouettes, cloth folds and the tea ritual
become clear. Close up, thread crossings, directional wood grain, glaze and tool
marks repay attention. Microdetail must average away cleanly on a phone.

**Ornament follows construction.** Put stitches on hems, cuffs and chest panels;
leave the pocket and central linen quiet. Grain follows the timber surface rather
than a uniform noise field. Ceramics have a smoother glaze than cloth; brass uses
small variations of polish rather than glitter or a mirror finish. These are
art-direction rules, not claims of physically exact artisan manufacture.

**Contrast is a budget.** Retain restrained palette identities: Lina's rose,
Noor's sage, Sami's indigo. Ornament supports them. Avoid equal contrast on every
surface, grime over faces, sharpened eyes, or tiny symbols that resemble text.
Large forms and friendly facial expressions are not changed in this pass.

**Evidence of care, not random damage.** Fine weave, needle crossings, waxed wood,
softened glaze and light hammer traces imply that somebody made and maintained
these objects. Keep the unsettling details in the house's existing impossible
shadows, empty doorway and long musical rests.

## Cultural limits
The embroidery compositions remain original game designs. Palestinian embroidery
has meaningful regional and social associations; do not label a invented motif
as a named village tradition or make generic clothing a historical reconstruction.
Reference: UNESCO, nomination 01722, https://ich.unesco.org/en/RL/the-art-of-embroidery-in-palestine-practices-skills-knowledge-and-rituals-01722 .

## Implementation sequence
1. Add regression tests for material-specific microrelief, roughness, cached
   linear packed finish maps, and increased embroidery sampling without moving
   its canonical composition.
2. Author a reusable surface finish atlas for timber, cloth, brass and ceramics;
   preserve existing material/mesh identities and draw-call budgets.
3. Render embroidery color, relief and roughness from the same stitch layout.
   Raised thread crosses over thread; linen and thread react differently to light.
4. Inspect actual models and room views, both diffuse daylight and warm night,
   plus phone portraits. Run the unchanged game suite and update the same PR.

## Resource contract
No new dependency, remote runtime asset or per-frame texture generation. Shared
finish maps are at most 512 square; embroidery is 512 by 768, cached per resident.
Color is sRGB; height and roughness are linear data. Each packed finish uses red
for height and green for roughness. Existing <388-call/<400k-triangle gate remains.
Technical reference: https://threejs.org/docs/pages/MeshStandardMaterial.html .

## Evidence discipline
Construction tests do not establish aesthetic quality. Compare actual rendered
models/room captures at the same camera and light; record issues and corrections.
Do not count these changes as forty iterations or claim a physical-device audit.

## Implementation record
The new finish library is reused by props, woven clothing and ceramic glaze; the
embroidery color, height and roughness maps share one canonical layout. Painted
vessels have restrained rim/foot bands and original jasmine-like brushwork. No
extra objects or triangles are added. Existing cross-stitch coverage is tested
at the same canonical 256x384 sample size after downsampling the 512x768 atlas.

Before implementation, 17 of the 18 new material/embroidery checks failed; one
material-family guard was already green. The separate painted-glaze requirement
was also observed failing before its implementation. Current local cumulative
checks: 198 construction/input/audio checks and 48 unit tests/build pass.
The first implementation exposed expensive texture serialization in the primitive
material cache key; keys now use texture UUIDs before serialization. No texture
pixel arrays are serialized while creating props.

Local HTTP screenshot navigation is blocked by the browser administrator policy;
no browser policy was modified. CI's new craft study captures the same garment
and tea components before/after under identical camera/light. These are labeled
component studies, not normal gameplay. Full-game and night/phone gates stay
mandatory, and rendered aesthetic review remains pending until captures arrive.
