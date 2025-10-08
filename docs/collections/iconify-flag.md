# Flag Icons

> Flag Icons icons for stx from Iconify

## Overview

This package provides access to 542 icons from the Flag Icons collection through the stx iconify integration.

**Collection ID:** `flag`
**Total Icons:** 542
**Author:** Panayiotis Lipiridis ([Website](https://github.com/lipis/flag-icons))
**License:** MIT ([Details](https://github.com/lipis/flag-icons/blob/main/LICENSE))
**Category:** Flags / Maps
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flag
```

## Quick Start

### In stx Templates

```html
@js
  import { ad1x1, ad4x3, ae1x1 } from '@stacksjs/iconify-flag'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    ad1x1: renderIcon(ad1x1, { size: 24 }),
    ad4x3: renderIcon(ad4x3, { size: 24, color: '#4a90e2' }),
    ae1x1: renderIcon(ae1x1, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.ad1x1 !!}
  {!! icons.ad4x3 !!}
  {!! icons.ae1x1 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { ad1x1, ad4x3, ae1x1 } from '@stacksjs/iconify-flag'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(ad1x1, { size: 24 })

// With custom color
const coloredIcon = renderIcon(ad4x3, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(ae1x1, {
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

This package contains **542** icons. Here are some examples:

- `ad1x1`
- `ad4x3`
- `ae1x1`
- `ae4x3`
- `af1x1`

...and 532 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/flag/).

## Usage Examples

### Navigation Menu

```html
@js
  import { ad1x1, ad4x3, ae1x1, ae4x3 } from '@stacksjs/iconify-flag'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    ad1x1: renderIcon(ad1x1, { size: 20, class: 'nav-icon' }),
    ad4x3: renderIcon(ad4x3, { size: 20, class: 'nav-icon' }),
    ae1x1: renderIcon(ae1x1, { size: 20, class: 'nav-icon' }),
    ae4x3: renderIcon(ae4x3, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.ad1x1 !!} Home</a>
  <a href="/about">{!! navIcons.ad4x3 !!} About</a>
  <a href="/contact">{!! navIcons.ae1x1 !!} Contact</a>
  <a href="/settings">{!! navIcons.ae4x3 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { ad1x1 } from '@stacksjs/iconify-flag'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(ad1x1, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-flag'
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
   import { ad1x1, ad4x3 } from '@stacksjs/iconify-flag'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-flag'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ad1x1 } from '@stacksjs/iconify-flag'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(ad1x1, { size: 24 })
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
import { ad1x1 } from '@stacksjs/iconify-flag'

// Icons are typed as IconData
const myIcon: IconData = ad1x1
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/lipis/flag-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Panayiotis Lipiridis ([Website](https://github.com/lipis/flag-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flag/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flag/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
