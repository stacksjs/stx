# Open Iconic

> Open Iconic icons for stx from Iconify

## Overview

This package provides access to 223 icons from the Open Iconic collection through the stx iconify integration.

**Collection ID:** `oi`
**Total Icons:** 223
**Author:** Iconic ([Website](https://github.com/iconic/open-iconic))
**License:** MIT ([Details](https://github.com/iconic/open-iconic/blob/master/ICON-LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-oi
```

## Quick Start

### In stx Templates

```html
@js
  import { accountLogin, accountLogout, actionRedo } from '@stacksjs/iconify-oi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accountLogin: renderIcon(accountLogin, { size: 24 }),
    accountLogout: renderIcon(accountLogout, { size: 24, color: '#4a90e2' }),
    actionRedo: renderIcon(actionRedo, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accountLogin !!}
  {!! icons.accountLogout !!}
  {!! icons.actionRedo !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accountLogin, accountLogout, actionRedo } from '@stacksjs/iconify-oi'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accountLogin, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accountLogout, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(actionRedo, {
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

This package contains **223** icons. Here are some examples:

- `accountLogin`
- `accountLogout`
- `actionRedo`
- `actionUndo`
- `alignCenter`

...and 213 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/oi/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accountLogin, accountLogout, actionRedo, actionUndo } from '@stacksjs/iconify-oi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accountLogin: renderIcon(accountLogin, { size: 20, class: 'nav-icon' }),
    accountLogout: renderIcon(accountLogout, { size: 20, class: 'nav-icon' }),
    actionRedo: renderIcon(actionRedo, { size: 20, class: 'nav-icon' }),
    actionUndo: renderIcon(actionUndo, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accountLogin !!} Home</a>
  <a href="/about">{!! navIcons.accountLogout !!} About</a>
  <a href="/contact">{!! navIcons.actionRedo !!} Contact</a>
  <a href="/settings">{!! navIcons.actionUndo !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accountLogin } from '@stacksjs/iconify-oi'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accountLogin, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-oi'
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
   import { accountLogin, accountLogout } from '@stacksjs/iconify-oi'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-oi'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accountLogin } from '@stacksjs/iconify-oi'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accountLogin, { size: 24 })
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
import { accountLogin } from '@stacksjs/iconify-oi'

// Icons are typed as IconData
const myIcon: IconData = accountLogin
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/iconic/open-iconic/blob/master/ICON-LICENSE) for more information.

## Credits

- **Icons**: Iconic ([Website](https://github.com/iconic/open-iconic))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/oi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/oi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
