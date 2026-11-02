import UIKit
import XCTest
@testable import StxPortability

@MainActor
final class SharedImageNativeTests: XCTestCase {
    private func find(_ id: String, in root: UIView) -> UIView? {
        if root.accessibilityIdentifier == id { return root }
        return root.subviews.lazy.compactMap { self.find(id, in: $0) }.first
    }

    private func wait(_ label: String, _ condition: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(5)
        while !condition(), Date() < deadline { try await Task.sleep(nanoseconds: 20_000_000) }
        XCTAssertTrue(condition(), label)
    }

    private func host() async throws -> (CraftNativeScreenController, UIWindow) {
        let screen = CraftNativeScreenController(config: CraftConfig())
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = screen
        window.makeKeyAndVisible()
        screen.loadViewIfNeeded()
        try await wait("compiled shared Image loads", {
            self.find("shared-photo", in: screen.view) is UIImageView &&
            screen.evaluateScript("imageProbe.loads() === 1")?.toBool() == true
        })
        window.layoutIfNeeded(); screen.view.layoutIfNeeded()
        return (screen, window)
    }

    private func photo(_ screen: CraftNativeScreenController) throws -> CraftNativePositionedImageView {
        try XCTUnwrap(find("shared-photo", in: screen.view) as? CraftNativePositionedImageView)
    }

    private func pixels(_ image: UIImageView) throws -> UIImageView {
        try XCTUnwrap(image.subviews.compactMap { $0 as? UIImageView }.first)
    }

    private func change(_ script: String, screen: CraftNativeScreenController, frame: CGRect) async throws {
        screen.evaluateScript(script)
        try await wait("live image frame \(frame)", {
            screen.view.layoutIfNeeded()
            guard let image = self.find("shared-photo", in: screen.view) as? CraftNativePositionedImageView,
                  let child = image.subviews.compactMap({ $0 as? UIImageView }).first else { return false }
            image.layoutIfNeeded()
            return child.frame == frame
        })
    }

    func testGeometryMutationsRetainTheDecodedImageAndNativeViews() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        let image = try photo(screen), child = try pixels(image)
        let decoded = try XCTUnwrap(image.image?.cgImage)
        XCTAssertEqual(image.bounds.size, CGSize(width: 100, height: 100))
        XCTAssertEqual(child.frame, CGRect(x: 80, y: 90, width: 20, height: 10))
        for (script, frame) in [
            ("imageProbe.fit.set('contain'); imageProbe.position.set('left top')", CGRect(x: 0, y: 0, width: 100, height: 50)),
            ("imageProbe.fit.set('cover'); imageProbe.position.set('right top')", CGRect(x: -100, y: 0, width: 200, height: 100)),
            ("imageProbe.fit.set('none'); imageProbe.position.set('25% 75%')", CGRect(x: 20, y: 67.5, width: 20, height: 10)),
            ("imageProbe.fit.set('fill')", CGRect(x: 0, y: 0, width: 100, height: 100)),
            ("imageProbe.fit.set(null); imageProbe.position.set(null)", CGRect(x: -50, y: 0, width: 200, height: 100)),
        ] {
            try await change(script, screen: screen, frame: frame)
            XCTAssertTrue(try photo(screen) === image)
            XCTAssertTrue(try pixels(image) === child)
            XCTAssertTrue(image.image?.cgImage === decoded)
            XCTAssertEqual(screen.evaluateScript("imageProbe.loads()")?.toInt32(), 1)
        }
        XCTAssertEqual(screen.evaluateScript("imageProbe.errors()")?.toInt32(), 0)
        let legacy = try XCTUnwrap(find("legacy-photo", in: screen.view) as? UIImageView)
        XCTAssertEqual(legacy.contentMode, .scaleAspectFit)
        XCTAssertFalse((legacy as? CraftNativePositionedImageView)?.usesObjectGeometry ?? true)
    }

    func testSourceReplacementClearingAndRemountUseCurrentValues() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        let first = try photo(screen)
        try await change("imageProbe.source.set(imageProbe.tall)", screen: screen, frame: CGRect(x: 90, y: 80, width: 10, height: 20))
        XCTAssertTrue(try photo(screen) === first)
        XCTAssertEqual(screen.evaluateScript("imageProbe.loads()")?.toInt32(), 2)
        XCTAssertEqual(screen.evaluateScript("imageProbe.errors()")?.toInt32(), 0)
        screen.evaluateScript("imageProbe.source.set('')")
        // Preserve the existing native host's explicit missing-source error.
        // A subsequent remount with a valid source must not add a false one.
        try await wait("source clearing removes pixels and forwards its native error", {
            first.image == nil && screen.evaluateScript("imageProbe.errors()")?.toInt32() == 1
        })
        XCTAssertEqual(screen.evaluateScript("imageProbe.errorMessages().join('|')")?.toString(), "Image source is missing")
        XCTAssertTrue(try photo(screen) === first)
        screen.evaluateScript("imageProbe.shown.set(false)")
        try await wait("hidden image leaves the host", { self.find("shared-photo", in: screen.view) == nil })
        screen.evaluateScript("imageProbe.source.set(imageProbe.wide); imageProbe.fit.set('contain'); imageProbe.position.set('bottom'); imageProbe.shown.set(true)")
        try await change("void 0", screen: screen, frame: CGRect(x: 0, y: 50, width: 100, height: 50))
        XCTAssertEqual(screen.evaluateScript("imageProbe.errors()")?.toInt32(), 1)
        XCTAssertEqual(try photo(screen).image?.cgImage?.width, 20)
        screen.evaluateScript("imageProbe.__saved = imageProbe.source")
        screen.viewDidDisappear(false)
        screen.evaluateScript("imageProbe.__saved.set(imageProbe.tall)")
        try await Task.sleep(nanoseconds: 100_000_000)
        XCTAssertNil(find("shared-photo", in: screen.view))
    }

    func testFreshScreenRestoresInitialGeometryAndLoadOwnership() async throws {
        for _ in 0..<2 {
            let (screen, window) = try await host()
            let image = try photo(screen)
            XCTAssertEqual(try pixels(image).frame, CGRect(x: 80, y: 90, width: 20, height: 10))
            XCTAssertEqual(screen.evaluateScript("imageProbe.loads()")?.toInt32(), 1)
            screen.viewDidDisappear(false)
            window.isHidden = true
        }
    }

    func testHiddenGeometryChangesSurviveSeparateHostTurns() async throws {
        let (screen, window) = try await host()
        defer { screen.viewDidDisappear(false); window.isHidden = true }
        try await change("imageProbe.fit.set(null); imageProbe.position.set(null); imageProbe.source.set(imageProbe.tall)", screen: screen, frame: CGRect(x: 0, y: -50, width: 100, height: 200))
        screen.evaluateScript("imageProbe.shown.set(false)")
        try await wait("image hidden", { self.find("shared-photo", in: screen.view) == nil })
        screen.evaluateScript("imageProbe.fit.set('scale-down')")
        try await Task.sleep(nanoseconds: 20_000_000)
        try await change("imageProbe.shown.set(true)", screen: screen, frame: CGRect(x: 45, y: 40, width: 10, height: 20))
        XCTAssertEqual(screen.evaluateScript("imageProbe.fit()")?.toString(), "scale-down")
        XCTAssertEqual(screen.evaluateScript("imageProbe.errors()")?.toInt32(), 0)
    }

    private func coloredBounds(_ view: UIView) throws -> CGRect {
        let format = UIGraphicsImageRendererFormat(); format.scale = 1
        let shot = UIGraphicsImageRenderer(size: view.bounds.size, format: format).image { _ in
            XCTAssertTrue(view.drawHierarchy(in: view.bounds, afterScreenUpdates: true))
        }
        let cg = try XCTUnwrap(shot.cgImage), width = cg.width, height = cg.height
        var rgba = [UInt8](repeating: 0, count: width * height * 4)
        let context = try XCTUnwrap(CGContext(data: &rgba, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue))
        context.draw(cg, in: CGRect(x:0,y:0,width:width,height:height))
        var xs:[Int] = [], ys:[Int] = []
        for y in 0..<height { for x in 0..<width {
            let i = (y * width + x) * 4
            if rgba[i+1] < 10 && ((rgba[i] > 240 && rgba[i+2] < 10) || (rgba[i+2] > 240 && rgba[i] < 10)) { xs.append(x);ys.append(y) }
        } }
        let bounds = CGRect(x:xs.min() ?? 0,y:ys.min() ?? 0,width:(xs.max() ?? -1) - (xs.min() ?? 0) + 1,height:(ys.max() ?? -1) - (ys.min() ?? 0) + 1)
        let attachment = XCTAttachment(image:shot);attachment.lifetime = .keepAlways;add(attachment)
        return bounds
    }
    func testRawHostPaintsOnlyItsFittedPixels() throws {
        let format = UIGraphicsImageRendererFormat();format.scale = 1
        let source = UIGraphicsImageRenderer(size:CGSize(width:20,height:10),format:format).image { context in
            UIColor.red.setFill();context.fill(CGRect(x:0,y:0,width:10,height:10))
            UIColor.blue.setFill();context.fill(CGRect(x:10,y:0,width:10,height:10))
        }
        let controller = UIViewController(), window = UIWindow(frame:CGRect(x:0,y:0,width:100,height:100))
        window.rootViewController = controller;window.makeKeyAndVisible();controller.loadViewIfNeeded()
        defer {window.isHidden = true}
        let control = UIView(frame:CGRect(x:0,y:0,width:100,height:100));control.backgroundColor = .white
        let pixels = UIImageView(frame:CGRect(x:80,y:90,width:20,height:10));pixels.image = source;control.addSubview(pixels)
        controller.view.addSubview(control);control.layoutIfNeeded()
        let reference = try coloredBounds(control); print("RASTER CONTROL \(reference)")
        XCTAssertEqual(reference.size,CGSize(width:20,height:10));control.removeFromSuperview()
        let image = CraftNativePositionedImageView(frame:CGRect(x:0,y:0,width:100,height:100));image.backgroundColor = .white
        image.contentMode = .scaleAspectFit
        image.configureObjectGeometry(props:["objectFit":"scale-down","objectPosition":"right bottom"],style:[:])
        image.image = source;controller.view.addSubview(image);image.layoutIfNeeded()
        let child = try XCTUnwrap(image.subviews.compactMap{$0 as? UIImageView}.first)
        XCTAssertEqual(child.frame,CGRect(x:80,y:90,width:20,height:10))
        let actual = try coloredBounds(image);print("RASTER RAW HOST \(actual)")
        XCTAssertEqual(actual.size,reference.size)
    }
}
