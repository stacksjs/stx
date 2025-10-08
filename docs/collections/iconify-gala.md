# Gala Icons

> Gala Icons icons for stx from Iconify

## Overview

This package provides access to 51 icons from the Gala Icons collection through the stx iconify integration.

**Collection ID:** `gala`
**Total Icons:** 51
**Author:** Jake Wells ([Website](https://github.com/cyberalien/gala-icons))
**License:** GPL ([Details](https://github.com/cyberalien/gala-icons/blob/main/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gala
```

## Quick Start

### In stx Templates

```html
@js
  import { add, airplay, apple } from '@stacksjs/iconify-gala'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    add: renderIcon(add, { size: 24 }),
    airplay: renderIcon(airplay, { size: 24, color: '#4a90e2' }),
    apple: renderIcon(apple, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.add !!}
  {!! icons.airplay !!}
  {!! icons.apple !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { add, airplay, apple } from '@stacksjs/iconify-gala'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(add, { size: 24 })

// With custom color
const coloredIcon = renderIcon(airplay, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(apple, {
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

This package contains **51** icons. Here are some examples:

- `add`
- `airplay`
- `apple`
- `bag`
- `bell`

...and 41 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/gala/).

## Usage Examples

### Navigation Menu

```html
@js
  import { add, airplay, apple, bag } from '@stacksjs/iconify-gala'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    airplay: renderIcon(airplay, { size: 20, class: 'nav-icon' }),
    apple: renderIcon(apple, { size: 20, class: 'nav-icon' }),
    bag: renderIcon(bag, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.add !!} Home</a>
  <a href="/about">{!! navIcons.airplay !!} About</a>
  <a href="/contact">{!! navIcons.apple !!} Contact</a>
  <a href="/settings">{!! navIcons.bag !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { add } from '@stacksjs/iconify-gala'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(add, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-gala'
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
   import { add, airplay } from '@stacksjs/iconify-gala'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-gala'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { add } from '@stacksjs/iconify-gala'
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
import { add } from '@stacksjs/iconify-gala'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL

See [license details](https://github.com/cyberalien/gala-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Jake Wells ([Website](https://github.com/cyberalien/gala-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gala/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gala/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
