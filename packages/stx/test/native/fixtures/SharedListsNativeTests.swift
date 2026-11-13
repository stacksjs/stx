import UIKit
import XCTest
@testable import StxPortability

/// What VoiceOver stops on in the shared lists, the filter row and the pager
/// (stacksjs/stx#2184).
@MainActor
final class SharedListsNativeTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func find(_ id: String, in view: UIView) -> UIView? {
        if view.accessibilityIdentifier == id { return view }
        return view.subviews.lazy.compactMap { self.find(id, in: $0) }.first
    }

    private func wait(_ message: String, _ condition: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(10)
        while !condition(), Date() < deadline { try await Task.sleep(nanoseconds: 20_000_000) }
        XCTAssertTrue(condition(), message)
    }

    private func host() async throws -> (CraftNativeScreenController, UIWindow) {
        let screen = CraftNativeScreenController(config: CraftConfig())
        // In the app's own scene: a window outside one is never drawn, so the
        // pager's move to another page never runs and never settles there.
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        let window = scene.map { UIWindow(windowScene: $0) } ?? UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = screen; window.makeKeyAndVisible(); screen.loadViewIfNeeded()
        try await wait("the lists and the pager's dots mount", {
            self.find("list-profile", in: screen.view) != nil && SpokenStops.of(screen.view).contains("Go to page 3 |  | button")
        })
        window.layoutIfNeeded(); screen.view.layoutIfNeeded()
        return (screen, window)
    }

    /// A row that goes somewhere is one stop that says so, the filter in
    /// force says it is selected, and the pager is a named group whose page
    /// and dots are inside it. The pager used to be a single stop called
    /// "Tour": naming the box around it hid everything in the box.
    func testAReaderReachesEveryRowFilterPageAndDot() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        XCTAssertEqual(SpokenStops.of(screen.view), [
            "Filters |  | group",
            "People |  | button, selected",
            "Workouts |  | button",
            "Exercises |  | group",
            "Remove squats |  | button",
            "ACCOUNT |  | ",
            "Profile, Name and photo |  | button",
            "Plan |  | ",
            "Pro |  | ",
            "Signed in |  | ",
            "Inbox |  | ",
            "Welcome, From HQ |  | link",
            "Second |  | ",
            "2m |  | ",
            "Tour |  | group",
            "One |  | ",
            "Go to page 1 |  | button, selected",
            "Go to page 2 |  | button",
            "Go to page 3 |  | button",
            "Opened: 0, page 1 |  | ",
        ])
    }

    /// Only the page showing is read, and the dot for it is the selected one.
    func testThePageShowingIsTheOneRead() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        screen.evaluateScript("listProbe.page.set(1)")
        try await wait("the second page and its dot are the ones announced, not \(SpokenStops.of(screen.view).suffix(7))", {
            let stops = SpokenStops.of(screen.view)
            return stops.contains("Two |  | ") && stops.contains("Go to page 2 |  | button, selected")
        })
        let stops = SpokenStops.of(screen.view)
        XCTAssertFalse(stops.contains("One |  | "), "\(stops)")
        XCTAssertFalse(stops.contains("Three |  | "), "\(stops)")
        XCTAssertTrue(stops.contains("Go to page 1 |  | button"), "\(stops)")
        XCTAssertTrue(stops.contains("Opened: 0, page 2 |  | "), "\(stops)")
    }
}
