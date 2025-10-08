# coolicons

> coolicons icons for stx from Iconify

## Overview

This package provides access to 715 icons from the coolicons collection through the stx iconify integration.

**Collection ID:** `ci`
**Total Icons:** 715
**Author:** Kryston Schwarze ([Website](https://github.com/krystonschwarze/coolicons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ci
```

## Quick Start

### In stx Templates

```html
@js
  import { addColumn, addMinusSquare, addPlus } from '@stacksjs/iconify-ci'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addColumn: renderIcon(addColumn, { size: 24 }),
    addMinusSquare: renderIcon(addMinusSquare, { size: 24, color: '#4a90e2' }),
    addPlus: renderIcon(addPlus, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addColumn !!}
  {!! icons.addMinusSquare !!}
  {!! icons.addPlus !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addColumn, addMinusSquare, addPlus } from '@stacksjs/iconify-ci'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addColumn, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addMinusSquare, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addPlus, {
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

This package contains **715** icons. Here are some examples:

- `addColumn`
- `addMinusSquare`
- `addPlus`
- `addPlusCircle`
- `addPlusSquare`

...and 705 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ci/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addColumn, addMinusSquare, addPlus, addPlusCircle } from '@stacksjs/iconify-ci'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addColumn: renderIcon(addColumn, { size: 20, class: 'nav-icon' }),
    addMinusSquare: renderIcon(addMinusSquare, { size: 20, class: 'nav-icon' }),
    addPlus: renderIcon(addPlus, { size: 20, class: 'nav-icon' }),
    addPlusCircle: renderIcon(addPlusCircle, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addColumn !!} Home</a>
  <a href="/about">{!! navIcons.addMinusSquare !!} About</a>
  <a href="/contact">{!! navIcons.addPlus !!} Contact</a>
  <a href="/settings">{!! navIcons.addPlusCircle !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addColumn } from '@stacksjs/iconify-ci'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addColumn, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ci'
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
   import { addColumn, addMinusSquare } from '@stacksjs/iconify-ci'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ci'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addColumn } from '@stacksjs/iconify-ci'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addColumn, { size: 24 })
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
import { addColumn } from '@stacksjs/iconify-ci'

// Icons are typed as IconData
const myIcon: IconData = addColumn
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Kryston Schwarze ([Website](https://github.com/krystonschwarze/coolicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ci/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ci/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
