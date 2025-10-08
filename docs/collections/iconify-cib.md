# CoreUI Brands

> CoreUI Brands icons for stx from Iconify

## Overview

This package provides access to 830 icons from the CoreUI Brands collection through the stx iconify integration.

**Collection ID:** `cib`
**Total Icons:** 830
**Author:** creativeLabs Łukasz Holeczek ([Website](https://github.com/coreui/coreui-icons))
**License:** CC0 1.0 ([Details](https://creativecommons.org/publicdomain/zero/1.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-cib
```

## Quick Start

### In stx Templates

```html
@js
  import { 500px, 500px5, aboutMe } from '@stacksjs/iconify-cib'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    500px: renderIcon(500px, { size: 24 }),
    500px5: renderIcon(500px5, { size: 24, color: '#4a90e2' }),
    aboutMe: renderIcon(aboutMe, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.500px !!}
  {!! icons.500px5 !!}
  {!! icons.aboutMe !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 500px, 500px5, aboutMe } from '@stacksjs/iconify-cib'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(500px, { size: 24 })

// With custom color
const coloredIcon = renderIcon(500px5, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(aboutMe, {
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

This package contains **830** icons. Here are some examples:

- `500px`
- `500px5`
- `aboutMe`
- `abstract`
- `acm`

...and 820 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/cib/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 500px, 500px5, aboutMe, abstract } from '@stacksjs/iconify-cib'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    500px5: renderIcon(500px5, { size: 20, class: 'nav-icon' }),
    aboutMe: renderIcon(aboutMe, { size: 20, class: 'nav-icon' }),
    abstract: renderIcon(abstract, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.500px !!} Home</a>
  <a href="/about">{!! navIcons.500px5 !!} About</a>
  <a href="/contact">{!! navIcons.aboutMe !!} Contact</a>
  <a href="/settings">{!! navIcons.abstract !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 500px } from '@stacksjs/iconify-cib'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(500px, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-cib'
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
   import { 500px, 500px5 } from '@stacksjs/iconify-cib'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-cib'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-cib'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(500px, { size: 24 })
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
import { 500px } from '@stacksjs/iconify-cib'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0 1.0

See [license details](https://creativecommons.org/publicdomain/zero/1.0/) for more information.

## Credits

- **Icons**: creativeLabs Łukasz Holeczek ([Website](https://github.com/coreui/coreui-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cib/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cib/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
