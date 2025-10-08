# Lucide

> Lucide icons for stx from Iconify

## Overview

This package provides access to 3 icons from the Lucide collection through the stx iconify integration.

**Collection ID:** `lucide`
**Total Icons:** 3
**Author:** Lucide Contributors ([Website](https://github.com/lucide-icons/lucide))
**License:** ISC ([Details](https://github.com/lucide-icons/lucide/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lucide
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { HouseIcon, SettingsIcon, UserIcon } from '@stacksjs/iconify-lucide'

// Basic usage
const icon = HouseIcon()

// With size
const sizedIcon = HouseIcon({ size: 24 })

// With color
const coloredIcon = SettingsIcon({ color: 'red' })

// With multiple props
const customIcon = UserIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { HouseIcon, SettingsIcon, UserIcon } from '@stacksjs/iconify-lucide'

  global.icons = {
    home: HouseIcon({ size: 24 }),
    user: SettingsIcon({ size: 24, color: '#4a90e2' }),
    settings: UserIcon({ size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.home !!}
  {!! icons.user !!}
  {!! icons.settings !!}
</div>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { house, settings, user } from '@stacksjs/iconify-lucide'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(house, { size: 24 })
```

## Icon Properties

All icon component functions and `renderIcon` accept the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `string \| number` | - | Icon size (sets both width and height) |
| `width` | `string \| number` | - | Icon width (overrides size) |
| `height` | `string \| number` | - | Icon height (overrides size) |
| `color` | `string` | `'currentColor'` | Icon color (CSS color or hex) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation in degrees |
| `class` | `string` | - | Additional CSS classes |
| `style` | `string` | - | Inline styles |

## Color

### Monotone Icons

Monotone icons use `currentColor` by default, allowing you to change icon color via the `color` property or CSS:

```typescript
// Via color property
const redIcon = HouseIcon({ color: 'red' })
const blueIcon = HouseIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = HouseIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = HouseIcon({ class: 'text-primary' })
```

```css
/* In your CSS */
.text-primary {
  color: #4a90e2;
}

.icon:hover {
  color: #357abd;
}
```

## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = HouseIcon({ size: 24 })
const icon1em = HouseIcon({ size: '1em' })

// Set individual dimensions
const customIcon = HouseIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = HouseIcon({ height: '1em' })
```

### CSS Sizing

You can also control icon size via CSS:

```css
.icon-small {
  width: 1em;
  height: 1em;
}

.icon-large {
  width: 2em;
  height: 2em;
}
```

```typescript
const smallIcon = HouseIcon({ class: 'icon-small' })
const largeIcon = HouseIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **3** icons:

- `house`
- `settings`
- `user`

## Usage Examples

### Navigation Menu

```html
@js
  import { HouseIcon, SettingsIcon, UserIcon } from '@stacksjs/iconify-lucide'

  global.navIcons = {
    home: HouseIcon({ size: 20, class: 'nav-icon' }),
    about: SettingsIcon({ size: 20, class: 'nav-icon' }),
    contact: UserIcon({ size: 20, class: 'nav-icon' }),
    settings: Icon({ size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.home !!} Home</a>
  <a href="/about">{!! navIcons.about !!} About</a>
  <a href="/contact">{!! navIcons.contact !!} Contact</a>
  <a href="/settings">{!! navIcons.settings !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { HouseIcon } from '@stacksjs/iconify-lucide'

const icon = HouseIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { HouseIcon, SettingsIcon, UserIcon } from '@stacksjs/iconify-lucide'

const successIcon = HouseIcon({ size: 16, color: '#22c55e' })
const warningIcon = SettingsIcon({ size: 16, color: '#f59e0b' })
const errorIcon = UserIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { HouseIcon, SettingsIcon } from '@stacksjs/iconify-lucide'
   const icon = HouseIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { house, settings } from '@stacksjs/iconify-lucide'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(house, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { HouseIcon, SettingsIcon } from '@stacksjs/iconify-lucide'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-lucide'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { HouseIcon } from '@stacksjs/iconify-lucide'
     global.icon = HouseIcon({ size: 24 })
   @endjs

   {!! icon !!}
   {!! icon !!}
   {!! icon !!}
   ```

4. **Use CSS for Theming**: Apply consistent styling through CSS classes
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

   ```typescript
   const icon = HouseIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { house } from '@stacksjs/iconify-lucide'

// Icons are typed as IconData
const myIcon: IconData = house
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

ISC

See [license details](https://github.com/lucide-icons/lucide/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Lucide Contributors ([Website](https://github.com/lucide-icons/lucide))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lucide/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lucide/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
