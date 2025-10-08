# Pepicons

> Pepicons icons for stx from Iconify

## Overview

This package provides access to 428 icons from the Pepicons collection through the stx iconify integration.

**Collection ID:** `pepicons`
**Total Icons:** 428
**Author:** CyCraft ([Website](https://github.com/CyCraft/pepicons))
**License:** CC BY 4.0 ([Details](https://github.com/CyCraft/pepicons/blob/dev/LICENSE))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pepicons
```

## Quick Start

### In stx Templates

```html
@js
  import { airplane, airplanePrint, alarm } from '@stacksjs/iconify-pepicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    airplane: renderIcon(airplane, { size: 24 }),
    airplanePrint: renderIcon(airplanePrint, { size: 24, color: '#4a90e2' }),
    alarm: renderIcon(alarm, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.airplane !!}
  {!! icons.airplanePrint !!}
  {!! icons.alarm !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { airplane, airplanePrint, alarm } from '@stacksjs/iconify-pepicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(airplane, { size: 24 })

// With custom color
const coloredIcon = renderIcon(airplanePrint, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alarm, {
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

This package contains **428** icons. Here are some examples:

- `airplane`
- `airplanePrint`
- `alarm`
- `alarmPrint`
- `angleDown`

...and 418 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/pepicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { airplane, airplanePrint, alarm, alarmPrint } from '@stacksjs/iconify-pepicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    airplane: renderIcon(airplane, { size: 20, class: 'nav-icon' }),
    airplanePrint: renderIcon(airplanePrint, { size: 20, class: 'nav-icon' }),
    alarm: renderIcon(alarm, { size: 20, class: 'nav-icon' }),
    alarmPrint: renderIcon(alarmPrint, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.airplane !!} Home</a>
  <a href="/about">{!! navIcons.airplanePrint !!} About</a>
  <a href="/contact">{!! navIcons.alarm !!} Contact</a>
  <a href="/settings">{!! navIcons.alarmPrint !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { airplane } from '@stacksjs/iconify-pepicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(airplane, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-pepicons'
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
   import { airplane, airplanePrint } from '@stacksjs/iconify-pepicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-pepicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { airplane } from '@stacksjs/iconify-pepicons'
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
import { airplane } from '@stacksjs/iconify-pepicons'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pepicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pepicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
