# Material Design Icons

> Material Design Icons icons for stx from Iconify

## Overview

This package provides access to 7638 icons from the Material Design Icons collection through the stx iconify integration.

**Collection ID:** `mdi`
**Total Icons:** 7638
**Author:** Pictogrammers ([Website](https://github.com/Templarian/MaterialDesign))
**License:** Apache 2.0 ([Details](https://github.com/Templarian/MaterialDesign/blob/master/LICENSE))
**Category:** Material
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-mdi
```

## Quick Start

### In stx Templates

```html
@js
  import { abTesting, abacus, abjadArabic } from '@stacksjs/iconify-mdi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    abTesting: renderIcon(abTesting, { size: 24 }),
    abacus: renderIcon(abacus, { size: 24, color: '#4a90e2' }),
    abjadArabic: renderIcon(abjadArabic, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.abTesting !!}
  {!! icons.abacus !!}
  {!! icons.abjadArabic !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { abTesting, abacus, abjadArabic } from '@stacksjs/iconify-mdi'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(abTesting, { size: 24 })

// With custom color
const coloredIcon = renderIcon(abacus, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(abjadArabic, {
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

This package contains **7638** icons. Here are some examples:

- `abTesting`
- `abacus`
- `abjadArabic`
- `abjadHebrew`
- `abugidaDevanagari`

...and 7628 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/mdi/).

## Usage Examples

### Navigation Menu

```html
@js
  import { abTesting, abacus, abjadArabic, abjadHebrew } from '@stacksjs/iconify-mdi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    abTesting: renderIcon(abTesting, { size: 20, class: 'nav-icon' }),
    abacus: renderIcon(abacus, { size: 20, class: 'nav-icon' }),
    abjadArabic: renderIcon(abjadArabic, { size: 20, class: 'nav-icon' }),
    abjadHebrew: renderIcon(abjadHebrew, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.abTesting !!} Home</a>
  <a href="/about">{!! navIcons.abacus !!} About</a>
  <a href="/contact">{!! navIcons.abjadArabic !!} Contact</a>
  <a href="/settings">{!! navIcons.abjadHebrew !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { abTesting } from '@stacksjs/iconify-mdi'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(abTesting, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-mdi'
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
   import { abTesting, abacus } from '@stacksjs/iconify-mdi'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-mdi'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { abTesting } from '@stacksjs/iconify-mdi'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(abTesting, { size: 24 })
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
import { abTesting } from '@stacksjs/iconify-mdi'

// Icons are typed as IconData
const myIcon: IconData = abTesting
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Templarian/MaterialDesign/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Pictogrammers ([Website](https://github.com/Templarian/MaterialDesign))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/mdi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/mdi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
