# Icalicons

> Icalicons icons for stx from Iconify

## Overview

This package provides access to 84 icons from the Icalicons collection through the stx iconify integration.

**Collection ID:** `il`
**Total Icons:** 84
**Author:** Icalia Labs
**License:** MIT

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-il
```

## Quick Start

### In stx Templates

```html
@js
  import { addUser, arrowDown, arrowLeft } from '@stacksjs/iconify-il'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addUser: renderIcon(addUser, { size: 24 }),
    arrowDown: renderIcon(arrowDown, { size: 24, color: '#4a90e2' }),
    arrowLeft: renderIcon(arrowLeft, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addUser !!}
  {!! icons.arrowDown !!}
  {!! icons.arrowLeft !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addUser, arrowDown, arrowLeft } from '@stacksjs/iconify-il'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addUser, { size: 24 })

// With custom color
const coloredIcon = renderIcon(arrowDown, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(arrowLeft, {
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

This package contains **84** icons. Here are some examples:

- `addUser`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`

...and 74 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/il/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addUser, arrowDown, arrowLeft, arrowRight } from '@stacksjs/iconify-il'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addUser: renderIcon(addUser, { size: 20, class: 'nav-icon' }),
    arrowDown: renderIcon(arrowDown, { size: 20, class: 'nav-icon' }),
    arrowLeft: renderIcon(arrowLeft, { size: 20, class: 'nav-icon' }),
    arrowRight: renderIcon(arrowRight, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addUser !!} Home</a>
  <a href="/about">{!! navIcons.arrowDown !!} About</a>
  <a href="/contact">{!! navIcons.arrowLeft !!} Contact</a>
  <a href="/settings">{!! navIcons.arrowRight !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addUser } from '@stacksjs/iconify-il'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addUser, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-il'
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
   import { addUser, arrowDown } from '@stacksjs/iconify-il'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-il'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addUser } from '@stacksjs/iconify-il'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addUser, { size: 24 })
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
import { addUser } from '@stacksjs/iconify-il'

// Icons are typed as IconData
const myIcon: IconData = addUser
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Icalia Labs
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/il/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/il/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
