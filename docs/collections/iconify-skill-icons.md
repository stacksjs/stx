# Skill Icons

> Skill Icons icons for stx from Iconify

## Overview

This package provides access to 397 icons from the Skill Icons collection through the stx iconify integration.

**Collection ID:** `skill-icons`
**Total Icons:** 397
**Author:** tandpfun ([Website](https://github.com/tandpfun/skill-icons))
**License:** MIT ([Details](https://github.com/tandpfun/skill-icons/blob/main/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-skill-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { abletonDark, abletonLight, activitypubDark } from '@stacksjs/iconify-skill-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    abletonDark: renderIcon(abletonDark, { size: 24 }),
    abletonLight: renderIcon(abletonLight, { size: 24, color: '#4a90e2' }),
    activitypubDark: renderIcon(activitypubDark, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.abletonDark !!}
  {!! icons.abletonLight !!}
  {!! icons.activitypubDark !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { abletonDark, abletonLight, activitypubDark } from '@stacksjs/iconify-skill-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(abletonDark, { size: 24 })

// With custom color
const coloredIcon = renderIcon(abletonLight, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(activitypubDark, {
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

This package contains **397** icons. Here are some examples:

- `abletonDark`
- `abletonLight`
- `activitypubDark`
- `activitypubLight`
- `actixDark`

...and 387 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/skill-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { abletonDark, abletonLight, activitypubDark, activitypubLight } from '@stacksjs/iconify-skill-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    abletonDark: renderIcon(abletonDark, { size: 20, class: 'nav-icon' }),
    abletonLight: renderIcon(abletonLight, { size: 20, class: 'nav-icon' }),
    activitypubDark: renderIcon(activitypubDark, { size: 20, class: 'nav-icon' }),
    activitypubLight: renderIcon(activitypubLight, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.abletonDark !!} Home</a>
  <a href="/about">{!! navIcons.abletonLight !!} About</a>
  <a href="/contact">{!! navIcons.activitypubDark !!} Contact</a>
  <a href="/settings">{!! navIcons.activitypubLight !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { abletonDark } from '@stacksjs/iconify-skill-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(abletonDark, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-skill-icons'
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
   import { abletonDark, abletonLight } from '@stacksjs/iconify-skill-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-skill-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { abletonDark } from '@stacksjs/iconify-skill-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(abletonDark, { size: 24 })
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
import { abletonDark } from '@stacksjs/iconify-skill-icons'

// Icons are typed as IconData
const myIcon: IconData = abletonDark
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/tandpfun/skill-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: tandpfun ([Website](https://github.com/tandpfun/skill-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/skill-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/skill-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
