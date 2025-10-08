# Meteocons

> Meteocons icons for stx from Iconify

## Overview

This package provides access to 450 icons from the Meteocons collection through the stx iconify integration.

**Collection ID:** `meteocons`
**Total Icons:** 450
**Author:** Bas Milius ([Website](https://github.com/basmilius/weather-icons))
**License:** MIT ([Details](https://github.com/basmilius/weather-icons/blob/dev/LICENSE))
**Category:** Thematic
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-meteocons
```

## Quick Start

### In stx Templates

```html
@js
  import { barometer, barometerFill, beanie } from '@stacksjs/iconify-meteocons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    barometer: renderIcon(barometer, { size: 24 }),
    barometerFill: renderIcon(barometerFill, { size: 24, color: '#4a90e2' }),
    beanie: renderIcon(beanie, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.barometer !!}
  {!! icons.barometerFill !!}
  {!! icons.beanie !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { barometer, barometerFill, beanie } from '@stacksjs/iconify-meteocons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(barometer, { size: 24 })

// With custom color
const coloredIcon = renderIcon(barometerFill, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(beanie, {
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

This package contains **450** icons. Here are some examples:

- `barometer`
- `barometerFill`
- `beanie`
- `beanieFill`
- `celsius`

...and 440 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/meteocons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { barometer, barometerFill, beanie, beanieFill } from '@stacksjs/iconify-meteocons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    barometer: renderIcon(barometer, { size: 20, class: 'nav-icon' }),
    barometerFill: renderIcon(barometerFill, { size: 20, class: 'nav-icon' }),
    beanie: renderIcon(beanie, { size: 20, class: 'nav-icon' }),
    beanieFill: renderIcon(beanieFill, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.barometer !!} Home</a>
  <a href="/about">{!! navIcons.barometerFill !!} About</a>
  <a href="/contact">{!! navIcons.beanie !!} Contact</a>
  <a href="/settings">{!! navIcons.beanieFill !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { barometer } from '@stacksjs/iconify-meteocons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(barometer, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-meteocons'
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
   import { barometer, barometerFill } from '@stacksjs/iconify-meteocons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-meteocons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { barometer } from '@stacksjs/iconify-meteocons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(barometer, { size: 24 })
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
import { barometer } from '@stacksjs/iconify-meteocons'

// Icons are typed as IconData
const myIcon: IconData = barometer
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/basmilius/weather-icons/blob/dev/LICENSE) for more information.

## Credits

- **Icons**: Bas Milius ([Website](https://github.com/basmilius/weather-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/meteocons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/meteocons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
