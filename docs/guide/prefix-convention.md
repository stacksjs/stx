# Prefix Convention

stx uses three distinct prefixes for template attributes. Each prefix has a specific role. Learning these three prefixes is all you need to build interactive UIs.

| Prefix | Role | Example |
|--------|------|---------|
| `:` | Directives (control flow) | `:if`, `:show`, `:for`, `:key` |
| `x-` | Bindings (data to DOM) | `x-text`, `x-class`, `x-href`, `x-model` |
| `@` | Events (user actions) | `@click`, `@submit`, `@keydown.enter` |

## Why Three Prefixes?

Vue uses `:` (v-bind shorthand) for both bindings and directives. This conflates two different concepts:

```html
<!-- Vue: ':' means different things in different contexts -->
<div :class="classes" v-if="show">...</div>

<!-- stx: each prefix has one meaning -->
<div x-class="classes" :if="show">...</div>
```

In stx:
- `:` always means "control whether/how this element renders"
- `x-` always means "bind data to a DOM property"
- `@` (as an **attribute**) always means "listen for a user event"

> **The `@` symbol is also used for Blade-style block directives** — `@if`,
> `@foreach`, `@auth`, etc. Those are *statements* in the markup, not element
> attributes. The rule of thumb: `@name(...)` as a standalone statement is a
> directive; `@event="…"` as an attribute on an element is a client event
> listener. See the conditionals section below for how `@if`, `v-if`, and `:if`
> relate.

## Conditionals: `@if`, `v-if`, `:if` are the same thing in different syntax

`@if`, `v-if`, `:if`, and `x-if` are **interchangeable sugar for one
conditional** — not three separate lifecycles. Pick the spelling you like:

| Form | What it is |
|---|---|
| `@if (cond) … @elseif … @else … @endif` | Blade-style statement (the canonical form) |
| `v-if="cond"` / `v-else-if` / `v-else` | Vue sugar — compiles to `@if` |
| `:if="cond"` / `:else-if` / `:else` | attribute form |
| `x-if="cond"` / `x-else-if` / `x-else` | Alpine sugar — same as `:if` |

**What decides whether a conditional is reactive is the data it reads, not the
keyword you typed.** On a page that uses signals (`<script client>` with
`state()` / `derived()` / …):

- A condition that **reads a signal** is wired into the client signals runtime
  (`bindIf` / `bindIfChain`) and **re-evaluates whenever that signal changes** —
  including `@if`/`@elseif`/`@else` and `v-if`/`v-else` chains, which are promoted
  to the reactive runtime form just like `:if`/`:else`.
- A condition over **server data** (`$user`, env, a `@foreach` loop variable) is
  evaluated **once on the server** and the unmatched branches are dropped from the
  HTML. On a page with no signals at all, every conditional renders once on the
  server.

```stx
<script client>
  const loading = state(true)
</script>

@if($user)                                 {{-- server data → rendered once --}}
  {{-- both of these re-render when `loading` flips; the keyword is just style --}}
  <span :if="loading">loading…</span>
  @if(loading) <span>still loading…</span> @else <span>done</span> @endif
@endif
```

So `v-if` is sugar for `@if`, `x-if` is sugar for `:if`, and a signal-driven
`@if`/`v-if` chain behaves exactly like the `:if`/`:else` equivalent. Use whichever
reads best in context.

Two gotchas worth internalizing:

- **`$` is not decoration.** `@if($user)` reads a `<script server>` variable;
  `:if="loading"` reads a client signal scope. Same conditional, but they look in
  different places — a name that exists in one scope may not exist in the other.
- **Reading signals in a condition follows the signals call/bare rule.** In a
  template attribute the auto-unwrap proxy lets you write the bare name
  (`:if="loading"`); call syntax (`:if="loading()"`) also works because the
  binder retries evaluation without the proxy (#1733). Both are fine — but if
  you ever see an element silently stay hidden, suspect a signal/function
  mix-up here first.

## Directives (`:` prefix)

Directives control the structure and visibility of elements. They determine **whether** an element exists or **how** it repeats.

### `:if` -- Conditional Rendering

Adds or removes the element from the DOM based on a condition.

```html
<div :if="isLoggedIn()">Welcome back!</div>
<div :if="!isLoggedIn()">Please log in.</div>
```

When the condition is false, the element is completely removed from the DOM (not just hidden).

### `:show` -- Conditional Visibility

Toggles the element's visibility via `display: none`. The element stays in the DOM.

```html
<div :show="isOpen()">
  This content is hidden but still in the DOM when isOpen() is false.
</div>
```

Use `:show` when you toggle frequently (cheaper than adding/removing DOM nodes). Use `:if` when the element is rarely shown or has expensive children.

### `:for` -- List Rendering

Repeats an element for each item in an array.

```html
<ul>
  <li :for="item in items()" :key="item.id">
    <span x-text="item.name"></span>
  </li>
</ul>
```

Always use `:key` with `:for` to help the runtime efficiently update the list.

Supports destructuring and index:

```html
<div :for="(item, index) in items()" :key="item.id">
  <span x-text="index + 1"></span>. <span x-text="item.name"></span>
</div>
```

### `:key` -- Identity for List Items

Tells the runtime how to track items across re-renders. Must be a unique, stable identifier.

```html
<!-- Good: unique ID -->
<li :for="user in users()" :key="user.id">...</li>

<!-- Bad: index as key (breaks reordering) -->
<li :for="(user, i) in users()" :key="i">...</li>
```

### Complete Directives Table

| Directive | Purpose | Example |
|-----------|---------|---------|
| `:if` | Conditional rendering (add/remove DOM) | `:if="count() > 0"` |
| `:show` | Conditional visibility (toggle display) | `:show="menuOpen()"` |
| `:for` | List rendering | `:for="item in items()"` |
| `:key` | Unique identity for list items | `:key="item.id"` |

## Bindings (`x-` prefix)

Bindings connect reactive data to DOM attributes and properties. When the signal changes, the DOM updates automatically.

### `x-text` -- Text Content

Sets the text content of an element.

```html
<span x-text="count()"></span>
<p x-text="'Hello, ' + name()"></p>
<td x-text="item.price.toFixed(2)"></td>
```

### `x-html` -- HTML Content

Sets the innerHTML of an element. Use with caution -- only with trusted content.

```html
<div x-html="markdownContent()"></div>
```

> **Security warning:** Never use `x-html` with user-provided content. It can introduce XSS vulnerabilities.

### `x-class` -- Dynamic CSS Classes

Adds or removes CSS classes based on conditions.

**Object syntax** (recommended):

```html
<div x-class="{ 'bg-blue-500': isActive(), 'opacity-50': isDisabled() }">
  Styled element
</div>
```

**String syntax**:

```html
<div x-class="currentTheme()">Themed element</div>
```

You can combine `x-class` with static `class`:

```html
<button class="px-4 py-2 rounded" x-class="{ 'bg-blue-500 text-white': selected(), 'bg-gray-200': !selected() }">
  Toggle
</button>
```

### `x-style` -- Dynamic Inline Styles

Sets inline styles from an object.

```html
<div x-style="{ color: textColor(), fontSize: size() + 'px' }">
  Styled text
</div>
```

### `x-model` -- Two-Way Binding

Binds a form input to a signal. Changes to the input update the signal, and changes to the signal update the input.

```html
<script client>
const name = state('')
const agreed = state(false)
const color = state('blue')
</script>

<input type="text" x-model="name" placeholder="Your name" />
<p>Hello, <span x-text="name()"></span></p>

<label>
  <input type="checkbox" x-model="agreed" />
  I agree to the terms
</label>

<select x-model="color">
  <option value="red">Red</option>
  <option value="blue">Blue</option>
  <option value="green">Green</option>
</select>
<p>Selected: <span x-text="color()"></span></p>
```

### `x-href` -- Dynamic URL

Sets the `href` attribute reactively.

```html
<a x-href="'/users/' + userId()">View Profile</a>
```

### `x-src` -- Dynamic Image Source

Sets the `src` attribute reactively.

```html
<img x-src="user().avatarUrl" alt="Avatar" />
```

### `x-cloak` -- Hide Until Hydrated

Hides an element until the signals runtime has processed it. Prevents flash of unprocessed content.

```html
<style>
  [x-cloak] { display: none !important; }
</style>

<div x-cloak>
  <span x-text="greeting()"></span> <!-- Won't flash "greeting()" before hydration -->
</div>
```

### Complete Bindings Table

| Binding | Purpose | Example |
|---------|---------|---------|
| `x-text` | Set text content | `x-text="count()"` |
| `x-html` | Set HTML content (use with caution) | `x-html="rendered()"` |
| `x-class` | Toggle CSS classes | `x-class="{ active: isOn() }"` |
| `x-style` | Set inline styles | `x-style="{ color: c() }"` |
| `x-model` | Two-way form binding | `x-model="name"` |
| `x-href` | Dynamic link URL | `x-href="url()"` |
| `x-src` | Dynamic image source | `x-src="imgUrl()"` |
| `x-cloak` | Hide until hydrated | `x-cloak` (no value) |

## Events (`@` prefix)

Events attach handlers to user interactions. The `@` prefix is followed by the event name and optional modifiers.

### Basic Events

```html
<button @click="increment()">Click me</button>
<form @submit="handleSubmit()">...</form>
<input @input="handleInput()">
<div @mouseenter="showTooltip()" @mouseleave="hideTooltip()">Hover me</div>
```

### Inline Expressions

Simple expressions can be used directly:

```html
<button @click="count.set(count() + 1)">+1</button>
<button @click="open.set(!open())">Toggle</button>
<button @click="items.set([])">Clear</button>
```

### The `$event` Variable

Access the native event object with `$event`:

```html
<input @input="search.set($event.target.value)">
<div @click="handleClick($event)">Click position tracking</div>
```

### Event Modifiers

Modifiers are chained after the event name with dots.

| Modifier | Effect | Example |
|----------|--------|---------|
| `.prevent` | Calls `event.preventDefault()` | `@submit.prevent="save()"` |
| `.stop` | Calls `event.stopPropagation()` | `@click.stop="handle()"` |
| `.once` | Fires handler only once | `@click.once="init()"` |
| `.self` | Only fires if target is the element itself | `@click.self="close()"` |
| `.passive` | Passive event listener (performance) | `@scroll.passive="onScroll()"` |
| `.capture` | Use capture mode | `@click.capture="log()"` |

Combine modifiers:

```html
<form @submit.prevent.stop="handleSubmit()">
  <button type="submit">Submit</button>
</form>

<a @click.prevent.stop="navigate('/about')">About</a>
```

### Key Modifiers

For keyboard events, chain a key name after the event:

| Modifier | Key |
|----------|-----|
| `.enter` | Enter |
| `.escape` | Escape |
| `.tab` | Tab |
| `.space` | Space |
| `.up` | Arrow Up |
| `.down` | Arrow Down |
| `.left` | Arrow Left |
| `.right` | Arrow Right |
| `.delete` | Delete |
| `.backspace` | Backspace |

```html
<input @keydown.enter="submitSearch()">
<input @keydown.escape="clearInput()">
<div @keydown.up="selectPrevious()" @keydown.down="selectNext()">
  <!-- Keyboard-navigable list -->
</div>
```

### System Modifiers

Require a modifier key to be held:

| Modifier | Key |
|----------|-----|
| `.ctrl` | Control |
| `.alt` | Alt / Option |
| `.shift` | Shift |
| `.meta` | Command (Mac) / Windows key |

```html
<input @keydown.ctrl.s="save()">
<input @keydown.meta.enter="send()">
<div @click.ctrl="selectMultiple()">
  Hold Ctrl and click to multi-select
</div>
```

### Mouse Button Modifiers

```html
<div @click.left="handleLeft()">Left click only</div>
<div @click.right="handleContext()">Right click only</div>
<div @click.middle="openInNewTab()">Middle click only</div>
```

### Complete Events Table

| Event | When it Fires | Common Use |
|-------|---------------|-----------|
| `@click` | Element is clicked | Buttons, toggles, navigation |
| `@dblclick` | Element is double-clicked | Edit-in-place |
| `@submit` | Form is submitted | Form handling |
| `@input` | Input value changes | Real-time search, validation |
| `@change` | Input value committed | Select dropdowns, checkboxes |
| `@focus` | Element gains focus | Show help text |
| `@blur` | Element loses focus | Validate on blur |
| `@keydown` | Key is pressed down | Keyboard shortcuts |
| `@keyup` | Key is released | Key release actions |
| `@mouseenter` | Mouse enters element | Tooltips, hover effects |
| `@mouseleave` | Mouse leaves element | Hide tooltips |
| `@scroll` | Element is scrolled | Infinite scroll, scroll spy |

## Migration from Other Frameworks

If you are coming from Vue, Alpine.js, or an earlier version of stx, here is how the prefixes map.

### From Vue

| Vue | stx | Notes |
|-----|-----|-------|
| `v-if` | `:if` | Same behavior |
| `v-show` | `:show` | Same behavior |
| `v-for` | `:for` | Same behavior |
| `:key` | `:key` | Same |
| `:class` | `x-class` | Different prefix |
| `:style` | `x-style` | Different prefix |
| `:href` | `x-href` | Different prefix |
| `:src` | `x-src` | Different prefix |
| `v-model` | `x-model` | Different prefix |
| `v-text` | `x-text` | Different prefix |
| `v-html` | `x-html` | Different prefix |
| `@click` | `@click` | Same |
| `@submit.prevent` | `@submit.prevent` | Same |
| `v-cloak` | `x-cloak` | Different prefix |

### From Alpine.js

| Alpine | stx | Notes |
|--------|-----|-------|
| `x-if` | `:if` | Different prefix |
| `x-show` | `:show` | Different prefix |
| `x-for` | `:for` | Different prefix |
| `:class` | `x-class` | Same prefix |
| `x-text` | `x-text` | Same |
| `x-html` | `x-html` | Same |
| `x-model` | `x-model` | Same |
| `@click` | `@click` | Same |
| `x-cloak` | `x-cloak` | Same |

## Common Mistakes

> **`:class` is wrong -- use `x-class`.**
> The `:` prefix is for directives (control flow). Class binding is a data-to-DOM binding, so it uses `x-class`.

```html
<!-- Wrong -->
<div :class="{ active: isActive() }">

<!-- Correct -->
<div x-class="{ active: isActive() }">
```

> **`:href` is wrong -- use `x-href`.**
> Same reasoning. Binding a URL to the `href` attribute is a binding operation.

```html
<!-- Wrong -->
<a :href="url()">Link</a>

<!-- Correct -->
<a x-href="url()">Link</a>
```

> **`:text` is wrong -- use `x-text`.**
> All attribute bindings use the `x-` prefix.

```html
<!-- Wrong -->
<span :text="name()"></span>

<!-- Correct -->
<span x-text="name()"></span>
```

> **`x-if` is wrong -- use `:if`.**
> All control flow directives use the `:` prefix.

```html
<!-- Wrong -->
<div x-if="show()">Content</div>

<!-- Correct -->
<div :if="show()">Content</div>
```

> **`x-for` is wrong -- use `:for`.**
> List rendering is control flow, not binding.

```html
<!-- Wrong -->
<li x-for="item in items()">...</li>

<!-- Correct -->
<li :for="item in items()" :key="item.id">...</li>
```

## Putting It All Together

Here is a complete example using all three prefixes:

```html
<script client>
const todos = state([
  { id: 1, text: 'Learn stx', done: true },
  { id: 2, text: 'Build an app', done: false },
  { id: 3, text: 'Deploy it', done: false },
])
const newTodo = state('')
const filter = state('all')

const filtered = derived(() => {
  const f = filter()
  const all = todos()
  if (f === 'active') return all.filter(t => !t.done)
  if (f === 'done') return all.filter(t => t.done)
  return all
})

const remaining = derived(() => todos().filter(t => !t.done).length)

function addTodo() {
  const text = newTodo().trim()
  if (!text) return
  todos.update(arr => [...arr, { id: Date.now(), text, done: false }])
  newTodo.set('')
}

function toggleTodo(id) {
  todos.update(arr =>
    arr.map(t => t.id === id ? { ...t, done: !t.done } : t)
  )
}

function removeTodo(id) {
  todos.update(arr => arr.filter(t => t.id !== id))
}
</script>

<div class="max-w-md mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">Todos</h1>

  <!-- @submit with .prevent modifier -->
  <form @submit.prevent="addTodo()" class="flex gap-2 mb-4">
    <!-- x-model for two-way binding -->
    <input x-model="newTodo" placeholder="What needs doing?" class="flex-1 border rounded px-3 py-2" />
    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
  </form>

  <!-- @click for filter buttons, x-class for active state -->
  <div class="flex gap-2 mb-4">
    <button @click="filter.set('all')" x-class="{ 'font-bold underline': filter() === 'all' }">All</button>
    <button @click="filter.set('active')" x-class="{ 'font-bold underline': filter() === 'active' }">Active</button>
    <button @click="filter.set('done')" x-class="{ 'font-bold underline': filter() === 'done' }">Done</button>
  </div>

  <!-- :for for list rendering, :key for identity -->
  <ul>
    <li :for="todo in filtered()" :key="todo.id" class="flex items-center gap-2 py-2 border-b">
      <!-- @click to toggle, x-class for strikethrough -->
      <input type="checkbox" @click="toggleTodo(todo.id)" />
      <span x-text="todo.text" x-class="{ 'line-through text-gray-400': todo.done }" class="flex-1"></span>
      <button @click="removeTodo(todo.id)" class="text-red-500 text-sm">Remove</button>
    </li>
  </ul>

  <!-- :show for conditional visibility, x-text for dynamic text -->
  <p :show="remaining() > 0" class="mt-4 text-sm text-gray-500">
    <span x-text="remaining()"></span> item(s) remaining
  </p>
</div>
```

## Quick Reference Card

```
DIRECTIVES (:)          BINDINGS (x-)           EVENTS (@)
:if="condition"         x-text="value"          @click="handler()"
:show="condition"       x-html="html"           @submit.prevent="fn()"
:for="item in list"     x-class="{ c: bool }"   @keydown.enter="fn()"
:key="unique-id"        x-style="{ k: v }"      @input="fn()"
                        x-model="signal"         @change="fn()"
                        x-href="url"             @focus="fn()"
                        x-src="imgUrl"           @blur="fn()"
                        x-cloak                  @mouseenter="fn()"
                                                 @mouseleave="fn()"
```
