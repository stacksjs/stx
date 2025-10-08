# Web3 Icons

> Web3 Icons icons for stx from Iconify

## Overview

This package provides access to 1822 icons from the Web3 Icons collection through the stx iconify integration.

**Collection ID:** `token`
**Total Icons:** 1822
**Author:** 0xa3k5 ([Website](https://github.com/0xa3k5/web3icons))
**License:** MIT ([Details](https://github.com/0xa3k5/web3icons/blob/main/LICENCE))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-token
```

## Quick Start

### In stx Templates

```html
@js
  import { 0x0, 10set, 1art } from '@stacksjs/iconify-token'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    0x0: renderIcon(0x0, { size: 24 }),
    10set: renderIcon(10set, { size: 24, color: '#4a90e2' }),
    1art: renderIcon(1art, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.0x0 !!}
  {!! icons.10set !!}
  {!! icons.1art !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 0x0, 10set, 1art } from '@stacksjs/iconify-token'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(0x0, { size: 24 })

// With custom color
const coloredIcon = renderIcon(10set, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(1art, {
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

This package contains **1822** icons. Here are some examples:

- `0x0`
- `10set`
- `1art`
- `1inch`
- `2dai`

...and 1812 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/token/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 0x0, 10set, 1art, 1inch } from '@stacksjs/iconify-token'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    0x0: renderIcon(0x0, { size: 20, class: 'nav-icon' }),
    10set: renderIcon(10set, { size: 20, class: 'nav-icon' }),
    1art: renderIcon(1art, { size: 20, class: 'nav-icon' }),
    1inch: renderIcon(1inch, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.0x0 !!} Home</a>
  <a href="/about">{!! navIcons.10set !!} About</a>
  <a href="/contact">{!! navIcons.1art !!} Contact</a>
  <a href="/settings">{!! navIcons.1inch !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 0x0 } from '@stacksjs/iconify-token'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(0x0, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-token'
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
   import { 0x0, 10set } from '@stacksjs/iconify-token'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-token'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0x0 } from '@stacksjs/iconify-token'
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
import { 0x0 } from '@stacksjs/iconify-token'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/token/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/token/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
