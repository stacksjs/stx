# UnJS Logos

> UnJS Logos icons for stx from Iconify

## Overview

This package provides access to 63 icons from the UnJS Logos collection through the stx iconify integration.

**Collection ID:** `unjs`
**Total Icons:** 63
**Author:** UnJS ([Website](https://github.com/unjs))
**License:** Apache 2.0
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-unjs
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AutomdIcon height="1em" />
<AutomdIcon width="1em" height="1em" />
<AutomdIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AutomdIcon size="24" />
<AutomdIcon size="1em" />

<!-- Using width and height -->
<AutomdIcon width="24" height="32" />

<!-- With color -->
<AutomdIcon size="24" color="red" />
<AutomdIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AutomdIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AutomdIcon
  size="32"
  color="#4a90e2"
  class="my-icon"
  style="opacity: 0.8;"
/>
```

### In stx Templates

```html
<!DOCTYPE html>
<html>
<head>
  <title>Icon Demo</title>
  <style>
    .icon-grid {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="icon-grid">
    <AutomdIcon size="24" />
    <BundleRunnerIcon size="24" color="#4a90e2" />
    <C12Icon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { automd, bundleRunner, c12 } from '@stacksjs/iconify-unjs'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(automd, { size: 24 })
```

## Icon Properties

All icon component functions and `renderIcon` accept the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `string \| number` | - | Icon size (sets both width and height) |
| `width` | `string \| number` | - | Icon width (overrides size) |
| `height` | `string \| number` | - | Icon height (overrides size) |
| `color` | `string` | `'currentColor'` | Icon color (CSS color or hex) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation in degrees |
| `class` | `string` | - | Additional CSS classes |
| `style` | `string` | - | Inline styles |

## Color

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```html
<!-- Via color property -->
<AutomdIcon size="24" color="red" />
<AutomdIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AutomdIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AutomdIcon size="24" class="text-primary" />
```



## Size

Unlike other components, SVG + CSS components do not set icon size by default. This has advantages and disadvantages.

**Disadvantages:**
- You need to set size yourself.

**Advantages:**
- You have full control over icon size.

You can change icon size by:
- Setting `width` and `height` properties
- Using CSS

### Properties

All icon components support `width` and `height` properties.

Value is a string or number.

You do not need to set both properties. If you set one property, the other property will automatically be calculated from the icon's width/height ratio.

**Examples:**

```html
<AutomdIcon height="1em" />
<AutomdIcon width="1em" height="1em" />
<AutomdIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AutomdIcon size="24" />
<AutomdIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.unjs-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AutomdIcon class="unjs-icon" />
```

## Available Icons

This package contains **63** icons:

- `automd`
- `bundleRunner`
- `c12`
- `changelogen`
- `citty`
- `confbox`
- `consola`
- `cookieEs`
- `crossws`
- `db0`
- `defu`
- `destr`
- `fontaine`
- `fsMemo`
- `getPortPlease`
- `giget`
- `h3`
- `hookable`
- `httpxy`
- `imageMeta`
- `ipx`
- `jimpCompact`
- `jiti`
- `knitwork`
- `listhen`
- `magicRegexp`
- `magicast`
- `mdbox`
- `mkdist`
- `mlly`
- `mongoz`
- `nanotar`
- `nitro`
- `nodeFetchNative`
- `nypm`
- `ofetch`
- `ohash`
- `pathe`
- `perfectDebounce`
- `pkgTypes`
- `radix3`
- `rc9`
- `scule`
- `servePlaceholder`
- `stdEnv`
- `themeColors`
- `ufo`
- `unbuild`
- `uncrypto`
- `unctx`
- `undocs`
- `unenv`
- `ungh`
- `unhead`
- `unimport`
- `unpdf`
- `unplugin`
- `unstorage`
- `untun`
- `untyped`
- `unwasm`
- `uqr`
- `webpackbar`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AutomdIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><BundleRunnerIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><C12Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ChangelogenIcon size="20" class="nav-icon" /> Settings</a>
</nav>

<style>
  nav {
    display: flex;
    gap: 1rem;
  }
  nav a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .nav-icon {
    color: currentColor;
  }
</style>
```

### Custom Styling

```html
<AutomdIcon
  size="24"
  class="icon icon-primary"
  style="opacity: 0.8; transition: opacity 0.2s;"
/>

<style>
  .icon-primary {
    color: #4a90e2;
  }
  .icon-primary:hover {
    opacity: 1;
  }
</style>
```

### Status Indicators

```html
<div class="status-grid">
  <div class="status-item">
    <AutomdIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <BundleRunnerIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <C12Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AutomdIcon size="24" />
   <BundleRunnerIcon size="24" color="#4a90e2" />
   ```

2. **Use CSS for Theming**: Apply consistent styling through CSS classes
   ```css
   .icon {
     color: currentColor;
     opacity: 0.8;
     transition: opacity 0.2s;
   }

   .icon:hover {
     opacity: 1;
   }
   ```

   ```html
   <AutomdIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AutomdIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AutomdIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { automd } from '@stacksjs/iconify-unjs'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(automd, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { automd } from '@stacksjs/iconify-unjs'

// Icons are typed as IconData
const myIcon: IconData = automd
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0



## Credits

- **Icons**: UnJS ([Website](https://github.com/unjs))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/unjs/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/unjs/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
