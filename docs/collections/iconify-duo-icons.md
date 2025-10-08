# Duoicons

> Duoicons icons for stx from Iconify

## Overview

This package provides access to 91 icons from the Duoicons collection through the stx iconify integration.

**Collection ID:** `duo-icons`
**Total Icons:** 91
**Author:** fernandcf ([Website](https://github.com/fazdiu/duo-icons))
**License:** MIT ([Details](https://github.com/fazdiu/duo-icons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-duo-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { addCircle, airplay, alertOctagon } from '@stacksjs/iconify-duo-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addCircle: renderIcon(addCircle, { size: 24 }),
    airplay: renderIcon(airplay, { size: 24, color: '#4a90e2' }),
    alertOctagon: renderIcon(alertOctagon, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addCircle !!}
  {!! icons.airplay !!}
  {!! icons.alertOctagon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addCircle, airplay, alertOctagon } from '@stacksjs/iconify-duo-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addCircle, { size: 24 })

// With custom color
const coloredIcon = renderIcon(airplay, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alertOctagon, {
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

This package contains **91** icons. Here are some examples:

- `addCircle`
- `airplay`
- `alertOctagon`
- `alertTriangle`
- `alignBottom`

...and 81 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/duo-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addCircle, airplay, alertOctagon, alertTriangle } from '@stacksjs/iconify-duo-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addCircle: renderIcon(addCircle, { size: 20, class: 'nav-icon' }),
    airplay: renderIcon(airplay, { size: 20, class: 'nav-icon' }),
    alertOctagon: renderIcon(alertOctagon, { size: 20, class: 'nav-icon' }),
    alertTriangle: renderIcon(alertTriangle, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addCircle !!} Home</a>
  <a href="/about">{!! navIcons.airplay !!} About</a>
  <a href="/contact">{!! navIcons.alertOctagon !!} Contact</a>
  <a href="/settings">{!! navIcons.alertTriangle !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addCircle } from '@stacksjs/iconify-duo-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addCircle, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-duo-icons'
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
   import { addCircle, airplay } from '@stacksjs/iconify-duo-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-duo-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addCircle } from '@stacksjs/iconify-duo-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addCircle, { size: 24 })
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
import { addCircle } from '@stacksjs/iconify-duo-icons'

// Icons are typed as IconData
const myIcon: IconData = addCircle
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/fazdiu/duo-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: fernandcf ([Website](https://github.com/fazdiu/duo-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/duo-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/duo-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
