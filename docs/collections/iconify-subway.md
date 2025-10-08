# Subway Icon Set

> Subway Icon Set icons for stx from Iconify

## Overview

This package provides access to 306 icons from the Subway Icon Set collection through the stx iconify integration.

**Collection ID:** `subway`
**Total Icons:** 306
**Author:** Mariusz Ostrowski ([Website](https://github.com/mariuszostrowski/subway))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-subway
```

## Quick Start

### In stx Templates

```html
@js
  import { add, add1, addPlaylist } from '@stacksjs/iconify-subway'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    add: renderIcon(add, { size: 24 }),
    add1: renderIcon(add1, { size: 24, color: '#4a90e2' }),
    addPlaylist: renderIcon(addPlaylist, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.add !!}
  {!! icons.add1 !!}
  {!! icons.addPlaylist !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { add, add1, addPlaylist } from '@stacksjs/iconify-subway'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(add, { size: 24 })

// With custom color
const coloredIcon = renderIcon(add1, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addPlaylist, {
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

This package contains **306** icons. Here are some examples:

- `add`
- `add1`
- `addPlaylist`
- `admin`
- `admin1`

...and 296 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/subway/).

## Usage Examples

### Navigation Menu

```html
@js
  import { add, add1, addPlaylist, admin } from '@stacksjs/iconify-subway'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    add1: renderIcon(add1, { size: 20, class: 'nav-icon' }),
    addPlaylist: renderIcon(addPlaylist, { size: 20, class: 'nav-icon' }),
    admin: renderIcon(admin, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.add !!} Home</a>
  <a href="/about">{!! navIcons.add1 !!} About</a>
  <a href="/contact">{!! navIcons.addPlaylist !!} Contact</a>
  <a href="/settings">{!! navIcons.admin !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { add } from '@stacksjs/iconify-subway'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(add, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-subway'
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
   import { add, add1 } from '@stacksjs/iconify-subway'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-subway'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { add } from '@stacksjs/iconify-subway'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(add, { size: 24 })
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
import { add } from '@stacksjs/iconify-subway'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Mariusz Ostrowski ([Website](https://github.com/mariuszostrowski/subway))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/subway/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/subway/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
