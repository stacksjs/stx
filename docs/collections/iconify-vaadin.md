# Vaadin Icons

> Vaadin Icons icons for stx from Iconify

## Overview

This package provides access to 636 icons from the Vaadin Icons collection through the stx iconify integration.

**Collection ID:** `vaadin`
**Total Icons:** 636
**Author:** Vaadin ([Website](https://github.com/vaadin/web-components))
**License:** Apache 2.0
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-vaadin
```

## Quick Start

### In stx Templates

```html
@js
  import { abacus, absolutePosition, academyCap } from '@stacksjs/iconify-vaadin'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    abacus: renderIcon(abacus, { size: 24 }),
    absolutePosition: renderIcon(absolutePosition, { size: 24, color: '#4a90e2' }),
    academyCap: renderIcon(academyCap, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.abacus !!}
  {!! icons.absolutePosition !!}
  {!! icons.academyCap !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { abacus, absolutePosition, academyCap } from '@stacksjs/iconify-vaadin'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(abacus, { size: 24 })

// With custom color
const coloredIcon = renderIcon(absolutePosition, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(academyCap, {
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

This package contains **636** icons. Here are some examples:

- `abacus`
- `absolutePosition`
- `academyCap`
- `accessibility`
- `accordionMenu`

...and 626 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/vaadin/).

## Usage Examples

### Navigation Menu

```html
@js
  import { abacus, absolutePosition, academyCap, accessibility } from '@stacksjs/iconify-vaadin'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    abacus: renderIcon(abacus, { size: 20, class: 'nav-icon' }),
    absolutePosition: renderIcon(absolutePosition, { size: 20, class: 'nav-icon' }),
    academyCap: renderIcon(academyCap, { size: 20, class: 'nav-icon' }),
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.abacus !!} Home</a>
  <a href="/about">{!! navIcons.absolutePosition !!} About</a>
  <a href="/contact">{!! navIcons.academyCap !!} Contact</a>
  <a href="/settings">{!! navIcons.accessibility !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { abacus } from '@stacksjs/iconify-vaadin'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(abacus, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-vaadin'
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
   import { abacus, absolutePosition } from '@stacksjs/iconify-vaadin'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-vaadin'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { abacus } from '@stacksjs/iconify-vaadin'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(abacus, { size: 24 })
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
import { abacus } from '@stacksjs/iconify-vaadin'

// Icons are typed as IconData
const myIcon: IconData = abacus
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0



## Credits

- **Icons**: Vaadin ([Website](https://github.com/vaadin/web-components))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/vaadin/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/vaadin/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
