# Native Screens

stx compiles `.stx` screens to native iOS (and Android) views. Craft renders the compiled IR with UIKit inside JavaScriptCore, with no WebView. Client state uses the same stx signals runtime as browser pages, and binding effects emit targeted native-tree mutations. The compiler, runtime and CLI ship with stx itself, under `@stacksjs/stx/native` and `stx native`.

## Usage

### One component model, multiple render targets

stx owns template composition, slots, signals and bindings for both browser and
native targets. The native compiler renders the ordinary stx template pipeline,
then translates that output into native view IR. Craft owns the platform controls,
navigation, permissions and device services that consume it. Application authors
should reuse stx components and typed composables rather than maintaining another
template parser, signals runtime or application-owned Swift/Kotlin renderer.

This shared pipeline does not imply that an existing application's separately
authored browser and native screens have already become one source. Consolidate
their common UI and state deliberately. Browser DOM calls, custom CSS and
unsupported controls do not acquire native equivalents merely by compiling.
Keep platform access behind typed adapters and fix reusable translation gaps in
stx or native host gaps in Craft.

Review native compilation diagnostics. In particular, `unknown-class` reports a
static utility class with no native style translation, including classes in the
dark appearance. Supported styles still compile, so a successful build with that
warning is not proof of visual parity. Runtime-computed class strings require
interaction tests too; a static diagnostic cannot inspect every future value.

A browser preview verifies HTML and browser behavior. Check the compiled native
bundle's bindings and events, then validate the same route, data and interactions
with the maintained Craft hosts. Native screens and their imported client code
ship in the application bundle: changing them requires a new app build. API data
can refresh independently. A native app is not automatically updated by deploying
the website.

### Compile the same screen for the browser

`compileBrowserScreen` uses the same component pipeline, view descriptors,
binding manifest and signals host as `compileNativeBundle`. Its browser renderer
creates semantic HTML controls and SVG, applies the same versioned mutations and
normalizes edits and gestures into the same events. It does not display a native
app inside a web view.

```ts
import { renderBrowserScreen } from '@stacksjs/stx/native'

const html = await renderBrowserScreen({
  root: process.cwd(),
  source: 'resources/components/screens/Today.stx',
  screen: 'Today',
  app: 'resources/mobile-app.ts',
  browser: {
    screen: 'Today', container: '#screen', appURL: '/m',
    routes: { '/m': 'Today' },
    platformModule: 'craft-native/browser',
    platformOptions: { namespace: 'training', tokenKey: 'auth_token' },
    icons: {}, // Supply the Iconify bodies used by the application.
  },
})
```

Embed the returned HTML as trusted compiler output in a server component. The
framework marks the bundle as opaque so the outer stx page does not compile it
again. Compilation is deduplicated and cached against all template and imported
module inputs. `compileBrowserScreen` returns the code and dependencies for build
tools that manage assets themselves.

Craft’s browser platform implements storage, dialogs, files, sharing and media
using browser APIs. Supply one route registry to the browser and both native
hosts; route adapters should contain no duplicated screen state or markup. Test
nested keyed rows, conditional branches, controls, navigation, account changes
and supported services on each renderer. Device-only capabilities remain absent
in the browser and must be gated by capability checks.

### Authoring without Swift

Application screens, state, handlers and imported functions stay in STX and typed
TypeScript. `compileNativeBundle` emits JavaScript and native IR. Craft owns and
publishes the platform shells; an application should not copy or edit the reference
renderers under `packages/stx/src/native/renderers/`.

For Stacks, `config/mobile.ts` controls native capabilities and shell behavior,
and `buddy build:ios` generates the Xcode project under
`storage/framework/mobile/ios`. Its Swift is ignored build output. Xcode Cloud
can retain the project metadata and restore Swift from locked packages using the
generated post-clone hook. Simulator shells and mutation validation also come
from packages, through the Bun-only `@stacksjs/mobile/testing` entrypoint:

```ts
import { createNativeMutationValidator } from '@stacksjs/mobile/testing'

const validator = createNativeMutationValidator() // macOS + swiftc
try {
  const result = validator.validate(capturedBridgeMessages)
  if (result.exitCode !== 0) throw new Error(result.stdout + result.stderr)
}
finally {
  validator.dispose()
}
```

`capturedBridgeMessages` are the `RENDER` and versioned `MUTATE` messages emitted
by a compiled screen (other message types are ignored). This tests the same
mutation validation code the Craft host runs, without embedding Swift in the
application test suite. UIKit rendering still requires simulator or device tests.

Craft applications can import the same tools from `craft-native/ios` directly.
New native features belong in Craft's shared host with a typed bridge API; screens
consume that API rather than forking a shell. See
[Craft's mobile architecture](https://github.com/craft-native/craft/blob/main/docs/architecture/mobile.md)
for the test host and source restoration contracts.

```bash
stx native compile ./src/Screen.stx --format bundle --output ./native-screen.js [--minify]
```

The bundle is what Craft's native iOS renderer evaluates: a WebView-free app (`craft ios init MyApp --renderer native`, then `craft ios build --native-bundle ./native-screen.js`), or the native screens of a hybrid app (`nativeScreens` and `nativeBundle` in Craft's config). Without `--format bundle` the command renders the template through stx, including server directives, components, and slots, then prints the translated IR as JSON.

Native hydration uses the same stx signals runtime as browser pages. The compiler supplies its binding manifest and pre-resolved native node handles directly, so the runtime does not query or walk the native view hierarchy.

The maintained iOS host lives in Craft. It creates UIKit views and lays them
out with Craft's native flex engine; the Swift and Kotlin files shipped in
`packages/stx/src/native/renderers/` are reference renderers, not the host used
for the simulator proof below.

From code, for a build tool such as Stacks' `buddy build:ios`:

```ts
import { compileNativeBundle } from '@stacksjs/stx/native'

const { outFile, diagnostics } = await compileNativeBundle({
  screens: { Today: 'resources/native/Today.stx' }, // relative to root
  initialScreen: 'Today',
  minify: true,
  outFile: 'storage/framework/native/native-screen.js', // optional; relative to root
  root: process.cwd(),
})
for (const d of diagnostics) console.warn(d.message) // unknown icons and classes
```

To bundle multiple screens, name them in `native.config.json` (paths relative to the file; `--config <file>` picks another):

```json
{
  "initialScreen": "home",
  "screens": {
    "home": "src/screens/Home.stx",
    "details": "src/screens/Details.stx"
  }
}
```

Run `stx native compile --format bundle --output ./native-screen.js` without an input file. The single-file command above remains unchanged for projects without `screens`. Each screen's `<script>` gets its own JavaScriptCore context when opened by a navigation-capable Craft host. Use `craft.navigation.push('details', { id: 7 })`, `craft.navigation.replace('home')`, or `craft.navigation.back()` in a screen script, and `craft.navigation.open('/m/workout/42')` to open a path of a hybrid app (the host shows its native screen, or the web view at that path); the destination reads `craft.route.name` and `craft.route.params`. Unknown screen names and non-object parameters fail before a navigation message is sent.

With Craft 0.0.225 or newer, `craft.navigation.replace('/m/claim?kind=club&slug=rappid')` finishes a flow and opens its canonical destination in one native operation. The host closes the current screen and reuses an existing destination when available. Put URL parameters in the query string; the second parameter object belongs to screen-name navigation. This avoids sending a second navigation message from a screen that has already closed.

The maintained-host navigation gate is in Craft, not in the reference renderers:

```bash
# From a sibling Craft checkout, with this stx checkout as the compiler.
STX_CLI=/absolute/path/to/stx/packages/stx/bin/cli.ts \
  bun packages/ios/scripts/test-native-navigation.ts
STX_CLI=/absolute/path/to/stx/packages/stx/bin/cli.ts \
  bun packages/android/scripts/test-native-navigation.ts
```

Both scripts compile the same multi-screen bundle and exercise native route
parameters, push/replace/back, retained controls, keyed rows, lifecycle
cleanup, and the absence of `WKWebView`/`WebView`. Add `--prepare-only` when a
simulator or emulator is not available; it still proves bundle generation,
route selection, and project wiring. The iOS command requires Xcode and a
bootable simulator. The Android command requires the Android SDK, Gradle and a
bootable emulator. A host build failure is not evidence that STX fell back to a
WebView; inspect the generated host error instead.

Inside a native screen's `<script>`, the JavaScriptCore bridge exposes `craft.device.getInfo()`, `craft.clipboard.write(text)`, `craft.clipboard.read()`, `craft.haptic(style)`, and high-level `craft.haptics.impact(style)`, `.notification(type)`, and `.selection()`. Calls return promises. Rejections retain a `code` such as `CAPABILITY_DISABLED` or `INVALID_ARGUMENT`; the high-level haptics helpers intentionally treat `CAPABILITY_DISABLED` as a no-op, matching Craft's web bridge. The generated app must enable haptics and clipboard in its Craft config before those capabilities perform work.

When the host advertises the `fetch` capability (Craft's iOS host does), the bundle installs a global `fetch` with the common subset: `method`, `headers`, a string `body`, and a response with `ok`, `status`, `statusText`, `url`, `headers.get()`, `text()` and `json()`. The host performs the request under the same request deadline as the other capabilities; transport failures reject with a `TypeError` carrying a `code`. Set a signal from a promise continuation to update native bindings, exactly as on the web.

### Reactive templates

Native screens use the ordinary stx signal primitives. A binding effect runs when a signal it reads changes; there is no second native-only redraw or reactivity model.

```stx
<script client lang="ts">
import { sportStyle } from '../functions/mobile'
const saved = craft.storage.getSync('today')   // in the very first frame
const sessions = state(saved?.sessions ?? [])
const error = state('')
function open(id: string) { craft.navigation.push('Session', { id }) }
</script>

<ScrollView>
  <Text :if="!sessions.length && !error">Loading…</Text>
  <Text :else-if="error" class="text-rose-300" :text="error" />
  <View :for="(s, i) in sessions" :key="s.id" @click="open(s.id)" :class="s.done ? 'bg-emerald-500/10' : 'bg-slate-800'">
    <Icon :class="sportStyle(s.type).icon" class="w-5 h-5 text-white" />
    <Text :text="(i + 1) + '. ' + s.title" />
  </View>
</ScrollView>
```

- **Directives:** `:if` / `:else-if` / `:else`, `:for="item in list"` / `"(item, index) in list"` (arrays, numbers, objects), `:show`, `:key`, `:text`, and stx's `@if … @elseif … @else … @endif` and `@foreach (list as item) … @endforeach`.
- **Dynamic classes and styles:** `:class` takes a string, an array or `{ class: condition }` and is converted to native style at runtime with the same Headwind table the compiler uses (`dark:` variants follow the host's appearance). `:style` takes an object or CSS text.
- **Grid styles:** maintained Craft hosts accept `display: 'grid'` with `gridColumns` or `gridTemplateColumns` (including `repeat(N, ...)`) and an optional numeric `gridAutoRows`.
- **Handlers** use normal stx event attributes such as `@click="select(day)"`; the native host maps click to `onPress`. `$event` is the native event. Inside a `:for`, handlers see that row's variables.
- **Modal lifecycle:** native `<Modal>` supports `@show`, `@dismiss`, and `@request-close` handlers. `@show` is treated as a lifecycle event on `<Modal>`; on ordinary elements, `@show` remains the visibility directive.
- Native lifecycle handlers are registered before the first bridge render, so maintained hosts receive handler IDs immediately; Android back handling therefore reaches `@request-close` even on the first modal presentation.
- **Native boolean props** retain explicit false values. For example, `<TextInput :editable="false" />` compiles with `editable: false` instead of applying HTML's attribute-removal semantics.
- **Scripts** are TypeScript and may import from the project; each screen is bundled with `Bun.build`. Pass `--minify` for a smaller bundle.
- **Icons:** `<Icon symbol="sun.max" />`, `<Icon name="sun" />` or `<Icon class="i-lucide-sun w-5 h-5 text-amber-400" />` draw SF Symbols. Iconify names are mapped by `src/compiler/icons.ts`; unknown names compile to `circle` with a warning.
- **Sticky headers and scroll targets:** `<ScrollView stickyHeaderIndices={[0]} scrollTarget={target}>` keeps the first child at the top once scrolled to (as in React Native), and scrolls the view whose `testID` is `target.id` to the top, below that header, whenever `target` changes (`{ id, key, animated }`; a new `key` scrolls again). Craft's iOS host draws both.
- **Navigation bar:** `craft.navigation.setOptions({ title, largeTitle, hidden, backTitle, rightButtons: [{ id, symbol, onPress }] })`, with taps also delivered to `craft.navigation.onButton(cb)`.

Template bindings are carried in stx's binding manifest and evaluated by the shared signals runtime against the screen setup scope.

### Lists

Use the ordinary signal-driven `:for` directive for dynamic native lists. The
old native-only `FlatList` template expansion (`data={...}`, `keyExtractor`,
and `listRole`) belonged to the retired redraw runtime and is not part of the
shared-runtime contract. `FlatList` remains a renderer primitive, but automatic
row recycling is currently unsupported and should not be inferred from IR
translation alone. The compiler emits an `unsupported-list-prop` diagnostic when
one of those legacy row-template props is present, so a native build cannot
silently ship a list with no rows. Use a keyed `:for` inside a `ScrollView` for
portable screens; use a host's documented recycling-list API only when the
selected Craft host is intentionally targeted.

Both renderers support `Modal` visibility and preserve its child subtree, and
support `Slider` value-change events.
The reference iOS renderer does not implement `FlatList`; the maintained Craft
iOS host does use a recycling `UICollectionView`. Automatic `FlatList` template
expansion is still outside the shared-runtime contract, so use `:for` when the
same screen must work across every host.

Wildloop is the maintained real-application integration. Its native bundle is
built from `resources/native.config.json` and currently includes manual
activity, saved confirmation, records, notifications, and leaderboard screens:

```bash
cd /absolute/path/to/wildloop
bun run build:native-screens --debug
bun test tests/unit/native-manual-activity-flow.test.ts \
  tests/unit/native-records-screen.test.ts \
  tests/unit/native-notifications-screen.test.ts \
  tests/unit/native-leaderboard-screen.test.ts
```

Those screens use application-owned components and shared data helpers. The
records, notifications, and leaderboard lists use keyed `:for` rows inside a
`ScrollView`; they retain row identity and event scope but materialize every
row. `FlatList` recycling is therefore an explicit host-specific boundary, not
an implication of translating a `<FlatList>` tag.

The shared-runtime regression also covers a keyed `TextInput`: a reorder moves
the existing native node instead of removing and recreating it, and retains the
containing `ScrollView`, so the host can preserve focus, caret and scroll
position while the row's event scope continues to identify the same item.
`scrollTarget` is the portable explicit scroll command; automatic virtualization
remains host-specific.

### Simulator validation

`examples/buddy-ios` is the reproducible vertical slice. On an iPhone 17 Pro
simulator running iOS 26.5, Craft's `NativeRenderUITests` passed with one native
`UITextField`, one native button, signal-driven text mutations, preserved input
focus, and no `WKWebView` in the hierarchy.

The saved XCTest activity timeline measured the three count updates from the
end of synthesized tap handling (the app had become idle) to the successful
updated-label lookup at 281 ms, 268 ms, and 265 ms: a 268 ms median upper bound.
That number includes XCTest synchronization and accessibility lookup overhead;
it is intentionally not presented as pure JavaScript-to-UIKit bridge latency.

Types for the `craft` object a screen sees (`NativeCraft`, `NativeNavigation`, …) are exported from `@stacksjs/stx/native`.
