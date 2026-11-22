import UIKit
import XCTest
@testable import StxPortability

/// Display P3 on a host that draws it (stacksjs/ts-css#38).
///
/// The simulator's screen, and every screenshot of it, is sRGB: a P3 colour
/// is clamped before any pixel can be read, so a pixel cannot tell P3 from
/// its sRGB fallback. The view's own colour can, so this reads that.
@MainActor
final class NativeHudNativeTests: XCTestCase {
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

    private func components(_ color: CGColor, in name: CFString) throws -> [CGFloat] {
        let space = try XCTUnwrap(CGColorSpace(name: name))
        return try XCTUnwrap(color.converted(to: space, intent: .defaultIntent, options: nil)?.components)
    }

    func testAWidePaletteColourReachesTheViewInDisplayP3() async throws {
        let screen = CraftNativeScreenController(config: CraftConfig())
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        let window = scene.map { UIWindow(windowScene: $0) } ?? UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = screen; window.makeKeyAndVisible(); screen.loadViewIfNeeded()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        try await wait("the swatch mounts", { self.find("swatch-wide", in: screen.view)?.backgroundColor != nil })

        // The host says it draws P3, so stx sent yellow-400 as
        // color(display-p3 0.9599 0.7902 0.0585), not its sRGB hex #fdc700.
        XCTAssertEqual(screen.evaluateScript("__stxNativeBridge.capabilities.indexOf('displayP3Colors') >= 0")?.toBool(), true)
        let color = try XCTUnwrap(find("swatch-wide", in: screen.view)?.backgroundColor?.cgColor)
        let p3 = try components(color, in: CGColorSpace.displayP3)
        XCTAssertEqual(p3[0], 0.9599, accuracy: 0.002, "bg-yellow-400 red in P3: \(p3)")
        XCTAssertEqual(p3[1], 0.7902, accuracy: 0.002, "bg-yellow-400 green in P3: \(p3)")
        XCTAssertEqual(p3[2], 0.0585, accuracy: 0.002, "bg-yellow-400 blue in P3: \(p3)")
        // Outside sRGB, so not its clamp: #fdc700 read in P3 has a blue of 0.27.
        let wide = try components(color, in: CGColorSpace.extendedSRGB)
        XCTAssertLessThan(wide[2], -0.01, "bg-yellow-400 was clamped to sRGB: \(wide)")

        // red-500 fits sRGB, so it stays its hex even on a P3 host.
        let red = try XCTUnwrap(find("swatch-red", in: screen.view)?.backgroundColor?.cgColor)
        let srgb = try components(red, in: CGColorSpace.sRGB)
        XCTAssertEqual(srgb[0] * 255, 251, accuracy: 1); XCTAssertEqual(srgb[1] * 255, 44, accuracy: 1); XCTAssertEqual(srgb[2] * 255, 54, accuracy: 1)
    }
}
