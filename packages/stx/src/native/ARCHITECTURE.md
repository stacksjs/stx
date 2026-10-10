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
decoration and case transforms. Native images support `cover`, `contain`,
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
scope and input state, while their ScrollView remains mounted. It is not a
virtualizer and currently materialises every row, so use it for small and
moderate collections. Large feeds should use `FlatList` only when the selected
host advertises recycling-list support; there is no cross-host `FlatList`
guarantee yet. Production Android host parity, hot reload, and profiler tooling
remain follow-up work rather than implications of the proven iOS path.

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
