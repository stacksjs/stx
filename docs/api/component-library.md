# Component Library

stx splits its components into two layers, registered the same way and called the same way, but living in different packages:

| Layer | Package | What lives here |
|-------|---------|-----------------|
| **Engine builtins** | `@stacksjs/stx` | Components that need deep template-processor integration or inject runtime globals — `<StxLink>`, `<StxImage>`, `<Icon>`, `<StxLoadingIndicator>`, `<StxToast>`, `<StxModal>`, `<StxDrawer>`. See [Builtin Components](./builtins.md). |
| **Presentational** | `@stacksjs/components` | Plain `.stx` components for the bulk of a UI — Button, Card, Switch, Tabs, Accordion, form inputs, etc. Installed separately. |

Both layers can be invoked two equivalent ways: as a JSX-style tag or via the Blade-style `@component` directive. Pick whichever fits the situation; they compile to the same thing.

## Publishing a Web Component Library

STX components can also compile into standards-based custom elements for a design system that must work in plain HTML, React, Vue, Angular, Svelte, server components, and non-STX applications. This is a library build—not an application hydration mode—and produces independently consumable ESM, CSS, metadata, and types.

```bash
stx components:build src/components --out dist --prefix acme
```

Given `src/components/Button.stx`, this infers `<acme-button>` and emits:

| Output | Purpose |
|--------|---------|
| `acme-button.js` / `.d.ts` / `.css` | Tree-shakeable component entry, types, and CSS |
| `runtime.js` | Shared, zero-dependency web-platform runtime |
| `index.js` / `index.d.ts` | Library exports |
| `bundle.js` / `bundle.css` | Single-file distribution builds |
| `custom-elements.json` | Custom Elements Manifest for IDEs and ecosystem tools |
| `custom-elements.d.ts` | JSX intrinsic-element props and event handlers |
| `ssr.js` / `ssr.d.ts` | Escaping SSR helpers; Shadow components use Declarative Shadow DOM |

The defaults are intentionally progressive: Light DOM, scoped CSS that can load before JavaScript, preservation of server-rendered markup, and enhancement on connection. Pass `--shadow` when a primitive genuinely benefits from Shadow DOM. Shadow components embed their CSS and the SSR helper emits `<template shadowrootmode="open">`, so their first render still does not depend on JavaScript.

### Component authoring

The HTML is ordinary STX. A static JSON metadata block declares the cross-framework public contract. Keeping this block data-only makes builds deterministic and lets STX generate manifests and types without executing component source.

```html
<!-- src/components/Button.stx -->
<script component type="application/json">
{
  "description": "A design-system action button.",
  "properties": {
    "label": { "type": "string", "default": "Save", "description": "Visible text." },
    "disabled": { "type": "boolean", "default": false },
    "options": { "type": "object", "attribute": false }
  },
  "events": {
    "activate": { "description": "Fires when activated.", "detailType": "{ label: string }" }
  }
}
</script>

<template>
  <button
    type="button"
    @click.prevent="activate"
    :disabled="disabled"
  >{{ label }}</button>
</template>

<script client>
function activate(event) {
  this.emit('activate', { label: this.label, originalEvent: event })
}
</script>

<style>
:host {
  --acme-button-color: royalblue;
  display: inline-block;
}

button {
  color: var(--acme-button-color);
}
</style>
```

Client functions become element methods. Event directives accept a method name and the familiar `.prevent` and `.stop` modifiers. Simple STX bindings such as `:disabled="disabled"`, `:class="variant"`, and `{{ label }}` react to property changes. `{{ value }}` is HTML-escaped; `{!! trustedHtml !!}` is the explicit raw-HTML escape hatch.

Property types are `string`, `number`, `boolean`, `object`, and `array`. Properties reflect to kebab-case attributes by default. Use `"attribute": false` for property-only values, a string for a custom attribute name, or `"reflect": false` to accept attribute input without reflecting later property writes.

### Programmatic builds

Build scripts can use the typed API when entries or metadata are generated elsewhere:

```ts
import { buildComponentLibrary } from '@stacksjs/stx'

const result = await buildComponentLibrary({
  inputDir: 'src/components',
  outputDir: 'dist',
  prefix: 'acme',
  progressive: true,
  manifest: true,
  declarations: true,
  css: true,
  bundle: true,
  minify: true,
  sourcemap: 'external',
})

console.log(result.components, result.totalBytes)
```

Set `components` for an explicit allow-list and to override `name`, `tag`, props, events, or methods per source file. Auto-discovery is recursive, stable, ignores `*.test.stx` / `*.spec.stx`, rejects invalid or duplicate custom-element tags, and never deletes unrelated output files.

### Progressive rendering and SSR

CSS is emitted separately for Light DOM and wrapped in native `@scope (<tag>)` when the source did not already provide a scope. This lets the browser paint semantic server HTML before the module downloads. When the element definition arrives, STX preserves existing markup, wires events, synchronizes typed props, and adds the `hydrated` attribute. Later changes are batched into one microtask render and restore keyed/id/name focus and text selection.

```ts
import { renderButton } from 'my-design-system/ssr'

const html = renderButton(
  { label: 'Save', disabled: false },
  { icon: '<svg aria-hidden="true">...</svg>' },
)
```

SSR interpolations and reflected attributes are escaped. Slot strings and `{!! raw !!}` are intentionally trusted HTML and should only receive sanitized content.

### Cross-framework usage

Import the component module or bundle once, then use native tags. The generated JSX declaration supplies typed attributes and `onActivate`; `custom-elements.json` supplies the same contract to supporting editors and documentation tools.

```tsx
import 'my-design-system/acme-button.js'

export function SaveButton() {
  return <acme-button label="Save" onActivate={event => console.log(event.detail)} />
}
```

```vue
<script setup>
import 'my-design-system/acme-button.js'
</script>

<template>
  <acme-button label="Save" @activate="save" />
</template>
```

## JSX-Tag Syntax

The tag form reads naturally for the common case and looks like every other modern templating engine.

```html
<script server>
  const variant = 'primary'
  const isDisabled = false
</script>

<Button :variant="variant" :disabled="isDisabled">
  Save
</Button>

<Card image="/photo.jpg" hover>
  <h3>A card</h3>
  <p>With content.</p>
</Card>

<Switch :checked="true" label="Enable notifications" />
```

Static props (`title="Hello"`) pass strings. Dynamic props (`:variant="variant"`) evaluate the expression server-side. Boolean shorthand (`hover` = `hover="true"`) works.

## `@component` Directive

The Blade-style directive form is equally first-class — it pairs naturally with the rest of the `@`-prefixed server directives (`@if`, `@foreach`, `@include`, etc.) and is the easiest way to pass props that don't fit cleanly into HTML attributes (functions, deeply nested objects, etc.).

```html
@component('Button', {
  variant: 'primary',
  onClick: () => save(),
})
  Save
@endcomponent
```

Use whichever feels right per call site. A typical page mixes both: JSX tags for the bulk of UI invocations, `@component` for cases where the props get awkward as attributes.

## How Components Are Resolved

`ComponentRegistry` resolves a tag name in this order:

1. **Builtins** (`StxLink`, `StxImage`, etc.) — registered at framework init via `registerBuiltins()`.
2. **`componentsDir`** — recursive walk of the configured directory (default `components/`). The first matching `.stx` file wins. File names are PascalCase by convention; both `<StxButton>` and `<stx-button>` find `components/StxButton.stx`.
3. **Current directory** — relative to the page being rendered.

Paths without an extension automatically append `.stx`.

## Engine-Level Builtins

Documented separately at [Builtin Components](./builtins.md). Quick reference:

| Tag | What it does |
|-----|-------------|
| `<StxLink to="/about">` | SPA-aware anchor — router intercepts clicks |
| `<StxImage src="/x.jpg">` | Optimized `<img>` with srcset / lazy / blur |
| `<Icon name="lucide:user">` | Iconify icon |
| `<StxLoadingIndicator />` | Top-of-page progress bar |
| `<StxToast />` | Toast notification container — pair with `toast.success(...)` etc. |
| `<StxModal id="...">` | Imperative modal — open via `modal.open(id)` |
| `<StxDrawer id="...">` | Imperative slide-in panel — open via `drawer.open(id)` |

Plus runtime globals: `toast`, `modal`, `drawer`, `stxAlert`, `stxConfirm`, and the `x-tooltip` directive.

## `@stacksjs/components`

The presentational library ships ~40 components covering the bulk of a typical UI. Installation:

```bash
bun add @stacksjs/components
```

Once installed, every component is auto-discovered. No imports needed:

```html
<Card>
  <Avatar src="/me.jpg" alt="Me" />
  <h3>Hello</h3>

  <Button variant="primary" @click="save()">Save</Button>
  <Switch :checked="true" label="Notifications" />

  <Tabs>
    <TabPanel label="Profile">…</TabPanel>
    <TabPanel label="Notifications">…</TabPanel>
  </Tabs>
</Card>
```

`<Tabs>` and `<Accordion>` accept either:
- **Slot API** (recommended): drop `<TabPanel label="…">` / `<AccordionItem title="…">` children, each containing arbitrary content (components, forms, tables, etc.)
- **Prop API** (legacy): pass `tabs={[{label, content, icon}]}` / `items={[{title, content}]}` for simple string-content lists

The slot API is what most consumers want — string-only content can't hold a `<DriversTable>` or `<NotificationsTable>`. See `stacksjs/stx#1703` for the API change.

### Reactive props from the parent

Every component with a logical "controlled" prop (`<Dialog :open=>`, `<TextInput :value=>`, `<Switch :checked=>`, `<Pagination :current-page=>`, etc.) accepts a signal-driven binding from the parent:

```html
<script client>
const modalOpen = state(false)
const email = state('')
</script>

<button @click="modalOpen.set(true)">Open</button>
<Dialog :open="modalOpen()" @close="modalOpen.set(false)">…</Dialog>

<TextInput :value="email()" @input="email.set($event.detail)" />
<button @click="email.set('')">Reset</button>
```

`modalOpen.set(true)` from anywhere on the page genuinely opens the dialog; `email.set('')` clears the input. This is one-way (parent → child) via `useReactiveProp` internally; events flow back via `@input` / `@change` / `@close`. See `stacksjs/stx#1704`.

### Component Index

Each component has its own README with prop docs and examples in `packages/components/src/ui/<name>/README.md`. The library covers:

**Layout & Display:** Avatar, Badge, Card, Skeleton, Spinner, Progress

**Forms & Input:** Button, Checkbox, Radio, RadioGroup, Select, Switch, Textarea, TextInput, EmailInput, NumberInput, PasswordInput, SearchInput

**Overlays:** Dialog, Drawer, Dropdown, Notification, Popover, Tooltip

**Disclosure:** Accordion, Tabs, Stepper

**Composite:** Combobox, Listbox, CommandPalette, Pagination, Calendar, Heatmap

**Navigation:** Breadcrumb, Navigator, Sidebar (`Sidebar`, `SidebarHeader`, `SidebarItem`, `SidebarSection`, `SidebarFooter`)

**Media:** Audio, Video, Image

**Specialized:** Auth (Login, Signup, TwoFactorChallenge), Payment (PaymentMethods, SubscriptionCheckout), Form, Portal, Teleport, Transition, VirtualList, VirtualTable, Table

For per-component prop tables and behavior, see the README in each component's directory in [the component package source](https://github.com/stacksjs/stx/tree/main/packages/components/src/ui).

## Defining Your Own Components

Drop a `.stx` file into your project's `componentsDir` (default `components/`). The file name (PascalCase) becomes the tag name.

```html
<!-- components/MyButton.stx -->
<script server>
  export const variant = $props.variant || 'primary'
  export const buttonClass = `btn btn-${variant}`
</script>

<button class="{{ buttonClass }}">
  <slot />
</button>

<script client>
  const emit = defineEmits(['click'])
  function onClick(event) { emit('click', event) }
</script>
```

Use it anywhere:

```html
<MyButton variant="ghost" @click="doSomething()">
  Click me
</MyButton>
```

### Conventions

- **`<script server>`** — runs on the server. Compute class strings, normalize props, fetch data. All `export const` / `export function` declarations (and unexported `const`/`let`/`var`) become available to the template.
- **`<script client>`** — runs on the client. Declare signals via `state()`, register event handlers, expose imperative methods via `defineExpose()`, emit events via `defineEmits()`.
- **Reactive event handlers** — use `@click` / `@input` / `@change` / `@keydown` / etc. when the handler needs to read or update signals declared in `<script client>`. The signals runtime evaluates these in the component's scope. Plain `onclick="..."` HTML attributes also work for simple inline JS that doesn't need the reactive scope — both are valid; pick whichever fits.
- **Reactive bindings** — use `:show="visible()"` for visibility, `:class="active() ? 'on' : 'off'"` for class toggling, `:value="state()"` to bind state to inputs, `x-model="state"` for two-way binding on form controls.
- **Client state** — lives in `<script client>` blocks via `state()`. The Alpine-style `x-data` attribute also works (it bridges into the same signals runtime), so existing Alpine-shaped code keeps running.

## Two Directive Families, Same Page

stx ships two parallel sets of directives that compose freely. They cover different lifetimes and you'll typically use both on the same page.

### Server Directives (`@`-prefixed, Blade-style)

Evaluated at server render time. Expand into static HTML before the response is sent. Use these for control flow over data your server already has.

| Directive | Purpose |
|-----------|---------|
| `@if` / `@elseif` / `@else` / `@endif` | Conditional rendering |
| `@foreach` / `@endforeach`, `@for` / `@endfor`, `@forelse` / `@empty` / `@endforelse` | Loops with optional empty branch |
| `@switch` / `@case` / `@default` / `@endswitch` | Multi-branch conditional |
| `@auth` / `@guest` / `@env` | Conditional rendering by auth/env state |
| `@translate` | i18n key lookup (pairs with `{t:key}` in static-site builds) |
| `@push` / `@stack` / `@prepend` | Slot content into named stacks (e.g. `@push('head')`) |
| `@include` / `@layout` / `@extends` / `@section` / `@yield` | Template composition |
| `@component` / `@endcomponent` | Invoke a component (alternative to JSX tags) |
| `@csrf` / `@method` / `@error` | Form helpers |
| `@meta` / `@seo` / `@title` | Per-page SEO metadata |
| `@js` / `@ts` | Embedded server JS/TS that contributes to the template scope |
| `@once` | Render-once guard (de-dupe across includes) |
| `@memo` / `@enderrorBoundary` / `@fallback` / `@async` | Optimization & async loading |

### Client Directives (`:` and `@event`, signals runtime)

Wired into the client signals runtime. React to signal changes and DOM events at runtime.

| Directive | Purpose |
|-----------|---------|
| `:if` / `:show` / `:for` / `:key` | Reactive control flow on a single element |
| `:class` / `:style` | Reactive class / style bindings (object or string forms) |
| `:href` / `:src` / `:value` / `:disabled` / `:any-attr` | Reactive attribute bindings |
| `@click` / `@input` / `@change` / `@submit` / `@keydown` / `@<event>` | Event listeners with optional modifiers (`.prevent`, `.stop`, `.outside`, `.window`, `.once`, `.debounce.300`, key qualifiers like `.enter` / `.escape`) |
| `x-model` | Two-way binding for form controls |
| `x-text` / `x-html` | Reactive text / HTML content |
| `x-cloak` | Hide until processed (avoids FOUC for `:show`-gated subtrees) |
| `x-ref` | Template ref accessible via `useRef()` |
| `stx-hydrate="visible \| idle \| interaction \| media:..."` | Defer client wire-up until trigger fires |

### Mixing Them

A typical page uses server directives to render the initial DOM and client directives to wire reactivity onto it:

```html
<script server>
  const items = await db.query('SELECT * FROM tasks WHERE owner = ?', userId)
</script>

<script client>
  const filter = state('all')
  function visible(item) {
    return filter() === 'all' || item.status === filter()
  }
</script>

<div class="filter">
  <button @click="filter.set('all')" :class="filter() === 'all' ? 'active' : ''">All</button>
  <button @click="filter.set('done')" :class="filter() === 'done' ? 'active' : ''">Done</button>
</div>

<ul>
  @foreach(item in items)
    <li :show="visible({{ JSON.stringify(item) }})">
      {{ item.title }}
    </li>
  @endforeach
</ul>
```

The `@foreach` runs once at server render and emits the `<li>` for every task. The `:show` runs on the client and toggles each `<li>` reactively as `filter` changes. Neither directive interferes with the other — they live in different lifetimes.

For purely client-driven loops (data fetched after mount, or where the row count itself is reactive), use `:for` instead:

```html
<ul>
  <li :for="item in items()" :key="item.id">{{ item.title }}</li>
</ul>
```

See [Components Guide](../guide/components.md) for the full lifecycle and props story.
