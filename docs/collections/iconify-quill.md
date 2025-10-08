# Quill Icons

> Quill Icons icons for stx from Iconify

## Overview

This package provides access to 141 icons from the Quill Icons collection through the stx iconify integration.

**Collection ID:** `quill`
**Total Icons:** 141
**Author:** Casper Lourens ([Website](https://www.figma.com/community/file/1034432054377533052/Quill-Iconset))
**License:** MIT ([Details](https://github.com/yourtempo/tempo-quill-icons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-quill
```

## Quick Start

### In stx Templates

```html
@js
  import { activity, add, alarm } from '@stacksjs/iconify-quill'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    activity: renderIcon(activity, { size: 24 }),
    add: renderIcon(add, { size: 24, color: '#4a90e2' }),
    alarm: renderIcon(alarm, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.activity !!}
  {!! icons.add !!}
  {!! icons.alarm !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { activity, add, alarm } from '@stacksjs/iconify-quill'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(activity, { size: 24 })

// With custom color
const coloredIcon = renderIcon(add, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alarm, {
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

This package contains **141** icons. Here are some examples:

- `activity`
- `add`
- `alarm`
- `alt`
- `arrowDown`

...and 131 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/quill/).

## Usage Examples

### Navigation Menu

```html
@js
  import { activity, add, alarm, alt } from '@stacksjs/iconify-quill'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    activity: renderIcon(activity, { size: 20, class: 'nav-icon' }),
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    alarm: renderIcon(alarm, { size: 20, class: 'nav-icon' }),
    alt: renderIcon(alt, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.activity !!} Home</a>
  <a href="/about">{!! navIcons.add !!} About</a>
  <a href="/contact">{!! navIcons.alarm !!} Contact</a>
  <a href="/settings">{!! navIcons.alt !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { activity } from '@stacksjs/iconify-quill'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(activity, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-quill'
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
   import { activity, add } from '@stacksjs/iconify-quill'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-quill'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { activity } from '@stacksjs/iconify-quill'
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
import { activity } from '@stacksjs/iconify-quill'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/yourtempo/tempo-quill-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Casper Lourens ([Website](https://www.figma.com/community/file/1034432054377533052/Quill-Iconset))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/quill/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/quill/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
