# Native Screens

stx compiles `.stx` screens to native iOS (and Android) views. Craft renders the compiled bundle with UIKit inside JavaScriptCore, with no WebView: the template is data, its expressions and handlers become real functions, and every render re-evaluates them on the device. The compiler, the runtime and the CLI ship with stx itself, under `@stacksjs/stx/native` and `stx native`.

## Usage

```bash
stx native compile ./src/Screen.stx --format bundle --output ./native-screen.js [--minify]
```

The bundle is what Craft's native iOS renderer evaluates: a WebView-free app (`craft ios init MyApp --renderer native`, then `craft ios build --native-bundle ./native-screen.js`), or the native screens of a hybrid app (`nativeScreens` and `nativeBundle` in Craft's config). Without `--format bundle` the command renders the template through stx, including server directives, components, and slots, then prints the translated IR as JSON.

Native hydration uses the same stx signals runtime as browser pages. The compiler supplies its binding manifest and pre-resolved native node handles directly, so the runtime does not query or walk the native view hierarchy.

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

Inside a native screen's `<script>`, the JavaScriptCore bridge exposes `craft.device.getInfo()`, `craft.clipboard.write(text)`, `craft.clipboard.read()`, `craft.haptic(style)`, and high-level `craft.haptics.impact(style)`, `.notification(type)`, and `.selection()`. Calls return promises. Rejections retain a `code` such as `CAPABILITY_DISABLED` or `INVALID_ARGUMENT`; the high-level haptics helpers intentionally treat `CAPABILITY_DISABLED` as a no-op, matching Craft's web bridge. The generated app must enable haptics and clipboard in its Craft config before those capabilities perform work.

When the host advertises the `fetch` capability (Craft's iOS host does), the bundle installs a global `fetch` with the common subset: `method`, `headers`, a string `body`, and a response with `ok`, `status`, `statusText`, `url`, `headers.get()`, `text()` and `json()`. The host performs the request (URLSession on iOS) under the same 30-second deadline and route-teardown cancellation as the other capabilities; transport failures reject with a `TypeError` carrying a `code`. Once any capability answer settles, the screen re-renders after its promise continuations have run, so top-level async work such as `let today = null; fetch(url).then(r => r.json()).then(data => { today = data })` updates the screen without a handler.

### Reactive templates

Every render re-evaluates the template in the JavaScriptCore bundle, so state changes made by handlers, timers or capability answers show up without any extra wiring.

```stx
<script lang="ts">
import { sportStyle } from '../functions/mobile'
const saved = craft.storage.getSync('today')   // in the very first frame
let sessions = saved?.sessions ?? []
let error = ''
function open(id: string) { craft.navigation.push('Session', { id }) }
</script>

<template>
  <ScrollView onRefresh={reload(true)} refreshing={busy}>
    <Text :if="!sessions.length && !error">Loading…</Text>
    <Text :else-if="error" class="text-rose-300">{error}</Text>
    <View :for="(s, i) in sessions" :key="s.id" onPress={open(s.id)} :class="s.done ? 'bg-emerald-500/10' : 'bg-slate-800'">
      <Icon :class="sportStyle(s.type).icon" class="w-5 h-5 text-white" />
      <Text>{{ i + 1 }}. {s.title}</Text>
    </View>
    @if (sessions.length > 3)
      <Text>And more</Text>
    @endif
  </ScrollView>
</template>
```

- **Directives:** `:if` / `:else-if` / `:else`, `:for="item in list"` / `"(item, index) in list"` (arrays, numbers, objects), `:show`, `:key`, `:text`, and stx's `@if … @elseif … @else … @endif` and `@foreach (list as item) … @endforeach`.
- **Dynamic classes and styles:** `:class` takes a string, an array or `{ class: condition }` and is converted to native style at runtime with the same Headwind table the compiler uses (`dark:` variants follow the host's appearance). `:style` takes an object or CSS text.
- **Handlers** are code: `onPress={refresh}`, `onPress={open(item.id)}`, `@click="select(day)"`, `() => …`, or statements (`@click="count++"`). `$event` is the native event. Inside a FlatList row or a `:for`, handlers see that row's variables.
- **Scripts** are TypeScript and may import from the project; each screen is bundled with `Bun.build`. Pass `--minify` for a smaller bundle.
- **Icons:** `<Icon symbol="sun.max" />`, `<Icon name="sun" />` or `<Icon class="i-lucide-sun w-5 h-5 text-amber-400" />` draw SF Symbols. Iconify names are mapped by `src/compiler/icons.ts`; unknown names compile to `circle` with a warning.
- **Sticky headers and scroll targets:** `<ScrollView stickyHeaderIndices={[0]} scrollTarget={target}>` keeps the first child at the top once scrolled to (as in React Native), and scrolls the view whose `testID` is `target.id` to the top, below that header, whenever `target` changes (`{ id, key, animated }`; a new `key` scrolls again). Craft's iOS host draws both.
- **Navigation bar:** `craft.navigation.setOptions({ title, largeTitle, hidden, backTitle, rightButtons: [{ id, symbol, onPress }] })`, with taps also delivered to `craft.navigation.onButton(cb)`.

Template expressions are compiled into real functions in the screen's module (nothing is `eval`ed on the device), and an expression that throws renders as empty and is logged rather than blanking the screen.

### Native FlatList

Bind a data array and mark the reusable row template with `listRole="item"`. Expressions inside that template receive `item` and `index`; `keyExtractor` must return a stable primitive key.

```stx
<script>
let people = [{ id: 'ada', name: 'Ada' }, { id: 'grace', name: 'Grace' }]
function loadMore() { /* append records, then return */ }
</script>

<FlatList
  data={people}
  keyExtractor={item.id}
  numColumns={2}
  onEndReached={loadMore}
  onEndReachedThreshold={0.2}
>
  <Text listRole="header">People</Text>
  <View listRole="item" accessibilityLabel={item.name}>
    <Text>{index + 1}. {item.name}</Text>
  </View>
  <View listRole="separator" class="h-px bg-gray-200" />
  <Text listRole="empty">No people yet</Text>
  <Text listRole="footer">End of list</Text>
</FlatList>
```

The compiler removes `data` and `keyExtractor` from the native payload, expands only the keyed native nodes, and emits create/update/insert/move/remove mutations on later renders. Craft hosts recycle off-screen rows with `UICollectionView` on iOS and `RecyclerView` on Android. Header, footer, empty, and separator templates are optional; direct children without a `listRole` retain their previous static-list behavior.

Expression props keep their JavaScript value type: `data={people}` remains an array, `source={{"uri":"avatar.png"}}` remains an object, and `accessibilityLabel={item.name}` resolves to the current row's string rather than the literal text `item.name`.

Types for the `craft` object a screen sees (`NativeCraft`, `NativeNavigation`, …) are exported from `@stacksjs/stx/native`.
