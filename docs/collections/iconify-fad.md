# FontAudio

> FontAudio icons for stx from Iconify

## Overview

This package provides access to 155 icons from the FontAudio collection through the stx iconify integration.

**Collection ID:** `fad`
**Total Icons:** 155
**Author:** @fefanto ([Website](https://github.com/fefanto/fontaudio))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fad
```

## Quick Start

### In stx Templates

```html
@js
  import { adr, adsr, ahdsr } from '@stacksjs/iconify-fad'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    adr: renderIcon(adr, { size: 24 }),
    adsr: renderIcon(adsr, { size: 24, color: '#4a90e2' }),
    ahdsr: renderIcon(ahdsr, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.adr !!}
  {!! icons.adsr !!}
  {!! icons.ahdsr !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { adr, adsr, ahdsr } from '@stacksjs/iconify-fad'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(adr, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adsr, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(ahdsr, {
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

This package contains **155** icons. Here are some examples:

- `adr`
- `adsr`
- `ahdsr`
- `ar`
- `armrecording`

...and 145 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fad/).

## Usage Examples

### Navigation Menu

```html
@js
  import { adr, adsr, ahdsr, ar } from '@stacksjs/iconify-fad'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    adr: renderIcon(adr, { size: 20, class: 'nav-icon' }),
    adsr: renderIcon(adsr, { size: 20, class: 'nav-icon' }),
    ahdsr: renderIcon(ahdsr, { size: 20, class: 'nav-icon' }),
    ar: renderIcon(ar, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.adr !!} Home</a>
  <a href="/about">{!! navIcons.adsr !!} About</a>
  <a href="/contact">{!! navIcons.ahdsr !!} Contact</a>
  <a href="/settings">{!! navIcons.ar !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { adr } from '@stacksjs/iconify-fad'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(adr, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fad'
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
   import { adr, adsr } from '@stacksjs/iconify-fad'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fad'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { adr } from '@stacksjs/iconify-fad'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(adr, { size: 24 })
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
import { adr } from '@stacksjs/iconify-fad'

// Icons are typed as IconData
const myIcon: IconData = adr
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: @fefanto ([Website](https://github.com/fefanto/fontaudio))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fad/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fad/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
