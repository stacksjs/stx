# Icons8 Windows 8 Icons

> Icons8 Windows 8 Icons icons for stx from Iconify

## Overview

This package provides access to 200 icons from the Icons8 Windows 8 Icons collection through the stx iconify integration.

**Collection ID:** `wpf`
**Total Icons:** 200
**Author:** Icons8 ([Website](https://github.com/icons8/WPF-UI-Framework))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-wpf
```

## Quick Start

### In stx Templates

```html
@js
  import { 2fSwipeDown, 2fSwipeRight, addImage } from '@stacksjs/iconify-wpf'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    2fSwipeDown: renderIcon(2fSwipeDown, { size: 24 }),
    2fSwipeRight: renderIcon(2fSwipeRight, { size: 24, color: '#4a90e2' }),
    addImage: renderIcon(addImage, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.2fSwipeDown !!}
  {!! icons.2fSwipeRight !!}
  {!! icons.addImage !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 2fSwipeDown, 2fSwipeRight, addImage } from '@stacksjs/iconify-wpf'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(2fSwipeDown, { size: 24 })

// With custom color
const coloredIcon = renderIcon(2fSwipeRight, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addImage, {
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

This package contains **200** icons. Here are some examples:

- `2fSwipeDown`
- `2fSwipeRight`
- `addImage`
- `addUser`
- `administrator`

...and 190 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/wpf/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 2fSwipeDown, 2fSwipeRight, addImage, addUser } from '@stacksjs/iconify-wpf'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    2fSwipeDown: renderIcon(2fSwipeDown, { size: 20, class: 'nav-icon' }),
    2fSwipeRight: renderIcon(2fSwipeRight, { size: 20, class: 'nav-icon' }),
    addImage: renderIcon(addImage, { size: 20, class: 'nav-icon' }),
    addUser: renderIcon(addUser, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.2fSwipeDown !!} Home</a>
  <a href="/about">{!! navIcons.2fSwipeRight !!} About</a>
  <a href="/contact">{!! navIcons.addImage !!} Contact</a>
  <a href="/settings">{!! navIcons.addUser !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 2fSwipeDown } from '@stacksjs/iconify-wpf'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(2fSwipeDown, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-wpf'
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
   import { 2fSwipeDown, 2fSwipeRight } from '@stacksjs/iconify-wpf'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-wpf'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 2fSwipeDown } from '@stacksjs/iconify-wpf'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(2fSwipeDown, { size: 24 })
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
import { 2fSwipeDown } from '@stacksjs/iconify-wpf'

// Icons are typed as IconData
const myIcon: IconData = 2fSwipeDown
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Icons8 ([Website](https://github.com/icons8/WPF-UI-Framework))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/wpf/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/wpf/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
