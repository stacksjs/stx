# Streamline color

> Streamline color icons for stx from Iconify

## Overview

This package provides access to 2000 icons from the Streamline color collection through the stx iconify integration.

**Collection ID:** `streamline-color`
**Total Icons:** 2000
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-color
```

## Quick Start

### In stx Templates

```html
@js
  import { add1, add1Flat, addBellNotification } from '@stacksjs/iconify-streamline-color'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    add1: renderIcon(add1, { size: 24 }),
    add1Flat: renderIcon(add1Flat, { size: 24, color: '#4a90e2' }),
    addBellNotification: renderIcon(addBellNotification, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.add1 !!}
  {!! icons.add1Flat !!}
  {!! icons.addBellNotification !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { add1, add1Flat, addBellNotification } from '@stacksjs/iconify-streamline-color'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(add1, { size: 24 })

// With custom color
const coloredIcon = renderIcon(add1Flat, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addBellNotification, {
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

This package contains **2000** icons. Here are some examples:

- `add1`
- `add1Flat`
- `addBellNotification`
- `addBellNotificationFlat`
- `addCircle`

...and 1990 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-color/).

## Usage Examples

### Navigation Menu

```html
@js
  import { add1, add1Flat, addBellNotification, addBellNotificationFlat } from '@stacksjs/iconify-streamline-color'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    add1: renderIcon(add1, { size: 20, class: 'nav-icon' }),
    add1Flat: renderIcon(add1Flat, { size: 20, class: 'nav-icon' }),
    addBellNotification: renderIcon(addBellNotification, { size: 20, class: 'nav-icon' }),
    addBellNotificationFlat: renderIcon(addBellNotificationFlat, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.add1 !!} Home</a>
  <a href="/about">{!! navIcons.add1Flat !!} About</a>
  <a href="/contact">{!! navIcons.addBellNotification !!} Contact</a>
  <a href="/settings">{!! navIcons.addBellNotificationFlat !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { add1 } from '@stacksjs/iconify-streamline-color'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(add1, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-color'
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
   import { add1, add1Flat } from '@stacksjs/iconify-streamline-color'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-color'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { add1 } from '@stacksjs/iconify-streamline-color'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(add1, { size: 24 })
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
import { add1 } from '@stacksjs/iconify-streamline-color'

// Icons are typed as IconData
const myIcon: IconData = add1
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
