# Evil Icons

> Evil Icons icons for stx from Iconify

## Overview

This package provides access to 70 icons from the Evil Icons collection through the stx iconify integration.

**Collection ID:** `ei`
**Total Icons:** 70
**Author:** Alexander Madyankin and Roman Shamin ([Website](https://github.com/evil-icons/evil-icons))
**License:** MIT ([Details](https://github.com/evil-icons/evil-icons/blob/master/LICENSE.txt))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ei
```

## Quick Start

### In stx Templates

```html
@js
  import { archive, arrowDown, arrowLeft } from '@stacksjs/iconify-ei'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    archive: renderIcon(archive, { size: 24 }),
    arrowDown: renderIcon(arrowDown, { size: 24, color: '#4a90e2' }),
    arrowLeft: renderIcon(arrowLeft, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.archive !!}
  {!! icons.arrowDown !!}
  {!! icons.arrowLeft !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { archive, arrowDown, arrowLeft } from '@stacksjs/iconify-ei'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(archive, { size: 24 })

// With custom color
const coloredIcon = renderIcon(arrowDown, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(arrowLeft, {
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

This package contains **70** icons. Here are some examples:

- `archive`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`

...and 60 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ei/).

## Usage Examples

### Navigation Menu

```html
@js
  import { archive, arrowDown, arrowLeft, arrowRight } from '@stacksjs/iconify-ei'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    archive: renderIcon(archive, { size: 20, class: 'nav-icon' }),
    arrowDown: renderIcon(arrowDown, { size: 20, class: 'nav-icon' }),
    arrowLeft: renderIcon(arrowLeft, { size: 20, class: 'nav-icon' }),
    arrowRight: renderIcon(arrowRight, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.archive !!} Home</a>
  <a href="/about">{!! navIcons.arrowDown !!} About</a>
  <a href="/contact">{!! navIcons.arrowLeft !!} Contact</a>
  <a href="/settings">{!! navIcons.arrowRight !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { archive } from '@stacksjs/iconify-ei'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(archive, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ei'
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
   import { archive, arrowDown } from '@stacksjs/iconify-ei'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ei'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { archive } from '@stacksjs/iconify-ei'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(archive, { size: 24 })
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
import { archive } from '@stacksjs/iconify-ei'

// Icons are typed as IconData
const myIcon: IconData = archive
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/evil-icons/evil-icons/blob/master/LICENSE.txt) for more information.

## Credits

- **Icons**: Alexander Madyankin and Roman Shamin ([Website](https://github.com/evil-icons/evil-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ei/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ei/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
