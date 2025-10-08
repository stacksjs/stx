# Huge Icons

> Huge Icons icons for stx from Iconify

## Overview

This package provides access to 4583 icons from the Huge Icons collection through the stx iconify integration.

**Collection ID:** `hugeicons`
**Total Icons:** 4583
**Author:** Hugeicons ([Website](https://icon-sets.iconify.design/icon-sets/hugeicons/))
**License:** MIT
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-hugeicons
```

## Quick Start

### In stx Templates

```html
@js
  import { 1stBracket, 1stBracketCircle, 1stBracketSquare } from '@stacksjs/iconify-hugeicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    1stBracket: renderIcon(1stBracket, { size: 24 }),
    1stBracketCircle: renderIcon(1stBracketCircle, { size: 24, color: '#4a90e2' }),
    1stBracketSquare: renderIcon(1stBracketSquare, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.1stBracket !!}
  {!! icons.1stBracketCircle !!}
  {!! icons.1stBracketSquare !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 1stBracket, 1stBracketCircle, 1stBracketSquare } from '@stacksjs/iconify-hugeicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(1stBracket, { size: 24 })

// With custom color
const coloredIcon = renderIcon(1stBracketCircle, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(1stBracketSquare, {
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

This package contains **4583** icons. Here are some examples:

- `1stBracket`
- `1stBracketCircle`
- `1stBracketSquare`
- `2ndBracket`
- `2ndBracketCircle`

...and 4573 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/hugeicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 1stBracket, 1stBracketCircle, 1stBracketSquare, 2ndBracket } from '@stacksjs/iconify-hugeicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    1stBracket: renderIcon(1stBracket, { size: 20, class: 'nav-icon' }),
    1stBracketCircle: renderIcon(1stBracketCircle, { size: 20, class: 'nav-icon' }),
    1stBracketSquare: renderIcon(1stBracketSquare, { size: 20, class: 'nav-icon' }),
    2ndBracket: renderIcon(2ndBracket, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.1stBracket !!} Home</a>
  <a href="/about">{!! navIcons.1stBracketCircle !!} About</a>
  <a href="/contact">{!! navIcons.1stBracketSquare !!} Contact</a>
  <a href="/settings">{!! navIcons.2ndBracket !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 1stBracket } from '@stacksjs/iconify-hugeicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(1stBracket, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-hugeicons'
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
   import { 1stBracket, 1stBracketCircle } from '@stacksjs/iconify-hugeicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-hugeicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 1stBracket } from '@stacksjs/iconify-hugeicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(1stBracket, { size: 24 })
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
import { 1stBracket } from '@stacksjs/iconify-hugeicons'

// Icons are typed as IconData
const myIcon: IconData = 1stBracket
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Hugeicons ([Website](https://icon-sets.iconify.design/icon-sets/hugeicons/))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/hugeicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/hugeicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
