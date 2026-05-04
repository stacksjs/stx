# Component Library

stx splits its components into two layers, registered the same way and called the same way, but living in different packages:

| Layer | Package | What lives here |
|-------|---------|-----------------|
| **Engine builtins** | `@stacksjs/stx` | Components that need deep template-processor integration or inject runtime globals — `<StxLink>`, `<StxImage>`, `<Icon>`, `<StxLoadingIndicator>`, `<StxToast>`, `<StxModal>`, `<StxDrawer>`. See [Builtin Components](./builtins.md). |
| **Presentational** | `@stacksjs/components` | Plain `.stx` components for the bulk of a UI — Button, Card, Switch, Tabs, Accordion, form inputs, etc. Installed separately. |

Both layers are invoked with the same JSX-tag syntax. There's no special import for builtins; presentational components come from `@stacksjs/components` and are auto-discovered when installed.

## JSX-Tag Syntax (Preferred)

Use the JSX-tag form for every component invocation:

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

## `@component` Directive (Blade-Compat)

The Blade-style directive form still works, mostly for cases where you need to pass props that don't fit cleanly into HTML attributes (e.g. functions, complex objects):

```html
@component('Button', {
  variant: 'primary',
  onClick: () => save(),
})
  Save
@endcomponent
```

For typical use, prefer the JSX form — it reads more naturally and matches how every other modern templating engine works.

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
  <Tabs :tabs="tabs" />
</Card>
```

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
- **Events** — use `@click` / `@input` / `@change` / `@keydown` / etc. Never `onclick=`. Inline DOM event attributes are valid HTML but bypass the signals runtime.
- **Reactive bindings** — use `:show="visible()"` for visibility, `:class="active() ? 'on' : 'off'"` for class toggling, `:value="state()"` to bind state to inputs, `x-model="state"` for two-way binding on form controls.
- **No `x-data`** — client state lives in `<script client>` blocks via `state()`, not in `x-data` attributes.

See [Components Guide](../guide/components.md) for the full lifecycle and props story.
