# Flagpack

> Flagpack icons for stx from Iconify

## Overview

This package provides access to 256 icons from the Flagpack collection through the stx iconify integration.

**Collection ID:** `flagpack`
**Total Icons:** 256
**Author:** Yummygum ([Website](https://github.com/Yummygum/flagpack-core))
**License:** MIT ([Details](https://github.com/Yummygum/flagpack-core/blob/main/LICENSE))
**Category:** Flags / Maps
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flagpack
```

## Quick Start

### In stx Templates

```html
@js
  import { ad, ae, af } from '@stacksjs/iconify-flagpack'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    ad: renderIcon(ad, { size: 24 }),
    ae: renderIcon(ae, { size: 24, color: '#4a90e2' }),
    af: renderIcon(af, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.ad !!}
  {!! icons.ae !!}
  {!! icons.af !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { ad, ae, af } from '@stacksjs/iconify-flagpack'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(ad, { size: 24 })

// With custom color
const coloredIcon = renderIcon(ae, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(af, {
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

This package contains **256** icons. Here are some examples:

- `ad`
- `ae`
- `af`
- `ag`
- `ai`

...and 246 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/flagpack/).

## Usage Examples

### Navigation Menu

```html
@js
  import { ad, ae, af, ag } from '@stacksjs/iconify-flagpack'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    ad: renderIcon(ad, { size: 20, class: 'nav-icon' }),
    ae: renderIcon(ae, { size: 20, class: 'nav-icon' }),
    af: renderIcon(af, { size: 20, class: 'nav-icon' }),
    ag: renderIcon(ag, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.ad !!} Home</a>
  <a href="/about">{!! navIcons.ae !!} About</a>
  <a href="/contact">{!! navIcons.af !!} Contact</a>
  <a href="/settings">{!! navIcons.ag !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { ad } from '@stacksjs/iconify-flagpack'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(ad, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-flagpack'
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
   import { ad, ae } from '@stacksjs/iconify-flagpack'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-flagpack'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ad } from '@stacksjs/iconify-flagpack'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(ad, { size: 24 })
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
import { ad } from '@stacksjs/iconify-flagpack'

// Icons are typed as IconData
const myIcon: IconData = ad
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/Yummygum/flagpack-core/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Yummygum ([Website](https://github.com/Yummygum/flagpack-core))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flagpack/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flagpack/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
