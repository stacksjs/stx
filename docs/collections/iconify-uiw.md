# uiw icons

> uiw icons icons for stx from Iconify

## Overview

This package provides access to 214 icons from the uiw icons collection through the stx iconify integration.

**Collection ID:** `uiw`
**Total Icons:** 214
**Author:** liwen0526 ([Website](https://github.com/uiwjs/icons))
**License:** MIT ([Details](https://github.com/uiwjs/icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-uiw
```

## Quick Start

### In stx Templates

```html
@js
  import { adobe, alipay, aliwangwang } from '@stacksjs/iconify-uiw'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    adobe: renderIcon(adobe, { size: 24 }),
    alipay: renderIcon(alipay, { size: 24, color: '#4a90e2' }),
    aliwangwang: renderIcon(aliwangwang, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.adobe !!}
  {!! icons.alipay !!}
  {!! icons.aliwangwang !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { adobe, alipay, aliwangwang } from '@stacksjs/iconify-uiw'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(adobe, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alipay, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(aliwangwang, {
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

This package contains **214** icons. Here are some examples:

- `adobe`
- `alipay`
- `aliwangwang`
- `android`
- `androidO`

...and 204 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/uiw/).

## Usage Examples

### Navigation Menu

```html
@js
  import { adobe, alipay, aliwangwang, android } from '@stacksjs/iconify-uiw'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    adobe: renderIcon(adobe, { size: 20, class: 'nav-icon' }),
    alipay: renderIcon(alipay, { size: 20, class: 'nav-icon' }),
    aliwangwang: renderIcon(aliwangwang, { size: 20, class: 'nav-icon' }),
    android: renderIcon(android, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.adobe !!} Home</a>
  <a href="/about">{!! navIcons.alipay !!} About</a>
  <a href="/contact">{!! navIcons.aliwangwang !!} Contact</a>
  <a href="/settings">{!! navIcons.android !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { adobe } from '@stacksjs/iconify-uiw'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(adobe, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-uiw'
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
   import { adobe, alipay } from '@stacksjs/iconify-uiw'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-uiw'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { adobe } from '@stacksjs/iconify-uiw'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(adobe, { size: 24 })
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
import { adobe } from '@stacksjs/iconify-uiw'

// Icons are typed as IconData
const myIcon: IconData = adobe
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/uiwjs/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: liwen0526 ([Website](https://github.com/uiwjs/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/uiw/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/uiw/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
