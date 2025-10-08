# Web3 Icons Branded

> Web3 Icons Branded icons for stx from Iconify

## Overview

This package provides access to 2085 icons from the Web3 Icons Branded collection through the stx iconify integration.

**Collection ID:** `token-branded`
**Total Icons:** 2085
**Author:** 0xa3k5 ([Website](https://github.com/0xa3k5/web3icons))
**License:** MIT ([Details](https://github.com/0xa3k5/web3icons/blob/main/LICENCE))
**Category:** Logos
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-token-branded
```

## Quick Start

### In stx Templates

```html
@js
  import { 0x0, 0xgas, 10set } from '@stacksjs/iconify-token-branded'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    0x0: renderIcon(0x0, { size: 24 }),
    0xgas: renderIcon(0xgas, { size: 24, color: '#4a90e2' }),
    10set: renderIcon(10set, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.0x0 !!}
  {!! icons.0xgas !!}
  {!! icons.10set !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 0x0, 0xgas, 10set } from '@stacksjs/iconify-token-branded'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(0x0, { size: 24 })

// With custom color
const coloredIcon = renderIcon(0xgas, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(10set, {
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

This package contains **2085** icons. Here are some examples:

- `0x0`
- `0xgas`
- `10set`
- `1art`
- `1inch`

...and 2075 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/token-branded/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 0x0, 0xgas, 10set, 1art } from '@stacksjs/iconify-token-branded'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    0x0: renderIcon(0x0, { size: 20, class: 'nav-icon' }),
    0xgas: renderIcon(0xgas, { size: 20, class: 'nav-icon' }),
    10set: renderIcon(10set, { size: 20, class: 'nav-icon' }),
    1art: renderIcon(1art, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.0x0 !!} Home</a>
  <a href="/about">{!! navIcons.0xgas !!} About</a>
  <a href="/contact">{!! navIcons.10set !!} Contact</a>
  <a href="/settings">{!! navIcons.1art !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 0x0 } from '@stacksjs/iconify-token-branded'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(0x0, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-token-branded'
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
   import { 0x0, 0xgas } from '@stacksjs/iconify-token-branded'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-token-branded'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0x0 } from '@stacksjs/iconify-token-branded'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(0x0, { size: 24 })
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
import { 0x0 } from '@stacksjs/iconify-token-branded'

// Icons are typed as IconData
const myIcon: IconData = 0x0
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/0xa3k5/web3icons/blob/main/LICENCE) for more information.

## Credits

- **Icons**: 0xa3k5 ([Website](https://github.com/0xa3k5/web3icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/token-branded/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/token-branded/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
