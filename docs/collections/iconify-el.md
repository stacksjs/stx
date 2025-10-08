# Elusive Icons

> Elusive Icons icons for stx from Iconify

## Overview

This package provides access to 304 icons from the Elusive Icons collection through the stx iconify integration.

**Collection ID:** `el`
**Total Icons:** 304
**Author:** Team Redux ([Website](https://github.com/dovy/elusive-icons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-el
```

## Quick Start

### In stx Templates

```html
@js
  import { addressBook, addressBookAlt, adjust } from '@stacksjs/iconify-el'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addressBook: renderIcon(addressBook, { size: 24 }),
    addressBookAlt: renderIcon(addressBookAlt, { size: 24, color: '#4a90e2' }),
    adjust: renderIcon(adjust, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addressBook !!}
  {!! icons.addressBookAlt !!}
  {!! icons.adjust !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addressBook, addressBookAlt, adjust } from '@stacksjs/iconify-el'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addressBook, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addressBookAlt, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adjust, {
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

This package contains **304** icons. Here are some examples:

- `addressBook`
- `addressBookAlt`
- `adjust`
- `adjustAlt`
- `adult`

...and 294 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/el/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addressBook, addressBookAlt, adjust, adjustAlt } from '@stacksjs/iconify-el'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addressBook: renderIcon(addressBook, { size: 20, class: 'nav-icon' }),
    addressBookAlt: renderIcon(addressBookAlt, { size: 20, class: 'nav-icon' }),
    adjust: renderIcon(adjust, { size: 20, class: 'nav-icon' }),
    adjustAlt: renderIcon(adjustAlt, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addressBook !!} Home</a>
  <a href="/about">{!! navIcons.addressBookAlt !!} About</a>
  <a href="/contact">{!! navIcons.adjust !!} Contact</a>
  <a href="/settings">{!! navIcons.adjustAlt !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addressBook } from '@stacksjs/iconify-el'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addressBook, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-el'
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
   import { addressBook, addressBookAlt } from '@stacksjs/iconify-el'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-el'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addressBook } from '@stacksjs/iconify-el'
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
import { addressBook } from '@stacksjs/iconify-el'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Team Redux ([Website](https://github.com/dovy/elusive-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/el/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/el/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
