# Dashicons

> Dashicons icons for stx from Iconify

## Overview

This package provides access to 345 icons from the Dashicons collection through the stx iconify integration.

**Collection ID:** `dashicons`
**Total Icons:** 345
**Author:** WordPress ([Website](https://github.com/WordPress/dashicons))
**License:** GPL ([Details](https://github.com/WordPress/dashicons/blob/master/gpl.txt))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-dashicons
```

## Quick Start

### In stx Templates

```html
@js
  import { adminAppearance, adminCollapse, adminComments } from '@stacksjs/iconify-dashicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    adminAppearance: renderIcon(adminAppearance, { size: 24 }),
    adminCollapse: renderIcon(adminCollapse, { size: 24, color: '#4a90e2' }),
    adminComments: renderIcon(adminComments, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.adminAppearance !!}
  {!! icons.adminCollapse !!}
  {!! icons.adminComments !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { adminAppearance, adminCollapse, adminComments } from '@stacksjs/iconify-dashicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(adminAppearance, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adminCollapse, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adminComments, {
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

This package contains **345** icons. Here are some examples:

- `adminAppearance`
- `adminCollapse`
- `adminComments`
- `adminCustomizer`
- `adminGeneric`

...and 335 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/dashicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { adminAppearance, adminCollapse, adminComments, adminCustomizer } from '@stacksjs/iconify-dashicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    adminAppearance: renderIcon(adminAppearance, { size: 20, class: 'nav-icon' }),
    adminCollapse: renderIcon(adminCollapse, { size: 20, class: 'nav-icon' }),
    adminComments: renderIcon(adminComments, { size: 20, class: 'nav-icon' }),
    adminCustomizer: renderIcon(adminCustomizer, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.adminAppearance !!} Home</a>
  <a href="/about">{!! navIcons.adminCollapse !!} About</a>
  <a href="/contact">{!! navIcons.adminComments !!} Contact</a>
  <a href="/settings">{!! navIcons.adminCustomizer !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { adminAppearance } from '@stacksjs/iconify-dashicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(adminAppearance, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-dashicons'
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
   import { adminAppearance, adminCollapse } from '@stacksjs/iconify-dashicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-dashicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { adminAppearance } from '@stacksjs/iconify-dashicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(adminAppearance, { size: 24 })
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
import { adminAppearance } from '@stacksjs/iconify-dashicons'

// Icons are typed as IconData
const myIcon: IconData = adminAppearance
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL

See [license details](https://github.com/WordPress/dashicons/blob/master/gpl.txt) for more information.

## Credits

- **Icons**: WordPress ([Website](https://github.com/WordPress/dashicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/dashicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/dashicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
