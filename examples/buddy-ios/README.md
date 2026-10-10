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

## What this proves

- `screens/Home.stx` composes `components/CounterCard.stx` normally.
- `state()` drives native `UILabel` updates through revisioned mutation batches.
- `@click` and `@input` arrive from native `UIButton` and `UITextField` views.
- Signal updates preserve the focused field and its on-screen keyboard.
- The simulator UI test asserts that the app contains no `WKWebView`.

The checked-in files are source and configuration only. Swift sources, plist
files, and the Xcode project are generated from the current Craft templates so
the example cannot drift back to an obsolete WebView host.
