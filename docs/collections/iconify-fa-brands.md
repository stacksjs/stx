# Font Awesome 5 Brands

> Font Awesome 5 Brands icons for stx from Iconify

## Overview

This package provides access to 460 icons from the Font Awesome 5 Brands collection through the stx iconify integration.

**Collection ID:** `fa-brands`
**Total Icons:** 460
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa-brands
```

## Quick Start

### In stx Templates

```html
@js
  import { 500px, accessibleIcon, accusoft } from '@stacksjs/iconify-fa-brands'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    500px: renderIcon(500px, { size: 24 }),
    accessibleIcon: renderIcon(accessibleIcon, { size: 24, color: '#4a90e2' }),
    accusoft: renderIcon(accusoft, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.500px !!}
  {!! icons.accessibleIcon !!}
  {!! icons.accusoft !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 500px, accessibleIcon, accusoft } from '@stacksjs/iconify-fa-brands'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(500px, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessibleIcon, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accusoft, {
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

This package contains **460** icons. Here are some examples:

- `500px`
- `accessibleIcon`
- `accusoft`
- `acquisitionsIncorporated`
- `adn`

...and 450 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fa-brands/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 500px, accessibleIcon, accusoft, acquisitionsIncorporated } from '@stacksjs/iconify-fa-brands'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    accessibleIcon: renderIcon(accessibleIcon, { size: 20, class: 'nav-icon' }),
    accusoft: renderIcon(accusoft, { size: 20, class: 'nav-icon' }),
    acquisitionsIncorporated: renderIcon(acquisitionsIncorporated, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.500px !!} Home</a>
  <a href="/about">{!! navIcons.accessibleIcon !!} About</a>
  <a href="/contact">{!! navIcons.accusoft !!} Contact</a>
  <a href="/settings">{!! navIcons.acquisitionsIncorporated !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 500px } from '@stacksjs/iconify-fa-brands'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(500px, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fa-brands'
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
   import { 500px, accessibleIcon } from '@stacksjs/iconify-fa-brands'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fa-brands'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-fa-brands'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(500px, { size: 24 })
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
import { 500px } from '@stacksjs/iconify-fa-brands'

// Icons are typed as IconData
const myIcon: IconData = 500px
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa-brands/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa-brands/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
