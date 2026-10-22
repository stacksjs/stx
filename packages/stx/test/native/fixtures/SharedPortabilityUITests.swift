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
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.3)).tap()
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
}
