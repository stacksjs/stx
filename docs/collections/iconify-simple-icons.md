# Simple Icons

> Simple Icons icons for stx from Iconify

## Overview

This package provides access to 3594 icons from the Simple Icons collection through the stx iconify integration.

**Collection ID:** `simple-icons`
**Total Icons:** 3594
**Author:** Simple Icons Collaborators ([Website](https://github.com/simple-icons/simple-icons))
**License:** CC0 1.0 ([Details](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-simple-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { 42, 1001tracklists, 1and1 } from '@stacksjs/iconify-simple-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    42: renderIcon(42, { size: 24 }),
    1001tracklists: renderIcon(1001tracklists, { size: 24, color: '#4a90e2' }),
    1and1: renderIcon(1and1, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.42 !!}
  {!! icons.1001tracklists !!}
  {!! icons.1and1 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 42, 1001tracklists, 1and1 } from '@stacksjs/iconify-simple-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(42, { size: 24 })

// With custom color
const coloredIcon = renderIcon(1001tracklists, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(1and1, {
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

This package contains **3594** icons. Here are some examples:

- `42`
- `1001tracklists`
- `1and1`
- `1dot1dot1dot1`
- `1panel`

...and 3584 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/simple-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 42, 1001tracklists, 1and1, 1dot1dot1dot1 } from '@stacksjs/iconify-simple-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    42: renderIcon(42, { size: 20, class: 'nav-icon' }),
    1001tracklists: renderIcon(1001tracklists, { size: 20, class: 'nav-icon' }),
    1and1: renderIcon(1and1, { size: 20, class: 'nav-icon' }),
    1dot1dot1dot1: renderIcon(1dot1dot1dot1, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.42 !!} Home</a>
  <a href="/about">{!! navIcons.1001tracklists !!} About</a>
  <a href="/contact">{!! navIcons.1and1 !!} Contact</a>
  <a href="/settings">{!! navIcons.1dot1dot1dot1 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 42 } from '@stacksjs/iconify-simple-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(42, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-simple-icons'
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
   import { 42, 1001tracklists } from '@stacksjs/iconify-simple-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-simple-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 42 } from '@stacksjs/iconify-simple-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(42, { size: 24 })
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
import { 42 } from '@stacksjs/iconify-simple-icons'

// Icons are typed as IconData
const myIcon: IconData = 42
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0 1.0

See [license details](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md) for more information.

## Credits

- **Icons**: Simple Icons Collaborators ([Website](https://github.com/simple-icons/simple-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/simple-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/simple-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
