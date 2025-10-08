# Sharp free icons

> Sharp free icons icons for stx from Iconify

## Overview

This package provides access to 1500 icons from the Sharp free icons collection through the stx iconify integration.

**Collection ID:** `streamline-sharp`
**Total Icons:** 1500
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-sharp
```

## Quick Start

### In stx Templates

```html
@js
  import { 3dMove, 3dMoveRemix, 3dMoveSolid } from '@stacksjs/iconify-streamline-sharp'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3dMove: renderIcon(3dMove, { size: 24 }),
    3dMoveRemix: renderIcon(3dMoveRemix, { size: 24, color: '#4a90e2' }),
    3dMoveSolid: renderIcon(3dMoveSolid, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3dMove !!}
  {!! icons.3dMoveRemix !!}
  {!! icons.3dMoveSolid !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3dMove, 3dMoveRemix, 3dMoveSolid } from '@stacksjs/iconify-streamline-sharp'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3dMove, { size: 24 })

// With custom color
const coloredIcon = renderIcon(3dMoveRemix, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dMoveSolid, {
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

This package contains **1500** icons. Here are some examples:

- `3dMove`
- `3dMoveRemix`
- `3dMoveSolid`
- `3dRotateXAxisRemix`
- `3dRotateYAxis`

...and 1490 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-sharp/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dMove, 3dMoveRemix, 3dMoveSolid, 3dRotateXAxisRemix } from '@stacksjs/iconify-streamline-sharp'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3dMove: renderIcon(3dMove, { size: 20, class: 'nav-icon' }),
    3dMoveRemix: renderIcon(3dMoveRemix, { size: 20, class: 'nav-icon' }),
    3dMoveSolid: renderIcon(3dMoveSolid, { size: 20, class: 'nav-icon' }),
    3dRotateXAxisRemix: renderIcon(3dRotateXAxisRemix, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3dMove !!} Home</a>
  <a href="/about">{!! navIcons.3dMoveRemix !!} About</a>
  <a href="/contact">{!! navIcons.3dMoveSolid !!} Contact</a>
  <a href="/settings">{!! navIcons.3dRotateXAxisRemix !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3dMove } from '@stacksjs/iconify-streamline-sharp'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3dMove, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-sharp'
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
   import { 3dMove, 3dMoveRemix } from '@stacksjs/iconify-streamline-sharp'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-sharp'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dMove } from '@stacksjs/iconify-streamline-sharp'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3dMove, { size: 24 })
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
import { 3dMove } from '@stacksjs/iconify-streamline-sharp'

// Icons are typed as IconData
const myIcon: IconData = 3dMove
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-sharp/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-sharp/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
