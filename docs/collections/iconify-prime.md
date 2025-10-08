# Prime Icons

> Prime Icons icons for stx from Iconify

## Overview

This package provides access to 313 icons from the Prime Icons collection through the stx iconify integration.

**Collection ID:** `prime`
**Total Icons:** 313
**Author:** PrimeTek ([Website](https://github.com/primefaces/primeicons))
**License:** MIT ([Details](https://github.com/primefaces/primeicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-prime
```

## Quick Start

### In stx Templates

```html
@js
  import { addressBook, alignCenter, alignJustify } from '@stacksjs/iconify-prime'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addressBook: renderIcon(addressBook, { size: 24 }),
    alignCenter: renderIcon(alignCenter, { size: 24, color: '#4a90e2' }),
    alignJustify: renderIcon(alignJustify, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addressBook !!}
  {!! icons.alignCenter !!}
  {!! icons.alignJustify !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addressBook, alignCenter, alignJustify } from '@stacksjs/iconify-prime'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addressBook, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alignCenter, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alignJustify, {
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

This package contains **313** icons. Here are some examples:

- `addressBook`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`

...and 303 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/prime/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addressBook, alignCenter, alignJustify, alignLeft } from '@stacksjs/iconify-prime'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addressBook: renderIcon(addressBook, { size: 20, class: 'nav-icon' }),
    alignCenter: renderIcon(alignCenter, { size: 20, class: 'nav-icon' }),
    alignJustify: renderIcon(alignJustify, { size: 20, class: 'nav-icon' }),
    alignLeft: renderIcon(alignLeft, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addressBook !!} Home</a>
  <a href="/about">{!! navIcons.alignCenter !!} About</a>
  <a href="/contact">{!! navIcons.alignJustify !!} Contact</a>
  <a href="/settings">{!! navIcons.alignLeft !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addressBook } from '@stacksjs/iconify-prime'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addressBook, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-prime'
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
   import { addressBook, alignCenter } from '@stacksjs/iconify-prime'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-prime'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addressBook } from '@stacksjs/iconify-prime'
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
import { addressBook } from '@stacksjs/iconify-prime'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/primefaces/primeicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: PrimeTek ([Website](https://github.com/primefaces/primeicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/prime/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/prime/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
