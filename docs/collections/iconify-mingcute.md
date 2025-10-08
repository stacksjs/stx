# MingCute Icon

> MingCute Icon icons for stx from Iconify

## Overview

This package provides access to 3098 icons from the MingCute Icon collection through the stx iconify integration.

**Collection ID:** `mingcute`
**Total Icons:** 3098
**Author:** MingCute Design ([Website](https://github.com/Richard9394/MingCute))
**License:** Apache 2.0 ([Details](https://github.com/Richard9394/MingCute/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-mingcute
```

## Quick Start

### In stx Templates

```html
@js
  import { absFill, absLine, adCircleFill } from '@stacksjs/iconify-mingcute'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    absFill: renderIcon(absFill, { size: 24 }),
    absLine: renderIcon(absLine, { size: 24, color: '#4a90e2' }),
    adCircleFill: renderIcon(adCircleFill, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.absFill !!}
  {!! icons.absLine !!}
  {!! icons.adCircleFill !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { absFill, absLine, adCircleFill } from '@stacksjs/iconify-mingcute'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(absFill, { size: 24 })

// With custom color
const coloredIcon = renderIcon(absLine, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adCircleFill, {
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

This package contains **3098** icons. Here are some examples:

- `absFill`
- `absLine`
- `adCircleFill`
- `adCircleLine`
- `adCircleOffFill`

...and 3088 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/mingcute/).

## Usage Examples

### Navigation Menu

```html
@js
  import { absFill, absLine, adCircleFill, adCircleLine } from '@stacksjs/iconify-mingcute'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    absFill: renderIcon(absFill, { size: 20, class: 'nav-icon' }),
    absLine: renderIcon(absLine, { size: 20, class: 'nav-icon' }),
    adCircleFill: renderIcon(adCircleFill, { size: 20, class: 'nav-icon' }),
    adCircleLine: renderIcon(adCircleLine, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.absFill !!} Home</a>
  <a href="/about">{!! navIcons.absLine !!} About</a>
  <a href="/contact">{!! navIcons.adCircleFill !!} Contact</a>
  <a href="/settings">{!! navIcons.adCircleLine !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { absFill } from '@stacksjs/iconify-mingcute'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(absFill, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-mingcute'
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
   import { absFill, absLine } from '@stacksjs/iconify-mingcute'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-mingcute'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { absFill } from '@stacksjs/iconify-mingcute'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(absFill, { size: 24 })
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
import { absFill } from '@stacksjs/iconify-mingcute'

// Icons are typed as IconData
const myIcon: IconData = absFill
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Richard9394/MingCute/blob/main/LICENSE) for more information.

## Credits

- **Icons**: MingCute Design ([Website](https://github.com/Richard9394/MingCute))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/mingcute/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/mingcute/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
