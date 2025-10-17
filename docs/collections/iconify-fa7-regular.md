# Font Awesome Regular

> Font Awesome Regular icons for stx from Iconify

## Overview

This package provides access to 272 icons from the Font Awesome Regular collection through the stx iconify integration.

**Collection ID:** `fa7-regular`
**Total Icons:** 272
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa7-regular
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddressBookIcon height="1em" />
<AddressBookIcon width="1em" height="1em" />
<AddressBookIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddressBookIcon size="24" />
<AddressBookIcon size="1em" />

<!-- Using width and height -->
<AddressBookIcon width="24" height="32" />

<!-- With color -->
<AddressBookIcon size="24" color="red" />
<AddressBookIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddressBookIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddressBookIcon
  size="32"
  color="#4a90e2"
  class="my-icon"
  style="opacity: 0.8;"
/>
```

### In stx Templates

```html
<!DOCTYPE html>
<html>
<head>
  <title>Icon Demo</title>
  <style>
    .icon-grid {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="icon-grid">
    <AddressBookIcon size="24" />
    <AddressCardIcon size="24" color="#4a90e2" />
    <AlarmClockIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addressBook, addressCard, alarmClock } from '@stacksjs/iconify-fa7-regular'
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

```html
<!-- Via color property -->
<AddressBookIcon size="24" color="red" />
<AddressBookIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddressBookIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddressBookIcon size="24" class="text-primary" />
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

Unlike other components, SVG + CSS components do not set icon size by default. This has advantages and disadvantages.

**Disadvantages:**
- You need to set size yourself.

**Advantages:**
- You have full control over icon size.

You can change icon size by:
- Setting `width` and `height` properties
- Using CSS

### Properties

All icon components support `width` and `height` properties.

Value is a string or number.

You do not need to set both properties. If you set one property, the other property will automatically be calculated from the icon's width/height ratio.

**Examples:**

```html
<AddressBookIcon height="1em" />
<AddressBookIcon width="1em" height="1em" />
<AddressBookIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddressBookIcon size="24" />
<AddressBookIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fa7Regular-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddressBookIcon class="fa7Regular-icon" />
```

## Available Icons

This package contains **272** icons:

- `addressBook`
- `addressCard`
- `alarmClock`
- `angry`
- `arrowAltCircleDown`
- `arrowAltCircleLeft`
- `arrowAltCircleRight`
- `arrowAltCircleUp`
- `barChart`
- `bell`
- `bellSlash`
- `bookmark`
- `building`
- `calendar`
- `calendarAlt`
- `calendarCheck`
- `calendarDays`
- `calendarMinus`
- `calendarPlus`
- `calendarTimes`
- `calendarXmark`
- `camera`
- `cameraAlt`
- `caretSquareDown`
- `caretSquareLeft`
- `caretSquareRight`
- `caretSquareUp`
- `chartBar`
- `checkCircle`
- `checkSquare`
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
- `clockFour`
- `clone`
- `closedCaptioning`
- `cloud`
- `comment`
- `commentAlt`
- `commentDots`
- `commenting`
- `comments`
- `compass`
- `contactBook`
- `contactCard`
- `copy`
- `copyright`
- `creditCard`
- `creditCardAlt`
- `dizzy`
- `dotCircle`
- `driversLicense`
- `edit`
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
- `fileAlt`
- `fileArchive`
- `fileAudio`
- `fileClipboard`
- `fileCode`
- `fileExcel`
- `fileImage`
- `fileLines`
- `filePdf`
- `filePowerpoint`
- `fileText`
- `fileVideo`
- `fileWord`
- `fileZipper`
- `flag`
- `floppyDisk`
- `flushed`
- `folder`
- `folderBlank`
- `folderClosed`
- `folderOpen`
- `fontAwesome`
- `fontAwesomeFlag`
- `frown`
- `frownOpen`
- `futbol`
- `futbolBall`
- `gem`
- `grimace`
- `grin`
- `grinAlt`
- `grinBeam`
- `grinBeamSweat`
- `grinHearts`
- `grinSquint`
- `grinSquintTears`
- `grinStars`
- `grinTears`
- `grinTongue`
- `grinTongueSquint`
- `grinTongueWink`
- `grinWink`
- `hand`
- `handBackFist`
- `handLizard`
- `handPaper`
- `handPeace`
- `handPointDown`
- `handPointLeft`
- `handPointRight`
- `handPointUp`
- `handPointer`
- `handRock`
- `handScissors`
- `handSpock`
- `handshake`
- `handshakeAlt`
- `handshakeSimple`
- `hardDrive`
- `hdd`
- `headphones`
- `headphonesAlt`
- `headphonesSimple`
- `heart`
- `home`
- `homeAlt`
- `homeLgAlt`
- `hospital`
- `hospitalAlt`
- `hospitalWide`
- `hourglass`
- `hourglass2`
- `hourglassEmpty`
- `hourglassHalf`
- `house`
- `idBadge`
- `idCard`
- `image`
- `images`
- `keyboard`
- `kiss`
- `kissBeam`
- `kissWinkHeart`
- `laugh`
- `laughBeam`
- `laughSquint`
- `laughWink`
- `lemon`
- `lifeRing`
- `lightbulb`
- `listAlt`
- `map`
- `meh`
- `mehBlank`
- `mehRollingEyes`
- `message`
- `minusSquare`
- `moneyBill1`
- `moneyBillAlt`
- `moon`
- `newspaper`
- `noteSticky`
- `objectGroup`
- `objectUngroup`
- `paperPlane`
- `paste`
- `pauseCircle`
- `penToSquare`
- `playCircle`
- `plusSquare`
- `questionCircle`
- `rectangleList`
- `rectangleTimes`
- `rectangleXmark`
- `registered`
- `sadCry`
- `sadTear`
- `save`
- `shareFromSquare`
- `shareSquare`
- `smile`
- `smileBeam`
- `smileWink`
- `snowflake`
- `soccerBall`
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
- `starHalfAlt`
- `starHalfStroke`
- `stickyNote`
- `stopCircle`
- `sun`
- `surprise`
- `thumbsDown`
- `thumbsUp`
- `timesCircle`
- `timesRectangle`
- `tired`
- `trashAlt`
- `trashCan`
- `truck`
- `user`
- `userAlt`
- `userCircle`
- `userLarge`
- `vcard`
- `windowClose`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`
- `xmarkCircle`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddressBookIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddressCardIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmClockIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AngryIcon size="20" class="nav-icon" /> Settings</a>
</nav>

<style>
  nav {
    display: flex;
    gap: 1rem;
  }
  nav a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .nav-icon {
    color: currentColor;
  }
</style>
```

### Custom Styling

```html
<AddressBookIcon
  size="24"
  class="icon icon-primary"
  style="opacity: 0.8; transition: opacity 0.2s;"
/>

<style>
  .icon-primary {
    color: #4a90e2;
  }
  .icon-primary:hover {
    opacity: 1;
  }
</style>
```

### Status Indicators

```html
<div class="status-grid">
  <div class="status-item">
    <AddressBookIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddressCardIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmClockIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddressBookIcon size="24" />
   <AddressCardIcon size="24" color="#4a90e2" />
   ```

2. **Use CSS for Theming**: Apply consistent styling through CSS classes
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

   ```html
   <AddressBookIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddressBookIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddressBookIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addressBook } from '@stacksjs/iconify-fa7-regular'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addressBook, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addressBook } from '@stacksjs/iconify-fa7-regular'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa7-regular/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa7-regular/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
