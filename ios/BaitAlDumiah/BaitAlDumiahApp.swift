//
//  BaitAlDumiahApp.swift
//  بيت الدمية · Bait Al-dumiah for iPhone. The game is the web build in dist/, copied into the
//  app as game/ and played offline in a web view by TasKit; see ios/README.md.
//

import SwiftUI
import TasKit

@main
struct BaitAlDumiahApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var host = TasGameHost(config: .bait)

    var body: some Scene {
        WindowGroup {
            TasGameScreen(host: host)
        }
        .onChange(of: scenePhase) { phase in host.scenePhaseChanged(phase) }
    }
}
