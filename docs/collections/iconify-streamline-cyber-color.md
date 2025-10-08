# Cyber color icons

> Cyber color icons icons for stx from Iconify

## Overview

This package provides access to 500 icons from the Cyber color icons collection through the stx iconify integration.

**Collection ID:** `streamline-cyber-color`
**Total Icons:** 500
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-cyber-color
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 3dGlassesIcon, 3dSyncIcon, AccountIcon } from '@stacksjs/iconify-streamline-cyber-color'

// Basic usage
const icon = 3dGlassesIcon()

// With size
const sizedIcon = 3dGlassesIcon({ size: 24 })

// With color
const coloredIcon = 3dSyncIcon({ color: 'red' })

// With multiple props
const customIcon = AccountIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 3dGlassesIcon, 3dSyncIcon, AccountIcon } from '@stacksjs/iconify-streamline-cyber-color'

  global.icons = {
    home: 3dGlassesIcon({ size: 24 }),
    user: 3dSyncIcon({ size: 24, color: '#4a90e2' }),
    settings: AccountIcon({ size: 32 })
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
import { 3dGlasses, 3dSync, account } from '@stacksjs/iconify-streamline-cyber-color'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3dGlasses, { size: 24 })
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

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```typescript
// Via color property
const redIcon = 3dGlassesIcon({ color: 'red' })
const blueIcon = 3dGlassesIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 3dGlassesIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 3dGlassesIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = 3dGlassesIcon({ size: 24 })
const icon1em = 3dGlassesIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 3dGlassesIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 3dGlassesIcon({ height: '1em' })
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
const smallIcon = 3dGlassesIcon({ class: 'icon-small' })
const largeIcon = 3dGlassesIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **500** icons:

- `3dGlasses`
- `3dSync`
- `account`
- `accountGroup`
- `accountHexagon`
- `accountLock`
- `accountTarget`
- `addDouble`
- `addHexagon`
- `addHexagon2`
- `adjustBrightness`
- `airplane`
- `airplaneArrival`
- `airplaneDeparture`
- `airplaneDepartureCancel`
- `alarm`
- `alarmSnooze`
- `ambulance`
- `android`
- `apple2`
- `arrangeLetter`
- `atSign`
- `atom1`
- `babyFace`
- `babyMilkBottle`
- `babyStroller1`
- `bacteria`
- `badge`
- `badgeFavoriteHeart2`
- `badgeStar2`
- `bank1`
- `bankNote1`
- `bankNote2`
- `bankNotes`
- `bankNotesStack`
- `barcode1`
- `barrel`
- `basketball`
- `batman`
- `beach`
- `beakerTestTube`
- `bicycle1`
- `bin`
- `bin2`
- `binocular1`
- `blockHexagon`
- `bloodDrop`
- `bluetoothSearching`
- `bomb`
- `bookAlbumPicture`
- `bookEncyclopedia`
- `bookOpen`
- `bookOpen3`
- `bookOpenBookmark`
- `bookOpenBookmark3`
- `bookPencil`
- `bookPhoneContact`
- `bookmarkFavoriteStar`
- `bowTie`
- `box1`
- `boxingGlove2`
- `bubbleChat2`
- `bubbleChatCheck`
- `bubbleChatDoubleText`
- `bubbleChatDoubleTypingSmileyFace`
- `bubbleChatLike`
- `bubbleChatQuote`
- `bubbleChatSmileyFace2`
- `bubbleChatTextForward`
- `bubbleChatTextSetting`
- `bubbleChatTyping2`
- `building13`
- `bus2`
- `businessChart4`
- `businessChat4`
- `businessDualScreenWindow`
- `businessFemaleHeart`
- `businessHandshakeDeal`
- `businessHierarchy`
- `businessIdeaLightBulb`
- `businessIdeaUser3`
- `businessLaptop`
- `businessMagicRabbit`
- `businessMaleMegaphone`
- `businessNetwork`
- `businessPickUser`
- `businessQuestion`
- `businessScale4`
- `businessStartupMobile`
- `businessSuitcase2`
- `businessTarget`
- `businessWorkStation1`
- `businessman`
- `businessmanSpeech`
- `camera4`
- `camera7`
- `camera8`
- `camera9`
- `cameraFilmRoll2`
- `cameraFlashOff`
- `cameraLens3`
- `cameraNight`
- `cameraPolaroid`
- `cameraUser`
- `cameraVideoOff2`
- `campfire`
- `cannabisLeaf`
- `car4`
- `cards2`
- `cashBagGive`
- `cashHand1`
- `cashHand4`
- `cassetteTape1`
- `castle2`
- `cat2`
- `cautionFence`
- `charlieChaplin`
- `checkDouble`
- `checkShield`
- `cheese`
- `clapboardPlayOpen`
- `clock1`
- `cloud`
- `cloudDisable`
- `cloudFlash`
- `cloudRain`
- `cloudRefresh`
- `cloudSmartMobilePhone`
- `cloudStorm`
- `cloudTransferHalf`
- `cloudUploadDownloadDataTransfer`
- `cloudWifiNetwork`
- `coffeeCupHot2`
- `cog`
- `coinHand`
- `coinStack`
- `command2`
- `compass2`
- `compasses`
- `computerChips32Bit`
- `computerDeviceConnection`
- `computerImacCheck`
- `computerImacSmileyFace`
- `computerPc4`
- `computerRam`
- `computerScreenImacDownload`
- `confettiPopper`
- `controlNext`
- `controlPlay`
- `controllerWireless`
- `creditCard`
- `creditCardAdd`
- `creditCardEdit`
- `creditCardPaymentMachine`
- `creditCardVisa`
- `croissant`
- `crosshair1`
- `crown2`
- `cursor2`
- `cursorArrow`
- `cursorArrowDouble`
- `cursorArrowTarget`
- `cursorChoose`
- `cursorMove`
- `cursorQuestionHexagon`
- `cursorScroll2`
- `cursorScrollVertical`
- `cursorSelectArea`
- `database`
- `databaseDataTransferComputerImac2`
- `databaseNetwork`
- `databaseShare2`
- `dayCloud`
- `daySnow`
- `dayStorm`
- `deleteCircle1`
- `deliveryPackage2`
- `deliveryPackageOpen`
- `deliveryTruck5`
- `designMug`
- `dnaStrand`
- `doctor`
- `documentBookmark2`
- `dog1`
- `doorExit`
- `download2`
- `drawer4`
- `dress`
- `drum2`
- `eiffelTower`
- `elephant`
- `email2`
- `emailLaptop`
- `eyeDropper3`
- `facebookLike`
- `factory`
- `female`
- `ferrisWheel1`
- `filter1`
- `filter10`
- `filter6`
- `filterPlayMediaVideo`
- `filterPlus`
- `fireAlarm`
- `firstAidPlaster`
- `fishes`
- `flag3`
- `flagDouble`
- `flagHeart`
- `flashlight2`
- `flowchart3`
- `focus3`
- `football`
- `forkKnife`
- `frenchFries`
- `gameboy`
- `gasStation`
- `genderMaleFemale`
- `gentleman`
- `glass1`
- `glassBeer1`
- `glasses4`
- `globe1`
- `globe2`
- `gorilla`
- `group`
- `groupGlobal`
- `groupRefresh`
- `guitar`
- `hammer`
- `hammer3`
- `handHexagon`
- `handTabletIcons2`
- `harddisk1`
- `harddisk4`
- `harddriveDiskDownload3`
- `hatTall`
- `headphone`
- `headsetPulse`
- `headsetUser`
- `heartBalloon`
- `heartBeat`
- `heartCalendar`
- `heartCupid`
- `heartProtect`
- `helipadSquare`
- `hierarchyBusiness2`
- `highlighter`
- `homeScene`
- `hotBeverage`
- `hourglass2`
- `icecreamCone`
- `idCard`
- `idPicture`
- `inLove`
- `ipodClassic1`
- `key2`
- `kirby2`
- `knife1`
- `lady`
- `lamp3`
- `laptop2`
- `laptopUpload`
- `laptopWifi2`
- `layerHide`
- `leftRightTrafficDataTransferHexagon`
- `linkBroken1`
- `locationMap`
- `locationPin1`
- `locationPinDirection3`
- `lockClose1`
- `lockOpen4`
- `lockShield`
- `logout1`
- `loopDiamond`
- `loopDiamond2`
- `macroMode`
- `mailbox2`
- `maintenance`
- `male`
- `maleMaleLoveHomosexual`
- `map`
- `mapDirection`
- `mapTarget2`
- `mario`
- `masks`
- `medicalBox`
- `medicalCross`
- `medicineCapsule2`
- `megaman`
- `megaphone1`
- `microphone1`
- `microphoneJack`
- `microphoneMute`
- `microphoneOn2`
- `milkCarton1`
- `mobilePhoneBatteryMediumHigh`
- `mobilePhoneCheck`
- `mobilePhoneSongMusicNote`
- `mobilePhoneText`
- `mobilePhoneVibration`
- `moneyBag1`
- `mouse`
- `movieCamera2`
- `movieFilm1`
- `multiPlatform2`
- `musicAlbum1`
- `musicNote1`
- `musicPlaylist1`
- `navigationLeft`
- `navigationNextHexagon`
- `navigationUpArrow`
- `network`
- `networkRefresh`
- `networkScreenImac`
- `newDocumentLayer`
- `newspaper2`
- `nightMode`
- `nightRain`
- `nightRain2`
- `nightWind2`
- `origamiPaperBird`
- `packageFavoriteStar`
- `packageStack2`
- `packageTrolley2`
- `packageWooden`
- `pacman`
- `paintBucket1`
- `paintPalette`
- `paperBinder`
- `park`
- `peace`
- `pen2`
- `penTool`
- `pencilClipboard`
- `person`
- `personEdit`
- `petNotAllow`
- `phone3`
- `phone5`
- `phoneCall`
- `phoneMerge`
- `phoneSilent`
- `photocopyMachine`
- `piano1`
- `piano3`
- `pickupTruck`
- `picture2`
- `picture6`
- `pictureFrame`
- `picturePolaroid2`
- `piggyBank`
- `pizza`
- `playButton`
- `playMediaVideoHexagon`
- `pokeball`
- `police`
- `policeCar1`
- `postman1`
- `presentBox`
- `presentation2`
- `presentationCounter2`
- `printer3`
- `programmingBug2`
- `programmingCss3`
- `programmingScript1`
- `programmingShare`
- `programmingTouchscreen`
- `purse1`
- `quill`
- `radioactiveHexagon`
- `receiptEnvelope`
- `reflectCopyLeft`
- `removeHexagon1`
- `replyAll`
- `reportProblemWarningHexagon`
- `reportProblemWarningTriangle`
- `rollingPin`
- `rose2`
- `rotateRight`
- `rugby`
- `safe1`
- `scaleHorizontal`
- `scissor2`
- `server`
- `share`
- `shareBoxForward2`
- `shield3`
- `shoppingBag`
- `shoppingBagFrown`
- `shoppingBasket3`
- `shoppingBasketStar`
- `shoppingCart3`
- `shoppingCartAdd`
- `shoppingCartSearch`
- `shoppingCartUpload2`
- `shoppingCartUser2`
- `shoppingCartUser4`
- `shoppingProduct`
- `shrineGate1`
- `signFragile1`
- `signShoppingBag`
- `signal2`
- `signalSquare`
- `skull1`
- `smartwatch1`
- `smartwatchFavoriteHeart1`
- `smileyAngry2`
- `smileyFrown`
- `smileyLove`
- `smileySigh`
- `smileySmile7`
- `smileySmile1`
- `smileyThinking`
- `smileyYawn`
- `smokeFreeArea`
- `sneakers`
- `snorkelMask1`
- `spaghettiFork`
- `spellingCheck2`
- `sprayPaint3`
- `staircaseDown2`
- `stamp2`
- `starWarsDarthVader`
- `starWarsR2`
- `steeringWheel1`
- `stethoscope`
- `steveJobs`
- `storeLocation`
- `storeSale`
- `subtractHexagon2`
- `sun`
- `sunSet2`
- `swimmingPool2`
- `synchronize2`
- `synchronizeDiamond`
- `synchronizeFindSearch`
- `synchronizeHexagon2`
- `synchronizeLockEncrypt`
- `synchronizeLoop`
- `synchronizeTriangle`
- `syringe2`
- `tag2`
- `tagDouble`
- `telecommunicator`
- `temperatureFahrenheit`
- `temperatureHigh`
- `tetris`
- `timerMode`
- `timer01`
- `toiletSign`
- `trafficCone`
- `trafficLight`
- `train2`
- `transferFolder`
- `travelBag2`
- `treasureChestOpen`
- `trophy4`
- `trousers`
- `umbrellaRain`
- `underline`
- `underwear1`
- `uploadDownloadTrafficDataTransferHexagon`
- `usb`
- `usbFlashDrive`
- `userChat2`
- `userChat4`
- `userChatDollar`
- `vectorLineCurve`
- `vectorPen`
- `videoMeetingGroup`
- `videoMeetingHexagon`
- `videoMeetingPhone`
- `videoPlayer1`
- `view2`
- `virtualMachine3`
- `volumeCheck`
- `volumeMedium`
- `wallE`
- `wallet`
- `walletCash`
- `warehouse2`
- `watch1`
- `waterMug2`
- `watermelon`
- `waveHexagon`
- `webCamera`
- `webcam`
- `weddingCertificate`
- `weightScale`
- `weightTraining`
- `whale`
- `windFlag`
- `windowApplication6`
- `windowBookmark`
- `windowSpeedtest`
- `windowTabs`
- `wineBottleGlass`
- `wrench`
- `wrenchScrewdriver`

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dGlassesIcon, 3dSyncIcon, AccountIcon, AccountGroupIcon } from '@stacksjs/iconify-streamline-cyber-color'

  global.navIcons = {
    home: 3dGlassesIcon({ size: 20, class: 'nav-icon' }),
    about: 3dSyncIcon({ size: 20, class: 'nav-icon' }),
    contact: AccountIcon({ size: 20, class: 'nav-icon' }),
    settings: AccountGroupIcon({ size: 20, class: 'nav-icon' })
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
import { 3dGlassesIcon } from '@stacksjs/iconify-streamline-cyber-color'

const icon = 3dGlassesIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 3dGlassesIcon, 3dSyncIcon, AccountIcon } from '@stacksjs/iconify-streamline-cyber-color'

const successIcon = 3dGlassesIcon({ size: 16, color: '#22c55e' })
const warningIcon = 3dSyncIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccountIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 3dGlassesIcon, 3dSyncIcon } from '@stacksjs/iconify-streamline-cyber-color'
   const icon = 3dGlassesIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 3dGlasses, 3dSync } from '@stacksjs/iconify-streamline-cyber-color'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(3dGlasses, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 3dGlassesIcon, 3dSyncIcon } from '@stacksjs/iconify-streamline-cyber-color'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-streamline-cyber-color'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dGlassesIcon } from '@stacksjs/iconify-streamline-cyber-color'
     global.icon = 3dGlassesIcon({ size: 24 })
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
   const icon = 3dGlassesIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dGlasses } from '@stacksjs/iconify-streamline-cyber-color'

// Icons are typed as IconData
const myIcon: IconData = 3dGlasses
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-cyber-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-cyber-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
