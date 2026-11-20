import XCTest

final class NativeHudUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func wait(_ element: XCUIElement, _ key: String, _ value: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "%K == %@", key, value), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed,
                       "\(element.identifier): expected \(key) = \(value)")
    }

    /// Scroll the button above the keyboard first: held sideways, the
    /// keyboard covers the panel, and a blind tap lands on a key.
    private func press(_ app: XCUIApplication, _ id: String) {
        let button = app.buttons[id]
        app.reach(button)
        button.tap()
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
        press(app, "increment")
        wait(app.staticTexts["count"], "label", "Count: 1")
        wait(app.staticTexts["events"], "label", "Events: 1")
        press(app, "invalid")
        wait(app.staticTexts["error"], "label", "Invalid amount")
        wait(app.staticTexts["count"], "label", "Count: 1")
        wait(app.staticTexts["events"], "label", "Events: 1")
        press(app, "reorder")
        XCTAssertTrue(app.keyboards.firstMatch.exists, "reordering dismissed the focused control's keyboard")
        field.typeText("x")
        wait(field, "value", "Adax")
        wait(app.staticTexts["echo-a"], "label", "Draft: Adax")
        wait(app.staticTexts["subscriptions"], "label", "Subscriptions: 1")
        for cycle in 0..<2 {
            press(app, "toggle-hud")
            wait(app.staticTexts["subscriptions"], "label", "Subscriptions: 0")
            XCTAssertFalse(app.textFields["draft-a"].exists)
            press(app, "external-increment")
            wait(app.staticTexts["subscriptions"], "label", "Subscriptions: 0")
            press(app, "toggle-hud")
            wait(app.staticTexts["subscriptions"], "label", "Subscriptions: 1")
            wait(app.staticTexts["events"], "label", "Events: 0")
            wait(app.textFields["draft-a"], "value", "Adax")
            wait(app.staticTexts["count"], "label", "Count: \(2 + cycle * 2)")
            press(app, "increment")
            wait(app.staticTexts["events"], "label", "Events: 1")
            wait(app.staticTexts["count"], "label", "Count: \(3 + cycle * 2)")
        }
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.lifetime = .keepAlways
        add(shot)
    }
}
