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
//
//  Game Center: seven achievements and one leaderboard, read off the save by `BaitGameCenter.progressScript`
//  (ios/game-center/progress.js holds the script, the IDs and the store text). Never rename the IDs.
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

/// Game Center: what the page's progress script reports, mapped to the IDs in App Store Connect.
/// The script and the IDs come from ios/game-center/progress.js (tests/ios-game-center.test.mjs checks this
/// file matches it). A player signed in on the phone is recognised silently; nobody is asked to sign in.
enum BaitGameCenter {
    /// Evaluated in the page after the save hook; reads bait-al-dumiah.v1 and guards every field.
    static let progressScript = [
        "(function(){var o={achievements:{},scores:{}},a=o.achievements;var ob=function(v){return v&&typeof v",
        "==='object'&&!Array.isArray(v)?v:{};};var ar=function(v){return Array.isArray(v)?v:[];};var n=functi",
        "on(v){return typeof v==='number'&&isFinite(v)&&v>0?Math.floor(Math.min(v,1e6)):0;};var s;try{s=ob(JS",
        "ON.parse(localStorage.getItem('bait-al-dumiah.v1')));}catch(e){s={};}var got=ar(s.achieved).concat(a",
        "r(s.milestones)),has=function(k){return got.indexOf(k)>=0;};var act=ob(s.activities),st=ob(s.story),",
        "m=ob(s.mischief),arc=ob(s.arc),j=ar(s.journal);var rooms=['kitchen','parlor','studio','bedroom'],ite",
        "ms=['plant','lamp','rug','bear','mobile','musicbox'],secrets=['music-box','small-footsteps','portrai",
        "t','jasmine','tea-for-four','welcome-home'];var heard=secrets.filter(function(x){return j.indexOf(x)",
        ">=0;}).length;var put=ar(s.decor).map(ob).filter(function(d){return rooms.indexOf(d.room)>=0&&items.",
        "indexOf(d.item)>=0&&typeof d.slot==='number'&&d.slot>=0&&d.slot<3&&Math.floor(d.slot)===d.slot;});va",
        "r corners=[];put.forEach(function(d){var c=d.room+d.slot;if(corners.indexOf(c)<0)corners.push(c);});",
        "var poured=ar(act.teaRecords).some(function(v){return typeof v==='number'&&isFinite(v)&&v>=0;});a.fi",
        "rstTea=poured||n(ob(act.mastery).tea)>=1||n(st.chapter)>=3;a.threeWishes=n(s.lastFullDay)>0||has('fu",
        "ll-house');a.everyRoom=has('every-room')||rooms.every(function(r){return put.some(function(d){return",
        " d.room===r;});});var found=n(m.nights)-n(m.losses)-(m.item?1:0);a.beforeNightfall=found>=1||ar(m.lo",
        "g).some(function(e){return ob(e).found===true;});a.threeWhispers=heard>=3||has('three-whispers')||ha",
        "s('all-whispers');a.wholeStory=heard>=6&&n(st.chapter)>=3&&corners.length>=12;a.rainNight=arc.rain==",
        "=true;var v=Math.min(n(arc.visits),999);if(v>0)o.scores.daysKept=v;return o;})()",
    ].joined()

    static let config = TasGameCenterConfig(
        progressScript: progressScript,
        achievements: [
            .init(key: "firstTea", id: "bait.milestone.1_first_tea"),
            .init(key: "threeWishes", id: "bait.milestone.2_three_wishes"),
            .init(key: "everyRoom", id: "bait.milestone.3_every_room"),
            .init(key: "beforeNightfall", id: "bait.milestone.4_before_nightfall"),
            .init(key: "threeWhispers", id: "bait.milestone.5_three_whispers"),
            .init(key: "wholeStory", id: "bait.milestone.6_the_whole_story"),
            .init(key: "rainNight", id: "bait.milestone.7_the_rain_night"),
        ],
        leaderboards: [.init(key: "daysKept", id: "bait.daysKept")]
    )
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
        gameCenter: BaitGameCenter.config,
        legalPages: ["terms": appleStandardEULA, "privacy": SiteLinks.privacy, "support": SiteLinks.support],
        launchColor: UIColor(named: "LaunchBackground") ?? UIColor(red: 0.945, green: 0.906, blue: 0.867, alpha: 1),
        ambientAudio: true, // the silent switch silences the music box
        shareDownloadedPNGs: false, // the game offers no image downloads
        debugJSDefaultsKey: "baitDebugJS" // `simctl launch … -baitDebugJS "…"`
    )
}
