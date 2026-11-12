//
//  BaitConfig.swift
//  Everything the shared iOS shell (TasKit, ../../tas-engine/ios) needs to know about بيت الدمية.
//  The names below are persisted on players' phones (the baitaldumiah:// origin holds the save in
//  localStorage, the vault file holds its copy): never rename them after a build has shipped.
//
//  The game is a built multi-file site (dist/ at the repo root), copied into the app as the
//  folder game/ and served by TasKit's folder mode (`webRoot`).
//
//  Two things are sold (owner, 2026-11-13), never power: The Fifth Room, paid once (the closed
//  door, the room behind it and the visitor's gifts), and the canary, monthly or yearly (company in
//  the liwan, nothing else). The page asks `baitApp.owns('<key>')` at the moment it matters and never
//  saves the answer (src/app-store.js, src/access.js). To add a product: add it to `Catalog.all`,
//  create the same product ID in App Store Connect and in BaitAlDumiahTests/BaitAlDumiah.storekit.
//  There is no Game Center.
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

enum Catalog {
    /// The closed door between the four rooms, the fifth room behind it and the visitor's eight gifts.
    static let fifthRoom = TasCatalogItem(key: "fifthRoom", productID: "Tas.BaitAlDumiah.fifthRoom", kind: .nonConsumable)
    /// The canary (الكناري): a canary in a brass cage by the liwan window. Company only.
    static let canaryMonthly = TasCatalogItem(key: "canaryMonthly", productID: "Tas.BaitAlDumiah.canary.monthly", kind: .subscription)
    static let canaryYearly = TasCatalogItem(key: "canaryYearly", productID: "Tas.BaitAlDumiah.canary.yearly", kind: .subscription)

    /// What is on sale in this version.
    static let all: [TasCatalogItem] = [fifthRoom, canaryMonthly, canaryYearly]
    static var productIDs: [String] { all.map(\.productID) }
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
        catalog: Catalog.all,
        primaryProductKey: Catalog.fifthRoom.key,
        ownedDefaultsKey: "store.owned",
        pricesDefaultsKey: "store.prices",
        gameCenter: nil,
        legalPages: ["terms": appleStandardEULA, "privacy": SiteLinks.privacy, "support": SiteLinks.support],
        launchColor: UIColor(named: "LaunchBackground") ?? UIColor(red: 0.945, green: 0.906, blue: 0.867, alpha: 1),
        ambientAudio: true, // the silent switch silences the music box
        shareDownloadedPNGs: false, // the game offers no image downloads
        debugJSDefaultsKey: "baitDebugJS" // `simctl launch … -baitDebugJS "…"`
    )
}
