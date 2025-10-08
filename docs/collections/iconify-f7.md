# Framework7 Icons

> Framework7 Icons icons for stx from Iconify

## Overview

This package provides access to 1253 icons from the Framework7 Icons collection through the stx iconify integration.

**Collection ID:** `f7`
**Total Icons:** 1253
**Author:** Vladimir Kharlampidi ([Website](https://github.com/framework7io/framework7-icons))
**License:** MIT ([Details](https://github.com/framework7io/framework7-icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-f7
```

## Quick Start

### In stx Templates

```html
@js
  import { airplane, alarm, alarmFill } from '@stacksjs/iconify-f7'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    airplane: renderIcon(airplane, { size: 24 }),
    alarm: renderIcon(alarm, { size: 24, color: '#4a90e2' }),
    alarmFill: renderIcon(alarmFill, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.airplane !!}
  {!! icons.alarm !!}
  {!! icons.alarmFill !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { airplane, alarm, alarmFill } from '@stacksjs/iconify-f7'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(airplane, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alarm, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alarmFill, {
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

This package contains **1253** icons. Here are some examples:

- `airplane`
- `alarm`
- `alarmFill`
- `alt`
- `ant`

...and 1243 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/f7/).

## Usage Examples

### Navigation Menu

```html
@js
  import { airplane, alarm, alarmFill, alt } from '@stacksjs/iconify-f7'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    airplane: renderIcon(airplane, { size: 20, class: 'nav-icon' }),
    alarm: renderIcon(alarm, { size: 20, class: 'nav-icon' }),
    alarmFill: renderIcon(alarmFill, { size: 20, class: 'nav-icon' }),
    alt: renderIcon(alt, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.airplane !!} Home</a>
  <a href="/about">{!! navIcons.alarm !!} About</a>
  <a href="/contact">{!! navIcons.alarmFill !!} Contact</a>
  <a href="/settings">{!! navIcons.alt !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { airplane } from '@stacksjs/iconify-f7'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(airplane, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-f7'
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
   import { airplane, alarm } from '@stacksjs/iconify-f7'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-f7'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { airplane } from '@stacksjs/iconify-f7'
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
import { airplane } from '@stacksjs/iconify-f7'

// Icons are typed as IconData
const myIcon: IconData = airplane
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/framework7io/framework7-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Vladimir Kharlampidi ([Website](https://github.com/framework7io/framework7-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/f7/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/f7/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
