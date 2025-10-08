# Siemens Industrial Experience Icons

> Siemens Industrial Experience Icons icons for stx from Iconify

## Overview

This package provides access to 1418 icons from the Siemens Industrial Experience Icons collection through the stx iconify integration.

**Collection ID:** `ix`
**Total Icons:** 1418
**Author:** Siemens AG ([Website](https://github.com/siemens/ix-icons))
**License:** MIT ([Details](https://github.com/siemens/ix-icons/blob/main/LICENSE.md))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ix
```

## Quick Start

### In stx Templates

```html
@js
  import { about, aboutFilled, add } from '@stacksjs/iconify-ix'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    about: renderIcon(about, { size: 24 }),
    aboutFilled: renderIcon(aboutFilled, { size: 24, color: '#4a90e2' }),
    add: renderIcon(add, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.about !!}
  {!! icons.aboutFilled !!}
  {!! icons.add !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { about, aboutFilled, add } from '@stacksjs/iconify-ix'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(about, { size: 24 })

// With custom color
const coloredIcon = renderIcon(aboutFilled, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(add, {
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

This package contains **1418** icons. Here are some examples:

- `about`
- `aboutFilled`
- `add`
- `addApplication`
- `addCircle`

...and 1408 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ix/).

## Usage Examples

### Navigation Menu

```html
@js
  import { about, aboutFilled, add, addApplication } from '@stacksjs/iconify-ix'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    about: renderIcon(about, { size: 20, class: 'nav-icon' }),
    aboutFilled: renderIcon(aboutFilled, { size: 20, class: 'nav-icon' }),
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    addApplication: renderIcon(addApplication, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.about !!} Home</a>
  <a href="/about">{!! navIcons.aboutFilled !!} About</a>
  <a href="/contact">{!! navIcons.add !!} Contact</a>
  <a href="/settings">{!! navIcons.addApplication !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { about } from '@stacksjs/iconify-ix'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(about, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ix'
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
   import { about, aboutFilled } from '@stacksjs/iconify-ix'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ix'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { about } from '@stacksjs/iconify-ix'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(about, { size: 24 })
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
import { about } from '@stacksjs/iconify-ix'

// Icons are typed as IconData
const myIcon: IconData = about
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/siemens/ix-icons/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: Siemens AG ([Website](https://github.com/siemens/ix-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ix/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ix/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
