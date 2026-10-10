# Buddy iOS

A WebView-free native iOS example compiled from ordinary stx components. Craft
hosts the generated bundle in JavaScriptCore and renders its tree with UIKit.

## Requirements

- Bun and Xcode
- A Craft checkout beside this repository (`../craft`), or `CRAFT_ROOT` set to
  its absolute path

## Build and run

```bash
cd examples/buddy-ios
bun run build
bun run run:sim
```

The generated Xcode project and `native-screen.js` are written to `dist/ios/`.
Set `BUDDY_IOS_OUTPUT` to generate them elsewhere.

To run Craft's native-render UI test against this exact compiled bundle:

```bash
CRAFT_NATIVE_RENDER_BUNDLE="$PWD/dist/ios/dist/native-screen.js" \
  bun "$CRAFT_ROOT/packages/ios/scripts/test-native-render.ts"
```

## What this proves

- `screens/Home.stx` composes `components/CounterCard.stx` normally.
- `state()` drives native `UILabel` updates through revisioned mutation batches.
- `@click` and `@input` arrive from native `UIButton` and `UITextField` views.
- Signal updates preserve the focused field and its on-screen keyboard.
- The simulator UI test asserts that the app contains no `WKWebView`.

The verified run used an iPhone 17 Pro simulator on iOS 26.5. Its isolated UI
target passed 1/1 in 13.4 seconds. Across three button presses, the XCTest
activity trace found the updated label 281 ms, 268 ms, and 265 ms after each
synthesized tap completed and the app became idle (268 ms median). This is an
end-to-end XCTest upper bound, including synchronization and accessibility
lookup—not a microbenchmark of the bridge itself.

The checked-in files are source and configuration only. Swift sources, plist
files, and the Xcode project are generated from the current Craft templates so
the example cannot drift back to an obsolete WebView host.
