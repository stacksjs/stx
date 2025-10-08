# Mage Icons

> Mage Icons icons for stx from Iconify

## Overview

This package provides access to 1042 icons from the Mage Icons collection through the stx iconify integration.

**Collection ID:** `mage`
**Total Icons:** 1042
**Author:** MageIcons ([Website](https://github.com/Mage-Icons/mage-icons))
**License:** Apache 2.0 ([Details](https://github.com/Mage-Icons/mage-icons/blob/main/License.txt))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-mage
```

## Quick Start

### In stx Templates

```html
@js
  import { adobe, aeroplane, aeroplaneFill } from '@stacksjs/iconify-mage'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    adobe: renderIcon(adobe, { size: 24 }),
    aeroplane: renderIcon(aeroplane, { size: 24, color: '#4a90e2' }),
    aeroplaneFill: renderIcon(aeroplaneFill, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.adobe !!}
  {!! icons.aeroplane !!}
  {!! icons.aeroplaneFill !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { adobe, aeroplane, aeroplaneFill } from '@stacksjs/iconify-mage'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(adobe, { size: 24 })

// With custom color
const coloredIcon = renderIcon(aeroplane, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(aeroplaneFill, {
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

This package contains **1042** icons. Here are some examples:

- `adobe`
- `aeroplane`
- `aeroplaneFill`
- `afterEffects`
- `alarmClock`

...and 1032 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/mage/).

## Usage Examples

### Navigation Menu

```html
@js
  import { adobe, aeroplane, aeroplaneFill, afterEffects } from '@stacksjs/iconify-mage'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    adobe: renderIcon(adobe, { size: 20, class: 'nav-icon' }),
    aeroplane: renderIcon(aeroplane, { size: 20, class: 'nav-icon' }),
    aeroplaneFill: renderIcon(aeroplaneFill, { size: 20, class: 'nav-icon' }),
    afterEffects: renderIcon(afterEffects, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.adobe !!} Home</a>
  <a href="/about">{!! navIcons.aeroplane !!} About</a>
  <a href="/contact">{!! navIcons.aeroplaneFill !!} Contact</a>
  <a href="/settings">{!! navIcons.afterEffects !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { adobe } from '@stacksjs/iconify-mage'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(adobe, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-mage'
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
   import { adobe, aeroplane } from '@stacksjs/iconify-mage'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-mage'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { adobe } from '@stacksjs/iconify-mage'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(adobe, { size: 24 })
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
import { adobe } from '@stacksjs/iconify-mage'

// Icons are typed as IconData
const myIcon: IconData = adobe
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Mage-Icons/mage-icons/blob/main/License.txt) for more information.

## Credits

- **Icons**: MageIcons ([Website](https://github.com/Mage-Icons/mage-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/mage/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/mage/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
