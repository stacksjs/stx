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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AutomdIcon, BundleRunnerIcon, C12Icon } from '@stacksjs/iconify-unjs'

// Basic usage
const icon = AutomdIcon()

// With size
const sizedIcon = AutomdIcon({ size: 24 })

// With color
const coloredIcon = BundleRunnerIcon({ color: 'red' })

// With multiple props
const customIcon = C12Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AutomdIcon, BundleRunnerIcon, C12Icon } from '@stacksjs/iconify-unjs'

  global.icons = {
    home: AutomdIcon({ size: 24 }),
    user: BundleRunnerIcon({ size: 24, color: '#4a90e2' }),
    settings: C12Icon({ size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.home !!}
  {!! icons.user !!}
  {!! icons.settings !!}
</div>
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

```typescript
// Via color property
const redIcon = AutomdIcon({ color: 'red' })
const blueIcon = AutomdIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AutomdIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AutomdIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AutomdIcon({ size: 24 })
const icon1em = AutomdIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AutomdIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AutomdIcon({ height: '1em' })
```

### CSS Sizing

You can also control icon size via CSS:

```css
.icon-small {
  width: 1em;
  height: 1em;
}

.icon-large {
  width: 2em;
  height: 2em;
}
```

```typescript
const smallIcon = AutomdIcon({ class: 'icon-small' })
const largeIcon = AutomdIcon({ class: 'icon-large' })
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
@js
  import { AutomdIcon, BundleRunnerIcon, C12Icon, ChangelogenIcon } from '@stacksjs/iconify-unjs'

  global.navIcons = {
    home: AutomdIcon({ size: 20, class: 'nav-icon' }),
    about: BundleRunnerIcon({ size: 20, class: 'nav-icon' }),
    contact: C12Icon({ size: 20, class: 'nav-icon' }),
    settings: ChangelogenIcon({ size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.home !!} Home</a>
  <a href="/about">{!! navIcons.about !!} About</a>
  <a href="/contact">{!! navIcons.contact !!} Contact</a>
  <a href="/settings">{!! navIcons.settings !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { AutomdIcon } from '@stacksjs/iconify-unjs'

const icon = AutomdIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AutomdIcon, BundleRunnerIcon, C12Icon } from '@stacksjs/iconify-unjs'

const successIcon = AutomdIcon({ size: 16, color: '#22c55e' })
const warningIcon = BundleRunnerIcon({ size: 16, color: '#f59e0b' })
const errorIcon = C12Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AutomdIcon, BundleRunnerIcon } from '@stacksjs/iconify-unjs'
   const icon = AutomdIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { automd, bundleRunner } from '@stacksjs/iconify-unjs'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(automd, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AutomdIcon, BundleRunnerIcon } from '@stacksjs/iconify-unjs'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-unjs'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AutomdIcon } from '@stacksjs/iconify-unjs'
     global.icon = AutomdIcon({ size: 24 })
   @endjs

   {!! icon !!}
   {!! icon !!}
   {!! icon !!}
   ```

4. **Use CSS for Theming**: Apply consistent styling through CSS classes
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

   ```typescript
   const icon = AutomdIcon({ class: 'icon' })
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
