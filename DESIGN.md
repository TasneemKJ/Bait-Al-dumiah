# Design

Living summary; details in `README.md` and `docs/superpowers/specs/`.

## Loop
Look into the four-room house, care for three dolls (tea, play, rest, reassure), fulfil daily wishes for buttons, decorate with six keepsakes, deepen closeness, perform three physical rituals (tea, sewing, moon chimes), follow three object stories, restore rooms, and greet the visitor after dark to collect six whispers and open the closed door. A four-minute day/night cycle drives atmosphere.

## Visual language
Soft porcelain and cream paper, rose, mint and gold accents, terracotta roof, warm interior light by day, cool moonlight with practical lamps at night. Serif display type for titles and story text, rounded cream capsule panels with gold hairlines. Procedural meshes and canvas textures only.

## UI/UX principles
- One focal point: the house. Panels are translucent paper capsules that belong to the setting, never generic web-app cards.
- The objective card says one clue and one action; counters never wrap (`.wish-count` is nowrap).
- Phone portrait: the clue folds into a compact chip (star toggle plus action). The star opens the clue text; a rose dot marks a clue not yet read. Desktop and landscape keep the open card.
- HUD cards keep one gutter (8-12px) between them; nothing touches edge to edge.
- Phone portrait frames the whole house, roof, stair and garden edge included (`src/render/house-framing.js`); rooms keep their close framing.
- Directional icons follow reading direction (the objective arrow mirrors in Arabic).
- Returning players get one short welcome line naming the most useful waiting thing (basket, journal reward, wishes), never a wall of text.
- Bottom: room tabs above the dock (House tools, sound, pause); thumb-reachable, at least 44px.
- Ritual overlays hide the HUD they do not need and keep Exit, sound and pause visible.
- Night changes palette, not layout. Reduced motion keeps pieces still.
- Phone landscape collapses room tabs into an icon grid; verify at 844x390.
- Check every change at 360x640, 390x844, 412x915, 844x390 in English and Arabic before shipping.

## Wish glow
Days 1-3: a soft gold floor ring breathes under an idle resident whose wish is unspoken. It is wider and fainter than the selection halo, steady with reduced motion, and retires after day 3 or once the wish is granted.
