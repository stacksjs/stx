# Feather Icon

> Feather Icon icons for stx from Iconify

## Overview

This package provides access to 255 icons from the Feather Icon collection through the stx iconify integration.

**Collection ID:** `fe`
**Total Icons:** 255
**Author:** Megumi Hano ([Website](https://github.com/feathericon/feathericon))
**License:** MIT ([Details](https://github.com/feathericon/feathericon/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fe
```

## Quick Start

### In stx Templates

```html
@js
  import { activity, addCart, alignBottom } from '@stacksjs/iconify-fe'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    activity: renderIcon(activity, { size: 24 }),
    addCart: renderIcon(addCart, { size: 24, color: '#4a90e2' }),
    alignBottom: renderIcon(alignBottom, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.activity !!}
  {!! icons.addCart !!}
  {!! icons.alignBottom !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { activity, addCart, alignBottom } from '@stacksjs/iconify-fe'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(activity, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addCart, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alignBottom, {
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

This package contains **255** icons. Here are some examples:

- `activity`
- `addCart`
- `alignBottom`
- `alignCenter`
- `alignLeft`

...and 245 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fe/).

## Usage Examples

### Navigation Menu

```html
@js
  import { activity, addCart, alignBottom, alignCenter } from '@stacksjs/iconify-fe'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    activity: renderIcon(activity, { size: 20, class: 'nav-icon' }),
    addCart: renderIcon(addCart, { size: 20, class: 'nav-icon' }),
    alignBottom: renderIcon(alignBottom, { size: 20, class: 'nav-icon' }),
    alignCenter: renderIcon(alignCenter, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.activity !!} Home</a>
  <a href="/about">{!! navIcons.addCart !!} About</a>
  <a href="/contact">{!! navIcons.alignBottom !!} Contact</a>
  <a href="/settings">{!! navIcons.alignCenter !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { activity } from '@stacksjs/iconify-fe'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(activity, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fe'
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
   import { activity, addCart } from '@stacksjs/iconify-fe'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fe'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { activity } from '@stacksjs/iconify-fe'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(activity, { size: 24 })
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
import { activity } from '@stacksjs/iconify-fe'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/feathericon/feathericon/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Megumi Hano ([Website](https://github.com/feathericon/feathericon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fe/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fe/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
