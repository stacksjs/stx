# Phosphor

> Phosphor icons for stx from Iconify

## Overview

This package provides access to 9161 icons from the Phosphor collection through the stx iconify integration.

**Collection ID:** `ph`
**Total Icons:** 9161
**Author:** Phosphor Icons ([Website](https://github.com/phosphor-icons/core))
**License:** MIT ([Details](https://github.com/phosphor-icons/core/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ph
```

## Quick Start

### In stx Templates

```html
@js
  import { acorn, acornBold, acornDuotone } from '@stacksjs/iconify-ph'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    acorn: renderIcon(acorn, { size: 24 }),
    acornBold: renderIcon(acornBold, { size: 24, color: '#4a90e2' }),
    acornDuotone: renderIcon(acornDuotone, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.acorn !!}
  {!! icons.acornBold !!}
  {!! icons.acornDuotone !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { acorn, acornBold, acornDuotone } from '@stacksjs/iconify-ph'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(acorn, { size: 24 })

// With custom color
const coloredIcon = renderIcon(acornBold, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(acornDuotone, {
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

This package contains **9161** icons. Here are some examples:

- `acorn`
- `acornBold`
- `acornDuotone`
- `acornFill`
- `acornLight`

...and 9151 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ph/).

## Usage Examples

### Navigation Menu

```html
@js
  import { acorn, acornBold, acornDuotone, acornFill } from '@stacksjs/iconify-ph'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    acorn: renderIcon(acorn, { size: 20, class: 'nav-icon' }),
    acornBold: renderIcon(acornBold, { size: 20, class: 'nav-icon' }),
    acornDuotone: renderIcon(acornDuotone, { size: 20, class: 'nav-icon' }),
    acornFill: renderIcon(acornFill, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.acorn !!} Home</a>
  <a href="/about">{!! navIcons.acornBold !!} About</a>
  <a href="/contact">{!! navIcons.acornDuotone !!} Contact</a>
  <a href="/settings">{!! navIcons.acornFill !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { acorn } from '@stacksjs/iconify-ph'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(acorn, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ph'
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
   import { acorn, acornBold } from '@stacksjs/iconify-ph'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ph'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { acorn } from '@stacksjs/iconify-ph'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(acorn, { size: 24 })
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
import { acorn } from '@stacksjs/iconify-ph'

// Icons are typed as IconData
const myIcon: IconData = acorn
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/phosphor-icons/core/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Phosphor Icons ([Website](https://github.com/phosphor-icons/core))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ph/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ph/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
