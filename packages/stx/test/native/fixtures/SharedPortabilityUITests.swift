import XCTest

final class SharedPortabilityUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["popup-trigger"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.webViews.firstMatch.exists)
        return app
    }

    private func waitForLabel(_ element: XCUIElement, _ label: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", label), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed,
                       "\(element.identifier) reads \(element.label), expected \(label)")
    }

    private func dismissOutside(_ app: XCUIApplication) {
        app.outside().tap()
    }

    func testPopoverEscapesClippingAndRetainsInteractiveState() {
        let app = launch()
        app.buttons["popup-trigger"].tap()
        let action = app.buttons["popup-action"]
        XCTAssertTrue(action.waitForExistence(timeout: 10))
        XCTAssertTrue(action.isHittable)
        XCTAssertGreaterThan(action.frame.maxY, app.otherElements["clip"].frame.maxY)
        action.tap()
        waitForLabel(app.staticTexts["popup-count"], "Clicks: 1")
        dismissOutside(app)
        XCTAssertTrue(action.waitForNonExistence(timeout: 10))
        app.buttons["popup-trigger"].tap()
        XCTAssertTrue(action.waitForExistence(timeout: 10))
        waitForLabel(app.staticTexts["popup-count"], "Clicks: 1")
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.lifetime = .keepAlways
        add(shot)
    }

    func testTooltipTouchToggleAndOutsideDismissal() {
        let app = launch()
        app.buttons["tooltip-trigger"].tap()
        waitForLabel(app.staticTexts["help-taps"], "Help taps: 1")
        let hint = app.staticTexts["Helpful native hint"]
        XCTAssertTrue(hint.waitForExistence(timeout: 10), app.debugDescription)
        dismissOutside(app)
        XCTAssertTrue(hint.waitForNonExistence(timeout: 10))
    }

    func testNestedDismissalAndDrawer() {
        let app = launch()
        app.buttons["open-dialog"].tap()
        let outer = app.buttons["open-inner"]
        XCTAssertTrue(outer.waitForExistence(timeout: 10), app.debugDescription)
        outer.tap()
        let inner = app.staticTexts["inner-content"]
        XCTAssertTrue(inner.waitForExistence(timeout: 10))
        dismissOutside(app)
        XCTAssertTrue(inner.waitForNonExistence(timeout: 10))
        XCTAssertTrue(outer.exists)
        dismissOutside(app)
        XCTAssertTrue(outer.waitForNonExistence(timeout: 10))
        app.buttons["open-drawer"].tap()
        let close = app.buttons["close-drawer"]
        XCTAssertTrue(close.waitForExistence(timeout: 10))
        close.tap()
        XCTAssertTrue(close.waitForNonExistence(timeout: 10))
    }

    func testSharedTabsTakeNativeTouches() {
        let app = launch()
        waitForLabel(app.staticTexts["selection"], "Selected: first")
        app.buttons["tab-second"].tap()
        waitForLabel(app.staticTexts["selection"], "Selected: second")
        app.buttons["tab-first"].tap()
        waitForLabel(app.staticTexts["selection"], "Selected: first")
    }

    /// The system's own accessibility audit of the screen and then of an
    /// open drawer. The tab strip and the drawer's close button are drawn on
    /// the translucent grey fill the audit misread on the text fields
    /// (stacksjs/stx#2187), and neither was on a screen it was run over.
    /// It reports no contrast on either, in either appearance. What it does
    /// find is listed, so anything new fails and a fixed finding has to come
    /// off the list.
    func testSystemAccessibilityAudit() throws {
        guard #available(iOS 17.0, *) else { throw XCTSkip("The accessibility audit needs iOS 17") }
        let app = launch()
        var (found, details) = try audit(app)
        app.buttons["open-drawer"].tap()
        XCTAssertTrue(app.buttons["close-drawer"].waitForExistence(timeout: 10))
        let drawer = try audit(app)
        found += drawer.found.map { "in the drawer: \($0)" }
        details += drawer.details.map { "in the drawer: \($0)" }
        // The host's navigation title ("main") failed contrast on its light
        // bar here (craft-native/craft#531) until the screen scrolled, as the
        // lists screen always has; over a scroll view the bar never draws the
        // title where the audit fails it.
        let known: [String] = []
        // A tab and the popover's button are the host's own button, a
        // UIButton with a title. On two of the first six runs, one in each
        // appearance, the audit said its title will not follow the reader's
        // text size, and that the popover's may be clipped when it does. The
        // other four runs of the same screen reported neither. The host scales a
        // button's font itself; the shared Button, drawn as a label in a
        // pressable box, is never reported.
        let sometimes = ["dynamicType \"First\"", "dynamicType \"Second\"", "dynamicType \"More actions\"", "textClipped \"More actions\""]
        Gate.checkAudit(found: found, known: known, sometimes: sometimes, details: details)
    }

    @available(iOS 17.0, *)
    private func audit(_ app: XCUIApplication) throws -> (found: [String], details: [String]) {
        var found: [String] = []
        var details: [String] = []
        try app.performAccessibilityAudit { issue in
            let kind: String
            switch issue.auditType {
            case .contrast: kind = "contrast"
            case .textClipped: kind = "textClipped"
            case .dynamicType: kind = "dynamicType"
            case .hitRegion: kind = "hitRegion"
            case .elementDetection: kind = "elementDetection"
            case .sufficientElementDescription: kind = "description"
            case .trait: kind = "trait"
            default: kind = issue.compactDescription
            }
            // A label inside a control has no identifier of its own: its words name it.
            let element = issue.element
            let name = (element?.identifier).flatMap { $0.isEmpty ? nil : $0 } ?? "\"\(element?.label ?? "")\""
            found.append("\(kind) \(name)")
            details.append("\(issue.compactDescription) on \(name) at \(element?.frame ?? .zero): \(issue.detailedDescription)")
            return true
        }
        return (found, details)
    }
}
