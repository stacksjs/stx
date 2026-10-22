# STX Native Architecture

Making STX compile to native UI components like React Native.

## Overview

STX Native renders ordinary `.stx` templates through the normal stx pipeline,
translates the resulting HTML to a platform-neutral IR, and hydrates that IR
with the shared stx signals runtime. A native host consumes the IR and mutation
protocol; it does not load the screen in a WebView.

## Core Concepts

### 1. Native Primitives

STX provides platform-agnostic primitives that map to native components:

| STX Component | iOS (UIKit) | Android | Web |
|---------------|-------------|---------|-----|
| `<View>` | `UIView` | `android.view.View` | `<div>` |
| `<Text>` | `UILabel` | `TextView` | `<span>` |
| `<Button>` | `UIButton` | `Button` | `<button>` |
| `<Image>` | `UIImageView` | `ImageView` | `<img>` |
| `<TextInput>` | `UITextField` | `EditText` | `<input>` |
| `<ScrollView>` | `UIScrollView` | `ScrollView` | `<div style="overflow:scroll">` |
| `<FlatList>` | Craft: `UICollectionView`; reference renderer: unsupported | `RecyclerView` | Virtual list |
| `<TouchableOpacity>` | `UIView` + tap gesture | `View+clickListener` | `<div onclick>` |
| `<Modal>` | `UIView` overlay | `FrameLayout` overlay | `<dialog>` |
| `<Switch>` | `UISwitch` | `Switch` | `<input type="checkbox">` |
| `<Slider>` | `UISlider` | `SeekBar` | `<input type="range">` |
| `<Picker>` | `UIPickerView` | `Spinner` | `<select>` |
| `<Map>` | `MKMapView` | Google Maps SDK | map container with native overlays |
| `<MapPolyline>` | `MKPolyline` | `Polyline` | flat latitude/longitude geometry |
| `<MapMarker>` | `MKPointAnnotation` | `Marker` | flat coordinate plus marker id |

### 2. Styling with Headwind

Headwind classes compile to typed native style values:

```stx
<View class="flex-1 flex-row justify-between items-center p-4 bg-blue-500 rounded-lg">
  <Text class="text-white text-lg font-bold">Title</Text>
  <Button class="bg-white text-blue-500 px-4 py-2 rounded">Action</Button>
</View>
```

Compiles to (iOS/Swift):
```swift
let view = UIView()
view.backgroundColor = UIColor(hex: "#3b82f6")
view.layer.cornerRadius = 8

// The reference renderer applies these through YogaKit.
view.yoga.flexGrow = 1
view.yoga.flexDirection = .row
view.yoga.justifyContent = .spaceBetween
view.yoga.alignItems = .center
view.yoga.padding = 16
```

The maintained Craft iOS host consumes the same style object through
`CraftNativeFlexLayout`, its UIKit-native flex layout engine. The reference
renderers in this package use YogaKit/YogaLayout; neither implementation is a
fake layout used only to make IR tests pass.

Both renderers apply text sizing, weight, family, line height, tracking,
decoration and case transforms. Native images support only `cover`, `contain`,
`stretch` and `center` resize modes plus tint colors. Layer overflow and
z-order are preserved on both platforms; iOS also applies shadow offsets.

### 3. Event Handling

STX events map to native callbacks:

```stx
<script>
function handlePress() {
  console.log('Pressed!')
}
</script>

<Button @click="handlePress()">Click Me</Button>
```

Compiles to bridge calls that invoke JavaScript functions.

## Architecture Layers

### Layer 1: STX Parser & Compiler

```
Input: .stx file
Output: STX IR (Intermediate Representation)
```

The compiler:
1. Parses STX template syntax
2. Extracts Headwind classes → style objects
3. Extracts event handlers → bridge callbacks
4. Outputs JSON IR for each platform renderer

### Layer 2: Platform Renderers

Each platform has a renderer that:
1. Reads STX IR
2. Creates native views
3. Applies layout through its renderer-specific flex engine
4. Binds event handlers to JS bridge

**iOS Renderer** (Swift):
```swift
class STXRenderer {
    func render(_ ir: STXIR) -> UIView {
        switch ir.type {
        case "View":
            return renderView(ir)
        case "Text":
            return renderText(ir)
        case "Button":
            return renderButton(ir)
        // ...
        }
    }
}
```

**Android Renderer** (Kotlin):
```kotlin
class STXRenderer {
    fun render(ir: STXIR): View {
        return when (ir.type) {
            "View" -> renderView(ir)
            "Text" -> renderText(ir)
            "Button" -> renderButton(ir)
            else -> throw IllegalArgumentException()
        }
    }
}
```

### Layer 3: JavaScript Bridge

The JS bridge enables:
- Event handling (native → JS)
- State updates (JS → native)
- API calls (both directions)

At mount time, the shared screen adapter sends the compiled document's root
node through `RENDER`, then hydrates its bindings with the ordinary stx signals
runtime. Reactive changes use revisioned `MUTATE` batches, preserving the live
native view tree instead of replacing it.

```
┌──────────────┐         ┌──────────────┐
│  JavaScript  │ ←─────→ │   Native     │
│   Runtime    │  Bridge │   Renderer   │
│  (Bun/JSC)   │         │ (Swift/Kt)   │
└──────────────┘         └──────────────┘
```

### The app script

`compileNativeBundle({ screens, app: 'app.ts' })` adds a context with no
screen. When the host names the route `__app` (Craft's `nativeApp`), the
bundle installs the `craft` bridge and calls the app module's default export
with `craft` instead of drawing; a function it returns runs when the host ends
the context. It runs once for the app's life, so it is where a phone app keeps
what does not belong to one screen: push registration and following a tapped
notification, background refresh, session housekeeping. The host's app events
arrive as the page's CustomEvents on its global (`craftNotificationResponse`,
`craftNotificationReceived`, `craftSilentPush`, `craftBackgroundRefresh`), and
`craft.background.complete(ok, id)` hands background time back. Every context,
screens included, has `craft.app` (`url`, `version`, `build`): the app's site,
so code reaching its API needs no page to have said where it is.

### Web views as native screens

A web view (`resources/views/*.stx`, with its layout, components and stores)
compiles to a native screen unchanged, and behaves there as it does in the
browser:

- **Stores**: the app's `storesDir` is bundled into the screen ahead of its
  scripts, as the page loads it, so `useStore` finds what `defineStore` made.
  A screen's context has one instance of each store, shared by the view and
  its components; what must outlive the screen lives where it does on the web
  (`localStorage`, `keptState`). Every component with a client script gets a
  scope boundary on a native compile: the web's other path, `stx.mount()`,
  finds its root by the script's place in the DOM.
- **`useHead`**: the title (a server script's `useHead`, then every client
  call, `document.title`) is the navigation title. Meta tags, links and
  document attributes are ignored.
- **Navigation** (`runtime/web-navigation.ts`): `<a href>`, `<StxLink>`,
  `navigate()`, `location` and `history.back()` go through Craft navigation
  by web path (`navigation.open('/plans/12')`, `replace` for a replacing
  move). A pressed link is followed after its own listeners, unless one
  prevented it. Other sites, `mailto:` and `tel:` go to `craft.linking`.
  Native routes are the web paths: nothing adds a `/m` prefix. A `<StxLink>`
  to the screen being shown takes its active and exact-active classes by the
  web router's rule, and `useRoute().params` reads a file-routed view's
  `[id]` segments from the screen's address.
- **Storage** (`runtime/web-storage.ts`): `localStorage` and `sessionStorage`
  are the web's synchronous Storage over `craft.storage.getSync`/`setSync`,
  shared by every screen of the app; sessionStorage lasts for one run (the
  app script starts a new one per launch). `keptState` keeps its values there.
  A key the app shares with its native side (`compileNativeBundle({
  shareStorage })`, Craft's `shareStorage`, such as `auth_token` to
  `auth.token`) is also that secure-storage item, as on Craft's hybrid page:
  a web view's sign-in is `craft.session`'s, and a native sign-in or sign-out
  is adopted and announced as `craftsharedstorage`.
- **Layouts** (`compiler/layout-chrome.ts`): a layout marks its chrome with
  `data-native-chrome` (`tabs`, `bar`, or empty for chrome that is just not
  drawn, such as a footer). The native compile leaves it out; its links are
  the screen's `chrome`: `bar` links become navigation-bar buttons, `tabs` are
  reported by `compileNativeBundle` (`result.chrome[screen].tabs`) for the
  app's tab-bar configuration.

## Current Status

- The compiler, IR, style mapping, CLI, bundle generation and shared-runtime
  adapter live in `packages/stx/src/native`.
- Native screens use the ordinary stx component resolver, server directives,
  client-script bundler, signals and binding manifest. There is no second
  parser or native-only reactivity implementation.
- The versioned host contract renders the document root, registers events, and
  applies revisioned mutation batches against stable node ids.
- The maintained Craft iOS host evaluates bundles in JavaScriptCore, creates
  UIKit views, and uses its real flex layout engine. The buddy iOS vertical
  slice passes on the simulator with native tap and input events, signal-driven
  label updates, preserved focus, and no WebView.
- The Swift and Kotlin renderers in this directory remain useful reference
  implementations. They are covered structurally, but the simulator evidence
  applies to Craft's maintained iOS host, not to those files by implication.

Unsupported behavior must stay explicit: translating a primitive into IR does
not prove that every host implements it. Shared-runtime `:for` performs keyed,
incremental native mutations: retained rows keep their node identities, event
scope and input state, while their ScrollView remains mounted. The maintained
Craft iOS and Android hosts expose `FlatList` as a keyed child-tree protocol,
and the shared primitive types expose `listRole` for its
header/item/separator/empty/footer slots plus controlled `onRefresh`/
`refreshing` pull-to-refresh. Text inputs also retain the shared
`onChange`/`onEndEditing` aliases and multiline `numberOfLines` contract;
value controls also accept the explicit `onChange` alias used by Craft's
maintained iOS and Android hosts, while `@change` remains the shared
`onValueChange` spelling;
native images retain `alt` as their accessibility-label fallback.
Native image sources are URI strings or `{ uri, headers }` objects. Numeric
`require()` asset ids are not part of the maintained Craft host protocol and
are intentionally excluded from the shared type.
The maintained image contract also excludes React Native-only `blurRadius` and
`fadeDuration`; neither Craft host consumes those props.
The native `StatusBar` node is intentionally limited to `barStyle` and
`hidden`: the maintained hosts apply its foreground and visibility traits at
screen scope, while screen/navigation options own the system-bar surface colour
and opacity.
Image failures use the shared `{ nativeEvent: { error: { message } } }`
envelope, matching Craft's maintained iOS and Android hosts.
Native video accepts both `autoplay` and the React-style `autoPlay` alias;
the hosts normalize them to the same playback behavior.
`data`, `renderItem`, `keyExtractor`, and grouped `SectionList` data are
rejected until a versioned list-data protocol is introduced. This keeps the
public types honest while preserving recycling for the child trees that the
hosts can actually reconcile. Ordinary `:for` rows are not virtualized and
should therefore be limited to small and moderate collections.
Pointer-event routing and platform-only press-area options such as `hitSlop`,
`pressRetentionOffset`, and Android ripple configuration are likewise outside
the maintained host-neutral vocabulary.
Modal presentation flags `nonModal` and `dismissOnOutsideTap` are part of the
maintained cross-platform contract; they control parent blocking and outside
tap dismissal without requiring a WebView.
Scroll hosts also share `alwaysBounceHorizontal`, `alwaysBounceVertical`, and
the `keyboardShouldPersistTaps` (`always`/`handled`/`never`) policy. These are
typed because both maintained Craft hosts consume them; unknown values fall
back to the host's `never` policy.
The drag and momentum lifecycle events (`onScrollBeginDrag`, `onScrollEndDrag`,
`onMomentumScrollBegin`, and `onMomentumScrollEnd`) carry the same scroll
payload as `onScroll` on both hosts.
Native `View`, `Text`, `Button`, and `Link` props also accept `onClick` as a
DOM-compatible alias for `onPress`; template `@click` events continue to lower
to the same host-neutral `onPress` event.
The iOS-specific `Switch` tint remains spelled `ios_backgroundColor`, matching
the native host protocol after HTML attribute case restoration.
Maps accept `standard`, `satellite`, or `hybrid` styles on both maintained
hosts. Keyed `polylines` and `markers` arrays are also typed for large overlay
collections; child `MapPolyline` and `MapMarker` nodes remain supported.

## STX IR Format

```typescript
interface STXIR {
  type: string                    // Component type
  props: Record<string, any>      // Properties
  style: StyleObject              // Compiled styles
  events: Record<string, string>  // Event handler names
  children: (STXIR | string)[]    // Child nodes or text
}

interface StyleObject {
  // Layout (interpreted by the host's flex engine)
  flex?: number
  flexDirection?: 'row' | 'column'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  padding?: number | [number, number, number, number]
  margin?: number | [number, number, number, number]
  width?: number | string
  height?: number | string

  // Visual
  backgroundColor?: string
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  opacity?: number

  // Text
  color?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '100' | '200' | ... | '900'
  textAlign?: 'left' | 'center' | 'right'
}
```

## Example Compilation

### Input (voice-buddy.stx)
```stx
<View class="flex-1 bg-gray-900">
  <View class="flex-row items-center p-4 bg-gray-800">
    <Text class="text-white text-xl font-bold">Buddy</Text>
  </View>

  <ScrollView class="flex-1 p-4">
    @foreach(messages as message)
      <View class="p-3 mb-2 rounded-lg {{ message.type === 'user' ? 'bg-blue-600' : 'bg-gray-700' }}">
        <Text class="text-white">{{ message.content }}</Text>
      </View>
    @endforeach
  </ScrollView>

  <View class="flex-row items-center p-4 bg-gray-800">
    <Button class="w-16 h-16 rounded-full bg-red-500" onPress={startRecording}>
      <Text class="text-white text-2xl">🎤</Text>
    </Button>
  </View>
</View>
```

### Output (STX IR)
```json
{
  "type": "View",
  "style": { "flex": 1, "backgroundColor": "#111827" },
  "children": [
    {
      "type": "View",
      "style": {
        "flexDirection": "row",
        "alignItems": "center",
        "padding": 16,
        "backgroundColor": "#1f2937"
      },
      "children": [
        {
          "type": "Text",
          "style": { "color": "#ffffff", "fontSize": 20, "fontWeight": "bold" },
          "children": ["Buddy"]
        }
      ]
    },
    {
      "type": "ScrollView",
      "style": { "flex": 1, "padding": 16 },
      "children": "{{messages}}"
    },
    {
      "type": "View",
      "style": {
        "flexDirection": "row",
        "alignItems": "center",
        "padding": 16,
        "backgroundColor": "#1f2937"
      },
      "children": [
        {
          "type": "Button",
          "style": {
            "width": 64,
            "height": 64,
            "borderRadius": 32,
            "backgroundColor": "#ef4444"
          },
          "events": { "onPress": "startRecording" },
          "children": [
            { "type": "Text", "style": { "color": "#ffffff", "fontSize": 24 }, "children": ["🎤"] }
          ]
        }
      ]
    }
  ]
}
```

## Comparison with Existing Frameworks

| Feature | React Native | Vue Native | STX Native |
|---------|--------------|------------|------------|
| Template Syntax | JSX | Vue SFC | Blade-like |
| Styling | StyleSheet | StyleSheet | Headwind (Tailwind) |
| State Management | useState/Redux | Vuex/Pinia | stx signals |
| Native Rendering | Yes | Yes | Yes |
| Web Support | React DOM | Vue.js | Same .stx files |
| Learning Curve | Medium | Medium | Low (HTML-like) |

## Key Differentiators

1. **Familiar Syntax** - HTML-like templates, not JSX
2. **Headwind Styling** - Tailwind utilities, not StyleSheet objects
3. **Single File Components** - Everything in one .stx file
4. **Universal** - Same template for iOS, Android, Web, Desktop
5. **Lightweight** - No heavy runtime like React

## Next Steps

1. Prove the maintained Android host with the same simulator/device-level bar.
2. Expand host capability tests for navigation and recycling lists.
3. Add native hot reload, inspection and performance tooling without forking
   the compiler or signals runtime again.
