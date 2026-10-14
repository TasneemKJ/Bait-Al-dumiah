# Reference games study — 2026-10-14

Purpose: move Bait Al-dumiah (بيت الدمية) toward three reference games in atmosphere, visuals, gameplay and
game loop while keeping its own identity: a cute-and-creepy Levantine miniature house, three porcelain dolls,
wishes, buttons, keepsakes, physical rituals and a shy visitor after dark. We study mechanisms only. No
names, assets, text, code or distinctive content from these games are used.

Source note: these notes come from general knowledge of the games and their widely reported reception. They
were not checked against live sources in this session, so treat details as approximate.

Constraints that shape every adaptation (DESIGN_RULES.md): no death, gore, jump scares or offline decay;
rewards paid only on an explicit action; practice free; no farming loops; one-time hints over text walls;
low chrome; touch first with 44px targets; English and Levantine Arabic everywhere; reduced motion and
optional sound; safe saves under `bait-al-dumiah.v1`; phone draw-call and triangle budgets.

## 1. Cozy Grove

**Atmosphere.** A spooky-cozy island where ghosts are sad, not scary. Melancholy is the backdrop and help is
the cure: the world begins grey and colour literally returns, ring by ring, as the player helps. Night is
soft, lantern-lit and safe.

**Visuals.** Hand-drawn, paper-cutout look. The key visual mechanism is *desaturation as debt*: grey
regions and a growing coloured radius around a central bonfire make progress visible from any screen.
Light sources (the bonfire, lamps) are the visual anchors of warmth.

**Gameplay.** Each day a small set of ghosts give short errands (find, craft, deliver, decorate). Errands are
concrete, completable in minutes, and all lead back to the same feeding loop: "spirit logs" go into the
bonfire, the bonfire grows, the coloured radius widens and new areas open. Heart-like friendship levels with
each ghost rise with gifts and errands.

**Loop.** The daily cap is the design: a few errands a day, finished in 20–40 minutes, then "come back
tomorrow". The story drips; tomorrow's content is teased. Players praise the ritual feel; the cap's
slowness is the main complaint, so the cap must feel like a gentle close, not a wall.

**Mechanisms to adapt:** a short daily errand list; collect-to-feed currency; a central light that grows in
discrete levels; colour and light returning to the world as levels rise; visible heart levels; a daily close
with a tomorrow teaser.

## 2. Spiritfarer

**Atmosphere.** Death made gentle through care. The ship is a home; each passenger is a person with
moods, tastes and a past. Warmth comes from intimacy (hugs, meals, conversations) and the ache of
an arc that ends.

**Visuals.** Hand-drawn, highly expressive animation: characters squash, lean, bounce and emote. Small
motions (a hug that lifts the feet, a happy hop) carry most of the emotion. Paper-and-ink warmth in the UI.

**Gameplay.** Daily hugs (one per character per day) raise mood. Cooking: every passenger has favourite,
liked and disliked dishes, discovered by serving them; a favourite gives a big mood lift and a reaction.
Each passenger's requests form a personal arc that unlocks over time and ends in a farewell scene.

**Loop.** Relationship arcs are the long-term motivation; daily hugs and meals are the short-term care.
Moods are readable at a glance. The farewell is the payoff: meaningful because the player invested.

**Mechanisms to adapt (gently, without death or departure):** a once-a-day hug with expressive acting;
comfort food with discoverable tastes and a notebook; personal request arcs gated by closeness ending in a
ceremony (here: a ribbon and a letter, the doll stays, gilded like mended porcelain); readable mood words;
expressive idle motion; hand-inked paper touches; a goodnight round.

## 3. Animal Crossing: New Horizons

**Atmosphere.** Real time and real seasons: the island follows the device clock and calendar, so autumn
leaves, snow and blossoms arrive with the player's own year. Weather changes daily. Small surprises (a
letter, a sparkle on the ground, a visitor) make every short session different.

**Visuals.** Toy-like, rounded, saturated but soft. Seasonal palettes retint the whole world. Furniture has
tactile placement: a pop, a settle, a little dust.

**Gameplay.** Decorating is self-expression: furniture placement, rotation, wallpaper and flooring.
Villagers have personalities, daily chatter and spontaneous requests. Collections (the museum) give a
completionist spine with an elegant catalogue. A rotating shop offers daily specials. Birthdays and seasonal
events punctuate the calendar.

**Loop.** "Check in daily": new letter, new chatter, new find, rotating shop, seasonal event. Long-term:
collection completion, home rating, villager friendships.

**Mechanisms to adapt:** device-calendar seasons and events; daily weather; a daily hidden find feeding a
curio cabinet; per-room wall colours; tactile placement juice; a room charm rating; personality chatter
and small spontaneous requests; a morning letter; resident birthdays; a daily special in the catalogue.

## Gap analysis: Bait Al-dumiah today

Inspected 2026-10-14 at 390x844 in English and Arabic (day, night, household sheet) on the built game.

| Dimension | Strong today | Gap against the references |
|---|---|---|
| Atmosphere | Beautiful porcelain house, day/night cycle, dusk swell, moths, kettle steam, shy visitor | No sense of the player's real year (seasons, weather, events); night has no growing "hearth" of warmth; nothing changes day to day apart from wishes |
| Visuals | High-craft dolls and rooms, restoration lights, wish glow | Progress is not visible at a glance (Cozy Grove's colour return); dolls do not show mood through idle motion; placement has no tactile pop; walls cannot be personalised |
| Gameplay | Care, wishes, rituals, story chapters, door, gifts, decoration | No daily errand list; no hugs or meals; no personal arcs beyond memories; residents never ask for anything spontaneous; no collection besides gifts; decorating has no rating or self-expression beyond six items |
| Loop | Daily wishes, streak, basket, welcome-back line | No short daily ritual with a clear end and a tomorrow teaser; no daily surprises (letter, find, special); no seasonal or birthday punctuation |

Identity to keep: the cute-and-creepy Levantine miniature house, porcelain, cream paper, rose and gold,
gentle dread, Shami Arabic, the shy visitor. Adaptations use local material: a brass fanous (lantern) instead
of a bonfire, Levantine dishes (ka'ak, ma'amoul, mujaddara, knafeh), the olive harvest and almond blossom,
jasmine nights, winter lamps, a curio cabinet of thimbles and blue beads.

## Ranked plan: 40 iterations

Each is one shippable, player-visible improvement with a behaviour test. Ref: CG Cozy Grove, SF
Spiritfarer, AC Animal Crossing: New Horizons. Dimension: A atmosphere, V visuals, G gameplay, L loop.

| # | Iteration | Ref | Dim |
|---|---|---|---|
| 1 | **Today sheet with three daily errands** drawn from real house actions, refreshed only after a day actually spent | CG | L |
| 2 | **Collect a finished errand for lantern embers** (explicit collect, never automatic) | CG | G |
| 3 | **Tend the courtyard lantern**: spend embers, five warmth levels | CG | G |
| 4 | **The lantern in the courtyard grows**: brass fanous mesh whose flame and glow follow its level; touching it opens Today | CG | V |
| 5 | **Colour returns to the house** as the lantern grows (soft saturation lift on the scene) | CG | V |
| 6 | **Light motes return at night**, more of them with each lantern level | CG | A |
| 7 | **Tending juice**: flare, rising sparks and a warm two-note whoosh; still under reduced motion | CG | V |
| 8 | **Day-one errands teach the house** (tea for Lina, water a plant, collect the basket) | CG | L |
| 9 | **Errand news dot and objective hand-off**: a ready errand marks House Tools and the clue points to it | CG | L |
| 10 | **"That's today" close** with tomorrow's first errand as a teaser | CG | L |
| 11 | **Lantern wonders list**: what each level brought, shown as a little ledger | CG | L |
| 12 | **Heart levels** shown as hearts on resident tabs and the closeness row | CG | V |
| 13 | **Daily hug**, once per resident per day, free, small closeness and comfort | SF | G |
| 14 | **Hug acting**: the doll squeezes and lifts, hearts rise; still under reduced motion | SF | V |
| 15 | **Hug sound**: a soft cloth pat and a two-note hum | SF | A |
| 16 | **Comfort food**: cook one Levantine dish a day in the kitchen for the whole house | SF | G |
| 17 | **Taste notebook**: each resident's discovered loves and dislikes | SF | L |
| 18 | **Dish aroma**: warm steam and motes over the kitchen table after cooking | SF | A |
| 19 | **Personal arcs**: three small requests per resident, unlocked by closeness | SF | G |
| 20 | **Ribbon ceremony**: finishing an arc ties a ribbon and leaves a letter in the journal | SF | L |
| 21 | **Kintsugi glow**: a doll whose arc is complete wears a fine gold seam light | SF | V |
| 22 | **Mood words** on resident cards (cheerful, sleepy, peckish, wistful) | SF | G |
| 23 | **Expressive idle**: content dolls sway, tired dolls droop | SF | V |
| 24 | **Goodnight round**: tuck each doll in after dark; the house hushes when all three are tucked | SF | A |
| 25 | **Hand-inked flourishes** on paper sheets and section headings | SF | V |
| 26 | **Real seasons** from the device calendar: drifting leaves, snow, petals or jasmine in the courtyard | AC | A |
| 27 | **Seasonal sky tint** on the backdrop | AC | V |
| 28 | **Seasonal events**: olive harvest, winter lamps, almond blossom, jasmine nights, each with an event errand | AC | L |
| 29 | **Daily weather**: soft rain days, seeded by the day | AC | A |
| 30 | **Rain sound bed** on rain days, gesture-gated | AC | A |
| 31 | **A hidden trinket each day**: one prop glints; inspect it to find a small thing | AC | G |
| 32 | **Curio cabinet**: the trinket collection with art and a count | AC | L |
| 33 | **Resident chatter**: a personality line of the day when you open a resident | AC | G |
| 34 | **Spontaneous requests**: a resident asks to spend the day in a room; moving them is thanked | AC | G |
| 35 | **Wall colours per room**: four paints each, free and reversible | AC | V |
| 36 | **Placement pop**: squash, settle and a dust puff when a keepsake lands | AC | V |
| 37 | **Room charm stars** in the decorate sheet | AC | L |
| 38 | **Morning letter** under the door on each fresh day | AC | L |
| 39 | **Resident birthdays** by the calendar: bunting and a birthday errand | AC | L |
| 40 | **Today's special**: one keepsake a day at a kinder price | AC | L |

Balance across dimensions: atmosphere 9, visuals 11, gameplay 10, loop 10 (some carry two).

Guard checks for the whole plan: every reward is paid on an explicit action (collect, tend, hug, cook,
find); nothing decays offline; nothing is lost by skipping a day; errands, specials, trinkets and letters
refresh only after a day actually spent in the house, like wishes, so the light control cannot farm them;
calendar features read the device date only in the UI layer and pass it in as data; new state lives under
one lazily created `grove` record that `restore()` whitelists and clamps; all copy is in English and Arabic.
