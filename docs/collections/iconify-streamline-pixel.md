# Pixel free icons

> Pixel free icons icons for stx from Iconify

## Overview

This package provides access to 662 icons from the Pixel free icons collection through the stx iconify integration.

**Collection ID:** `streamline-pixel`
**Total Icons:** 662
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-pixel
```

## Quick Start

### In stx Templates

```html
@js
  import { beautyBarberLightSign, beautyBeardStyle, beautyBodyCareSnail } from '@stacksjs/iconify-streamline-pixel'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    beautyBarberLightSign: renderIcon(beautyBarberLightSign, { size: 24 }),
    beautyBeardStyle: renderIcon(beautyBeardStyle, { size: 24, color: '#4a90e2' }),
    beautyBodyCareSnail: renderIcon(beautyBodyCareSnail, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.beautyBarberLightSign !!}
  {!! icons.beautyBeardStyle !!}
  {!! icons.beautyBodyCareSnail !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { beautyBarberLightSign, beautyBeardStyle, beautyBodyCareSnail } from '@stacksjs/iconify-streamline-pixel'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(beautyBarberLightSign, { size: 24 })

// With custom color
const coloredIcon = renderIcon(beautyBeardStyle, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(beautyBodyCareSnail, {
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

This package contains **662** icons. Here are some examples:

- `beautyBarberLightSign`
- `beautyBeardStyle`
- `beautyBodyCareSnail`
- `beautyBodyCareSunScreen`
- `beautyCosmaticBrushSet`

...and 652 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-pixel/).

## Usage Examples

### Navigation Menu

```html
@js
  import { beautyBarberLightSign, beautyBeardStyle, beautyBodyCareSnail, beautyBodyCareSunScreen } from '@stacksjs/iconify-streamline-pixel'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    beautyBarberLightSign: renderIcon(beautyBarberLightSign, { size: 20, class: 'nav-icon' }),
    beautyBeardStyle: renderIcon(beautyBeardStyle, { size: 20, class: 'nav-icon' }),
    beautyBodyCareSnail: renderIcon(beautyBodyCareSnail, { size: 20, class: 'nav-icon' }),
    beautyBodyCareSunScreen: renderIcon(beautyBodyCareSunScreen, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.beautyBarberLightSign !!} Home</a>
  <a href="/about">{!! navIcons.beautyBeardStyle !!} About</a>
  <a href="/contact">{!! navIcons.beautyBodyCareSnail !!} Contact</a>
  <a href="/settings">{!! navIcons.beautyBodyCareSunScreen !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { beautyBarberLightSign } from '@stacksjs/iconify-streamline-pixel'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(beautyBarberLightSign, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-pixel'
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
   import { beautyBarberLightSign, beautyBeardStyle } from '@stacksjs/iconify-streamline-pixel'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-pixel'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { beautyBarberLightSign } from '@stacksjs/iconify-streamline-pixel'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(beautyBarberLightSign, { size: 24 })
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
import { beautyBarberLightSign } from '@stacksjs/iconify-streamline-pixel'

// Icons are typed as IconData
const myIcon: IconData = beautyBarberLightSign
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-pixel/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-pixel/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
