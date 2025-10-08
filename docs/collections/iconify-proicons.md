# ProIcons

> ProIcons icons for stx from Iconify

## Overview

This package provides access to 529 icons from the ProIcons collection through the stx iconify integration.

**Collection ID:** `proicons`
**Total Icons:** 529
**Author:** ProCode ([Website](https://github.com/ProCode-Software/proicons))
**License:** MIT ([Details](https://github.com/ProCode-Software/proicons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-proicons
```

## Quick Start

### In stx Templates

```html
@js
  import { accessibility, add, addCircle } from '@stacksjs/iconify-proicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessibility: renderIcon(accessibility, { size: 24 }),
    add: renderIcon(add, { size: 24, color: '#4a90e2' }),
    addCircle: renderIcon(addCircle, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessibility !!}
  {!! icons.add !!}
  {!! icons.addCircle !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessibility, add, addCircle } from '@stacksjs/iconify-proicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessibility, { size: 24 })

// With custom color
const coloredIcon = renderIcon(add, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addCircle, {
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

This package contains **529** icons. Here are some examples:

- `accessibility`
- `add`
- `addCircle`
- `addRhombus`
- `addSquare`

...and 519 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/proicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessibility, add, addCircle, addRhombus } from '@stacksjs/iconify-proicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' }),
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    addCircle: renderIcon(addCircle, { size: 20, class: 'nav-icon' }),
    addRhombus: renderIcon(addRhombus, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessibility !!} Home</a>
  <a href="/about">{!! navIcons.add !!} About</a>
  <a href="/contact">{!! navIcons.addCircle !!} Contact</a>
  <a href="/settings">{!! navIcons.addRhombus !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessibility } from '@stacksjs/iconify-proicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessibility, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-proicons'
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
   import { accessibility, add } from '@stacksjs/iconify-proicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-proicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-proicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessibility, { size: 24 })
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
import { accessibility } from '@stacksjs/iconify-proicons'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/ProCode-Software/proicons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: ProCode ([Website](https://github.com/ProCode-Software/proicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/proicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/proicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
