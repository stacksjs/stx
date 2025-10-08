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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<ArrowheadsDownIcon height="1em" />
<ArrowheadsDownIcon width="1em" height="1em" />
<ArrowheadsDownIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<ArrowheadsDownIcon size="24" />
<ArrowheadsDownIcon size="1em" />

<!-- Using width and height -->
<ArrowheadsDownIcon width="24" height="32" />

<!-- With color -->
<ArrowheadsDownIcon size="24" color="red" />
<ArrowheadsDownIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<ArrowheadsDownIcon size="24" class="icon-primary" />

<!-- With all properties -->
<ArrowheadsDownIcon
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
    <ArrowheadsDownIcon size="24" />
    <ArrowheadsDownChevronIcon size="24" color="#4a90e2" />
    <ArrowheadsDownChevronCircleIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<ArrowheadsDownIcon size="24" color="red" />
<ArrowheadsDownIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<ArrowheadsDownIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<ArrowheadsDownIcon size="24" class="text-primary" />
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
<ArrowheadsDownIcon height="1em" />
<ArrowheadsDownIcon width="1em" height="1em" />
<ArrowheadsDownIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<ArrowheadsDownIcon size="24" />
<ArrowheadsDownIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineBlock-icon {
  width: 1em;
  height: 1em;
}
```

```html
<ArrowheadsDownIcon class="streamlineBlock-icon" />
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
<nav>
  <a href="/"><ArrowheadsDownIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><ArrowheadsDownChevronIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ArrowheadsDownChevronCircleIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrowheadsDownCircleIcon size="20" class="nav-icon" /> Settings</a>
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
<ArrowheadsDownIcon
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
    <ArrowheadsDownIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <ArrowheadsDownChevronIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ArrowheadsDownChevronCircleIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <ArrowheadsDownIcon size="24" />
   <ArrowheadsDownChevronIcon size="24" color="#4a90e2" />
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
   <ArrowheadsDownIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <ArrowheadsDownIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <ArrowheadsDownIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { arrowheadsDown } from '@stacksjs/iconify-streamline-block'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(arrowheadsDown, { size: 24 })
   @endjs

   {!! customIcon !!}
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
