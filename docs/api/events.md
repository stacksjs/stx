# Events Reference

Event handlers in stx use the `@event` syntax to bind DOM events to expressions or function calls. They support modifiers for common patterns like `preventDefault`, key filtering, and one-shot handlers.

## Basic Syntax

```
@event.modifier1.modifier2="expression"
```

The expression is evaluated in the component's reactive scope. The native DOM event is available as `$event`.

## Event Handlers

### Click

```html
<button @click="handleClick()">Click me</button>
<button @click="count.set(count() + 1)">Increment</button>
<button @click="open = !open">Toggle</button>
```

### Submit

```html
<form @submit.prevent="handleSubmit($event)">
  <input type="text" x-model="query" />
  <button type="submit">Search</button>
</form>
```

### Keyboard

```html
<input @keydown.enter="search()" />
<input @keydown.escape="close()" />
<div @keydown.space="togglePlay()"></div>
```

### Mouse

```html
<div @mouseenter="showTooltip()" @mouseleave="hideTooltip()"></div>
<div @dblclick="editItem()"></div>
```

### Input / Change

```html
<input @input="onInput($event)" />
<select @change="onSelect($event)"></select>
```

## Supported Events

The runtime recognizes these event names directly:

| Event | Description |
|-------|-------------|
| `click` | Mouse click |
| `dblclick` | Double click |
| `mousedown` | Mouse button pressed |
| `mouseup` | Mouse button released |
| `mousemove` | Mouse moved |
| `mouseenter` | Mouse entered element |
| `mouseleave` | Mouse left element |
| `keydown` | Key pressed |
| `keyup` | Key released |
| `keypress` | Key pressed (deprecated, use keydown) |
| `input` | Input value changed |
| `change` | Value committed (blur or select) |
| `submit` | Form submitted |
| `focus` | Element focused |
| `blur` | Element lost focus |
| `scroll` | Element scrolled |
| `resize` | Window resized |
| `touchstart` | Touch began |
| `touchend` | Touch ended |
| `touchmove` | Touch moved |
| `contextmenu` | Right-click / context menu |
| `wheel` | Mouse wheel scrolled |
| `pointerdown` | Pointer pressed |
| `pointerup` | Pointer released |
| `pointermove` | Pointer moved |

## Modifiers

Modifiers are chained after the event name with dots.

### Action Modifiers

| Modifier | Effect |
|----------|--------|
| `.prevent` | Calls `event.preventDefault()` |
| `.stop` | Calls `event.stopPropagation()` |
| `.once` | Handler fires only once, then is removed |

```html
<a @click.prevent="navigate('/about')">About</a>
<div @click.stop="handleInner()">Won't bubble</div>
<button @click.once="initialize()">Init (once)</button>
<form @submit.prevent.stop="handleSubmit($event)">...</form>
```

### Key Modifiers

Filter keyboard events by key. Only fires when the specified key matches `event.key`.

| Modifier | `event.key` value |
|----------|-------------------|
| `.enter` | `Enter` |
| `.tab` | `Tab` |
| `.escape` | `Escape` |
| `.space` | ` ` (space character) |
| `.up` | `ArrowUp` |
| `.down` | `ArrowDown` |
| `.left` | `ArrowLeft` |
| `.right` | `ArrowRight` |
| `.delete` | `Delete` |
| `.backspace` | `Backspace` |

```html
<input @keydown.enter="submitForm()" />
<input @keydown.escape="clearInput()" />
<div @keydown.up="selectPrevious()" @keydown.down="selectNext()"></div>
<div @keydown.space="toggleSelection()"></div>
```

### System Modifiers

Require a system modifier key to be held.

| Modifier | Check |
|----------|-------|
| `.ctrl` | `event.ctrlKey` |
| `.alt` | `event.altKey` |
| `.shift` | `event.shiftKey` |
| `.meta` | `event.metaKey` (Cmd on macOS, Win on Windows) |

```html
<input @keydown.ctrl.enter="submitAndClose()" />
<div @click.meta="openInNewTab()"></div>
<button @click.shift="selectRange()"></button>
```

### Combining Modifiers

Modifiers can be combined freely:

```html
<form @submit.prevent.stop="handleSubmit($event)"></form>
<input @keydown.ctrl.shift.enter="executeCommand()" />
<a @click.prevent.once="trackFirstClick()">Link</a>
```

## The `$event` Object

The native DOM event is available as `$event` in handler expressions:

```html
<input @input="search($event.target.value)" />
<div @click="handleClick($event.clientX, $event.clientY)"></div>
<form @submit.prevent="onSubmit($event)"></form>
```

## Signal Writeback

When the handler expression is a **direct assignment** to a variable, stx detects this and writes back through `signal.set()` automatically:

```html
<button @click="count = count + 1">Increment</button>
<button @click="open = !open">Toggle</button>
<button @click="name = 'Alice'">Set name</button>
```

The writeback check uses the pattern `/^[a-zA-Z_$]\w*\s*=/` — it only triggers for direct variable assignments like `count = ...` or `open = ...`.

**Function calls do not trigger writeback:**

```html
<!-- These call functions that internally use signal.set() -->
<button @click="increment()">+1</button>
<button @click="store.toggle()">Toggle</button>
```

> **Warning:** The writeback mechanism exists specifically for inline assignment expressions. If a function call expression were to trigger writeback, it would reset the signal to its pre-handler value, undoing the function's internal `signal.set()` calls. The `isDirectAssignment` guard prevents this.

## Component Events (defineEmits)

Components can emit custom events to parent templates:

```html
<!-- ChildComponent.stx -->
<script>
const emit = defineEmits()

function handleClick() {
  emit('select', { id: 42, name: 'Item' })
}
</script>

<button @click="handleClick()">Select</button>
```

```html
<!-- Parent usage -->
<ChildComponent @select="onItemSelected($event.detail)" />
```

Emitted events use `CustomEvent` with `bubbles: true` for DOM propagation. The `@event` attributes on component tags are forwarded to the component's root element.

## Double-Bind Guard

Event handlers have guards (`el.__stx_evt_<event>`) to prevent duplicate binding when `processElement` runs multiple times on the same element. This is an internal safeguard — no action required from users.
