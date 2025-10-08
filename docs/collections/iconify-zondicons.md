# Zondicons

> Zondicons icons for stx from Iconify

## Overview

This package provides access to 297 icons from the Zondicons collection through the stx iconify integration.

**Collection ID:** `zondicons`
**Total Icons:** 297
**Author:** Steve Schoger ([Website](https://github.com/dukestreetstudio/zondicons))
**License:** MIT ([Details](https://github.com/dukestreetstudio/zondicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-zondicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddOutlineIcon, AddSolidIcon, AdjustIcon } from '@stacksjs/iconify-zondicons'

// Basic usage
const icon = AddOutlineIcon()

// With size
const sizedIcon = AddOutlineIcon({ size: 24 })

// With color
const coloredIcon = AddSolidIcon({ color: 'red' })

// With multiple props
const customIcon = AdjustIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddOutlineIcon, AddSolidIcon, AdjustIcon } from '@stacksjs/iconify-zondicons'

  global.icons = {
    home: AddOutlineIcon({ size: 24 }),
    user: AddSolidIcon({ size: 24, color: '#4a90e2' }),
    settings: AdjustIcon({ size: 32 })
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
import { addOutline, addSolid, adjust } from '@stacksjs/iconify-zondicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addOutline, { size: 24 })
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
const redIcon = AddOutlineIcon({ color: 'red' })
const blueIcon = AddOutlineIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddOutlineIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddOutlineIcon({ class: 'text-primary' })
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
const icon24 = AddOutlineIcon({ size: 24 })
const icon1em = AddOutlineIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddOutlineIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddOutlineIcon({ height: '1em' })
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
const smallIcon = AddOutlineIcon({ class: 'icon-small' })
const largeIcon = AddOutlineIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **297** icons:

- `addOutline`
- `addSolid`
- `adjust`
- `airplane`
- `album`
- `alignCenter`
- `alignJustified`
- `alignLeft`
- `alignRight`
- `anchor`
- `announcement`
- `apparel`
- `arrowDown`
- `arrowLeft`
- `arrowOutlineDown`
- `arrowOutlineLeft`
- `arrowOutlineRight`
- `arrowOutlineUp`
- `arrowRight`
- `arrowThickDown`
- `arrowThickLeft`
- `arrowThickRight`
- `arrowThickUp`
- `arrowThinDown`
- `arrowThinLeft`
- `arrowThinRight`
- `arrowThinUp`
- `arrowUp`
- `artist`
- `atSymbol`
- `attachment`
- `backspace`
- `backward`
- `backwardStep`
- `badge`
- `batteryFull`
- `batteryHalf`
- `batteryLow`
- `beverage`
- `block`
- `bluetooth`
- `bolt`
- `bookReference`
- `bookmark`
- `bookmarkCopy2`
- `bookmarkCopy3`
- `bookmarkOutline`
- `bookmarkOutlineAdd`
- `borderAll`
- `borderBottom`
- `borderHorizontal`
- `borderInner`
- `borderLeft`
- `borderNone`
- `borderOuter`
- `borderRight`
- `borderTop`
- `borderVertical`
- `box`
- `brightnessDown`
- `brightnessUp`
- `browserWindow`
- `browserWindowNew`
- `browserWindowOpen`
- `bug`
- `buoy`
- `calculator`
- `calendar`
- `camera`
- `chart`
- `chartBar`
- `chartPie`
- `chatBubbleDots`
- `checkmark`
- `checkmarkOutline`
- `cheveronDown`
- `cheveronLeft`
- `cheveronOutlineDown`
- `cheveronOutlineLeft`
- `cheveronOutlineRight`
- `cheveronOutlineUp`
- `cheveronRight`
- `cheveronUp`
- `clipboard`
- `close`
- `closeOutline`
- `closeSolid`
- `cloud`
- `cloudUpload`
- `code`
- `coffee`
- `cog`
- `colorPalette`
- `compose`
- `computerDesktop`
- `computerLaptop`
- `conversation`
- `copy`
- `creditCard`
- `currencyDollar`
- `dashboard`
- `dateAdd`
- `dialPad`
- `directions`
- `document`
- `documentAdd`
- `dotsHorizontalDouble`
- `dotsHorizontalTriple`
- `download`
- `duplicate`
- `editCopy`
- `editCrop`
- `editCut`
- `editPencil`
- `education`
- `envelope`
- `exclamationOutline`
- `exclamationSolid`
- `explore`
- `factory`
- `fastForward`
- `fastRewind`
- `film`
- `filter`
- `flag`
- `flashlight`
- `folder`
- `folderOutline`
- `folderOutlineAdd`
- `formatBold`
- `formatFontSize`
- `formatItalic`
- `formatTextSize`
- `formatUnderline`
- `forward`
- `forwardStep`
- `gift`
- `globe`
- `handStop`
- `hardDrive`
- `headphones`
- `heart`
- `home`
- `hot`
- `hourGlass`
- `inbox`
- `inboxCheck`
- `inboxDownload`
- `inboxFull`
- `indentDecrease`
- `indentIncrease`
- `informationOutline`
- `informationSolid`
- `key`
- `keyboard`
- `layers`
- `library`
- `lightBulb`
- `link`
- `list`
- `listAdd`
- `listBullet`
- `loadBalancer`
- `location`
- `locationCurrent`
- `locationFood`
- `locationGasStation`
- `locationHotel`
- `locationMarina`
- `locationPark`
- `locationRestroom`
- `locationShopping`
- `lockClosed`
- `lockOpen`
- `map`
- `menu`
- `mic`
- `minusOutline`
- `minusSolid`
- `mobileDevices`
- `moodHappyOutline`
- `moodHappySolid`
- `moodNeutralOutline`
- `moodNeutralSolid`
- `moodSadOutline`
- `moodSadSolid`
- `mouse`
- `musicAlbum`
- `musicArtist`
- `musicNotes`
- `musicPlaylist`
- `navigationMore`
- `network`
- `newsPaper`
- `notification`
- `notifications`
- `notificationsOutline`
- `paste`
- `pause`
- `pauseOutline`
- `pauseSolid`
- `penTool`
- `phone`
- `photo`
- `phpElephant`
- `pin`
- `play`
- `playOutline`
- `playlist`
- `plugin`
- `portfolio`
- `printer`
- `pylon`
- `question`
- `queue`
- `radar`
- `radarCopy2`
- `radio`
- `refresh`
- `reload`
- `reply`
- `replyAll`
- `repost`
- `saveDisk`
- `screenFull`
- `search`
- `send`
- `servers`
- `share`
- `share01`
- `shareAlt`
- `shield`
- `shoppingCart`
- `showSidebar`
- `shuffle`
- `standBy`
- `starFull`
- `station`
- `stepBackward`
- `stepForward`
- `stethoscope`
- `storeFront`
- `strokeWidth`
- `subdirectoryLeft`
- `subdirectoryRight`
- `swap`
- `tablet`
- `tag`
- `target`
- `textBox`
- `textDecoration`
- `thermometer`
- `thumbsDown`
- `thumbsUp`
- `ticket`
- `time`
- `timer`
- `toolsCopy`
- `translate`
- `trash`
- `travel`
- `travelBus`
- `travelCar`
- `travelCase`
- `travelTaxiCab`
- `travelTrain`
- `travelWalk`
- `trophy`
- `tuning`
- `upload`
- `usb`
- `user`
- `userAdd`
- `userGroup`
- `userSolidCircle`
- `userSolidSquare`
- `vector`
- `videoCamera`
- `viewCarousel`
- `viewColumn`
- `viewHide`
- `viewList`
- `viewShow`
- `viewTile`
- `volumeDown`
- `volumeMute`
- `volumeOff`
- `volumeUp`
- `wallet`
- `watch`
- `window`
- `windowNew`
- `windowOpen`
- `wrench`
- `yinYang`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddOutlineIcon, AddSolidIcon, AdjustIcon, AirplaneIcon } from '@stacksjs/iconify-zondicons'

  global.navIcons = {
    home: AddOutlineIcon({ size: 20, class: 'nav-icon' }),
    about: AddSolidIcon({ size: 20, class: 'nav-icon' }),
    contact: AdjustIcon({ size: 20, class: 'nav-icon' }),
    settings: AirplaneIcon({ size: 20, class: 'nav-icon' })
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
import { AddOutlineIcon } from '@stacksjs/iconify-zondicons'

const icon = AddOutlineIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddOutlineIcon, AddSolidIcon, AdjustIcon } from '@stacksjs/iconify-zondicons'

const successIcon = AddOutlineIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddSolidIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdjustIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddOutlineIcon, AddSolidIcon } from '@stacksjs/iconify-zondicons'
   const icon = AddOutlineIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addOutline, addSolid } from '@stacksjs/iconify-zondicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addOutline, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddOutlineIcon, AddSolidIcon } from '@stacksjs/iconify-zondicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-zondicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddOutlineIcon } from '@stacksjs/iconify-zondicons'
     global.icon = AddOutlineIcon({ size: 24 })
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
   const icon = AddOutlineIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addOutline } from '@stacksjs/iconify-zondicons'

// Icons are typed as IconData
const myIcon: IconData = addOutline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/dukestreetstudio/zondicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Steve Schoger ([Website](https://github.com/dukestreetstudio/zondicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/zondicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/zondicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
