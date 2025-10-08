# Elegant

> Elegant icons for stx from Iconify

## Overview

This package provides access to 100 icons from the Elegant collection through the stx iconify integration.

**Collection ID:** `et`
**Total Icons:** 100
**Author:** Kenny Sing ([Website](https://github.com/pprince/etlinefont-bower))
**License:** GPL 3.0 ([Details](https://www.gnu.org/licenses/gpl.html))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-et
```

## Quick Start

### In stx Templates

```html
@js
  import { adjustments, alarmclock, anchor } from '@stacksjs/iconify-et'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    adjustments: renderIcon(adjustments, { size: 24 }),
    alarmclock: renderIcon(alarmclock, { size: 24, color: '#4a90e2' }),
    anchor: renderIcon(anchor, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.adjustments !!}
  {!! icons.alarmclock !!}
  {!! icons.anchor !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { adjustments, alarmclock, anchor } from '@stacksjs/iconify-et'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(adjustments, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alarmclock, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(anchor, {
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

This package contains **100** icons. Here are some examples:

- `adjustments`
- `alarmclock`
- `anchor`
- `aperture`
- `attachments`

...and 90 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/et/).

## Usage Examples

### Navigation Menu

```html
@js
  import { adjustments, alarmclock, anchor, aperture } from '@stacksjs/iconify-et'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    adjustments: renderIcon(adjustments, { size: 20, class: 'nav-icon' }),
    alarmclock: renderIcon(alarmclock, { size: 20, class: 'nav-icon' }),
    anchor: renderIcon(anchor, { size: 20, class: 'nav-icon' }),
    aperture: renderIcon(aperture, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.adjustments !!} Home</a>
  <a href="/about">{!! navIcons.alarmclock !!} About</a>
  <a href="/contact">{!! navIcons.anchor !!} Contact</a>
  <a href="/settings">{!! navIcons.aperture !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { adjustments } from '@stacksjs/iconify-et'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(adjustments, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-et'
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
   import { adjustments, alarmclock } from '@stacksjs/iconify-et'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-et'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { adjustments } from '@stacksjs/iconify-et'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(adjustments, { size: 24 })
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
import { adjustments } from '@stacksjs/iconify-et'

// Icons are typed as IconData
const myIcon: IconData = adjustments
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL 3.0

See [license details](https://www.gnu.org/licenses/gpl.html) for more information.

## Credits

- **Icons**: Kenny Sing ([Website](https://github.com/pprince/etlinefont-bower))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/et/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/et/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
