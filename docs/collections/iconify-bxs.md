# BoxIcons Solid

> BoxIcons Solid icons for stx from Iconify

## Overview

This package provides access to 665 icons from the BoxIcons Solid collection through the stx iconify integration.

**Collection ID:** `bxs`
**Total Icons:** 665
**Author:** Atisa ([Website](https://github.com/atisawd/boxicons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bxs
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddToQueueIcon height="1em" />
<AddToQueueIcon width="1em" height="1em" />
<AddToQueueIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddToQueueIcon size="24" />
<AddToQueueIcon size="1em" />

<!-- Using width and height -->
<AddToQueueIcon width="24" height="32" />

<!-- With color -->
<AddToQueueIcon size="24" color="red" />
<AddToQueueIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddToQueueIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddToQueueIcon
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
    <AddToQueueIcon size="24" />
    <AdjustIcon size="24" color="#4a90e2" />
    <AdjustAltIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addToQueue, adjust, adjustAlt } from '@stacksjs/iconify-bxs'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addToQueue, { size: 24 })
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
<AddToQueueIcon size="24" color="red" />
<AddToQueueIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddToQueueIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddToQueueIcon size="24" class="text-primary" />
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
<AddToQueueIcon height="1em" />
<AddToQueueIcon width="1em" height="1em" />
<AddToQueueIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddToQueueIcon size="24" />
<AddToQueueIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.bxs-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddToQueueIcon class="bxs-icon" />
```

## Available Icons

This package contains **665** icons:

- `addToQueue`
- `adjust`
- `adjustAlt`
- `alarm`
- `alarmAdd`
- `alarmExclamation`
- `alarmOff`
- `alarmSnooze`
- `album`
- `ambulance`
- `analyse`
- `angry`
- `arch`
- `archive`
- `archiveIn`
- `archiveOut`
- `area`
- `arrowFromBottom`
- `arrowFromLeft`
- `arrowFromRight`
- `arrowFromTop`
- `arrowToBottom`
- `arrowToLeft`
- `arrowToRight`
- `arrowToTop`
- `award`
- `babyCarriage`
- `backpack`
- `badge`
- `badgeCheck`
- `badgeDollar`
- `baguette`
- `ball`
- `balloon`
- `bandAid`
- `bank`
- `barChartAlt2`
- `barChartSquare`
- `barcode`
- `baseball`
- `basket`
- `basketball`
- `bath`
- `battery`
- `batteryCharging`
- `batteryFull`
- `batteryLow`
- `bed`
- `beenHere`
- `beer`
- `bell`
- `bellMinus`
- `bellOff`
- `bellPlus`
- `bellRing`
- `bible`
- `binoculars`
- `blanket`
- `bolt`
- `boltCircle`
- `bomb`
- `bone`
- `bong`
- `book`
- `bookAdd`
- `bookAlt`
- `bookBookmark`
- `bookContent`
- `bookHeart`
- `bookOpen`
- `bookReader`
- `bookmark`
- `bookmarkAlt`
- `bookmarkAltMinus`
- `bookmarkAltPlus`
- `bookmarkHeart`
- `bookmarkMinus`
- `bookmarkPlus`
- `bookmarkStar`
- `bookmarks`
- `bot`
- `bowlHot`
- `bowlRice`
- `bowlingBall`
- `box`
- `brain`
- `briefcase`
- `briefcaseAlt`
- `briefcaseAlt2`
- `brightness`
- `brightnessHalf`
- `brush`
- `brushAlt`
- `bug`
- `bugAlt`
- `building`
- `buildingHouse`
- `buildings`
- `bulb`
- `bullseye`
- `buoy`
- `bus`
- `busSchool`
- `business`
- `cabinet`
- `cableCar`
- `cake`
- `calculator`
- `calendar`
- `calendarAlt`
- `calendarCheck`
- `calendarEdit`
- `calendarEvent`
- `calendarExclamation`
- `calendarHeart`
- `calendarMinus`
- `calendarPlus`
- `calendarStar`
- `calendarWeek`
- `calendarX`
- `camera`
- `cameraHome`
- `cameraMovie`
- `cameraOff`
- `cameraPlus`
- `capsule`
- `captions`
- `car`
- `carBattery`
- `carCrash`
- `carGarage`
- `carMechanic`
- `carWash`
- `card`
- `caretDownCircle`
- `caretDownSquare`
- `caretLeftCircle`
- `caretLeftSquare`
- `caretRightCircle`
- `caretRightSquare`
- `caretUpCircle`
- `caretUpSquare`
- `carousel`
- `cart`
- `cartAdd`
- `cartAlt`
- `cartDownload`
- `castle`
- `cat`
- `category`
- `categoryAlt`
- `cctv`
- `certification`
- `chalkboard`
- `chart`
- `chat`
- `checkCircle`
- `checkShield`
- `checkSquare`
- `checkbox`
- `checkboxChecked`
- `checkboxMinus`
- `cheese`
- `chess`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownSquare`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronLeftSquare`
- `chevronRight`
- `chevronRightCircle`
- `chevronRightSquare`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpSquare`
- `chevronsDown`
- `chevronsLeft`
- `chevronsRight`
- `chevronsUp`
- `chip`
- `church`
- `circle`
- `circleHalf`
- `circleQuarter`
- `circleThreeQuarter`
- `city`
- `clinic`
- `cloud`
- `cloudDownload`
- `cloudLightning`
- `cloudRain`
- `cloudUpload`
- `coffee`
- `coffeeAlt`
- `coffeeBean`
- `coffeeTogo`
- `cog`
- `coin`
- `coinStack`
- `collection`
- `color`
- `colorFill`
- `comment`
- `commentAdd`
- `commentCheck`
- `commentDetail`
- `commentDots`
- `commentEdit`
- `commentError`
- `commentMinus`
- `commentX`
- `compass`
- `component`
- `confused`
- `contact`
- `conversation`
- `cookie`
- `cool`
- `copy`
- `copyAlt`
- `copyright`
- `coupon`
- `creditCard`
- `creditCardAlt`
- `creditCardFront`
- `cricketBall`
- `crop`
- `crown`
- `cube`
- `cubeAlt`
- `cuboid`
- `customize`
- `cylinder`
- `dashboard`
- `data`
- `detail`
- `devices`
- `diamond`
- `dice1`
- `dice2`
- `dice3`
- `dice4`
- `dice5`
- `dice6`
- `directionLeft`
- `directionRight`
- `directions`
- `disc`
- `discount`
- `dish`
- `dislike`
- `dizzy`
- `dockBottom`
- `dockLeft`
- `dockRight`
- `dockTop`
- `dog`
- `dollarCircle`
- `donateBlood`
- `donateHeart`
- `doorOpen`
- `doughnutChart`
- `downArrow`
- `downArrowAlt`
- `downArrowCircle`
- `downArrowSquare`
- `download`
- `downvote`
- `drink`
- `droplet`
- `dropletHalf`
- `dryer`
- `duplicate`
- `edit`
- `editAlt`
- `editLocation`
- `eject`
- `envelope`
- `envelopeOpen`
- `eraser`
- `error`
- `errorAlt`
- `errorCircle`
- `evStation`
- `exit`
- `extension`
- `eyedropper`
- `face`
- `faceMask`
- `factory`
- `fastForwardCircle`
- `file`
- `fileArchive`
- `fileBlank`
- `fileCss`
- `fileDoc`
- `fileExport`
- `fileFind`
- `fileGif`
- `fileHtml`
- `fileImage`
- `fileImport`
- `fileJpg`
- `fileJs`
- `fileJson`
- `fileMd`
- `filePdf`
- `filePlus`
- `filePng`
- `fileTxt`
- `film`
- `filterAlt`
- `firstAid`
- `flag`
- `flagAlt`
- `flagCheckered`
- `flame`
- `flask`
- `florist`
- `folder`
- `folderMinus`
- `folderOpen`
- `folderPlus`
- `foodMenu`
- `fridge`
- `game`
- `gasPump`
- `ghost`
- `gift`
- `graduation`
- `grid`
- `gridAlt`
- `group`
- `guitarAmp`
- `hand`
- `handDown`
- `handLeft`
- `handRight`
- `handUp`
- `happy`
- `happyAlt`
- `happyBeaming`
- `happyHeartEyes`
- `hardHat`
- `hdd`
- `heart`
- `heartCircle`
- `heartSquare`
- `helpCircle`
- `hide`
- `home`
- `homeAlt2`
- `homeCircle`
- `homeHeart`
- `homeSmile`
- `hot`
- `hotel`
- `hourglass`
- `hourglassBottom`
- `hourglassTop`
- `idCard`
- `image`
- `imageAdd`
- `imageAlt`
- `inbox`
- `infoCircle`
- `infoSquare`
- `injection`
- `institution`
- `invader`
- `joystick`
- `joystickAlt`
- `joystickButton`
- `key`
- `keyboard`
- `label`
- `landmark`
- `landscape`
- `laugh`
- `layer`
- `layerMinus`
- `layerPlus`
- `layout`
- `leaf`
- `leftArrow`
- `leftArrowAlt`
- `leftArrowCircle`
- `leftArrowSquare`
- `leftDownArrowCircle`
- `leftTopArrowCircle`
- `lemon`
- `like`
- `locationPlus`
- `lock`
- `lockAlt`
- `lockOpen`
- `lockOpenAlt`
- `logIn`
- `logInCircle`
- `logOut`
- `logOutCircle`
- `lowVision`
- `magicWand`
- `magnet`
- `map`
- `mapAlt`
- `mapPin`
- `mask`
- `medal`
- `megaphone`
- `meh`
- `mehAlt`
- `mehBlank`
- `memoryCard`
- `message`
- `messageAdd`
- `messageAlt`
- `messageAltAdd`
- `messageAltCheck`
- `messageAltDetail`
- `messageAltDots`
- `messageAltEdit`
- `messageAltError`
- `messageAltMinus`
- `messageAltX`
- `messageCheck`
- `messageDetail`
- `messageDots`
- `messageEdit`
- `messageError`
- `messageMinus`
- `messageRounded`
- `messageRoundedAdd`
- `messageRoundedCheck`
- `messageRoundedDetail`
- `messageRoundedDots`
- `messageRoundedEdit`
- `messageRoundedError`
- `messageRoundedMinus`
- `messageRoundedX`
- `messageSquare`
- `messageSquareAdd`
- `messageSquareCheck`
- `messageSquareDetail`
- `messageSquareDots`
- `messageSquareEdit`
- `messageSquareError`
- `messageSquareMinus`
- `messageSquareX`
- `messageX`
- `meteor`
- `microchip`
- `microphone`
- `microphoneAlt`
- `microphoneOff`
- `minusCircle`
- `minusSquare`
- `mobile`
- `mobileVibration`
- `moon`
- `mouse`
- `mouseAlt`
- `movie`
- `moviePlay`
- `music`
- `navigation`
- `networkChart`
- `news`
- `noEntry`
- `note`
- `notepad`
- `notification`
- `notificationOff`
- `objectsHorizontalCenter`
- `objectsHorizontalLeft`
- `objectsHorizontalRight`
- `objectsVerticalBottom`
- `objectsVerticalCenter`
- `objectsVerticalTop`
- `offer`
- `package`
- `paint`
- `paintRoll`
- `palette`
- `paperPlane`
- `parking`
- `party`
- `paste`
- `pear`
- `pen`
- `pencil`
- `phone`
- `phoneCall`
- `phoneIncoming`
- `phoneOff`
- `phoneOutgoing`
- `photoAlbum`
- `piano`
- `pieChart`
- `pieChartAlt`
- `pieChartAlt2`
- `pin`
- `pizza`
- `plane`
- `planeAlt`
- `planeLand`
- `planeTakeOff`
- `planet`
- `playlist`
- `plug`
- `plusCircle`
- `plusSquare`
- `pointer`
- `polygon`
- `popsicle`
- `printer`
- `purchaseTag`
- `purchaseTagAlt`
- `pyramid`
- `quoteAltLeft`
- `quoteAltRight`
- `quoteLeft`
- `quoteRight`
- `quoteSingleLeft`
- `quoteSingleRight`
- `radiation`
- `radio`
- `receipt`
- `rectangle`
- `registered`
- `rename`
- `report`
- `rewindCircle`
- `rightArrow`
- `rightArrowAlt`
- `rightArrowCircle`
- `rightArrowSquare`
- `rightDownArrowCircle`
- `rightTopArrowCircle`
- `rocket`
- `ruler`
- `sad`
- `save`
- `school`
- `search`
- `searchAlt2`
- `selectMultiple`
- `send`
- `server`
- `shapes`
- `share`
- `shareAlt`
- `shield`
- `shieldAlt2`
- `shieldMinus`
- `shieldPlus`
- `shieldX`
- `ship`
- `shocked`
- `shoppingBag`
- `shoppingBagAlt`
- `shoppingBags`
- `show`
- `shower`
- `skipNextCircle`
- `skipPreviousCircle`
- `skull`
- `sleepy`
- `slideshow`
- `smile`
- `sortAlt`
- `spa`
- `speaker`
- `sprayCan`
- `spreadsheet`
- `square`
- `squareRounded`
- `star`
- `starHalf`
- `sticker`
- `stopwatch`
- `store`
- `storeAlt`
- `sun`
- `sushi`
- `tShirt`
- `tachometer`
- `tag`
- `tagAlt`
- `tagX`
- `taxi`
- `tennisBall`
- `terminal`
- `thermometer`
- `time`
- `timeFive`
- `timer`
- `tired`
- `toTop`
- `toggleLeft`
- `toggleRight`
- `tone`
- `torch`
- `traffic`
- `trafficBarrier`
- `trafficCone`
- `train`
- `trash`
- `trashAlt`
- `tree`
- `treeAlt`
- `trophy`
- `truck`
- `tv`
- `universalAccess`
- `upArrow`
- `upArrowAlt`
- `upArrowCircle`
- `upArrowSquare`
- `upsideDown`
- `upvote`
- `user`
- `userAccount`
- `userBadge`
- `userCheck`
- `userCircle`
- `userDetail`
- `userMinus`
- `userPin`
- `userPlus`
- `userRectangle`
- `userVoice`
- `userX`
- `vector`
- `vial`
- `video`
- `videoOff`
- `videoPlus`
- `videoRecording`
- `videos`
- `virus`
- `virusBlock`
- `volume`
- `volumeFull`
- `volumeLow`
- `volumeMute`
- `wallet`
- `walletAlt`
- `washer`
- `watch`
- `watchAlt`
- `webcam`
- `widget`
- `windowAlt`
- `wine`
- `winkSmile`
- `winkTongue`
- `wrench`
- `xCircle`
- `xSquare`
- `yinYang`
- `zap`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddToQueueIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdjustIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdjustAltIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlarmIcon size="20" class="nav-icon" /> Settings</a>
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
<AddToQueueIcon
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
    <AddToQueueIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdjustIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdjustAltIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddToQueueIcon size="24" />
   <AdjustIcon size="24" color="#4a90e2" />
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
   <AddToQueueIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddToQueueIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddToQueueIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addToQueue } from '@stacksjs/iconify-bxs'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addToQueue, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addToQueue } from '@stacksjs/iconify-bxs'

// Icons are typed as IconData
const myIcon: IconData = addToQueue
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Atisa ([Website](https://github.com/atisawd/boxicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bxs/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bxs/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
