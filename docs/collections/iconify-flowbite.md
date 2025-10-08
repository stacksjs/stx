# Flowbite Icons

> Flowbite Icons icons for stx from Iconify

## Overview

This package provides access to 804 icons from the Flowbite Icons collection through the stx iconify integration.

**Collection ID:** `flowbite`
**Total Icons:** 804
**Author:** Themesberg ([Website](https://github.com/themesberg/flowbite-icons))
**License:** MIT ([Details](https://github.com/themesberg/flowbite-icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-flowbite
```

## Quick Start

### In stx Templates

```html
@js
  import { addColumnAfterOutline, addColumnBeforeOutline, addressBookOutline } from '@stacksjs/iconify-flowbite'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addColumnAfterOutline: renderIcon(addColumnAfterOutline, { size: 24 }),
    addColumnBeforeOutline: renderIcon(addColumnBeforeOutline, { size: 24, color: '#4a90e2' }),
    addressBookOutline: renderIcon(addressBookOutline, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addColumnAfterOutline !!}
  {!! icons.addColumnBeforeOutline !!}
  {!! icons.addressBookOutline !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addColumnAfterOutline, addColumnBeforeOutline, addressBookOutline } from '@stacksjs/iconify-flowbite'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addColumnAfterOutline, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addColumnBeforeOutline, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addressBookOutline, {
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

This package contains **804** icons. Here are some examples:

- `addColumnAfterOutline`
- `addColumnBeforeOutline`
- `addressBookOutline`
- `addressBookSolid`
- `adjustmentsHorizontalOutline`

...and 794 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/flowbite/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addColumnAfterOutline, addColumnBeforeOutline, addressBookOutline, addressBookSolid } from '@stacksjs/iconify-flowbite'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addColumnAfterOutline: renderIcon(addColumnAfterOutline, { size: 20, class: 'nav-icon' }),
    addColumnBeforeOutline: renderIcon(addColumnBeforeOutline, { size: 20, class: 'nav-icon' }),
    addressBookOutline: renderIcon(addressBookOutline, { size: 20, class: 'nav-icon' }),
    addressBookSolid: renderIcon(addressBookSolid, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addColumnAfterOutline !!} Home</a>
  <a href="/about">{!! navIcons.addColumnBeforeOutline !!} About</a>
  <a href="/contact">{!! navIcons.addressBookOutline !!} Contact</a>
  <a href="/settings">{!! navIcons.addressBookSolid !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addColumnAfterOutline } from '@stacksjs/iconify-flowbite'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addColumnAfterOutline, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-flowbite'
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
   import { addColumnAfterOutline, addColumnBeforeOutline } from '@stacksjs/iconify-flowbite'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-flowbite'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addColumnAfterOutline } from '@stacksjs/iconify-flowbite'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addColumnAfterOutline, { size: 24 })
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
import { addColumnAfterOutline } from '@stacksjs/iconify-flowbite'

// Icons are typed as IconData
const myIcon: IconData = addColumnAfterOutline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/themesberg/flowbite-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Themesberg ([Website](https://github.com/themesberg/flowbite-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flowbite/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flowbite/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
