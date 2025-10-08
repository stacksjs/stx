# Solar

> Solar icons for stx from Iconify

## Overview

This package provides access to 7404 icons from the Solar collection through the stx iconify integration.

**Collection ID:** `solar`
**Total Icons:** 7404
**Author:** 480 Design ([Website](https://www.figma.com/community/file/1166831539721848736))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-solar
```

## Quick Start

### In stx Templates

```html
@js
  import { 4kBold, 4kBoldDuotone, 4kBroken } from '@stacksjs/iconify-solar'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    4kBold: renderIcon(4kBold, { size: 24 }),
    4kBoldDuotone: renderIcon(4kBoldDuotone, { size: 24, color: '#4a90e2' }),
    4kBroken: renderIcon(4kBroken, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.4kBold !!}
  {!! icons.4kBoldDuotone !!}
  {!! icons.4kBroken !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 4kBold, 4kBoldDuotone, 4kBroken } from '@stacksjs/iconify-solar'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(4kBold, { size: 24 })

// With custom color
const coloredIcon = renderIcon(4kBoldDuotone, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(4kBroken, {
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

This package contains **7404** icons. Here are some examples:

- `4kBold`
- `4kBoldDuotone`
- `4kBroken`
- `4kLineDuotone`
- `4kLinear`

...and 7394 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/solar/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 4kBold, 4kBoldDuotone, 4kBroken, 4kLineDuotone } from '@stacksjs/iconify-solar'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    4kBold: renderIcon(4kBold, { size: 20, class: 'nav-icon' }),
    4kBoldDuotone: renderIcon(4kBoldDuotone, { size: 20, class: 'nav-icon' }),
    4kBroken: renderIcon(4kBroken, { size: 20, class: 'nav-icon' }),
    4kLineDuotone: renderIcon(4kLineDuotone, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.4kBold !!} Home</a>
  <a href="/about">{!! navIcons.4kBoldDuotone !!} About</a>
  <a href="/contact">{!! navIcons.4kBroken !!} Contact</a>
  <a href="/settings">{!! navIcons.4kLineDuotone !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 4kBold } from '@stacksjs/iconify-solar'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(4kBold, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-solar'
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
   import { 4kBold, 4kBoldDuotone } from '@stacksjs/iconify-solar'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-solar'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 4kBold } from '@stacksjs/iconify-solar'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(4kBold, { size: 24 })
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
import { 4kBold } from '@stacksjs/iconify-solar'

// Icons are typed as IconData
const myIcon: IconData = 4kBold
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: 480 Design ([Website](https://www.figma.com/community/file/1166831539721848736))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/solar/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/solar/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
