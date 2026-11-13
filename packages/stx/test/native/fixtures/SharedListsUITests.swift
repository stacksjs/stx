import XCTest

/// The shared lists, filter row and pager, as a person and a screen reader
/// meet them on iOS (stacksjs/stx#2184).
final class SharedListsUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["list-profile"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.webViews.firstMatch.exists)
        return app
    }

    private func waitForLabel(_ element: XCUIElement, _ label: String) {
        let check = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", label), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [check], timeout: 10), .completed, "\(element.identifier) reads \(element.label), expected \(label)")
    }

    /// Rows and filters are announced as what they are: a row that opens
    /// something is a button read in one breath, a row that goes somewhere is
    /// a link, and the filter in force is the selected one.
    func testRowsAndFiltersSayWhatTheyAre() {
        let app = launch()
        XCTAssertEqual(app.buttons["list-profile"].label, "Profile, Name and photo")
        XCTAssertTrue(app.links["Welcome, From HQ"].exists)
        XCTAssertTrue(app.buttons["People"].isSelected)
        XCTAssertFalse(app.buttons["Workouts"].isSelected)
        XCTAssertTrue(app.buttons["Workouts"].isHittable)

        app.buttons["list-profile"].tap()
        app.reach(app.staticTexts["list-summary"])
        waitForLabel(app.staticTexts["list-summary"], "Opened: 1, page 1")
    }

    /// The pager moves by its dots and by a swipe, and says which page it is on.
    func testThePagerFollowsItsDotsAndASwipe() {
        let app = launch()
        let summary = app.staticTexts["list-summary"]
        let first = app.buttons["Go to page 1"], second = app.buttons["Go to page 2"], third = app.buttons["Go to page 3"]
        XCTAssertTrue(first.waitForExistence(timeout: 10))
        app.reach(first)
        XCTAssertTrue(first.isSelected)
        XCTAssertTrue(app.staticTexts["list-page-one"].isHittable)

        second.tap()
        waitForLabel(summary, "Opened: 0, page 2")
        XCTAssertTrue(second.isSelected)
        XCTAssertFalse(first.isSelected)
        XCTAssertTrue(app.staticTexts["list-page-two"].waitForExistence(timeout: 10))

        app.staticTexts["list-page-two"].swipeLeft()
        waitForLabel(summary, "Opened: 0, page 3")
        XCTAssertTrue(third.isSelected)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot)
    }

    /// The system's own accessibility audit of the screen, all of it, with
    /// what it finds listed so that anything new fails.
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
            found.append("\(kind) \"\(element?.label.trimmingCharacters(in: .whitespaces) ?? "")\"")
            details.append("\(issue.compactDescription) on \(element?.identifier ?? "") \"\(element?.label ?? "")\" at \(element?.frame ?? .zero): \(issue.detailedDescription)")
            return true
        }
        // Captions set at 13 points, which the audit reports as too small a
        // target. They are words, not controls: nothing happens on a tap.
        var known = ["ACCOUNT", "Signed in", "Second", "2m"].map { "hitRegion \"\($0)\"" }
        if XCUIDevice.shared.appearance != .dark {
            // The grey a row's value and time are set in, on white (stacksjs/stx#2187).
            known += ["contrast \"Pro\"", "contrast \"2m\""]
        }
        Gate.checkAudit(found: found, known: known, details: details)
    }
}
