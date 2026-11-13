import XCTest
import TasKit
@testable import BaitAlDumiah

/// Bait's side of the shared shell: the names players' phones will hold, and the built game in the
/// bundle. The engine itself is tested in TasKit (tas-engine/ios).
final class BaitConfigTests: XCTestCase {
    private let config = TasGameConfig.bait

    func testThePersistedNamesNeverChange() {
        // Renaming any of these after release loses every player's house.
        XCTAssertEqual(config.gameURL.absoluteString, "baitaldumiah://app/")
        XCTAssertEqual(config.handlerName, "baitaldumiah", "src/native-app.js NATIVE_HANDLER")
        XCTAssertEqual(config.storagePrefix, "bait-al-dumiah")
        XCTAssertEqual(TasSaveVault(config: config).fileURL.lastPathComponent, "bait-al-dumiah-save-vault.json")
        XCTAssertEqual(config.webRoot, "game")
        XCTAssertEqual(config.htmlFileName, "index.html")
        XCTAssertEqual(config.debugJSDefaultsKey, "baitDebugJS")
    }

    func testWhatIsSoldIsTheFifthRoomAndTheCanaryAndNeverPower() {
        XCTAssertEqual(config.catalog.map(\.productID),
                       ["Tas.BaitAlDumiah.fifthRoom", "Tas.BaitAlDumiah.canary.monthly", "Tas.BaitAlDumiah.canary.yearly"],
                       "product IDs are permanent once in App Store Connect")
        XCTAssertEqual(config.catalog.map(\.key), ["fifthRoom", "canaryMonthly", "canaryYearly"], "src/app-store.js PRODUCTS")
        XCTAssertEqual(config.primaryProductKey, "fifthRoom")
        XCTAssertEqual(config.bridgeGlobal, "baitApp")
        XCTAssertEqual(config.bootGlobal, "__baitAppBoot")
        XCTAssertNil(config.gameCenter)
        XCTAssertNil(TasBridgeMessage.parse(["type": "buy", "data": ["id": "buttons"]], config: config), "buttons are never sold")
        XCTAssertEqual(TasBridgeMessage.parse(["type": "buy", "data": ["id": "fifthRoom"]], config: config), .buy("fifthRoom"))
    }

    func testTheBuiltGameShipsInsideTheApp() throws {
        let root = try XCTUnwrap(TasSchemeHandler.webRootURL(config: config), "the build phase copied dist/ to game/")
        for path in ["index.html", "tas-bridge.js", "src/main.js", "src/app-store.js", "src/native-app.js", "src/styles.css",
                     "vendor/three.module.min.js", "vendor/three.core.min.js", "vendor/OrbitControls.js",
                     "credits.txt", "vendor/THREE-LICENSE.txt"] {
            XCTAssertTrue(FileManager.default.fileExists(atPath: root.appendingPathComponent(path).path), path)
        }
        for webOnly in ["og-image.jpg", "manifest.webmanifest"] {
            XCTAssertFalse(FileManager.default.fileExists(atPath: root.appendingPathComponent(webOnly).path), webOnly)
        }
        let main = try String(contentsOf: root.appendingPathComponent("src/main.js"), encoding: .utf8)
        XCTAssertTrue(main.contains("window.__baitAlDumiahSave"), "the save hook flushSaveScript calls")
        let page = try String(contentsOf: root.appendingPathComponent("index.html"), encoding: .utf8)
        let bridgeAt = try XCTUnwrap(page.range(of: "./tas-bridge.js")), gameAt = try XCTUnwrap(page.range(of: "./src/main.js"))
        XCTAssertLessThan(bridgeAt.lowerBound, gameAt.lowerBound, "the bridge loads before the game")
    }

    func testEveryFileTheGameLoadsIsServed() throws {
        let root = try XCTUnwrap(TasSchemeHandler.webRootURL(config: config))
        let files = try XCTUnwrap(FileManager.default.enumerator(at: root, includingPropertiesForKeys: [.isRegularFileKey]))
        var refused: [String] = []
        for case let file as URL in files where (try? file.resourceValues(forKeys: [.isRegularFileKey]))?.isRegularFile == true {
            let rel = String(file.standardizedFileURL.path.dropFirst(root.standardizedFileURL.path.count))
            if TasSchemeHandler.file(for: URL(string: "baitaldumiah://app" + rel)!, config: config) == nil { refused.append(rel) }
        }
        XCTAssertEqual(refused, [], "files in the app the scheme handler would 404")
        XCTAssertEqual(TasSchemeHandler.mimeType(forPath: "src/main.js"), "text/javascript; charset=utf-8",
                       "module scripts need a JavaScript MIME type")
        XCTAssertNil(TasSchemeHandler.file(for: URL(string: "baitaldumiah://app/../Info.plist")!, config: config))
        XCTAssertNil(TasSchemeHandler.file(for: URL(string: "baitaldumiah://app/%2e%2e/Info.plist")!, config: config))
    }

    func testTheShareSheetCanSaveToPhotos() {
        // The share sheet's "Save Image" crashes without this key.
        let text = Bundle.main.object(forInfoDictionaryKey: "NSPhotoLibraryAddUsageDescription") as? String
        XCTAssertFalse((text ?? "").isEmpty)
        XCTAssertNotNil(TasBridgeMessage.parse(["type": "share", "data": ["dataURL": "data:image/png;base64,iVBORw0KGgo="]], config: config))
    }

    func testLegalLinksAreReal() {
        XCTAssertEqual(config.legalPages["terms"]?.host, "www.apple.com")
        XCTAssertEqual(config.legalPages["privacy"]?.absoluteString, "https://tas-games.vercel.app/bait-al-dumiah/privacy.html")
        XCTAssertEqual(config.legalPages["support"], SiteLinks.support)
        XCTAssertEqual(SiteLinks.support.absoluteString, "https://tas-games.vercel.app/bait-al-dumiah/support.html")
    }
}
