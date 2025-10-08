# Circle Flags

> Circle Flags icons for stx from Iconify

## Overview

This package provides access to 729 icons from the Circle Flags collection through the stx iconify integration.

**Collection ID:** `circle-flags`
**Total Icons:** 729
**Author:** HatScripts ([Website](https://github.com/HatScripts/circle-flags))
**License:** MIT ([Details](https://github.com/HatScripts/circle-flags/blob/gh-pages/LICENSE))
**Category:** Flags / Maps
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-circle-flags
```

## Quick Start

### In stx Templates

```html
@js
  import { aa, ab, ac } from '@stacksjs/iconify-circle-flags'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aa: renderIcon(aa, { size: 24 }),
    ab: renderIcon(ab, { size: 24, color: '#4a90e2' }),
    ac: renderIcon(ac, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aa !!}
  {!! icons.ab !!}
  {!! icons.ac !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aa, ab, ac } from '@stacksjs/iconify-circle-flags'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aa, { size: 24 })

// With custom color
const coloredIcon = renderIcon(ab, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(ac, {
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

This package contains **729** icons. Here are some examples:

- `aa`
- `ab`
- `ac`
- `ad`
- `ae`

...and 719 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/circle-flags/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aa, ab, ac, ad } from '@stacksjs/iconify-circle-flags'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aa: renderIcon(aa, { size: 20, class: 'nav-icon' }),
    ab: renderIcon(ab, { size: 20, class: 'nav-icon' }),
    ac: renderIcon(ac, { size: 20, class: 'nav-icon' }),
    ad: renderIcon(ad, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aa !!} Home</a>
  <a href="/about">{!! navIcons.ab !!} About</a>
  <a href="/contact">{!! navIcons.ac !!} Contact</a>
  <a href="/settings">{!! navIcons.ad !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aa } from '@stacksjs/iconify-circle-flags'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aa, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-circle-flags'
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
   import { aa, ab } from '@stacksjs/iconify-circle-flags'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-circle-flags'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aa } from '@stacksjs/iconify-circle-flags'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(aa, { size: 24 })
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
import { aa } from '@stacksjs/iconify-circle-flags'

// Icons are typed as IconData
const myIcon: IconData = aa
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/HatScripts/circle-flags/blob/gh-pages/LICENSE) for more information.

## Credits

- **Icons**: HatScripts ([Website](https://github.com/HatScripts/circle-flags))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/circle-flags/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/circle-flags/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
