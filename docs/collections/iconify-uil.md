# Unicons

> Unicons icons for stx from Iconify

## Overview

This package provides access to 1216 icons from the Unicons collection through the stx iconify integration.

**Collection ID:** `uil`
**Total Icons:** 1216
**Author:** Iconscout ([Website](https://github.com/Iconscout/unicons))
**License:** Apache 2.0 ([Details](https://github.com/Iconscout/unicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-uil
```

## Quick Start

### In stx Templates

```html
@js
  import { 0Plus, 10Plus, 12Plus } from '@stacksjs/iconify-uil'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    0Plus: renderIcon(0Plus, { size: 24 }),
    10Plus: renderIcon(10Plus, { size: 24, color: '#4a90e2' }),
    12Plus: renderIcon(12Plus, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.0Plus !!}
  {!! icons.10Plus !!}
  {!! icons.12Plus !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 0Plus, 10Plus, 12Plus } from '@stacksjs/iconify-uil'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(0Plus, { size: 24 })

// With custom color
const coloredIcon = renderIcon(10Plus, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(12Plus, {
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

This package contains **1216** icons. Here are some examples:

- `0Plus`
- `10Plus`
- `12Plus`
- `13Plus`
- `16Plus`

...and 1206 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/uil/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 0Plus, 10Plus, 12Plus, 13Plus } from '@stacksjs/iconify-uil'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    0Plus: renderIcon(0Plus, { size: 20, class: 'nav-icon' }),
    10Plus: renderIcon(10Plus, { size: 20, class: 'nav-icon' }),
    12Plus: renderIcon(12Plus, { size: 20, class: 'nav-icon' }),
    13Plus: renderIcon(13Plus, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.0Plus !!} Home</a>
  <a href="/about">{!! navIcons.10Plus !!} About</a>
  <a href="/contact">{!! navIcons.12Plus !!} Contact</a>
  <a href="/settings">{!! navIcons.13Plus !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 0Plus } from '@stacksjs/iconify-uil'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(0Plus, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-uil'
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
   import { 0Plus, 10Plus } from '@stacksjs/iconify-uil'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-uil'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0Plus } from '@stacksjs/iconify-uil'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(0Plus, { size: 24 })
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
import { 0Plus } from '@stacksjs/iconify-uil'

// Icons are typed as IconData
const myIcon: IconData = 0Plus
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Iconscout/unicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Iconscout ([Website](https://github.com/Iconscout/unicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/uil/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/uil/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
