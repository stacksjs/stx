# Covid Icons

> Covid Icons icons for stx from Iconify

## Overview

This package provides access to 142 icons from the Covid Icons collection through the stx iconify integration.

**Collection ID:** `covid`
**Total Icons:** 142
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-covid
```

## Quick Start

### In stx Templates

```html
@js
  import { covid19Virus4, covid19VirusPandemic1, covid19VirusPandemic2 } from '@stacksjs/iconify-covid'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    covid19Virus4: renderIcon(covid19Virus4, { size: 24 }),
    covid19VirusPandemic1: renderIcon(covid19VirusPandemic1, { size: 24, color: '#4a90e2' }),
    covid19VirusPandemic2: renderIcon(covid19VirusPandemic2, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.covid19Virus4 !!}
  {!! icons.covid19VirusPandemic1 !!}
  {!! icons.covid19VirusPandemic2 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { covid19Virus4, covid19VirusPandemic1, covid19VirusPandemic2 } from '@stacksjs/iconify-covid'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(covid19Virus4, { size: 24 })

// With custom color
const coloredIcon = renderIcon(covid19VirusPandemic1, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(covid19VirusPandemic2, {
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

This package contains **142** icons. Here are some examples:

- `covid19Virus4`
- `covid19VirusPandemic1`
- `covid19VirusPandemic2`
- `covid19VirusPandemic3`
- `covidCarrierBlood1`

...and 132 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/covid/).

## Usage Examples

### Navigation Menu

```html
@js
  import { covid19Virus4, covid19VirusPandemic1, covid19VirusPandemic2, covid19VirusPandemic3 } from '@stacksjs/iconify-covid'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    covid19Virus4: renderIcon(covid19Virus4, { size: 20, class: 'nav-icon' }),
    covid19VirusPandemic1: renderIcon(covid19VirusPandemic1, { size: 20, class: 'nav-icon' }),
    covid19VirusPandemic2: renderIcon(covid19VirusPandemic2, { size: 20, class: 'nav-icon' }),
    covid19VirusPandemic3: renderIcon(covid19VirusPandemic3, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.covid19Virus4 !!} Home</a>
  <a href="/about">{!! navIcons.covid19VirusPandemic1 !!} About</a>
  <a href="/contact">{!! navIcons.covid19VirusPandemic2 !!} Contact</a>
  <a href="/settings">{!! navIcons.covid19VirusPandemic3 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { covid19Virus4 } from '@stacksjs/iconify-covid'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(covid19Virus4, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-covid'
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
   import { covid19Virus4, covid19VirusPandemic1 } from '@stacksjs/iconify-covid'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-covid'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { covid19Virus4 } from '@stacksjs/iconify-covid'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(covid19Virus4, { size: 24 })
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
import { covid19Virus4 } from '@stacksjs/iconify-covid'

// Icons are typed as IconData
const myIcon: IconData = covid19Virus4
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/covid/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/covid/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
