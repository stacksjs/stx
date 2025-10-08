# Plump free icons

> Plump free icons icons for stx from Iconify

## Overview

This package provides access to 1499 icons from the Plump free icons collection through the stx iconify integration.

**Collection ID:** `streamline-plump`
**Total Icons:** 1499
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-plump
```

## Quick Start

### In stx Templates

```html
@js
  import { 3dCoordinateAxis, 3dCoordinateAxisRemix, 3dCoordinateAxisSolid } from '@stacksjs/iconify-streamline-plump'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3dCoordinateAxis: renderIcon(3dCoordinateAxis, { size: 24 }),
    3dCoordinateAxisRemix: renderIcon(3dCoordinateAxisRemix, { size: 24, color: '#4a90e2' }),
    3dCoordinateAxisSolid: renderIcon(3dCoordinateAxisSolid, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3dCoordinateAxis !!}
  {!! icons.3dCoordinateAxisRemix !!}
  {!! icons.3dCoordinateAxisSolid !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3dCoordinateAxis, 3dCoordinateAxisRemix, 3dCoordinateAxisSolid } from '@stacksjs/iconify-streamline-plump'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3dCoordinateAxis, { size: 24 })

// With custom color
const coloredIcon = renderIcon(3dCoordinateAxisRemix, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dCoordinateAxisSolid, {
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

This package contains **1499** icons. Here are some examples:

- `3dCoordinateAxis`
- `3dCoordinateAxisRemix`
- `3dCoordinateAxisSolid`
- `addBellNotification`
- `addBellNotificationRemix`

...and 1489 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-plump/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dCoordinateAxis, 3dCoordinateAxisRemix, 3dCoordinateAxisSolid, addBellNotification } from '@stacksjs/iconify-streamline-plump'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3dCoordinateAxis: renderIcon(3dCoordinateAxis, { size: 20, class: 'nav-icon' }),
    3dCoordinateAxisRemix: renderIcon(3dCoordinateAxisRemix, { size: 20, class: 'nav-icon' }),
    3dCoordinateAxisSolid: renderIcon(3dCoordinateAxisSolid, { size: 20, class: 'nav-icon' }),
    addBellNotification: renderIcon(addBellNotification, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3dCoordinateAxis !!} Home</a>
  <a href="/about">{!! navIcons.3dCoordinateAxisRemix !!} About</a>
  <a href="/contact">{!! navIcons.3dCoordinateAxisSolid !!} Contact</a>
  <a href="/settings">{!! navIcons.addBellNotification !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-plump'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3dCoordinateAxis, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-plump'
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
   import { 3dCoordinateAxis, 3dCoordinateAxisRemix } from '@stacksjs/iconify-streamline-plump'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-plump'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-plump'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3dCoordinateAxis, { size: 24 })
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
import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-plump'

// Icons are typed as IconData
const myIcon: IconData = 3dCoordinateAxis
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-plump/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-plump/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
