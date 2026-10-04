# Iteration 4 — The house remembers your hands

## Intent and evidence

The user requests a substantial improvement to visuals, retention, game loop and gameplay, direct object selection, twenty ideas before every iteration, and a commit after each iteration, without interventions. Continue the existing draft PR #10. Target a richer, self-teaching Levantine miniature home; a subjective 9/10 or measured retention improvement requires players and is not claimed.

The baseline at c4d14e0 passes 107 source tests and the static build. The main objective calls care immediately; permanent objects mostly launch action sheets. Reactive keepsakes are isolated toys. Phone room framing crops a 4.76-unit room to approximately 3.43 units, making edge objects difficult to find. The previous passing software-WebGL artifact has identical runtime source and provides baseline captures.

## Twenty ideas considered before implementation

1. Open a mint tin to find a lost red thread.
2. Carry one real story item between rooms.
3. Mend an unfinished bear at Sami's machine.
4. Tuck the repaired bear beside Noor and leave it there permanently.
5. Lift a sofa cushion and recover a brass music-cabinet key.
6. Open a miniature cabinet with a visible articulated lid.
7. Repair the cabinet's damaged music cylinder at the sewing bench.
8. Return the melody and make its tiny dancer move.
9. Fill an ewer at the kitchen sink.
10. Water the jasmine window and gather a sprig.
11. Brew a cup for the unseen guest from the gathered sprig.
12. Leave the cup at the doorstep and reveal a welcoming light and shy footprints.
13. Show selected-object actions in a small playfield ribbon instead of a modal.
14. Replace the wire selection box with a warm, softly animated object marker.
15. Place keyboard/touch object targets over actual scene positions.
16. Make the main objective a clue with a room-focus action, never automatic completion.
17. Preserve carried items and story consequences through reloads.
18. Add a rhythmic tea-pouring skill challenge.
19. Add physical drag-and-drop item combinations with a tap equivalent.
20. Reframe phone rooms and add architectural contact shadows and light shafts.

Selected: 1–17 as one connected story and interaction iteration, plus idea 19 and the room-framing portion of 20 following the user's explicit rejection of menu-led play. Rhythmic tea pouring and additional contact-lighting work follow through a fresh brainstorm after reviewing this result. Alternatives considered: more shop items would retain the passive economy loop; a physics sandbox would add much broader state/input complexity. Three authored, freely playable object chains establish purposeful exploration now.

## Story contract

Three sequential chapters have 3, 4, and 4 deliberate actions. No purchase, night switch, care, mastery, cooldown or real-world waiting blocks them. A single held item changes at each valid step. Wrong objects and repeated actions do not consume it or grant rewards. Existing care, rituals and decoration remain available.

| Chapter | Object chain | Held items after each action | Completion |
| --- | --- | --- | --- |
| `mended-friend` | mint-tin → sewing-machine → moon-bed | red-thread → mended-bear → empty | Permanent bear at the bed; 12 buttons once |
| `lost-song` | parlor-sofa → music-cabinet → sewing-machine → music-cabinet | brass-key → bent-cylinder → repaired-cylinder → empty | Open, playable music cabinet; 16 buttons once |
| `guest-tea` | wash-basin → jasmine-window → tea-set → doorstep | water-ewer → jasmine-sprig → guest-cup → empty | Tea and a welcome lamp at the doorstep; 20 buttons once |

`STORY_CHAPTERS` in content.js contains stable IDs, icon, reward and `steps`, each with `object` (plain permanent prop ID), `gives` (item ID or null), and `icon`. Copy derives from `story-{chapter.id}-{step}-{clue|action|done}`; chapter copy uses `story-{id}-{title|intro|memory}`; held-item copy uses `held-{item}`. `STORY_ITEMS` lists these IDs and icons.

Simulation owns `story:{chapter:0,step:0,lastAction:null,lastActionAt:-10}`. Held items and completed chapters are derived from chapter/step, preventing contradictory inventory flags. `storyStatus(state)` returns `{chapter,index,step,next,held,completed,finished,progress,totalSteps}`; `chapter` and `next` are definitions or null, `held` is an item ID or null, `completed` is the completed chapter ID prefix, `progress` is the number of steps finished, `totalSteps` is 11. `interactStory(state,key)` accepts stable `prop:` keys. A valid action advances exactly once, timestamps the acted-on object, returns `{ok:true,chapterComplete,reward,chapterId,step,message,effect,held}`, and pays only that chapter's completion reward. It may trigger a brief existing doll reaction at completion but does not grant care/bond/mastery or alter wishes. Pause returns `pausedActivity`. Invalid key returns `invalid`; valid wrong target returns `storyNotHere`; finished story returns `storyFinished`, all without mutation. Restore clamps chapter/step to valid bounds, accepts only known lastAction keys, and clamps timestamps. Missing/invalid story data defaults safely. Save key bait-al-dumiah.v1 and version 1 remain unchanged.

## World and interaction contract

Completed toys remain playable through `playStoryKeepsake(state,key)`: the earned bed, cabinet and doorstep update only their visual-response timestamp, never progress, inventory or rewards. The cabinet plays for six seconds and settles; the bear rocks; the guest greets. Descriptions reflect earned states.

Add five permanent prop targets: mint-tin in kitchen, music-cabinet in parlor, wash-basin at existing kitchen sink, jasmine-window beside parlor, doorstep on parlor front. Existing four prop IDs remain stable. The story prop renderer provides actual authored art for the new objects, including a hinged tin and cabinet, jasmine and a small doorstep tea setting. No invisible object with no visible counterpart. The sink reuses the existing basin.

`createStoryProps(parent)` returns `{root,update(state,nightMix),status()}` and reads only simulation state. A root instance is integrated once in world.js. Its state adapter shows the open tin, repaired bear, recovered music box, bloomed jasmine and guest tableau when earned. All additions use local procedural geometry/materials; shared static meshes batch where useful. No new renderer simulation state. Reduced motion uses stable poses; pause freezes animation. No shadow-casting extra lights.

User steering at 19:31 Amman explicitly rejects a game dependent on menus, buttons and toasts. Primary play therefore happens through the objects: tap to select, tap the selected object again to perform its current action, and drag the held-item token directly onto a world target. Touch/keyboard alternatives remain in a nonmodal compact ribbon with title, contextual action, optional inspect/details, and close. The draggable held token tracks the pointer and only dispatches a validated world target on release; cancel/lost capture leaves inventory unchanged. Selection remains world-space; camera drag remains usable except while deliberately dragging the held item. Legacy details remain accessible on demand. Story-correct objects offer the current story action. With a held item, wrong story targets allow an attempted use and explain the mismatch without consuming it. Existing ritual/care and decor actions stay reachable. Closing/restoring the ribbon, opening a modal, pausing, reset and placement clear stale selections correctly. All targets at least 44px, full keyboard path and Escape, English/Shami, concise feedback inside the world ribbon instead of a toast queue. Room object navigation must not cover the room with an expanding menu. Secondary house tools collapse behind one toggle during normal play.

The primary objective displays the current story clue and held item, and focuses the relevant room. It never calls the progression action. After all chapters, the existing objective loop resumes. Journal includes three completed story memories in its existing surface. No new story menu, inventory grid or toast queue for each discovery.

## Verification

Integrated review added concrete fixes: 667px landscape coverage and next-clue visibility, stable held-token centering on press, visible mobile touch/drag cues, visible focus restoration after details, and repeatable earned toys. Constructed bounds move the cabinet to local z .25 with open yaw -3.05, jasmine to x -.90/z -1.43, and doorstep to z 1.95 to clear existing lamps and saved decor slots. Room framing now fits all eight projected room corners in the usable playfield across 320/390px portrait and 667/844px landscape.

Tests before rules: all 11 ordered actions, wrong/unknown keys and repeats, pause, exact one-time rewards, old/malformed version-one saves, mid-carry reload, no side effects to care/bond/mastery/decor/wishes. Bilingual key coverage. Actual browser picks and keyboard/touch routes must complete all chapters without synthetic score submission, verify 3D consequences and memory, preserve progress on reload, dismiss selection with Escape, and keep 320/390px portrait and 667px landscape usable. Run npm run verify and existing npm run test:browser, update expected interaction routes where intentionally changed, retain semantic assertions. Run expansion checks and construction budget checks. Capture before/after day/night/phone/selected states; inspect originals. Independent integrated review before declaring the iteration accepted. Commit and push the iteration and record exact-head CI. No merge or production deploy.
