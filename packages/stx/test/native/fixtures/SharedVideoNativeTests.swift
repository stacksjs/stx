import AVFoundation
import AVKit
import UIKit
import XCTest
@testable import StxPortability

@MainActor
final class SharedVideoNativeTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func wait(_ label: String, _ condition: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(10)
        while !condition(), Date() < deadline { try await Task.sleep(nanoseconds: 20_000_000) }
        XCTAssertTrue(condition(), label)
    }

    private func find(_ id: String, in view: UIView) -> UIView? {
        if view.accessibilityIdentifier == id { return view }
        return view.subviews.lazy.compactMap { self.find(id, in: $0) }.first
    }

    private func controller(_ screen: CraftNativeScreenController, id: String = "shared-movie") throws -> AVPlayerViewController {
        let view = try XCTUnwrap(find(id, in: screen.view))
        return try XCTUnwrap(screen.children.compactMap { $0 as? AVPlayerViewController }.first { $0.view.isDescendant(of: view) })
    }

    private func quoted(_ value: String) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    private func videoLayer(_ layer: CALayer) -> AVPlayerLayer? {
        if let video = layer as? AVPlayerLayer { return video }
        return layer.sublayers?.lazy.compactMap { self.videoLayer($0) }.first
    }

    // A silent, local H.264 clip. No network, bundled copyrighted media or
    // synthetic playback events: AVPlayer must decode and play the real file.
    private func movie(seconds: Int = 2) async throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".mp4")
        let writer = try AVAssetWriter(outputURL: url, fileType: .mp4)
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: 64, AVVideoHeightKey: 32])
        let adapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB, kCVPixelBufferWidthKey as String: 64, kCVPixelBufferHeightKey as String: 32])
        writer.add(input)
        XCTAssertTrue(writer.startWriting()); writer.startSession(atSourceTime: .zero)
        for index in 0..<(seconds * 10) {
            try await wait("asset writer accepts frame", { input.isReadyForMoreMediaData || writer.status == .failed })
            XCTAssertNotEqual(writer.status, .failed, writer.error?.localizedDescription ?? "")
            var buffer: CVPixelBuffer?
            XCTAssertEqual(CVPixelBufferPoolCreatePixelBuffer(nil, try XCTUnwrap(adapter.pixelBufferPool), &buffer), kCVReturnSuccess)
            let pixel = try XCTUnwrap(buffer)
            CVPixelBufferLockBaseAddress(pixel, [])
            let bytes = try XCTUnwrap(CVPixelBufferGetBaseAddress(pixel)).assumingMemoryBound(to: UInt8.self)
            for y in 0..<32 { for x in 0..<64 {
                let offset = y * CVPixelBufferGetBytesPerRow(pixel) + x * 4
                bytes[offset] = 255; bytes[offset + 1] = x < 32 ? 255 : 0
                bytes[offset + 2] = 0; bytes[offset + 3] = x < 32 ? 0 : 255
            } }
            CVPixelBufferUnlockBaseAddress(pixel, [])
            XCTAssertTrue(adapter.append(pixel, withPresentationTime: CMTime(value: Int64(index), timescale: 10)))
        }
        input.markAsFinished()
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in writer.finishWriting { continuation.resume() } }
        XCTAssertEqual(writer.status, .completed, writer.error?.localizedDescription ?? "")
        return url
    }

    private func host(_ url: URL) async throws -> (CraftNativeScreenController, UIWindow) {
        let screen = CraftNativeScreenController(config: CraftConfig())
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = screen; window.makeKeyAndVisible(); screen.loadViewIfNeeded()
        try await wait("compiled video fixture mounts", { self.find("shared-movie", in: screen.view) != nil })
        screen.evaluateScript("videoProbe.source.set(\(try quoted(url.absoluteString)))")
        try await wait("real local movie loads once", { screen.evaluateScript("videoProbe.loads() === 1")?.toBool() == true })
        XCTAssertEqual(screen.evaluateScript("videoProbe.errors().length")?.toInt32(), 0)
        window.layoutIfNeeded(); screen.view.layoutIfNeeded()
        return (screen, window)
    }

    func testLiveFlagsRetainThePlayerItemAndDriveRealPlayback() async throws {
        let url = try await movie(seconds: 4); defer { try? FileManager.default.removeItem(at: url) }
        let (screen, window) = try await host(url)
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        let control = try controller(screen), view = try XCTUnwrap(find("shared-movie", in: screen.view))
        let player = try XCTUnwrap(control.player), item = try XCTUnwrap(player.currentItem)
        XCTAssertFalse(control.showsPlaybackControls); XCTAssertTrue(player.isMuted); XCTAssertEqual(player.rate, 0)
        XCTAssertGreaterThan(view.bounds.height, 0)
        XCTAssertEqual(item.presentationSize, CGSize(width: 64, height: 32))
        screen.evaluateScript("videoProbe.controls.set(true); videoProbe.muted.set(false); videoProbe.autoplay.set(true)")
        try await wait("autoplay advances real media time", { player.currentTime().seconds > 0.2 && control.showsPlaybackControls && !player.isMuted })
        try await wait("decoded frames reach the native display layer", { self.videoLayer(view.layer)?.isReadyForDisplay == true })
        XCTAssertTrue(try controller(screen) === control); XCTAssertTrue(control.player === player); XCTAssertTrue(player.currentItem === item)
        XCTAssertTrue(find("shared-movie", in: screen.view) === view)
        screen.evaluateScript("videoProbe.paused.set(true)")
        try await wait("controlled pause stops playback and delivers its event", { player.rate == 0 && (screen.evaluateScript("videoProbe.pauses()")?.toInt32() ?? 0) > 0 })
        screen.evaluateScript("videoProbe.paused.set(false)")
        try await wait("controlled resume advances playback", { player.rate > 0 })
        screen.evaluateScript("videoProbe.autoplay.set(false); videoProbe.controls.set(false); videoProbe.muted.set(true)")
        try await wait("live flags disable again", { player.rate == 0 && !control.showsPlaybackControls && player.isMuted })
        screen.evaluateScript("videoProbe.controls.set(null); videoProbe.autoplay.set(null); videoProbe.muted.set(null); videoProbe.loop.set(null)")
        try await wait("null restores defaults", { control.showsPlaybackControls && !player.isMuted && player.rate == 0 })
        XCTAssertTrue(player.currentItem === item)
        XCTAssertEqual(screen.evaluateScript("videoProbe.starts()")?.toInt32(), 1)
        XCTAssertEqual(screen.evaluateScript("videoProbe.loads()")?.toInt32(), 1)
        XCTAssertGreaterThan(screen.evaluateScript("videoProbe.plays()")?.toInt32() ?? 0, 0)
        XCTAssertGreaterThan(screen.evaluateScript("videoProbe.pauses()")?.toInt32() ?? 0, 0)
        XCTAssertEqual(screen.evaluateScript("videoProbe.errors().length")?.toInt32(), 0)
    }

    func testLoopChangesTakeEffectAtTheActualEndOfTheClip() async throws {
        let url = try await movie(); defer { try? FileManager.default.removeItem(at: url) }
        let (screen, window) = try await host(url)
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        let player = try XCTUnwrap(try controller(screen).player), item = player.currentItem
        screen.evaluateScript("videoProbe.loop.set(true); videoProbe.autoplay.set(true)")
        try await wait("loop emits a real end and resumes", { (screen.evaluateScript("videoProbe.ends()")?.toInt32() ?? 0) >= 1 && player.rate > 0 && player.currentTime().seconds < 1.5 })
        let ends = screen.evaluateScript("videoProbe.ends()")?.toInt32() ?? 0
        screen.evaluateScript("videoProbe.loop.set(false)")
        try await wait("disabling loop stops at next real end", { (screen.evaluateScript("videoProbe.ends()")?.toInt32() ?? 0) == ends + 1 && player.rate == 0 })
        XCTAssertTrue(player.currentItem === item)
        XCTAssertGreaterThan(screen.evaluateScript("videoProbe.progress()")?.toDouble() ?? 0, 0)
        XCTAssertEqual(screen.evaluateScript("videoProbe.starts()")?.toInt32(), 1)
    }

    func testSourceReplacementRemountAndLegacyOwnership() async throws {
        let first = try await movie(), second = try await movie(seconds: 3)
        defer { try? FileManager.default.removeItem(at: first); try? FileManager.default.removeItem(at: second) }
        let (screen, window) = try await host(first)
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        let control = try controller(screen), view = try XCTUnwrap(find("shared-movie", in: screen.view))
        let old = try XCTUnwrap(control.player)
        screen.evaluateScript("videoProbe.source.set(\(try quoted(second.absoluteString))); videoProbe.legacySource.set(\(try quoted(first.absoluteString)))")
        try await wait("new source and legacy object source load", {
            screen.evaluateScript("videoProbe.loads() === 2")?.toBool() == true &&
            (try? self.controller(screen, id: "legacy-movie").player?.currentItem?.status) == .readyToPlay
        })
        XCTAssertTrue(try controller(screen) === control); XCTAssertTrue(find("shared-movie", in: screen.view) === view)
        XCTAssertFalse(control.player === old); XCTAssertEqual(old.rate, 0)
        let legacy = try controller(screen, id: "legacy-movie"), legacyPlayer = legacy.player
        screen.evaluateScript("videoProbe.source.set('')")
        try await wait("empty source releases current player", { control.player == nil })
        screen.evaluateScript("videoProbe.source.set(\(try quoted(second.absoluteString)))")
        try await wait("source restores before hiding", { screen.evaluateScript("videoProbe.loads() === 3")?.toBool() == true })
        screen.evaluateScript("videoProbe.shown.set(false)")
        try await wait("hidden video leaves host and controller tree", { self.find("shared-movie", in: screen.view) == nil && control.parent == nil })
        screen.evaluateScript("videoProbe.source.set(\(try quoted(first.absoluteString))); videoProbe.controls.set(true); videoProbe.muted.set(false)")
        try await Task.sleep(nanoseconds: 30_000_000)
        let starts = screen.evaluateScript("videoProbe.starts()")?.toInt32() ?? 0
        screen.evaluateScript("videoProbe.shown.set(true)")
        try await wait("remount loads only the current source", { screen.evaluateScript("videoProbe.loads() === 4")?.toBool() == true })
        let next = try controller(screen), nextPlayer = try XCTUnwrap(next.player)
        XCTAssertEqual((nextPlayer.currentItem?.asset as? AVURLAsset)?.url, first)
        XCTAssertTrue(next.showsPlaybackControls); XCTAssertFalse(nextPlayer.isMuted)
        XCTAssertEqual(screen.evaluateScript("videoProbe.starts()")?.toInt32(), starts + 1)
        XCTAssertTrue(try controller(screen, id: "legacy-movie") === legacy); XCTAssertTrue(legacy.player === legacyPlayer)
        XCTAssertEqual(screen.evaluateScript("videoProbe.errors().length")?.toInt32(), 0)
        screen.viewDidDisappear(false)
        XCTAssertNil(next.player); XCTAssertNil(legacy.player)
        screen.evaluateScript("videoProbe.source.set(\(try quoted(second.absoluteString)))")
        try await Task.sleep(nanoseconds: 50_000_000)
        XCTAssertNil(find("shared-movie", in: screen.view))
    }

    func testRealFailureRecoveryAndFreshScreens() async throws {
        let url = try await movie(); defer { try? FileManager.default.removeItem(at: url) }
        for _ in 0..<2 {
            let (screen, window) = try await host(url)
            let control = try controller(screen)
            screen.evaluateScript("videoProbe.source.set('file:///stx-missing-video-fixture.mp4')")
            try await wait("real missing file forwards one error", { screen.evaluateScript("videoProbe.errors().length === 1")?.toBool() == true })
            XCTAssertFalse(screen.evaluateScript("videoProbe.errors()[0]")?.toString()?.isEmpty ?? true)
            screen.evaluateScript("videoProbe.source.set(\(try quoted(url.absoluteString)))")
            try await wait("valid source recovers", { screen.evaluateScript("videoProbe.loads() === 2")?.toBool() == true })
            XCTAssertTrue(try controller(screen) === control)
            XCTAssertEqual(screen.evaluateScript("videoProbe.errors().length")?.toInt32(), 1)
            screen.viewDidDisappear(false); window.isHidden = true
            XCTAssertNil(control.player)
        }
    }
}
