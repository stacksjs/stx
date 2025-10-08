# Font Awesome 5 Regular

> Font Awesome 5 Regular icons for stx from Iconify

## Overview

This package provides access to 151 icons from the Font Awesome 5 Regular collection through the stx iconify integration.

**Collection ID:** `fa-regular`
**Total Icons:** 151
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa-regular
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddressBookIcon, AddressCardIcon, AngryIcon } from '@stacksjs/iconify-fa-regular'

// Basic usage
const icon = AddressBookIcon()

// With size
const sizedIcon = AddressBookIcon({ size: 24 })

// With color
const coloredIcon = AddressCardIcon({ color: 'red' })

// With multiple props
const customIcon = AngryIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddressBookIcon, AddressCardIcon, AngryIcon } from '@stacksjs/iconify-fa-regular'

  global.icons = {
    home: AddressBookIcon({ size: 24 }),
    user: AddressCardIcon({ size: 24, color: '#4a90e2' }),
    settings: AngryIcon({ size: 32 })
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
import { addressBook, addressCard, angry } from '@stacksjs/iconify-fa-regular'
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

This package contains **151** icons:

- `addressBook`
- `addressCard`
- `angry`
- `arrowAltCircleDown`
- `arrowAltCircleLeft`
- `arrowAltCircleRight`
- `arrowAltCircleUp`
- `bell`
- `bellSlash`
- `bookmark`
- `building`
- `calendar`
- `calendarAlt`
- `calendarCheck`
- `calendarMinus`
- `calendarPlus`
- `calendarTimes`
- `caretSquareDown`
- `caretSquareLeft`
- `caretSquareRight`
- `caretSquareUp`
- `chartBar`
- `checkCircle`
- `checkSquare`
- `circle`
- `clipboard`
- `clock`
- `clone`
- `closedCaptioning`
- `comment`
- `commentAlt`
- `commentDots`
- `comments`
- `compass`
- `copy`
- `copyright`
- `creditCard`
- `dizzy`
- `dotCircle`
- `edit`
- `envelope`
- `envelopeOpen`
- `eye`
- `eyeSlash`
- `file`
- `fileAlt`
- `fileArchive`
- `fileAudio`
- `fileCode`
- `fileExcel`
- `fileImage`
- `filePdf`
- `filePowerpoint`
- `fileVideo`
- `fileWord`
- `flag`
- `flushed`
- `folder`
- `folderOpen`
- `frown`
- `frownOpen`
- `futbol`
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
- `hdd`
- `heart`
- `hospital`
- `hourglass`
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
- `minusSquare`
- `moneyBillAlt`
- `moon`
- `newspaper`
- `objectGroup`
- `objectUngroup`
- `paperPlane`
- `pauseCircle`
- `playCircle`
- `plusSquare`
- `questionCircle`
- `registered`
- `sadCry`
- `sadTear`
- `save`
- `shareSquare`
- `smile`
- `smileBeam`
- `smileWink`
- `snowflake`
- `square`
- `star`
- `starHalf`
- `stickyNote`
- `stopCircle`
- `sun`
- `surprise`
- `thumbsDown`
- `thumbsUp`
- `timesCircle`
- `tired`
- `trashAlt`
- `user`
- `userCircle`
- `windowClose`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddressBookIcon, AddressCardIcon, AngryIcon, ArrowAltCircleDownIcon } from '@stacksjs/iconify-fa-regular'

  global.navIcons = {
    home: AddressBookIcon({ size: 20, class: 'nav-icon' }),
    about: AddressCardIcon({ size: 20, class: 'nav-icon' }),
    contact: AngryIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowAltCircleDownIcon({ size: 20, class: 'nav-icon' })
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
import { AddressBookIcon } from '@stacksjs/iconify-fa-regular'

const icon = AddressBookIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddressBookIcon, AddressCardIcon, AngryIcon } from '@stacksjs/iconify-fa-regular'

const successIcon = AddressBookIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddressCardIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AngryIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddressBookIcon, AddressCardIcon } from '@stacksjs/iconify-fa-regular'
   const icon = AddressBookIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addressBook, addressCard } from '@stacksjs/iconify-fa-regular'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addressBook, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddressBookIcon, AddressCardIcon } from '@stacksjs/iconify-fa-regular'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fa-regular'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddressBookIcon } from '@stacksjs/iconify-fa-regular'
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
import { addressBook } from '@stacksjs/iconify-fa-regular'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa-regular/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa-regular/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
