# Font Awesome Brands

> Font Awesome Brands icons for stx from Iconify

## Overview

This package provides access to 548 icons from the Font Awesome Brands collection through the stx iconify integration.

**Collection ID:** `fa7-brands`
**Total Icons:** 548
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa7-brands
```

## Quick Start

### In stx Templates

```html
@js
  import { 11ty, 42Group, 500px } from '@stacksjs/iconify-fa7-brands'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    11ty: renderIcon(11ty, { size: 24 }),
    42Group: renderIcon(42Group, { size: 24, color: '#4a90e2' }),
    500px: renderIcon(500px, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.11ty !!}
  {!! icons.42Group !!}
  {!! icons.500px !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 11ty, 42Group, 500px } from '@stacksjs/iconify-fa7-brands'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(11ty, { size: 24 })

// With custom color
const coloredIcon = renderIcon(42Group, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(500px, {
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

This package contains **548** icons. Here are some examples:

- `11ty`
- `42Group`
- `500px`
- `accessibleIcon`
- `accusoft`

...and 538 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fa7-brands/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 11ty, 42Group, 500px, accessibleIcon } from '@stacksjs/iconify-fa7-brands'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    11ty: renderIcon(11ty, { size: 20, class: 'nav-icon' }),
    42Group: renderIcon(42Group, { size: 20, class: 'nav-icon' }),
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    accessibleIcon: renderIcon(accessibleIcon, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.11ty !!} Home</a>
  <a href="/about">{!! navIcons.42Group !!} About</a>
  <a href="/contact">{!! navIcons.500px !!} Contact</a>
  <a href="/settings">{!! navIcons.accessibleIcon !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 11ty } from '@stacksjs/iconify-fa7-brands'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(11ty, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fa7-brands'
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
   import { 11ty, 42Group } from '@stacksjs/iconify-fa7-brands'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fa7-brands'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 11ty } from '@stacksjs/iconify-fa7-brands'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(11ty, { size: 24 })
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
import { 11ty } from '@stacksjs/iconify-fa7-brands'

// Icons are typed as IconData
const myIcon: IconData = 11ty
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa7-brands/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa7-brands/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
