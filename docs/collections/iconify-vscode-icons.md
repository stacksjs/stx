# VSCode Icons

> VSCode Icons icons for stx from Iconify

## Overview

This package provides access to 1400 icons from the VSCode Icons collection through the stx iconify integration.

**Collection ID:** `vscode-icons`
**Total Icons:** 1400
**Author:** Roberto Huertas ([Website](https://github.com/vscode-icons/vscode-icons))
**License:** MIT ([Details](https://github.com/vscode-icons/vscode-icons/blob/master/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-vscode-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { defaultFile, defaultFolder, defaultFolderOpened } from '@stacksjs/iconify-vscode-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    defaultFile: renderIcon(defaultFile, { size: 24 }),
    defaultFolder: renderIcon(defaultFolder, { size: 24, color: '#4a90e2' }),
    defaultFolderOpened: renderIcon(defaultFolderOpened, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.defaultFile !!}
  {!! icons.defaultFolder !!}
  {!! icons.defaultFolderOpened !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { defaultFile, defaultFolder, defaultFolderOpened } from '@stacksjs/iconify-vscode-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(defaultFile, { size: 24 })

// With custom color
const coloredIcon = renderIcon(defaultFolder, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(defaultFolderOpened, {
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

This package contains **1400** icons. Here are some examples:

- `defaultFile`
- `defaultFolder`
- `defaultFolderOpened`
- `defaultRootFolder`
- `defaultRootFolderOpened`

...and 1390 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/vscode-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { defaultFile, defaultFolder, defaultFolderOpened, defaultRootFolder } from '@stacksjs/iconify-vscode-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    defaultFile: renderIcon(defaultFile, { size: 20, class: 'nav-icon' }),
    defaultFolder: renderIcon(defaultFolder, { size: 20, class: 'nav-icon' }),
    defaultFolderOpened: renderIcon(defaultFolderOpened, { size: 20, class: 'nav-icon' }),
    defaultRootFolder: renderIcon(defaultRootFolder, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.defaultFile !!} Home</a>
  <a href="/about">{!! navIcons.defaultFolder !!} About</a>
  <a href="/contact">{!! navIcons.defaultFolderOpened !!} Contact</a>
  <a href="/settings">{!! navIcons.defaultRootFolder !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { defaultFile } from '@stacksjs/iconify-vscode-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(defaultFile, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-vscode-icons'
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
   import { defaultFile, defaultFolder } from '@stacksjs/iconify-vscode-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-vscode-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { defaultFile } from '@stacksjs/iconify-vscode-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(defaultFile, { size: 24 })
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
import { defaultFile } from '@stacksjs/iconify-vscode-icons'

// Icons are typed as IconData
const myIcon: IconData = defaultFile
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/vscode-icons/vscode-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Roberto Huertas ([Website](https://github.com/vscode-icons/vscode-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/vscode-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/vscode-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
