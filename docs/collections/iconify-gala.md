# Gala Icons

> Gala Icons icons for stx from Iconify

## Overview

This package provides access to 51 icons from the Gala Icons collection through the stx iconify integration.

**Collection ID:** `gala`
**Total Icons:** 51
**Author:** Jake Wells ([Website](https://github.com/cyberalien/gala-icons))
**License:** GPL ([Details](https://github.com/cyberalien/gala-icons/blob/main/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gala
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddIcon, AirplayIcon, AppleIcon } from '@stacksjs/iconify-gala'

// Basic usage
const icon = AddIcon()

// With size
const sizedIcon = AddIcon({ size: 24 })

// With color
const coloredIcon = AirplayIcon({ color: 'red' })

// With multiple props
const customIcon = AppleIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddIcon, AirplayIcon, AppleIcon } from '@stacksjs/iconify-gala'

  global.icons = {
    home: AddIcon({ size: 24 }),
    user: AirplayIcon({ size: 24, color: '#4a90e2' }),
    settings: AppleIcon({ size: 32 })
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
import { add, airplay, apple } from '@stacksjs/iconify-gala'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(add, { size: 24 })
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
const redIcon = AddIcon({ color: 'red' })
const blueIcon = AddIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddIcon({ class: 'text-primary' })
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
const icon24 = AddIcon({ size: 24 })
const icon1em = AddIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddIcon({ height: '1em' })
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
const smallIcon = AddIcon({ class: 'icon-small' })
const largeIcon = AddIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **51** icons:

- `add`
- `airplay`
- `apple`
- `bag`
- `bell`
- `book`
- `brochure`
- `calendar`
- `chart`
- `chat`
- `clock`
- `copy`
- `data`
- `display`
- `editor`
- `file`
- `fileCode1`
- `fileCode2`
- `fileDocument`
- `fileError`
- `fileScript`
- `fileSpreadsheet`
- `fileText`
- `folder`
- `globe`
- `help`
- `image`
- `issue`
- `layer`
- `lock`
- `mouse`
- `multi`
- `orbit`
- `portrait1`
- `portrait2`
- `radar`
- `remove`
- `search`
- `secure`
- `select`
- `settings`
- `shield`
- `sidebarLeft`
- `sidebarRight`
- `store`
- `terminal`
- `tv`
- `unlock`
- `usb`
- `video`
- `window`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddIcon, AirplayIcon, AppleIcon, BagIcon } from '@stacksjs/iconify-gala'

  global.navIcons = {
    home: AddIcon({ size: 20, class: 'nav-icon' }),
    about: AirplayIcon({ size: 20, class: 'nav-icon' }),
    contact: AppleIcon({ size: 20, class: 'nav-icon' }),
    settings: BagIcon({ size: 20, class: 'nav-icon' })
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
import { AddIcon } from '@stacksjs/iconify-gala'

const icon = AddIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddIcon, AirplayIcon, AppleIcon } from '@stacksjs/iconify-gala'

const successIcon = AddIcon({ size: 16, color: '#22c55e' })
const warningIcon = AirplayIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AppleIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddIcon, AirplayIcon } from '@stacksjs/iconify-gala'
   const icon = AddIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { add, airplay } from '@stacksjs/iconify-gala'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(add, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddIcon, AirplayIcon } from '@stacksjs/iconify-gala'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-gala'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddIcon } from '@stacksjs/iconify-gala'
     global.icon = AddIcon({ size: 24 })
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
   const icon = AddIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { add } from '@stacksjs/iconify-gala'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL

See [license details](https://github.com/cyberalien/gala-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Jake Wells ([Website](https://github.com/cyberalien/gala-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gala/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gala/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
