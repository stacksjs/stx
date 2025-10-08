# Typicons

> Typicons icons for stx from Iconify

## Overview

This package provides access to 336 icons from the Typicons collection through the stx iconify integration.

**Collection ID:** `typcn`
**Total Icons:** 336
**Author:** Stephen Hutchings ([Website](https://github.com/stephenhutchings/typicons.font))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-typcn
```

## Quick Start

### In stx Templates

```html
@js
  import { adjustBrightness, adjustContrast, anchor } from '@stacksjs/iconify-typcn'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    adjustBrightness: renderIcon(adjustBrightness, { size: 24 }),
    adjustContrast: renderIcon(adjustContrast, { size: 24, color: '#4a90e2' }),
    anchor: renderIcon(anchor, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.adjustBrightness !!}
  {!! icons.adjustContrast !!}
  {!! icons.anchor !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { adjustBrightness, adjustContrast, anchor } from '@stacksjs/iconify-typcn'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(adjustBrightness, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adjustContrast, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(anchor, {
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

This package contains **336** icons. Here are some examples:

- `adjustBrightness`
- `adjustContrast`
- `anchor`
- `anchorOutline`
- `archive`

...and 326 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/typcn/).

## Usage Examples

### Navigation Menu

```html
@js
  import { adjustBrightness, adjustContrast, anchor, anchorOutline } from '@stacksjs/iconify-typcn'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    adjustBrightness: renderIcon(adjustBrightness, { size: 20, class: 'nav-icon' }),
    adjustContrast: renderIcon(adjustContrast, { size: 20, class: 'nav-icon' }),
    anchor: renderIcon(anchor, { size: 20, class: 'nav-icon' }),
    anchorOutline: renderIcon(anchorOutline, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.adjustBrightness !!} Home</a>
  <a href="/about">{!! navIcons.adjustContrast !!} About</a>
  <a href="/contact">{!! navIcons.anchor !!} Contact</a>
  <a href="/settings">{!! navIcons.anchorOutline !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { adjustBrightness } from '@stacksjs/iconify-typcn'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(adjustBrightness, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-typcn'
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
   import { adjustBrightness, adjustContrast } from '@stacksjs/iconify-typcn'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-typcn'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { adjustBrightness } from '@stacksjs/iconify-typcn'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(adjustBrightness, { size: 24 })
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
import { adjustBrightness } from '@stacksjs/iconify-typcn'

// Icons are typed as IconData
const myIcon: IconData = adjustBrightness
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Stephen Hutchings ([Website](https://github.com/stephenhutchings/typicons.font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/typcn/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/typcn/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
