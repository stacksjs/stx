# Emoji One (v1)

> Emoji One (v1) icons for stx from Iconify

## Overview

This package provides access to 1262 icons from the Emoji One (v1) collection through the stx iconify integration.

**Collection ID:** `emojione-v1`
**Total Icons:** 1262
**Author:** Emoji One ([Website](https://github.com/joypixels/emojione-legacy))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** Emoji
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-emojione-v1
```

## Quick Start

### In stx Templates

```html
@js
  import { aButton, abButton, admissionTickets } from '@stacksjs/iconify-emojione-v1'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aButton: renderIcon(aButton, { size: 24 }),
    abButton: renderIcon(abButton, { size: 24, color: '#4a90e2' }),
    admissionTickets: renderIcon(admissionTickets, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aButton !!}
  {!! icons.abButton !!}
  {!! icons.admissionTickets !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aButton, abButton, admissionTickets } from '@stacksjs/iconify-emojione-v1'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aButton, { size: 24 })

// With custom color
const coloredIcon = renderIcon(abButton, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(admissionTickets, {
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

This package contains **1262** icons. Here are some examples:

- `aButton`
- `abButton`
- `admissionTickets`
- `aerialTramway`
- `airplane`

...and 1252 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/emojione-v1/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aButton, abButton, admissionTickets, aerialTramway } from '@stacksjs/iconify-emojione-v1'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aButton: renderIcon(aButton, { size: 20, class: 'nav-icon' }),
    abButton: renderIcon(abButton, { size: 20, class: 'nav-icon' }),
    admissionTickets: renderIcon(admissionTickets, { size: 20, class: 'nav-icon' }),
    aerialTramway: renderIcon(aerialTramway, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aButton !!} Home</a>
  <a href="/about">{!! navIcons.abButton !!} About</a>
  <a href="/contact">{!! navIcons.admissionTickets !!} Contact</a>
  <a href="/settings">{!! navIcons.aerialTramway !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aButton } from '@stacksjs/iconify-emojione-v1'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aButton, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-emojione-v1'
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
   import { aButton, abButton } from '@stacksjs/iconify-emojione-v1'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-emojione-v1'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aButton } from '@stacksjs/iconify-emojione-v1'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(aButton, { size: 24 })
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
import { aButton } from '@stacksjs/iconify-emojione-v1'

// Icons are typed as IconData
const myIcon: IconData = aButton
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Emoji One ([Website](https://github.com/joypixels/emojione-legacy))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/emojione-v1/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/emojione-v1/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
