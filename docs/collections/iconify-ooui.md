# OOUI

> OOUI icons for stx from Iconify

## Overview

This package provides access to 370 icons from the OOUI collection through the stx iconify integration.

**Collection ID:** `ooui`
**Total Icons:** 370
**Author:** OOUI Team ([Website](https://github.com/wikimedia/oojs-ui))
**License:** MIT ([Details](https://github.com/wikimedia/oojs-ui/blob/master/LICENSE-MIT))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ooui
```

## Quick Start

### In stx Templates

```html
@js
  import { add, alert, alignCenter } from '@stacksjs/iconify-ooui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    add: renderIcon(add, { size: 24 }),
    alert: renderIcon(alert, { size: 24, color: '#4a90e2' }),
    alignCenter: renderIcon(alignCenter, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.add !!}
  {!! icons.alert !!}
  {!! icons.alignCenter !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { add, alert, alignCenter } from '@stacksjs/iconify-ooui'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(add, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alert, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alignCenter, {
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

This package contains **370** icons. Here are some examples:

- `add`
- `alert`
- `alignCenter`
- `alignLeft`
- `alignRight`

...and 360 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ooui/).

## Usage Examples

### Navigation Menu

```html
@js
  import { add, alert, alignCenter, alignLeft } from '@stacksjs/iconify-ooui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    alert: renderIcon(alert, { size: 20, class: 'nav-icon' }),
    alignCenter: renderIcon(alignCenter, { size: 20, class: 'nav-icon' }),
    alignLeft: renderIcon(alignLeft, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.add !!} Home</a>
  <a href="/about">{!! navIcons.alert !!} About</a>
  <a href="/contact">{!! navIcons.alignCenter !!} Contact</a>
  <a href="/settings">{!! navIcons.alignLeft !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { add } from '@stacksjs/iconify-ooui'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(add, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ooui'
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
   import { add, alert } from '@stacksjs/iconify-ooui'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ooui'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { add } from '@stacksjs/iconify-ooui'
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
import { add } from '@stacksjs/iconify-ooui'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/wikimedia/oojs-ui/blob/master/LICENSE-MIT) for more information.

## Credits

- **Icons**: OOUI Team ([Website](https://github.com/wikimedia/oojs-ui))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ooui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ooui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
