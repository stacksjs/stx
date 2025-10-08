# Circum Icons

> Circum Icons icons for stx from Iconify

## Overview

This package provides access to 288 icons from the Circum Icons collection through the stx iconify integration.

**Collection ID:** `circum`
**Total Icons:** 288
**Author:** Klarr Agency ([Website](https://github.com/Klarr-Agency/Circum-Icons))
**License:** Mozilla Public License 2.0 ([Details](https://github.com/Klarr-Agency/Circum-Icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-circum
```

## Quick Start

### In stx Templates

```html
@js
  import { airportSign1, alarmOff, alarmOn } from '@stacksjs/iconify-circum'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    airportSign1: renderIcon(airportSign1, { size: 24 }),
    alarmOff: renderIcon(alarmOff, { size: 24, color: '#4a90e2' }),
    alarmOn: renderIcon(alarmOn, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.airportSign1 !!}
  {!! icons.alarmOff !!}
  {!! icons.alarmOn !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { airportSign1, alarmOff, alarmOn } from '@stacksjs/iconify-circum'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(airportSign1, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alarmOff, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alarmOn, {
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

This package contains **288** icons. Here are some examples:

- `airportSign1`
- `alarmOff`
- `alarmOn`
- `alignBottom`
- `alignCenterH`

...and 278 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/circum/).

## Usage Examples

### Navigation Menu

```html
@js
  import { airportSign1, alarmOff, alarmOn, alignBottom } from '@stacksjs/iconify-circum'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    airportSign1: renderIcon(airportSign1, { size: 20, class: 'nav-icon' }),
    alarmOff: renderIcon(alarmOff, { size: 20, class: 'nav-icon' }),
    alarmOn: renderIcon(alarmOn, { size: 20, class: 'nav-icon' }),
    alignBottom: renderIcon(alignBottom, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.airportSign1 !!} Home</a>
  <a href="/about">{!! navIcons.alarmOff !!} About</a>
  <a href="/contact">{!! navIcons.alarmOn !!} Contact</a>
  <a href="/settings">{!! navIcons.alignBottom !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { airportSign1 } from '@stacksjs/iconify-circum'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(airportSign1, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-circum'
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
   import { airportSign1, alarmOff } from '@stacksjs/iconify-circum'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-circum'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { airportSign1 } from '@stacksjs/iconify-circum'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(airportSign1, { size: 24 })
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
import { airportSign1 } from '@stacksjs/iconify-circum'

// Icons are typed as IconData
const myIcon: IconData = airportSign1
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Mozilla Public License 2.0

See [license details](https://github.com/Klarr-Agency/Circum-Icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Klarr Agency ([Website](https://github.com/Klarr-Agency/Circum-Icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/circum/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/circum/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
