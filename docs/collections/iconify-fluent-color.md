# Fluent UI System Color Icons

> Fluent UI System Color Icons icons for stx from Iconify

## Overview

This package provides access to 889 icons from the Fluent UI System Color Icons collection through the stx iconify integration.

**Collection ID:** `fluent-color`
**Total Icons:** 889
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-system-icons))
**License:** MIT ([Details](https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-fluent-color
```

## Quick Start

### In stx Templates

```html
@js
  import { addCircle16, addCircle20, addCircle24 } from '@stacksjs/iconify-fluent-color'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addCircle16: renderIcon(addCircle16, { size: 24 }),
    addCircle20: renderIcon(addCircle20, { size: 24, color: '#4a90e2' }),
    addCircle24: renderIcon(addCircle24, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addCircle16 !!}
  {!! icons.addCircle20 !!}
  {!! icons.addCircle24 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addCircle16, addCircle20, addCircle24 } from '@stacksjs/iconify-fluent-color'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addCircle16, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addCircle20, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addCircle24, {
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

This package contains **889** icons. Here are some examples:

- `addCircle16`
- `addCircle20`
- `addCircle24`
- `addCircle28`
- `addCircle32`

...and 879 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fluent-color/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addCircle16, addCircle20, addCircle24, addCircle28 } from '@stacksjs/iconify-fluent-color'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addCircle16: renderIcon(addCircle16, { size: 20, class: 'nav-icon' }),
    addCircle20: renderIcon(addCircle20, { size: 20, class: 'nav-icon' }),
    addCircle24: renderIcon(addCircle24, { size: 20, class: 'nav-icon' }),
    addCircle28: renderIcon(addCircle28, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addCircle16 !!} Home</a>
  <a href="/about">{!! navIcons.addCircle20 !!} About</a>
  <a href="/contact">{!! navIcons.addCircle24 !!} Contact</a>
  <a href="/settings">{!! navIcons.addCircle28 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addCircle16 } from '@stacksjs/iconify-fluent-color'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addCircle16, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fluent-color'
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
   import { addCircle16, addCircle20 } from '@stacksjs/iconify-fluent-color'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fluent-color'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addCircle16 } from '@stacksjs/iconify-fluent-color'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addCircle16, { size: 24 })
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
import { addCircle16 } from '@stacksjs/iconify-fluent-color'

// Icons are typed as IconData
const myIcon: IconData = addCircle16
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-system-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fluent-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fluent-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
