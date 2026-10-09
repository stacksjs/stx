![Social Card of stx](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# stx-native

Compile STX templates to native iOS/Android UI.

## Usage

```bash
stx-native compile ./src/Screen.stx --format bundle --output ./screen.js
```

The bundle is currently used by Craft's experimental WebView-free iOS renderer (`craft ios init MyApp --renderer native`, then `craft ios build --native-bundle ./screen.js`). The package is private for now; from a local stx checkout, run `bun packages/stx-native/src/cli/index.ts` in place of the `stx-native` executable.

To bundle multiple screens, add named routes to `stx-native.config.json`:

```json
{
  "initialScreen": "home",
  "screens": {
    "home": "src/screens/Home.stx",
    "details": "src/screens/Details.stx"
  }
}
```

Run `stx-native compile --format bundle --output ./screen.js` without an input file. The single-file command above remains unchanged for projects without `screens`. Each screen's `<script>` gets its own JavaScriptCore context when opened by a navigation-capable Craft host. Use `craft.navigation.push('details', { id: 7 })`, `craft.navigation.replace('home')`, or `craft.navigation.back()` in a screen script; the destination reads `craft.route.name` and `craft.route.params`. Unknown screen names and non-object parameters fail before a navigation message is sent.

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

## Documentation

- [Full Documentation](https://stx.sh)

## License

MIT

<!-- Badges -->
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/stx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/stx/actions?query=workflow%3Aci
