# Lucide

> Lucide icons for stx from Iconify

## Overview

This package provides access to 3 icons from the Lucide collection through the stx iconify integration.

**Collection ID:** `lucide`
**Total Icons:** 3
**Author:** Lucide Contributors ([Website](https://github.com/lucide-icons/lucide))
**License:** ISC ([Details](https://github.com/lucide-icons/lucide/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lucide
```

## Quick Start

### In stx Templates

```html
@js
  import { house, settings, user } from '@stacksjs/iconify-lucide'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    house: renderIcon(house, { size: 24 }),
    settings: renderIcon(settings, { size: 24, color: '#4a90e2' }),
    user: renderIcon(user, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.house !!}
  {!! icons.settings !!}
  {!! icons.user !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { house, settings, user } from '@stacksjs/iconify-lucide'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(house, { size: 24 })

// With custom color
const coloredIcon = renderIcon(settings, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(user, {
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

This package contains **3** icons. Here are some examples:

- `house`
- `settings`
- `user`


To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/lucide/).

## Usage Examples

### Navigation Menu

```html
@js
  import { house, settings, user } from '@stacksjs/iconify-lucide'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    house: renderIcon(house, { size: 20, class: 'nav-icon' }),
    settings: renderIcon(settings, { size: 20, class: 'nav-icon' }),
    user: renderIcon(user, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.house !!} Home</a>
  <a href="/about">{!! navIcons.settings !!} About</a>
  <a href="/contact">{!! navIcons.user !!} Contact</a>
  <a href="/settings">{!! navIcons.icon4 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { house } from '@stacksjs/iconify-lucide'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(house, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-lucide'
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
   import { house, settings } from '@stacksjs/iconify-lucide'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-lucide'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { house } from '@stacksjs/iconify-lucide'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(house, { size: 24 })
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
import { house } from '@stacksjs/iconify-lucide'

// Icons are typed as IconData
const myIcon: IconData = house
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

ISC

See [license details](https://github.com/lucide-icons/lucide/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Lucide Contributors ([Website](https://github.com/lucide-icons/lucide))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lucide/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lucide/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
