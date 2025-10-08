# Pepicons Pencil

> Pepicons Pencil icons for stx from Iconify

## Overview

This package provides access to 1275 icons from the Pepicons Pencil collection through the stx iconify integration.

**Collection ID:** `pepicons-pencil`
**Total Icons:** 1275
**Author:** CyCraft ([Website](https://github.com/CyCraft/pepicons))
**License:** CC BY 4.0 ([Details](https://github.com/CyCraft/pepicons/blob/dev/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pepicons-pencil
```

## Quick Start

### In stx Templates

```html
@js
  import { airplane, airplaneCircle, airplaneCircleFilled } from '@stacksjs/iconify-pepicons-pencil'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    airplane: renderIcon(airplane, { size: 24 }),
    airplaneCircle: renderIcon(airplaneCircle, { size: 24, color: '#4a90e2' }),
    airplaneCircleFilled: renderIcon(airplaneCircleFilled, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.airplane !!}
  {!! icons.airplaneCircle !!}
  {!! icons.airplaneCircleFilled !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { airplane, airplaneCircle, airplaneCircleFilled } from '@stacksjs/iconify-pepicons-pencil'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(airplane, { size: 24 })

// With custom color
const coloredIcon = renderIcon(airplaneCircle, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(airplaneCircleFilled, {
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

This package contains **1275** icons. Here are some examples:

- `airplane`
- `airplaneCircle`
- `airplaneCircleFilled`
- `airplaneCircleOff`
- `airplaneOff`

...and 1265 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/pepicons-pencil/).

## Usage Examples

### Navigation Menu

```html
@js
  import { airplane, airplaneCircle, airplaneCircleFilled, airplaneCircleOff } from '@stacksjs/iconify-pepicons-pencil'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    airplane: renderIcon(airplane, { size: 20, class: 'nav-icon' }),
    airplaneCircle: renderIcon(airplaneCircle, { size: 20, class: 'nav-icon' }),
    airplaneCircleFilled: renderIcon(airplaneCircleFilled, { size: 20, class: 'nav-icon' }),
    airplaneCircleOff: renderIcon(airplaneCircleOff, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.airplane !!} Home</a>
  <a href="/about">{!! navIcons.airplaneCircle !!} About</a>
  <a href="/contact">{!! navIcons.airplaneCircleFilled !!} Contact</a>
  <a href="/settings">{!! navIcons.airplaneCircleOff !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { airplane } from '@stacksjs/iconify-pepicons-pencil'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(airplane, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-pepicons-pencil'
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
   import { airplane, airplaneCircle } from '@stacksjs/iconify-pepicons-pencil'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-pepicons-pencil'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { airplane } from '@stacksjs/iconify-pepicons-pencil'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(airplane, { size: 24 })
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
import { airplane } from '@stacksjs/iconify-pepicons-pencil'

// Icons are typed as IconData
const myIcon: IconData = airplane
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://github.com/CyCraft/pepicons/blob/dev/LICENSE) for more information.

## Credits

- **Icons**: CyCraft ([Website](https://github.com/CyCraft/pepicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pepicons-pencil/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pepicons-pencil/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
