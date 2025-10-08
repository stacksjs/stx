# Icons8 Windows 10 Icons

> Icons8 Windows 10 Icons icons for stx from Iconify

## Overview

This package provides access to 234 icons from the Icons8 Windows 10 Icons collection through the stx iconify integration.

**Collection ID:** `icons8`
**Total Icons:** 234
**Author:** Icons8 ([Website](https://github.com/icons8/windows-10-icons))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-icons8
```

## Quick Start

### In stx Templates

```html
@js
  import { addShoppingCart, addUser, adventures } from '@stacksjs/iconify-icons8'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addShoppingCart: renderIcon(addShoppingCart, { size: 24 }),
    addUser: renderIcon(addUser, { size: 24, color: '#4a90e2' }),
    adventures: renderIcon(adventures, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addShoppingCart !!}
  {!! icons.addUser !!}
  {!! icons.adventures !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addShoppingCart, addUser, adventures } from '@stacksjs/iconify-icons8'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addShoppingCart, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addUser, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adventures, {
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

This package contains **234** icons. Here are some examples:

- `addShoppingCart`
- `addUser`
- `adventures`
- `advertising`
- `airport`

...and 224 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/icons8/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addShoppingCart, addUser, adventures, advertising } from '@stacksjs/iconify-icons8'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addShoppingCart: renderIcon(addShoppingCart, { size: 20, class: 'nav-icon' }),
    addUser: renderIcon(addUser, { size: 20, class: 'nav-icon' }),
    adventures: renderIcon(adventures, { size: 20, class: 'nav-icon' }),
    advertising: renderIcon(advertising, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addShoppingCart !!} Home</a>
  <a href="/about">{!! navIcons.addUser !!} About</a>
  <a href="/contact">{!! navIcons.adventures !!} Contact</a>
  <a href="/settings">{!! navIcons.advertising !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addShoppingCart } from '@stacksjs/iconify-icons8'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addShoppingCart, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-icons8'
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
   import { addShoppingCart, addUser } from '@stacksjs/iconify-icons8'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-icons8'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addShoppingCart } from '@stacksjs/iconify-icons8'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addShoppingCart, { size: 24 })
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
import { addShoppingCart } from '@stacksjs/iconify-icons8'

// Icons are typed as IconData
const myIcon: IconData = addShoppingCart
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Icons8 ([Website](https://github.com/icons8/windows-10-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/icons8/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/icons8/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
