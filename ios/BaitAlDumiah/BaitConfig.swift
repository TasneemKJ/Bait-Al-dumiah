//
//  BaitConfig.swift
//  Everything the shared iOS shell (TasKit, ../../tas-engine/ios) needs to know about بيت الدمية.
//  The names below are persisted on players' phones (the baitaldumiah:// origin holds the save in
//  localStorage, the vault file holds its copy): never rename them after a build has shipped.
//
//  The game is a built multi-file site (dist/ at the repo root), copied into the app as the
//  folder game/ and served by TasKit's folder mode (`webRoot`).
//
//  Nothing is sold in 1.0 and there is no Game Center. To sell something later: add it to
//  `catalog`, create the same product ID in App Store Connect and a .storekit file for tests,
//  and inline tas-engine/web/tas-bridge.js in the page (see tas-engine/toolkit/new-game.md).
//

import Foundation
import TasKit
import UIKit

/// The Tas Games site (its own repo, `tas-games`). Change here if the site moves to its own domain.
enum SiteLinks {
    static let base = URL(string: "https://tas-games.vercel.app/")!
    static let privacy = base.appendingPathComponent("bait-al-dumiah/privacy.html")
    static let support = base.appendingPathComponent("bait-al-dumiah/support.html")
}

extension TasGameConfig {
    static let bait = TasGameConfig(
        htmlFileName: "index.html",
        webRoot: "game",
        scheme: "baitaldumiah",
        host: "app",
        handlerName: "baitaldumiah", // src/native-app.js NATIVE_HANDLER
        bridgeGlobal: "baitApp",
        bootGlobal: "__baitAppBoot",
        // Every save key starts with this: bait-al-dumiah.v1, .v1.backup, .v1.preferences.
        storagePrefix: "bait-al-dumiah",
        vaultFileName: "bait-al-dumiah-save-vault.json",
        // src/main.js; app.save() writes nothing before the player enters the house.
        flushSaveScript: "if(typeof window.__baitAlDumiahSave==='function')window.__baitAlDumiahSave();",
        catalog: [],
        primaryProductKey: nil,
        ownedDefaultsKey: "store.owned",
        pricesDefaultsKey: "store.prices",
        gameCenter: nil,
        legalPages: ["terms": appleStandardEULA, "privacy": SiteLinks.privacy],
        launchColor: UIColor(named: "LaunchBackground") ?? UIColor(red: 0.945, green: 0.906, blue: 0.867, alpha: 1),
        ambientAudio: true, // the silent switch silences the music box
        shareDownloadedPNGs: false, // the game offers no image downloads
        debugJSDefaultsKey: "baitDebugJS" // `simctl launch … -baitDebugJS "…"`
    )
}
