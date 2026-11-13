import UIKit
import XCTest
@testable import StxPortability

/// What VoiceOver stops on in a form of shared fields, and how each field is
/// set up for what goes in it (stacksjs/stx#2184).
@MainActor
final class SharedFormsNativeTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func find(_ id: String, in view: UIView) -> UIView? {
        if view.accessibilityIdentifier == id { return view }
        return view.subviews.lazy.compactMap { self.find(id, in: $0) }.first
    }

    private func wait(_ message: String, _ condition: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(10)
        while !condition(), Date() < deadline { try await Task.sleep(nanoseconds: 20_000_000) }
        XCTAssertTrue(condition(), message)
    }

    private func host() async throws -> (CraftNativeScreenController, UIWindow) {
        let screen = CraftNativeScreenController(config: CraftConfig())
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = screen; window.makeKeyAndVisible(); screen.loadViewIfNeeded()
        try await wait("the form mounts with its fields named", {
            (self.find("form-name", in: screen.view) as? UITextField)?.accessibilityLabel == "Full name" &&
            self.find("form-sport", in: screen.view)?.accessibilityValue == "Select an option"
        })
        window.layoutIfNeeded(); screen.view.layoutIfNeeded()
        return (screen, window)
    }

    /// Each field is one stop, named by its label. The captions drawn above
    /// the fields are not stops of their own: they were, and a field was then
    /// announced by its placeholder with its name read as a separate line.
    func testAReaderStopsOnceOnEachFieldUnderItsLabel() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        XCTAssertEqual(SpokenStops.of(screen.view), [
            "Full name |  | field",
            "Email |  | field",
            "Password |  | secure field",
            "Show password |  | button",
            "Sport | Select an option | button",
            "Period |  | group",
            "This week |  | button, selected",
            "This month |  | button",
            "All time |  | button, dimmed",
            "Notes |  | field",
            "Summary: , , 0 characters, no sport, week |  | ",
        ])
    }

    /// A field asks for the keyboard and the saved value its content calls
    /// for: an address keyboard that neither capitalises nor corrects for an
    /// email, and a hidden entry the system can fill for a password.
    func testEachFieldIsSetUpForItsContent() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        let name = try XCTUnwrap(find("form-name", in: screen.view) as? UITextField)
        let email = try XCTUnwrap(find("form-email", in: screen.view) as? UITextField)
        let password = try XCTUnwrap(find("form-password", in: screen.view) as? UITextField)

        XCTAssertEqual(name.placeholder, "Ada Lovelace")
        XCTAssertFalse(name.isSecureTextEntry)
        XCTAssertEqual(name.keyboardType, .default)

        XCTAssertEqual(email.keyboardType, .emailAddress)
        XCTAssertEqual(email.autocapitalizationType, UITextAutocapitalizationType.none)
        XCTAssertEqual(email.autocorrectionType, .no)
        XCTAssertEqual(email.textContentType, .emailAddress)

        // The last field says what its return key does: it ends the form.
        let notes = try XCTUnwrap(find("form-notes", in: screen.view) as? UITextField)
        XCTAssertEqual(notes.returnKeyType, .done)

        XCTAssertTrue(password.isSecureTextEntry)
        XCTAssertEqual(password.autocapitalizationType, UITextAutocapitalizationType.none)
        XCTAssertEqual(password.autocorrectionType, .no)
        XCTAssertEqual(password.textContentType, .password)
    }
}
