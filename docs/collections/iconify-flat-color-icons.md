# Flat Color Icons

> Flat Color Icons icons for stx from Iconify

## Overview

This package provides access to 329 icons from the Flat Color Icons collection through the stx iconify integration.

**Collection ID:** `flat-color-icons`
**Total Icons:** 329
**Author:** Icons8 ([Website](https://github.com/icons8/flat-Color-icons))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flat-color-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { about, acceptDatabase, addColumn } from '@stacksjs/iconify-flat-color-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    about: renderIcon(about, { size: 24 }),
    acceptDatabase: renderIcon(acceptDatabase, { size: 24, color: '#4a90e2' }),
    addColumn: renderIcon(addColumn, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.about !!}
  {!! icons.acceptDatabase !!}
  {!! icons.addColumn !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { about, acceptDatabase, addColumn } from '@stacksjs/iconify-flat-color-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(about, { size: 24 })

// With custom color
const coloredIcon = renderIcon(acceptDatabase, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addColumn, {
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

This package contains **329** icons. Here are some examples:

- `about`
- `acceptDatabase`
- `addColumn`
- `addDatabase`
- `addImage`

...and 319 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/flat-color-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { about, acceptDatabase, addColumn, addDatabase } from '@stacksjs/iconify-flat-color-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    about: renderIcon(about, { size: 20, class: 'nav-icon' }),
    acceptDatabase: renderIcon(acceptDatabase, { size: 20, class: 'nav-icon' }),
    addColumn: renderIcon(addColumn, { size: 20, class: 'nav-icon' }),
    addDatabase: renderIcon(addDatabase, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.about !!} Home</a>
  <a href="/about">{!! navIcons.acceptDatabase !!} About</a>
  <a href="/contact">{!! navIcons.addColumn !!} Contact</a>
  <a href="/settings">{!! navIcons.addDatabase !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { about } from '@stacksjs/iconify-flat-color-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(about, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-flat-color-icons'
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
   import { about, acceptDatabase } from '@stacksjs/iconify-flat-color-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-flat-color-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { about } from '@stacksjs/iconify-flat-color-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(about, { size: 24 })
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
import { about } from '@stacksjs/iconify-flat-color-icons'

// Icons are typed as IconData
const myIcon: IconData = about
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Icons8 ([Website](https://github.com/icons8/flat-Color-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flat-color-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flat-color-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
