# Gridicons

> Gridicons icons for stx from Iconify

## Overview

This package provides access to 207 icons from the Gridicons collection through the stx iconify integration.

**Collection ID:** `gridicons`
**Total Icons:** 207
**Author:** Automattic ([Website](https://github.com/Automattic/gridicons))
**License:** GPL 2.0 ([Details](https://github.com/Automattic/gridicons/blob/trunk/LICENSE.md))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gridicons
```

## Quick Start

### In stx Templates

```html
@js
  import { add, addImage, addOutline } from '@stacksjs/iconify-gridicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    add: renderIcon(add, { size: 24 }),
    addImage: renderIcon(addImage, { size: 24, color: '#4a90e2' }),
    addOutline: renderIcon(addOutline, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.add !!}
  {!! icons.addImage !!}
  {!! icons.addOutline !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { add, addImage, addOutline } from '@stacksjs/iconify-gridicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(add, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addImage, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addOutline, {
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

This package contains **207** icons. Here are some examples:

- `add`
- `addImage`
- `addOutline`
- `alignCenter`
- `alignImageCenter`

...and 197 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/gridicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { add, addImage, addOutline, alignCenter } from '@stacksjs/iconify-gridicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    addImage: renderIcon(addImage, { size: 20, class: 'nav-icon' }),
    addOutline: renderIcon(addOutline, { size: 20, class: 'nav-icon' }),
    alignCenter: renderIcon(alignCenter, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.add !!} Home</a>
  <a href="/about">{!! navIcons.addImage !!} About</a>
  <a href="/contact">{!! navIcons.addOutline !!} Contact</a>
  <a href="/settings">{!! navIcons.alignCenter !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { add } from '@stacksjs/iconify-gridicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(add, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-gridicons'
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
   import { add, addImage } from '@stacksjs/iconify-gridicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-gridicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { add } from '@stacksjs/iconify-gridicons'
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
import { add } from '@stacksjs/iconify-gridicons'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL 2.0

See [license details](https://github.com/Automattic/gridicons/blob/trunk/LICENSE.md) for more information.

## Credits

- **Icons**: Automattic ([Website](https://github.com/Automattic/gridicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gridicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gridicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
