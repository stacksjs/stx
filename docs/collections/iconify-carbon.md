# Carbon

> Carbon icons for stx from Iconify

## Overview

This package provides access to 2508 icons from the Carbon collection through the stx iconify integration.

**Collection ID:** `carbon`
**Total Icons:** 2508
**Author:** IBM ([Website](https://github.com/carbon-design-system/carbon/tree/main/packages/icons))
**License:** Apache 2.0
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-carbon
```

## Quick Start

### In stx Templates

```html
@js
  import { 3dCursor, 3dCursorAlt, 3dCurveAutoColon } from '@stacksjs/iconify-carbon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3dCursor: renderIcon(3dCursor, { size: 24 }),
    3dCursorAlt: renderIcon(3dCursorAlt, { size: 24, color: '#4a90e2' }),
    3dCurveAutoColon: renderIcon(3dCurveAutoColon, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3dCursor !!}
  {!! icons.3dCursorAlt !!}
  {!! icons.3dCurveAutoColon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3dCursor, 3dCursorAlt, 3dCurveAutoColon } from '@stacksjs/iconify-carbon'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3dCursor, { size: 24 })

// With custom color
const coloredIcon = renderIcon(3dCursorAlt, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dCurveAutoColon, {
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

This package contains **2508** icons. Here are some examples:

- `3dCursor`
- `3dCursorAlt`
- `3dCurveAutoColon`
- `3dCurveAutoVessels`
- `3dCurveManual`

...and 2498 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/carbon/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dCursor, 3dCursorAlt, 3dCurveAutoColon, 3dCurveAutoVessels } from '@stacksjs/iconify-carbon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3dCursor: renderIcon(3dCursor, { size: 20, class: 'nav-icon' }),
    3dCursorAlt: renderIcon(3dCursorAlt, { size: 20, class: 'nav-icon' }),
    3dCurveAutoColon: renderIcon(3dCurveAutoColon, { size: 20, class: 'nav-icon' }),
    3dCurveAutoVessels: renderIcon(3dCurveAutoVessels, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3dCursor !!} Home</a>
  <a href="/about">{!! navIcons.3dCursorAlt !!} About</a>
  <a href="/contact">{!! navIcons.3dCurveAutoColon !!} Contact</a>
  <a href="/settings">{!! navIcons.3dCurveAutoVessels !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3dCursor } from '@stacksjs/iconify-carbon'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3dCursor, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-carbon'
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
   import { 3dCursor, 3dCursorAlt } from '@stacksjs/iconify-carbon'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-carbon'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dCursor } from '@stacksjs/iconify-carbon'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3dCursor, { size: 24 })
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
import { 3dCursor } from '@stacksjs/iconify-carbon'

// Icons are typed as IconData
const myIcon: IconData = 3dCursor
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0



## Credits

- **Icons**: IBM ([Website](https://github.com/carbon-design-system/carbon/tree/main/packages/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/carbon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/carbon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
