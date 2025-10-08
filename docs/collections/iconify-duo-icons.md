# Duoicons

> Duoicons icons for stx from Iconify

## Overview

This package provides access to 91 icons from the Duoicons collection through the stx iconify integration.

**Collection ID:** `duo-icons`
**Total Icons:** 91
**Author:** fernandcf ([Website](https://github.com/fazdiu/duo-icons))
**License:** MIT ([Details](https://github.com/fazdiu/duo-icons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-duo-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddCircleIcon, AirplayIcon, AlertOctagonIcon } from '@stacksjs/iconify-duo-icons'

// Basic usage
const icon = AddCircleIcon()

// With size
const sizedIcon = AddCircleIcon({ size: 24 })

// With color
const coloredIcon = AirplayIcon({ color: 'red' })

// With multiple props
const customIcon = AlertOctagonIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddCircleIcon, AirplayIcon, AlertOctagonIcon } from '@stacksjs/iconify-duo-icons'

  global.icons = {
    home: AddCircleIcon({ size: 24 }),
    user: AirplayIcon({ size: 24, color: '#4a90e2' }),
    settings: AlertOctagonIcon({ size: 32 })
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
import { addCircle, airplay, alertOctagon } from '@stacksjs/iconify-duo-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addCircle, { size: 24 })
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
const redIcon = AddCircleIcon({ color: 'red' })
const blueIcon = AddCircleIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddCircleIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddCircleIcon({ class: 'text-primary' })
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
const icon24 = AddCircleIcon({ size: 24 })
const icon1em = AddCircleIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddCircleIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddCircleIcon({ height: '1em' })
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
const smallIcon = AddCircleIcon({ class: 'icon-small' })
const largeIcon = AddCircleIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **91** icons:

- `addCircle`
- `airplay`
- `alertOctagon`
- `alertTriangle`
- `alignBottom`
- `alignCenter`
- `android`
- `app`
- `appDots`
- `apple`
- `approved`
- `appstore`
- `award`
- `babyCarriage`
- `bank`
- `battery`
- `bell`
- `bellBadge`
- `book`
- `book2`
- `book3`
- `bookmark`
- `box`
- `box2`
- `bread`
- `bridge`
- `briefcase`
- `brush`
- `brush2`
- `bug`
- `building`
- `bus`
- `cake`
- `calendar`
- `camera`
- `cameraSquare`
- `campground`
- `candle`
- `car`
- `certificate`
- `chartPie`
- `checkCircle`
- `chip`
- `clapperboard`
- `clipboard`
- `clock`
- `cloudLightning`
- `cloudSnow`
- `coinStack`
- `compass`
- `computerCamera`
- `computerCameraOff`
- `confetti`
- `creditCard`
- `currencyEuro`
- `dashboard`
- `discount`
- `disk`
- `file`
- `fire`
- `folderOpen`
- `folderUpload`
- `gTranslate`
- `idCard`
- `info`
- `lamp`
- `lamp2`
- `location`
- `marker`
- `menu`
- `message`
- `message2`
- `message3`
- `moon2`
- `moonStars`
- `palette`
- `rocket`
- `settings`
- `shoppingBag`
- `slideshow`
- `smartphone`
- `smartphoneVibration`
- `smartwatch`
- `sun`
- `target`
- `toggle`
- `translation`
- `uploadFile`
- `user`
- `userCard`
- `world`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddCircleIcon, AirplayIcon, AlertOctagonIcon, AlertTriangleIcon } from '@stacksjs/iconify-duo-icons'

  global.navIcons = {
    home: AddCircleIcon({ size: 20, class: 'nav-icon' }),
    about: AirplayIcon({ size: 20, class: 'nav-icon' }),
    contact: AlertOctagonIcon({ size: 20, class: 'nav-icon' }),
    settings: AlertTriangleIcon({ size: 20, class: 'nav-icon' })
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
import { AddCircleIcon } from '@stacksjs/iconify-duo-icons'

const icon = AddCircleIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddCircleIcon, AirplayIcon, AlertOctagonIcon } from '@stacksjs/iconify-duo-icons'

const successIcon = AddCircleIcon({ size: 16, color: '#22c55e' })
const warningIcon = AirplayIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlertOctagonIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddCircleIcon, AirplayIcon } from '@stacksjs/iconify-duo-icons'
   const icon = AddCircleIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addCircle, airplay } from '@stacksjs/iconify-duo-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addCircle, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddCircleIcon, AirplayIcon } from '@stacksjs/iconify-duo-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-duo-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddCircleIcon } from '@stacksjs/iconify-duo-icons'
     global.icon = AddCircleIcon({ size: 24 })
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
   const icon = AddCircleIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addCircle } from '@stacksjs/iconify-duo-icons'

// Icons are typed as IconData
const myIcon: IconData = addCircle
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/fazdiu/duo-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: fernandcf ([Website](https://github.com/fazdiu/duo-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/duo-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/duo-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
