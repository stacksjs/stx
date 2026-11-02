import UIKit
import XCTest
@testable import StxPortability

@MainActor
final class SharedToggleNativeTests: XCTestCase {
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
        try await wait("real shared and legacy controls mount", {
            self.find("shared-check", in: screen.view) is UIButton && self.find("shared-switch", in: screen.view) is UISwitch &&
            self.find("legacy-check", in: screen.view) is UIButton && self.find("legacy-switch", in: screen.view) is UISwitch
        })
        window.layoutIfNeeded(); screen.view.layoutIfNeeded()
        return (screen, window)
    }

    func testLiveStateMixedGlyphDisabledAndDefaultsRetainNativeControls() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        let check = try XCTUnwrap(find("shared-check", in: screen.view) as? UIButton)
        let toggle = try XCTUnwrap(find("shared-switch", in: screen.view) as? UISwitch)
        let plainGlyph = try XCTUnwrap(check.image(for: .normal)?.pngData())
        XCTAssertFalse(check.isSelected); XCTAssertFalse(toggle.isOn)
        XCTAssertTrue(check.isEnabled); XCTAssertTrue(toggle.isEnabled)
        screen.evaluateScript("toggleProbe.checked.set(true); toggleProbe.switched.set(true); toggleProbe.disabled.set(true); toggleProbe.mixed.set(true)")
        try await wait("live native states and mixed glyph", {
            check.isSelected && toggle.isOn && !check.isEnabled && !toggle.isEnabled && check.accessibilityValue == "mixed"
        })
        XCTAssertNotEqual(check.image(for: .normal)?.pngData(), plainGlyph)
        XCTAssertTrue(find("shared-check", in: screen.view) === check)
        XCTAssertTrue(find("shared-switch", in: screen.view) === toggle)
        print("DISABLED TRAITS checkbox=\(check.accessibilityTraits.rawValue) switch=\(toggle.accessibilityTraits.rawValue)")
        XCTAssertTrue(check.accessibilityTraits.contains(.notEnabled), "native checkbox exposes disabled accessibility state")
        let platformSwitch = UISwitch(); platformSwitch.isEnabled = false
        XCTAssertEqual(toggle.accessibilityTraits.contains(.notEnabled), platformSwitch.accessibilityTraits.contains(.notEnabled))
        screen.evaluateScript("toggleProbe.checked.set(null); toggleProbe.switched.set(null); toggleProbe.disabled.set(null); toggleProbe.mixed.set(null)")
        try await wait("null restores off/enabled/non-mixed defaults", {
            !check.isSelected && !toggle.isOn && check.isEnabled && toggle.isEnabled && check.accessibilityValue == "unchecked"
        })
        XCTAssertEqual(check.image(for: .normal)?.pngData(), plainGlyph)
        XCTAssertTrue(find("shared-check", in: screen.view) === check)
        XCTAssertTrue(find("shared-switch", in: screen.view) === toggle)
        XCTAssertEqual(screen.evaluateScript("JSON.stringify([toggleProbe.checkEvents(), toggleProbe.switchEvents()])")?.toString(), "[[],[]]")
    }

    func testControlActionsDeliverBooleanSharedAndObjectLegacyPayloadsOnce() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        let check = try XCTUnwrap(find("shared-check", in: screen.view) as? UIButton)
        let toggle = try XCTUnwrap(find("shared-switch", in: screen.view) as? UISwitch)
        let legacyCheck = try XCTUnwrap(find("legacy-check", in: screen.view) as? UIButton)
        let legacyToggle = try XCTUnwrap(find("legacy-switch", in: screen.view) as? UISwitch)
        screen.evaluateScript("toggleProbe.mixed.set(true)")
        try await wait("mixed reaches native checkbox", { check.accessibilityValue == "mixed" })
        check.sendActions(for: .touchUpInside)
        toggle.setOn(true, animated: false); toggle.sendActions(for: .valueChanged)
        legacyCheck.sendActions(for: .touchUpInside)
        legacyToggle.setOn(true, animated: false); legacyToggle.sendActions(for: .valueChanged)
        try await wait("four native callbacks arrive exactly once", {
            screen.evaluateScript("toggleProbe.checkEvents().length === 1 && toggleProbe.switchEvents().length === 1 && toggleProbe.legacyEvents().length === 2")?.toBool() == true
        })
        XCTAssertEqual(screen.evaluateScript("JSON.stringify([toggleProbe.checkEvents(), toggleProbe.switchEvents()])")?.toString(), "[[true],[true]]")
        XCTAssertEqual(screen.evaluateScript("JSON.stringify(toggleProbe.legacyEvents())")?.toString(), "[{\"kind\":\"checkbox\",\"type\":\"object\",\"value\":true},{\"kind\":\"switch\",\"type\":\"object\",\"value\":true}]")
        try await wait("controlled writeback clears mixed and retains on states", { check.isSelected && toggle.isOn && check.accessibilityValue == "checked" })
        screen.evaluateScript("toggleProbe.disabled.set(true); toggleProbe.checked.set(false); toggleProbe.switched.set(false)")
        try await wait("unrelated writeback leaves legacy attempted state intact", { !check.isSelected && !toggle.isOn && !check.isEnabled && !toggle.isEnabled })
        XCTAssertTrue(legacyCheck.isSelected); XCTAssertTrue(legacyToggle.isOn)
        XCTAssertTrue(find("legacy-check", in: screen.view) === legacyCheck)
        XCTAssertTrue(find("legacy-switch", in: screen.view) === legacyToggle)
        XCTAssertEqual(screen.evaluateScript("toggleProbe.checkEvents().length + toggleProbe.switchEvents().length + toggleProbe.legacyEvents().length")?.toInt32(), 4)
        screen.evaluateScript("toggleProbe.disabled.set(false)")
        try await wait("shared controls re-enable", { check.isEnabled && toggle.isEnabled })
        check.sendActions(for: .touchUpInside)
        toggle.setOn(true, animated: false); toggle.sendActions(for: .valueChanged)
        try await wait("re-enabled actions each deliver once", { screen.evaluateScript("toggleProbe.checkEvents().length === 2 && toggleProbe.switchEvents().length === 2")?.toBool() == true })
        screen.viewDidDisappear(false)
        check.sendActions(for: .touchUpInside); toggle.sendActions(for: .valueChanged)
        try await Task.sleep(nanoseconds: 50_000_000)
        XCTAssertNil(find("shared-check", in: screen.view)); XCTAssertNil(find("shared-switch", in: screen.view))
        XCTAssertEqual(screen.evaluateScript("toggleProbe.checkEvents().length + toggleProbe.switchEvents().length")?.toInt32(), 4)
    }

    func testHiddenUpdatesRemountWithCurrentStateAndFreshScreensRestoreDefaults() async throws {
        for _ in 0..<2 {
            let (screen, window) = try await host()
            defer { screen.viewDidDisappear(false); window.isHidden = true }
            let oldCheck = try XCTUnwrap(find("shared-check", in: screen.view) as? UIButton)
            let oldToggle = try XCTUnwrap(find("shared-switch", in: screen.view) as? UISwitch)
            XCTAssertFalse(oldCheck.isSelected); XCTAssertFalse(oldToggle.isOn)
            screen.evaluateScript("toggleProbe.shown.set(false)")
            try await wait("hidden controls leave native tree", { self.find("shared-check", in: screen.view) == nil && self.find("shared-switch", in: screen.view) == nil })
            oldCheck.sendActions(for: .touchUpInside); oldToggle.sendActions(for: .valueChanged)
            screen.evaluateScript("toggleProbe.checked.set(true); toggleProbe.switched.set(true); toggleProbe.disabled.set(true); toggleProbe.mixed.set(true)")
            try await Task.sleep(nanoseconds: 30_000_000)
            screen.evaluateScript("toggleProbe.shown.set(true)")
            try await wait("retained logical controls remount using current state", {
                guard let check = self.find("shared-check", in: screen.view) as? UIButton, let toggle = self.find("shared-switch", in: screen.view) as? UISwitch else { return false }
                return check.isSelected && toggle.isOn && !check.isEnabled && !toggle.isEnabled && check.accessibilityValue == "mixed"
            })
            screen.evaluateScript("toggleProbe.shown.set(false)")
            try await wait("controls hide again", { self.find("shared-check", in: screen.view) == nil })
            screen.evaluateScript("toggleProbe.checked.set(null); toggleProbe.switched.set(null); toggleProbe.disabled.set(null); toggleProbe.mixed.set(null)")
            try await Task.sleep(nanoseconds: 30_000_000)
            screen.evaluateScript("toggleProbe.shown.set(true)")
            try await wait("defaults survive another retained remount", {
                guard let check = self.find("shared-check", in: screen.view) as? UIButton, let toggle = self.find("shared-switch", in: screen.view) as? UISwitch else { return false }
                return !check.isSelected && !toggle.isOn && check.isEnabled && toggle.isEnabled && check.accessibilityValue == "unchecked"
            })
            XCTAssertEqual(screen.evaluateScript("toggleProbe.checkEvents().length + toggleProbe.switchEvents().length")?.toInt32(), 0)
        }
    }
}
