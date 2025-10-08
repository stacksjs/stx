# Clarity

> Clarity icons for stx from Iconify

## Overview

This package provides access to 1105 icons from the Clarity collection through the stx iconify integration.

**Collection ID:** `clarity`
**Total Icons:** 1105
**Author:** VMware ([Website](https://github.com/vmware/clarity))
**License:** MIT ([Details](https://github.com/vmware/clarity-assets/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-clarity
```

## Quick Start

### In stx Templates

```html
@js
  import { accessibility1Line, accessibility1Solid, accessibility2Line } from '@stacksjs/iconify-clarity'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessibility1Line: renderIcon(accessibility1Line, { size: 24 }),
    accessibility1Solid: renderIcon(accessibility1Solid, { size: 24, color: '#4a90e2' }),
    accessibility2Line: renderIcon(accessibility2Line, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessibility1Line !!}
  {!! icons.accessibility1Solid !!}
  {!! icons.accessibility2Line !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessibility1Line, accessibility1Solid, accessibility2Line } from '@stacksjs/iconify-clarity'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessibility1Line, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessibility1Solid, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accessibility2Line, {
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

This package contains **1105** icons. Here are some examples:

- `accessibility1Line`
- `accessibility1Solid`
- `accessibility2Line`
- `accessibility2Solid`
- `addLine`

...and 1095 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/clarity/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessibility1Line, accessibility1Solid, accessibility2Line, accessibility2Solid } from '@stacksjs/iconify-clarity'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessibility1Line: renderIcon(accessibility1Line, { size: 20, class: 'nav-icon' }),
    accessibility1Solid: renderIcon(accessibility1Solid, { size: 20, class: 'nav-icon' }),
    accessibility2Line: renderIcon(accessibility2Line, { size: 20, class: 'nav-icon' }),
    accessibility2Solid: renderIcon(accessibility2Solid, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessibility1Line !!} Home</a>
  <a href="/about">{!! navIcons.accessibility1Solid !!} About</a>
  <a href="/contact">{!! navIcons.accessibility2Line !!} Contact</a>
  <a href="/settings">{!! navIcons.accessibility2Solid !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessibility1Line } from '@stacksjs/iconify-clarity'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessibility1Line, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-clarity'
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
   import { accessibility1Line, accessibility1Solid } from '@stacksjs/iconify-clarity'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-clarity'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessibility1Line } from '@stacksjs/iconify-clarity'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessibility1Line, { size: 24 })
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
import { accessibility1Line } from '@stacksjs/iconify-clarity'

// Icons are typed as IconData
const myIcon: IconData = accessibility1Line
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/vmware/clarity-assets/blob/master/LICENSE) for more information.

## Credits

- **Icons**: VMware ([Website](https://github.com/vmware/clarity))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/clarity/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/clarity/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
