# Myna UI Icons

> Myna UI Icons icons for stx from Iconify

## Overview

This package provides access to 2562 icons from the Myna UI Icons collection through the stx iconify integration.

**Collection ID:** `mynaui`
**Total Icons:** 2562
**Author:** Praveen Juge ([Website](https://github.com/praveenjuge/mynaui-icons))
**License:** MIT ([Details](https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-mynaui
```

## Quick Start

### In stx Templates

```html
@js
  import { aArrowDown, aArrowDownSolid, aArrowUp } from '@stacksjs/iconify-mynaui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aArrowDown: renderIcon(aArrowDown, { size: 24 }),
    aArrowDownSolid: renderIcon(aArrowDownSolid, { size: 24, color: '#4a90e2' }),
    aArrowUp: renderIcon(aArrowUp, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aArrowDown !!}
  {!! icons.aArrowDownSolid !!}
  {!! icons.aArrowUp !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aArrowDown, aArrowDownSolid, aArrowUp } from '@stacksjs/iconify-mynaui'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aArrowDown, { size: 24 })

// With custom color
const coloredIcon = renderIcon(aArrowDownSolid, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(aArrowUp, {
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

This package contains **2562** icons. Here are some examples:

- `aArrowDown`
- `aArrowDownSolid`
- `aArrowUp`
- `aArrowUpSolid`
- `academicHat`

...and 2552 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/mynaui/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aArrowDown, aArrowDownSolid, aArrowUp, aArrowUpSolid } from '@stacksjs/iconify-mynaui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aArrowDown: renderIcon(aArrowDown, { size: 20, class: 'nav-icon' }),
    aArrowDownSolid: renderIcon(aArrowDownSolid, { size: 20, class: 'nav-icon' }),
    aArrowUp: renderIcon(aArrowUp, { size: 20, class: 'nav-icon' }),
    aArrowUpSolid: renderIcon(aArrowUpSolid, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aArrowDown !!} Home</a>
  <a href="/about">{!! navIcons.aArrowDownSolid !!} About</a>
  <a href="/contact">{!! navIcons.aArrowUp !!} Contact</a>
  <a href="/settings">{!! navIcons.aArrowUpSolid !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aArrowDown } from '@stacksjs/iconify-mynaui'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aArrowDown, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-mynaui'
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
   import { aArrowDown, aArrowDownSolid } from '@stacksjs/iconify-mynaui'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-mynaui'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aArrowDown } from '@stacksjs/iconify-mynaui'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(aArrowDown, { size: 24 })
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
import { aArrowDown } from '@stacksjs/iconify-mynaui'

// Icons are typed as IconData
const myIcon: IconData = aArrowDown
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Praveen Juge ([Website](https://github.com/praveenjuge/mynaui-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/mynaui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/mynaui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
