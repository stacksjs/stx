# SVG Logos

> SVG Logos icons for stx from Iconify

## Overview

This package provides access to 2063 icons from the SVG Logos collection through the stx iconify integration.

**Collection ID:** `logos`
**Total Icons:** 2063
**Author:** Gil Barbara ([Website](https://github.com/gilbarbara/logos))
**License:** CC0 ([Details](https://raw.githubusercontent.com/gilbarbara/logos/master/LICENSE.txt))
**Category:** Logos
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-logos
```

## Quick Start

### In stx Templates

```html
@js
  import { 100tb, 500px, 6px } from '@stacksjs/iconify-logos'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    100tb: renderIcon(100tb, { size: 24 }),
    500px: renderIcon(500px, { size: 24, color: '#4a90e2' }),
    6px: renderIcon(6px, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.100tb !!}
  {!! icons.500px !!}
  {!! icons.6px !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 100tb, 500px, 6px } from '@stacksjs/iconify-logos'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(100tb, { size: 24 })

// With custom color
const coloredIcon = renderIcon(500px, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(6px, {
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

This package contains **2063** icons. Here are some examples:

- `100tb`
- `500px`
- `6px`
- `activeCampaign`
- `activeCampaignIcon`

...and 2053 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/logos/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 100tb, 500px, 6px, activeCampaign } from '@stacksjs/iconify-logos'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    100tb: renderIcon(100tb, { size: 20, class: 'nav-icon' }),
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    6px: renderIcon(6px, { size: 20, class: 'nav-icon' }),
    activeCampaign: renderIcon(activeCampaign, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.100tb !!} Home</a>
  <a href="/about">{!! navIcons.500px !!} About</a>
  <a href="/contact">{!! navIcons.6px !!} Contact</a>
  <a href="/settings">{!! navIcons.activeCampaign !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 100tb } from '@stacksjs/iconify-logos'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(100tb, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-logos'
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
   import { 100tb, 500px } from '@stacksjs/iconify-logos'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-logos'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 100tb } from '@stacksjs/iconify-logos'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(100tb, { size: 24 })
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
import { 100tb } from '@stacksjs/iconify-logos'

// Icons are typed as IconData
const myIcon: IconData = 100tb
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0

See [license details](https://raw.githubusercontent.com/gilbarbara/logos/master/LICENSE.txt) for more information.

## Credits

- **Icons**: Gil Barbara ([Website](https://github.com/gilbarbara/logos))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/logos/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/logos/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
