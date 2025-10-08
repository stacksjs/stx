# File Icons

> File Icons icons for stx from Iconify

## Overview

This package provides access to 930 icons from the File Icons collection through the stx iconify integration.

**Collection ID:** `file-icons`
**Total Icons:** 930
**Author:** John Gardner ([Website](https://github.com/file-icons/icons))
**License:** ISC ([Details](https://github.com/file-icons/icons/blob/master/LICENSE.md))
**Category:** Programming
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-file-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { 1c, 1cAlt, 3dModel } from '@stacksjs/iconify-file-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    1c: renderIcon(1c, { size: 24 }),
    1cAlt: renderIcon(1cAlt, { size: 24, color: '#4a90e2' }),
    3dModel: renderIcon(3dModel, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.1c !!}
  {!! icons.1cAlt !!}
  {!! icons.3dModel !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 1c, 1cAlt, 3dModel } from '@stacksjs/iconify-file-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(1c, { size: 24 })

// With custom color
const coloredIcon = renderIcon(1cAlt, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dModel, {
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

This package contains **930** icons. Here are some examples:

- `1c`
- `1cAlt`
- `3dModel`
- `3dsMax`
- `4d`

...and 920 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/file-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 1c, 1cAlt, 3dModel, 3dsMax } from '@stacksjs/iconify-file-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    1c: renderIcon(1c, { size: 20, class: 'nav-icon' }),
    1cAlt: renderIcon(1cAlt, { size: 20, class: 'nav-icon' }),
    3dModel: renderIcon(3dModel, { size: 20, class: 'nav-icon' }),
    3dsMax: renderIcon(3dsMax, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.1c !!} Home</a>
  <a href="/about">{!! navIcons.1cAlt !!} About</a>
  <a href="/contact">{!! navIcons.3dModel !!} Contact</a>
  <a href="/settings">{!! navIcons.3dsMax !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 1c } from '@stacksjs/iconify-file-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(1c, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-file-icons'
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
   import { 1c, 1cAlt } from '@stacksjs/iconify-file-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-file-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 1c } from '@stacksjs/iconify-file-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(1c, { size: 24 })
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
import { 1c } from '@stacksjs/iconify-file-icons'

// Icons are typed as IconData
const myIcon: IconData = 1c
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

ISC

See [license details](https://github.com/file-icons/icons/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: John Gardner ([Website](https://github.com/file-icons/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/file-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/file-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
