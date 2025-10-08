# Game Icons

> Game Icons icons for stx from Iconify

## Overview

This package provides access to 4123 icons from the Game Icons collection through the stx iconify integration.

**Collection ID:** `game-icons`
**Total Icons:** 4123
**Author:** GameIcons ([Website](https://github.com/game-icons/icons))
**License:** CC BY 3.0 ([Details](https://github.com/game-icons/icons/blob/master/license.txt))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-game-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { 3dGlasses, 3dHammer, 3dMeeple } from '@stacksjs/iconify-game-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3dGlasses: renderIcon(3dGlasses, { size: 24 }),
    3dHammer: renderIcon(3dHammer, { size: 24, color: '#4a90e2' }),
    3dMeeple: renderIcon(3dMeeple, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3dGlasses !!}
  {!! icons.3dHammer !!}
  {!! icons.3dMeeple !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3dGlasses, 3dHammer, 3dMeeple } from '@stacksjs/iconify-game-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3dGlasses, { size: 24 })

// With custom color
const coloredIcon = renderIcon(3dHammer, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dMeeple, {
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

This package contains **4123** icons. Here are some examples:

- `3dGlasses`
- `3dHammer`
- `3dMeeple`
- `3dStairs`
- `abacus`

...and 4113 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/game-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dGlasses, 3dHammer, 3dMeeple, 3dStairs } from '@stacksjs/iconify-game-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3dGlasses: renderIcon(3dGlasses, { size: 20, class: 'nav-icon' }),
    3dHammer: renderIcon(3dHammer, { size: 20, class: 'nav-icon' }),
    3dMeeple: renderIcon(3dMeeple, { size: 20, class: 'nav-icon' }),
    3dStairs: renderIcon(3dStairs, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3dGlasses !!} Home</a>
  <a href="/about">{!! navIcons.3dHammer !!} About</a>
  <a href="/contact">{!! navIcons.3dMeeple !!} Contact</a>
  <a href="/settings">{!! navIcons.3dStairs !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3dGlasses } from '@stacksjs/iconify-game-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3dGlasses, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-game-icons'
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
   import { 3dGlasses, 3dHammer } from '@stacksjs/iconify-game-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-game-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dGlasses } from '@stacksjs/iconify-game-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3dGlasses, { size: 24 })
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
import { 3dGlasses } from '@stacksjs/iconify-game-icons'

// Icons are typed as IconData
const myIcon: IconData = 3dGlasses
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 3.0

See [license details](https://github.com/game-icons/icons/blob/master/license.txt) for more information.

## Credits

- **Icons**: GameIcons ([Website](https://github.com/game-icons/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/game-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/game-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
