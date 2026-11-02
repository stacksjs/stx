import XCTest

final class SharedVideoUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func flags(_ value: String, in app: XCUIApplication) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", "Flags: " + value), object: app.staticTexts["video-flags"])
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed)
    }

    func testSharedButtonsUpdateFlagsAndRemountNativeVideo() {
        let app = XCUIApplication(); app.launch()
        flags("false,false,false,true", in: app)
        XCTAssertFalse(app.webViews.firstMatch.exists)
        XCTAssertTrue(app.descendants(matching: .any)["shared-movie"].firstMatch.exists)
        for (action, expected) in [("video-controls", "true,false,false,true"), ("video-autoplay", "true,true,false,true"), ("video-loop", "true,true,true,true"), ("video-muted", "true,true,true,false")] {
            app.buttons[action].tap(); flags(expected, in: app)
        }
        app.buttons["video-toggle"].tap()
        XCTAssertFalse(app.descendants(matching: .any)["shared-movie"].firstMatch.exists)
        app.buttons["video-defaults"].tap(); flags("null,null,null,null", in: app)
        app.buttons["video-toggle"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["shared-movie"].firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(app.descendants(matching: .any)["legacy-movie"].firstMatch.exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot)
    }
}
