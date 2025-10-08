# css.gg

> css.gg icons for stx from Iconify

## Overview

This package provides access to 704 icons from the css.gg collection through the stx iconify integration.

**Collection ID:** `gg`
**Total Icons:** 704
**Author:** Astrit ([Website](https://github.com/astrit/css.gg))
**License:** MIT ([Details](https://github.com/astrit/css.gg/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gg
```

## Quick Start

### In stx Templates

```html
@js
  import { abstract, add, addR } from '@stacksjs/iconify-gg'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    abstract: renderIcon(abstract, { size: 24 }),
    add: renderIcon(add, { size: 24, color: '#4a90e2' }),
    addR: renderIcon(addR, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.abstract !!}
  {!! icons.add !!}
  {!! icons.addR !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { abstract, add, addR } from '@stacksjs/iconify-gg'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(abstract, { size: 24 })

// With custom color
const coloredIcon = renderIcon(add, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addR, {
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

This package contains **704** icons. Here are some examples:

- `abstract`
- `add`
- `addR`
- `adidas`
- `airplane`

...and 694 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/gg/).

## Usage Examples

### Navigation Menu

```html
@js
  import { abstract, add, addR, adidas } from '@stacksjs/iconify-gg'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    abstract: renderIcon(abstract, { size: 20, class: 'nav-icon' }),
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    addR: renderIcon(addR, { size: 20, class: 'nav-icon' }),
    adidas: renderIcon(adidas, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.abstract !!} Home</a>
  <a href="/about">{!! navIcons.add !!} About</a>
  <a href="/contact">{!! navIcons.addR !!} Contact</a>
  <a href="/settings">{!! navIcons.adidas !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { abstract } from '@stacksjs/iconify-gg'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(abstract, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-gg'
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
   import { abstract, add } from '@stacksjs/iconify-gg'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-gg'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { abstract } from '@stacksjs/iconify-gg'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(abstract, { size: 24 })
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
import { abstract } from '@stacksjs/iconify-gg'

// Icons are typed as IconData
const myIcon: IconData = abstract
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/astrit/css.gg/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Astrit ([Website](https://github.com/astrit/css.gg))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gg/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gg/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
