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

### In stx Templates

```html
@js
  import { turfAlong, turfBboxPolygon, turfBezier } from '@stacksjs/iconify-geo'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    turfAlong: renderIcon(turfAlong, { size: 24 }),
    turfBboxPolygon: renderIcon(turfBboxPolygon, { size: 24, color: '#4a90e2' }),
    turfBezier: renderIcon(turfBezier, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.turfAlong !!}
  {!! icons.turfBboxPolygon !!}
  {!! icons.turfBezier !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { turfAlong, turfBboxPolygon, turfBezier } from '@stacksjs/iconify-geo'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(turfAlong, { size: 24 })

// With custom color
const coloredIcon = renderIcon(turfBboxPolygon, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(turfBezier, {
  size: 24,
  rotate: 90,
  hFlip: true
})
```

## Icon Options

The `renderIcon` function accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `string \| number` | - | Icon size (both width and height) |
| `width` | `string \| number` | - | Icon width |
| `height` | `string \| number` | - | Icon height |
| `color` | `string` | `'currentColor'` | Icon color (hex or CSS color) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation in degrees |
| `class` | `string` | - | Additional CSS classes |
| `style` | `string` | - | Additional inline styles |

## Available Icons

This package contains **30** icons. Here are some examples:

- `turfAlong`
- `turfBboxPolygon`
- `turfBezier`
- `turfBuffer`
- `turfCenter`

...and 20 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/geo/).

## Usage Examples

### Navigation Menu

```html
@js
  import { turfAlong, turfBboxPolygon, turfBezier, turfBuffer } from '@stacksjs/iconify-geo'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    turfAlong: renderIcon(turfAlong, { size: 20, class: 'nav-icon' }),
    turfBboxPolygon: renderIcon(turfBboxPolygon, { size: 20, class: 'nav-icon' }),
    turfBezier: renderIcon(turfBezier, { size: 20, class: 'nav-icon' }),
    turfBuffer: renderIcon(turfBuffer, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.turfAlong !!} Home</a>
  <a href="/about">{!! navIcons.turfBboxPolygon !!} About</a>
  <a href="/contact">{!! navIcons.turfBezier !!} Contact</a>
  <a href="/settings">{!! navIcons.turfBuffer !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { turfAlong } from '@stacksjs/iconify-geo'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(turfAlong, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-geo'
import { renderIcon } from '@stacksjs/iconify-core'

function getIcon(name: string) {
  const iconData = icons[name]
  if (!iconData) return null

  return renderIcon(iconData, { size: 24 })
}
```

## Best Practices

1. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good
   import { turfAlong, turfBboxPolygon } from '@stacksjs/iconify-geo'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-geo'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { turfAlong } from '@stacksjs/iconify-geo'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(turfAlong, { size: 24 })
   @endjs

   {!! icon !!}
   {!! icon !!}
   ```

3. **Use CSS for Theming**: Apply consistent styling through CSS classes
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
