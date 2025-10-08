# Fontelico

> Fontelico icons for stx from Iconify

## Overview

This package provides access to 34 icons from the Fontelico collection through the stx iconify integration.

**Collection ID:** `fontelico`
**Total Icons:** 34
**Author:** Fontello ([Website](https://github.com/fontello/fontelico.font))
**License:** CC BY SA ([Details](https://creativecommons.org/licenses/by-sa/3.0/))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fontelico
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ChromeIcon, CrownIcon, CrownMinusIcon } from '@stacksjs/iconify-fontelico'

// Basic usage
const icon = ChromeIcon()

// With size
const sizedIcon = ChromeIcon({ size: 24 })

// With color
const coloredIcon = CrownIcon({ color: 'red' })

// With multiple props
const customIcon = CrownMinusIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ChromeIcon, CrownIcon, CrownMinusIcon } from '@stacksjs/iconify-fontelico'

  global.icons = {
    home: ChromeIcon({ size: 24 }),
    user: CrownIcon({ size: 24, color: '#4a90e2' }),
    settings: CrownMinusIcon({ size: 32 })
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
import { chrome, crown, crownMinus } from '@stacksjs/iconify-fontelico'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(chrome, { size: 24 })
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
const redIcon = ChromeIcon({ color: 'red' })
const blueIcon = ChromeIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ChromeIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ChromeIcon({ class: 'text-primary' })
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
const icon24 = ChromeIcon({ size: 24 })
const icon1em = ChromeIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ChromeIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ChromeIcon({ height: '1em' })
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
const smallIcon = ChromeIcon({ class: 'icon-small' })
const largeIcon = ChromeIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **34** icons:

- `chrome`
- `crown`
- `crownMinus`
- `crownPlus`
- `emoAngry`
- `emoBeer`
- `emoCoffee`
- `emoCry`
- `emoDevil`
- `emoDispleased`
- `emoGrin`
- `emoHappy`
- `emoLaugh`
- `emoSaint`
- `emoShoot`
- `emoSleep`
- `emoSquint`
- `emoSunglasses`
- `emoSurprised`
- `emoThumbsup`
- `emoTongue`
- `emoUnhappy`
- `emoWink`
- `emoWink2`
- `firefox`
- `ie`
- `marquee`
- `opera`
- `spin1`
- `spin2`
- `spin3`
- `spin4`
- `spin5`
- `spin6`

## Usage Examples

### Navigation Menu

```html
@js
  import { ChromeIcon, CrownIcon, CrownMinusIcon, CrownPlusIcon } from '@stacksjs/iconify-fontelico'

  global.navIcons = {
    home: ChromeIcon({ size: 20, class: 'nav-icon' }),
    about: CrownIcon({ size: 20, class: 'nav-icon' }),
    contact: CrownMinusIcon({ size: 20, class: 'nav-icon' }),
    settings: CrownPlusIcon({ size: 20, class: 'nav-icon' })
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
import { ChromeIcon } from '@stacksjs/iconify-fontelico'

const icon = ChromeIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ChromeIcon, CrownIcon, CrownMinusIcon } from '@stacksjs/iconify-fontelico'

const successIcon = ChromeIcon({ size: 16, color: '#22c55e' })
const warningIcon = CrownIcon({ size: 16, color: '#f59e0b' })
const errorIcon = CrownMinusIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ChromeIcon, CrownIcon } from '@stacksjs/iconify-fontelico'
   const icon = ChromeIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { chrome, crown } from '@stacksjs/iconify-fontelico'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(chrome, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ChromeIcon, CrownIcon } from '@stacksjs/iconify-fontelico'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fontelico'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ChromeIcon } from '@stacksjs/iconify-fontelico'
     global.icon = ChromeIcon({ size: 24 })
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
   const icon = ChromeIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { chrome } from '@stacksjs/iconify-fontelico'

// Icons are typed as IconData
const myIcon: IconData = chrome
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY SA

See [license details](https://creativecommons.org/licenses/by-sa/3.0/) for more information.

## Credits

- **Icons**: Fontello ([Website](https://github.com/fontello/fontelico.font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fontelico/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fontelico/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
