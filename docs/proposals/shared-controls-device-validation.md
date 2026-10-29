# Shared controls: maintained iOS host check

This is scoped evidence for #2090 and #2091, not completion of the native
portability audit. The fixture explicitly imports the real shared Button and
TextInput sources; it does not duplicate their implementation in a native test.

## Reproduce

From the STX checkout, compile the checked-in fixture (Bun required):

```sh
bun -e 'import {compileSharedScreenBundle} from "./packages/stx/src/native/compiler/bundle"; await compileSharedScreenBundle("packages/stx/test/native/fixtures/shared-controls-device.stx", {root:process.cwd(),outFile:"/tmp/stx-shared-controls.js",minify:true})'
bun test packages/stx/test/native/shared-controls-device-fixture.test.ts
```

From a clean Craft checkout with Xcode and xcodegen installed, supply that
bundle to its maintained harness. Set the simulator variable to an **owned,
booted disposable iOS simulator**; do not borrow another task's device.

```sh
CRAFT_NATIVE_RENDER_SIMULATOR="$STX_TEST_SIMULATOR" \
CRAFT_NATIVE_RENDER_BUNDLE=/tmp/stx-shared-controls.js \
CRAFT_ONLY_TESTING=NativeRenderUITests/NativeRenderUITests/testTypingAndButtonUpdatesDoNotDropTheKeyboard \
CRAFT_KEEP_NATIVE_RENDER_PROJECT=1 \
bun packages/ios/scripts/test-native-render.ts
```

The harness generates its app and tests in a temporary directory and reports
the retained project and `TestResults.xcresult` paths. No Craft source edits
are required. Check the result bundle, not only the harness's success message:
exactly one UI test should pass, with zero failures and skips. The harness's
generic message mentions unit tests, but this selection does **not** run them.

## Recorded run: 2026-10-22

- STX base: `c2ad7a459cfe4ac0774a641839fc40f9021701f3`, plus this fixture.
  Unreleased after v0.2.661.
- Craft: `45a33630e45b6ba84a43008ea3a36596f7287278`, clean checkout.
- Xcode 26.6 (17F113), iPhone 17 Pro simulator, iOS 26.5 (23F77), arm64.
- Fixture SHA-256:
  `7948c0e2465766798b77ca0604471743aa930ccddc4f7a1fc8f92a6767c59de0`.
- Minified bundle SHA-256:
  `e46a68336d01e08cf87ba39dae4dd1a250675395ea7a78e1497ce1cf7c4d1147`.
  Bundle hashes may vary with the checkout path or compiler version.
- Protocol fixture tests: 2 passed, 0 failed (normal and minified).
- XCTest: 1 passed, 0 failed, 0 skipped, 31.861 seconds.

The XCTest verifies a physical text field, absence of a WebView, typing `Ada`,
three button-driven counter updates, keyboard retention across those updates,
and continued typing through `Adaxxx`, including the reactive greeting label.
The protocol tests additionally verify selected shared-source dependencies,
retained input identity and no invalid mutation batches.

Screenshot inspection confirmed legible labels, a filled rounded shared Button,
a rounded shared TextInput, spacing, and the retained keyboard in dark appearance.
The initial fixture used a fixed white background and hid white labels in dark
mode despite passing accessibility assertions. It was corrected to paired
light/dark foreground/background utilities and the XCTest was rerun.

## What this does not prove

Craft's generated harness app sets `UIUserInterfaceStyle` to `Dark`, so changing
the simulator's appearance alone is **not** a light/dark transition test. No
light-mode or density-token visual validation is claimed here. Accessibility
queries are not a VoiceOver navigation audit. Android, overlay clipping/touch
routing, tabs, media playback, font scaling and broader component coverage
remain separate checks. Keep #2089, #2090 and #2091 open until their remaining
requirements have direct evidence.

## Shared overlay and tab device suite

STX also owns `fixtures/shared-overlays-device.stx` and
`fixtures/SharedPortabilityUITests.swift` under `packages/stx/test/native`.
The screen imports the real shared Button, Tooltip, Popover, Dialog, Drawer
and TabList/Tab sources. It exercises an anchored popup inside a clipping
ancestor, retained popup action state, a tooltip around a shared Button,
actually nested dialogs, a drawer, and tab selection.

Run this from STX against a clean Craft checkout and an owned booted simulator:

```sh
bun scripts/native-portability-ios.ts \
  --craft-root /path/to/craft \
  --simulator "$STX_TEST_SIMULATOR" \
  --appearance light
```

Use `--appearance dark` for dark appearance. This runner generates an app with
`appearance: 'system'` and selects the specified appearance on that simulator.
It retains its generated project, exact source/bundle hashes, compiler
diagnostics, Craft/STX revisions, XCTest result bundle and result summary.
The overlay suite requires four tests, all passing with no skips. It never
edits Craft source or boots/shuts down another task's simulator. These XCTest
checks run explicitly; the ordinary Bun suite runs the fixture's protocol
regression on both normal and minified bundles.

## Updated shared-controls acceptance: 2026-10-30

`--suite controls` now selects STX's own `SharedControlsUITests` against the
extended `shared-controls-device.stx` fixture. It imports the actual shared
Button, TextInput and Card; no alternative implementation is embedded in the
test app. Run both appearances:

```sh
bun scripts/native-portability-ios.ts --craft-root /path/to/clean/craft \
  --simulator "$STX_TEST_SIMULATOR" --appearance light --suite controls
bun scripts/native-portability-ios.ts --craft-root /path/to/clean/craft \
  --simulator "$STX_TEST_SIMULATOR" --appearance dark --suite controls
```

The controls selection requires exactly two passing tests with zero failures
and skips. The receipt includes the exact source/bundle hashes, revisions,
appearance, simulator and XCTest summary. The new fixture/test batch is
`7b3749e82e`, source after v0.2.745; the initial run's provenance records the
uncommitted fixture batch on top of `a11ce4930a`, before that batch was committed.

Validated with a clean Craft `b49aa1e894198d1b8b5fe7b07a6fa43d2d6d34f6`
snapshot, Xcode 26.6 and an owned iPhone 17 Pro / iOS 26.5 simulator:

| Check | Result |
| --- | --- |
| Light appearance: native input/keyboard and real Card layout | 2 passed, 0 failed/skipped |
| Dark appearance: same generated app and tests | 2 passed, 0 failed/skipped |
| Actual web fixture: typing, token updates and retained field/Card identity | 1 passed |
| Native protocol: iOS/Android, normal/minified | 4 passed |

The keyboard test types `Ada`, taps the shared Button three times, verifies
each counter update, retains the keyboard and continues typing to `Adaxxx`.
The density test measures the actual content inset at 24, 8 and 24 points as
the shared Button changes the Card's inherited control-spacing variable.
Protocol checks additionally verify radius changes (16/4/16), panel colors
across live appearance changes and retained native input/Card identity.
Web checks verify computed padding/radius and retained DOM input/Card identity.

Retained XCTest screenshots were inspected in both appearances: shared labels
are legible, controls remain distinct, and the Card changes from the light to
the authored dark panel color. This does not certify host navigation chrome,
Android device drawing, assistive-technology navigation or unsupported styles.
Ring/inset/offset and unsupported focus modes continue to produce diagnostics;
they are not approximated with borders or shadows. Craft source was untouched.

## Updated overlay gate: 2026-10-30

Craft #402 and #403 are closed upstream. The STX acceptance suite was rerun
against the clean Craft revision above rather than assuming their closure
made the complete suite pass. Popover clipping/actions/state, tabs and Tooltip
touch/outside dismissal passed in both light and dark appearance. Before the
DialogPanel fix, the suite was **3 passed / 1 failed**: opening a nested Dialog
did not expose its `open-inner` action. An isolated rerun reproduced the failure.

The fixture includes a `dialog-state` label in the failure hierarchy. It
reads `Dialog taps: 1; open: true`, proving the opening callback and parent
signal update ran. Existing modal/button assertions remain unchanged. The
protocol fixture also asserts that marker on opening and closing. At that
point #2089 remained open: passing the callback assertion alone did not
establish presentation.

The missing content was then isolated with a temporary raw-Modal probe: both
overFullScreen and pageSheet displayed an ordinary flow child on the same host.
Shared DialogPanel used an absolute-only wrapper, which did not produce usable
content in the sheet. Its native wrapper now uses a full-width/full-height
normal-flow box, preserving bottom alignment or explicit centered alignment.
The host can reparent and lay out that content inside its sheet controller.
Web markup and Craft source are unchanged.

The fix is `575fc90bea`, source after v0.2.745. The new structural assertions
failed in all four iOS/Android normal/minified
cases before the change. After it, the sheet/device-fixture/nested-close group
passes all 27 tests. The unchanged four-test iOS overlay suite now passes in
both light and dark appearance: **4 passed / 0 failed / 0 skipped per appearance**,
including actually nested dismissal and Drawer interaction. The dark run reused
the same generated app/tests with system appearance changed, rather than building
a second implementation. This supplies maintained iOS evidence for the shared
overlay contract; Android protocol coverage is not Android device certification.

## Historical overlay failures: 2026-10-22

The first light-appearance device run on Craft `45a33630` passed popup clipping
escape, real action taps, outside dismissal, state after reopening, and shared
tab selection. Two failures exposed additional work:

- A shared Button emits a click before the physical press bubbles. Tooltip
  toggled twice and remained closed. This was reproduced in the maintained
  STX protocol test by replacing its bare button with the actual shared file;
  the Tooltip now ignores that emitted duplicate when toggling native touch.
  Its dedicated iOS rerun passed (one test, zero failures, 15.653 seconds),
  verifying one action callback, visible hint and outside dismissal.
  A later dark-appearance run passed Popover and Tabs but lost the Tooltip
  Button action (`Help taps: 0`). This is a separate delivery failure after
  the STX fix; the differing appearances do not establish its cause. Nested
  host gesture arbitration still needs investigation and repeated device taps,
  tracked in [Craft #403](https://github.com/craft-native/craft/issues/403).
- A named native Dialog draws its button but hides it from accessibility
  queries. Craft makes the labelled Modal an accessibility leaf. This is
  filed as [Craft #402](https://github.com/craft-native/craft/issues/402).
  The device test retains the accessible name and its failing assertion so
  the host fix can be validated without weakening the acceptance check.

The nested-dialog fixture also exposed a separate STX close-event leak before
device execution: the outer Dialog/Drawer did not declare `close` until it
emitted it, so it accepted the inner component's close event. Both now declare
it during setup. `nested-overlay-close.test.ts` covers every Dialog/Drawer
combination on web/native, repeated inner dismissal, independent close counts
and teardown. Keep the broader issues open; the full device suite is not yet
green against this Craft revision.
