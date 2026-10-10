# Native Screens

stx compiles `.stx` screens to native iOS (and Android) views. Craft renders the compiled IR with UIKit inside JavaScriptCore, with no WebView. Client state uses the same stx signals runtime as browser pages, and binding effects emit targeted native-tree mutations. The compiler, runtime and CLI ship with stx itself, under `@stacksjs/stx/native` and `stx native`.

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
- **Handlers** use normal stx event attributes such as `@click="select(day)"`; the native host maps click to `onPress`. `$event` is the native event. Inside a `:for`, handlers see that row's variables.
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
translation alone.

Types for the `craft` object a screen sees (`NativeCraft`, `NativeNavigation`, …) are exported from `@stacksjs/stx/native`.
