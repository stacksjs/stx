# CodeX Icons

> CodeX Icons icons for stx from Iconify

## Overview

This package provides access to 78 icons from the CodeX Icons collection through the stx iconify integration.

**Collection ID:** `codex`
**Total Icons:** 78
**Author:** CodeX ([Website](https://github.com/codex-team/icons))
**License:** MIT ([Details](https://github.com/codex-team/icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-codex
```

## Quick Start

### In stx Templates

```html
@js
  import { addBackground, addBorder, alignCenter } from '@stacksjs/iconify-codex'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addBackground: renderIcon(addBackground, { size: 24 }),
    addBorder: renderIcon(addBorder, { size: 24, color: '#4a90e2' }),
    alignCenter: renderIcon(alignCenter, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addBackground !!}
  {!! icons.addBorder !!}
  {!! icons.alignCenter !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addBackground, addBorder, alignCenter } from '@stacksjs/iconify-codex'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addBackground, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addBorder, {
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

This package contains **78** icons. Here are some examples:

- `addBackground`
- `addBorder`
- `alignCenter`
- `alignJustify`
- `alignLeft`

...and 68 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/codex/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addBackground, addBorder, alignCenter, alignJustify } from '@stacksjs/iconify-codex'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addBackground: renderIcon(addBackground, { size: 20, class: 'nav-icon' }),
    addBorder: renderIcon(addBorder, { size: 20, class: 'nav-icon' }),
    alignCenter: renderIcon(alignCenter, { size: 20, class: 'nav-icon' }),
    alignJustify: renderIcon(alignJustify, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addBackground !!} Home</a>
  <a href="/about">{!! navIcons.addBorder !!} About</a>
  <a href="/contact">{!! navIcons.alignCenter !!} Contact</a>
  <a href="/settings">{!! navIcons.alignJustify !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addBackground } from '@stacksjs/iconify-codex'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addBackground, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-codex'
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
   import { addBackground, addBorder } from '@stacksjs/iconify-codex'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-codex'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addBackground } from '@stacksjs/iconify-codex'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addBackground, { size: 24 })
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
import { addBackground } from '@stacksjs/iconify-codex'

// Icons are typed as IconData
const myIcon: IconData = addBackground
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/codex-team/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: CodeX ([Website](https://github.com/codex-team/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/codex/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/codex/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
