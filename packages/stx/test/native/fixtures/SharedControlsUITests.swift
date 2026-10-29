import XCTest

final class SharedControlsUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["increment"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.webViews.firstMatch.exists)
        return app
    }

    private func waitForLabel(_ element: XCUIElement, _ label: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", label), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed)
    }

    func testSharedInputKeepsValueAndKeyboardAcrossButtonUpdates() {
        let app = launch()
        let field = app.textFields["name-input"]
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        field.tap()
        field.typeText("Ada")
        waitForLabel(app.staticTexts["name"], "Hello Ada")
        for count in 1...3 {
            app.buttons["increment"].tap()
            waitForLabel(app.staticTexts["count"], "Count: \(count)")
            XCTAssertTrue(app.keyboards.firstMatch.exists)
            field.typeText("x")
            waitForLabel(app.staticTexts["name"], "Hello Ada" + String(repeating: "x", count: count))
        }
    }

    func testSharedCardDensityChangesRealLayoutAndRestoresIt() {
        let app = launch()
        let card = app.otherElements["token-card"]
        let content = app.staticTexts["token-content"]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        XCTAssertTrue(content.waitForExistence(timeout: 10))
        XCTAssertEqual(content.frame.minX - card.frame.minX, 24, accuracy: 1)
        app.buttons["density-toggle"].tap()
        waitForLabel(app.staticTexts["density"], "Density: compact")
        XCTAssertEqual(content.frame.minX - card.frame.minX, 8, accuracy: 1)
        app.buttons["density-toggle"].tap()
        waitForLabel(app.staticTexts["density"], "Density: comfortable")
        XCTAssertEqual(content.frame.minX - card.frame.minX, 24, accuracy: 1)
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.lifetime = .keepAlways
        add(shot)
    }
}
