import XCTest

/// What a screen reader is told about the shared controls (stacksjs/stx#2184).
///
/// XCUITest reads the accessibility tree VoiceOver reads, so these check what
/// would be announced, not what was passed down as a prop: the element a
/// control is exposed as (its role), its label, its value and whether it can
/// be used, and the order the controls are reached in. They are not a
/// recording of VoiceOver speaking, which a simulator cannot run.
final class SharedAccessibilityUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["a11y-save"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.webViews.firstMatch.exists)
        return app
    }

    private func waitFor(_ element: XCUIElement, _ format: String, _ value: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: format, value), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed, "\(element) never had \(format) \(value)")
    }

    /// Every control is exposed as what it is, under the name a reader hears.
    func testEachControlHasItsRoleAndName() {
        let app = launch()
        XCTAssertEqual(app.buttons["a11y-save"].label, "Save changes")
        XCTAssertTrue(app.buttons["a11y-save"].isEnabled)

        // An icon button has no words of its own: the bound name is its name.
        let icon = app.buttons["a11y-icon"]
        XCTAssertTrue(icon.waitForExistence(timeout: 10))
        XCTAssertEqual(icon.label, "Add to favourites")

        let field = app.textFields["a11y-email"]
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        XCTAssertEqual(field.label, "Email address")
        XCTAssertEqual(field.placeholderValue, "you@example.com")

        let terms = app.descendants(matching: .any).matching(identifier: "a11y-terms").firstMatch
        XCTAssertTrue(terms.waitForExistence(timeout: 10))
        XCTAssertEqual(terms.label, "Accept the terms")

        let alerts = app.switches["a11y-alerts"]
        XCTAssertTrue(alerts.waitForExistence(timeout: 10))
        XCTAssertEqual(alerts.label, "Email alerts")
    }

    /// A reader hears the state a control is in, and hears it change.
    func testStateIsAnnouncedAndFollowsTheControl() {
        let app = launch()

        let icon = app.buttons["a11y-icon"]
        icon.tap()
        waitFor(icon, "label == %@", "Remove from favourites")

        let locked = app.buttons["a11y-locked"]
        XCTAssertTrue(locked.isEnabled)
        app.buttons["a11y-save"].tap()
        let dimmed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "isEnabled == NO"), object: locked)
        XCTAssertEqual(XCTWaiter.wait(for: [dimmed], timeout: 10), .completed, "A disabled button is still announced as usable")
        XCTAssertEqual(locked.label, "Delete account")

        let alerts = app.switches["a11y-alerts"]
        XCTAssertEqual(alerts.value as? String, "0")
        alerts.tap()
        waitFor(alerts, "value == %@", "1")

        let terms = app.descendants(matching: .any).matching(identifier: "a11y-terms").firstMatch
        let before = "\(terms.value ?? "nil")|\(terms.isSelected)"
        terms.tap()
        waitFor(app.staticTexts["a11y-summary"], "label == %@", "Summary: agreed, alerts on")
        let after = "\(terms.value ?? "nil")|\(terms.isSelected)"
        XCTAssertNotEqual(before, after, "A checked box is announced the same as an unchecked one: \(before)")

        let field = app.textFields["a11y-email"]
        field.tap()
        field.typeText("ada@example.com")
        waitFor(field, "value == %@", "ada@example.com")
    }

    /// The controls are reached top to bottom, in the order the screen was written.
    func testControlsAreReachedInTheOrderWritten() {
        let app = launch()
        let written = ["a11y-heading", "a11y-save", "a11y-icon", "a11y-locked", "a11y-email", "a11y-terms", "a11y-alerts", "a11y-summary"]
        let exposed = app.descendants(matching: .any).allElementsBoundByIndex
            .filter { written.contains($0.identifier) }
        // One element per control: a control exposed twice is read twice.
        XCTAssertEqual(exposed.map { $0.identifier }.sorted(), written.sorted())
        // A reader moves through elements by where they are on screen, top
        // first, so the order heard is the order of their top edges.
        let reached = exposed.sorted { $0.frame.minY < $1.frame.minY }.map { $0.identifier }
        XCTAssertEqual(reached, written)
    }

    /// The system's own accessibility audit of the screen, all of it.
    ///
    /// Everything it checks about what a reader is told (descriptions, traits,
    /// hit regions, which elements exist) has to come back clean. What it
    /// finds about how things are drawn is known and listed per appearance, so
    /// the audit fails on anything new and also when a listed finding is fixed
    /// and should come off the list (stacksjs/stx#2187).
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
            // A label inside a control has no identifier of its own: its words name it.
            let element = issue.element
            let name = (element?.identifier).flatMap { $0.isEmpty ? nil : $0 } ?? "\"\(element?.label ?? "")\""
            found.append("\(kind) \(name)")
            details.append("\(issue.compactDescription) on \(name) at \(element?.frame ?? .zero): \(issue.detailedDescription)")
            return true
        }
        // The field is 48 points tall whatever the text size, in either appearance.
        var known = ["textClipped a11y-email"]
        if XCUIDevice.shared.appearance == .dark {
            // The placeholder grey on the field's dark fill.
            known.append("contrast a11y-email")
        } else {
            // Not a shared control: the host's navigation title, which reads
            // "main" for a screen that names none, on its light bar.
            known.append("contrast \"main\"")
        }
        XCTAssertEqual(found.sorted(), known.sorted(), "The system audit found:\n" + details.joined(separator: "\n"))
    }
}
