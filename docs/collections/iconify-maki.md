# Maki

> Maki icons for stx from Iconify

## Overview

This package provides access to 418 icons from the Maki collection through the stx iconify integration.

**Collection ID:** `maki`
**Total Icons:** 418
**Author:** Mapbox ([Website](https://github.com/mapbox/maki))
**License:** CC0 ([Details](https://creativecommons.org/publicdomain/zero/1.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-maki
```

## Quick Start

### In stx Templates

```html
@js
  import { aerialway, aerialway11, airfield } from '@stacksjs/iconify-maki'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aerialway: renderIcon(aerialway, { size: 24 }),
    aerialway11: renderIcon(aerialway11, { size: 24, color: '#4a90e2' }),
    airfield: renderIcon(airfield, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aerialway !!}
  {!! icons.aerialway11 !!}
  {!! icons.airfield !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aerialway, aerialway11, airfield } from '@stacksjs/iconify-maki'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aerialway, { size: 24 })

// With custom color
const coloredIcon = renderIcon(aerialway11, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(airfield, {
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

This package contains **418** icons. Here are some examples:

- `aerialway`
- `aerialway11`
- `airfield`
- `airfield11`
- `airport`

...and 408 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/maki/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aerialway, aerialway11, airfield, airfield11 } from '@stacksjs/iconify-maki'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aerialway: renderIcon(aerialway, { size: 20, class: 'nav-icon' }),
    aerialway11: renderIcon(aerialway11, { size: 20, class: 'nav-icon' }),
    airfield: renderIcon(airfield, { size: 20, class: 'nav-icon' }),
    airfield11: renderIcon(airfield11, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aerialway !!} Home</a>
  <a href="/about">{!! navIcons.aerialway11 !!} About</a>
  <a href="/contact">{!! navIcons.airfield !!} Contact</a>
  <a href="/settings">{!! navIcons.airfield11 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aerialway } from '@stacksjs/iconify-maki'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aerialway, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-maki'
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
   import { aerialway, aerialway11 } from '@stacksjs/iconify-maki'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-maki'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aerialway } from '@stacksjs/iconify-maki'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(aerialway, { size: 24 })
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
import { aerialway } from '@stacksjs/iconify-maki'

// Icons are typed as IconData
const myIcon: IconData = aerialway
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0

See [license details](https://creativecommons.org/publicdomain/zero/1.0/) for more information.

## Credits

- **Icons**: Mapbox ([Website](https://github.com/mapbox/maki))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/maki/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/maki/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
