# Entypo+

> Entypo+ icons for stx from Iconify

## Overview

This package provides access to 321 icons from the Entypo+ collection through the stx iconify integration.

**Collection ID:** `entypo`
**Total Icons:** 321
**Author:** Daniel Bruce ([Website](https://github.com/chancancode/entypo-plus))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-entypo
```

## Quick Start

### In stx Templates

```html
@js
  import { addToList, addUser, address } from '@stacksjs/iconify-entypo'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addToList: renderIcon(addToList, { size: 24 }),
    addUser: renderIcon(addUser, { size: 24, color: '#4a90e2' }),
    address: renderIcon(address, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addToList !!}
  {!! icons.addUser !!}
  {!! icons.address !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addToList, addUser, address } from '@stacksjs/iconify-entypo'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addToList, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addUser, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(address, {
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

This package contains **321** icons. Here are some examples:

- `addToList`
- `addUser`
- `address`
- `adjust`
- `air`

...and 311 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/entypo/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addToList, addUser, address, adjust } from '@stacksjs/iconify-entypo'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addToList: renderIcon(addToList, { size: 20, class: 'nav-icon' }),
    addUser: renderIcon(addUser, { size: 20, class: 'nav-icon' }),
    address: renderIcon(address, { size: 20, class: 'nav-icon' }),
    adjust: renderIcon(adjust, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addToList !!} Home</a>
  <a href="/about">{!! navIcons.addUser !!} About</a>
  <a href="/contact">{!! navIcons.address !!} Contact</a>
  <a href="/settings">{!! navIcons.adjust !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addToList } from '@stacksjs/iconify-entypo'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addToList, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-entypo'
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
   import { addToList, addUser } from '@stacksjs/iconify-entypo'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-entypo'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addToList } from '@stacksjs/iconify-entypo'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addToList, { size: 24 })
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
import { addToList } from '@stacksjs/iconify-entypo'

// Icons are typed as IconData
const myIcon: IconData = addToList
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Daniel Bruce ([Website](https://github.com/chancancode/entypo-plus))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/entypo/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/entypo/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
