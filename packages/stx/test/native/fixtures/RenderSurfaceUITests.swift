import XCTest

/// A RenderSurface drawn by the host (stacksjs/stx#2108, craft-native/craft#578):
/// the frame the page presents is on the screen, the surface refuses frames
/// once removed, is ready again when back, and a second surface of its name
/// is reported while the first keeps drawing.
final class RenderSurfaceUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func wait(_ element: XCUIElement, _ key: String, _ value: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "%K == %@", key, value), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 15), .completed,
                       "\(element.identifier): expected \(key) = \(value), was \(element.label)")
    }

    private func waitFor(_ element: XCUIElement, labelBeginning prefix: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label BEGINSWITH %@", prefix), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 15), .completed,
                       "\(element.identifier): expected a label beginning \(prefix), was \(element.label)")
    }

    /// How much of the screen is the red frame the page presents, from 0 to 1.
    /// Counted over the whole screenshot rather than read at the surface's
    /// middle: held sideways, a simulator's screenshot comes back rotated
    /// against the app's coordinates, so a point in them lands elsewhere.
    private func redShare(_ app: XCUIApplication) -> Double {
        let shot = app.screenshot()
        let attachment = XCTAttachment(screenshot: shot); attachment.lifetime = .keepAlways; add(attachment)
        guard let cg = shot.image.cgImage else { XCTFail("no screenshot pixels"); return 0 }
        let side = 120
        var pixels = [UInt8](repeating: 0, count: side * side * 4)
        guard let context = CGContext(data: &pixels, width: side, height: side, bitsPerComponent: 8, bytesPerRow: side * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
            XCTFail("no context"); return 0
        }
        context.interpolationQuality = .none
        context.draw(cg, in: CGRect(x: 0, y: 0, width: side, height: side))
        var red = 0
        for i in stride(from: 0, to: pixels.count, by: 4) where pixels[i] > 200 && pixels[i + 1] < 60 && pixels[i + 2] < 60 { red += 1 }
        return Double(red) / Double(side * side)
    }

    /// Back to the top of the page, where the surface is. Its own element has
    /// no activation point for XCUITest to scroll it in by, so the page is
    /// scrolled instead.
    private func toTop(_ app: XCUIApplication) {
        let status = app.staticTexts["surface-status"]
        for _ in 0..<6 where !(status.exists && status.isHittable && status.frame.minY > 150) {
            app.scrollViews.firstMatch.swipeDown()
        }
    }

    /// The surface is at least 160 points tall and most of the screen wide,
    /// upright or sideways: well over a twentieth of the screen.
    private func assertRed(_ app: XCUIApplication, _ when: String) {
        var share = 0.0
        for _ in 0..<20 {
            share = redShare(app)
            if share > 0.05 { return }
            usleep(250_000)
        }
        XCTFail("\(when): \(Int(share * 100))% of the screen is the red frame the surface was given")
    }

    func testTheHostDrawsEachFrameAndAnswersForItsName() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertFalse(app.webViews.firstMatch.exists)
        let status = app.staticTexts["surface-status"]
        XCTAssertTrue(status.waitForExistence(timeout: 20))
        wait(app.staticTexts["surface-host"], "label", "Host: native")
        // Ready with a size, and the host took the frame.
        waitFor(status, labelBeginning: "ready ")
        XCTAssertTrue(status.label.hasSuffix(" true"), status.label)
        let surface = app.descendants(matching: .any)["game-surface"]
        XCTAssertTrue(surface.waitForExistence(timeout: 10))
        assertRed(app, "after ready")

        // A second surface of the same name stays blank and says so; the first keeps drawing.
        app.reach(app.buttons["add-twin"])
        app.buttons["add-twin"].tap()
        wait(app.staticTexts["twin-status"], "label", "Twin: DUPLICATE")
        toTop(app)
        assertRed(app, "beside a duplicate")

        // Removed: the host refuses its name from then on.
        app.reach(app.buttons["remove-surface"])
        app.buttons["remove-surface"].tap()
        wait(app.staticTexts["removed-status"], "label", "Removed: NOT_FOUND")

        // Back: a new surface of the same name, with a ready of its own.
        app.reach(app.buttons["restore-surface"])
        app.buttons["restore-surface"].tap()
        wait(app.staticTexts["surface-readies"], "label", "Ready: 2")
        XCTAssertTrue(status.label.hasSuffix(" true"), status.label)
        XCTAssertTrue(app.descendants(matching: .any)["game-surface"].waitForExistence(timeout: 10))
        toTop(app)
        assertRed(app, "after coming back")
    }
}
