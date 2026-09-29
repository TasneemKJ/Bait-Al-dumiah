# Friendly doll correction — user feedback supersedes the face detail direction

The user described the published dolls as “creepy aliens.” Review of the actual D53 trio agrees that the face design misses the intended friendly handmade residents. Passing construction tests did not establish aesthetic quality.

## Root causes observed in the D53 capture and source
The jaw narrows to a wedge (lower-cheek width about 59% of maximum width). Large white eye sockets, encircling rims and high-contrast radial irises create a fixed stare. An elongated teardrop nose and small realistic lips compound the mismatched proportions. Thin forearms and fingers overemphasize joint segmentation. Repeated night-curiosity updates also feed the additive glance back into the next frame's head rotation.

## Corrective direction
Keep Lina, Noor and Sami, their outfits and hairstyles, all care actions and the original simulation. Replace the rejected facial design with broad round lower cheeks, small shallow painted eyes without sclera or socket outlines, low button noses, quiet curved smiles, warm satin skin, and fuller hands. Shorten the helmet-like hair dome. Make the base head yaw independent of the additive night glance. The environment, not facial anatomy, carries the creepy tone.

## Verification
Six new regression assertions were observed failing against the published source, then passing with the correction. A seventh keeps all care poses finite in both motion modes. Prior D01/D03/D05/D07/D08 art assertions that enforced the rejected taper, sockets, rims, lips and long bridge are explicitly replaced with the new proportional checks; they are not retained as a reason to keep the rejected design. Gameplay, input, save, camera, geometry-budget and interface assertions remain unchanged.

Before/after model captures resolve **all** source modules from the exact D53 baseline, not a baseline doll factory linked to new face modules. Idle studio comparisons use reduced-motion poses so a blink does not disguise the difference. These are labeled model inspections, separate from the normal game screenshots.

Local construction tests are not visual verification. The managed local browser blocks navigation and has no WebGL2; no browser security settings were changed. The existing GitHub Actions capture and gameplay suites are the rendered verification route. This is one corrective art-direction pass, not a new claimed forty-iteration batch. D54–D65 from the interrupted prior session were not recovered or silently published.
