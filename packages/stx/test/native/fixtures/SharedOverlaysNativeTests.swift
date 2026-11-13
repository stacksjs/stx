import UIKit
import XCTest
@testable import StxPortability

/// What VoiceOver stops on around the shared overlays: a tooltip's trigger,
/// the tab strip, and what a dialog or drawer leaves reachable while it is
/// open (stacksjs/stx#2184).
@MainActor
final class SharedOverlaysNativeTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func find(_ id: String, in view: UIView) -> UIView? {
        if view.accessibilityIdentifier == id { return view }
        return view.subviews.lazy.compactMap { self.find(id, in: $0) }.first
    }

    private func wait(_ message: @autoclosure () -> String, _ condition: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(10)
        while !condition(), Date() < deadline { try await Task.sleep(nanoseconds: 20_000_000) }
        XCTAssertTrue(condition(), message())
    }

    private func host() async throws -> (CraftNativeScreenController, UIWindow) {
        let screen = CraftNativeScreenController(config: CraftConfig())
        // In the app's own scene, so a sheet can be presented from it.
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        let window = scene.map { UIWindow(windowScene: $0) } ?? UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = screen; window.makeKeyAndVisible(); screen.loadViewIfNeeded()
        try await wait("the overlay screen mounts", { self.find("open-drawer", in: screen.view) != nil && self.find("tab-second", in: screen.view) != nil })
        window.layoutIfNeeded(); screen.view.layoutIfNeeded()
        return (screen, window)
    }

    /// The view a reader is in: the sheet on top when one is presented.
    private func front(_ screen: UIViewController) -> UIView {
        var top = screen
        while let presented = top.presentedViewController, !presented.isBeingDismissed { top = presented }
        return top.view
    }

    /// The tooltip's words are its trigger's hint, the tab strip is a named
    /// group whose chosen tab says so, and a closed dialog or drawer leaves
    /// nothing behind to stop on.
    func testAReaderHearsTheHintAndTheChosenTab() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        try await wait("the tooltip trigger carries its hint: \(SpokenStops.of(screen.view))", {
            SpokenStops.of(screen.view).contains("Help |  | button, hint: Helpful native hint")
        })
        XCTAssertEqual(SpokenStops.of(screen.view), [
            "More actions |  | button",
            "Help |  | button, hint: Helpful native hint",
            "Help taps: 0 |  | ",
            "Open dialog |  | button",
            "Open drawer |  | button",
            "Device tabs |  | group",
            // Inside a tab strip a reader calls each of these a tab, and
            // counts them: "First, selected, tab, 1 of 2".
            "First |  | selected",
            "Second |  | ",
            "Selected: first |  | ",
            "Dialog taps: 0; open: false |  | ",
        ])
    }

    /// An open dialog or drawer is what a reader is in: its own controls are
    /// the stops, not the screen underneath, and a drawer says its name.
    func testAnOpenDialogOrDrawerIsWhatAReaderIsIn() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }

        screen.evaluateScript("overlayProbe.outer.set(true)")
        try await wait("the dialog is presented: \(SpokenStops.of(self.front(screen)))", {
            SpokenStops.of(self.front(screen)).contains("Open nested dialog |  | button")
        })
        // Known gap, in the host: the dialog's name ("Outer dialog") is set
        // on the node the sheet was opened from and never reaches the sheet,
        // so a reader lands in it without being told what it is. When the
        // host carries it over, this list gains "Outer dialog |  | group".
        XCTAssertEqual(SpokenStops.of(front(screen)), ["Open nested dialog |  | button"])
        screen.evaluateScript("overlayProbe.outer.set(false)")
        try await wait("the dialog is dismissed", { screen.presentedViewController == nil })

        screen.evaluateScript("overlayProbe.drawer.set(true)")
        try await wait("the drawer is presented: \(SpokenStops.of(self.front(screen)))", {
            SpokenStops.of(self.front(screen)).contains("Close drawer |  | button")
        })
        // The panel used to be one stop called "Device drawer", with its
        // close button and everything else in it out of reach.
        XCTAssertEqual(SpokenStops.of(front(screen)), ["Device drawer |  | ", "Close panel |  | button", "Close drawer |  | button"])
        screen.evaluateScript("overlayProbe.drawer.set(false)")
        try await wait("the drawer is dismissed", { screen.presentedViewController == nil })
    }
}
