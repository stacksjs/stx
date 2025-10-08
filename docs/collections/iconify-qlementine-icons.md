# Qlementine Icons

> Qlementine Icons icons for stx from Iconify

## Overview

This package provides access to 757 icons from the Qlementine Icons collection through the stx iconify integration.

**Collection ID:** `qlementine-icons`
**Total Icons:** 757
**Author:** Olivier Cléro ([Website](https://github.com/oclero/qlementine-icons))
**License:** MIT ([Details](https://github.com/oclero/qlementine-icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-qlementine-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { accessibility16, accordion16, addFile16 } from '@stacksjs/iconify-qlementine-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessibility16: renderIcon(accessibility16, { size: 24 }),
    accordion16: renderIcon(accordion16, { size: 24, color: '#4a90e2' }),
    addFile16: renderIcon(addFile16, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessibility16 !!}
  {!! icons.accordion16 !!}
  {!! icons.addFile16 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessibility16, accordion16, addFile16 } from '@stacksjs/iconify-qlementine-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessibility16, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accordion16, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addFile16, {
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

This package contains **757** icons. Here are some examples:

- `accessibility16`
- `accordion16`
- `addFile16`
- `addFolder16`
- `addToCart16`

...and 747 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/qlementine-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessibility16, accordion16, addFile16, addFolder16 } from '@stacksjs/iconify-qlementine-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessibility16: renderIcon(accessibility16, { size: 20, class: 'nav-icon' }),
    accordion16: renderIcon(accordion16, { size: 20, class: 'nav-icon' }),
    addFile16: renderIcon(addFile16, { size: 20, class: 'nav-icon' }),
    addFolder16: renderIcon(addFolder16, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessibility16 !!} Home</a>
  <a href="/about">{!! navIcons.accordion16 !!} About</a>
  <a href="/contact">{!! navIcons.addFile16 !!} Contact</a>
  <a href="/settings">{!! navIcons.addFolder16 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessibility16 } from '@stacksjs/iconify-qlementine-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessibility16, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-qlementine-icons'
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
   import { accessibility16, accordion16 } from '@stacksjs/iconify-qlementine-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-qlementine-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessibility16 } from '@stacksjs/iconify-qlementine-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessibility16, { size: 24 })
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
import { accessibility16 } from '@stacksjs/iconify-qlementine-icons'

// Icons are typed as IconData
const myIcon: IconData = accessibility16
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/oclero/qlementine-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Olivier Cléro ([Website](https://github.com/oclero/qlementine-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/qlementine-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/qlementine-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
