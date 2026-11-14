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
The room strip and collapsed House tools should remain compact but readable over a furnished room closeup. On desktop viewports wider than 680px and taller than 560px, their labels use 12px type and an opaque miniature-paper backing (cream by day, plum at night), retaining the existing room underline and control targets. The phone edge treatment and film composition are unchanged. Native paired EN/AR day/night and 681×600 boundary review accepted this refinement; full accessible room names remain available.
At 681–1000px desktop widths, use the existing localized short room labels so the strip stays one line beneath its icons; full room names remain in each button's accessible label and title. This retains 12px type and 44px targets instead of letting long labels create a three-line navigation block.

## iPhone app: The Fifth Room and the canary — owner override (2026-11-13)
The owner asked for Souq's earning model in the iPhone app. The web game is unchanged and stays fully open.

- **The Fifth Room** (`Tas.BaitAlDumiah.fifthRoom`, non-consumable, $4.99): the closed door between the four rooms, its five mendings, the fifth room behind it and the visitor's eight nightly gifts (with the *A room for everyone* and *all gifts* milestones). The mendings are still paid in earned buttons. The free app is a whole arc: three dolls, the rituals, all three stories (*Tea for someone shy* still ends at the doorstep with the guest), six whispers, decoration and restoration of every room.
- **The canary** (`Tas.BaitAlDumiah.canary.monthly` $1.99 / `.yearly` $14.99, one group "The Canary"): a canary in a brass cage hangs by the liwan window, sings a soft trill now and then by day and sleeps under a cloth at night. The game has no offline earning to extend, so the benefit is company only: it is never picked, saved or counted and touches no buttons, comfort, coziness or whispers. When the plan ends the canary simply leaves.
- **Asked at the moment of use, never saved** (`src/access.js`, `src/app-store.js`): the door section and the mend/gift commands ask the App Store each time. A door already begun in a save (a web copy opened in the app) stays the player's. The next-step clue never points at a door this copy has not opened; the door section shows what opens it and leads to the card, which is also reachable from Settings.
- **The card** (`src/store-ui.js`) says what each one opens before paying, prints the App Store's price inside `<bdi dir="ltr">`, and carries Restore, Manage subscription, Terms (Apple's standard EULA) and Privacy, in Levantine Arabic and English.

## First touch and the found secrets — owner council (2026-11-13)
- A first touch on a doll greets: she waves and a soft chime sounds, with nothing to read; touching her again opens her sheet (the same "once to select, again to act" rule as objects).
- A found whisper is announced with the count (`A whisper for the journal · 2/6`); the journal keeps the full sticker-book list.
- The closed door between the ground-floor rooms carries a brass keyhole plate: in the app it is the visible place The Fifth Room opens.
- Arabic calls the dolls warm little hearts (تلات قلوب صغار), never spirits (أرواح), in the intro and the film.

## Touch and sound — studio gate (2026-11-13)
Every press on a control gives a soft wooden tap (quieter than any reward) and one 8 ms buzz, which the app turns into the Taptic Engine (`src/app-touch.js`). An audio context left interrupted by a call or Siri resumes on the next touch, unless sound is off or the house is paused. The canary's trill stays inside the synth's range so it is a little melody.

## First reward in seconds — studio gate (2026-11-13)
Cold-play bot (before): the first reward came 93 s (ar) and 114 s (en) after Play, behind the whole first story chapter, because the clue always led with the story. Now a new house's first clue is the wish the intro has just named, Lina's tea: one tap on the clue, +8 buttons; after that first kindness the story leads as before.

## Settings and controls — studio bar (2026-11-13)
- Settings in the app gains Haptics (on by default, kept as `bait-al-dumiah.v1.haptics` beside the save), Support and Privacy (opened by the app), and a signature line: the game, version 1.0, Tas Games, and the three.js credit.
- Selects keep a 44 pt target and the house's paper with a thread chevron; the settings switches are a rose-thread pill with a cream bead (WebKit on iPhone drew selects 19 px tall and checkboxes as blank white squares). On touch, the close button a sheet focuses for VoiceOver is not ringed.

## Age rating — owner override (2026-11-13)
The night has gentle unease (knocks inside the wall, footprints that do not lead back, the shy visitor under a sheet); there is no gore, death or jump scare. Horror/Fear is answered Infrequent/Mild (9+), so the store text may honestly say "cute and creepy" and "ghost". Everything else is None. `ios/store/listing.json` → `age`.

## First minute polish — hand-play notes (2026-11-13)
- A first launch speaks the device's language (Arabic device → Arabic; any other → English); Preferences and a saved choice still win.
- Home: both names (the current language's large, the other beneath) and one line of promise; the canvas fills the page so the house's painted backdrop is the whole background (no seam bands).
- A selected room is the subject: the neighbouring rooms recede behind a soft paper veil (plum at night), so they peek rather than share the screen. The whole-house view is never veiled.

## Keepsake wishes and an honest ending — owner override (2026-11-13)
The simulated week showed nothing new after the sixth whisper and no use for buttons. Using only what the house has:
- **One keepsake wish a day.** Once the three stories are told, one doll a day (in turn) wishes for one keepsake in one room that still has a free corner ("Noor's wish today: Music box · The jasmine liwan"). The clue and the Decorate sheet name it. Placing it spends buttons as any keepsake does and pays in closeness and comfort, never buttons. One a day (`keepsakeWishDay` in the save, clamped like the other day fields).
- **Bounded by the house:** twelve corners. When every corner is furnished and every whisper heard, the clue says so: "This house's story is complete; come by any day for tea." Packing a keepsake frees a corner and wishes resume.
- Simulated week after (two 4-minute sessions a day): a wish in every session through real day 6, the completion line on day 7. Buttons still outpace their uses late (641 by day 7): accepted, nothing is sold for them.

## Readable sheets and a named bottom bar (2026-11-13)
Sheets on a phone floor every text run at 15 px (17 px with Large text); the audit at 375 px went from 234 smaller runs to 0 in both languages. The phone's bottom bar is five equal columns with a short name under each icon.

## A picture of your house — studio bar (2026-11-13)
Settings in the app offers **A picture of your house → Share**: the renderer draws the player's own whole house at night once, the page crops it 4:5 and adds both names, the day and the dolls' names on a plum band, and TasKit's existing share sheet takes the PNG (no account, no network; `NSPhotoLibraryAddUsageDescription` set for Save Image). Not offered on the web.

## 1.1: a first week with a destination, and a house that breathes (2026-11-13)
Free days 5–7 had nothing new and the reason to return was thin. Craft borrowed, nothing copied: Cozy Grove's
paced daily drip (but counted in our own visit days, not a real-time lock), Spiritfarer's unsaid memories (spoken
here by our canary), Unpacking's "the room tells the story" (strands of jasmine thread, a ribbon on the jasmine).
- **Visit days, not dawns** (`src/sim-arc.js`): a visit day is a new, later calendar date the house was opened (or
  left open past midnight). Hurried dawns never count; a clock set back counts nothing. Saved as `arc`
  (whitelisted, clamped; older saves start at 0, so every player gets the whole arc). The date is passed in; the
  simulation reads no clock.
- **Visit 5, the rain night:** at nightfall the palette cools toward slate (`rainLook`, `visual-policy.js`; lamps
  stay warm), beads of water run down the three window panes (one instanced mesh), rain falls past the house, a
  local noise loop patters on the shutters, and the three little hearts keep together in the liwan. They are only
  drawn there; each doll's room, wishes and favourite-room bonus are unchanged. The returning line foretells it.
- **Night by night:** strands of jasmine thread (brass thread, cream buds, the house's own primitives) appear in the
  liwan on visits 5, 6 and 7. Visit 6's returning line: someone hung them; Lina won't say why.
- **Visit 7, Noor's night:** at nightfall Lina and Sami tie a cream jasmine ribbon round the jasmine by the window;
  the journal gains a free *Keepsakes* card (gift-art style). Never one of the visitor's gifts (The Fifth Room).
- **Share moment:** the share card names *The rain night* / *Noor's night*; in the app the keepsake card carries
  *Share Noor's night* (the existing renderer picture, no network). Nothing opens by itself.
- **Idle life** (`src/idle-life.js`): after 25 quiet seconds one heart (in turn) sits 16 s in her favourite room
  (else the liwan) and a window's curtains lift and settle; 40 s rest between. Cosmetic only; ends for any sheet,
  ritual, placement, intro, film or pause; none under reduced motion. Canary subscribers, by day: the canary sings
  and a line gives that heart's unsaid memory (three each). Others see nothing, not a teaser.
- **Paywall check** (`tests/paywall-decline.test.mjs`): declining The Fifth Room and the canary (cancelled, failed,
  never answered, no products) closes to an unpaused house, care works, two days pass with no sheet reopening, and
  the locked door still shows what opens it. It passed without changes.
- **Release build:** one minified `game.js` + `game.css` (esbuild, pinned), no `src/` tree, no sourcemaps; the
  `?debug=1` seam (`src/debug-seam.js`) is replaced by an empty function in production. `npm run build:debug`
  keeps it for the python browser checks.


## Backlog from random stimulus (2026-11-14)
- **(Built in 1.2, see below.) The midnight visitor takes something.** Each night the little visitor takes one small thing (a button, a ribbon, the teaspoon) and hides it somewhere in the house. Tapping rooms and objects searches (this also gives scene taps a purpose: in a WebKit play test most scene taps did nothing). Found by the next night: the doll who owned it brightens. Missed: she is quiet for a day. Each loss gets a short dry elegy in fusha with gentle dark humour, e.g. «رحلت الملعقة الصغيرة في ظروف غامضة، ولم يحضر جنازتها أحد». Makes the "creepy" half visible, gives stakes and a reason to return daily. Comparables: Hidden Folks (tap-to-search), Toca Boca (touch exploration), Animal Crossing (mischief, never cruel).
- Also from the play test: the decor placement card stays open across other actions; offer a clear cancel/close.

## 1.2: The Midnight Visitor (الزائر عند منتصف الليل) (2026-11-14)
Players found the house easy and the creepy half nearly invisible; nothing could be lost and most taps on the 3D
house did nothing. Now the little visitor has a face the player acts against, every night.
- **One thing a night** (`src/sim-mischief.js`): at nightfall, after a lived day (the wish rule: the light control
  never takes or loses anything), the visitor borrows one of the dolls' things (Lina's teaspoon or tea strainer,
  Sami's thimble, blue button or spool, Noor's ribbon, hairpin or little bell) and hides it in one of twelve places
  (eleven nooks: behind the kettle, among the jars, in the oven, the hearth, the floor lamp, behind the portrait, the
  yarn basket, between the books, the thread rack, the curtain, the hatbox; and under Noor's quilt). Its owner's turn
  rotates; the same thing is never taken twice running; choices use the game's own integer scramble, never a
  random source.
- **The sign, in the world** (`src/render/mischief.js`): each thing lives at a keeping place (Lina's brass hook rail by
  the stove, Sami's wooden tray, brass pegs on Noor's headboard). Missing, its place holds the thing's ghost in the
  visitor's own pale porcelain, a lavender glow (never the gold of wishes and story clues), and small lavender
  footprints walking away; its owner stays home from idle visits, walks over and keeps glancing at the place.
  A short paper slip beside the place says what is missing and where to look, then fades. No sheet, list or button.
- **Searching is touching the house:** a touch on a room of the whole house opens it; in a room, each nook answers. A
  wrong one breathes out dust, or a cold breath and a high glassy note when the thing is in this room. The right one
  lifts the thing out, carries it home in an arc and its owner waves: +10 comfort and +4 closeness, never buttons.
- **Pacing:** the visitor's own night count, so an old save starts gently. Night 1 is taught: the teaspoon, behind the
  kettle, with a glint and "Touch the kitchen". Nights 2-3: the owner's room. 4-5: the owner's floor. Then anywhere.
- **Missed by the next nightfall** (at least 150 s of play later and a lived day): a dry, kind elegy on a plum slip
  by the doll ("The little spoon departed under mysterious circumstances. No one attended its funeral."), the ghost
  drifts up and fades, and the owner is quiet for a day: head bowed, care lands at three quarters and closeness at
  half. Never refused, never blocking, and the thing is back on its hook at dawn. No mischief that night.
- **Memory:** the journal's *Borrowed by the visitor* keeps the last twelve, safely home or with its elegy.
- **Save:** `mischief` (nights, what and where, deadline, quiet days, log), whitelisted and clamped in `restore()`;
  everything shown is drawn from it, so a reload mid-night shows the same house. Never sold, nothing to buy.
- **Comparables, learned not copied:** *Hidden Folks* answers every tap with a little sound or rustle and keeps the
  search inside the picture; ours does too, but hunts one thing with an owner and a deadline, and wrong touches
  say warmer or colder by room. *Toca Life* makes every object touchable with no failure; ours keeps that
  generosity (every nook answers) but adds a small, kind stake. *Animal Crossing*'s lost items return to a neighbour
  for friendship; ours is hidden on purpose by a creature you can see, on a clock, and its loss gets a funeral. The
  dry elegies, the thing's ghost and the footprints are this house's own.
- **Budgets:** the whole house at night with a thing missing (390x844) draws 374 calls (ceiling 388; 361 before)
  and 397k triangles (ceiling 400k; 387k before). Each thing, and all keeping places together, bake into one
  vertex-painted mesh; the footprints into one; none cast shadows.

## Backlog from random stimulus (2026-11-14, round 2)

## Stimulus #11 (2026-11-14 06:25): broken clock · radio static · a seed
**Comparables:** Unpacking (a story told by objects), Gris (wordless sadness), What Remains of Edith Finch (each room is one life).
- **Broken clock → «الساعة الواقفة».** Every room has a clock stopped at the moment its occupant left. Tea poured at exactly that minute moves the clock forward one minute, and a short memory appears on the wall. Each correct pour restores something in the house, which gives the tea a meaning beyond a recipe.
- **Radio static → «الإذاعة».** A radio in the sitting room picks up a single phrase each night between the static. Tuning it is a gentle drag gesture, and the phrase is a clue for the next night. For subscribers, a weekly broadcast with a new story. Dark humour: «نشرة الأحوال الجوية: غيوم فوق المقبرة، وصفاء في غرفة الجلوس».
- **Seed → a plant on the windowsill** that grows only when the dolls are cared for. It needs no extra screens.
**Best:** الساعة الواقفة (every pour moves the story forward). Second: الإذاعة (a recurring reason to subscribe).

## #12 (random-stimulus, creepiness) the dollhouse mirror
The hallway mirror shows one doll more than the room holds, standing where a doll stood last night. Pour well and it fades; a missed pour and it is a step closer in the next night's mirror. It never moves when watched. The ghost, amused: «ليست مني. أنا أطرق قبل الدخول».

## Backlog from random stimulus (2026-11-14, round 3)
## #19 (random-stimulus) «خيال الظل»
Some nights Noor's lamp throws the dolls' shadows on the bedroom wall. The ghost casts a shape (a bird, a cat, a camel); you drag a doll's arms to answer it with the same shadow before the lamp gutters. Get the sequence right and the shadows play a short scene of how the house came to be (the girl who owned it, the first tea, the night the ghost arrived), one scene per success, in warm silhouette on the plaster. A miss: the ghost's shadow laughs silently and the lamp goes out. Subscription (the canary): a new shadow story each month. Dry line: «الأشباح لا تملك ظلًّا. هذا ظلّ مستعار».
Comparables: Simon (memory), Limbo (silhouette mood), the Levantine shadow theatre (Karagöz / Haci Ivat tradition). Ours: the dolls' own hands make the story.

## #19b «رسائل صاحبة البيت»
Letters from the grown girl who once owned the dollhouse, now far away, asking after each doll by name. Your care that week is what the reply says.
- **The ghost's cobwebs (بيت العنكبوت), random stimulus #25:** rooms left untouched for a few days gather dust and fine cobwebs in their corners (drawn as pale silver threads that catch the lamplight). Wiping them (a sweep of the finger across the corner) pleases the dolls; Lina hums. But the ghost has been collecting them: each wiped web makes it sulk for a night (it hides, no visit, no gift), and each web left alone becomes a tiny lace curtain it hangs in the attic. A house too clean is a lonely ghost; too dusty and the dolls cough. Dry line from the ghost: «هذا ليس غبارًا. هذا ديكور».
- **The music box (صندوق الموسيقى), #25b:** wind it with a circular drag; while it plays the dolls dance and the visitor stays away. Overwind and the spring snaps; mend it with the needle.
- Comparables: Unpacking (care through objects), Animal Crossing (a house that reacts), Luigi's Mansion (a ghost with tastes). Ours: two kinds of tenants who want opposite houses.
