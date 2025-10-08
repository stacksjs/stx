# Nimbus

> Nimbus icons for stx from Iconify

## Overview

This package provides access to 140 icons from the Nimbus collection through the stx iconify integration.

**Collection ID:** `nimbus`
**Total Icons:** 140
**Author:** Linkedstore S.A. ([Website](https://github.com/cyberalien/nimbus-icons))
**License:** MIT ([Details](https://github.com/cyberalien/nimbus-icons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-nimbus
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccordionIcon, AlignCenterIcon, AlignLeftIcon } from '@stacksjs/iconify-nimbus'

// Basic usage
const icon = AccordionIcon()

// With size
const sizedIcon = AccordionIcon({ size: 24 })

// With color
const coloredIcon = AlignCenterIcon({ color: 'red' })

// With multiple props
const customIcon = AlignLeftIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccordionIcon, AlignCenterIcon, AlignLeftIcon } from '@stacksjs/iconify-nimbus'

  global.icons = {
    home: AccordionIcon({ size: 24 }),
    user: AlignCenterIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignLeftIcon({ size: 32 })
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
import { accordion, alignCenter, alignLeft } from '@stacksjs/iconify-nimbus'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accordion, { size: 24 })
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
const redIcon = AccordionIcon({ color: 'red' })
const blueIcon = AccordionIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccordionIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccordionIcon({ class: 'text-primary' })
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
const icon24 = AccordionIcon({ size: 24 })
const icon1em = AccordionIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccordionIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccordionIcon({ height: '1em' })
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
const smallIcon = AccordionIcon({ class: 'icon-small' })
const largeIcon = AccordionIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **140** icons:

- `accordion`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `apps`
- `archive`
- `arrowLeft`
- `arrowRight`
- `arrowsHorizontal`
- `arrowsVertical`
- `backspace`
- `barcode`
- `bold`
- `boxPacked`
- `boxUnpacked`
- `briefcase`
- `browser`
- `browserSearch`
- `calendar`
- `calendarDays`
- `camera`
- `cash`
- `chatDots`
- `check`
- `checkCircle`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `christ`
- `clock`
- `close`
- `code`
- `cog`
- `colorPalette`
- `copy`
- `creditCard`
- `desktop`
- `discountCircle`
- `diskette`
- `download`
- `drag`
- `dragDots`
- `drink`
- `drop`
- `drums`
- `duplicate`
- `ecosystem`
- `edit`
- `ellipsis`
- `exclamationCircle`
- `exclamationTriangle`
- `externalLink`
- `eye`
- `eyeOff`
- `file`
- `fileAlt`
- `fingerprint`
- `fire`
- `flag`
- `font`
- `forbidden`
- `giftBox`
- `giftCard`
- `glasses`
- `globe`
- `guitar`
- `heart`
- `history`
- `home`
- `infinite`
- `infoCircle`
- `invoice`
- `italic`
- `lifeRing`
- `lightbulb`
- `link`
- `linkOff`
- `list`
- `location`
- `lock`
- `lockOpen`
- `logOut`
- `mail`
- `marketing`
- `mate`
- `menu`
- `mobile`
- `money`
- `moon`
- `notification`
- `obelisk`
- `orderedList`
- `pencil`
- `peso`
- `picture`
- `pix`
- `planet`
- `plusCircle`
- `printer`
- `pyramid`
- `qrCode`
- `questionCircle`
- `real`
- `redo`
- `removeFormat`
- `rocket`
- `scooter`
- `search`
- `share`
- `shoppingCart`
- `shot`
- `sizeHeight`
- `sizeWidth`
- `sliders`
- `star`
- `stats`
- `stickyNote`
- `stop`
- `store`
- `sun`
- `tag`
- `telephone`
- `textSize`
- `tiendanube`
- `tools`
- `transferPeso`
- `transferReal`
- `trash`
- `truck`
- `undo`
- `university`
- `upload`
- `user`
- `userCircle`
- `userGroup`
- `verticalStacks`
- `volume`
- `wallet`
- `whatsapp`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccordionIcon, AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from '@stacksjs/iconify-nimbus'

  global.navIcons = {
    home: AccordionIcon({ size: 20, class: 'nav-icon' }),
    about: AlignCenterIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignLeftIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignRightIcon({ size: 20, class: 'nav-icon' })
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
import { AccordionIcon } from '@stacksjs/iconify-nimbus'

const icon = AccordionIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccordionIcon, AlignCenterIcon, AlignLeftIcon } from '@stacksjs/iconify-nimbus'

const successIcon = AccordionIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlignCenterIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignLeftIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccordionIcon, AlignCenterIcon } from '@stacksjs/iconify-nimbus'
   const icon = AccordionIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accordion, alignCenter } from '@stacksjs/iconify-nimbus'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accordion, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccordionIcon, AlignCenterIcon } from '@stacksjs/iconify-nimbus'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-nimbus'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccordionIcon } from '@stacksjs/iconify-nimbus'
     global.icon = AccordionIcon({ size: 24 })
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
   const icon = AccordionIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accordion } from '@stacksjs/iconify-nimbus'

// Icons are typed as IconData
const myIcon: IconData = accordion
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/cyberalien/nimbus-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Linkedstore S.A. ([Website](https://github.com/cyberalien/nimbus-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/nimbus/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/nimbus/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
