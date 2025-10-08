# Unicons Solid

> Unicons Solid icons for stx from Iconify

## Overview

This package provides access to 190 icons from the Unicons Solid collection through the stx iconify integration.

**Collection ID:** `uis`
**Total Icons:** 190
**Author:** Iconscout ([Website](https://github.com/Iconscout/unicons))
**License:** Apache 2.0 ([Details](https://github.com/Iconscout/unicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-uis
```

## Quick Start

### In stx Templates

```html
@js
  import { airplay, alignAlt, alignCenter } from '@stacksjs/iconify-uis'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    airplay: renderIcon(airplay, { size: 24 }),
    alignAlt: renderIcon(alignAlt, { size: 24, color: '#4a90e2' }),
    alignCenter: renderIcon(alignCenter, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.airplay !!}
  {!! icons.alignAlt !!}
  {!! icons.alignCenter !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { airplay, alignAlt, alignCenter } from '@stacksjs/iconify-uis'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(airplay, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alignAlt, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alignCenter, {
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

This package contains **190** icons. Here are some examples:

- `airplay`
- `alignAlt`
- `alignCenter`
- `alignCenterJustify`
- `alignJustify`

...and 180 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/uis/).

## Usage Examples

### Navigation Menu

```html
@js
  import { airplay, alignAlt, alignCenter, alignCenterJustify } from '@stacksjs/iconify-uis'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    airplay: renderIcon(airplay, { size: 20, class: 'nav-icon' }),
    alignAlt: renderIcon(alignAlt, { size: 20, class: 'nav-icon' }),
    alignCenter: renderIcon(alignCenter, { size: 20, class: 'nav-icon' }),
    alignCenterJustify: renderIcon(alignCenterJustify, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.airplay !!} Home</a>
  <a href="/about">{!! navIcons.alignAlt !!} About</a>
  <a href="/contact">{!! navIcons.alignCenter !!} Contact</a>
  <a href="/settings">{!! navIcons.alignCenterJustify !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { airplay } from '@stacksjs/iconify-uis'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(airplay, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-uis'
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
   import { airplay, alignAlt } from '@stacksjs/iconify-uis'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-uis'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { airplay } from '@stacksjs/iconify-uis'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(airplay, { size: 24 })
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
import { airplay } from '@stacksjs/iconify-uis'

// Icons are typed as IconData
const myIcon: IconData = airplay
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Iconscout/unicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Iconscout ([Website](https://github.com/Iconscout/unicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/uis/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/uis/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
