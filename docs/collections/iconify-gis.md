# Font-GIS

> Font-GIS icons for stx from Iconify

## Overview

This package provides access to 367 icons from the Font-GIS collection through the stx iconify integration.

**Collection ID:** `gis`
**Total Icons:** 367
**Author:** Jean-Marc Viglino ([Website](https://github.com/viglino/font-gis))
**License:** CC BY 4.0 ([Details](https://github.com/Viglino/font-gis/blob/main/LICENSE-CC-BY.md))
**Category:** Flags / Maps
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gis
```

## Quick Start

### In stx Templates

```html
@js
  import { 360, 3dtilesFile, 3dtilesWeb } from '@stacksjs/iconify-gis'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    360: renderIcon(360, { size: 24 }),
    3dtilesFile: renderIcon(3dtilesFile, { size: 24, color: '#4a90e2' }),
    3dtilesWeb: renderIcon(3dtilesWeb, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.360 !!}
  {!! icons.3dtilesFile !!}
  {!! icons.3dtilesWeb !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 360, 3dtilesFile, 3dtilesWeb } from '@stacksjs/iconify-gis'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(360, { size: 24 })

// With custom color
const coloredIcon = renderIcon(3dtilesFile, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dtilesWeb, {
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

This package contains **367** icons. Here are some examples:

- `360`
- `3dtilesFile`
- `3dtilesWeb`
- `arrow`
- `arrowO`

...and 357 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/gis/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 360, 3dtilesFile, 3dtilesWeb, arrow } from '@stacksjs/iconify-gis'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    360: renderIcon(360, { size: 20, class: 'nav-icon' }),
    3dtilesFile: renderIcon(3dtilesFile, { size: 20, class: 'nav-icon' }),
    3dtilesWeb: renderIcon(3dtilesWeb, { size: 20, class: 'nav-icon' }),
    arrow: renderIcon(arrow, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.360 !!} Home</a>
  <a href="/about">{!! navIcons.3dtilesFile !!} About</a>
  <a href="/contact">{!! navIcons.3dtilesWeb !!} Contact</a>
  <a href="/settings">{!! navIcons.arrow !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 360 } from '@stacksjs/iconify-gis'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(360, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-gis'
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
   import { 360, 3dtilesFile } from '@stacksjs/iconify-gis'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-gis'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 360 } from '@stacksjs/iconify-gis'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(360, { size: 24 })
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
import { 360 } from '@stacksjs/iconify-gis'

// Icons are typed as IconData
const myIcon: IconData = 360
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://github.com/Viglino/font-gis/blob/main/LICENSE-CC-BY.md) for more information.

## Credits

- **Icons**: Jean-Marc Viglino ([Website](https://github.com/viglino/font-gis))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gis/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gis/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
