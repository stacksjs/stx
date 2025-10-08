# Akar Icons

> Akar Icons icons for stx from Iconify

## Overview

This package provides access to 458 icons from the Akar Icons collection through the stx iconify integration.

**Collection ID:** `akar-icons`
**Total Icons:** 458
**Author:** Arturo Wibawa ([Website](https://github.com/artcoholic/akar-icons))
**License:** MIT ([Details](https://github.com/artcoholic/akar-icons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-akar-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { air, airplayAudio, airplayVideo } from '@stacksjs/iconify-akar-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    air: renderIcon(air, { size: 24 }),
    airplayAudio: renderIcon(airplayAudio, { size: 24, color: '#4a90e2' }),
    airplayVideo: renderIcon(airplayVideo, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.air !!}
  {!! icons.airplayAudio !!}
  {!! icons.airplayVideo !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { air, airplayAudio, airplayVideo } from '@stacksjs/iconify-akar-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(air, { size: 24 })

// With custom color
const coloredIcon = renderIcon(airplayAudio, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(airplayVideo, {
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

This package contains **458** icons. Here are some examples:

- `air`
- `airplayAudio`
- `airplayVideo`
- `airpods`
- `alarm`

...and 448 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/akar-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { air, airplayAudio, airplayVideo, airpods } from '@stacksjs/iconify-akar-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    air: renderIcon(air, { size: 20, class: 'nav-icon' }),
    airplayAudio: renderIcon(airplayAudio, { size: 20, class: 'nav-icon' }),
    airplayVideo: renderIcon(airplayVideo, { size: 20, class: 'nav-icon' }),
    airpods: renderIcon(airpods, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.air !!} Home</a>
  <a href="/about">{!! navIcons.airplayAudio !!} About</a>
  <a href="/contact">{!! navIcons.airplayVideo !!} Contact</a>
  <a href="/settings">{!! navIcons.airpods !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { air } from '@stacksjs/iconify-akar-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(air, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-akar-icons'
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
   import { air, airplayAudio } from '@stacksjs/iconify-akar-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-akar-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { air } from '@stacksjs/iconify-akar-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(air, { size: 24 })
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
import { air } from '@stacksjs/iconify-akar-icons'

// Icons are typed as IconData
const myIcon: IconData = air
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/artcoholic/akar-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Arturo Wibawa ([Website](https://github.com/artcoholic/akar-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/akar-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/akar-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
