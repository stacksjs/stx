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
            // Hold before letting go. A drag released at speed coasts on, and
            // in the strip a keyboard leaves on a phone held sideways it
            // carried the control past the strip every time, up and down.
            let (from, to) = above ? (upper, lower) : (lower, upper)
            from.press(forDuration: 0.05, thenDragTo: to, withVelocity: .default, thenHoldForDuration: 0.3)
            swipes += 1
        }
        XCTAssertTrue(element.isHittable, "\(element) cannot be scrolled onto the screen", file: file, line: line)
    }

    /// A point on the screen, away from any control and from anything
    /// floating over it, that a person would tap to dismiss: the right-hand
    /// edge of the screen's content, in its padding. Measured from the root
    /// scroll view, since on a phone held sideways the window's edge is the
    /// safe area beside the content, which the screen never sees.
    func outside(atHeight fraction: CGFloat = 0.3) -> XCUICoordinate {
        let root = scrollViews.firstMatch
        let area = root.exists && root.frame.width > 0 ? root.frame : frame
        return coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: area.maxX - 8, dy: frame.minY + frame.height * fraction))
    }
}

extension XCUIElement {
    /// Where this element is drawn, measured from one that scrolls with it.
    /// A tap on a control below the fold scrolls the screen first, so a frame
    /// on the screen alone changes when nothing on the page moved.
    func frame(from anchor: XCUIElement) -> CGRect {
        frame.offsetBy(dx: -anchor.frame.minX, dy: -anchor.frame.minY)
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
    ///
    /// `sometimes` lists what the audit reports on one run and not on the
    /// next of the same screen, on any phone. Such a finding can be neither
    /// required nor refused, so it is the one kind that can go stale here.
    static func checkAudit(found: [String], known: [String], elsewhere: [String] = [], sometimes: [String] = [], details: [String], file: StaticString = #filePath, line: UInt = #line) {
        let report = "The system audit found:\n" + details.joined(separator: "\n")
        let steady = found.filter { !sometimes.contains($0) }
        if isReferenceRun {
            XCTAssertEqual(steady.sorted(), known.sorted(), report, file: file, line: line)
        } else {
            XCTAssertEqual(steady.filter { !known.contains($0) && !elsewhere.contains($0) }.sorted(), [], report, file: file, line: line)
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
