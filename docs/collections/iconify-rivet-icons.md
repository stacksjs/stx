# Rivet Icons

> Rivet Icons icons for stx from Iconify

## Overview

This package provides access to 210 icons from the Rivet Icons collection through the stx iconify integration.

**Collection ID:** `rivet-icons`
**Total Icons:** 210
**Author:** Indiana University ([Website](https://github.com/indiana-university/rivet-icons))
**License:** BSD 3-Clause ([Details](https://github.com/indiana-university/rivet-icons/blob/develop/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-rivet-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { alarm, alarmSolid, arrowAnchorDownLeft } from '@stacksjs/iconify-rivet-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    alarm: renderIcon(alarm, { size: 24 }),
    alarmSolid: renderIcon(alarmSolid, { size: 24, color: '#4a90e2' }),
    arrowAnchorDownLeft: renderIcon(arrowAnchorDownLeft, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.alarm !!}
  {!! icons.alarmSolid !!}
  {!! icons.arrowAnchorDownLeft !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { alarm, alarmSolid, arrowAnchorDownLeft } from '@stacksjs/iconify-rivet-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(alarm, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alarmSolid, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(arrowAnchorDownLeft, {
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

This package contains **210** icons. Here are some examples:

- `alarm`
- `alarmSolid`
- `arrowAnchorDownLeft`
- `arrowAnchorDownRight`
- `arrowAnchorUpLeft`

...and 200 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/rivet-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { alarm, alarmSolid, arrowAnchorDownLeft, arrowAnchorDownRight } from '@stacksjs/iconify-rivet-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    alarm: renderIcon(alarm, { size: 20, class: 'nav-icon' }),
    alarmSolid: renderIcon(alarmSolid, { size: 20, class: 'nav-icon' }),
    arrowAnchorDownLeft: renderIcon(arrowAnchorDownLeft, { size: 20, class: 'nav-icon' }),
    arrowAnchorDownRight: renderIcon(arrowAnchorDownRight, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.alarm !!} Home</a>
  <a href="/about">{!! navIcons.alarmSolid !!} About</a>
  <a href="/contact">{!! navIcons.arrowAnchorDownLeft !!} Contact</a>
  <a href="/settings">{!! navIcons.arrowAnchorDownRight !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { alarm } from '@stacksjs/iconify-rivet-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(alarm, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-rivet-icons'
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
   import { alarm, alarmSolid } from '@stacksjs/iconify-rivet-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-rivet-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { alarm } from '@stacksjs/iconify-rivet-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(alarm, { size: 24 })
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
import { alarm } from '@stacksjs/iconify-rivet-icons'

// Icons are typed as IconData
const myIcon: IconData = alarm
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

BSD 3-Clause

See [license details](https://github.com/indiana-university/rivet-icons/blob/develop/LICENSE) for more information.

## Credits

- **Icons**: Indiana University ([Website](https://github.com/indiana-university/rivet-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/rivet-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/rivet-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
