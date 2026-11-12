import WebKit
import XCTest
import TasKit
@testable import BaitAlDumiah

/// The shipped game, in a real web view served from baitaldumiah:// by the real host: every module
/// loads over the custom scheme, WebGL2 starts (no recovery screen), the page knows it is in the app,
/// and the house is copied out to the vault once the player is in.
@MainActor
final class GamePageIntegrationTests: XCTestCase {
    private var dir: URL!
    private var host: TasGameHost!
    private var web: WKWebView!
    private var window: UIWindow!

    override func setUp() async throws {
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
        try await waitFor("location.protocol==='baitaldumiah:'&&document.readyState==='complete'", seconds: 30)
        _ = try await js("Object.keys(localStorage).forEach(function(k){localStorage.removeItem(k)});location.reload();true")
        try await waitFor("document.querySelector('.home-play')!==null&&!document.querySelector('#loading')", seconds: 40)
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
        _ = try await js("document.querySelector('.home-play').click();true")
        try await waitFor("document.querySelector('#app').dataset.screen!=='home'", seconds: 20)
        try await Task.sleep(for: .seconds(3))
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
        _ = try await js("document.querySelector('.home-play').click();true")
        try await waitFor("document.querySelector('#app').dataset.screen!=='home'", seconds: 20)
        // Past the intro if it plays, then the dock's Settings control (data-action="panel-settings").
        _ = try await js("var s=document.querySelector('.intro-skip');if(s&&!s.closest('[hidden]'))s.click();true")
        try await waitFor("document.querySelector('[data-action=\"panel-settings\"]')!==null", seconds: 30)
        _ = try await js("document.querySelector('[data-action=\"panel-settings\"]').click();true")
        try await waitFor("document.querySelector('.save-file')!==null", seconds: 10)
        let export = try await js("document.querySelector('[data-action=\"save-export\"]')===null") as? Bool
        XCTAssertEqual(export, true, "a blob download goes nowhere in the app")
        let credits = try await js("document.querySelector('a[href=\"./credits.txt\"]')===null") as? Bool
        XCTAssertEqual(credits, true, "a new window goes nowhere in the app")
        let note = try await js("document.querySelector('.privacy-note').textContent") as? String
        XCTAssertFalse((note ?? "").localizedCaseInsensitiveContains("browser"))
        let importer = try await js("document.querySelector('[data-field=\"save-import\"]')!==null") as? Bool
        XCTAssertEqual(importer, true, "a copy from the web game can still be opened")
        try await snapshot("settings")
    }
}
