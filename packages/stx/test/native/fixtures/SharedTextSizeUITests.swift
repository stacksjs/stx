import XCTest

/// The shared controls at the largest accessibility text size
/// (stacksjs/stx#2184): each one can still be reached and used.
final class SharedTextSizeUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func waitForLabel(_ element: XCUIElement, _ label: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", label), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed, "\(element.identifier) reads \(element.label), expected \(label)")
    }

    /// Bring a control onto the screen the way a person does, by scrolling.
    private func reach(_ element: XCUIElement, in app: XCUIApplication) {
        var swipes = 0
        while !element.isHittable, swipes < 12 {
            // Above the screen or below it: move the page the other way.
            if element.frame.midY < app.frame.midY { app.swipeDown(velocity: .slow) } else { app.swipeUp(velocity: .slow) }
            swipes += 1
        }
        if !element.isHittable { let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot) }
        XCTAssertTrue(element.isHittable, "\(element) cannot be scrolled onto the screen: it is at \(element.frame)")
    }

    func testEveryControlCanBeReachedAndUsed() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.textFields["size-name"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.webViews.firstMatch.exists)

        let name = app.textFields["size-name"]
        name.tap()
        app.typeText("Ada")
        let password = app.secureTextFields["size-password"]
        reach(password, in: app)
        password.tap()
        app.typeText("pw")
        // What was typed is in the fields, the password as bullets.
        XCTAssertEqual(password.value as? String, "••")
        let typed = XCTAttachment(screenshot: app.screenshot()); typed.lifetime = .keepAlways; add(typed)
        // Put the keyboard away: it covers half the screen at this size.
        app.typeText("\n")

        let terms = app.descendants(matching: .any).matching(identifier: "size-terms").firstMatch
        reach(terms, in: app)
        terms.tap()
        let alerts = app.switches["size-alerts"]
        reach(alerts, in: app)
        alerts.tap()
        let row = app.buttons["size-row"]
        reach(row, in: app)
        row.tap()
        let save = app.buttons["size-save"]
        reach(save, in: app)
        save.tap()

        let summary = app.staticTexts["size-summary"]
        waitForLabel(summary, "Saved 1, opened 1, Ada, 2, agreed, on")
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot)
    }
}
