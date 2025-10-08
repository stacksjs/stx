# Majesticons

> Majesticons icons for stx from Iconify

## Overview

This package provides access to 1045 icons from the Majesticons collection through the stx iconify integration.

**Collection ID:** `majesticons`
**Total Icons:** 1045
**Author:** Gerrit Halfmann ([Website](https://github.com/halfmage/majesticons))
**License:** MIT ([Details](https://github.com/halfmage/majesticons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-majesticons
```

## Quick Start

### In stx Templates

```html
@js
  import { academicCap, academicCapLine, addColumn } from '@stacksjs/iconify-majesticons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    academicCap: renderIcon(academicCap, { size: 24 }),
    academicCapLine: renderIcon(academicCapLine, { size: 24, color: '#4a90e2' }),
    addColumn: renderIcon(addColumn, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.academicCap !!}
  {!! icons.academicCapLine !!}
  {!! icons.addColumn !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { academicCap, academicCapLine, addColumn } from '@stacksjs/iconify-majesticons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(academicCap, { size: 24 })

// With custom color
const coloredIcon = renderIcon(academicCapLine, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addColumn, {
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

This package contains **1045** icons. Here are some examples:

- `academicCap`
- `academicCapLine`
- `addColumn`
- `addColumnLine`
- `addRow`

...and 1035 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/majesticons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { academicCap, academicCapLine, addColumn, addColumnLine } from '@stacksjs/iconify-majesticons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    academicCap: renderIcon(academicCap, { size: 20, class: 'nav-icon' }),
    academicCapLine: renderIcon(academicCapLine, { size: 20, class: 'nav-icon' }),
    addColumn: renderIcon(addColumn, { size: 20, class: 'nav-icon' }),
    addColumnLine: renderIcon(addColumnLine, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.academicCap !!} Home</a>
  <a href="/about">{!! navIcons.academicCapLine !!} About</a>
  <a href="/contact">{!! navIcons.addColumn !!} Contact</a>
  <a href="/settings">{!! navIcons.addColumnLine !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { academicCap } from '@stacksjs/iconify-majesticons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(academicCap, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-majesticons'
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
   import { academicCap, academicCapLine } from '@stacksjs/iconify-majesticons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-majesticons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { academicCap } from '@stacksjs/iconify-majesticons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(academicCap, { size: 24 })
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
import { academicCap } from '@stacksjs/iconify-majesticons'

// Icons are typed as IconData
const myIcon: IconData = academicCap
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/halfmage/majesticons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Gerrit Halfmann ([Website](https://github.com/halfmage/majesticons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/majesticons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/majesticons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
