# Vesper Icons

> Vesper Icons icons for stx from Iconify

## Overview

This package provides access to 159 icons from the Vesper Icons collection through the stx iconify integration.

**Collection ID:** `vs`
**Total Icons:** 159
**Author:** TableCheck ([Website](https://github.com/kkvesper/vesper-icons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-vs
```

## Quick Start

### In stx Templates

```html
@js
  import { 0Square, 1Square, 2Square } from '@stacksjs/iconify-vs'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    0Square: renderIcon(0Square, { size: 24 }),
    1Square: renderIcon(1Square, { size: 24, color: '#4a90e2' }),
    2Square: renderIcon(2Square, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.0Square !!}
  {!! icons.1Square !!}
  {!! icons.2Square !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 0Square, 1Square, 2Square } from '@stacksjs/iconify-vs'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(0Square, { size: 24 })

// With custom color
const coloredIcon = renderIcon(1Square, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(2Square, {
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

This package contains **159** icons. Here are some examples:

- `0Square`
- `1Square`
- `2Square`
- `3Square`
- `4Square`

...and 149 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/vs/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 0Square, 1Square, 2Square, 3Square } from '@stacksjs/iconify-vs'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    0Square: renderIcon(0Square, { size: 20, class: 'nav-icon' }),
    1Square: renderIcon(1Square, { size: 20, class: 'nav-icon' }),
    2Square: renderIcon(2Square, { size: 20, class: 'nav-icon' }),
    3Square: renderIcon(3Square, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.0Square !!} Home</a>
  <a href="/about">{!! navIcons.1Square !!} About</a>
  <a href="/contact">{!! navIcons.2Square !!} Contact</a>
  <a href="/settings">{!! navIcons.3Square !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 0Square } from '@stacksjs/iconify-vs'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(0Square, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-vs'
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
   import { 0Square, 1Square } from '@stacksjs/iconify-vs'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-vs'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0Square } from '@stacksjs/iconify-vs'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(0Square, { size: 24 })
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
import { 0Square } from '@stacksjs/iconify-vs'

// Icons are typed as IconData
const myIcon: IconData = 0Square
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: TableCheck ([Website](https://github.com/kkvesper/vesper-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/vs/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/vs/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
