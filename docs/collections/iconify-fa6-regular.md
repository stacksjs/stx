# Font Awesome 6 Regular

> Font Awesome 6 Regular icons for stx from Iconify

## Overview

This package provides access to 164 icons from the Font Awesome 6 Regular collection through the stx iconify integration.

**Collection ID:** `fa6-regular`
**Total Icons:** 164
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa6-regular
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddressBookIcon, AddressCardIcon, BellIcon } from '@stacksjs/iconify-fa6-regular'

// Basic usage
const icon = AddressBookIcon()

// With size
const sizedIcon = AddressBookIcon({ size: 24 })

// With color
const coloredIcon = AddressCardIcon({ color: 'red' })

// With multiple props
const customIcon = BellIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddressBookIcon, AddressCardIcon, BellIcon } from '@stacksjs/iconify-fa6-regular'

  global.icons = {
    home: AddressBookIcon({ size: 24 }),
    user: AddressCardIcon({ size: 24, color: '#4a90e2' }),
    settings: BellIcon({ size: 32 })
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
import { addressBook, addressCard, bell } from '@stacksjs/iconify-fa6-regular'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addressBook, { size: 24 })
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
const redIcon = AddressBookIcon({ color: 'red' })
const blueIcon = AddressBookIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddressBookIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddressBookIcon({ class: 'text-primary' })
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
const icon24 = AddressBookIcon({ size: 24 })
const icon1em = AddressBookIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddressBookIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddressBookIcon({ height: '1em' })
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
const smallIcon = AddressBookIcon({ class: 'icon-small' })
const largeIcon = AddressBookIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **164** icons:

- `addressBook`
- `addressCard`
- `bell`
- `bellSlash`
- `bookmark`
- `building`
- `calendar`
- `calendarCheck`
- `calendarDays`
- `calendarMinus`
- `calendarPlus`
- `calendarXmark`
- `chartBar`
- `chessBishop`
- `chessKing`
- `chessKnight`
- `chessPawn`
- `chessQueen`
- `chessRook`
- `circle`
- `circleCheck`
- `circleDot`
- `circleDown`
- `circleLeft`
- `circlePause`
- `circlePlay`
- `circleQuestion`
- `circleRight`
- `circleStop`
- `circleUp`
- `circleUser`
- `circleXmark`
- `clipboard`
- `clock`
- `clone`
- `closedCaptioning`
- `comment`
- `commentDots`
- `comments`
- `compass`
- `copy`
- `copyright`
- `creditCard`
- `envelope`
- `envelopeOpen`
- `eye`
- `eyeSlash`
- `faceAngry`
- `faceDizzy`
- `faceFlushed`
- `faceFrown`
- `faceFrownOpen`
- `faceGrimace`
- `faceGrin`
- `faceGrinBeam`
- `faceGrinBeamSweat`
- `faceGrinHearts`
- `faceGrinSquint`
- `faceGrinSquintTears`
- `faceGrinStars`
- `faceGrinTears`
- `faceGrinTongue`
- `faceGrinTongueSquint`
- `faceGrinTongueWink`
- `faceGrinWide`
- `faceGrinWink`
- `faceKiss`
- `faceKissBeam`
- `faceKissWinkHeart`
- `faceLaugh`
- `faceLaughBeam`
- `faceLaughSquint`
- `faceLaughWink`
- `faceMeh`
- `faceMehBlank`
- `faceRollingEyes`
- `faceSadCry`
- `faceSadTear`
- `faceSmile`
- `faceSmileBeam`
- `faceSmileWink`
- `faceSurprise`
- `faceTired`
- `file`
- `fileAudio`
- `fileCode`
- `fileExcel`
- `fileImage`
- `fileLines`
- `filePdf`
- `filePowerpoint`
- `fileVideo`
- `fileWord`
- `fileZipper`
- `flag`
- `floppyDisk`
- `folder`
- `folderClosed`
- `folderOpen`
- `fontAwesome`
- `futbol`
- `gem`
- `hand`
- `handBackFist`
- `handLizard`
- `handPeace`
- `handPointDown`
- `handPointLeft`
- `handPointRight`
- `handPointUp`
- `handPointer`
- `handScissors`
- `handSpock`
- `handshake`
- `hardDrive`
- `heart`
- `hospital`
- `hourglass`
- `hourglassHalf`
- `idBadge`
- `idCard`
- `image`
- `images`
- `keyboard`
- `lemon`
- `lifeRing`
- `lightbulb`
- `map`
- `message`
- `moneyBill1`
- `moon`
- `newspaper`
- `notdef`
- `noteSticky`
- `objectGroup`
- `objectUngroup`
- `paperPlane`
- `paste`
- `penToSquare`
- `rectangleList`
- `rectangleXmark`
- `registered`
- `shareFromSquare`
- `snowflake`
- `square`
- `squareCaretDown`
- `squareCaretLeft`
- `squareCaretRight`
- `squareCaretUp`
- `squareCheck`
- `squareFull`
- `squareMinus`
- `squarePlus`
- `star`
- `starHalf`
- `starHalfStroke`
- `sun`
- `thumbsDown`
- `thumbsUp`
- `trashCan`
- `user`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddressBookIcon, AddressCardIcon, BellIcon, BellSlashIcon } from '@stacksjs/iconify-fa6-regular'

  global.navIcons = {
    home: AddressBookIcon({ size: 20, class: 'nav-icon' }),
    about: AddressCardIcon({ size: 20, class: 'nav-icon' }),
    contact: BellIcon({ size: 20, class: 'nav-icon' }),
    settings: BellSlashIcon({ size: 20, class: 'nav-icon' })
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
import { AddressBookIcon } from '@stacksjs/iconify-fa6-regular'

const icon = AddressBookIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddressBookIcon, AddressCardIcon, BellIcon } from '@stacksjs/iconify-fa6-regular'

const successIcon = AddressBookIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddressCardIcon({ size: 16, color: '#f59e0b' })
const errorIcon = BellIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddressBookIcon, AddressCardIcon } from '@stacksjs/iconify-fa6-regular'
   const icon = AddressBookIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addressBook, addressCard } from '@stacksjs/iconify-fa6-regular'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addressBook, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddressBookIcon, AddressCardIcon } from '@stacksjs/iconify-fa6-regular'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fa6-regular'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddressBookIcon } from '@stacksjs/iconify-fa6-regular'
     global.icon = AddressBookIcon({ size: 24 })
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
   const icon = AddressBookIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addressBook } from '@stacksjs/iconify-fa6-regular'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa6-regular/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa6-regular/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
