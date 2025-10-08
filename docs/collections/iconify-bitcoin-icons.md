# Bitcoin Icons

> Bitcoin Icons icons for stx from Iconify

## Overview

This package provides access to 250 icons from the Bitcoin Icons collection through the stx iconify integration.

**Collection ID:** `bitcoin-icons`
**Total Icons:** 250
**Author:** Bitcoin Design Community ([Website](https://github.com/BitcoinDesign/Bitcoin-Icons))
**License:** MIT ([Details](https://github.com/BitcoinDesign/Bitcoin-Icons/blob/main/LICENSE-MIT))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bitcoin-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { addressBookFilled, addressBookOutline, alertCircleFilled } from '@stacksjs/iconify-bitcoin-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addressBookFilled: renderIcon(addressBookFilled, { size: 24 }),
    addressBookOutline: renderIcon(addressBookOutline, { size: 24, color: '#4a90e2' }),
    alertCircleFilled: renderIcon(alertCircleFilled, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addressBookFilled !!}
  {!! icons.addressBookOutline !!}
  {!! icons.alertCircleFilled !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addressBookFilled, addressBookOutline, alertCircleFilled } from '@stacksjs/iconify-bitcoin-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addressBookFilled, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addressBookOutline, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alertCircleFilled, {
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

This package contains **250** icons. Here are some examples:

- `addressBookFilled`
- `addressBookOutline`
- `alertCircleFilled`
- `alertCircleOutline`
- `alertFilled`

...and 240 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/bitcoin-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addressBookFilled, addressBookOutline, alertCircleFilled, alertCircleOutline } from '@stacksjs/iconify-bitcoin-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addressBookFilled: renderIcon(addressBookFilled, { size: 20, class: 'nav-icon' }),
    addressBookOutline: renderIcon(addressBookOutline, { size: 20, class: 'nav-icon' }),
    alertCircleFilled: renderIcon(alertCircleFilled, { size: 20, class: 'nav-icon' }),
    alertCircleOutline: renderIcon(alertCircleOutline, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addressBookFilled !!} Home</a>
  <a href="/about">{!! navIcons.addressBookOutline !!} About</a>
  <a href="/contact">{!! navIcons.alertCircleFilled !!} Contact</a>
  <a href="/settings">{!! navIcons.alertCircleOutline !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addressBookFilled } from '@stacksjs/iconify-bitcoin-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addressBookFilled, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-bitcoin-icons'
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
   import { addressBookFilled, addressBookOutline } from '@stacksjs/iconify-bitcoin-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-bitcoin-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addressBookFilled } from '@stacksjs/iconify-bitcoin-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addressBookFilled, { size: 24 })
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
import { addressBookFilled } from '@stacksjs/iconify-bitcoin-icons'

// Icons are typed as IconData
const myIcon: IconData = addressBookFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/BitcoinDesign/Bitcoin-Icons/blob/main/LICENSE-MIT) for more information.

## Credits

- **Icons**: Bitcoin Design Community ([Website](https://github.com/BitcoinDesign/Bitcoin-Icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bitcoin-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bitcoin-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
