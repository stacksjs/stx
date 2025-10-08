# Lucide Lab

> Lucide Lab icons for stx from Iconify

## Overview

This package provides access to 373 icons from the Lucide Lab collection through the stx iconify integration.

**Collection ID:** `lucide-lab`
**Total Icons:** 373
**Author:** Lucide Contributors ([Website](https://github.com/lucide-icons/lucide-lab))
**License:** ISC ([Details](https://github.com/lucide-icons/lucide-lab/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lucide-lab
```

## Quick Start

### In stx Templates

```html
@js
  import { ampersandSquare, appleCore, arrowsUpDownSquare } from '@stacksjs/iconify-lucide-lab'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    ampersandSquare: renderIcon(ampersandSquare, { size: 24 }),
    appleCore: renderIcon(appleCore, { size: 24, color: '#4a90e2' }),
    arrowsUpDownSquare: renderIcon(arrowsUpDownSquare, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.ampersandSquare !!}
  {!! icons.appleCore !!}
  {!! icons.arrowsUpDownSquare !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { ampersandSquare, appleCore, arrowsUpDownSquare } from '@stacksjs/iconify-lucide-lab'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(ampersandSquare, { size: 24 })

// With custom color
const coloredIcon = renderIcon(appleCore, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(arrowsUpDownSquare, {
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

This package contains **373** icons. Here are some examples:

- `ampersandSquare`
- `appleCore`
- `arrowsUpDownSquare`
- `astronautHelmet`
- `atSignCircle`

...and 363 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/lucide-lab/).

## Usage Examples

### Navigation Menu

```html
@js
  import { ampersandSquare, appleCore, arrowsUpDownSquare, astronautHelmet } from '@stacksjs/iconify-lucide-lab'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    ampersandSquare: renderIcon(ampersandSquare, { size: 20, class: 'nav-icon' }),
    appleCore: renderIcon(appleCore, { size: 20, class: 'nav-icon' }),
    arrowsUpDownSquare: renderIcon(arrowsUpDownSquare, { size: 20, class: 'nav-icon' }),
    astronautHelmet: renderIcon(astronautHelmet, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.ampersandSquare !!} Home</a>
  <a href="/about">{!! navIcons.appleCore !!} About</a>
  <a href="/contact">{!! navIcons.arrowsUpDownSquare !!} Contact</a>
  <a href="/settings">{!! navIcons.astronautHelmet !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { ampersandSquare } from '@stacksjs/iconify-lucide-lab'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(ampersandSquare, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-lucide-lab'
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
   import { ampersandSquare, appleCore } from '@stacksjs/iconify-lucide-lab'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-lucide-lab'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ampersandSquare } from '@stacksjs/iconify-lucide-lab'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(ampersandSquare, { size: 24 })
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
import { ampersandSquare } from '@stacksjs/iconify-lucide-lab'

// Icons are typed as IconData
const myIcon: IconData = ampersandSquare
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

ISC

See [license details](https://github.com/lucide-icons/lucide-lab/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Lucide Contributors ([Website](https://github.com/lucide-icons/lucide-lab))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lucide-lab/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lucide-lab/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
