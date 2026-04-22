# Builtin Components Reference

stx ships with four builtin components that are always available without import. They render directly to HTML at build time with zero client-side component overhead.

## StxLink

Navigation-aware anchor element for SPA routing. Renders as a plain `<a>` tag with `data-stx-link` — the router intercepts clicks on these elements for client-side navigation without page reloads.

```html
<StxLink to="/about">About</StxLink>
<StxLink to="/dashboard" class="nav-link" activeClass="text-indigo-500">Dashboard</StxLink>
```

**Renders as:**

```html
<a href="/about" data-stx-link data-stx-active-class="active" data-stx-exact-active-class="exact-active">About</a>
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `to` | `string` | `'#'` | Yes | Destination URL |
| `class` | `string` | — | No | CSS classes |
| `activeClass` | `string` | `'active'` | No | Class applied when route matches (prefix match). Supports space-separated class lists |
| `exactActiveClass` | `string` | `'exact-active'` | No | Class applied when route exactly matches |
| `prefetch` | `boolean` | `false` | No | Enable route prefetching on hover |

### Active Class Handling

Both `activeClass` and `exactActiveClass` support space-separated class strings. Each class is added/removed individually via `classList`:

```html
<StxLink to="/settings" activeClass="bg-indigo-500/10 text-indigo-400">
  Settings
</StxLink>
```

When the route matches `/settings`, both `bg-indigo-500/10` and `text-indigo-400` are added.

### Reactive href

The `to` prop supports client-reactive bindings:

```html
<StxLink :to="'/users/' + userId">View Profile</StxLink>
```

When using a `:to` binding, the rendered anchor gets `:href` instead of `href`, which the signals runtime evaluates at runtime.

### Event Forwarding

Event handlers on `<StxLink>` are forwarded to the rendered `<a>`:

```html
<StxLink to="/page" @click="trackNavigation()">Page</StxLink>
```

### StxLink vs `<a href>`

| | `<StxLink to>` | `<a href>` |
|---|---|---|
| Navigation | SPA (no reload) | Full page reload |
| Active class | Automatic | Manual |
| Prefetch | Supported | No |
| Router integration | Yes | No |

**Aliases:** `<stx-link>`

### Extra Attributes

Any static attribute not consumed by StxLink is forwarded to the `<a>` element:

```html
<StxLink to="/page" id="main-nav" aria-label="Navigate to page">Page</StxLink>
```

## StxImage

Full-featured image component with responsive images, format negotiation, lazy loading, placeholder support, and CDN provider integration.

```html
<StxImage src="/images/hero.jpg" alt="Hero image" />
<StxImage src="/images/hero.jpg" alt="Hero" width="800" height="600" sizes="sm:100vw md:50vw lg:33vw" />
<StxImage src="/images/hero.jpg" alt="Hero" format="auto" placeholder="blur" preload />
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `src` | `string` | — | Yes | Image source URL |
| `alt` | `string` | `''` | Yes | Alt text (accessibility) |
| `width` | `string \| number` | — | No | Image width in pixels |
| `height` | `string \| number` | — | No | Image height in pixels |
| `sizes` | `string` | — | No | Responsive sizes (Tailwind-style breakpoints or raw media queries) |
| `srcset` | `string` | — | No | Custom srcset (overrides auto-generation) |
| `densities` | `string` | — | No | Density descriptors, e.g. `"1x 2x 3x"` |
| `format` | `string` | — | No | Image format: `'webp'`, `'avif'`, `'auto'` |
| `placeholder` | `string` | — | No | Placeholder mode: `'blur'`, `'color'`, `'empty'`, or a custom URL |
| `placeholderColor` | `string` | `'#e5e7eb'` | No | Background color for blur/color placeholders |
| `provider` | `string` | — | No | CDN provider: `'cloudinary'`, `'imgix'`, `'bunny'` |
| `lazy` | `boolean` | `true` | No | Enable `loading="lazy"` |
| `preload` | `boolean` | `false` | No | Inject `<link rel="preload">` in head |
| `picture` | `boolean` | `false` | No | Force `<picture>` wrapper (auto-enabled when `format` is set) |
| `quality` | `string \| number` | — | No | Image quality hint |
| `class` | `string` | — | No | CSS classes |
| `style` | `string` | — | No | Inline styles |

### Responsive Sizes

The `sizes` prop accepts Tailwind-style breakpoint prefixes:

```html
<StxImage src="/hero.jpg" alt="Hero" sizes="sm:100vw md:50vw lg:33vw" />
```

This generates:

```html
<img sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw" srcset="..." />
```

**Default breakpoints:**

| Prefix | Width |
|--------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

Numeric breakpoints also work: `sizes="800:50vw 1200:33vw"`.

Raw media queries pass through unchanged: `sizes="(max-width: 768px) 100vw, 50vw"`.

When `sizes` is provided, a responsive `srcset` is auto-generated with widths: 320, 640, 768, 1024, 1280, 1536, 1920.

### Density Descriptors

```html
<StxImage src="/logo.png" alt="Logo" width="200" densities="1x 2x 3x" />
```

Generates: `srcset="/logo.png 1x, /logo.png 2x, /logo.png 3x"`. When a `width` is provided, each density multiplies the width for CDN providers.

### Format Negotiation

Setting `format` wraps the image in a `<picture>` element with `<source>` elements for modern formats:

```html
<StxImage src="/photo.jpg" alt="Photo" format="auto" />
```

Renders:

```html
<picture>
  <source type="image/avif" srcset="..." />
  <source type="image/webp" srcset="..." />
  <img src="/photo.jpg" alt="Photo" loading="lazy" decoding="async" />
</picture>
```

| Format value | Sources generated |
|-------------|-------------------|
| `'webp'` | WebP only |
| `'avif'` | AVIF only |
| `'auto'` | AVIF + WebP (with original as fallback) |

### Placeholders

```html
<!-- Blur placeholder (SVG-based) -->
<StxImage src="/photo.jpg" alt="Photo" placeholder="blur" width="800" height="600" />

<!-- Custom color -->
<StxImage src="/photo.jpg" alt="Photo" placeholder="color" placeholderColor="#1e293b" />

<!-- No placeholder -->
<StxImage src="/photo.jpg" alt="Photo" placeholder="empty" />

<!-- Custom placeholder image URL -->
<StxImage src="/photo.jpg" alt="Photo" placeholder="/thumbs/photo-tiny.jpg" />
```

The blur placeholder generates a tiny SVG rectangle with the specified color, set as a `background-image`. It shows through while the real image loads.

### CLS Prevention

When both `width` and `height` are provided, an `aspect-ratio` style is added to prevent Cumulative Layout Shift:

```html
<StxImage src="/photo.jpg" alt="Photo" width="800" height="600" />
<!-- Adds: style="aspect-ratio:800/600" -->
```

### CDN Providers

```html
<!-- Cloudinary -->
<StxImage src="https://res.cloudinary.com/demo/image/upload/sample.jpg"
          alt="Sample" provider="cloudinary" width="800" format="webp" />
<!-- Transforms: /upload/w_800,f_webp,q_auto/sample.jpg -->

<!-- imgix -->
<StxImage src="https://example.imgix.net/image.jpg"
          alt="Image" provider="imgix" width="800" format="webp" />
<!-- Transforms: ?w=800&fm=webp&auto=format -->

<!-- Bunny CDN -->
<StxImage src="https://cdn.example.com/image.jpg"
          alt="Image" provider="bunny" width="800" format="webp" />
<!-- Transforms: ?width=800&format=webp -->
```

### Preloading

```html
<StxImage src="/hero.jpg" alt="Hero" preload format="webp" />
```

Injects a `<link>` tag before the image:

```html
<link rel="preload" as="image" href="/hero.jpg" type="image/webp" />
```

When `srcset` and `sizes` are present, `imagesrcset` and `imagesizes` attributes are included.

### Default Behavior

Every `<StxImage>` automatically gets:

- `loading="lazy"` (disable with `lazy={false}`)
- `decoding="async"`

**Aliases:** `<stx-image>`, `<stx-img>`

## Icon

Renders inline SVG from the Iconify icon library at build time. Zero client-side JavaScript.

```html
<Icon name="house" />
<Icon name="lucide:chevron-right" size="16" color="red" />
<Icon name="heroicons:home" size="32" class="text-gray-500" />
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `name` | `string` | — | Yes | Icon name. Format: `name` (uses default collection) or `collection:name` |
| `icon` | `string` | — | No | Alias for `name` (Iconify web-component convention) |
| `size` | `string \| number` | `24` | No | Icon dimensions in pixels (width and height) |
| `color` | `string` | `'currentColor'` | No | Icon color. Replaces `currentColor` in SVG paths |
| `class` | `string` | — | No | CSS classes |
| `style` | `string` | — | No | Inline styles |

### Default Collection

The default icon collection is **Lucide**. When no collection prefix is specified, the icon is looked up in the Lucide set:

```html
<Icon name="house" />        <!-- lucide:house -->
<Icon name="search" />       <!-- lucide:search -->
<Icon name="settings" />     <!-- lucide:settings -->
```

### Using Other Collections

Prefix the icon name with the collection ID:

```html
<Icon name="heroicons:home" />
<Icon name="ph:jeep-fill" />
<Icon name="mdi:account" />
<Icon name="tabler:brand-github" />
```

### How It Works

1. Icon collections are loaded from `@iconify/json` at build time
2. The SVG `body` is extracted from the collection JSON
3. An inline `<svg>` element is rendered directly in the HTML
4. No JavaScript is shipped to the client

**Renders as:**

```html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- SVG path data from the icon -->
</svg>
```

### Collection Pre-loading

Collections are cached after first load. If a collection is not yet cached when the component renders, a comment placeholder is inserted and the collection is loaded asynchronously for subsequent renders. To ensure icons render on first pass, pre-load collections in your build setup:

```typescript
import { preloadIconCollection } from '@stacksjs/stx'

await preloadIconCollection('lucide')
await preloadIconCollection('heroicons')
```

> **Warning:** If `@iconify/json` is not installed, icons render as HTML comments: `<!-- Icon: collection "lucide" not loaded -->`. Install with `bun add @iconify/json`.

**Aliases:** `<icon>`, `<stx-icon>`

## StxLoadingIndicator

Fixed-position progress bar at the top of the viewport that activates during navigation. Includes a shimmer animation and automatic link-click interception.

```html
<StxLoadingIndicator />
<StxLoadingIndicator color="#10b981" height="4px" />
<StxLoadingIndicator color="#6366f1" initialColor="#818cf8" />
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `color` | `string` | `'#6366f1'` | No | Bar color (CSS color value) |
| `initialColor` | `string` | — | No | Start color for gradient (creates a left-to-right gradient with `color`) |
| `height` | `string` | `'3px'` | No | Bar height (CSS length) |
| `duration` | `number` | `2000` | No | Animation duration in ms (reserved for future use) |
| `throttle` | `number` | `200` | No | Progress update interval in ms |
| `zIndex` | `number` | `999999` | No | CSS z-index |

Prop `initial-color` is also accepted (kebab-case alias for `initialColor`). Prop `z-index` is also accepted.

### How It Works

The component renders:

1. A fixed-position `<div>` at the top of the viewport with `scaleX(0)` transform
2. A shimmer overlay with a CSS animation
3. An inline `<script>` that sets up `window.stxLoading`

### Automatic Interception

The loading indicator automatically starts when:

- A same-origin `<a>` link is clicked (excludes external URLs, hash links, `mailto:`, `tel:`, and `target="_blank"`)
- A `popstate` event fires (browser back/forward)

It automatically finishes on the `load` event.

### JavaScript API

The component exposes `window.stxLoading` for programmatic control:

```typescript
// Start the progress bar
window.stxLoading.start()

// Complete the progress bar (animates to 100%, then fades out)
window.stxLoading.finish()

// Set progress to a specific percentage (0-100)
window.stxLoading.set(50)

// Clear immediately (no animation)
window.stxLoading.clear()
```

**stxLoading API:**

| Method | Description |
|--------|-------------|
| `start()` | Begin progress animation. Increments from 10% toward 90% |
| `finish()` | Jump to 100%, then fade out after 200ms |
| `set(value)` | Set progress to `value` (0-100) |
| `clear()` | Reset to 0% immediately with no animation |

### Integration with SPA Router

When using the stx SPA router, call `stxLoading.start()` before navigation and `stxLoading.finish()` after the new page loads. The router's `stx:navigate` event or the `@async` component loading states pair well with this indicator.

**Aliases:** `<stx-loading-indicator>`
