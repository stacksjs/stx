import XCTest

/// The shared controls at the largest accessibility text size
/// (stacksjs/stx#2184): each one can still be reached and used.
final class SharedTextSizeUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func waitForLabel(_ element: XCUIElement, _ label: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", label), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed, "\(element.identifier) reads \(element.label), expected \(label)")
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
        app.reach(password)
        password.tap()
        app.typeText("pw")
        // What was typed is in the fields, the password as bullets.
        XCTAssertEqual(password.value as? String, "••")
        let typed = XCTAttachment(screenshot: app.screenshot()); typed.lifetime = .keepAlways; add(typed)
        // Put the keyboard away: it covers half the screen at this size.
        app.typeText("\n")

        let terms = app.descendants(matching: .any).matching(identifier: "size-terms").firstMatch
        app.reach(terms)
        terms.tap()
        let alerts = app.switches["size-alerts"]
        app.reach(alerts)
        alerts.tap()
        let row = app.buttons["size-row"]
        app.reach(row)
        row.tap()
        let save = app.buttons["size-save"]
        app.reach(save)
        save.tap()

        let summary = app.staticTexts["size-summary"]
        waitForLabel(summary, "Saved 1, opened 1, Ada, 2, agreed, on")
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot)
    }
}
