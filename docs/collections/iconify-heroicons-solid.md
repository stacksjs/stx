# HeroIcons v1 Solid

> HeroIcons v1 Solid icons for stx from Iconify

## Overview

This package provides access to 387 icons from the HeroIcons v1 Solid collection through the stx iconify integration.

**Collection ID:** `heroicons-solid`
**Total Icons:** 387
**Author:** Refactoring UI Inc ([Website](https://github.com/tailwindlabs/heroicons))
**License:** MIT ([Details](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-heroicons-solid
```

## Quick Start

### In stx Templates

```html
@js
  import { academicCap, adjustments, adjustmentsHorizontal } from '@stacksjs/iconify-heroicons-solid'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    academicCap: renderIcon(academicCap, { size: 24 }),
    adjustments: renderIcon(adjustments, { size: 24, color: '#4a90e2' }),
    adjustmentsHorizontal: renderIcon(adjustmentsHorizontal, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.academicCap !!}
  {!! icons.adjustments !!}
  {!! icons.adjustmentsHorizontal !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { academicCap, adjustments, adjustmentsHorizontal } from '@stacksjs/iconify-heroicons-solid'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(academicCap, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adjustments, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adjustmentsHorizontal, {
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

This package contains **387** icons. Here are some examples:

- `academicCap`
- `adjustments`
- `adjustmentsHorizontal`
- `adjustmentsVertical`
- `annotation`

...and 377 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/heroicons-solid/).

## Usage Examples

### Navigation Menu

```html
@js
  import { academicCap, adjustments, adjustmentsHorizontal, adjustmentsVertical } from '@stacksjs/iconify-heroicons-solid'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    academicCap: renderIcon(academicCap, { size: 20, class: 'nav-icon' }),
    adjustments: renderIcon(adjustments, { size: 20, class: 'nav-icon' }),
    adjustmentsHorizontal: renderIcon(adjustmentsHorizontal, { size: 20, class: 'nav-icon' }),
    adjustmentsVertical: renderIcon(adjustmentsVertical, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.academicCap !!} Home</a>
  <a href="/about">{!! navIcons.adjustments !!} About</a>
  <a href="/contact">{!! navIcons.adjustmentsHorizontal !!} Contact</a>
  <a href="/settings">{!! navIcons.adjustmentsVertical !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { academicCap } from '@stacksjs/iconify-heroicons-solid'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(academicCap, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-heroicons-solid'
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
   import { academicCap, adjustments } from '@stacksjs/iconify-heroicons-solid'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-heroicons-solid'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { academicCap } from '@stacksjs/iconify-heroicons-solid'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(academicCap, { size: 24 })
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
import { academicCap } from '@stacksjs/iconify-heroicons-solid'

// Icons are typed as IconData
const myIcon: IconData = academicCap
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Refactoring UI Inc ([Website](https://github.com/tailwindlabs/heroicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/heroicons-solid/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/heroicons-solid/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
