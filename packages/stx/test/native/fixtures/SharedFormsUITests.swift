import XCTest

/// A form built from the shared fields, as a person and a screen reader meet
/// it on iOS (stacksjs/stx#2184).
final class SharedFormsUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.textFields["form-name"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.webViews.firstMatch.exists)
        return app
    }

    private func waitFor(_ element: XCUIElement, _ format: String, _ value: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: format, value), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed, "\(element) never had \(format) \(value); it has label \(element.label), value \(String(describing: element.value))")
    }

    /// A field is announced by its label, never by its placeholder, and the
    /// picker by its label with the choice as its value.
    func testEachFieldIsNamedByItsLabel() {
        let app = launch()
        let name = app.textFields["form-name"]
        XCTAssertEqual(name.label, "Full name")
        XCTAssertEqual(name.placeholderValue, "Ada Lovelace")
        XCTAssertEqual(app.textFields["form-email"].label, "Email")
        XCTAssertEqual(app.secureTextFields["form-password"].label, "Password")
        let sport = app.buttons["form-sport"]
        XCTAssertEqual(sport.label, "Sport")
        XCTAssertEqual(sport.value as? String, "Select an option")
        XCTAssertTrue(app.buttons["form-period-week"].isSelected)
        XCTAssertFalse(app.buttons["form-period-all"].isEnabled)
    }

    /// Everything typed or chosen reaches the page, the password included.
    func testWhatIsTypedAndChosenReachesThePage() {
        let app = launch()
        let summary = app.staticTexts["form-summary"]

        app.textFields["form-name"].tap()
        app.typeText("Ada")
        app.textFields["form-email"].tap()
        // The address keyboard: "@" is on its first page, as it is not on the plain one.
        XCTAssertTrue(app.keys["@"].waitForExistence(timeout: 10))
        app.typeText("ada@example.com")
        waitFor(app.textFields["form-email"], "value == %@", "ada@example.com")

        let password = app.secureTextFields["form-password"]
        app.reach(password)
        password.tap()
        app.typeText("hunter2")
        waitFor(app.secureTextFields["form-password"], "value == %@", "•••••••")
        // Hidden: a reader hears bullets, not the password.
        XCTAssertNotEqual(password.value as? String, "hunter2")

        // Asked to show it, the button says what it will now do, and the
        // same field holds the same characters in the clear.
        app.buttons["Show password"].tap()
        XCTAssertTrue(app.buttons["Hide password"].waitForExistence(timeout: 10))
        let shown = app.textFields["form-password"]
        XCTAssertTrue(shown.waitForExistence(timeout: 10))
        waitFor(shown, "value == %@", "hunter2")
        app.buttons["Hide password"].tap()
        XCTAssertTrue(app.secureTextFields["form-password"].waitForExistence(timeout: 10))

        // Put the keyboard away: on a small phone it covers the rest of the form.
        app.typeText("\n")
        let sport = app.buttons["form-sport"]
        app.reach(sport)
        sport.tap()
        let run = app.buttons["Run"]
        XCTAssertTrue(run.waitForExistence(timeout: 10))
        run.tap()
        waitFor(sport, "value == %@", "Run")
        XCTAssertEqual(sport.label, "Sport")

        app.reach(app.buttons["form-period-month"])
        app.buttons["form-period-month"].tap()
        app.reach(summary)
        waitFor(summary, "label == %@", "Summary: Ada, ada@example.com, 7 characters, run, month")
        XCTAssertTrue(app.buttons["form-period-month"].isSelected)
        XCTAssertFalse(app.buttons["form-period-week"].isSelected)
        // A dimmed segment takes no touch.
        app.buttons["form-period-all"].tap()
        XCTAssertTrue(app.buttons["form-period-month"].isSelected)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot)
    }

    /// The field at the bottom of a form is the one a keyboard covers. It is
    /// moved above the keyboard when it takes focus, and its return key puts
    /// the keyboard away.
    func testTheLastFieldStaysAboveTheKeyboard() {
        let app = launch()
        let notes = app.textFields["form-notes"]
        app.reach(notes)
        notes.tap()
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 10))
        app.typeText("Remember")
        waitFor(notes, "value == %@", "Remember")
        XCTAssertLessThanOrEqual(notes.frame.maxY, keyboard.frame.minY + 1, "The field being typed in is under the keyboard")
        XCTAssertTrue(notes.isHittable)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot)
        app.typeText("\n")
        XCTAssertTrue(keyboard.waitForNonExistence(timeout: 10), "Done left the keyboard up")
    }

    /// The system's own accessibility audit of the form, all of it. What it
    /// finds is listed, so a new finding fails and a fixed one has to come off
    /// the list (stacksjs/stx#2187 for the placeholder grey on the dark fill).
    func testSystemAccessibilityAudit() throws {
        guard #available(iOS 17.0, *) else { throw XCTSkip("The accessibility audit needs iOS 17") }
        let app = launch()
        var found: [String] = []
        var details: [String] = []
        try app.performAccessibilityAudit { issue in
            let kind: String
            switch issue.auditType {
            case .contrast: kind = "contrast"
            case .textClipped: kind = "textClipped"
            case .dynamicType: kind = "dynamicType"
            case .hitRegion: kind = "hitRegion"
            case .elementDetection: kind = "elementDetection"
            case .sufficientElementDescription: kind = "description"
            case .trait: kind = "trait"
            default: kind = issue.compactDescription
            }
            let element = issue.element
            let name = (element?.identifier).flatMap { $0.isEmpty ? nil : $0 } ?? "\"\(element?.label ?? "")\""
            found.append("\(kind) \(name)")
            details.append("\(issue.compactDescription) on \(name) at \(element?.frame ?? .zero): \(issue.detailedDescription)")
            return true
        }
        let fields = ["form-name", "form-email", "form-password"]
        // A placeholder is one line. The password's, beside its reveal
        // button, is too long for that line at the largest text sizes.
        var known = ["textClipped form-password"]
        if XCUIDevice.shared.appearance == .dark {
            // The placeholder grey on the fields' dark fill.
            known += fields.map { "contrast \($0)" }
        }
        Gate.checkAudit(found: found, known: known, details: details)
    }
}
