import XCTest

final class NativeHudUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func wait(_ element: XCUIElement, _ key: String, _ value: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "%K == %@", key, value), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed,
                       "\(element.identifier): expected \(key) = \(value)")
    }

    func testImportedStateEventsKeyedInputAndFailureFeedback() {
        let app = XCUIApplication()
        app.launch()
        let field = app.textFields["draft-a"]
        XCTAssertTrue(field.waitForExistence(timeout: 15))
        XCTAssertFalse(app.webViews.firstMatch.exists)
        field.tap()
        field.typeText("Ada")
        wait(field, "value", "Ada")
        wait(app.staticTexts["echo-a"], "label", "Draft: Ada")
        app.buttons["increment"].tap()
        wait(app.staticTexts["count"], "label", "Count: 1")
        wait(app.staticTexts["events"], "label", "Events: 1")
        app.buttons["invalid"].tap()
        wait(app.staticTexts["error"], "label", "Invalid amount")
        wait(app.staticTexts["count"], "label", "Count: 1")
        wait(app.staticTexts["events"], "label", "Events: 1")
        app.buttons["reorder"].tap()
        XCTAssertTrue(app.keyboards.firstMatch.exists, "reordering dismissed the focused control's keyboard")
        field.typeText("x")
        wait(field, "value", "Adax")
        wait(app.staticTexts["echo-a"], "label", "Draft: Adax")
        wait(app.staticTexts["subscriptions"], "label", "Subscriptions: 1")
        for cycle in 0..<2 {
            app.buttons["toggle-hud"].tap()
            wait(app.staticTexts["subscriptions"], "label", "Subscriptions: 0")
            XCTAssertFalse(app.textFields["draft-a"].exists)
            app.buttons["external-increment"].tap()
            wait(app.staticTexts["subscriptions"], "label", "Subscriptions: 0")
            app.buttons["toggle-hud"].tap()
            wait(app.staticTexts["subscriptions"], "label", "Subscriptions: 1")
            wait(app.staticTexts["events"], "label", "Events: 0")
            wait(app.textFields["draft-a"], "value", "Adax")
            wait(app.staticTexts["count"], "label", "Count: \(2 + cycle * 2)")
            app.buttons["increment"].tap()
            wait(app.staticTexts["events"], "label", "Events: 1")
            wait(app.staticTexts["count"], "label", "Count: \(3 + cycle * 2)")
        }
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.lifetime = .keepAlways
        add(shot)
    }
}
