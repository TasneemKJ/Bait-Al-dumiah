# Arabic agreement and digit scan, 2026-10-06

Scope: every string in `strings.ar` (`src/locale-data.js` plus the later overrides in `src/i18n.js`), and the runtime paths that insert numbers or names. The scan is now a contract: `tests/arabic-agreement.test.mjs`.

## Digits
- No Western digits in any Arabic string; fixed numbers are Arabic-Indic (`١٠٠`, `+٣٨`, `٧٠٪`), the percent sign is `٪`. The fixed effect numbers (`+٣٨ شبع`, `+٣٢ راحة`, `+٤٢ نشاط`, `+٢٤ راحة`) match `ACTIONS` in `src/content.js` today; they are literals, so a balance change must edit both (flagged, not changed).
- Runtime numbers go through `number()` (`Intl.NumberFormat('ar-JO')`) in every UI path checked (HUD, panels, tea, stitch, chime, activities, returns). `${state.day}` in `main.js` is the export file name, not display text. The `<meter value>` attribute is a machine value.
- Latin letters remain only in keyboard hints (`Enter`, `Escape`, `E`, `U`, `H`, `R`), which name physical keys.
- Placeholders match the English ones in every key.

## Fixed
| key | before | after | why |
|---|---|---|---|
| `teaProgress` | `{ready} / {total} فناجين جاهزة` | `الفناجين الجاهزة: {ready} / {total}` | two cups need the dual, not "٢ فناجين"; a label avoids number-noun agreement |
| `stitchProgress` | `{done} / {total} أجزاء مخيّطة` | `الأجزاء المخيّطة: {done} / {total}` | same |
| `chimeProgress` | `{done} / {total} نغمات` | `النغمات المردودة: {done} / {total}` | same |
| `chimeReward` | `+{reward} أزرار` | `+{reward} زرّ` | every other reward uses `زرّ` after a number |
| `activityCooldown` | `بعد {x} ثانية لعب` | `بعد {x} من ثواني اللعب` | `{x}` ranges across 2-10 (plural) and 11+; the partitive is right for any number |
| `storyFindRoom` | `شوف بـ{room}` (kashida joined to `ال`, and `بالنوم` for the bedroom) | `شوف {room}` with new `kitchenIn/parlorIn/studioIn/bedroomIn` = `بالمطبخ`, `بالليوان`, `بأوضة التطريز`, `بأوضة النوم` | the clue button read `بـالمطبخ`; the bedroom read "in the sleeping" |

English gets matching `…In` keys (the same names as before), so the clue button reads exactly as it did.

## Left alone, for the owner
- The story addresses the player in the masculine (`إنت مش متذكّر`, `وانت غايب`, `فيك تصلّح`). It is consistent and a deliberate voice choice, and imperatives (`اضغط`, `جرّب`) are conventional. A gender-neutral rewrite is a large copy pass, not a defect fix.
