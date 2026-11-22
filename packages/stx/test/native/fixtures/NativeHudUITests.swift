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

    /// One pixel of an element, in sRGB, as 0–255 channels. Drawn into an sRGB
    /// context so the value compares with the hex the style was written as,
    /// whatever space the simulator renders in.
    private func pixel(_ element: XCUIElement, x fx: CGFloat, y fy: CGFloat) -> (r: Int, g: Int, b: Int) {
        let image = element.screenshot().image
        let attachment = XCTAttachment(image: image); attachment.name = element.identifier; attachment.lifetime = .keepAlways; add(attachment)
        guard let cg = image.cgImage, let space = CGColorSpace(name: CGColorSpace.sRGB) else { XCTFail("no pixels for \(element.identifier)"); return (0, 0, 0) }
        let width = cg.width, height = cg.height
        var bytes = [UInt8](repeating: 0, count: width * height * 4)
        guard let context = CGContext(data: &bytes, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: space, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
            XCTFail("no context for \(element.identifier)"); return (0, 0, 0)
        }
        context.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height))
        // CGContext rows run bottom-up; the screenshot's run top-down.
        let px = min(width - 1, Int(CGFloat(width) * fx)), py = min(height - 1, Int(CGFloat(height) * (1 - fy)))
        let at = (py * width + px) * 4
        return (Int(bytes[at]), Int(bytes[at + 1]), Int(bytes[at + 2]))
    }

    private func assertColor(_ found: (r: Int, g: Int, b: Int), _ hex: (Int, Int, Int), _ what: String, file: StaticString = #filePath, line: UInt = #line) {
        let off = max(abs(found.r - hex.0), abs(found.g - hex.1), abs(found.b - hex.2))
        XCTAssertLessThanOrEqual(off, 8, "\(what): drew \(found), expected \(hex)", file: file, line: line)
    }

    /// The native styles the compiler resolved through ts-css, as drawn
    /// (stacksjs/ts-css#38). Each check is one the old native table got wrong,
    /// so it fails on that table and passes only on the web's values.
    func testStylesResolveAsTheWebDoes() {
        let app = XCUIApplication()
        app.launch()
        let normal = app.staticTexts["type-normal"], tight = app.staticTexts["type-tight"]
        XCTAssertTrue(normal.waitForExistence(timeout: 15))
        app.reach(tight)

        // `leading-tight` beside `text-sm` is 17.5pt; the old table read it
        // against a fixed 16pt and made both lines 20, the same height.
        let normalHeight = normal.frame.height, tightHeight = tight.frame.height
        XCTAssertEqual(normalHeight, 20, accuracy: 1.5, "text-sm line height")
        XCTAssertEqual(tightHeight, 17.5, accuracy: 1.5, "text-sm leading-tight line height")
        XCTAssertLessThan(tightHeight, normalHeight - 1, "leading-tight is no shorter than text-sm alone")

        // v4 colours, in sRGB. red-500 was #ef4444 (239, 68, 68) in the old table.
        let red = app.otherElements["swatch-red"], blue = app.otherElements["swatch-blue"]
        app.reach(red)
        assertColor(pixel(red, x: 0.5, y: 0.5), (251, 44, 54), "bg-red-500")
        assertColor(pixel(blue, x: 0.5, y: 0.5), (43, 127, 255), "bg-blue-500")

        // A rounded clip cuts its child: red in the middle, not in the corner.
        let clip = app.otherElements["clip"]
        let middle = pixel(clip, x: 0.5, y: 0.5), corner = pixel(clip, x: 0.06, y: 0.06)
        XCTAssertTrue(middle.r > 200 && middle.g < 90 && middle.b < 90, "clip child not drawn: \(middle)")
        XCTAssertFalse(corner.r > 200 && corner.g < 90 && corner.b < 90, "rounded-full overflow-hidden did not clip the corner: \(corner)")

        // `disabled:opacity-40` draws the disabled control apart from the
        // enabled one. Over black it darkens and over white it pales, so the
        // check is that it moved, not which way.
        let disabled = app.buttons["swatch-disabled"]
        XCTAssertFalse(disabled.isEnabled, "the swatch is not disabled")
        let on = pixel(blue, x: 0.5, y: 0.5), off = pixel(disabled, x: 0.5, y: 0.5)
        let moved = max(abs(on.r - off.r), abs(on.g - off.g), abs(on.b - off.b))
        XCTAssertGreaterThan(moved, 60, "disabled:opacity-40 drew like the enabled swatch: \(off) vs \(on)")

        // Drawn, not dropped: a P3 host is sent yellow-400 as color(display-p3 …)
        // (stacksjs/ts-css#38), which an older one would draw near-black. The
        // simulator and its screenshots are sRGB, so this reads the clamp,
        // #fdc700; NativeHudNativeTests reads the view's colour to prove P3.
        let wide = app.otherElements["swatch-wide"]
        app.reach(wide)
        assertColor(pixel(wide, x: 0.5, y: 0.5), (253, 199, 0), "bg-yellow-400")
    }
}
