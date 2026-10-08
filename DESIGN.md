# Design

Living summary; details in `README.md` and `docs/superpowers/specs/`.

## Loop
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
