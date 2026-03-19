import SwiftUI
import WidgetKit

/// Background-only host app that registers the WidgetKit extension with macOS.
/// Handles --reload-widget argument from the Electron app to force widget timeline reloads.
/// Runs as LSUIElement (no Dock icon, no menu bar, no visible window).
@main
struct ClaudeWatchHostApp: App {
    var body: some Scene {
        Settings {
            EmptyView()
        }
    }

    init() {
        // Check for reload argument passed via command line
        if CommandLine.arguments.contains("--reload-widget") {
            WidgetCenter.shared.reloadAllTimelines()
            // Exit after triggering reload
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                NSApplication.shared.terminate(nil)
            }
        } else {
            // Launched manually (e.g. first install to register the widget extension).
            // Nothing to show — just quit after macOS has discovered the .appex bundle.
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}
