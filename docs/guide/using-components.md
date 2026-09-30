# Using @stacksjs/components

React has MUI. Vue has Vuetify. stx has `@stacksjs/components` — **102 components that ship with every stx app**, written in stx, server-rendered, wired to the signals runtime.

This page is written for whoever is building the UI, agent or human. The short version: **look here before you write a component.** A Toast, a Modal, a Tabs strip, a Pagination bar, a Combobox with keyboard nav — they exist, they are accessible, and they are used in production across several Stacks apps. Reinventing one produces more code that does less.

## Setup

Register the plugin once. Every tag then resolves by name in any `.stx` file — no imports, ever.

```ts
// stx.config.ts
export default {
  plugins: ['@stacksjs/components/stx-plugin'],
}
```

```html
<!-- Any .stx file. No import line. -->
<Button variant="primary" size="lg" @click="save()">Save</Button>
```

To check the inventory against what is actually installed:

```bash
ls node_modules/@stacksjs/components/src/ui/
```

## Props, events, and slots

Three separate channels. Mixing them up is the most common mistake.

| You want to | Write | Notes |
|---|---|---|
| Pass a static value | `size="lg"` | Plain string |
| Pass a server-evaluated value | `:rows="user.orders"` or `rows={user.orders}` | Identical — the JSX spelling is rewritten to the colon form. Evaluated **on the server**, so it cannot reference a client function |
| Pass a client signal (reactive) | `:open="isOpen()"` on the tag; child reads it with `useReactiveProp('open', false)` | One-way, parent → child, via a MutationObserver on the root |
| Handle an event the component emits | `@close="dismiss()"` | The component calls `emit('close')`; this is **not** a prop |
| Fill a slot | `<div slot="header">…</div>` as a direct child | No `<template>` wrapper needed |

```html
<Dialog :open="showDialog()" @close="showDialog.set(false)">
  <DialogTitle slot="title">Delete this project?</DialogTitle>
  <p>This cannot be undone.</p>
</Dialog>
```

A component that needs to talk back does it with an event, not a mutated prop. Every `Emits` entry in the reference below is a `@event` you can listen for.

## Six things that actually break

Each of these was verified against the current engine, not inherited from older docs.

### 1. In a template, both `open` and `open()` work

```html
<div :show="open">…</div>    <!-- fine -->
<div :show="open()">…</div>  <!-- also fine -->
```

Two layers make this true. The auto-unwrap proxy reads the expression text and, if it sees the name being called, hands over the signal function instead of the unwrapped value (`expressionCallsSignal`); and if an expression throws anyway, `evalAttrExpr` retries it against the raw scope. Disabling either one alone changes nothing. Both spellings re-evaluate reactively, negation and ternaries included.

Prefer the bare name in new markup — it matches the rest of the docs. But **do not go "fix" called forms in existing code**: ~13 call sites across this library use `:show="isOpen()"`, including `Dialog`, `Drawer`, `Notification`, `Avatar` and `CommandPalette`, and they work. Older guidance claiming this silently hides the element is wrong.

Inside a `<script client>` block, the rule is different and absolute: **call the getter.** `if (open())`, never `if (open)` — the bare name there is the function, which is always truthy.

### 2. `{{ }}` inside `<script client>` is a server→client bridge, and the value must never be undefined

```html
<script server>
export const stepNumber = $props.stepNumber ?? 0   // ← the ?? is load-bearing
</script>

<script client>
const stepNumber = {{ stepNumber }}   // a SERVER value, spliced into JS
</script>
```

If the server value is `undefined`, the mustache survives into the browser as literal text, and `const stepNumber = {{ stepNumber }}` is a **SyntaxError that kills the entire scoped script** — every handler in it, silently. Nothing on the client re-reads a mustache inside JavaScript, so this can never resolve later.

So: any prop you interpolate into a client script needs a default. `??` rather than `||` when `0` or `''` is a legitimate value. And an enum lookup needs a fallback — `sizeConfig[size] || sizeConfig.md` — because `size="huge"` is a typo that would otherwise take the component out entirely.

Never write `{{ }}` around *client* state in a client script. It is already client code: use the signal directly.

### 3. A `<style>` inside a component is extracted before interpolation

```html
<style>{!! dynamicCss !!}</style>   <!-- ships EMPTY -->
```

The renderer pulls a component's `<style>` element out of the source with a regex, before expressions run, so an interpolated stylesheet arrives as `<style></style>`. Put dynamic styling in a class binding (`x-class`), or hand the CSS to the consumer to include.

### 4. A `<script server>` that throws renders the component as *nothing*

No error, no fallback, no message even with `debug: true` — just an empty element where your UI was. So a server block that touches anything fallible (an import, a fetch, a parse) should defend itself, and a failure should degrade to something useful rather than taking the content with it. `CodeBlock` now falls back to escaped plain text when its highlighter cannot load; the code is the content, the colours are decoration.

### 5. Never a plain `<a href>` for an internal link, never a plain `<img>` for a local image

| Instead of | Use | Because |
|---|---|---|
| `<a href="/settings">` | `<StxLink to="/settings">` | The router only intercepts `[data-stx-link]`. A plain anchor is a full page reload: stores, scroll position and client state all gone |
| `<img src="/hero.png">` | `<StxImage src="/hero.png" width="800" height="600">` | Responsive `srcset`, lazy loading, blur placeholder, `aspect-ratio` so there is no layout shift |
| An `<img>` whose URL may 404 | `<SafeImage src="…" fallback="…">` | Inline `onerror` that catches cached 404s a delegated listener misses |

External links (`http`, `mailto:`, `tel:`) stay plain anchors — the router does not handle those.

Those three are stx **builtins**, not part of this library: they resolve in any `.stx` file whether or not the components plugin is registered (`packages/stx/src/builtins/`). Everything in the reference below needs the plugin.

### 6. State that two things read is a store, not a `state()`

Component-local `state()` dies on SPA navigation. A `defineStore` survives it, because stores live on `window.stx._stores` and are not cleaned up with the container. If a page and a sidebar both read the cart, it is a store — with `{ persist: true }` if it should survive a reload.

## Where the logic goes

Components are presentation. The rest belongs outside them:

| Concern | Lives in |
|---|---|
| Network calls | `functions/` composable, or a store |
| Shared/persistent state | `stores/` (`defineStore`) |
| Domain logic, validation, formatting | `functions/` composable |
| Browser APIs (storage, observers, geolocation) | `functions/` composable |
| A single dropdown's open flag | inline in the component's `<script client>` |

```html
<script client>
  const cart = useStore('cart')
  const { product, loading, error } = useProduct(route.params.id)
</script>

<Spinner :if="loading()" />
<Notification :if="error()" type="error" :message="error().message" />
<Card :if="product()">
  <h1 x-text="product().name"></h1>
  <Button @click="cart.add(product())">Add to cart</Button>
</Card>
```

If a component has grown past ~15 lines of anything that is not markup, something in it belongs in a composable.

## Verifying your usage

Two commands catch most mistakes before a browser does:

```bash
bun test packages/components/test/renders-under-current-stx.test.ts
```

That renders all 102 components with no props and parses every script they emit — the check that catches a mustache leaking into JavaScript. For your own page, the same shape of assertion works: render it, then `new Function()` each emitted script. A component whose script does not parse is dead in the browser, and it fails silently, so nothing else will tell you.

When you hit something that looks like a framework bug — a binding that never fires, a directive that does not propagate — it probably is one. Fix it in stx (`~/Documents/Projects/stx`) rather than working around it with `querySelector` in a component.

## Full reference

Generated from component source. `Props` lists each prop with its default; `Emits` lists events to listen for with `@event`; `Slots` names the slots each component fills.

<!-- generated from source: 102 components — 46 emit events, 53 take slots, 60 ship client behaviour -->

### Forms

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<Calendar>` | `value` (`null`), `minDate` (`null`), `maxDate` (`null`), `disabledDates` (`[]`), `locale` (`'en-US'`), `firstDayOfWeek` (`0`), `showToday` (`true`), `className` (`''`), +1 more | `@change` | — |
| `<Checkbox>` | `checked` (`false`), `disabled` (`false`), `indeterminate` (`false`), `size` (`'md'`), `label` (`''`), `description` (`''`), `error` (`false`), `required` (`false`), +3 more | `@change` | — |
| `<Combobox>` | `value`, `className` (`''`), `as` (`'div'`) | `@change`, `@query` | default |
| `<ComboboxButton>` | `className` (`''`), `as` (`'button'`) | — | — |
| `<ComboboxInput>` | `displayValue`, `className` (`''`), `placeholder` (`''`), `disabled` (`false`) | — | — |
| `<ComboboxOption>` | `value`, `disabled` (`false`), `className` (`''`), `as` (`'li'`) | — | default |
| `<ComboboxOptions>` | `className` (`''`), `as` (`'ul'`) | — | default |
| `<EmailInput>` | `value` (`''`), `placeholder` (`'Enter your email'`), `disabled` (`false`), `readonly` (`false`), `size` (`'md'`), `error` (`false`), `label` (`''`), `helperText` (`''`), +2 more | — | — |
| `<Form>` | `action` (`''`), `method` (`'POST'`), `validationSchema` (`{}`), `className` (`''`), `initialValues` (`{}`), `validateOnChange` (`false`), `validateOnBlur` (`false`) | `@error`, `@submit` | default |
| `<Listbox>` | `value`, `multiple` (`false`), `className` (`''`), `as` (`'div'`) | `@change` | default |
| `<ListboxButton>` | `className` (`''`), `as` (`'button'`), `disabled` (`false`) | — | default |
| `<ListboxLabel>` | `className` (`''`), `as` (`'label'`) | — | default |
| `<ListboxOption>` | `value`, `disabled` (`false`), `className` (`''`), `as` (`'li'`) | — | default |
| `<ListboxOptions>` | `className` (`''`), `as` (`'ul'`) | — | default |
| `<NumberInput>` | `value` (`''`), `placeholder` (`'0'`), `disabled` (`false`), `readonly` (`false`), `size` (`'md'`), `error` (`false`), `label` (`''`), `helperText` (`''`), +7 more | `@input` | — |
| `<PasswordInput>` | `value` (`''`), `placeholder` (`'Enter your password'`), `disabled` (`false`), `readonly` (`false`), `size` (`'md'`), `error` (`false`), `label` (`''`), `helperText` (`''`), +4 more | `@input` | — |
| `<Radio>` | `checked` (`false`), `disabled` (`false`), `size` (`'md'`), `label` (`''`), `description` (`''`), `error` (`false`), `required` (`false`), `value` (`''`), +2 more | `@change` | — |
| `<RadioGroup>` | `value`, `className` (`''`), `as` (`'div'`), `options` | `@change` | default |
| `<RadioGroupDescription>` | `className` (`''`), `as` (`'span'`) | — | default |
| `<RadioGroupLabel>` | `className` (`''`), `as` (`'label'`) | — | default |
| `<RadioGroupOption>` | `value`, `disabled` (`false`), `className` (`''`), `as` (`'div'`) | — | default |
| `<SearchInput>` | `value` (`''`), `placeholder` (`'Search...'`), `disabled` (`false`), `size` (`'md'`), `error` (`false`), `label` (`''`), `helperText` (`''`), `loading` (`false`), +1 more | `@search` | — |
| `<Select>` | `value` (`''`), `options` (`[]`), `placeholder` (`'Select an option'`), `disabled` (`false`), `size` (`'md'`), `error` (`false`), `label` (`''`), `helperText` (`''`), +2 more | `@change` | — |
| `<Switch>` | `checked` (`false`), `disabled` (`false`), `size` (`'md'`), `className` (`''`), `label` (`''`) | `@change` | — |
| `<TextInput>` | `value` (`''`), `placeholder` (`''`), `disabled` (`false`), `readonly` (`false`), `size` (`'md'`), `error` (`false`), `label` (`''`), `helperText` (`''`), +8 more | `@input`, `@clear` | — |
| `<Textarea>` | `value` (`''`), `placeholder` (`''`), `disabled` (`false`), `readonly` (`false`), `rows` (`4`), `autoResize` (`false`), `maxRows` (`10`), `error` (`false`), +7 more | `@input` | — |

### Buttons & actions

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<Badge>` | `variant` (`'default'`), `size` (`'md'`), `dot` (`false`), `removable` (`false`), `className` (`''`) | `@remove` | default |
| `<Button>` | `variant` (`'primary'`), `size` (`'md'`), `disabled` (`false`), `loading` (`false`), `type` (`'button'`), `fullWidth` (`false`), `leftIcon` (`''`), `rightIcon` (`''`), +1 more | `@click` | default |
| `<Progress>` | `value` (`0`), `max` (`100`), `variant` (`'linear'`), `size` (`'md'`), `color` (`'primary'`), `showLabel` (`false`), `indeterminate` (`false`), `className` (`''`) | — | — |
| `<Skeleton>` | `variant` (`'text'`), `count` (`1`), `width` (`''`), `height` (`''`), `circle` (`false`), `className` (`''`), `animate` (`true`) | — | — |
| `<Spinner>` | `variant` (`'circle'`), `size` (`'md'`), `color` (`'primary'`), `label` (`''`), `className` (`''`) | — | — |

### Overlays

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<CommandPalette>` | `open` (`false`), `query` (`''`), `className` (`''`) | `@close`, `@query`, `@select` | default |
| `<CommandPaletteItem>` | `className` (`''`), `value` | `@click` | default |
| `<Dialog>` | `open` (`false`), `className` (`''`) | `@close` | default |
| `<DialogBackdrop>` | `className` (`''`), `as` (`'div'`) | — | — |
| `<DialogDescription>` | `className` (`''`), `as` (`'p'`) | — | default |
| `<DialogPanel>` | `className` (`''`), `as` (`'div'`) | — | default |
| `<DialogTitle>` | `className` (`''`), `as` (`'h3'`) | — | default |
| `<Drawer>` | `open` (`false`), `position` (`'right'`), `title` (`''`), `className` (`''`), `panelClass` (`''`), `panelStyle` (`''`), `backdropClass` (`'bg-gray-500/75 dark:bg-gray-900/75'`), `size` | `@close` | default |
| `<Dropdown>` | `className` (`''`), `as` (`'div'`) | `@change`, `@select` | default |
| `<DropdownButton>` | `className` (`''`), `as` (`'button'`), `disabled` (`false`) | `@click` | default |
| `<DropdownItem>` | `className` (`''`), `as` (`'div'`), `disabled` (`false`), `value` | `@click` | default |
| `<DropdownItems>` | `className` (`''`), `as` (`'div'`) | — | default |
| `<Notification>` | `show` (`true`), `title` (`''`), `message` (`''`), `type` (`'info'`), `position` (`'top-right'`), `duration`, `className` (`''`) | `@close` | default |
| `<Popover>` | `className` (`''`), `as` (`'div'`) | `@change` | default |
| `<PopoverButton>` | `className` (`''`), `as` (`'button'`), `disabled` (`false`) | `@click` | default |
| `<PopoverPanel>` | `className` (`''`), `as` (`'div'`), `position` (`'bottom'`) | — | default |
| `<Portal>` | `target` (`'body'`), `disabled` (`false`) | — | default |
| `<Teleport>` | `to` (`'body'`), `disabled` (`false`), `defer` (`false`) | — | default |
| `<Tooltip>` | `content` (`''`), `position` (`'top'`), `delay` (`0`), `className` (`''`), `show` (`false`), `disabled` (`false`) | — | default |

### Data display

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<Accordion>` | `items` (`[]`), `allowMultiple` (`false`), `defaultOpen` (`[]`), `className` (`''`) | `@change` | default |
| `<AccordionItem>` | `title` (`''`), `className` (`''`) | — | default |
| `<Avatar>` | `src` (`''`), `alt` (`''`), `initials` (`''`), `size` (`'md'`), `shape` (`'circle'`), `status` (`''`), `className` (`''`) | `@error` | — |
| `<Card>` | `variant` (`'default'`), `padding` (`'default'`), `hover` (`false`), `clickable` (`false`), `image` (`''`), `imageAlt` (`''`), `className` (`''`) | `@click` | default |
| `<Heatmap>` | `id` (`$uid`), `mode` (`'overlay'`), `width` (`null`), `height` (`null`), `radius` (`20`), `blur` (`15`), `opacity` (`0.6`), `showLegend` (`true`), +4 more | — | — |
| `<Pagination>` | `currentPage` (`1`), `totalPages` (`1`), `siblingCount` (`1`), `showFirstLast` (`true`), `showPrevNext` (`true`), `className` (`''`) | `@change` | — |
| `<TabPanel>` | `label` (`''`), `icon` (`''`), `className` (`''`) | — | default |
| `<Table>` | `className` (`''`), `striped` (`false`), `hoverable` (`true`) | — | default |
| `<TableBody>` | `className` (`''`) | — | default |
| `<TableCell>` | `className` (`''`) | — | default |
| `<TableHead>` | `className` (`''`) | — | default |
| `<TableHeader>` | `className` (`''`), `sortable` (`false`) | `@click` | default |
| `<TableRow>` | `className` (`''`), `hoverable` (`true`) | — | default |
| `<Tabs>` | `tabs` (`[]`), `defaultTab` (`0`), `orientation` (`'horizontal'`), `variant` (`'line'`), `className` (`''`) | `@change` | default |
| `<VirtualList>` | `items` (`[]`), `itemHeight` (`50`), `height` (`400`), `overscan` (`3`), `className` (`''`) | — | default |
| `<VirtualTable>` | `columns` (`[]`), `data` (`[]`), `rowHeight` (`48`), `height` (`600`), `headerHeight` (`56`), `overscan` (`5`), `striped` (`false`), `hoverable` (`true`), +1 more | — | — |

### Navigation

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<Breadcrumb>` | `items` (`[]`), `separator` (`'/'`), `maxItems` (`0`), `className` (`''`) | — | — |
| `<Navigator>` | `items` (`[]`), `active` (`''`), `orientation` (`'horizontal'`), `variant` (`'default'`), `size` (`'md'`), `className` (`''`) | `@navigate` | — |
| `<Sidebar>` | `sections` (`[]`), `spaces` (`[]`), `space` (_derived_), `activeSpace`, `showSpaceSwitcher` (`true`), `showSpaceAdd` (`false`), `spaceAddLabel` (`'New space'`), `spacePersistKey` (`''`), +17 more | `@itemToggle`, `@sectionToggle`, `@itemClick`, `@collapse` | default, `header`, `footer` |
| `<SidebarFooter>` | `theme` (_derived_), `variant`, `avatar` (`''`), `name` (`''`), `detail` (`''`), `actions` (`[] // [{ id, icon, label }]`) | `@profileClick`, `@action` | default |
| `<SidebarHeader>` | `theme` (_derived_), `variant`, `actions` (`[] // [{ id, icon, label }]`), `title` (`''`), `subtitle` (`''`), `logo` (`''`), `showSearch` (`false`), `searchPlaceholder` (`'Search'`), +3 more | `@action`, `@search`, `@windowControl` | `actions` |
| `<SidebarItem>` | `id` (`''`), `label` (`''`), `icon` (`''`), `iconColor` (`''`), `image` (`''`), `href` (`''`), `count` (_derived_), `badge`, +8 more | — | — |
| `<SidebarPinned>` | `items`, `columns` (`4`) | `@pinnedClick` | — |
| `<SidebarSection>` | `id` (`''`), `label` (`''`), `items` (`[]`), `collapsible` (`true`), `collapsed` (`false`), `theme` (_derived_), `variant` | — | — |
| `<SidebarSections>` | `sections` (`[]`), `theme` (`'macos'`) | — | — |
| `<SidebarSpace>` | `id` (`''`), `label` (`''`), `icon` (`''`), `pinned` (`[]`), `sections` (`[]`), `action` (`null`), `clear` (`null`), `theme` (`'arc'`), +3 more | `@spaceAction` | — |
| `<SidebarSpaceSwitcher>` | `spaces`, `active` (_derived_), `showAdd` (`false`), `addLabel` (`'New space'`) | — | — |
| `<SidebarSpaces>` | `spaces`, `theme` (`'arc'`), `space` (_derived_), `active`, `showSwitcher` (`true`), `showAdd` (`false`), `addLabel` (`'New space'`), `persistKey` (`''`) | `@spaceChange`, `@spaceAdd` | — |
| `<Stepper>` | `currentStep` (`0`), `orientation` (`'horizontal'`), `className` (`''`), `as` (`'div'`) | — | default |
| `<StepperStep>` | `stepNumber` (`0`), `currentStep` (`0`), `label` (`''`), `description` (`''`), `className` (`''`), `as` (`'div'`) | `@click` | default |

### Mobile

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<FilterChip>` | `label` (`''`), `href` (`'#'`), `active` (`false`), `menu` (`false`), `count` (`''`) | — | — |
| `<FilterChips>` | `chips` (`[]`), `className` (`''`) | — | — |
| `<ListRow>` | `title` (`''`), `eyebrow` (`''`), `detail` (`''`), `meta` (`''`), `trailing` (`''`), `icon` (`''`), `unread` (`false`), `href` (`''`), +1 more | — | — |
| `<NavBar>` | `title` (`''`), `compactTitle` (`''`), `backHref` (`''`), `actions` (`''`), `className` (`''`) | — | — |
| `<SectionCard>` | `title` (`''`), `action` (`''`), `actionHref` (`''`), `className` (`''`) | — | default |
| `<TabBar>` | `items` (`[]`), `className` (`''`) | — | — |
| `<TabBarItem>` | `label` (`''`), `href` (`'#'`), `icon` (`''`), `active` (`false`), `badge` (`''`) | — | — |

### Media

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<Audio>` | `src` (`''`), `autoplay` (`false`), `loop` (`false`), `muted` (`false`), `controls` (`true`), `preload` (`'metadata'`), `className` (`''`), `showWaveform` (`false`), +1 more | — | — |
| `<Image>` | `src` (`''`), `srcSet` (`''`), `sizes` (`''`), `webpSrc` (`''`), `webpSrcSet` (`''`), `alt` (`''`), `width`, `height`, +11 more | — | — |
| `<Video>` | `src` (`''`), `poster` (`''`), `autoplay` (`false`), `loop` (`false`), `muted` (`false`), `controls` (`true`), `preload` (`'metadata'`), `width`, +4 more | — | — |

### Auth & payments

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<Checkout>` | `products` (`[]`), `mode` (`'subscription'`), `stripePublicKey` (`''`), `apiUrl` (`''`), `shipping` (`0`), `taxes` (`0`), `className` (`''`) | — | — |
| `<DefaultPaymentMethod>` | `paymentMethod`, `isLoading` (`false`), `className` (`''`) | — | — |
| `<Login>` | `showLogo` (`true`), `headingText` (`'Sign in to your account'`), `showSocialLogin` (`true`), `showRememberMe` (`true`), `showForgotPassword` (`true`), `showSignup` (`true`), `signupText` (`'Start a 14 day free trial'`), `className` (`''`), +2 more | `@social`, `@submit` | — |
| `<PaymentMethods>` | `paymentMethods` (`[]`), `isLoading` (`false`), `showMakeDefault` (`true`), `showDelete` (`true`), `className` (`''`) | `@makeDefault`, `@deletePaymentMethod` | — |
| `<Signup>` | `headingText` (`'Sign up for Stacks'`), `showSocialSignup` (`true`), `className` (`''`) | `@social`, `@error`, `@submit` | — |
| `<SubscriptionCheckout>` | `products` (`[]`), `stripePublicKey` (`''`), `apiUrl` (`''`), `showRemoveProduct` (`true`), `shipping` (`0`), `taxes` (`0`), `className` (`''`) | `@removeProduct`, `@error`, `@submit` | — |
| `<TwoFactorChallenge>` | `headingText` (`'Two Factor Authentication'`), `labelText` (`'Authentication code'`), `instructionText` (`'Open your Symantec 2FA app to view your authentication code.'`), `codeLength` (`6`), `showRecoveryCode` (`true`), `className` (`''`) | `@submit`, `@error`, `@useRecoveryCode` | — |

### Marketing & docs

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<CodeBlock>` | `code` (`''`), `language` (`'typescript'`), `theme` (`'auto'`), `lineNumbers` (`true`), `copyable` (`true`), `className` (`''`) | — | — |
| `<Footer>` | `author` (`'@chrisbbreuer'`), `authorUrl` (`'https://github.com/chrisbbreuer'`), `project` (`'@stacksjs'`), `projectUrl` (`'https://github.com/stacksjs/stacks'`), `twitterUrl` (`'https://twitter.com/chrisbbreuer'`), `sponsorUrl` (`'https://github.com/sponsors/chrisbbreuer'`), `coffeeUrl` (`'https://www.buymeacoffee.com/xlbd'`) | — | — |
| `<Hero>` | `title` (`'Component'`), `description` (`'A modern component built with STX'`), `githubUrl` (`'#'`) | — | `demo` |
| `<Installation>` | `packageName` (`'@stacksjs/component'`) | — | — |

### Utility

| Tag | Props (default) | Emits | Slots |
|---|---|---|---|
| `<Transition>` | `show` (`true`), `enter` (`'transition-opacity duration-300'`), `enterFrom` (`'opacity-0'`), `enterTo` (`'opacity-100'`), `leave` (`'transition-opacity duration-200'`), `leaveFrom` (`'opacity-100'`), `leaveTo` (`'opacity-0'`), `appear` (`false`), +4 more | `@beforeEnter`, `@enter`, `@afterEnter`, `@beforeLeave`, `@leave`, `@afterLeave` | default |
