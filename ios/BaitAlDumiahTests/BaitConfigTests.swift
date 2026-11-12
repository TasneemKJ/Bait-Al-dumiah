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

    func testNothingIsSoldAndThereIsNoGameCenter() {
        XCTAssertTrue(config.catalog.isEmpty)
        XCTAssertNil(config.gameCenter)
        XCTAssertNil(TasBridgeMessage.parse(["type": "buy", "data": ["id": "buttons"]], config: config))
    }

    func testTheBuiltGameShipsInsideTheApp() throws {
        let root = try XCTUnwrap(TasSchemeHandler.webRootURL(config: config), "the build phase copied dist/ to game/")
        for path in ["index.html", "src/main.js", "src/native-app.js", "src/styles.css",
                     "vendor/three.module.min.js", "vendor/three.core.min.js", "vendor/OrbitControls.js",
                     "credits.txt", "vendor/THREE-LICENSE.txt"] {
            XCTAssertTrue(FileManager.default.fileExists(atPath: root.appendingPathComponent(path).path), path)
        }
        for webOnly in ["og-image.jpg", "manifest.webmanifest"] {
            XCTAssertFalse(FileManager.default.fileExists(atPath: root.appendingPathComponent(webOnly).path), webOnly)
        }
        let main = try String(contentsOf: root.appendingPathComponent("src/main.js"), encoding: .utf8)
        XCTAssertTrue(main.contains("window.__baitAlDumiahSave"), "the save hook flushSaveScript calls")
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

    func testLegalLinksAreReal() {
        XCTAssertEqual(config.legalPages["terms"]?.host, "www.apple.com")
        XCTAssertEqual(config.legalPages["privacy"]?.absoluteString, "https://tas-games.vercel.app/bait-al-dumiah/privacy.html")
        XCTAssertEqual(SiteLinks.support.absoluteString, "https://tas-games.vercel.app/bait-al-dumiah/support.html")
    }
}
