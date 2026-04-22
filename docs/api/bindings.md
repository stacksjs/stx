# Bindings Reference

Bindings reactively synchronize data between your component state and the DOM. They use the `x-` prefix or the shorthand `:` prefix.

All binding expressions are evaluated in the component's reactive scope. Signal values are auto-unwrapped — if `count` is a signal, writing `x-text="count"` evaluates to the signal's value, not the signal function itself.

## x-text

Sets the element's `textContent` reactively. HTML is escaped.

```html
<span x-text="username"></span>
<span :text="'Hello, ' + name"></span>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-text` | `string` (expression) | Expression whose result replaces the element's text content |

Aliases: `:text`, `@text`

## x-html

Sets the element's `innerHTML` reactively. The expression result is inserted as raw HTML.

```html
<div x-html="markdownRendered"></div>
<div :html="'<strong>' + title + '</strong>'"></div>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-html` | `string` (expression) | Expression whose result replaces the element's inner HTML |

Aliases: `:html`, `@html`

> **Warning:** `x-html` inserts unescaped HTML. Never bind user-supplied content without sanitization. Use the `@stacksjs/sanitizer` package or server-side sanitization to prevent XSS.

## x-class

Adds or removes CSS classes reactively. Supports three syntax forms.

### Ternary / expression syntax

```html
<div x-class="isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100'"></div>
```

### Object syntax

Keys are class names, values are boolean expressions:

```html
<div x-class="{ active: isActive, 'text-bold': score > 10, hidden: !visible }"></div>
```

### Array syntax

```html
<div x-class="[baseClass, isError ? 'text-red-500' : '']"></div>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-class` | `string \| object \| array` (expression) | Classes to add/remove reactively |

Aliases: `:class`

> **Note:** `x-class` merges with any static `class` attribute on the element. It does not replace existing classes.

## x-style

Sets inline styles reactively.

### String syntax

```html
<div x-style="'color: ' + textColor + '; font-size: ' + size + 'px'"></div>
```

### Object syntax

```html
<div x-style="{ color: textColor, fontSize: size + 'px', display: visible ? 'block' : 'none' }"></div>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-style` | `string \| object` (expression) | Inline styles to apply reactively |

Aliases: `:style`

## x-model

Two-way binding between a form element and a signal. Listens to `input` events on text inputs/textareas and `change` events on checkboxes/selects/radios.

```html
<input type="text" x-model="email" />
<textarea x-model="message"></textarea>
<select x-model="selectedOption">
  <option value="a">A</option>
  <option value="b">B</option>
</select>
<input type="checkbox" x-model="agreed" />
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-model` | `string` (signal name) | Signal to bind bidirectionally to the form element's value |

Aliases: `:model`, `@model`

The bound signal is updated via `signal.set()` whenever the user types or changes the input. The element's value/checked state is updated whenever the signal changes.

### Supported element types

| Element | Reads | Writes |
|---------|-------|--------|
| `<input type="text">` | `.value` | `input` event |
| `<input type="checkbox">` | `.checked` | `change` event |
| `<input type="radio">` | `.value` (when checked) | `change` event |
| `<textarea>` | `.value` | `input` event |
| `<select>` | `.value` | `change` event |

> **Warning:** The expression must be a signal name, not an arbitrary expression. `x-model="user.name"` does not work — use a dedicated signal instead.

## x-show

Toggles element visibility by setting `display: none` when the expression is falsy.

```html
<div x-show="isOpen">Dropdown content</div>
<p x-show="items.length > 0">Showing results</p>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-show` | `string` (expression) | When falsy, element gets `display: none`; when truthy, display is restored |

Aliases: `:show`, `@show`

> **Note:** The element remains in the DOM. For conditional rendering that adds/removes elements, use `:if` / `x-if`.

## x-if

Conditionally inserts or removes the element from the DOM.

```html
<div x-if="isLoggedIn">Welcome back!</div>
<p x-if="error">Something went wrong: <span x-text="error"></span></p>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-if` | `string` (expression) | When truthy, element is in the DOM; when falsy, replaced with a comment placeholder |

Aliases: `:if`, `@if`

When the condition becomes truthy again, the element is re-inserted and its children are re-processed (bindings re-applied). Child processing is deferred via `setTimeout(0)` to prevent nested effects from subscribing to the parent's tracked signals.

> **Warning:** Avoid the `>` operator in `x-if` expressions inside HTML attributes — the regex-based parser may interpret it as a tag closer. Use `>=` or negate the condition instead:
> ```html
> <!-- Bad: may break -->
> <div x-if="count > 0">...</div>
>
> <!-- Good -->
> <div x-if="count >= 1">...</div>
> ```

## x-for

Renders the element once for each item in an array.

```html
<div x-for="item in items">
  <span x-text="item.name"></span>
</div>
```

### With index

Parenthesized syntax (Alpine-compatible):

```html
<li x-for="(item, index) in items">
  <span x-text="index + 1"></span>. <span x-text="item.name"></span>
</li>
```

### With key

```html
<div x-for="user in users" :key="user.id">
  <p x-text="user.name"></p>
</div>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-for` | `string` | Iteration expression: `item in array` or `(item, index) in array` |
| `:key` | `string` (expression) | Unique key per item for efficient DOM diffing |

Aliases: `:for`, `@for`

> **Important:** Place `x-for` directly on the element to be repeated. Do not use `<template x-for>` — stx strips `<template>` tags during server processing.

## x-ref

Assigns a DOM element reference accessible via `useRef()`.

```html
<input x-ref="searchInput" type="text" />
<canvas x-ref="chart"></canvas>
```

```html
<script>
const input = useRef('searchInput')

onMount(() => {
  input.current.focus()
})
</script>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-ref` | `string` | Name to register the element under in `$refs` |

Aliases: `:ref`

## x-cloak

Hides the element until the signals runtime processes it. Prevents a flash of unprocessed template content (FOUC).

```html
<div x-cloak>
  <span x-text="greeting"></span>
</div>
```

The runtime removes the `x-cloak` attribute after processing. Pair with CSS:

```css
[x-cloak] { display: none !important; }
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-cloak` | `boolean` (no value) | Removed by runtime after element is processed |

## x-bind (generic attribute binding)

Any `x-bind:attr` or shorthand `:attr` dynamically sets an HTML attribute.

```html
<a x-bind:href="'/users/' + userId">Profile</a>
<img :src="imageUrl" :alt="imageAlt" />
<button :disabled="isSubmitting">Submit</button>
<input :placeholder="'Search ' + category + '...'" />
```

| Syntax | Description |
|--------|-------------|
| `x-bind:href="expr"` | Sets `href` reactively |
| `:src="expr"` | Shorthand for `x-bind:src` |
| `:disabled="expr"` | Boolean attribute — removed when falsy |
| `:aria-label="expr"` | Works with any attribute name |

### Reserved directive names

The following names are handled by dedicated processors and are not generic attribute bindings:

`class`, `style`, `text`, `html`, `show`, `model`, `if`, `for`, `ref`

Any `:attr` not in this list becomes a dynamic attribute binding.

## x-data

Defines a reactive scope on an element. State properties are wrapped in signals automatically.

```html
<div x-data="{ count: 0, name: 'World' }">
  <p x-text="'Hello, ' + name"></p>
  <button @click="count = count + 1" x-text="'Clicked ' + count + ' times'"></button>
</div>
```

### With init method

```html
<div x-data="{ items: null, async init() { this.items = await fetch('/api/items').then(r => r.json()) } }">
  <div x-for="item in items" :key="item.id">
    <p x-text="item.name"></p>
  </div>
</div>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `x-data` | `string` (object literal) | Reactive state scope. Properties become signals. `init()` runs automatically. |

The `init()` method supports async — the UI re-renders when the promise resolves. TypeErrors during initial render (before async data loads) are silently caught and re-evaluated when signals update.

> **Important:** `x-data` triggers injection of the signals runtime. The reactive bridge (`reactive.ts`) parses the object, wraps properties in signals, and registers the scope. The signals runtime then handles all directive processing within that scope.

## Double-Bind Guards

All binding functions have internal guards to prevent duplicate processing when `processElement` is called multiple times on the same element. Each binding sets a flag (e.g., `el.__stx_show_bound`, `el.__stx_model_bound`) after first processing. This is an implementation detail — no action required from users.
