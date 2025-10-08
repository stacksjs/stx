# Humbleicons

> Humbleicons icons for stx from Iconify

## Overview

This package provides access to 269 icons from the Humbleicons collection through the stx iconify integration.

**Collection ID:** `humbleicons`
**Total Icons:** 269
**Author:** Jiří Zralý ([Website](https://github.com/zraly/humbleicons))
**License:** MIT ([Details](https://github.com/zraly/humbleicons/blob/master/license))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-humbleicons
```

## Quick Start

### In stx Templates

```html
@js
  import { activity, adjustments, ai } from '@stacksjs/iconify-humbleicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    activity: renderIcon(activity, { size: 24 }),
    adjustments: renderIcon(adjustments, { size: 24, color: '#4a90e2' }),
    ai: renderIcon(ai, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.activity !!}
  {!! icons.adjustments !!}
  {!! icons.ai !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { activity, adjustments, ai } from '@stacksjs/iconify-humbleicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(activity, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adjustments, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(ai, {
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

This package contains **269** icons. Here are some examples:

- `activity`
- `adjustments`
- `ai`
- `aid`
- `alignObjectsBottom`

...and 259 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/humbleicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { activity, adjustments, ai, aid } from '@stacksjs/iconify-humbleicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    activity: renderIcon(activity, { size: 20, class: 'nav-icon' }),
    adjustments: renderIcon(adjustments, { size: 20, class: 'nav-icon' }),
    ai: renderIcon(ai, { size: 20, class: 'nav-icon' }),
    aid: renderIcon(aid, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.activity !!} Home</a>
  <a href="/about">{!! navIcons.adjustments !!} About</a>
  <a href="/contact">{!! navIcons.ai !!} Contact</a>
  <a href="/settings">{!! navIcons.aid !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { activity } from '@stacksjs/iconify-humbleicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(activity, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-humbleicons'
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
   import { activity, adjustments } from '@stacksjs/iconify-humbleicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-humbleicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { activity } from '@stacksjs/iconify-humbleicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(activity, { size: 24 })
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
import { activity } from '@stacksjs/iconify-humbleicons'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/zraly/humbleicons/blob/master/license) for more information.

## Credits

- **Icons**: Jiří Zralý ([Website](https://github.com/zraly/humbleicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/humbleicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/humbleicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
