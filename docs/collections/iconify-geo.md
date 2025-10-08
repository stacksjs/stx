# GeoGlyphs

> GeoGlyphs icons for stx from Iconify

## Overview

This package provides access to 30 icons from the GeoGlyphs collection through the stx iconify integration.

**Collection ID:** `geo`
**Total Icons:** 30
**Author:** Sam Matthews ([Website](https://github.com/cugos/geoglyphs))
**License:** MIT ([Details](https://github.com/cugos/geoglyphs/blob/main/LICENSE.md))
**Category:** Flags / Maps
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-geo
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { TurfAlongIcon, TurfBboxPolygonIcon, TurfBezierIcon } from '@stacksjs/iconify-geo'

// Basic usage
const icon = TurfAlongIcon()

// With size
const sizedIcon = TurfAlongIcon({ size: 24 })

// With color
const coloredIcon = TurfBboxPolygonIcon({ color: 'red' })

// With multiple props
const customIcon = TurfBezierIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { TurfAlongIcon, TurfBboxPolygonIcon, TurfBezierIcon } from '@stacksjs/iconify-geo'

  global.icons = {
    home: TurfAlongIcon({ size: 24 }),
    user: TurfBboxPolygonIcon({ size: 24, color: '#4a90e2' }),
    settings: TurfBezierIcon({ size: 32 })
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
import { turfAlong, turfBboxPolygon, turfBezier } from '@stacksjs/iconify-geo'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(turfAlong, { size: 24 })
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

### Monotone Icons

Monotone icons use `currentColor` by default, allowing you to change icon color via the `color` property or CSS:

```typescript
// Via color property
const redIcon = TurfAlongIcon({ color: 'red' })
const blueIcon = TurfAlongIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = TurfAlongIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = TurfAlongIcon({ class: 'text-primary' })
```

```css
/* In your CSS */
.text-primary {
  color: #4a90e2;
}

.icon:hover {
  color: #357abd;
}
```

## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = TurfAlongIcon({ size: 24 })
const icon1em = TurfAlongIcon({ size: '1em' })

// Set individual dimensions
const customIcon = TurfAlongIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = TurfAlongIcon({ height: '1em' })
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
const smallIcon = TurfAlongIcon({ class: 'icon-small' })
const largeIcon = TurfAlongIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **30** icons:

- `turfAlong`
- `turfBboxPolygon`
- `turfBezier`
- `turfBuffer`
- `turfCenter`
- `turfCentroid`
- `turfConcave`
- `turfConvex`
- `turfDestination`
- `turfEnvelope`
- `turfErased`
- `turfExplode`
- `turfExtent`
- `turfIntersect`
- `turfKinks`
- `turfLineSlice`
- `turfMerge`
- `turfMidpoint`
- `turfPointGrid`
- `turfPointOnLine`
- `turfPointOnSurface`
- `turfSimplify`
- `turfSize`
- `turfSquare`
- `turfSquareGrid`
- `turfTin`
- `turfTriangleGrid`
- `turfUnion`
- `uiEarthEast`
- `uiEarthWest`

## Usage Examples

### Navigation Menu

```html
@js
  import { TurfAlongIcon, TurfBboxPolygonIcon, TurfBezierIcon, TurfBufferIcon } from '@stacksjs/iconify-geo'

  global.navIcons = {
    home: TurfAlongIcon({ size: 20, class: 'nav-icon' }),
    about: TurfBboxPolygonIcon({ size: 20, class: 'nav-icon' }),
    contact: TurfBezierIcon({ size: 20, class: 'nav-icon' }),
    settings: TurfBufferIcon({ size: 20, class: 'nav-icon' })
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
import { TurfAlongIcon } from '@stacksjs/iconify-geo'

const icon = TurfAlongIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { TurfAlongIcon, TurfBboxPolygonIcon, TurfBezierIcon } from '@stacksjs/iconify-geo'

const successIcon = TurfAlongIcon({ size: 16, color: '#22c55e' })
const warningIcon = TurfBboxPolygonIcon({ size: 16, color: '#f59e0b' })
const errorIcon = TurfBezierIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { TurfAlongIcon, TurfBboxPolygonIcon } from '@stacksjs/iconify-geo'
   const icon = TurfAlongIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { turfAlong, turfBboxPolygon } from '@stacksjs/iconify-geo'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(turfAlong, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { TurfAlongIcon, TurfBboxPolygonIcon } from '@stacksjs/iconify-geo'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-geo'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { TurfAlongIcon } from '@stacksjs/iconify-geo'
     global.icon = TurfAlongIcon({ size: 24 })
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
   const icon = TurfAlongIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { turfAlong } from '@stacksjs/iconify-geo'

// Icons are typed as IconData
const myIcon: IconData = turfAlong
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/cugos/geoglyphs/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: Sam Matthews ([Website](https://github.com/cugos/geoglyphs))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/geo/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/geo/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
