# IconaMoon

> IconaMoon icons for stx from Iconify

## Overview

This package provides access to 1781 icons from the IconaMoon collection through the stx iconify integration.

**Collection ID:** `iconamoon`
**Total Icons:** 1781
**Author:** Dariush Habibpour ([Website](https://github.com/dariushhpg1/IconaMoon))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-iconamoon
```

## Quick Start

### In stx Templates

```html
@js
  import { 3d, 3dBold, 3dDuotone } from '@stacksjs/iconify-iconamoon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3d: renderIcon(3d, { size: 24 }),
    3dBold: renderIcon(3dBold, { size: 24, color: '#4a90e2' }),
    3dDuotone: renderIcon(3dDuotone, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3d !!}
  {!! icons.3dBold !!}
  {!! icons.3dDuotone !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3d, 3dBold, 3dDuotone } from '@stacksjs/iconify-iconamoon'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3d, { size: 24 })

// With custom color
const coloredIcon = renderIcon(3dBold, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dDuotone, {
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

This package contains **1781** icons. Here are some examples:

- `3d`
- `3dBold`
- `3dDuotone`
- `3dFill`
- `3dLight`

...and 1771 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/iconamoon/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3d, 3dBold, 3dDuotone, 3dFill } from '@stacksjs/iconify-iconamoon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3d: renderIcon(3d, { size: 20, class: 'nav-icon' }),
    3dBold: renderIcon(3dBold, { size: 20, class: 'nav-icon' }),
    3dDuotone: renderIcon(3dDuotone, { size: 20, class: 'nav-icon' }),
    3dFill: renderIcon(3dFill, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3d !!} Home</a>
  <a href="/about">{!! navIcons.3dBold !!} About</a>
  <a href="/contact">{!! navIcons.3dDuotone !!} Contact</a>
  <a href="/settings">{!! navIcons.3dFill !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3d } from '@stacksjs/iconify-iconamoon'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3d, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-iconamoon'
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
   import { 3d, 3dBold } from '@stacksjs/iconify-iconamoon'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-iconamoon'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3d } from '@stacksjs/iconify-iconamoon'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3d, { size: 24 })
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
import { 3d } from '@stacksjs/iconify-iconamoon'

// Icons are typed as IconData
const myIcon: IconData = 3d
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Dariush Habibpour ([Website](https://github.com/dariushhpg1/IconaMoon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/iconamoon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/iconamoon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
