# System UIcons

> System UIcons icons for stx from Iconify

## Overview

This package provides access to 430 icons from the System UIcons collection through the stx iconify integration.

**Collection ID:** `system-uicons`
**Total Icons:** 430
**Author:** Corey Ginnivan ([Website](https://github.com/CoreyGinnivan/system-uicons))
**License:** Unlicense ([Details](https://github.com/CoreyGinnivan/system-uicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-system-uicons
```

## Quick Start

### In stx Templates

```html
@js
  import { airplay, alarmClock, alignHorizontal } from '@stacksjs/iconify-system-uicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    airplay: renderIcon(airplay, { size: 24 }),
    alarmClock: renderIcon(alarmClock, { size: 24, color: '#4a90e2' }),
    alignHorizontal: renderIcon(alignHorizontal, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.airplay !!}
  {!! icons.alarmClock !!}
  {!! icons.alignHorizontal !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { airplay, alarmClock, alignHorizontal } from '@stacksjs/iconify-system-uicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(airplay, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alarmClock, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alignHorizontal, {
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

This package contains **430** icons. Here are some examples:

- `airplay`
- `alarmClock`
- `alignHorizontal`
- `alignVertical`
- `angle`

...and 420 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/system-uicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { airplay, alarmClock, alignHorizontal, alignVertical } from '@stacksjs/iconify-system-uicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    airplay: renderIcon(airplay, { size: 20, class: 'nav-icon' }),
    alarmClock: renderIcon(alarmClock, { size: 20, class: 'nav-icon' }),
    alignHorizontal: renderIcon(alignHorizontal, { size: 20, class: 'nav-icon' }),
    alignVertical: renderIcon(alignVertical, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.airplay !!} Home</a>
  <a href="/about">{!! navIcons.alarmClock !!} About</a>
  <a href="/contact">{!! navIcons.alignHorizontal !!} Contact</a>
  <a href="/settings">{!! navIcons.alignVertical !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { airplay } from '@stacksjs/iconify-system-uicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(airplay, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-system-uicons'
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
   import { airplay, alarmClock } from '@stacksjs/iconify-system-uicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-system-uicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { airplay } from '@stacksjs/iconify-system-uicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(airplay, { size: 24 })
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
import { airplay } from '@stacksjs/iconify-system-uicons'

// Icons are typed as IconData
const myIcon: IconData = airplay
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Unlicense

See [license details](https://github.com/CoreyGinnivan/system-uicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Corey Ginnivan ([Website](https://github.com/CoreyGinnivan/system-uicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/system-uicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/system-uicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
