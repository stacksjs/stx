# Cyber free icons

> Cyber free icons icons for stx from Iconify

## Overview

This package provides access to 500 icons from the Cyber free icons collection through the stx iconify integration.

**Collection ID:** `streamline-cyber`
**Total Icons:** 500
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-cyber
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dGlassesIcon height="1em" />
<3dGlassesIcon width="1em" height="1em" />
<3dGlassesIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dGlassesIcon size="24" />
<3dGlassesIcon size="1em" />

<!-- Using width and height -->
<3dGlassesIcon width="24" height="32" />

<!-- With color -->
<3dGlassesIcon size="24" color="red" />
<3dGlassesIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dGlassesIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dGlassesIcon
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
    <3dGlassesIcon size="24" />
    <3dSyncIcon size="24" color="#4a90e2" />
    <AccountIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3dGlasses, 3dSync, account } from '@stacksjs/iconify-streamline-cyber'
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

### Monotone Icons

Monotone icons use `currentColor` by default, allowing you to change icon color via the `color` property or CSS:

```html
<!-- Via color property -->
<3dGlassesIcon size="24" color="red" />
<3dGlassesIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dGlassesIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dGlassesIcon size="24" class="text-primary" />
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
<3dGlassesIcon height="1em" />
<3dGlassesIcon width="1em" height="1em" />
<3dGlassesIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dGlassesIcon size="24" />
<3dGlassesIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineCyber-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dGlassesIcon class="streamlineCyber-icon" />
```

## Available Icons

This package contains **500** icons:

- `3dGlasses`
- `3dSync`
- `account`
- `accountGroup1`
- `accountHexagon`
- `accountLock`
- `accountTarget`
- `addDouble`
- `addHexagon1`
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
- `badge1`
- `badgeFavoriteHeart2`
- `badgeStar2`
- `bank1`
- `bankNote1`
- `bankNote2`
- `bankNotes1`
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
- `bookEncyclopedia1`
- `bookOpen1`
- `bookOpen3`
- `bookOpenBookmark1`
- `bookOpenBookmark3`
- `bookPencil`
- `bookmarkFavoriteStar`
- `bowTie`
- `box1`
- `boxingGlove2`
- `bubbleChat2`
- `bubbleChatCheck1`
- `bubbleChatDoubleText1`
- `bubbleChatDoubleTypingSmileyFace1`
- `bubbleChatLike`
- `bubbleChatQuote1`
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
- `businessLaptop1`
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
- `cloudRain1`
- `cloudRefresh`
- `cloudSmartMobilePhone`
- `cloudStorm1`
- `cloudTransferHalf`
- `cloudUploadDownloadDataTransfer`
- `cloudWifiNetwork`
- `coffeeCupHot2`
- `cog`
- `coinHand1`
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
- `contactList1`
- `controlNext`
- `controlPlay`
- `controllerWireless`
- `creditCard1`
- `creditCardAdd`
- `creditCardEdit`
- `creditCardPaymentMachine`
- `creditCardVisa`
- `croissant`
- `crosshair1`
- `crown2`
- `cursor1`
- `cursorArrow1`
- `cursorArrowDouble`
- `cursorArrowTarget`
- `cursorChoose`
- `cursorMove`
- `cursorQuestionHexagon`
- `cursorScroll2`
- `cursorScrollVertical1`
- `cursorSelectArea`
- `database`
- `databaseDataTransferComputerImac2`
- `databaseNetwork1`
- `databaseShare2`
- `dayCloud1`
- `daySnow`
- `dayStorm1`
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
- `hammer1`
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
- `idCard1`
- `idPicture1`
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
- `loopDiamond1`
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
- `microphoneMute1`
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
- `navigationNextHexagon1`
- `navigationUpArrow`
- `network`
- `networkRefresh`
- `networkScreenImac`
- `newDocumentLayer`
- `newspaper2`
- `nightMode`
- `nightRain1`
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
- `phoneCall1`
- `phoneMerge`
- `phoneSilent`
- `photocopyMachine`
- `piano1`
- `piano3`
- `pickupTruck`
- `picture2`
- `picture6`
- `pictureFrame1`
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
- `programmingScript`
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
- `shoppingBag1`
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
- `smileyFrown1`
- `smileyLove`
- `smileySigh`
- `smileySmile11`
- `smileySmile7`
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
- `sun1`
- `sunSet2`
- `swimmingPool2`
- `synchronize2`
- `synchronizeDiamond`
- `synchronizeFindSearch`
- `synchronizeHexagon2`
- `synchronizeLockEncrypt1`
- `synchronizeLoop`
- `synchronizeTriangle`
- `syringe2`
- `tag2`
- `tagDouble1`
- `telecommunicator`
- `temperatureFahrenheit`
- `tetris`
- `thermometerHigh`
- `timer10`
- `timerMode`
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
- `wallet1`
- `walletCash1`
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
- `windowTabs1`
- `wineBottleGlass`
- `wrench1`
- `wrenchScrewdriver`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dGlassesIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dSyncIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccountIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccountGroup1Icon size="20" class="nav-icon" /> Settings</a>
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
<3dGlassesIcon
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
    <3dGlassesIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <3dSyncIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccountIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dGlassesIcon size="24" />
   <3dSyncIcon size="24" color="#4a90e2" />
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
   <3dGlassesIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dGlassesIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dGlassesIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3dGlasses } from '@stacksjs/iconify-streamline-cyber'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dGlasses, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dGlasses } from '@stacksjs/iconify-streamline-cyber'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-cyber/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-cyber/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
