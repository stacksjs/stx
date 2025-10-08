# Nonicons

> Nonicons icons for stx from Iconify

## Overview

This package provides access to 69 icons from the Nonicons collection through the stx iconify integration.

**Collection ID:** `nonicons`
**Total Icons:** 69
**Author:** yamatsum ([Website](https://github.com/yamatsum/nonicons))
**License:** MIT ([Details](https://github.com/yamatsum/nonicons/blob/master/LICENSE))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-nonicons
```

## Quick Start

### In stx Templates

```html
@js
  import { angular16, babel16, biome16 } from '@stacksjs/iconify-nonicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    angular16: renderIcon(angular16, { size: 24 }),
    babel16: renderIcon(babel16, { size: 24, color: '#4a90e2' }),
    biome16: renderIcon(biome16, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.angular16 !!}
  {!! icons.babel16 !!}
  {!! icons.biome16 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { angular16, babel16, biome16 } from '@stacksjs/iconify-nonicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(angular16, { size: 24 })

// With custom color
const coloredIcon = renderIcon(babel16, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(biome16, {
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

This package contains **69** icons. Here are some examples:

- `angular16`
- `babel16`
- `biome16`
- `c16`
- `cPlusplus16`

...and 59 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/nonicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { angular16, babel16, biome16, c16 } from '@stacksjs/iconify-nonicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    angular16: renderIcon(angular16, { size: 20, class: 'nav-icon' }),
    babel16: renderIcon(babel16, { size: 20, class: 'nav-icon' }),
    biome16: renderIcon(biome16, { size: 20, class: 'nav-icon' }),
    c16: renderIcon(c16, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.angular16 !!} Home</a>
  <a href="/about">{!! navIcons.babel16 !!} About</a>
  <a href="/contact">{!! navIcons.biome16 !!} Contact</a>
  <a href="/settings">{!! navIcons.c16 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { angular16 } from '@stacksjs/iconify-nonicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(angular16, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-nonicons'
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
   import { angular16, babel16 } from '@stacksjs/iconify-nonicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-nonicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { angular16 } from '@stacksjs/iconify-nonicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(angular16, { size: 24 })
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
import { angular16 } from '@stacksjs/iconify-nonicons'

// Icons are typed as IconData
const myIcon: IconData = angular16
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/yamatsum/nonicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: yamatsum ([Website](https://github.com/yamatsum/nonicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/nonicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/nonicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
