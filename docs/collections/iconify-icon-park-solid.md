# IconPark Solid

> IconPark Solid icons for stx from Iconify

## Overview

This package provides access to 1970 icons from the IconPark Solid collection through the stx iconify integration.

**Collection ID:** `icon-park-solid`
**Total Icons:** 1970
**Author:** ByteDance ([Website](https://github.com/bytedance/IconPark))
**License:** Apache 2.0 ([Details](https://github.com/bytedance/IconPark/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-icon-park-solid
```

## Quick Start

### In stx Templates

```html
@js
  import { aCane, abnormal, acceleration } from '@stacksjs/iconify-icon-park-solid'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aCane: renderIcon(aCane, { size: 24 }),
    abnormal: renderIcon(abnormal, { size: 24, color: '#4a90e2' }),
    acceleration: renderIcon(acceleration, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aCane !!}
  {!! icons.abnormal !!}
  {!! icons.acceleration !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aCane, abnormal, acceleration } from '@stacksjs/iconify-icon-park-solid'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aCane, { size: 24 })

// With custom color
const coloredIcon = renderIcon(abnormal, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(acceleration, {
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

This package contains **1970** icons. Here are some examples:

- `aCane`
- `abnormal`
- `acceleration`
- `activitySource`
- `ad`

...and 1960 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/icon-park-solid/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aCane, abnormal, acceleration, activitySource } from '@stacksjs/iconify-icon-park-solid'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aCane: renderIcon(aCane, { size: 20, class: 'nav-icon' }),
    abnormal: renderIcon(abnormal, { size: 20, class: 'nav-icon' }),
    acceleration: renderIcon(acceleration, { size: 20, class: 'nav-icon' }),
    activitySource: renderIcon(activitySource, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aCane !!} Home</a>
  <a href="/about">{!! navIcons.abnormal !!} About</a>
  <a href="/contact">{!! navIcons.acceleration !!} Contact</a>
  <a href="/settings">{!! navIcons.activitySource !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aCane } from '@stacksjs/iconify-icon-park-solid'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aCane, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-icon-park-solid'
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
   import { aCane, abnormal } from '@stacksjs/iconify-icon-park-solid'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-icon-park-solid'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aCane } from '@stacksjs/iconify-icon-park-solid'
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
import { aCane } from '@stacksjs/iconify-icon-park-solid'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/icon-park-solid/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/icon-park-solid/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
