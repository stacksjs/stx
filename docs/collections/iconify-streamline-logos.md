# Logos free icons

> Logos free icons icons for stx from Iconify

## Overview

This package provides access to 1362 icons from the Logos free icons collection through the stx iconify integration.

**Collection ID:** `streamline-logos`
**Total Icons:** 1362
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-logos
```

## Quick Start

### In stx Templates

```html
@js
  import { 3dsMaxLogo, 3dsMaxLogoBlock, 3dsMaxLogoSolid } from '@stacksjs/iconify-streamline-logos'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3dsMaxLogo: renderIcon(3dsMaxLogo, { size: 24 }),
    3dsMaxLogoBlock: renderIcon(3dsMaxLogoBlock, { size: 24, color: '#4a90e2' }),
    3dsMaxLogoSolid: renderIcon(3dsMaxLogoSolid, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3dsMaxLogo !!}
  {!! icons.3dsMaxLogoBlock !!}
  {!! icons.3dsMaxLogoSolid !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3dsMaxLogo, 3dsMaxLogoBlock, 3dsMaxLogoSolid } from '@stacksjs/iconify-streamline-logos'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3dsMaxLogo, { size: 24 })

// With custom color
const coloredIcon = renderIcon(3dsMaxLogoBlock, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dsMaxLogoSolid, {
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

This package contains **1362** icons. Here are some examples:

- `3dsMaxLogo`
- `3dsMaxLogoBlock`
- `3dsMaxLogoSolid`
- `500pxLogo1`
- `500pxLogo1Block`

...and 1352 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-logos/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dsMaxLogo, 3dsMaxLogoBlock, 3dsMaxLogoSolid, 500pxLogo1 } from '@stacksjs/iconify-streamline-logos'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3dsMaxLogo: renderIcon(3dsMaxLogo, { size: 20, class: 'nav-icon' }),
    3dsMaxLogoBlock: renderIcon(3dsMaxLogoBlock, { size: 20, class: 'nav-icon' }),
    3dsMaxLogoSolid: renderIcon(3dsMaxLogoSolid, { size: 20, class: 'nav-icon' }),
    500pxLogo1: renderIcon(500pxLogo1, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3dsMaxLogo !!} Home</a>
  <a href="/about">{!! navIcons.3dsMaxLogoBlock !!} About</a>
  <a href="/contact">{!! navIcons.3dsMaxLogoSolid !!} Contact</a>
  <a href="/settings">{!! navIcons.500pxLogo1 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3dsMaxLogo } from '@stacksjs/iconify-streamline-logos'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3dsMaxLogo, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-logos'
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
   import { 3dsMaxLogo, 3dsMaxLogoBlock } from '@stacksjs/iconify-streamline-logos'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-logos'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dsMaxLogo } from '@stacksjs/iconify-streamline-logos'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3dsMaxLogo, { size: 24 })
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
import { 3dsMaxLogo } from '@stacksjs/iconify-streamline-logos'

// Icons are typed as IconData
const myIcon: IconData = 3dsMaxLogo
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-logos/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-logos/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
