# Prime Icons

> Prime Icons icons for stx from Iconify

## Overview

This package provides access to 313 icons from the Prime Icons collection through the stx iconify integration.

**Collection ID:** `prime`
**Total Icons:** 313
**Author:** PrimeTek ([Website](https://github.com/primefaces/primeicons))
**License:** MIT ([Details](https://github.com/primefaces/primeicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-prime
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddressBookIcon, AlignCenterIcon, AlignJustifyIcon } from '@stacksjs/iconify-prime'

// Basic usage
const icon = AddressBookIcon()

// With size
const sizedIcon = AddressBookIcon({ size: 24 })

// With color
const coloredIcon = AlignCenterIcon({ color: 'red' })

// With multiple props
const customIcon = AlignJustifyIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddressBookIcon, AlignCenterIcon, AlignJustifyIcon } from '@stacksjs/iconify-prime'

  global.icons = {
    home: AddressBookIcon({ size: 24 }),
    user: AlignCenterIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignJustifyIcon({ size: 32 })
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
import { addressBook, alignCenter, alignJustify } from '@stacksjs/iconify-prime'
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

This package contains **313** icons:

- `addressBook`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `android`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `apple`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownLeftAndArrowUpRightToCenter`
- `arrowDownRight`
- `arrowLeft`
- `arrowRight`
- `arrowRightArrowLeft`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpRight`
- `arrowUpRightAndArrowDownLeftFromCenter`
- `arrowsAlt`
- `arrowsH`
- `arrowsV`
- `asteriks`
- `at`
- `backward`
- `ban`
- `barcode`
- `bars`
- `bell`
- `bellSlash`
- `bitcoin`
- `bolt`
- `book`
- `bookmark`
- `bookmarkFill`
- `box`
- `briefcase`
- `building`
- `buildingColumns`
- `bullseye`
- `calculator`
- `calendar`
- `calendarClock`
- `calendarMinus`
- `calendarPlus`
- `calendarTimes`
- `camera`
- `car`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `cartArrowDown`
- `cartMinus`
- `cartPlus`
- `chartBar`
- `chartLine`
- `chartPie`
- `chartScatter`
- `check`
- `checkCircle`
- `checkSquare`
- `chevronCircleDown`
- `chevronCircleLeft`
- `chevronCircleRight`
- `chevronCircleUp`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `circle`
- `circleFill`
- `circleOff`
- `circleOn`
- `clipboard`
- `clock`
- `clone`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `code`
- `cog`
- `comment`
- `comments`
- `compass`
- `copy`
- `creditCard`
- `crown`
- `database`
- `deleteLeft`
- `desktop`
- `directions`
- `directionsAlt`
- `discord`
- `dollar`
- `download`
- `eject`
- `ellipsisH`
- `ellipsisV`
- `envelope`
- `equals`
- `eraser`
- `ethereum`
- `euro`
- `exclamationCircle`
- `exclamationTriangle`
- `expand`
- `externalLink`
- `eye`
- `eyeSlash`
- `faceSmile`
- `facebook`
- `fastBackward`
- `fastForward`
- `file`
- `fileArrowUp`
- `fileCheck`
- `fileEdit`
- `fileExcel`
- `fileExport`
- `fileImport`
- `fileO`
- `filePdf`
- `filePlus`
- `fileWord`
- `filter`
- `filterFill`
- `filterSlash`
- `flag`
- `flagFill`
- `folder`
- `folderOpen`
- `folderPlus`
- `forward`
- `gauge`
- `gift`
- `github`
- `globe`
- `google`
- `graduationCap`
- `hammer`
- `hashtag`
- `headphones`
- `heart`
- `heartFill`
- `history`
- `home`
- `hourglass`
- `idCard`
- `image`
- `images`
- `inbox`
- `indianRupee`
- `info`
- `infoCircle`
- `instagram`
- `key`
- `language`
- `lightbulb`
- `link`
- `linkedin`
- `list`
- `listCheck`
- `lock`
- `lockOpen`
- `map`
- `mapMarker`
- `mars`
- `megaphone`
- `microchip`
- `microchipAi`
- `microphone`
- `microsoft`
- `minus`
- `minusCircle`
- `mobile`
- `moneyBill`
- `moon`
- `objectsColumn`
- `palette`
- `paperclip`
- `pause`
- `pauseCircle`
- `paypal`
- `penToSquare`
- `pencil`
- `percentage`
- `phone`
- `pinterest`
- `play`
- `playCircle`
- `plus`
- `plusCircle`
- `pound`
- `powerOff`
- `prime`
- `print`
- `qrcode`
- `question`
- `questionCircle`
- `receipt`
- `reddit`
- `refresh`
- `replay`
- `reply`
- `save`
- `search`
- `searchMinus`
- `searchPlus`
- `send`
- `server`
- `shareAlt`
- `shield`
- `shop`
- `shoppingBag`
- `shoppingCart`
- `signIn`
- `signOut`
- `sitemap`
- `slack`
- `slidersH`
- `slidersV`
- `sort`
- `sortAlphaAltDown`
- `sortAlphaAltUp`
- `sortAlphaDown`
- `sortAlphaUp`
- `sortAlt`
- `sortAltSlash`
- `sortAmountDown`
- `sortAmountDownAlt`
- `sortAmountUp`
- `sortAmountUpAlt`
- `sortDown`
- `sortDownFill`
- `sortNumericAltDown`
- `sortNumericAltUp`
- `sortNumericDown`
- `sortNumericUp`
- `sortUp`
- `sortUpFill`
- `sparkles`
- `spinner`
- `spinnerDotted`
- `star`
- `starFill`
- `starHalf`
- `starHalfFill`
- `stepBackward`
- `stepBackwardAlt`
- `stepForward`
- `stepForwardAlt`
- `stop`
- `stopCircle`
- `stopwatch`
- `sun`
- `sync`
- `table`
- `tablet`
- `tag`
- `tags`
- `telegram`
- `thLarge`
- `thumbsDown`
- `thumbsDownFill`
- `thumbsUp`
- `thumbsUpFill`
- `thumbtack`
- `ticket`
- `tiktok`
- `times`
- `timesCircle`
- `trash`
- `trophy`
- `truck`
- `turkishLira`
- `twitch`
- `twitter`
- `undo`
- `unlock`
- `upload`
- `user`
- `userEdit`
- `userMinus`
- `userPlus`
- `users`
- `venus`
- `verified`
- `video`
- `vimeo`
- `volumeDown`
- `volumeOff`
- `volumeUp`
- `wallet`
- `warehouse`
- `wavePulse`
- `whatsapp`
- `wifi`
- `windowMaximize`
- `windowMinimize`
- `wrench`
- `youtube`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddressBookIcon, AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon } from '@stacksjs/iconify-prime'

  global.navIcons = {
    home: AddressBookIcon({ size: 20, class: 'nav-icon' }),
    about: AlignCenterIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignJustifyIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignLeftIcon({ size: 20, class: 'nav-icon' })
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
import { AddressBookIcon } from '@stacksjs/iconify-prime'

const icon = AddressBookIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddressBookIcon, AlignCenterIcon, AlignJustifyIcon } from '@stacksjs/iconify-prime'

const successIcon = AddressBookIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlignCenterIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignJustifyIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddressBookIcon, AlignCenterIcon } from '@stacksjs/iconify-prime'
   const icon = AddressBookIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addressBook, alignCenter } from '@stacksjs/iconify-prime'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addressBook, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddressBookIcon, AlignCenterIcon } from '@stacksjs/iconify-prime'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-prime'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddressBookIcon } from '@stacksjs/iconify-prime'
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
import { addressBook } from '@stacksjs/iconify-prime'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/primefaces/primeicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: PrimeTek ([Website](https://github.com/primefaces/primeicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/prime/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/prime/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
