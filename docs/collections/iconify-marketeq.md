# Marketeq

> Marketeq icons for stx from Iconify

## Overview

This package provides access to 590 icons from the Marketeq collection through the stx iconify integration.

**Collection ID:** `marketeq`
**Total Icons:** 590
**Author:** Marketeq
**License:** MIT
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-marketeq
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<1stPlaceIcon height="1em" />
<1stPlaceIcon width="1em" height="1em" />
<1stPlaceIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<1stPlaceIcon size="24" />
<1stPlaceIcon size="1em" />

<!-- Using width and height -->
<1stPlaceIcon width="24" height="32" />

<!-- With color -->
<1stPlaceIcon size="24" color="red" />
<1stPlaceIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<1stPlaceIcon size="24" class="icon-primary" />

<!-- With all properties -->
<1stPlaceIcon
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
    <1stPlaceIcon size="24" />
    <2kIcon size="24" color="#4a90e2" />
    <2ndPlaceIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 1stPlace, 2k, 2ndPlace } from '@stacksjs/iconify-marketeq'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(1stPlace, { size: 24 })
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

```html
<!-- Via color property -->
<1stPlaceIcon size="24" color="red" />
<1stPlaceIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<1stPlaceIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<1stPlaceIcon size="24" class="text-primary" />
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
<1stPlaceIcon height="1em" />
<1stPlaceIcon width="1em" height="1em" />
<1stPlaceIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<1stPlaceIcon size="24" />
<1stPlaceIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.marketeq-icon {
  width: 1em;
  height: 1em;
}
```

```html
<1stPlaceIcon class="marketeq-icon" />
```

## Available Icons

This package contains **590** icons:

- `1stPlace`
- `2k`
- `2ndPlace`
- `3rdPlace`
- `4k2`
- `acorn`
- `acrobatic2`
- `actionCam`
- `actionCamera`
- `adapter3`
- `addCollection`
- `addPlaylist`
- `addPlaylist2`
- `agenda`
- `agendaLeft`
- `aim`
- `aim2`
- `alpha`
- `alphaCircle`
- `ambulance`
- `angel45`
- `appartment2`
- `appleFruit`
- `armchair4`
- `arrival`
- `atom`
- `attachment`
- `avocado`
- `avocado2`
- `axe`
- `babyCrib2`
- `backpack`
- `backward2`
- `badge`
- `bag`
- `bagAlt`
- `bagAlt1`
- `bananaLeft`
- `bananasLeft`
- `bank`
- `barcodeScan`
- `barrier`
- `basketballHoop`
- `bathroom2`
- `bathtub3`
- `bathtub8`
- `battery`
- `battery100`
- `battery100Line`
- `batteryCharge`
- `bed`
- `bedroom4`
- `bedroom6`
- `benchPress`
- `bike2`
- `bikecycle`
- `billDollar`
- `billiardBall`
- `birthdayCake`
- `blackBoard`
- `blueprintArchitecture`
- `bluntedCone`
- `boat2`
- `box`
- `bracket2`
- `bracketSquare2`
- `bread`
- `breakfast2`
- `brickwall2`
- `brightness`
- `browse`
- `bug`
- `bus`
- `cabinet`
- `cabinet4`
- `cabinet5`
- `cableway2`
- `call`
- `callIn2`
- `camping`
- `campingChair`
- `campingGas`
- `cannedFood`
- `cannedFood2`
- `carAllert`
- `carLifter`
- `carShipping`
- `caravan`
- `cargoShip2`
- `carpet3`
- `cart`
- `cartAdd`
- `cartAlt1`
- `cartRemove`
- `cashierMachineLeft`
- `cassette`
- `caution`
- `cautionSignCircle`
- `cautionSignSquare`
- `cd`
- `chair2`
- `chair5`
- `chaiseLongue`
- `chartColum`
- `chartColumnGrow`
- `chartColumnLow`
- `chartLineAlt1`
- `chartPie`
- `chassis`
- `chat4`
- `chatAlertLeft3`
- `chatAlt`
- `chatAlt3`
- `chatLeft2`
- `checkCircle`
- `checkDouble`
- `checkMarkCircle`
- `checkMarkSquare`
- `checkMarkSquare2`
- `chemistry`
- `chemistry5`
- `chip`
- `chronometerWatch3Second`
- `clipboardAdd2`
- `clipboardChecklist2`
- `clipboardDelete2`
- `clipboardEdit3`
- `clipboardEditLeft2`
- `clockAlt`
- `cloud`
- `coffeeMachine`
- `compactDisk2`
- `compactDisk3`
- `compactDiskDisable`
- `coneGeometric`
- `contractRight`
- `contrass`
- `contrassAlt`
- `contrassAlt3`
- `contrassAlt6`
- `conversation`
- `couldron`
- `coupon`
- `cpu`
- `cradle`
- `createNote`
- `createNoteAlt`
- `crossArrow`
- `crossCircle`
- `cube`
- `cursor`
- `cursor2`
- `curtains`
- `curveArrowRight`
- `curveArrowRight3`
- `curveArrowRight9`
- `cylinder`
- `dashboardAlt`
- `dashboardAlt3`
- `database2`
- `date`
- `dateAltAdd`
- `dateAltCheck`
- `dateAltStar`
- `debitPurchase`
- `decreaseCircle`
- `delete`
- `deleteAlt2`
- `deleteCollection`
- `deliveryTruck`
- `delta`
- `deltaSquare`
- `desk2`
- `desk6`
- `deskLampRound`
- `diagramBar2`
- `diagramBar3`
- `diameter`
- `diameterCircle`
- `direction`
- `directionSign`
- `discount`
- `diskette`
- `divide`
- `divideCircle`
- `divideSquare`
- `dome`
- `doneCollection`
- `donePlaylist2`
- `doorHandle`
- `doubleDownSign`
- `doubleDownSignSquare`
- `doubleLeftSign`
- `doubleLeftSignCircle`
- `doubleLeftSignSquare`
- `doubleRightSign`
- `doubleRightSignCircle`
- `doubleRightSignSquare`
- `doubleUpScrollBar`
- `doubleUpSign`
- `doubleUpSignSquare`
- `downArrow`
- `downDirection2`
- `downJunctionSign`
- `downOctagon`
- `downTrend`
- `downUpScrollBar`
- `download5`
- `downloadAlt4`
- `downloadAlt5`
- `drawers2`
- `drawers3`
- `drawingTabletPencil`
- `dumbbell3`
- `earphone`
- `earphoneBluetooth`
- `editAlt5`
- `editAlt6`
- `editCircle`
- `editUser6`
- `emailFile`
- `emailOpen`
- `envelope`
- `exchange`
- `exclamation`
- `export2`
- `eye`
- `eyeAlt`
- `fastBackward`
- `fastBackwardCircle`
- `fastForward`
- `fastForwardCircle`
- `favourite`
- `favouriteAlt`
- `file3`
- `file6`
- `fileFavorite8`
- `fileFolderApproved2`
- `fileMusic2`
- `fileVideo4`
- `fileZip`
- `files`
- `filmMovie`
- `filmRoll`
- `filter`
- `filterAlt`
- `filterAlt4`
- `filterAlt5`
- `fireLeft`
- `fireplace`
- `fishingHook`
- `flask2`
- `flask3`
- `floorLamp`
- `floppyDiskAlert`
- `footballBall`
- `forest2`
- `forklift`
- `forward2`
- `fryingPan`
- `fullCrossCircle`
- `gallery`
- `galleryCollections`
- `gameConsoleCable`
- `gasStove`
- `gearshiftCar`
- `goal`
- `goldMedal`
- `goldMedal6`
- `gpsFixed`
- `gravity`
- `grill`
- `grillBbq`
- `hammerDrill`
- `handphone`
- `handphoneLaptop`
- `handphoneLock`
- `hastag`
- `hastagCircle`
- `hastagSquare`
- `headsetAlt`
- `helicopter`
- `help`
- `home3`
- `homeAlt2`
- `homeAlt3`
- `homeTelephone`
- `hotel2`
- `idCard`
- `importLeft2`
- `infinite`
- `infinite2`
- `informationChatRight`
- `informationSquare`
- `integral`
- `invoiceDollarDoneLeft`
- `iron`
- `jetPlaneRight`
- `jetski`
- `jewelry`
- `job`
- `joystick`
- `karaoke`
- `key11`
- `key7`
- `keyLockCircle`
- `keyboard3`
- `kitchenCabinet2`
- `knife`
- `laptop2`
- `lattern`
- `launch`
- `laundryBasket2`
- `lawnMower`
- `lcd`
- `leftAltCircle`
- `leftCircle`
- `leftDirection`
- `leftDirectionSquare`
- `leftRightArrow`
- `leftRightScrollBar`
- `leftSign`
- `leftSquare3`
- `lighthouse`
- `linkAlt`
- `linkAlt2`
- `lock`
- `lock1`
- `lockCheck`
- `lockCircle`
- `logIn`
- `logInDoubleArrow2`
- `lovePlaylist2`
- `map`
- `mapPin`
- `maps`
- `mapsLocation`
- `mapsPin`
- `marshmallow`
- `marshmallowRight`
- `maximize2`
- `measuringTape`
- `menu`
- `menuAlt`
- `mic`
- `microphone`
- `microphoneAudio`
- `microphoneDisable`
- `microphoneMusic2`
- `microphoneRight`
- `microphoneStand`
- `minimize`
- `minimizeLeft`
- `minimizeSize`
- `minus`
- `minusCollection`
- `mobileDataCircle`
- `mobileHotspot`
- `mobilePaymentDollar`
- `mobilePaymentDone2`
- `money`
- `money3`
- `moneyAlt`
- `moneyAlt1`
- `moneyBag`
- `moneyDollar`
- `moneyDollarCoin`
- `moneyEuro`
- `monitor`
- `moreCircleVertical`
- `moreVertical`
- `mosque`
- `mountain`
- `mouse`
- `mp3Player`
- `multiFolder`
- `music1`
- `musicAlbum2`
- `musicDisable`
- `musicFile2`
- `mute`
- `next`
- `noteAlt`
- `noteBook`
- `noteDown`
- `noteText`
- `noteUp`
- `notebook`
- `notificationAlt`
- `notificationBell`
- `notificationCircle`
- `package`
- `packageAlt2`
- `paintRoller`
- `pantone`
- `parabolicFunction`
- `parkingSquare`
- `pause`
- `pauseCircle`
- `pencilRuler`
- `pendulum`
- `pendulum5`
- `phone`
- `phoneSquare`
- `picnicBasket2`
- `picnicBasket3`
- `pipe4`
- `placeDisable`
- `play`
- `plunger`
- `plus`
- `podium`
- `power`
- `powerBank`
- `presentCircle`
- `presentGrow`
- `presentationBarChart`
- `priceTag`
- `printAlt3`
- `printAlt9`
- `processor`
- `pushPin`
- `qrCodeScan2`
- `question`
- `radius`
- `receiptAdd`
- `receiptCheck`
- `receiptClese`
- `receiptDown`
- `receiptRemove`
- `recycle`
- `refresh`
- `refreshRound`
- `rejectedFile2`
- `research`
- `researchPresentationLeft`
- `reward`
- `rightCircle`
- `rightCircle2`
- `rightDirection`
- `rightDirectionCircle`
- `rightDirectionSquare`
- `rightLeftScrollBar`
- `rightSign`
- `rightSquare3`
- `rotateLock`
- `router4`
- `ruler10`
- `ruler2`
- `ruler6`
- `ruler7`
- `safebox`
- `safebox2`
- `sailboat`
- `satelliteDish`
- `saveErrorLeft`
- `scanAlt`
- `schoolBag`
- `screenCapture`
- `screenchot`
- `searchAlt2`
- `searchAlt3`
- `secure`
- `securedFileFolder2`
- `settings`
- `settingsAlt4`
- `settingsAlt5`
- `shareAlt`
- `shareAlt5`
- `shippingBox2`
- `signInDoubleArrow2`
- `signOutAlt`
- `signOutLeft`
- `signal`
- `signal2`
- `sleepingBag`
- `sleepingBag2`
- `sofa`
- `sofa2`
- `sort`
- `sortAscending`
- `sortDescending`
- `soundIncrease`
- `soundMax`
- `soundMin`
- `soundReduce`
- `squareRoot`
- `squareRootOfX`
- `squareRootSquare`
- `stairs`
- `stairs3`
- `stamp3`
- `stats`
- `stickyNotes2`
- `stickyNotes6`
- `stickyNotes9`
- `stool`
- `stool2`
- `stop`
- `stopwatch3Second`
- `stopwatch7Second`
- `subway`
- `suit`
- `suitcaseBag`
- `suspension`
- `suspension2`
- `swissArmyKnife`
- `switchDouble`
- `switchLeft`
- `switchRight`
- `tableLamp`
- `tabletLaptop`
- `takeOff`
- `tax`
- `telescope`
- `tent`
- `ticket`
- `timeClock`
- `timer5Second`
- `timerError`
- `toaster`
- `toaster2`
- `toilet`
- `toilet2`
- `toiletPaper`
- `toiletPaper7`
- `toiletPaper9`
- `topCircle`
- `touchid`
- `translate`
- `tree2`
- `triangleRulerPencil`
- `trophy`
- `trowel3`
- `truckLift`
- `turnAroundDownDirection`
- `turnAroundLeftTopDirection2`
- `turnAroundRightDirection2`
- `turnAroundUpDirection`
- `turnLeftSign`
- `turnRightSign`
- `tvStand`
- `tvStand2`
- `unicycle2`
- `unlock`
- `unlock1`
- `upAlt`
- `upArrow`
- `upDirection2`
- `upDownArrow`
- `upDownArrow2`
- `upJunctionSign`
- `upOctagon`
- `upTrend`
- `update`
- `upload5`
- `uploadAlt4`
- `uploadNew`
- `user`
- `user6`
- `user7`
- `userAlert`
- `userCircle2`
- `vase2`
- `vest2`
- `vibrate`
- `video`
- `vision`
- `voice`
- `wallet`
- `walletAlt`
- `walletAlt2`
- `walletMoney`
- `walletMoney3`
- `warningAlt`
- `warningAlt3`
- `washbasin4`
- `waterBottle`
- `waterCan2`
- `waterTap`
- `whiteBoard`
- `wifi`
- `window`
- `window5`
- `window6`
- `work`
- `workAgenda`
- `zigZagLeftRightArrow`
- `zigZagLeftUpArrow`
- `zigZagRightUpArrow`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><1stPlaceIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><2kIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><2ndPlaceIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3rdPlaceIcon size="20" class="nav-icon" /> Settings</a>
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
<1stPlaceIcon
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
    <1stPlaceIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <2kIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <2ndPlaceIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <1stPlaceIcon size="24" />
   <2kIcon size="24" color="#4a90e2" />
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
   <1stPlaceIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <1stPlaceIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <1stPlaceIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 1stPlace } from '@stacksjs/iconify-marketeq'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(1stPlace, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 1stPlace } from '@stacksjs/iconify-marketeq'

// Icons are typed as IconData
const myIcon: IconData = 1stPlace
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Marketeq
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/marketeq/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/marketeq/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
