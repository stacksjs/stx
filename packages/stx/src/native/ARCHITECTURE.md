# STX Native Architecture

Making STX compile to native UI components like React Native.

## Overview

STX Native transforms `.stx` templates into native UI on iOS, Android, and desktop platforms. Instead of rendering HTML in a WebView, STX components compile to truly native views.

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
| `<FlatList>` | `UITableView` | `RecyclerView` | Virtual list |
| `<TouchableOpacity>` | `UIButton` | `View+clickListener` | `<div onclick>` |
| `<Modal>` | `UIViewController` | `Dialog` | `<dialog>` |
| `<Switch>` | `UISwitch` | `Switch` | `<input type="checkbox">` |
| `<Slider>` | `UISlider` | `SeekBar` | `<input type="range">` |

### 2. Styling with Headwind

Headwind classes compile to native layout constraints:

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

// Yoga layout constraints
view.yoga.flexGrow = 1
view.yoga.flexDirection = .row
view.yoga.justifyContent = .spaceBetween
view.yoga.alignItems = .center
view.yoga.padding = 16
```

### 3. Event Handling

STX events map to native callbacks:

```stx
<script>
function handlePress() {
  console.log('Pressed!')
}
</script>

<Button onPress={handlePress}>Click Me</Button>
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
3. Applies layout (via Yoga/Flexbox)
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

```
┌──────────────┐         ┌──────────────┐
│  JavaScript  │ ←─────→ │   Native     │
│   Runtime    │  Bridge │   Renderer   │
│  (Bun/JSC)   │         │ (Swift/Kt)   │
└──────────────┘         └──────────────┘
```

## Implementation Plan

### Phase 1: Core Infrastructure

1. **STX IR Schema** - Define JSON format for compiled templates
2. **Headwind-to-Style Compiler** - Convert classes to style objects
3. **Event Extraction** - Parse and register event handlers

### Phase 2: iOS Renderer

1. **Yoga Integration** - Flexbox layout engine
2. **Component Library** - Native UIKit wrappers
3. **Bridge Protocol** - JavaScriptCore communication

### Phase 3: Android Renderer

1. **Yoga Integration** - Flexbox for Android
2. **Component Library** - Native View wrappers
3. **Bridge Protocol** - V8/Hermes communication

### Phase 4: Hot Reload & DevTools

1. **Metro-like bundler** - Fast refresh support
2. **Inspector** - Component tree visualization
3. **Performance profiler** - Native metrics

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
  // Layout (Yoga)
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
| State Management | useState/Redux | Vuex/Pinia | Script exports |
| Native Rendering | Yes | Yes | Yes (planned) |
| Web Support | React DOM | Vue.js | Same .stx files |
| Learning Curve | Medium | Medium | Low (HTML-like) |

## Key Differentiators

1. **Familiar Syntax** - HTML-like templates, not JSX
2. **Headwind Styling** - Tailwind utilities, not StyleSheet objects
3. **Single File Components** - Everything in one .stx file
4. **Universal** - Same template for iOS, Android, Web, Desktop
5. **Lightweight** - No heavy runtime like React

## Next Steps

1. [ ] Implement STX IR compiler
2. [ ] Create Headwind-to-native-style transformer
3. [ ] Build iOS renderer with Yoga
4. [ ] Build Android renderer with Yoga
5. [ ] Implement JS bridge (JavaScriptCore/Hermes)
6. [ ] Add hot reload support
7. [ ] Create CLI tooling (`stx run ios`, `stx run android`)
