# Line Awesome

> Line Awesome icons for stx from Iconify

## Overview

This package provides access to 1544 icons from the Line Awesome collection through the stx iconify integration.

**Collection ID:** `la`
**Total Icons:** 1544
**Author:** Icons8 ([Website](https://github.com/icons8/line-awesome))
**License:** Apache 2.0 ([Details](https://www.apache.org/licenses/LICENSE-2.0))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-la
```

## Quick Start

### In stx Templates

```html
@js
  import { 500px, accessibleIcon, accusoft } from '@stacksjs/iconify-la'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    500px: renderIcon(500px, { size: 24 }),
    accessibleIcon: renderIcon(accessibleIcon, { size: 24, color: '#4a90e2' }),
    accusoft: renderIcon(accusoft, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.500px !!}
  {!! icons.accessibleIcon !!}
  {!! icons.accusoft !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 500px, accessibleIcon, accusoft } from '@stacksjs/iconify-la'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(500px, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessibleIcon, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accusoft, {
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

This package contains **1544** icons. Here are some examples:

- `500px`
- `accessibleIcon`
- `accusoft`
- `acquisitionsIncorporated`
- `ad`

...and 1534 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/la/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 500px, accessibleIcon, accusoft, acquisitionsIncorporated } from '@stacksjs/iconify-la'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    accessibleIcon: renderIcon(accessibleIcon, { size: 20, class: 'nav-icon' }),
    accusoft: renderIcon(accusoft, { size: 20, class: 'nav-icon' }),
    acquisitionsIncorporated: renderIcon(acquisitionsIncorporated, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.500px !!} Home</a>
  <a href="/about">{!! navIcons.accessibleIcon !!} About</a>
  <a href="/contact">{!! navIcons.accusoft !!} Contact</a>
  <a href="/settings">{!! navIcons.acquisitionsIncorporated !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 500px } from '@stacksjs/iconify-la'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(500px, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-la'
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
   import { 500px, accessibleIcon } from '@stacksjs/iconify-la'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-la'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-la'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(500px, { size: 24 })
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
import { 500px } from '@stacksjs/iconify-la'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://www.apache.org/licenses/LICENSE-2.0) for more information.

## Credits

- **Icons**: Icons8 ([Website](https://github.com/icons8/line-awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/la/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/la/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
