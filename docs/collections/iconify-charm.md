# Charm Icons

> Charm Icons icons for stx from Iconify

## Overview

This package provides access to 262 icons from the Charm Icons collection through the stx iconify integration.

**Collection ID:** `charm`
**Total Icons:** 262
**Author:** Jay Newey ([Website](https://github.com/jaynewey/charm-icons))
**License:** MIT ([Details](https://github.com/jaynewey/charm-icons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-charm
```

## Quick Start

### In stx Templates

```html
@js
  import { anchor, apps, appsMinus } from '@stacksjs/iconify-charm'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    anchor: renderIcon(anchor, { size: 24 }),
    apps: renderIcon(apps, { size: 24, color: '#4a90e2' }),
    appsMinus: renderIcon(appsMinus, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.anchor !!}
  {!! icons.apps !!}
  {!! icons.appsMinus !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { anchor, apps, appsMinus } from '@stacksjs/iconify-charm'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(anchor, { size: 24 })

// With custom color
const coloredIcon = renderIcon(apps, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(appsMinus, {
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

This package contains **262** icons. Here are some examples:

- `anchor`
- `apps`
- `appsMinus`
- `appsPlus`
- `archive`

...and 252 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/charm/).

## Usage Examples

### Navigation Menu

```html
@js
  import { anchor, apps, appsMinus, appsPlus } from '@stacksjs/iconify-charm'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    anchor: renderIcon(anchor, { size: 20, class: 'nav-icon' }),
    apps: renderIcon(apps, { size: 20, class: 'nav-icon' }),
    appsMinus: renderIcon(appsMinus, { size: 20, class: 'nav-icon' }),
    appsPlus: renderIcon(appsPlus, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.anchor !!} Home</a>
  <a href="/about">{!! navIcons.apps !!} About</a>
  <a href="/contact">{!! navIcons.appsMinus !!} Contact</a>
  <a href="/settings">{!! navIcons.appsPlus !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { anchor } from '@stacksjs/iconify-charm'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(anchor, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-charm'
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
   import { anchor, apps } from '@stacksjs/iconify-charm'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-charm'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { anchor } from '@stacksjs/iconify-charm'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(anchor, { size: 24 })
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
import { anchor } from '@stacksjs/iconify-charm'

// Icons are typed as IconData
const myIcon: IconData = anchor
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/jaynewey/charm-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Jay Newey ([Website](https://github.com/jaynewey/charm-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/charm/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/charm/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
