# IconPark TwoTone

> IconPark TwoTone icons for stx from Iconify

## Overview

This package provides access to 1947 icons from the IconPark TwoTone collection through the stx iconify integration.

**Collection ID:** `icon-park-twotone`
**Total Icons:** 1947
**Author:** ByteDance ([Website](https://github.com/bytedance/IconPark))
**License:** Apache 2.0 ([Details](https://github.com/bytedance/IconPark/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-icon-park-twotone
```

## Quick Start

### In stx Templates

```html
@js
  import { abnormal, acceleration, activitySource } from '@stacksjs/iconify-icon-park-twotone'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    abnormal: renderIcon(abnormal, { size: 24 }),
    acceleration: renderIcon(acceleration, { size: 24, color: '#4a90e2' }),
    activitySource: renderIcon(activitySource, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.abnormal !!}
  {!! icons.acceleration !!}
  {!! icons.activitySource !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { abnormal, acceleration, activitySource } from '@stacksjs/iconify-icon-park-twotone'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(abnormal, { size: 24 })

// With custom color
const coloredIcon = renderIcon(acceleration, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(activitySource, {
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

This package contains **1947** icons. Here are some examples:

- `abnormal`
- `acceleration`
- `activitySource`
- `ad`
- `add`

...and 1937 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/icon-park-twotone/).

## Usage Examples

### Navigation Menu

```html
@js
  import { abnormal, acceleration, activitySource, ad } from '@stacksjs/iconify-icon-park-twotone'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    abnormal: renderIcon(abnormal, { size: 20, class: 'nav-icon' }),
    acceleration: renderIcon(acceleration, { size: 20, class: 'nav-icon' }),
    activitySource: renderIcon(activitySource, { size: 20, class: 'nav-icon' }),
    ad: renderIcon(ad, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.abnormal !!} Home</a>
  <a href="/about">{!! navIcons.acceleration !!} About</a>
  <a href="/contact">{!! navIcons.activitySource !!} Contact</a>
  <a href="/settings">{!! navIcons.ad !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { abnormal } from '@stacksjs/iconify-icon-park-twotone'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(abnormal, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-icon-park-twotone'
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
   import { abnormal, acceleration } from '@stacksjs/iconify-icon-park-twotone'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-icon-park-twotone'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { abnormal } from '@stacksjs/iconify-icon-park-twotone'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(abnormal, { size: 24 })
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
import { abnormal } from '@stacksjs/iconify-icon-park-twotone'

// Icons are typed as IconData
const myIcon: IconData = abnormal
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/icon-park-twotone/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/icon-park-twotone/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
