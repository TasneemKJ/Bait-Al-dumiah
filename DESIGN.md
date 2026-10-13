# Design

Living summary; details in `README.md` and `docs/superpowers/specs/`.

## Loop

### Reliable visits and reversible decoration

The first calm stretch and first night deliver their existing one-time lines through the same queue as other house notices. A welcome camera gesture yields immediately to touch, keyboard or zoom on the miniature or its controls; it never resets the view after the player takes over.

Save warnings persist on the existing notice surface until a successful save, including after leaving a ritual or changing language. Ordinary notices keep their usual timing, then return to the unresolved warning; recovery preserves any unrelated message already showing. Open sheets mirror the warning. Successful visits keep their quiet interface. Import and reset replace the visible house only after the replacement saves successfully. When overlapping file reads finish out of order, the latest import or reset remains authoritative.

Decoration benefits are ongoing: placed keepsakes raise house coziness, ease comfort decay and help a resident feel content near a favorite item. Placing or packing an object does not directly change care-earned comfort. Packing still returns its full price, including for older saves; moving residents or furniture cannot turn a reversible purchase into free comfort or a comfort penalty.
Look into the four-room house, care for three dolls (tea, play, rest, reassure), fulfil daily wishes for buttons, decorate with six keepsakes, deepen closeness, perform three physical rituals (tea, sewing, moon chimes), follow three object stories, restore rooms, and greet the visitor after dark to collect six whispers and open the closed door. A four-minute day/night cycle drives atmosphere.

## Visual language
Soft porcelain and cream paper, rose, mint and gold accents, terracotta roof, warm interior light by day, cool moonlight with practical lamps at night. Serif display type for titles and story text, folded cream paper with a red-thread edge, restrained brass hairlines and a warm presentation plinth. Procedural meshes and canvas textures only.

## UI/UX principles
- One focal point: the house. A folded thread-paper clue and quiet material-led navigation edge support the miniature; expanded paper is optional.
- The top-left clue starts folded with one contextual action. Arrival names the actual object. A separate accessible fold control reveals the full clue; counters never wrap (`.wish-count` is nowrap).
- Bottom: named room tabs and a single quiet tools edge (discovery, House tools, sound, pause and home); thumb-reachable, at least 44px. Selection/carrying earns only the extra space it actually occupies.
- HUD cards keep one gutter (8-12px) between them; nothing touches edge to edge.
- Phone portrait frames the whole house, roof, stair and garden edge included (`src/render/house-framing.js`); rooms keep their close framing.
- Directional icons follow reading direction (the objective arrow mirrors in Arabic).
- Returning players get one short welcome line naming the most useful waiting thing (basket, journal reward, wishes), never a wall of text.
- Ritual overlays hide the HUD they do not need and keep Exit, sound and pause visible.
- Room cameras fit measured visible controls. Tall width-bound phones place room detail lower; shorter phones regain scale. Whole-house reset and work cameras stay independent.
- Night changes palette, not layout. Reduced motion keeps pieces still.
- Phone landscape collapses room tabs into an icon grid; verify at 844x390.
- Check every change at 360x640, 390x844, 412x915, 844x390 in English and Arabic before shipping.

## First-launch intro, 2026-10-10
A first launch opens with 12 s of the real house, not a video: the camera rises out of a cream paper veil low and far (approach), sweeps up across the rooms (reveal), then settles into the kitchen exactly where play begins. One short line per beat, in English and Arabic (RTL): "A little house, waiting with its lamps lit." / "Three little souls live behind these walls." / "Start in the kitchen. Lina has the kettle on." The HUD waits behind the intro and the simulation holds still; nothing is saved but the claim that the intro was seen.

Motion follows springs, not keyframes: beats one and two are one continuous path that eases out of rest and never stops between beats; the settle beat is the play camera's own critically damped spring, started from the path's live pose and velocity, so play begins inside that glide. One tap, any key or the 44px Skip control in the thumb zone (bottom right, bottom left in Arabic, safe-area aware) skips from the first frame: the camera glides to the kitchen from where it is, carrying its velocity. Dragging the scene instead catches the camera where it is and turns it under the finger. The layer, its vignette and the returning HUD cross-fade over about half a second; a room's lamp eases its focus brightness, so nothing jumps.

Reduced motion shows three still shots, each changed under a soft rise of the paper veil; the fades are driven per frame so they stay fades. Sound, when on, is a quiet synthesized room-tone bed and music box with one or two house sounds per beat and a soft D-major roll into play; Skip fades it over 200 ms. It starts only from the Play or Watch intro tap and plays at or below the lullaby's levels; reduced motion does not mute it. The intro plays once (`introSeen` in the save; older saves never see it) and Settings has Watch intro. Each beat has a slot for an optional narration clip; none ships yet.

## Material sound, 2026-10-05
The existing mint-tin touch uses a short, quiet synthesized metal resonance; returning or replaying Noor's earned bear uses a soft filtered cloth rustle. These are successful-object responses, not a new reward or story loop. They remain silent until the player's sound gesture and respect pause, mute and disposal. Enamel/cloth mesh refinements remain deferred until rendered baseline and after-images can be reviewed.

## Stable selection, 2026-10-05
Direct scene selection keeps the camera and prop where the player touched. Measured HUD changes are cached during selection or a pointer gesture; explicit navigation and resize still use safe-area framing. On portrait phones, the selection ribbon uses the clearer measured edge and stays there throughout a carry, leaving the active scene target reachable. Discovery controls retain their explicit room-focus behavior. See the stable-scene-selection spec for native acceptance.

Short landscape uses the same target-aware paper placement. Upper side controls reserve space only where they overlap the ribbon horizontally; the top-center gap can keep whole-house props reachable. The paper is checked again against the final fitted projection after resize. Desktop placement is unchanged.


## Safe Home entry, 2026-10-05
Cold launch now has its own inactive native-house composition: localized title, Play/Continue and Preferences. Flat Preferences has Sound, Language and Back. The canvas is inert, gameplay HUD hidden, canonical time stopped and game save untouched until one genuine entry activation. New profiles enter Lina's kitchen; returning profiles preserve their existing canonical state. Audio remains gesture-gated while saved intent, motion and quality remain respected. Home preferences use a separate validated record; they cannot override newer canonical settings.

This is the first bounded slice of the approved world-led design, not simplicity completion. Current main play, tools, care, catalog, journal, rituals, placement and settings remain dense and unchanged. Motion/quality keep their existing play settings route. Native screenshot/interaction acceptance is pending; ImageGen is a composition reference only, and all existing native house art stays intact.

## Wish glow
Days 1-3: a soft gold floor ring breathes under an idle resident whose wish is unspoken. It is wider and fainter than the selection halo, steady with reduced motion, and retires after day 3 or once the wish is granted.

Later days (4+): the wish ring is half as strong, daylight only, and appears only after 75 s without any care; granting a wish or caring for anyone puts it out. It stays a whisper, not a nag.

## Golden hour
Clock 96-126 (the last half minute before night): a warm peach band at the sky's horizon, an amber key light and warm window glow, peaking near clock 112 and handing over to the night look at 120. Zero for the rest of the day, so noon and night are unchanged.

## Bounded play and recovery corrections, 2026-10-08

Moving focus from the tea canvas to another control puts the pot down. Returning focus does not resume the interrupted pour; a fresh deliberate grab does. The physical pot, cup tolerance, rewards, art and existing bilingual work instructions remain the same.

In house play, one deliberate Space press toggles pause once; holding the key keeps that pause state. Browser/system shortcuts using Alt, Control or Command stay with the browser. Physical rituals retain their existing held-Space controls.

The brief returning-player camera glance yields to input on the house itself as well as the HUD. A touch or key action before the glance suppresses it; an action during the glance suppresses its automatic return. An untouched house retains the existing welcome.

During save recovery, the latest chosen file or confirmed reset owns the outcome. A slower earlier file cannot replace that choice or display a stale failure afterward. This request identity is transient and changes no save fields.

Import and reset commit their candidate through the existing protected save boundary before replacing the visible house. If storage refuses the write or another tab has changed the save, the current house, pause state and recovery controls remain available with the existing saving-failed message. Import success is announced only after that commit.

A held story item starts carrying only from the primary pointer. A second finger resting or moving elsewhere cannot begin an accidental handoff; rejecting it leaves the next deliberate primary drag available. The existing targets, wrong-drop recovery and keyboard alternative remain intact.

## Existing first-session notices, 2026-10-08 audit
The first-night pointer and the quiet day-one line reach the existing paced notice queue in both languages when their simulation events occur. While tea, sewing or moon chimes hide the house toast, notices stay queued until the player leaves the ritual; their order, eight-notice cap and 2.4-second display interval stay the same. Their one-time flags, timing, copy and rewards remain owned by the existing simulation. Checked against `DESIGN_RULES.md`; no design-rule violations found.

## First-night invitation delivery, 2026-10-08
The existing once-only first-night event reaches the localized notice queue, pointing to Greet the visitor without opening a sheet, acting on the visitor, or changing rewards.

## Quiet first day, 2026-10-08
After the already-authored first care and ninety-second day-one threshold, the existing calm sentence reaches the queued notice. This repairs presentation of the existing paced beat; time, needs, income and later days keep their current rules.

## Player-owned welcome camera, 2026-10-08
A scene pointer or keyboard action cancels the pending automatic welcome glance, just as HUD input does. The doll wave and welcome line remain, with no additional controls.

## Interrupted welcome, 2026-10-08
Both halves of the welcome camera sequence yield while hidden, paused, in a sheet or ritual, after fatal graphics failure, after motion preference changes, or after the current house is replaced. No delayed camera reset interrupts these states.

## Saving recovery feedback, 2026-10-08
After a failed write, the next successful owned write restores the existing saved note and retires the persistent warning without a separate saved toast (main's save-warning boundary). A later failure can warn again. Unknown or changed save identities still require Reload; recovery is never claimed without a successful write.

## Import ownership, 2026-10-08
The latest file selection or confirmed reset owns the current house. Older pending file reads are silently retired and cannot replace the newer choice or show stale import feedback. The token belongs to the page lifecycle, never to save v1.

## The size of memory — cinematic visit, 2026-10-12
The existing first-launch opening now holds each of its three real-house beats for four seconds (12 s total). Its once-only `introSeen` claim and old-save behavior remain authoritative. Settings also offers a 60-second live film: separate read-only house geometry and resident state, perspective object portraits, original bilingual captions and a quiet music-box score. The player pauses simulation and game audio, traps focus in a native dialog, offers immediate close, and returns focus to Settings. Reduced motion uses stable shot poses. Standalone H.264/AAC films are production exports outside the shipped distribution budget.

Live screening performance: the three porcelain residents hold their portrait poses; private opaque geometry is batched by vertex colour. The camera, light and steam remain animated at a deliberate 12-pose cadence. Mobile composition matches the displayed canvas; standalone movie typography is composed at 1080×1920. In short landscape, the same story line occupies the free side margin at readable text size.

The cinema adapts to costly software/mobile renderers: when a frame exceeds 180 ms, that visit holds a composed 3D pose for each shot while its one-minute story and score continue. Reduced motion selects the same held-pose presentation directly. This avoids continuous GPU work and keeps controls responsive; deterministic offline exports retain the moving camera. The YouTube edition uses a real 16:9 camera and its own lower third, not a crop or padded portrait.

The optional film's private tableau gives the kettle a centered burner and flat ceramic foot, seats flower vases on small glazed bases, and places residents' actual sole bounds on their room floors with soft contact shadows. Steam begins at the kettle lid. Gameplay furnishings and rigs keep their authored positions; selection/wish rings do not appear in the film.
The portrait film's final card places the game title and welcome line in the existing plum sky above the roof, while its final narrative line stays below the house. This separates the closing identity from the story caption without shrinking the miniature. Widescreen retains its dedicated lower third.

### Desktop navigation readability — 2026-10-13
The room strip and collapsed House tools should remain compact but readable over a furnished room closeup. On desktop viewports wider than 680px and taller than 560px, their labels use 12px type and an opaque miniature-paper backing (cream by day, plum at night), retaining the existing room underline and control targets. The phone edge treatment and film composition are unchanged. Native paired EN/AR day/night acceptance is required before marking this refinement complete.
