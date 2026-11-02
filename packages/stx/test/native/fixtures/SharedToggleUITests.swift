import XCTest

final class SharedToggleUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func label(_ app: XCUIApplication, _ id: String, _ text: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", text), object: app.staticTexts[id])
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed)
    }

    private func launch() -> XCUIApplication {
        let app = XCUIApplication(); app.launch()
        label(app, "toggle-state", "State: false,false")
        XCTAssertFalse(app.webViews.firstMatch.exists)
        return app
    }

    private func enabled(_ element: XCUIElement, _ value: Bool) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in element.isEnabled == value }, object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed)
    }

    func testActualTapsDisabledMixedStateAndLegacyEventCounts() {
        let app = launch(), check = app.buttons["shared-check"], toggle = app.switches["shared-switch"]
        check.tap(); label(app, "toggle-state", "State: true,false")
        toggle.tap(); label(app, "toggle-state", "State: true,true")
        label(app, "toggle-events", "Events: 1,1,0")
        app.buttons["toggle-disable"].tap()
        enabled(check, false); enabled(toggle, false)
        check.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        label(app, "toggle-events", "Events: 1,1,0")
        app.buttons["toggle-false"].tap(); label(app, "toggle-state", "State: false,false")
        app.buttons["toggle-disable"].tap(); enabled(check, true); enabled(toggle, true)
        app.buttons["toggle-mixed"].tap()
        XCTAssertEqual(check.value as? String, "mixed")
        check.tap(); toggle.tap()
        label(app, "toggle-state", "State: true,true"); label(app, "toggle-events", "Events: 2,2,0")
        app.buttons["legacy-check"].tap(); app.switches["legacy-switch"].tap()
        label(app, "toggle-events", "Events: 2,2,2")
        app.buttons["toggle-defaults"].tap(); label(app, "toggle-state", "State: false,false")
        XCTAssertEqual(check.value as? String, "unchecked"); XCTAssertEqual(toggle.value as? String, "0")
        XCTAssertEqual(app.buttons["legacy-check"].value as? String, "checked")
        XCTAssertEqual(app.switches["legacy-switch"].value as? String, "1")
        label(app, "toggle-events", "Events: 2,2,2")
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot)
    }

    func testHiddenChangesAndDefaultsSurviveTwoRemounts() {
        let app = launch(), check = app.buttons["shared-check"], toggle = app.switches["shared-switch"]
        let frame = toggle.frame
        app.buttons["toggle-shown"].tap(); XCTAssertFalse(check.exists); XCTAssertFalse(toggle.exists)
        app.buttons["toggle-true"].tap(); app.buttons["toggle-disable"].tap(); app.buttons["toggle-mixed"].tap()
        app.buttons["toggle-shown"].tap()
        XCTAssertTrue(check.waitForExistence(timeout: 10)); enabled(check, false); enabled(toggle, false)
        XCTAssertEqual(check.value as? String, "mixed"); XCTAssertEqual(toggle.value as? String, "1")
        app.buttons["toggle-shown"].tap(); XCTAssertFalse(check.exists)
        app.buttons["toggle-defaults"].tap(); app.buttons["toggle-shown"].tap()
        XCTAssertTrue(check.waitForExistence(timeout: 10)); enabled(check, true); enabled(toggle, true)
        XCTAssertEqual(check.value as? String, "unchecked"); XCTAssertEqual(toggle.value as? String, "0")
        XCTAssertEqual(toggle.frame, frame)
        label(app, "toggle-events", "Events: 0,0,0")
    }
}
