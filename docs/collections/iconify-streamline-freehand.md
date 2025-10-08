# Freehand free icons

> Freehand free icons icons for stx from Iconify

## Overview

This package provides access to 1000 icons from the Freehand free icons collection through the stx iconify integration.

**Collection ID:** `streamline-freehand`
**Total Icons:** 1000
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-freehand
```

## Quick Start

### In stx Templates

```html
@js
  import { accessoriesRemoteShutter, accessoriesRetroFilm1, accountingAbacus } from '@stacksjs/iconify-streamline-freehand'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessoriesRemoteShutter: renderIcon(accessoriesRemoteShutter, { size: 24 }),
    accessoriesRetroFilm1: renderIcon(accessoriesRetroFilm1, { size: 24, color: '#4a90e2' }),
    accountingAbacus: renderIcon(accountingAbacus, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessoriesRemoteShutter !!}
  {!! icons.accessoriesRetroFilm1 !!}
  {!! icons.accountingAbacus !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessoriesRemoteShutter, accessoriesRetroFilm1, accountingAbacus } from '@stacksjs/iconify-streamline-freehand'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessoriesRemoteShutter, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessoriesRetroFilm1, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accountingAbacus, {
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

This package contains **1000** icons. Here are some examples:

- `accessoriesRemoteShutter`
- `accessoriesRetroFilm1`
- `accountingAbacus`
- `accountingCalculator`
- `accountingInvoice`

...and 990 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-freehand/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessoriesRemoteShutter, accessoriesRetroFilm1, accountingAbacus, accountingCalculator } from '@stacksjs/iconify-streamline-freehand'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessoriesRemoteShutter: renderIcon(accessoriesRemoteShutter, { size: 20, class: 'nav-icon' }),
    accessoriesRetroFilm1: renderIcon(accessoriesRetroFilm1, { size: 20, class: 'nav-icon' }),
    accountingAbacus: renderIcon(accountingAbacus, { size: 20, class: 'nav-icon' }),
    accountingCalculator: renderIcon(accountingCalculator, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessoriesRemoteShutter !!} Home</a>
  <a href="/about">{!! navIcons.accessoriesRetroFilm1 !!} About</a>
  <a href="/contact">{!! navIcons.accountingAbacus !!} Contact</a>
  <a href="/settings">{!! navIcons.accountingCalculator !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessoriesRemoteShutter } from '@stacksjs/iconify-streamline-freehand'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessoriesRemoteShutter, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-freehand'
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
   import { accessoriesRemoteShutter, accessoriesRetroFilm1 } from '@stacksjs/iconify-streamline-freehand'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-freehand'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessoriesRemoteShutter } from '@stacksjs/iconify-streamline-freehand'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessoriesRemoteShutter, { size: 24 })
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
import { accessoriesRemoteShutter } from '@stacksjs/iconify-streamline-freehand'

// Icons are typed as IconData
const myIcon: IconData = accessoriesRemoteShutter
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-freehand/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-freehand/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
