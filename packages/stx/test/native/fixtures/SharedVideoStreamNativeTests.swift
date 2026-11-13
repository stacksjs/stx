import AVFoundation
import AVKit
import UIKit
import XCTest
@testable import StxPortability

/// The shared Video playing what an app plays: a file over the network and a
/// segmented stream (stacksjs/stx#2184). The other video suite plays files
/// from the device, which cannot fail the way a network can.
///
/// The gate makes a four-second clip and the same four seconds as an HLS
/// stream, serves both on this machine for the run and names the address in
/// STX_MEDIA_URL. Nothing here leaves the machine.
@MainActor
final class SharedVideoStreamNativeTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func wait(_ label: @autoclosure () -> String, timeout: TimeInterval = 15, _ condition: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(timeout)
        while !condition(), Date() < deadline { try await Task.sleep(nanoseconds: 20_000_000) }
        XCTAssertTrue(condition(), label())
    }

    private func find(_ id: String, in view: UIView) -> UIView? {
        if view.accessibilityIdentifier == id { return view }
        return view.subviews.lazy.compactMap { self.find(id, in: $0) }.first
    }

    private func controller(_ screen: CraftNativeScreenController) throws -> AVPlayerViewController {
        let view = try XCTUnwrap(find("shared-movie", in: screen.view))
        return try XCTUnwrap(screen.children.compactMap { $0 as? AVPlayerViewController }.first { $0.view.isDescendant(of: view) })
    }

    private func address(_ name: String) throws -> String {
        let base = try XCTUnwrap(ProcessInfo.processInfo.environment["STX_MEDIA_URL"], "Run through the gate, which serves the media: --suite streams")
        return "\"\(base)/\(name)\""
    }

    private func number(_ screen: CraftNativeScreenController, _ script: String) -> Double {
        screen.evaluateScript(script)?.toDouble() ?? -1
    }

    private func host() async throws -> (CraftNativeScreenController, UIWindow) {
        let screen = CraftNativeScreenController(config: CraftConfig())
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = screen; window.makeKeyAndVisible(); screen.loadViewIfNeeded()
        try await wait("the video screen mounts", { self.find("shared-movie", in: screen.view) != nil })
        return (screen, window)
    }

    /// A file fetched over HTTP loads once, knows how long it is and plays.
    func testAFileOverTheNetworkLoadsAndPlays() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        screen.evaluateScript("videoProbe.source.set(\(try address("clip.mp4")))")
        try await wait("the file loads: errors \(screen.evaluateScript("JSON.stringify(videoProbe.errors())")?.toString() ?? "")", { self.number(screen, "videoProbe.loads()") == 1 })
        let player = try XCTUnwrap(try controller(screen).player), item = try XCTUnwrap(player.currentItem)
        XCTAssertEqual(item.presentationSize, CGSize(width: 128, height: 72))
        XCTAssertEqual(item.duration.seconds, 4, accuracy: 0.3)
        screen.evaluateScript("videoProbe.autoplay.set(true)")
        try await wait("the file plays", { player.currentTime().seconds > 0.5 && self.number(screen, "videoProbe.plays()") >= 1 })
        try await wait("its time reaches the page", { self.number(screen, "videoProbe.progress()") > 0.3 })
        XCTAssertEqual(number(screen, "videoProbe.errors().length"), 0)
        XCTAssertEqual(number(screen, "videoProbe.starts()"), 1)
    }

    /// A stream plays past the end of its first segment, on to its last and
    /// says when it is over. The shared player does not offer picture in
    /// picture: the host turns it off, and no prop turns it on.
    func testAStreamPlaysThroughItsSegmentsToTheEnd() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        screen.evaluateScript("videoProbe.source.set(\(try address("stream.m3u8")))")
        try await wait("the stream loads: errors \(screen.evaluateScript("JSON.stringify(videoProbe.errors())")?.toString() ?? "")", { self.number(screen, "videoProbe.loads()") == 1 })
        let control = try controller(screen)
        let player = try XCTUnwrap(control.player), item = try XCTUnwrap(player.currentItem)
        XCTAssertFalse(control.allowsPictureInPicturePlayback)
        // It is a stream: what the player holds is a playlist, not a file.
        XCTAssertTrue((item.asset as? AVURLAsset)?.url.pathExtension == "m3u8")
        screen.evaluateScript("videoProbe.autoplay.set(true)")
        // Segments are a second long, so 1.5 seconds in is inside the second one.
        try await wait("the stream plays into its second segment", { player.currentTime().seconds > 1.5 })
        try await wait("the stream ends, and says so", { self.number(screen, "videoProbe.ends()") == 1 && player.rate == 0 })
        XCTAssertEqual(number(screen, "videoProbe.errors().length"), 0)
        XCTAssertGreaterThan(number(screen, "videoProbe.progress()"), 3)
    }

    /// An address with nothing behind it is an error the page hears about,
    /// and the same player then plays a stream that is there.
    func testAMissingStreamIsReportedAndThePlayerRecovers() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        screen.evaluateScript("videoProbe.source.set(\(try address("missing.m3u8")))")
        try await wait("the failure reaches the page", { self.number(screen, "videoProbe.errors().length") >= 1 })
        XCTAssertEqual(number(screen, "videoProbe.loads()"), 0)
        let message = screen.evaluateScript("String(videoProbe.errors()[0] ?? '')")?.toString() ?? ""
        XCTAssertFalse(message.isEmpty, "The error carries no message")

        let failures = number(screen, "videoProbe.errors().length")
        screen.evaluateScript("videoProbe.source.set(\(try address("stream.m3u8"))); videoProbe.autoplay.set(true)")
        try await wait("the stream that is there loads and plays", { self.number(screen, "videoProbe.loads()") == 1 && ((try? self.controller(screen).player?.currentTime().seconds) ?? 0) > 0.5 })
        XCTAssertEqual(number(screen, "videoProbe.errors().length"), failures)
    }
}
