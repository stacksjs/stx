# EOS Icons

> EOS Icons icons for stx from Iconify

## Overview

This package provides access to 253 icons from the EOS Icons collection through the stx iconify integration.

**Collection ID:** `eos-icons`
**Total Icons:** 253
**Author:** SUSE UX/UI team ([Website](https://gitlab.com/SUSE-UIUX/eos-icons))
**License:** MIT ([Details](https://gitlab.com/SUSE-UIUX/eos-icons/-/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-eos-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { 3dPrint, abstract, abstractIncomplete } from '@stacksjs/iconify-eos-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3dPrint: renderIcon(3dPrint, { size: 24 }),
    abstract: renderIcon(abstract, { size: 24, color: '#4a90e2' }),
    abstractIncomplete: renderIcon(abstractIncomplete, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3dPrint !!}
  {!! icons.abstract !!}
  {!! icons.abstractIncomplete !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3dPrint, abstract, abstractIncomplete } from '@stacksjs/iconify-eos-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3dPrint, { size: 24 })

// With custom color
const coloredIcon = renderIcon(abstract, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(abstractIncomplete, {
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

This package contains **253** icons. Here are some examples:

- `3dPrint`
- `abstract`
- `abstractIncomplete`
- `abstractInstance`
- `abstractInstanceOutlined`

...and 243 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/eos-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dPrint, abstract, abstractIncomplete, abstractInstance } from '@stacksjs/iconify-eos-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3dPrint: renderIcon(3dPrint, { size: 20, class: 'nav-icon' }),
    abstract: renderIcon(abstract, { size: 20, class: 'nav-icon' }),
    abstractIncomplete: renderIcon(abstractIncomplete, { size: 20, class: 'nav-icon' }),
    abstractInstance: renderIcon(abstractInstance, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3dPrint !!} Home</a>
  <a href="/about">{!! navIcons.abstract !!} About</a>
  <a href="/contact">{!! navIcons.abstractIncomplete !!} Contact</a>
  <a href="/settings">{!! navIcons.abstractInstance !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3dPrint } from '@stacksjs/iconify-eos-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3dPrint, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-eos-icons'
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
   import { 3dPrint, abstract } from '@stacksjs/iconify-eos-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-eos-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dPrint } from '@stacksjs/iconify-eos-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3dPrint, { size: 24 })
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
import { 3dPrint } from '@stacksjs/iconify-eos-icons'

// Icons are typed as IconData
const myIcon: IconData = 3dPrint
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://gitlab.com/SUSE-UIUX/eos-icons/-/blob/master/LICENSE) for more information.

## Credits

- **Icons**: SUSE UX/UI team ([Website](https://gitlab.com/SUSE-UIUX/eos-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/eos-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/eos-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
