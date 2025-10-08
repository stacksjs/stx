# Fontelico

> Fontelico icons for stx from Iconify

## Overview

This package provides access to 34 icons from the Fontelico collection through the stx iconify integration.

**Collection ID:** `fontelico`
**Total Icons:** 34
**Author:** Fontello ([Website](https://github.com/fontello/fontelico.font))
**License:** CC BY SA ([Details](https://creativecommons.org/licenses/by-sa/3.0/))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fontelico
```

## Quick Start

### In stx Templates

```html
@js
  import { chrome, crown, crownMinus } from '@stacksjs/iconify-fontelico'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    chrome: renderIcon(chrome, { size: 24 }),
    crown: renderIcon(crown, { size: 24, color: '#4a90e2' }),
    crownMinus: renderIcon(crownMinus, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.chrome !!}
  {!! icons.crown !!}
  {!! icons.crownMinus !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { chrome, crown, crownMinus } from '@stacksjs/iconify-fontelico'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(chrome, { size: 24 })

// With custom color
const coloredIcon = renderIcon(crown, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(crownMinus, {
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

This package contains **34** icons. Here are some examples:

- `chrome`
- `crown`
- `crownMinus`
- `crownPlus`
- `emoAngry`

...and 24 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fontelico/).

## Usage Examples

### Navigation Menu

```html
@js
  import { chrome, crown, crownMinus, crownPlus } from '@stacksjs/iconify-fontelico'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    chrome: renderIcon(chrome, { size: 20, class: 'nav-icon' }),
    crown: renderIcon(crown, { size: 20, class: 'nav-icon' }),
    crownMinus: renderIcon(crownMinus, { size: 20, class: 'nav-icon' }),
    crownPlus: renderIcon(crownPlus, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.chrome !!} Home</a>
  <a href="/about">{!! navIcons.crown !!} About</a>
  <a href="/contact">{!! navIcons.crownMinus !!} Contact</a>
  <a href="/settings">{!! navIcons.crownPlus !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { chrome } from '@stacksjs/iconify-fontelico'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(chrome, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fontelico'
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
   import { chrome, crown } from '@stacksjs/iconify-fontelico'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fontelico'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { chrome } from '@stacksjs/iconify-fontelico'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(chrome, { size: 24 })
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
import { chrome } from '@stacksjs/iconify-fontelico'

// Icons are typed as IconData
const myIcon: IconData = chrome
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY SA

See [license details](https://creativecommons.org/licenses/by-sa/3.0/) for more information.

## Credits

- **Icons**: Fontello ([Website](https://github.com/fontello/fontelico.font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fontelico/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fontelico/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
