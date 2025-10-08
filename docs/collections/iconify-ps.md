# PrestaShop Icons

> PrestaShop Icons icons for stx from Iconify

## Overview

This package provides access to 479 icons from the PrestaShop Icons collection through the stx iconify integration.

**Collection ID:** `ps`
**Total Icons:** 479
**Author:** PrestaShop ([Website](https://github.com/PrestaShop/prestashop-icon-font))
**License:** CC BY-NC 4.0 ([Details](https://creativecommons.org/licenses/by-nc/4.0/))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ps
```

## Quick Start

### In stx Templates

```html
@js
  import { 3080, 40105, 50120 } from '@stacksjs/iconify-ps'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3080: renderIcon(3080, { size: 24 }),
    40105: renderIcon(40105, { size: 24, color: '#4a90e2' }),
    50120: renderIcon(50120, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3080 !!}
  {!! icons.40105 !!}
  {!! icons.50120 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3080, 40105, 50120 } from '@stacksjs/iconify-ps'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3080, { size: 24 })

// With custom color
const coloredIcon = renderIcon(40105, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(50120, {
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

This package contains **479** icons. Here are some examples:

- `3080`
- `40105`
- `50120`
- `60140`
- `70160`

...and 469 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ps/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3080, 40105, 50120, 60140 } from '@stacksjs/iconify-ps'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3080: renderIcon(3080, { size: 20, class: 'nav-icon' }),
    40105: renderIcon(40105, { size: 20, class: 'nav-icon' }),
    50120: renderIcon(50120, { size: 20, class: 'nav-icon' }),
    60140: renderIcon(60140, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3080 !!} Home</a>
  <a href="/about">{!! navIcons.40105 !!} About</a>
  <a href="/contact">{!! navIcons.50120 !!} Contact</a>
  <a href="/settings">{!! navIcons.60140 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3080 } from '@stacksjs/iconify-ps'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3080, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ps'
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
   import { 3080, 40105 } from '@stacksjs/iconify-ps'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ps'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3080 } from '@stacksjs/iconify-ps'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3080, { size: 24 })
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
import { 3080 } from '@stacksjs/iconify-ps'

// Icons are typed as IconData
const myIcon: IconData = 3080
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-NC 4.0

See [license details](https://creativecommons.org/licenses/by-nc/4.0/) for more information.

## Credits

- **Icons**: PrestaShop ([Website](https://github.com/PrestaShop/prestashop-icon-font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ps/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ps/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
