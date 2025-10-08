# Font Awesome 5 Regular

> Font Awesome 5 Regular icons for stx from Iconify

## Overview

This package provides access to 151 icons from the Font Awesome 5 Regular collection through the stx iconify integration.

**Collection ID:** `fa-regular`
**Total Icons:** 151
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa-regular
```

## Quick Start

### In stx Templates

```html
@js
  import { addressBook, addressCard, angry } from '@stacksjs/iconify-fa-regular'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addressBook: renderIcon(addressBook, { size: 24 }),
    addressCard: renderIcon(addressCard, { size: 24, color: '#4a90e2' }),
    angry: renderIcon(angry, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addressBook !!}
  {!! icons.addressCard !!}
  {!! icons.angry !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addressBook, addressCard, angry } from '@stacksjs/iconify-fa-regular'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addressBook, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addressCard, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(angry, {
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

This package contains **151** icons. Here are some examples:

- `addressBook`
- `addressCard`
- `angry`
- `arrowAltCircleDown`
- `arrowAltCircleLeft`

...and 141 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fa-regular/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addressBook, addressCard, angry, arrowAltCircleDown } from '@stacksjs/iconify-fa-regular'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addressBook: renderIcon(addressBook, { size: 20, class: 'nav-icon' }),
    addressCard: renderIcon(addressCard, { size: 20, class: 'nav-icon' }),
    angry: renderIcon(angry, { size: 20, class: 'nav-icon' }),
    arrowAltCircleDown: renderIcon(arrowAltCircleDown, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addressBook !!} Home</a>
  <a href="/about">{!! navIcons.addressCard !!} About</a>
  <a href="/contact">{!! navIcons.angry !!} Contact</a>
  <a href="/settings">{!! navIcons.arrowAltCircleDown !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addressBook } from '@stacksjs/iconify-fa-regular'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addressBook, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fa-regular'
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
   import { addressBook, addressCard } from '@stacksjs/iconify-fa-regular'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fa-regular'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addressBook } from '@stacksjs/iconify-fa-regular'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addressBook, { size: 24 })
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
import { addressBook } from '@stacksjs/iconify-fa-regular'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa-regular/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa-regular/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
