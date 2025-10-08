# Medical Icons

> Medical Icons icons for stx from Iconify

## Overview

This package provides access to 144 icons from the Medical Icons collection through the stx iconify integration.

**Collection ID:** `medical-icon`
**Total Icons:** 144
**Author:** Samuel Frémondière ([Website](https://github.com/samcome/webfont-medical-icons))
**License:** MIT ([Details](https://github.com/samcome/webfont-medical-icons/blob/master/LICENSE))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-medical-icon
```

## Quick Start

### In stx Templates

```html
@js
  import { accessibility, administration, alternativeComplementary } from '@stacksjs/iconify-medical-icon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessibility: renderIcon(accessibility, { size: 24 }),
    administration: renderIcon(administration, { size: 24, color: '#4a90e2' }),
    alternativeComplementary: renderIcon(alternativeComplementary, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessibility !!}
  {!! icons.administration !!}
  {!! icons.alternativeComplementary !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessibility, administration, alternativeComplementary } from '@stacksjs/iconify-medical-icon'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessibility, { size: 24 })

// With custom color
const coloredIcon = renderIcon(administration, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alternativeComplementary, {
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

This package contains **144** icons. Here are some examples:

- `accessibility`
- `administration`
- `alternativeComplementary`
- `ambulance`
- `anesthesia`

...and 134 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/medical-icon/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessibility, administration, alternativeComplementary, ambulance } from '@stacksjs/iconify-medical-icon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' }),
    administration: renderIcon(administration, { size: 20, class: 'nav-icon' }),
    alternativeComplementary: renderIcon(alternativeComplementary, { size: 20, class: 'nav-icon' }),
    ambulance: renderIcon(ambulance, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessibility !!} Home</a>
  <a href="/about">{!! navIcons.administration !!} About</a>
  <a href="/contact">{!! navIcons.alternativeComplementary !!} Contact</a>
  <a href="/settings">{!! navIcons.ambulance !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessibility } from '@stacksjs/iconify-medical-icon'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessibility, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-medical-icon'
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
   import { accessibility, administration } from '@stacksjs/iconify-medical-icon'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-medical-icon'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-medical-icon'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessibility, { size: 24 })
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
import { accessibility } from '@stacksjs/iconify-medical-icon'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/samcome/webfont-medical-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Samuel Frémondière ([Website](https://github.com/samcome/webfont-medical-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/medical-icon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/medical-icon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
