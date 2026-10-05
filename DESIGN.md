# Design

Living summary; details in `README.md` and `docs/superpowers/specs/`.

## Loop
Look into the four-room house, care for three dolls (tea, play, rest, reassure), fulfil daily wishes for buttons, decorate with six keepsakes, deepen closeness, perform three physical rituals (tea, sewing, moon chimes), follow three object stories, restore rooms, and greet the visitor after dark to collect six whispers and open the closed door. A four-minute day/night cycle drives atmosphere.

## Visual language
Soft porcelain and cream paper, rose, mint and gold accents, terracotta roof, warm interior light by day, cool moonlight with practical lamps at night. Serif display type for titles and story text, rounded cream capsule panels with gold hairlines. Procedural meshes and canvas textures only.

## UI/UX principles
- One focal point: the house. Panels are translucent paper capsules that belong to the setting, never generic web-app cards.
- The top-left objective card says one clue and one action; counters never wrap (`.wish-count` is nowrap).
- Bottom: room tabs above the dock (House tools, sound, pause); thumb-reachable, at least 44px.
- Ritual overlays hide the HUD they do not need and keep Exit, sound and pause visible.
- Night changes palette, not layout. Reduced motion keeps pieces still.
- Phone landscape collapses room tabs into an icon grid; verify at 844x390.
- Check every change at 360x640, 390x844, 412x915, 844x390 in English and Arabic before shipping.
