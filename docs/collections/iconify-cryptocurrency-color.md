# Cryptocurrency Color Icons

> Cryptocurrency Color Icons icons for stx from Iconify

## Overview

This package provides access to 483 icons from the Cryptocurrency Color Icons collection through the stx iconify integration.

**Collection ID:** `cryptocurrency-color`
**Total Icons:** 483
**Author:** Christopher Downer ([Website](https://github.com/atomiclabs/cryptocurrency-icons))
**License:** CC0 1.0 ([Details](https://creativecommons.org/publicdomain/zero/1.0/))
**Category:** Logos
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-cryptocurrency-color
```

## Quick Start

### In stx Templates

```html
@js
  import { 0xbtc, 1inch, 2give } from '@stacksjs/iconify-cryptocurrency-color'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    0xbtc: renderIcon(0xbtc, { size: 24 }),
    1inch: renderIcon(1inch, { size: 24, color: '#4a90e2' }),
    2give: renderIcon(2give, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.0xbtc !!}
  {!! icons.1inch !!}
  {!! icons.2give !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 0xbtc, 1inch, 2give } from '@stacksjs/iconify-cryptocurrency-color'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(0xbtc, { size: 24 })

// With custom color
const coloredIcon = renderIcon(1inch, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(2give, {
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

This package contains **483** icons. Here are some examples:

- `0xbtc`
- `1inch`
- `2give`
- `aave`
- `abt`

...and 473 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/cryptocurrency-color/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 0xbtc, 1inch, 2give, aave } from '@stacksjs/iconify-cryptocurrency-color'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    0xbtc: renderIcon(0xbtc, { size: 20, class: 'nav-icon' }),
    1inch: renderIcon(1inch, { size: 20, class: 'nav-icon' }),
    2give: renderIcon(2give, { size: 20, class: 'nav-icon' }),
    aave: renderIcon(aave, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.0xbtc !!} Home</a>
  <a href="/about">{!! navIcons.1inch !!} About</a>
  <a href="/contact">{!! navIcons.2give !!} Contact</a>
  <a href="/settings">{!! navIcons.aave !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 0xbtc } from '@stacksjs/iconify-cryptocurrency-color'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(0xbtc, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-cryptocurrency-color'
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
   import { 0xbtc, 1inch } from '@stacksjs/iconify-cryptocurrency-color'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-cryptocurrency-color'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0xbtc } from '@stacksjs/iconify-cryptocurrency-color'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(0xbtc, { size: 24 })
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
import { 0xbtc } from '@stacksjs/iconify-cryptocurrency-color'

// Icons are typed as IconData
const myIcon: IconData = 0xbtc
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0 1.0

See [license details](https://creativecommons.org/publicdomain/zero/1.0/) for more information.

## Credits

- **Icons**: Christopher Downer ([Website](https://github.com/atomiclabs/cryptocurrency-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cryptocurrency-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cryptocurrency-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
