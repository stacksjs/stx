# Codicons

> Codicons icons for stx from Iconify

## Overview

This package provides access to 501 icons from the Codicons collection through the stx iconify integration.

**Collection ID:** `codicon`
**Total Icons:** 501
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/vscode-codicons))
**License:** CC BY 4.0 ([Details](https://github.com/microsoft/vscode-codicons/blob/main/LICENSE))
**Category:** Programming
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-codicon
```

## Quick Start

### In stx Templates

```html
@js
  import { account, activateBreakpoints, add } from '@stacksjs/iconify-codicon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    account: renderIcon(account, { size: 24 }),
    activateBreakpoints: renderIcon(activateBreakpoints, { size: 24, color: '#4a90e2' }),
    add: renderIcon(add, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.account !!}
  {!! icons.activateBreakpoints !!}
  {!! icons.add !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { account, activateBreakpoints, add } from '@stacksjs/iconify-codicon'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(account, { size: 24 })

// With custom color
const coloredIcon = renderIcon(activateBreakpoints, {
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

This package contains **501** icons. Here are some examples:

- `account`
- `activateBreakpoints`
- `add`
- `archive`
- `arrowBoth`

...and 491 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/codicon/).

## Usage Examples

### Navigation Menu

```html
@js
  import { account, activateBreakpoints, add, archive } from '@stacksjs/iconify-codicon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    account: renderIcon(account, { size: 20, class: 'nav-icon' }),
    activateBreakpoints: renderIcon(activateBreakpoints, { size: 20, class: 'nav-icon' }),
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    archive: renderIcon(archive, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.account !!} Home</a>
  <a href="/about">{!! navIcons.activateBreakpoints !!} About</a>
  <a href="/contact">{!! navIcons.add !!} Contact</a>
  <a href="/settings">{!! navIcons.archive !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { account } from '@stacksjs/iconify-codicon'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(account, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-codicon'
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
   import { account, activateBreakpoints } from '@stacksjs/iconify-codicon'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-codicon'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { account } from '@stacksjs/iconify-codicon'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(account, { size: 24 })
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
import { account } from '@stacksjs/iconify-codicon'

// Icons are typed as IconData
const myIcon: IconData = account
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://github.com/microsoft/vscode-codicons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/vscode-codicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/codicon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/codicon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
