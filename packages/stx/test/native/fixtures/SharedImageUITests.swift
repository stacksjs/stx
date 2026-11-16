import XCTest

final class SharedImageUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func waitForLabel(_ element: XCUIElement, _ label: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", label), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed)
    }

    func testSharedButtonsUpdateAndRemountTheRealImage() {
        let app = XCUIApplication()
        app.launch()
        waitForLabel(app.staticTexts["image-loads"], "Loads: 1")
        XCTAssertFalse(app.webViews.firstMatch.exists)
        XCTAssertTrue(app.images["shared-photo"].exists)
        XCTAssertTrue(app.images["legacy-photo"].exists)
        // Measured from a neighbour that scrolls with it: each button below
        // scrolls the screen first on a phone held sideways (#2184).
        let anchor = app.images["legacy-photo"]
        let frame = app.images["shared-photo"].frame(from: anchor)
        XCTAssertEqual(frame.width, 100, accuracy: 1)
        XCTAssertEqual(frame.height, 100, accuracy: 1)
        for action in ["image-fit", "image-position", "image-defaults"] {
            app.buttons[action].tap()
            waitForLabel(app.staticTexts["image-loads"], "Loads: 1")
            XCTAssertEqual(app.images["shared-photo"].frame(from: anchor), frame)
        }
        waitForLabel(app.staticTexts["image-fit-value"], "Fit: null")
        app.buttons["image-source"].tap()
        waitForLabel(app.staticTexts["image-loads"], "Loads: 2")
        app.buttons["image-toggle"].tap()
        XCTAssertFalse(app.images["shared-photo"].exists)
        app.buttons["image-fit"].tap()
        waitForLabel(app.staticTexts["image-fit-value"], "Fit: scale-down")
        app.buttons["image-toggle"].tap()
        XCTAssertTrue(app.images["shared-photo"].waitForExistence(timeout: 10))
        waitForLabel(app.staticTexts["image-errors"], "Errors: 0")
        XCTAssertEqual(app.images["shared-photo"].frame(from: anchor), frame)
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.lifetime = .keepAlways
        add(shot)
    }
}
