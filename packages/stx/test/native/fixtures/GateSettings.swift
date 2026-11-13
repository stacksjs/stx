import XCTest

/// What every UI suite needs to run unchanged on any phone, held either way.
extension XCUIApplication {
    /// Bring a control onto the screen the way a person does, by scrolling
    /// towards it. On a small phone, or one on its side, most of a screen is
    /// below the fold.
    func reach(_ element: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
        var swipes = 0
        while !element.isHittable, swipes < 24 {
            // Drag inside what can be seen: with the keyboard up on a phone
            // held sideways that is a strip under the title, and a swipe
            // from the middle of the screen would land on the keys.
            let keyboard = keyboards.firstMatch
            let bottom = keyboard.exists && keyboard.frame.height > 0 ? keyboard.frame.minY : frame.maxY
            let top = frame.minY + min(110, frame.height * 0.25)
            // Under half of it at a time, so a control is not carried from
            // below the screen to above it in one go.
            let span = max(48, bottom - top)
            let upper = coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: frame.midX, dy: top + span * 0.2))
            let lower = coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: frame.midX, dy: top + span * 0.6))
            let above = element.exists && element.frame.midY < top
            if above { upper.press(forDuration: 0.05, thenDragTo: lower) } else { lower.press(forDuration: 0.05, thenDragTo: upper) }
            swipes += 1
        }
        XCTAssertTrue(element.isHittable, "\(element) cannot be scrolled onto the screen", file: file, line: line)
    }
}

enum Gate {
    /// The phone, orientation, direction and text size the known lists were
    /// written against. The gate says when a run is anything else.
    static var isReferenceRun: Bool { ProcessInfo.processInfo.environment["STX_REFERENCE"] != "0" }

    /// Hold the system accessibility audit to a list of known findings.
    ///
    /// Nothing may be found that is not on the list. On the reference phone
    /// the reverse holds too, so a finding that has been fixed has to come off
    /// it. Elsewhere it cannot: the audit reads what is on the screen, and a
    /// smaller or turned screen shows less of it. `elsewhere` lists what only
    /// such a screen brings out, as a narrower field does a long placeholder.
    static func checkAudit(found: [String], known: [String], elsewhere: [String] = [], details: [String], file: StaticString = #filePath, line: UInt = #line) {
        let report = "The system audit found:\n" + details.joined(separator: "\n")
        if isReferenceRun {
            XCTAssertEqual(found.sorted(), known.sorted(), report, file: file, line: line)
        } else {
            XCTAssertEqual(found.filter { !known.contains($0) && !elsewhere.contains($0) }.sorted(), [], report, file: file, line: line)
        }
    }
}

/// Settings the iOS gate asks for that a simulator cannot be put into from
/// outside: which way up the device is held. The gate names them in the test
/// runner's environment and this applies them before every UI test, so the
/// suites themselves stay as they are and run unchanged in either.
@objc(GateSettings)
final class GateSettings: NSObject, XCTestObservation {
    override init() {
        super.init()
        XCTestObservationCenter.shared.addTestObserver(self)
    }

    func testCaseWillStart(_ testCase: XCTestCase) {
        let landscape = ProcessInfo.processInfo.environment["STX_ORIENTATION"] == "landscape"
        let wanted: UIDeviceOrientation = landscape ? .landscapeLeft : .portrait
        if XCUIDevice.shared.orientation != wanted { XCUIDevice.shared.orientation = wanted }
    }
}
