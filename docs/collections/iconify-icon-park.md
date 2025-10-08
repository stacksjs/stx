# IconPark

> IconPark icons for stx from Iconify

## Overview

This package provides access to 2658 icons from the IconPark collection through the stx iconify integration.

**Collection ID:** `icon-park`
**Total Icons:** 2658
**Author:** ByteDance ([Website](https://github.com/bytedance/IconPark))
**License:** Apache 2.0 ([Details](https://github.com/bytedance/IconPark/blob/master/LICENSE))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-icon-park
```

## Quick Start

### In stx Templates

```html
@js
  import { aCane, abdominal, abnormal } from '@stacksjs/iconify-icon-park'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aCane: renderIcon(aCane, { size: 24 }),
    abdominal: renderIcon(abdominal, { size: 24, color: '#4a90e2' }),
    abnormal: renderIcon(abnormal, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aCane !!}
  {!! icons.abdominal !!}
  {!! icons.abnormal !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aCane, abdominal, abnormal } from '@stacksjs/iconify-icon-park'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aCane, { size: 24 })

// With custom color
const coloredIcon = renderIcon(abdominal, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(abnormal, {
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

This package contains **2658** icons. Here are some examples:

- `aCane`
- `abdominal`
- `abnormal`
- `acceleration`
- `acceptEmail`

...and 2648 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/icon-park/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aCane, abdominal, abnormal, acceleration } from '@stacksjs/iconify-icon-park'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aCane: renderIcon(aCane, { size: 20, class: 'nav-icon' }),
    abdominal: renderIcon(abdominal, { size: 20, class: 'nav-icon' }),
    abnormal: renderIcon(abnormal, { size: 20, class: 'nav-icon' }),
    acceleration: renderIcon(acceleration, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aCane !!} Home</a>
  <a href="/about">{!! navIcons.abdominal !!} About</a>
  <a href="/contact">{!! navIcons.abnormal !!} Contact</a>
  <a href="/settings">{!! navIcons.acceleration !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aCane } from '@stacksjs/iconify-icon-park'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aCane, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-icon-park'
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
   import { aCane, abdominal } from '@stacksjs/iconify-icon-park'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-icon-park'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aCane } from '@stacksjs/iconify-icon-park'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(aCane, { size: 24 })
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
import { aCane } from '@stacksjs/iconify-icon-park'

// Icons are typed as IconData
const myIcon: IconData = aCane
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/bytedance/IconPark/blob/master/LICENSE) for more information.

## Credits

- **Icons**: ByteDance ([Website](https://github.com/bytedance/IconPark))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/icon-park/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/icon-park/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
