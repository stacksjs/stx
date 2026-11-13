import UIKit
import XCTest
@testable import StxPortability

/// The shared controls at the largest accessibility text size
/// (stacksjs/stx#2184): no word is cut off by the box it is drawn in.
@MainActor
final class SharedTextSizeNativeTests: XCTestCase {
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

    /// Words taller than their box, or wider than a box that cannot wrap.
    private func cutOff(in view: UIView, into found: inout [String]) {
        if view.isHidden || view.alpha < 0.01 { return }
        let name = view.accessibilityIdentifier.flatMap { $0.isEmpty ? nil : $0 }
        if let label = view as? UILabel, let text = label.text, !text.isEmpty, label.bounds.width > 0 {
            let wrapped = label.sizeThatFits(CGSize(width: label.bounds.width, height: .greatestFiniteMagnitude))
            let line = label.sizeThatFits(CGSize(width: CGFloat.greatestFiniteMagnitude, height: .greatestFiniteMagnitude))
            if wrapped.height > label.bounds.height + 1 { found.append("too tall: \(name ?? text)") }
            // Words can fit their own box and still stick out of the control
            // they label, which draws its fill behind only part of them.
            if let box = label.superview, box.bounds.height > 0, label.frame.minY < -1 || label.frame.maxY > box.bounds.height + 1 {
                found.append("outside its box: \(name ?? text)")
            }
            if label.numberOfLines == 1, line.width > label.bounds.width + 1 { found.append("too wide: \(name ?? text)") }
        } else if let field = view as? UITextField, let font = field.font {
            if font.lineHeight > field.bounds.height + 1 { found.append("too tall: \(name ?? "a field")") }
        }
        for child in view.subviews { cutOff(in: child, into: &found) }
    }

    func testNoWordIsCutOffAtTheLargestTextSize() async throws {
        // The gate sets this before the run; without it the test proves nothing.
        XCTAssertEqual(UIApplication.shared.preferredContentSizeCategory, .accessibilityExtraExtraExtraLarge, "Run through the gate, which sets the text size: --suite text-size")
        let screen = CraftNativeScreenController(config: CraftConfig())
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        let window = scene.map { UIWindow(windowScene: $0) } ?? UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = screen; window.makeKeyAndVisible(); screen.loadViewIfNeeded()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        try await wait("the controls mount", { self.find("size-save", in: screen.view) != nil && self.find("size-name", in: screen.view) is UITextField })
        window.layoutIfNeeded(); screen.view.layoutIfNeeded()

        // The text really is drawn large: 17 points becomes 48 or so.
        let field = try XCTUnwrap(find("size-name", in: screen.view) as? UITextField)
        XCTAssertGreaterThan(field.font?.pointSize ?? 0, 40)
        // And the field grew to hold it, where it used to stay 48 points tall.
        XCTAssertGreaterThanOrEqual(field.bounds.height, (field.font?.lineHeight ?? 0))

        // Known gap, in the host (craft-native/craft#537): a picker's words
        // are scaled for the text size twice, 17 points drawn near 150 where
        // the field beside it draws them at 48. When the host scales them
        // once this fails, and should become an equality with the field.
        let picker = try XCTUnwrap(find("size-sport", in: screen.view) as? UIButton)
        let words = try XCTUnwrap(picker.titleLabel?.font.pointSize)
        XCTAssertGreaterThan(words, (field.font?.pointSize ?? 0) * 2, "The picker now draws its words at \(words) points: craft#537 looks fixed")

        // The picker is left out of the sweep for that reason: at this
        // scale its words do not fit a narrow phone at all.
        picker.isHidden = true
        var found: [String] = []
        cutOff(in: screen.view, into: &found)
        picker.isHidden = false
        XCTAssertEqual(found, [], "Words cut off by their box at the largest text size")
    }
}
