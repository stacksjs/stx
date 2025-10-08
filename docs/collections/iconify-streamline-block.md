# Streamline Block

> Streamline Block icons for stx from Iconify

## Overview

This package provides access to 300 icons from the Streamline Block collection through the stx iconify integration.

**Collection ID:** `streamline-block`
**Total Icons:** 300
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-block
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ArrowheadsDownIcon, ArrowheadsDownChevronIcon, ArrowheadsDownChevronCircleIcon } from '@stacksjs/iconify-streamline-block'

// Basic usage
const icon = ArrowheadsDownIcon()

// With size
const sizedIcon = ArrowheadsDownIcon({ size: 24 })

// With color
const coloredIcon = ArrowheadsDownChevronIcon({ color: 'red' })

// With multiple props
const customIcon = ArrowheadsDownChevronCircleIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ArrowheadsDownIcon, ArrowheadsDownChevronIcon, ArrowheadsDownChevronCircleIcon } from '@stacksjs/iconify-streamline-block'

  global.icons = {
    home: ArrowheadsDownIcon({ size: 24 }),
    user: ArrowheadsDownChevronIcon({ size: 24, color: '#4a90e2' }),
    settings: ArrowheadsDownChevronCircleIcon({ size: 32 })
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
import { arrowheadsDown, arrowheadsDownChevron, arrowheadsDownChevronCircle } from '@stacksjs/iconify-streamline-block'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(arrowheadsDown, { size: 24 })
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
const redIcon = ArrowheadsDownIcon({ color: 'red' })
const blueIcon = ArrowheadsDownIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ArrowheadsDownIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ArrowheadsDownIcon({ class: 'text-primary' })
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
const icon24 = ArrowheadsDownIcon({ size: 24 })
const icon1em = ArrowheadsDownIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ArrowheadsDownIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ArrowheadsDownIcon({ height: '1em' })
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
const smallIcon = ArrowheadsDownIcon({ class: 'icon-small' })
const largeIcon = ArrowheadsDownIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **300** icons:

- `arrowheadsDown`
- `arrowheadsDownChevron`
- `arrowheadsDownChevronCircle`
- `arrowheadsDownCircle`
- `arrowheadsDownLeft`
- `arrowheadsDownLeftChevron`
- `arrowheadsDownLeftChevronCircle`
- `arrowheadsDownLeftCircle`
- `arrowheadsDownRight`
- `arrowheadsDownRightChevron`
- `arrowheadsDownRightChevronCircle`
- `arrowheadsDownRightCircle`
- `arrowheadsLeft`
- `arrowheadsLeftChevron`
- `arrowheadsLeftChevronCircle`
- `arrowheadsLeftCircle`
- `arrowheadsRight`
- `arrowheadsRightChevron`
- `arrowheadsRightChevronCircle`
- `arrowheadsRightCircle`
- `arrowheadsUp`
- `arrowheadsUpChevron`
- `arrowheadsUpChevronCircle`
- `arrowheadsUpCircle`
- `arrowheadsUpLeft`
- `arrowheadsUpLeftChevron`
- `arrowheadsUpLeftChevronCircle`
- `arrowheadsUpLeftCircle`
- `arrowheadsUpRight`
- `arrowheadsUpRightChevron`
- `arrowheadsUpRightChevronCircle`
- `arrowheadsUpRightCircle`
- `basicArrowsDown`
- `basicArrowsDownCircle`
- `basicArrowsDownLeft`
- `basicArrowsDownLeftCircle`
- `basicArrowsDownRight`
- `basicArrowsDownRightCircle`
- `basicArrowsLeft`
- `basicArrowsLeftCircle`
- `basicArrowsRight`
- `basicArrowsRightCircle`
- `basicArrowsUp`
- `basicArrowsUpCircle`
- `basicArrowsUpLeft`
- `basicArrowsUpLeftCircle`
- `basicArrowsUpRight`
- `basicArrowsUpRightCircle`
- `basicUiAdd`
- `basicUiAdd2`
- `basicUiAddUser`
- `basicUiBin`
- `basicUiCheck`
- `basicUiCheck2`
- `basicUiConfirmUser`
- `basicUiDashboard`
- `basicUiDelete`
- `basicUiDelete2`
- `basicUiDeleteUser`
- `basicUiDownload`
- `basicUiExclamation`
- `basicUiExclamation2`
- `basicUiFilter`
- `basicUiForbidden`
- `basicUiHide`
- `basicUiHome`
- `basicUiLink`
- `basicUiLock`
- `basicUiMuteNotifications`
- `basicUiNotifications`
- `basicUiQuestion`
- `basicUiQuestion2`
- `basicUiRemove`
- `basicUiRemove2`
- `basicUiRemoveUser`
- `basicUiSearch`
- `basicUiSettings`
- `basicUiSettings2`
- `basicUiTime`
- `basicUiTime2`
- `basicUiToggle`
- `basicUiUnlink`
- `basicUiUnlock`
- `basicUiUpload`
- `basicUiUser`
- `basicUiUser2`
- `basicUiUser3`
- `basicUiView`
- `contentAddFile`
- `contentAddFolder`
- `contentBookmark`
- `contentBox`
- `contentCalendar`
- `contentClip`
- `contentClipboard`
- `contentConfirmFile`
- `contentConfirmFolder`
- `contentCopy`
- `contentCrop`
- `contentCut`
- `contentDeleteFile`
- `contentDeleteFolder`
- `contentDislike`
- `contentEdit`
- `contentFile`
- `contentFolder`
- `contentGlasses`
- `contentHeart`
- `contentImage`
- `contentLike`
- `contentMute`
- `contentPin`
- `contentPin2`
- `contentPrint`
- `contentRemoveFile`
- `contentRemoveFolder`
- `contentSave`
- `contentShare`
- `contentStar`
- `contentVideo`
- `contentVideoOff`
- `contentVolumeHigh`
- `contentWrite`
- `contentWrite2`
- `controlButtonsFastForward`
- `controlButtonsFastForward2`
- `controlButtonsPause`
- `controlButtonsPause2`
- `controlButtonsPlay`
- `controlButtonsPlay2`
- `controlButtonsRecord`
- `controlButtonsRecord2`
- `controlButtonsRewind`
- `controlButtonsRewind2`
- `controlButtonsSkipBack`
- `controlButtonsSkipBack2`
- `controlButtonsSkipForward`
- `controlButtonsSkipForward2`
- `controlButtonsStop`
- `controlButtonsStop2`
- `devicesCamera`
- `devicesCameraOff`
- `devicesComputer`
- `devicesCpu`
- `devicesDatabase`
- `devicesHardDrive`
- `devicesHeadphones`
- `devicesKeyboard`
- `devicesLaptop`
- `devicesMicrophone`
- `devicesMicrophoneOff`
- `devicesMouse`
- `devicesPhone`
- `devicesPlug`
- `devicesSmartwatch`
- `devicesTablet`
- `devicesTv`
- `devicesVideoGames`
- `drinkFoodBurger`
- `drinkFoodCoffee`
- `drinkFoodCookie`
- `drinkFoodDrink`
- `drinkFoodFish`
- `drinkFoodFood`
- `drinkFoodFruit`
- `drinkFoodMeat`
- `entertainmentBooks`
- `entertainmentGym`
- `entertainmentMusic`
- `entertainmentNewspaper`
- `entertainmentSports`
- `entertainmentTicket`
- `healthHealth`
- `healthMedicines`
- `healthMicroscope`
- `healthVirus`
- `moneyBank`
- `moneyBill`
- `moneyCoin`
- `moneyCreditCard`
- `moneyWallet`
- `natureCat`
- `natureCloudy`
- `natureDog`
- `natureFire`
- `natureFlower`
- `natureLeaf`
- `natureLightning`
- `natureMoon`
- `naturePlant`
- `natureSea`
- `natureSun`
- `natureTree`
- `natureUmbrella`
- `natureWater`
- `otherArrowsExpand`
- `otherArrowsMerge`
- `otherArrowsMove`
- `otherArrowsRefresh`
- `otherArrowsShrink`
- `otherArrowsSplit`
- `otherArrowsSynchronize`
- `otherArrowsTransfer`
- `otherUiAt`
- `otherUiAward`
- `otherUiBinoculars`
- `otherUiBluetooth`
- `otherUiCall`
- `otherUiChat`
- `otherUiColorPalette`
- `otherUiColorPicker`
- `otherUiCrown`
- `otherUiGraph`
- `otherUiGraph2`
- `otherUiHandMove`
- `otherUiHandSelect`
- `otherUiHash`
- `otherUiInbox`
- `otherUiKey`
- `otherUiLayers`
- `otherUiLightBulb`
- `otherUiLocation`
- `otherUiLocationOff`
- `otherUiMagnet`
- `otherUiMail`
- `otherUiMaximize`
- `otherUiMegaphone`
- `otherUiMinimize`
- `otherUiMousePointer`
- `otherUiPenTool`
- `otherUiRocket`
- `otherUiScanner`
- `otherUiSend`
- `otherUiSkull`
- `otherUiSparks`
- `otherUiTarget`
- `otherUiWiFi`
- `otherUiWiFiOff`
- `otherUiWrench`
- `otherUiZoomIn`
- `otherUiZoomOut`
- `programmingBrowser`
- `programmingBug`
- `programmingCode`
- `programmingModules`
- `programmingRss`
- `shoppingBag`
- `shoppingBasket`
- `shoppingBox`
- `shoppingCart`
- `shoppingClothes`
- `shoppingDiscount`
- `shoppingFurniture`
- `shoppingGift`
- `shoppingHelpInformation`
- `shoppingJewels`
- `shoppingSecurity`
- `shoppingStore`
- `shoppingTag`
- `smileysAngry`
- `smileysHappy`
- `smileysNeutral`
- `smileysSad`
- `smileysSurprised`
- `textFormattingAlignCenter`
- `textFormattingAlignLeft`
- `textFormattingAlignRight`
- `textFormattingBehindImage`
- `textFormattingBlockquote`
- `textFormattingBold`
- `textFormattingBottomImage`
- `textFormattingBottomImageLarge`
- `textFormattingBulletedList`
- `textFormattingCenteredImage`
- `textFormattingCenteredImageLarge`
- `textFormattingColumns`
- `textFormattingHeaderImage`
- `textFormattingInFrontImage`
- `textFormattingItalic`
- `textFormattingJustified`
- `textFormattingOrderedList`
- `textFormattingPilcrow`
- `textFormattingStrikethrough`
- `textFormattingTextField`
- `textFormattingTopAndBottomImage`
- `textFormattingTopImage`
- `textFormattingTopImageLarge`
- `textFormattingUnderline`
- `travelAccessibility`
- `travelBus`
- `travelCar`
- `travelCar2`
- `travelCompass`
- `travelFlag`
- `travelGlobe`
- `travelMap`
- `travelMotorcycle`
- `travelPlane`
- `travelShip`
- `travelSuitcase`

## Usage Examples

### Navigation Menu

```html
@js
  import { ArrowheadsDownIcon, ArrowheadsDownChevronIcon, ArrowheadsDownChevronCircleIcon, ArrowheadsDownCircleIcon } from '@stacksjs/iconify-streamline-block'

  global.navIcons = {
    home: ArrowheadsDownIcon({ size: 20, class: 'nav-icon' }),
    about: ArrowheadsDownChevronIcon({ size: 20, class: 'nav-icon' }),
    contact: ArrowheadsDownChevronCircleIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowheadsDownCircleIcon({ size: 20, class: 'nav-icon' })
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
import { ArrowheadsDownIcon } from '@stacksjs/iconify-streamline-block'

const icon = ArrowheadsDownIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ArrowheadsDownIcon, ArrowheadsDownChevronIcon, ArrowheadsDownChevronCircleIcon } from '@stacksjs/iconify-streamline-block'

const successIcon = ArrowheadsDownIcon({ size: 16, color: '#22c55e' })
const warningIcon = ArrowheadsDownChevronIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArrowheadsDownChevronCircleIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ArrowheadsDownIcon, ArrowheadsDownChevronIcon } from '@stacksjs/iconify-streamline-block'
   const icon = ArrowheadsDownIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { arrowheadsDown, arrowheadsDownChevron } from '@stacksjs/iconify-streamline-block'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(arrowheadsDown, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ArrowheadsDownIcon, ArrowheadsDownChevronIcon } from '@stacksjs/iconify-streamline-block'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-streamline-block'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ArrowheadsDownIcon } from '@stacksjs/iconify-streamline-block'
     global.icon = ArrowheadsDownIcon({ size: 24 })
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
   const icon = ArrowheadsDownIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { arrowheadsDown } from '@stacksjs/iconify-streamline-block'

// Icons are typed as IconData
const myIcon: IconData = arrowheadsDown
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-block/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-block/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
