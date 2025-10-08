# Cuida Icons

> Cuida Icons icons for stx from Iconify

## Overview

This package provides access to 182 icons from the Cuida Icons collection through the stx iconify integration.

**Collection ID:** `cuida`
**Total Icons:** 182
**Author:** Sysvale ([Website](https://github.com/Sysvale/cuida-icons))
**License:** Apache 2.0 ([Details](https://github.com/Sysvale/cuida-icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-cuida
```

## Quick Start

### In stx Templates

```html
@js
  import { alertOutline, ambulanceOutline, arrowDownCircleOutline } from '@stacksjs/iconify-cuida'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    alertOutline: renderIcon(alertOutline, { size: 24 }),
    ambulanceOutline: renderIcon(ambulanceOutline, { size: 24, color: '#4a90e2' }),
    arrowDownCircleOutline: renderIcon(arrowDownCircleOutline, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.alertOutline !!}
  {!! icons.ambulanceOutline !!}
  {!! icons.arrowDownCircleOutline !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { alertOutline, ambulanceOutline, arrowDownCircleOutline } from '@stacksjs/iconify-cuida'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(alertOutline, { size: 24 })

// With custom color
const coloredIcon = renderIcon(ambulanceOutline, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(arrowDownCircleOutline, {
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

This package contains **182** icons. Here are some examples:

- `alertOutline`
- `ambulanceOutline`
- `arrowDownCircleOutline`
- `arrowDownOutline`
- `arrowLeftCircleOutline`

...and 172 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/cuida/).

## Usage Examples

### Navigation Menu

```html
@js
  import { alertOutline, ambulanceOutline, arrowDownCircleOutline, arrowDownOutline } from '@stacksjs/iconify-cuida'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    alertOutline: renderIcon(alertOutline, { size: 20, class: 'nav-icon' }),
    ambulanceOutline: renderIcon(ambulanceOutline, { size: 20, class: 'nav-icon' }),
    arrowDownCircleOutline: renderIcon(arrowDownCircleOutline, { size: 20, class: 'nav-icon' }),
    arrowDownOutline: renderIcon(arrowDownOutline, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.alertOutline !!} Home</a>
  <a href="/about">{!! navIcons.ambulanceOutline !!} About</a>
  <a href="/contact">{!! navIcons.arrowDownCircleOutline !!} Contact</a>
  <a href="/settings">{!! navIcons.arrowDownOutline !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { alertOutline } from '@stacksjs/iconify-cuida'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(alertOutline, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-cuida'
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
   import { alertOutline, ambulanceOutline } from '@stacksjs/iconify-cuida'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-cuida'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { alertOutline } from '@stacksjs/iconify-cuida'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(alertOutline, { size: 24 })
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
import { alertOutline } from '@stacksjs/iconify-cuida'

// Icons are typed as IconData
const myIcon: IconData = alertOutline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Sysvale/cuida-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Sysvale ([Website](https://github.com/Sysvale/cuida-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cuida/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cuida/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
