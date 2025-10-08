# SVG Spinners

> SVG Spinners icons for stx from Iconify

## Overview

This package provides access to 46 icons from the SVG Spinners collection through the stx iconify integration.

**Collection ID:** `svg-spinners`
**Total Icons:** 46
**Author:** Utkarsh Verma ([Website](https://github.com/n3r4zzurr0/svg-spinners))
**License:** MIT ([Details](https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-svg-spinners
```

## Quick Start

### In stx Templates

```html
@js
  import { 12DotsScaleRotate, 180Ring, 180RingWithBg } from '@stacksjs/iconify-svg-spinners'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    12DotsScaleRotate: renderIcon(12DotsScaleRotate, { size: 24 }),
    180Ring: renderIcon(180Ring, { size: 24, color: '#4a90e2' }),
    180RingWithBg: renderIcon(180RingWithBg, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.12DotsScaleRotate !!}
  {!! icons.180Ring !!}
  {!! icons.180RingWithBg !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 12DotsScaleRotate, 180Ring, 180RingWithBg } from '@stacksjs/iconify-svg-spinners'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(12DotsScaleRotate, { size: 24 })

// With custom color
const coloredIcon = renderIcon(180Ring, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(180RingWithBg, {
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

This package contains **46** icons. Here are some examples:

- `12DotsScaleRotate`
- `180Ring`
- `180RingWithBg`
- `270Ring`
- `270RingWithBg`

...and 36 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/svg-spinners/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 12DotsScaleRotate, 180Ring, 180RingWithBg, 270Ring } from '@stacksjs/iconify-svg-spinners'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    12DotsScaleRotate: renderIcon(12DotsScaleRotate, { size: 20, class: 'nav-icon' }),
    180Ring: renderIcon(180Ring, { size: 20, class: 'nav-icon' }),
    180RingWithBg: renderIcon(180RingWithBg, { size: 20, class: 'nav-icon' }),
    270Ring: renderIcon(270Ring, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.12DotsScaleRotate !!} Home</a>
  <a href="/about">{!! navIcons.180Ring !!} About</a>
  <a href="/contact">{!! navIcons.180RingWithBg !!} Contact</a>
  <a href="/settings">{!! navIcons.270Ring !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 12DotsScaleRotate } from '@stacksjs/iconify-svg-spinners'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(12DotsScaleRotate, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-svg-spinners'
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
   import { 12DotsScaleRotate, 180Ring } from '@stacksjs/iconify-svg-spinners'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-svg-spinners'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 12DotsScaleRotate } from '@stacksjs/iconify-svg-spinners'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(12DotsScaleRotate, { size: 24 })
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
import { 12DotsScaleRotate } from '@stacksjs/iconify-svg-spinners'

// Icons are typed as IconData
const myIcon: IconData = 12DotsScaleRotate
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Utkarsh Verma ([Website](https://github.com/n3r4zzurr0/svg-spinners))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/svg-spinners/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/svg-spinners/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
