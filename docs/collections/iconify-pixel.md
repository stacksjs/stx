# Pixel Icon

> Pixel Icon icons for stx from Iconify

## Overview

This package provides access to 450 icons from the Pixel Icon collection through the stx iconify integration.

**Collection ID:** `pixel`
**Total Icons:** 450
**Author:** HackerNoon ([Website](https://github.com/hackernoon/pixel-icon-library))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pixel
```

## Quick Start

### In stx Templates

```html
@js
  import { ad, adSolid, alignCenter } from '@stacksjs/iconify-pixel'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    ad: renderIcon(ad, { size: 24 }),
    adSolid: renderIcon(adSolid, { size: 24, color: '#4a90e2' }),
    alignCenter: renderIcon(alignCenter, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.ad !!}
  {!! icons.adSolid !!}
  {!! icons.alignCenter !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { ad, adSolid, alignCenter } from '@stacksjs/iconify-pixel'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(ad, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adSolid, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alignCenter, {
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

This package contains **450** icons. Here are some examples:

- `ad`
- `adSolid`
- `alignCenter`
- `alignCenterSolid`
- `alignJustify`

...and 440 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/pixel/).

## Usage Examples

### Navigation Menu

```html
@js
  import { ad, adSolid, alignCenter, alignCenterSolid } from '@stacksjs/iconify-pixel'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    ad: renderIcon(ad, { size: 20, class: 'nav-icon' }),
    adSolid: renderIcon(adSolid, { size: 20, class: 'nav-icon' }),
    alignCenter: renderIcon(alignCenter, { size: 20, class: 'nav-icon' }),
    alignCenterSolid: renderIcon(alignCenterSolid, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.ad !!} Home</a>
  <a href="/about">{!! navIcons.adSolid !!} About</a>
  <a href="/contact">{!! navIcons.alignCenter !!} Contact</a>
  <a href="/settings">{!! navIcons.alignCenterSolid !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { ad } from '@stacksjs/iconify-pixel'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(ad, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-pixel'
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
   import { ad, adSolid } from '@stacksjs/iconify-pixel'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-pixel'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ad } from '@stacksjs/iconify-pixel'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(ad, { size: 24 })
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
import { ad } from '@stacksjs/iconify-pixel'

// Icons are typed as IconData
const myIcon: IconData = ad
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: HackerNoon ([Website](https://github.com/hackernoon/pixel-icon-library))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pixel/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pixel/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
