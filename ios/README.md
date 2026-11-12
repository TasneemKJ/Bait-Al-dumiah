# بيت الدمية · Bait Al-dumiah for iPhone

The iPhone app is a thin native shell around the web game. `npm run build` writes the game to
`dist/` (`index.html`, `src/`, `vendor/`); Xcode's **Copy the game** phase copies that folder
into the app as `game/`, and TasKit (`../tas-engine/ios`, the shared Tas Games shell) serves it
offline from `baitaldumiah://app/` in a `WKWebView` (folder mode, `webRoot: "game"`).

```
index.html + src/ ──npm run build──▶ dist/ ──Xcode "Copy the game"──▶ BaitAlDumiah.app/game/ ──▶ baitaldumiah://app/
ios/BaitAlDumiah
 ├─ BaitConfig.swift        everything TasKit needs: scheme, save prefix, flush hook, catalog, legal links
 ├─ BaitAlDumiahApp.swift   the SwiftUI entry (ten lines)
 └─ Assets, Info.plist, InfoPlist.xcstrings (Arabic and English name), PrivacyInfo.xcprivacy
ios/BaitAlDumiahTests
 ├─ BaitAlDumiah.storekit    the three products for local StoreKit tests (the scheme's Run uses it too)
 ├─ BaitConfigTests          persisted names, the catalog; every bundled file is served, JS as JavaScript
 ├─ BaitStoreTests           prices, buy, refund, Ask to Buy, failure; the canary: expiry, upgrade, grace
 └─ GamePageIntegrationTests the real page in a real web view: WebGL2, Play, save → vault, Settings,
                             price → page, buying opens the door, the store card at 44pt in both languages
```

## Build and test

tas-engine must be checked out next to this repo (`../tas-engine`); the project references
`../../tas-engine/ios` as a local Swift package.

```bash
npm ci && npm run build                          # dist/ at the repo root
xcodebuild -project ios/BaitAlDumiah.xcodeproj -scheme BaitAlDumiah \
  -destination 'platform=iOS Simulator,name=<your iPhone simulator>' test
```

The build fails with a clear message if `dist/index.html` is missing. Debug builds run one line of
JavaScript after load: `xcrun simctl launch booted Tas.BaitAlDumiah -baitDebugJS "document.querySelector('.home-play').click()"`.

## The rules

- **The persisted names never change** (`BaitConfigTests`): the `baitaldumiah` scheme is the
  page's localStorage origin, so renaming it loses every house. The save keys all start with
  `bait-al-dumiah` (`bait-al-dumiah.v1`, `.v1.backup`, `.v1.preferences`); TasKit copies them to
  `Application Support/bait-al-dumiah-save-vault.json` every 30 s and on the way to the
  background, and puts them back only when iOS has cleared every one of them.
- **The page knows it is in the app** by `webkit.messageHandlers.baitaldumiah`
  (`src/native-app.js`). There it hides what a web view cannot do (the JSON save export, a blob
  download; the `credits.txt` link, a new window) and says the house stays on this iPhone.
  Opening a copy saved from the web game still works. The licences ship inside the app
  (`game/credits.txt`, `game/vendor/THREE-LICENSE.txt`).
- **What is sold (owner, 2026-11-13), never power:** The Fifth Room `Tas.BaitAlDumiah.fifthRoom`
  ($4.99, once: the closed door, the room behind it, the visitor's gifts) and the canary
  `Tas.BaitAlDumiah.canary.monthly` / `.yearly` ($1.99 / $14.99, group "The Canary": company in the
  liwan, nothing else). `public/tas-bridge.js` is a verbatim copy of `tas-engine/web/tas-bridge.js`,
  loaded before the game; `src/app-store.js` makes `window.baitApp`, and `src/access.js` asks it at
  the moment of use and never saves the answer. On the web nothing is sold and everything is open.
  The card is `src/store-ui.js` (Settings → The Fifth Room and the canary, or the closed door in the
  journal). Debug: `-baitDebugJS "baitApp.openStore()"` after entering the house. No Game Center.
- **Orientation:** portrait only in 1.0. The web game also lays out at 844×390, but rotation in the
  app has not been checked (no Simulator UI on the build Mac); allow landscape after a real-iPhone check.

## Decisions (2026-11-13)

| Question | Decision |
|---|---|
| Shape | TasKit folder mode over the existing `dist/`; no bundler, no rewrite. |
| Identifiers | Bundle `Tas.BaitAlDumiah`, scheme `baitaldumiah`, SKU `BaitAlDumiah`, App Store Connect name «بيت الدمية · Bait Al-dumiah», primary language Arabic. |
| Pay model | Free download; The Fifth Room $4.99 once; the canary $1.99 a month or $14.99 a year (DESIGN.md, owner override 2026-11-13). |
| Game Center | None in 1.0. |
| Web | The web build keeps working unchanged; the app adds no network requests. |

## What App Store Connect needs (owner)

- App record: bundle `Tas.BaitAlDumiah` (registered 2026-11-13), SKU `BaitAlDumiah`, primary language Arabic.
- In-app purchases: the three products above (`ios/store/listing.json` has names, descriptions and
  review notes; `ios/store/review/store-card.png` is the review screenshot). The first one must be
  added to the version in the web UI.
- Privacy: **Data Not Collected** (Apple handles payment). Privacy Policy `https://tas-games.vercel.app/bait-al-dumiah/privacy.html`,
  Support `https://tas-games.vercel.app/bait-al-dumiah/support.html` (pages in the `tas-games` repo).
- Age rating questionnaire, Arabic and English listing and screenshots (see `ios/store/`), review notes.
