# Bootstrap Icons

> Bootstrap Icons icons for stx from Iconify

## Overview

This package provides access to 2084 icons from the Bootstrap Icons collection through the stx iconify integration.

**Collection ID:** `bi`
**Total Icons:** 2084
**Author:** The Bootstrap Authors ([Website](https://github.com/twbs/icons))
**License:** MIT ([Details](https://github.com/twbs/icons/blob/main/LICENSE.md))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bi
```

## Quick Start

### In stx Templates

```html
@js
  import { 123, 0Circle, 0CircleFill } from '@stacksjs/iconify-bi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    123: renderIcon(123, { size: 24 }),
    0Circle: renderIcon(0Circle, { size: 24, color: '#4a90e2' }),
    0CircleFill: renderIcon(0CircleFill, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.123 !!}
  {!! icons.0Circle !!}
  {!! icons.0CircleFill !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 123, 0Circle, 0CircleFill } from '@stacksjs/iconify-bi'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(123, { size: 24 })

// With custom color
const coloredIcon = renderIcon(0Circle, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(0CircleFill, {
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

This package contains **2084** icons. Here are some examples:

- `123`
- `0Circle`
- `0CircleFill`
- `0Square`
- `0SquareFill`

...and 2074 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/bi/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 123, 0Circle, 0CircleFill, 0Square } from '@stacksjs/iconify-bi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    123: renderIcon(123, { size: 20, class: 'nav-icon' }),
    0Circle: renderIcon(0Circle, { size: 20, class: 'nav-icon' }),
    0CircleFill: renderIcon(0CircleFill, { size: 20, class: 'nav-icon' }),
    0Square: renderIcon(0Square, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.123 !!} Home</a>
  <a href="/about">{!! navIcons.0Circle !!} About</a>
  <a href="/contact">{!! navIcons.0CircleFill !!} Contact</a>
  <a href="/settings">{!! navIcons.0Square !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 123 } from '@stacksjs/iconify-bi'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(123, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-bi'
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
   import { 123, 0Circle } from '@stacksjs/iconify-bi'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-bi'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 123 } from '@stacksjs/iconify-bi'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(123, { size: 24 })
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
import { 123 } from '@stacksjs/iconify-bi'

// Icons are typed as IconData
const myIcon: IconData = 123
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/twbs/icons/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: The Bootstrap Authors ([Website](https://github.com/twbs/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
