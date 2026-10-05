# Stable direct scene selection

Bounded correction to the current mobile-composition batch, 2026-10-05.

## Observed failure and contract
Native touch evidence at source f3ea87d175c44cec09b082e9bd12d172690883df shows the ordinary first tin touch opening a ribbon and moving the tin from y526.1 to y416.5. A second touch at the original position selects the tea set instead of opening the tin. Reprojecting the second touch conceals this usability defect.

Direct scene selection must preserve the visible camera pose and the selected prop's original screen position. A pending layout measurement must not start a camera flight while selection or a carried/canvas pointer owns the interaction. Explicit room/discovery navigation, home and resize retain measured safe-area framing. Rules, save identity, authored pick boxes and physical activity input remain unchanged.

## Alternatives and chosen approach
1. Freeze only selection's camera. Rejected alone: the existing 360px held ribbon covers y306–450, overlapping retained tea at about y347.
2. Refit around a fixed selected anchor. Rejected: scaling does not fix a DOM ribbon that covers that anchor, and moves other drop destinations.
3. Reserve the tallest possible ribbon before every room visit. Rejected: loses the recovered miniature space even when nothing is selected.
4. Keep direct scene selection stable and place its portrait ribbon at the edge with more measured clearance. Chosen. Cache current HUD measurements during selection/gesture ownership; explicit navigation/resize can consume them. A scene pick no longer implicitly requests room navigation. Accessible object-list selection still does.

The ribbon compares its real height and selected screen point with safe top controls and the existing lower navigation/held-item edge. The placement is held during carrying. Its top/bottom classification remains part of measured layout, so later explicit camera framing cannot mistake upper paper for a full-height footer. New writing is not needed; all current EN/AR copy and DOM actions remain.

## Twenty focused checks/ideas (IDEAL and 5Ws)
For phone and keyboard players, during selection/carrying, in the four rooms, the aim is predictable touch with the miniature still prominent. Identify the two-tap miss; define stable screen coordinates and reachable destinations; explore the four alternatives above; act on the bounded camera/ribbon seams; look back through independent actual input and images.

1. Preserve the direct scene target on selection (chosen).
2. Separate discovery navigation from direct scene selection (chosen).
3. Retain newest safe-area measurements without moving an active target (chosen).
4. Block pending camera changes during held-item gestures (chosen).
5. Block pending camera changes while a canvas pointer is down (chosen).
6. Put portrait paper on the clearer measured edge (chosen).
7. Hold paper placement throughout a drag (chosen).
8. Classify a top ribbon as a top occluder (chosen).
9. Preserve room/home navigation (invariant).
10. Preserve reduced-motion behavior (invariant).
11. Preserve bilingual ribbon copy and RTL controls (invariant).
12. Preserve keyboard focus through feedback updates (invariant).
13. Preserve the 44px controls and safe-area offsets (invariant).
14. Preserve real authored ray-pick volumes (invariant).
15. Preserve carried-item and save rules (invariant).
16. Preserve physical tea, sewing and chime ownership (invariant).
17. Verify ordinary unchanged-coordinate second touches at several cadences (chosen).
18. Verify both ribbon edges and crowded held+selected states at 360px (chosen).
19. Verify thread→sewing and water→jasmine destination visibility and held stability (chosen).
20. Keep full native journeys and original screenshots as release gates (chosen).

## Evidence
The extracted prior refit behavior failed real Three.js projection tests for selection and held-pointer layouts; after the guard, the original screen coordinates stay exactly equal. Ribbon-clearance and top-inset regressions accompany this. Existing full source verification and shared 500KiB JavaScript budget remain required.

Native acceptance must use unchanged coordinates between actual first/second touches at 80/250/650ms requested gaps, with EN/AR, reduced/normal motion and 4× CPU coverage. Capture 360px upper/lower ribbon states and prove actual canvas reachability. Run full story, tea, sewing and chime journeys on the exact corrected source; strengthened story checks observe every destination during the real held drag. Readiness may precede a gesture, but never re-aim its second touch or retry a failed action into a pass. Source-only evidence is not rendered acceptance.
