# Bytesize Icons

> Bytesize Icons icons for stx from Iconify

## Overview

This package provides access to 102 icons from the Bytesize Icons collection through the stx iconify integration.

**Collection ID:** `bytesize`
**Total Icons:** 102
**Author:** Dan Klammer ([Website](https://github.com/danklammer/bytesize-icons))
**License:** MIT ([Details](https://github.com/danklammer/bytesize-icons/blob/master/LICENSE.md))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bytesize
```

## Quick Start

### In stx Templates

```html
@js
  import { activity, alert, archive } from '@stacksjs/iconify-bytesize'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    activity: renderIcon(activity, { size: 24 }),
    alert: renderIcon(alert, { size: 24, color: '#4a90e2' }),
    archive: renderIcon(archive, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.activity !!}
  {!! icons.alert !!}
  {!! icons.archive !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { activity, alert, archive } from '@stacksjs/iconify-bytesize'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(activity, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alert, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(archive, {
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

This package contains **102** icons. Here are some examples:

- `activity`
- `alert`
- `archive`
- `arrowBottom`
- `arrowLeft`

...and 92 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/bytesize/).

## Usage Examples

### Navigation Menu

```html
@js
  import { activity, alert, archive, arrowBottom } from '@stacksjs/iconify-bytesize'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    activity: renderIcon(activity, { size: 20, class: 'nav-icon' }),
    alert: renderIcon(alert, { size: 20, class: 'nav-icon' }),
    archive: renderIcon(archive, { size: 20, class: 'nav-icon' }),
    arrowBottom: renderIcon(arrowBottom, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.activity !!} Home</a>
  <a href="/about">{!! navIcons.alert !!} About</a>
  <a href="/contact">{!! navIcons.archive !!} Contact</a>
  <a href="/settings">{!! navIcons.arrowBottom !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { activity } from '@stacksjs/iconify-bytesize'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(activity, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-bytesize'
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
   import { activity, alert } from '@stacksjs/iconify-bytesize'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-bytesize'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { activity } from '@stacksjs/iconify-bytesize'
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
import { activity } from '@stacksjs/iconify-bytesize'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/danklammer/bytesize-icons/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: Dan Klammer ([Website](https://github.com/danklammer/bytesize-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bytesize/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bytesize/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
