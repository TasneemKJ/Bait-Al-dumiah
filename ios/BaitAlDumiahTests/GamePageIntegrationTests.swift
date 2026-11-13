import StoreKit
import StoreKitTest
import WebKit
import XCTest
import TasKit
@testable import BaitAlDumiah

/// The shipped game, in a real web view served from baitaldumiah:// by the real host: every module
/// loads over the custom scheme, WebGL2 starts (no recovery screen), the page knows it is in the app,
/// the house is copied out to the vault once the player is in, the App Store's prices and purchases
/// reach the page (a local StoreKit session), the closed door waits for The Fifth Room, and the store
/// card fits a phone in both languages.
@MainActor
final class GamePageIntegrationTests: XCTestCase {
    private var session: SKTestSession!
    private var dir: URL!
    private var host: TasGameHost!
    private var web: WKWebView!
    private var window: UIWindow!

    override func setUp() async throws {
        session = try SKTestSession(configurationFileNamed: "BaitAlDumiah")
        session.resetToDefaultState()
        session.clearTransactions()
        session.disableDialogs = true
        // A cold simulator's StoreKit daemon can take over 30 s to load the configuration.
        for _ in 0..<240 {
            if let found = try? await Product.products(for: Catalog.productIDs), !found.isEmpty { break }
            try await Task.sleep(for: .milliseconds(250))
        }
        dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let defaults = UserDefaults(suiteName: "page-\(UUID().uuidString)")!
        host = TasGameHost(config: .bait, store: TasStore(config: .bait, defaults: defaults),
                           vault: TasSaveVault(config: .bait, directory: dir))
        web = host.makeWebView()
        window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.addSubview(web)
        web.frame = window.bounds
        window.isHidden = false
        // A fresh house each test: no save from an earlier test.
        // A cold simulator can take most of a minute to start the web content and GPU processes.
        try await waitFor("location.protocol==='baitaldumiah:'&&document.readyState==='complete'", seconds: 180)
        // The old document stays scriptable until the reload lands: mark it, and wait for a document without the mark.
        _ = try await js("window.__resetting=true;Object.keys(localStorage).forEach(function(k){localStorage.removeItem(k)});location.reload();true")
        try await waitFor("!window.__resetting&&document.querySelector('.home-play')!==null&&!document.querySelector('.home-play').disabled&&!document.querySelector('#loading')", seconds: 60)
    }

    override func tearDown() async throws {
        _ = try? await js("Object.keys(localStorage).forEach(function(k){localStorage.removeItem(k)});true")
        web?.stopLoading()
        web?.loadHTMLString("", baseURL: nil)
        window?.isHidden = true
        try? FileManager.default.removeItem(at: dir)
    }

    private func js(_ source: String) async throws -> Any? {
        try await web.evaluateJavaScript(source)
    }

    private func waitFor(_ condition: String, seconds: Double = 20, file: StaticString = #filePath, line: UInt = #line) async throws {
        let deadline = Date().addingTimeInterval(seconds)
        while Date() < deadline {
            if (try? await js("Boolean(\(condition))")) as? Bool == true { return }
            try await Task.sleep(for: .milliseconds(150))
        }
        XCTFail("timed out waiting for: \(condition)", file: file, line: line)
    }

    /// Play, then past the intro: the house is entered and the intro layer is gone.
    private func enterHouse(file: StaticString = #filePath, line: UInt = #line) async throws {
        _ = try await js("document.querySelector('.home-play').click();true")
        let deadline = Date().addingTimeInterval(30)
        var clear = 0
        while Date() < deadline, clear < 3 {
            let step = try await js("""
            (function(){if(document.querySelector('#app').dataset.screen!=='play')return 'home';
              var l=document.querySelector('.intro-layer');
              if(l&&!l.hidden){document.querySelector('.intro-skip').click();return 'skip';}return 'clear';})()
            """) as? String
            clear = step == "clear" ? clear + 1 : 0
            try await Task.sleep(for: .milliseconds(400))
        }
        if clear < 3 {
            let state = try await js("""
            JSON.stringify({screen:document.querySelector('#app').dataset.screen,
              play:(document.querySelector('.home-play')||{}).textContent,
              home:document.querySelector('#home').innerText.slice(0,200),
              error:!!document.querySelector('.error-screen')})
            """) as? String
            XCTFail("the house was not entered: \(state ?? "?")", file: file, line: line)
        }
    }

    private func snapshot(_ name: String) async throws {
        let shot = try await web.takeSnapshot(configuration: nil)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("bait-\(name).png")
        try shot.pngData()?.write(to: url)
        print("SNAPSHOT \(url.path)")
    }

    func testTheHouseOpensInTheAppWithWebGL() async throws {
        let proto = try await js("location.protocol") as? String
        XCTAssertEqual(proto, "baitaldumiah:")
        let errorScreen = try await js("document.querySelector('.error-screen')!==null") as? Bool
        XCTAssertEqual(errorScreen, false, "the WebGL recovery screen is not shown")
        let webgl2 = try await js("!!document.createElement('canvas').getContext('webgl2')") as? Bool
        XCTAssertEqual(webgl2, true)
        let inApp = try await web.callAsyncJavaScript(
            "return (await import('./src/native-app.js')).inNativeApp()", contentWorld: .page) as? Bool
        XCTAssertEqual(inApp, true, "the page sees webkit.messageHandlers.baitaldumiah")
        let vibrate = try await js("typeof navigator.vibrate") as? String
        XCTAssertEqual(vibrate, "function", "haptics reach the Taptic Engine")
        try await snapshot("home")
    }

    func testPlayEntersTheHouseAndTheSaveIsCopiedOut() async throws {
        try await enterHouse()
        let errorScreen = try await js("document.querySelector('.error-screen')!==null") as? Bool
        XCTAssertEqual(errorScreen, false)
        try await snapshot("entered")
        host.sync() // runs flushSaveScript, then copies the bait-al-dumiah* keys
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline, host.vault.load()["bait-al-dumiah.v1"] == nil {
            try await Task.sleep(for: .milliseconds(150))
        }
        let saved = try XCTUnwrap(host.vault.load()["bait-al-dumiah.v1"], "the house reached the vault")
        XCTAssertTrue(saved.hasPrefix("{"), "a JSON save")
        XCTAssertTrue(host.vault.load().keys.allSatisfy { $0.hasPrefix("bait-al-dumiah") })
    }

    func testTheSettingsSheetHidesWhatTheAppCannotDo() async throws {
        try await enterHouse()
        try await waitFor("document.querySelector('[data-action=\"panel-settings\"]')!==null", seconds: 30)
        _ = try await js("document.querySelector('[data-action=\"panel-settings\"]').click();true")
        try await waitFor("document.querySelector('.save-file')!==null", seconds: 10)
        let export = try await js("document.querySelector('[data-action=\"save-export\"]')===null") as? Bool
        XCTAssertEqual(export, true, "a blob download goes nowhere in the app")
        let credits = try await js("document.querySelector('a[href=\"./credits.txt\"]')===null") as? Bool
        XCTAssertEqual(credits, true, "a new window goes nowhere in the app")
        let note = try await js("document.querySelector('.privacy-note').textContent") as? String
        XCTAssertFalse((note ?? "").localizedCaseInsensitiveContains("browser"))
        XCTAssertTrue((note ?? "").contains("iPhone"), "the app wording is switched on: \(note ?? "")")
        let importer = try await js("document.querySelector('[data-field=\"save-import\"]')!==null") as? Bool
        XCTAssertEqual(importer, true, "a copy from the web game can still be opened")
        try await snapshot("settings")

        // The film is drawn and scored in the page (no media files), so it plays in the app too.
        _ = try await js("document.querySelector('[data-action=\"watch-film\"]').click();true")
        try await waitFor("(function(){var d=document.querySelector('.film-dialog');return !!(d&&d.open)})()", seconds: 10)
        try await Task.sleep(for: .seconds(2))
        let errorScreen = try await js("document.querySelector('.error-screen')!==null") as? Bool
        XCTAssertEqual(errorScreen, false)
    }

    /// Opens a sheet by its dock name and waits for it to render.
    private func openSheet(_ name: String) async throws {
        _ = try await js("document.querySelector('[data-action=\"panel-\(name)\"]').click();true")
        try await waitFor("document.querySelector('#sheet[open] #sheet-title')!==null", seconds: 10)
    }

    func testTheAppStorePriceReachesThePageAndBuyingOpensTheDoor() async throws {
        try await waitFor("typeof baitApp==='object'&&baitApp.inApp===true")
        try await waitFor("(baitApp.prices.fifthRoom||'').length>0", seconds: 30) // the App Store's own price
        let owns = try await js("baitApp.owns('fifthRoom')") as? Bool
        XCTAssertEqual(owns, false, "closed until bought")
        try await enterHouse()
        try await openSheet("journal")
        let locked = try await js("""
        !!document.querySelector('#sheet .door-store')&&!document.querySelector('#sheet [data-action="mend-door"]')
        """) as? Bool
        XCTAssertEqual(locked, true, "the door shows what opens it, never a mend it cannot honour")
        try await snapshot("door-locked")
        await host.store.buy("fifthRoom")
        XCTAssertTrue(host.store.owns("fifthRoom"))
        try await waitFor("baitApp.owns('fifthRoom')===true")
        try await waitFor("!!document.querySelector('#sheet [data-action=\"mend-door\"]')", seconds: 10)
        host.sync()
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline, host.vault.load()["bait-al-dumiah.v1"] == nil { try await Task.sleep(for: .milliseconds(150)) }
        let saved = try XCTUnwrap(host.vault.load()["bait-al-dumiah.v1"])
        XCTAssertFalse(saved.contains("fifthRoom"), "nothing bought is in the save")
    }

    func testTheCanarySubscriptionReachesThePage() async throws {
        try await waitFor("(baitApp.prices.canaryMonthly||'').length>0&&(baitApp.prices.canaryYearly||'').length>0", seconds: 30)
        await host.store.buy("canaryMonthly")
        try await waitFor("baitApp.owns('canaryMonthly')===true")
        let door = try await js("baitApp.owns('fifthRoom')") as? Bool
        XCTAssertEqual(door, false, "the subscription opens no room")
    }

    /// The store card in both languages on a 390x844 screen: every control a 44pt target and on screen,
    /// the App Store's price in a left-to-right isolate, Restore, Terms and Privacy on the card.
    func testTheStoreCardFitsAndEveryControlIsATapTarget() async throws {
        try await waitFor("(baitApp.prices.fifthRoom||'').length>0&&(baitApp.prices.canaryYearly||'').length>0", seconds: 30)
        try await enterHouse()
        for lang in ["en", "ar"] {
            if lang == "ar" {
                _ = try await js("""
                (function(){document.querySelector('#sheet [data-action="close"]')?.click();
                  document.querySelector('[data-action="panel-settings"]').click();
                  var s=document.querySelector('[data-field="locale"]');s.value='ar';
                  s.dispatchEvent(new Event('change',{bubbles:true}));return true})()
                """)
                try await waitFor("document.documentElement.lang==='ar'", seconds: 10)
            }
            try await openSheet("settings")
            let row = try await js("!!document.querySelector('#sheet [data-action=\"panel-store\"]')") as? Bool
            XCTAssertEqual(row, true, "\(lang): Settings leads to the card")
            _ = try await js("document.querySelector('#sheet [data-action=\"panel-store\"]').click();true")
            try await waitFor("!!document.querySelector('#sheet .store-cards')", seconds: 10)
            try await Task.sleep(for: .milliseconds(400))
            let report = try await js("""
            (function(){var out=[],body=document.querySelector('#sheet');
              var acts=Array.from(body.querySelectorAll('.store-cards button,.store-footer button'));
              if(acts.length<6)out.push('only '+acts.length+' controls');
              acts.forEach(function(b){b.scrollIntoView({block:'center'});var r=b.getBoundingClientRect();
                if(r.height<44||r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight)out.push(b.dataset.action+':'+b.dataset.id+':'+Math.round(r.height));});
              ['fifthRoom','canaryMonthly','canaryYearly'].forEach(function(id){
                var b=body.querySelector('[data-action="store-buy"][data-id="'+id+'"]');if(!b)out.push('missing '+id);else if(b.disabled)out.push('disabled '+id);});
              ['store-restore','store-page'].forEach(function(a){if(!body.querySelector('[data-action="'+a+'"]'))out.push('missing '+a);});
              var bdi=body.querySelector('bdi');if(!bdi||bdi.dir!=='ltr'||!bdi.textContent.length)out.push('price');
              return out.join(',');})()
            """) as? String
            XCTAssertEqual(report, "", "\(lang): store card problems")
            _ = try await js("document.querySelector('#sheet').scrollTop=0;true")
            try await snapshot("store-\(lang)")
        }
    }
}
