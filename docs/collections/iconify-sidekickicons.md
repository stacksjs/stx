# SidekickIcons

> SidekickIcons icons for stx from Iconify

## Overview

This package provides access to 224 icons from the SidekickIcons collection through the stx iconify integration.

**Collection ID:** `sidekickicons`
**Total Icons:** 224
**Author:** Andri Soone ([Website](https://github.com/ndri/sidekickicons))
**License:** MIT ([Details](https://github.com/ndri/sidekickicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-sidekickicons
```

## Quick Start

### In stx Templates

```html
@js
  import { arcThird, arcThird16Solid, arcThird20Solid } from '@stacksjs/iconify-sidekickicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    arcThird: renderIcon(arcThird, { size: 24 }),
    arcThird16Solid: renderIcon(arcThird16Solid, { size: 24, color: '#4a90e2' }),
    arcThird20Solid: renderIcon(arcThird20Solid, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.arcThird !!}
  {!! icons.arcThird16Solid !!}
  {!! icons.arcThird20Solid !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { arcThird, arcThird16Solid, arcThird20Solid } from '@stacksjs/iconify-sidekickicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(arcThird, { size: 24 })

// With custom color
const coloredIcon = renderIcon(arcThird16Solid, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(arcThird20Solid, {
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

This package contains **224** icons. Here are some examples:

- `arcThird`
- `arcThird16Solid`
- `arcThird20Solid`
- `arcThirdSolid`
- `archiveBoxArrowUp`

...and 214 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/sidekickicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { arcThird, arcThird16Solid, arcThird20Solid, arcThirdSolid } from '@stacksjs/iconify-sidekickicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    arcThird: renderIcon(arcThird, { size: 20, class: 'nav-icon' }),
    arcThird16Solid: renderIcon(arcThird16Solid, { size: 20, class: 'nav-icon' }),
    arcThird20Solid: renderIcon(arcThird20Solid, { size: 20, class: 'nav-icon' }),
    arcThirdSolid: renderIcon(arcThirdSolid, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.arcThird !!} Home</a>
  <a href="/about">{!! navIcons.arcThird16Solid !!} About</a>
  <a href="/contact">{!! navIcons.arcThird20Solid !!} Contact</a>
  <a href="/settings">{!! navIcons.arcThirdSolid !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { arcThird } from '@stacksjs/iconify-sidekickicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(arcThird, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-sidekickicons'
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
   import { arcThird, arcThird16Solid } from '@stacksjs/iconify-sidekickicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-sidekickicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { arcThird } from '@stacksjs/iconify-sidekickicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(arcThird, { size: 24 })
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
import { arcThird } from '@stacksjs/iconify-sidekickicons'

// Icons are typed as IconData
const myIcon: IconData = arcThird
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/ndri/sidekickicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Andri Soone ([Website](https://github.com/ndri/sidekickicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/sidekickicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/sidekickicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
