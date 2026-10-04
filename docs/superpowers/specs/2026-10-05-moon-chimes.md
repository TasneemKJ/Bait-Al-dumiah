# Iteration 7 — A moon instrument, not another answer sheet

## Twenty candidate ideas
1. Pull-and-release suspended moon chimes.
2. A physical listening demonstration on the same instrument.
3. Silent-mode light cues for every played note.
4. A wind-up moon that repeats the melody for free.
5. A completed melody that visibly lights the entire mobile.
6. Increasing phrase lengths through existing mastery.
7. Local repair after a wrong note rather than lost currency.
8. A keyboard pluck that uses the same physical state transitions.
9. A front-facing bedroom close-up sized for short phones.
10. Distinct charm silhouettes rather than color-only choices.
11. Embroidered ribbon strings and a carved wooden arch.
12. Warm practical light on the sleeping corner.
13. Restrained spring motion with still reduced-motion poses.
14. A persistent earned constellation over the bed.
15. Drag residents between rooms without opening household menus.
16. Drag owned keepsakes directly between floor positions.
17. Physically wipe a steamed window to reveal a story.
18. A real watering stream for the jasmine planter.
19. A visitor who reacts visibly to a prepared tea service.
20. Tactile workbench ornaments reflecting completed crafts.

Selected scope: 1–14 as one coherent third physical ritual. Ideas 15–20 remain
unimplemented candidates, not promised features. This removes the last answer
grid rather than adding a fourth menu system. The user delegates design choices.

## Play contract
Tap the moon bed twice, or use its accessible equivalent, to enter. Four authored
charms hang in the room. The house demonstrates a short melody using light and,
only after sound permission, distinct plucked notes. Echo it backwards by pulling
a charm down and releasing. A tap is not a pluck. Releasing outside, cancellation,
blur, pause, resize and hidden-tab transitions cannot play a note. The center moon
repeats the demonstration freely. A wrong note starts a gentle demonstration,
not a penalty. Completing a phrase lights the mobile and applies the existing
bounded activity reward; it cannot be paid twice. The moon starts another phrase
only after an explicit new action. Escape/one exit control returns to the house.

Simulation alone owns listen/echo/finished phases, held charm, pull, input
validation and completion. Graphics never award progress. The existing level,
reward cap, cooldown, save key and version remain. No mandatory sound, precision
timer, streak pressure, remote assets, new dependencies or analytics.

Every charm is identifiable by silhouette, position and localized name. Arrow
keys select a charm; hold/release Space plucks it through the same rules; R repeats
the phrase. Equivalent inputs preserve focus and cancel safely. The work strip
is instruction/status, not an answer panel. English and Shami Arabic copy lives
in i18n.js. No live announcement on every animation frame.

## Acceptance
Unit tests must prove physical boundaries, pause/cancel safety, repeat/mistake
behavior, terminal reward idempotence, progress/reload rules and no economy
mutation from listening. Real browser input must demonstrate a mouse and phone
pluck, wrong-note recovery, keyboard play, completion, mobile/Arabic layout and
zero JS errors. Inspect initial, held and completed screenshots. Preserve the
existing geometry budget and still reduced-motion state. Browser checks blocked
by the local environment are not counted as passes; CI provides HTTP/WebGL proof.
