# Material Icon Theme

> Material Icon Theme icons for stx from Iconify

## Overview

This package provides access to 1104 icons from the Material Icon Theme collection through the stx iconify integration.

**Collection ID:** `material-icon-theme`
**Total Icons:** 1104
**Author:** Material Extensions ([Website](https://github.com/material-extensions/vscode-material-icon-theme))
**License:** MIT ([Details](https://github.com/material-extensions/vscode-material-icon-theme/blob/main/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-material-icon-theme
```

## Quick Start

### In stx Templates

```html
@js
  import { 3d, abap, abc } from '@stacksjs/iconify-material-icon-theme'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3d: renderIcon(3d, { size: 24 }),
    abap: renderIcon(abap, { size: 24, color: '#4a90e2' }),
    abc: renderIcon(abc, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3d !!}
  {!! icons.abap !!}
  {!! icons.abc !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3d, abap, abc } from '@stacksjs/iconify-material-icon-theme'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3d, { size: 24 })

// With custom color
const coloredIcon = renderIcon(abap, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(abc, {
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

This package contains **1104** icons. Here are some examples:

- `3d`
- `abap`
- `abc`
- `actionscript`
- `ada`

...and 1094 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/material-icon-theme/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3d, abap, abc, actionscript } from '@stacksjs/iconify-material-icon-theme'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3d: renderIcon(3d, { size: 20, class: 'nav-icon' }),
    abap: renderIcon(abap, { size: 20, class: 'nav-icon' }),
    abc: renderIcon(abc, { size: 20, class: 'nav-icon' }),
    actionscript: renderIcon(actionscript, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3d !!} Home</a>
  <a href="/about">{!! navIcons.abap !!} About</a>
  <a href="/contact">{!! navIcons.abc !!} Contact</a>
  <a href="/settings">{!! navIcons.actionscript !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3d } from '@stacksjs/iconify-material-icon-theme'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3d, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-material-icon-theme'
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
   import { 3d, abap } from '@stacksjs/iconify-material-icon-theme'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-material-icon-theme'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3d } from '@stacksjs/iconify-material-icon-theme'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3d, { size: 24 })
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
import { 3d } from '@stacksjs/iconify-material-icon-theme'

// Icons are typed as IconData
const myIcon: IconData = 3d
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/material-extensions/vscode-material-icon-theme/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Material Extensions ([Website](https://github.com/material-extensions/vscode-material-icon-theme))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/material-icon-theme/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/material-icon-theme/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
