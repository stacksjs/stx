# Lineicons

> Lineicons icons for stx from Iconify

## Overview

This package provides access to 962 icons from the Lineicons collection through the stx iconify integration.

**Collection ID:** `lineicons`
**Total Icons:** 962
**Author:** Lineicons ([Website](https://github.com/LineiconsHQ/Lineicons))
**License:** MIT ([Details](https://github.com/LineiconsHQ/Lineicons/blob/main/LICENSE.md))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lineicons
```

## Quick Start

### In stx Templates

```html
@js
  import { 500px, addFiles, adobe } from '@stacksjs/iconify-lineicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    500px: renderIcon(500px, { size: 24 }),
    addFiles: renderIcon(addFiles, { size: 24, color: '#4a90e2' }),
    adobe: renderIcon(adobe, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.500px !!}
  {!! icons.addFiles !!}
  {!! icons.adobe !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 500px, addFiles, adobe } from '@stacksjs/iconify-lineicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(500px, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addFiles, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adobe, {
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

This package contains **962** icons. Here are some examples:

- `500px`
- `addFiles`
- `adobe`
- `adonis`
- `aeroplane1`

...and 952 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/lineicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 500px, addFiles, adobe, adonis } from '@stacksjs/iconify-lineicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    addFiles: renderIcon(addFiles, { size: 20, class: 'nav-icon' }),
    adobe: renderIcon(adobe, { size: 20, class: 'nav-icon' }),
    adonis: renderIcon(adonis, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.500px !!} Home</a>
  <a href="/about">{!! navIcons.addFiles !!} About</a>
  <a href="/contact">{!! navIcons.adobe !!} Contact</a>
  <a href="/settings">{!! navIcons.adonis !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 500px } from '@stacksjs/iconify-lineicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(500px, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-lineicons'
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
   import { 500px, addFiles } from '@stacksjs/iconify-lineicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-lineicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-lineicons'
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
import { 500px } from '@stacksjs/iconify-lineicons'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/LineiconsHQ/Lineicons/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: Lineicons ([Website](https://github.com/LineiconsHQ/Lineicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lineicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lineicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
