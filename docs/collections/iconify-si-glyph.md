# SmartIcons Glyph

> SmartIcons Glyph icons for stx from Iconify

## Overview

This package provides access to 799 icons from the SmartIcons Glyph collection through the stx iconify integration.

**Collection ID:** `si-glyph`
**Total Icons:** 799
**Author:** SmartIcons
**License:** CC BY SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-si-glyph
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AbacusIcon height="1em" />
<AbacusIcon width="1em" height="1em" />
<AbacusIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AbacusIcon size="24" />
<AbacusIcon size="1em" />

<!-- Using width and height -->
<AbacusIcon width="24" height="32" />

<!-- With color -->
<AbacusIcon size="24" color="red" />
<AbacusIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AbacusIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AbacusIcon
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
    <AbacusIcon size="24" />
    <AdjustmentHorizonIcon size="24" color="#4a90e2" />
    <AdjustmentVerticalIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { abacus, adjustmentHorizon, adjustmentVertical } from '@stacksjs/iconify-si-glyph'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abacus, { size: 24 })
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
<AbacusIcon size="24" color="red" />
<AbacusIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AbacusIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AbacusIcon size="24" class="text-primary" />
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
<AbacusIcon height="1em" />
<AbacusIcon width="1em" height="1em" />
<AbacusIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AbacusIcon size="24" />
<AbacusIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.siGlyph-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AbacusIcon class="siGlyph-icon" />
```

## Available Icons

This package contains **799** icons:

- `abacus`
- `adjustmentHorizon`
- `adjustmentVertical`
- `airBalloon`
- `airplane`
- `airplane2`
- `alarmClock`
- `alien`
- `alighLeft`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `ambulance`
- `anchor`
- `android`
- `angle1`
- `angle2`
- `antenna1`
- `apron`
- `arrowBackward`
- `arrowChange`
- `arrowCircleRycycle`
- `arrowDown`
- `arrowForward`
- `arrowFourWay`
- `arrowFullscreen`
- `arrowFullscreen2`
- `arrowLeft`
- `arrowLeftRight`
- `arrowMove`
- `arrowReload`
- `arrowResize1`
- `arrowResize2`
- `arrowResize3`
- `arrowResize4`
- `arrowResize5`
- `arrowResize6`
- `arrowRight`
- `arrowShuffle`
- `arrowThickDown`
- `arrowThickLeft`
- `arrowThickRight`
- `arrowThickThinDown`
- `arrowThickThinUp`
- `arrowThickUp`
- `arrowThinDown`
- `arrowThinLeft`
- `arrowThinLeftBottom`
- `arrowThinLeftTop`
- `arrowThinRight`
- `arrowThinRightBottom`
- `arrowThinRightTop`
- `arrowThinUp`
- `arrowThreeWay1`
- `arrowThreeWay2`
- `arrowTriangleRecycle`
- `arrowTwoLeftRight`
- `arrowTwoUp`
- `arrowTwoWay`
- `arrowTwoWayLeftRight`
- `arrowTwoWayRight`
- `arrowTwoWayRightBottom`
- `arrowUp`
- `arrowUpDown`
- `arrowWave`
- `artBoard`
- `askterisk`
- `atmCard`
- `axe`
- `baby`
- `babyMilkBotl`
- `babyStroller`
- `babyTroller`
- `backPack`
- `backwardPage`
- `badgeName`
- `bag`
- `bagPlus`
- `bagRemove`
- `balance`
- `balloon`
- `bandage`
- `bank`
- `barcode`
- `barrier`
- `baseball`
- `baseballStick`
- `basket`
- `basketArrowDown`
- `basketArrowLeft`
- `basketArrowRight`
- `basketArrowUp`
- `basketChecked`
- `basketError`
- `basketPlus`
- `basketRemove`
- `basketball`
- `batteryCharging`
- `batteryEmpty`
- `batteryFull`
- `batteryHalf`
- `batteryHalf2`
- `batteryLow`
- `bed`
- `bell`
- `bicycle1`
- `bicycle3`
- `bicycleMan`
- `bikini`
- `billiardBall`
- `binocular`
- `birthdayCake`
- `biscuit`
- `blender`
- `bloodBag`
- `bluetooth`
- `board`
- `boat`
- `bolt`
- `bomb1`
- `bomb2`
- `bone`
- `book`
- `book1`
- `book3`
- `book4`
- `bookOpen`
- `bookPerson`
- `bookcase`
- `bookmark`
- `botl2`
- `botlMilk`
- `bowTie`
- `box`
- `boxDownload`
- `boxUpload`
- `bread`
- `briefcase`
- `briefcasePerson`
- `brightness`
- `brush1`
- `brush2`
- `brushAndPencil`
- `bubbleChat`
- `bubbleMessage`
- `bubbleMessageDot`
- `bubbleMessageDot2`
- `bubbleMessageHi`
- `bubbleMessageQuote`
- `bubbleMessageTalk`
- `bubbleMessageText`
- `bucket`
- `bug`
- `building`
- `bulletCheckedList`
- `bulletList`
- `bulletList2`
- `bus`
- `buttonArrowDown`
- `buttonArrowLeft`
- `buttonArrowRight`
- `buttonArrowUp`
- `buttonBuy`
- `buttonError`
- `buttonHd`
- `buttonPlay`
- `buttonPlus`
- `buttonRemove`
- `buttonSale`
- `buttonSell`
- `buttonStarburst`
- `buttonTriangleUp`
- `buttonTv`
- `cabinCable`
- `cabinet`
- `calculator`
- `calculator2`
- `calendar1`
- `calendar3`
- `calendarEmpty`
- `call`
- `callForward`
- `callReply`
- `camera`
- `cameraProjector`
- `cameraSecurity`
- `canWater`
- `candle`
- `candy`
- `candyStick`
- `car`
- `carGarage`
- `casette`
- `cashierMachine`
- `castle`
- `caterpillarMachine`
- `centeJustify`
- `chair1`
- `chair2`
- `championCup`
- `chartColumn`
- `chartColumnDecrease`
- `chartColumnIncrease`
- `chartDecrease`
- `chartPiece`
- `checked`
- `cheese`
- `cherry`
- `christmasMistletoe`
- `christmassBall`
- `christmassEgg`
- `christmassHat`
- `christmassTree`
- `circle`
- `circleBackward`
- `circleControlPad`
- `circleDrashed`
- `circleError`
- `circleForward`
- `circleHelp`
- `circleInfo`
- `circleLoadLeft`
- `circleLoadRight`
- `circlePlus`
- `circleRemove`
- `circleStar`
- `circleTriangleDown`
- `circleTriangleLeft`
- `circleTriangleRight`
- `city`
- `clamp`
- `clapboard`
- `clapboardPlay`
- `clip`
- `clipboard`
- `clipboardChecked`
- `clock`
- `close`
- `cloud`
- `cloudCloud`
- `cloudDownload`
- `cloudHeavyRain`
- `cloudPlus`
- `cloudRainHeavyRain`
- `cloudRemove`
- `cloudSnow`
- `cloudSun`
- `cloudThunder`
- `cloudUpload`
- `clover`
- `cockPot`
- `cocktail`
- `coconut`
- `code`
- `coffeeMachine`
- `colorPicker`
- `columnDecrease`
- `columnIncrease`
- `columnWave`
- `comb`
- `compass`
- `cone`
- `congratulationHat`
- `connect1`
- `connect2`
- `contactBook`
- `contacter`
- `contrast`
- `controlPad`
- `corkscrew`
- `cornerFlag`
- `coverFlow`
- `coverFood`
- `cow`
- `cpu`
- `cran`
- `crop`
- `crossHair`
- `crossHair2`
- `crown`
- `cruise`
- `cubic`
- `cupCake`
- `curtain`
- `customerSupport`
- `dashboard`
- `dataArrowDown`
- `database`
- `databaseDownload`
- `databaseError`
- `databasePlus`
- `databaseRemove`
- `databaseShare`
- `databaseUpload`
- `delete`
- `deliciousCircle`
- `deny`
- `desktop`
- `dialNumber`
- `dialNumber1`
- `diamond`
- `dice1`
- `dice2`
- `dice3`
- `dice5`
- `dice6`
- `disc`
- `discAdd`
- `discDeny`
- `discDownload`
- `discError`
- `discPause`
- `discPlay`
- `discPlay2`
- `discRemove`
- `discStop`
- `discUpload`
- `dish`
- `diskAntenna`
- `dna`
- `document`
- `documentArrowDown`
- `documentArrowLeft`
- `documentArrowRight`
- `documentArrowUp`
- `documentBackward`
- `documentBulletList`
- `documentChecked`
- `documentCopy`
- `documentDoc`
- `documentEdit`
- `documentError`
- `documentForward`
- `documentHelp`
- `documentMusic`
- `documentPdf`
- `documentPlus`
- `documentRemove`
- `documentRss`
- `documentSearch`
- `documentStar`
- `documentWarning`
- `dog`
- `door`
- `downstair`
- `downwardsArrowToBar`
- `drill`
- `dropWater`
- `dropbox`
- `drum`
- `easal`
- `edit`
- `egg`
- `eject`
- `electron`
- `elevatorDown`
- `elevatorUp`
- `emoticon`
- `endPage`
- `erase`
- `euro`
- `excavator`
- `extinguisher`
- `eyeDrop`
- `eyeGlass`
- `factory`
- `faucet`
- `feather`
- `female`
- `fence`
- `fence2`
- `fileBox`
- `fileDownload`
- `fileUpload`
- `film`
- `film35mm`
- `finder`
- `fingerUp`
- `fire`
- `fireAlarm`
- `fireHydrant`
- `fireWood`
- `firstAidBriefcase`
- `fish`
- `flag`
- `float`
- `floppyDisk`
- `flower`
- `flowerPot`
- `folder`
- `folderContact`
- `folderError`
- `folderMusic`
- `folderOpen`
- `folderPlus`
- `folderRemove`
- `folderRss`
- `folderSearch`
- `folderShare`
- `folderWarning`
- `footSign`
- `forcus`
- `forklift`
- `forwardPage`
- `fridge`
- `fullscreen`
- `game1`
- `gameControll`
- `gasStation`
- `gate`
- `gear`
- `gear1`
- `ghost`
- `gift`
- `glassWater`
- `global`
- `globe`
- `glove`
- `golfBall`
- `golfFlag`
- `guitar`
- `hamburger`
- `hammer`
- `hammerAndWrench`
- `hand`
- `handLamp`
- `handSwitch`
- `handcuff`
- `hanger`
- `hardware`
- `hat`
- `hatChef`
- `head`
- `headSet`
- `heart`
- `heartDelete`
- `heartPlus`
- `heartRemove`
- `heartSignal`
- `helicopter`
- `helicopterPad`
- `helmWheel`
- `helmet`
- `hightheel`
- `history`
- `hockey`
- `homePage`
- `horse`
- `horseShoe`
- `hospital`
- `house`
- `iceCream`
- `idBadge`
- `image`
- `inColumns`
- `inboxDownload`
- `inboxUpload`
- `infinity`
- `infinity2`
- `info`
- `ipod`
- `iron`
- `jumpBackward`
- `jumpDoublePageLeftRight`
- `jumpForward`
- `jumpPageLeftRight`
- `jumpPageUpDown`
- `kette`
- `key`
- `key2`
- `keyboard`
- `knife`
- `ladderPool`
- `lamp`
- `lampDesk`
- `lavabo`
- `lawHammer`
- `layout1`
- `layout2`
- `layout3`
- `layout4`
- `leaf`
- `leftJustify`
- `leftwardsArrowToBar`
- `lightAlarm`
- `lightBulb`
- `lightHouse`
- `like`
- `likeUnlike`
- `lineTwoAnglePoint`
- `link1`
- `link2`
- `link3`
- `load`
- `lock`
- `lockUnlock`
- `louder2`
- `louderSpeaker`
- `magnet`
- `magnifier`
- `magnifier2`
- `mail`
- `mailBox`
- `mailEmpty`
- `mailHasMail`
- `mailInbox`
- `mailSend`
- `male`
- `manDoctor`
- `map3`
- `mapSquare`
- `markSnorker`
- `mask1`
- `mask2`
- `medalStar`
- `microphone1`
- `microphone2`
- `microscope`
- `mobile`
- `mocule`
- `money`
- `money3`
- `moneyBag`
- `moneyCoin`
- `moonStar`
- `motobike`
- `mountain`
- `moviePlay`
- `movieProjector`
- `multifunctionKnife`
- `mushrooms`
- `music`
- `musicNote`
- `mustache`
- `network`
- `network2`
- `newspaper`
- `noDog`
- `noSmoke`
- `note`
- `note2`
- `oldPhone`
- `open`
- `pallette`
- `paperClip`
- `paperPlane`
- `paperRoll`
- `paperShredder`
- `pause`
- `pawn`
- `paypal`
- `pen`
- `penNib`
- `pencil`
- `percent`
- `person`
- `person2`
- `personChecked`
- `personDoorMan`
- `personError`
- `personMan`
- `personPeople`
- `personPlus`
- `personPrison`
- `personPublic`
- `personRemove`
- `personTalk`
- `personWoman`
- `petCarrier`
- `phoneFax`
- `phoneNumber`
- `piano`
- `pick`
- `picture`
- `picture2`
- `pictureCopy`
- `piggyBank`
- `pill`
- `pinLocation`
- `pinLocation1`
- `pinLocation2`
- `pinLocationAdd`
- `pinLocationDelete`
- `pinLocationLove`
- `pinLocationMap`
- `pinLocationRemove`
- `pinMap`
- `pingPongRacket`
- `pipe`
- `pizza`
- `plugin`
- `plus`
- `podium`
- `poker1`
- `poker2`
- `poker3`
- `poker4`
- `print`
- `puzzle`
- `quoteClose`
- `quoteOpen`
- `radio`
- `radioactive`
- `record`
- `reduce`
- `reelAudio`
- `reelFilm`
- `remove`
- `repeat`
- `resizeInFrame`
- `resizeOutFrame`
- `retroeexcavadora`
- `ribbon`
- `rightJustify`
- `rightwardsArrowToBar`
- `ring`
- `road`
- `rocket`
- `roller`
- `rss`
- `rugbyBall`
- `ruler`
- `safeBox`
- `safePin`
- `satellite`
- `saw`
- `scissor`
- `scissorLineCut`
- `screenFul`
- `screenScale`
- `screw`
- `screwDriver`
- `sdCard`
- `seriff`
- `sewingMachine`
- `sewingRoll`
- `share1`
- `share2`
- `share3`
- `share5`
- `sheep`
- `shield`
- `shield2`
- `shieldPlus`
- `shieldStar`
- `shovel`
- `shower`
- `signBoard`
- `signFoot`
- `signIn`
- `signOut`
- `signP`
- `signRoad1`
- `signRoad2`
- `signal1`
- `signal2`
- `signal3`
- `siteMap`
- `siteMapRevert`
- `skateboard`
- `skull`
- `sleep`
- `slideShow`
- `smartphone`
- `sms`
- `snow`
- `soccerYard`
- `sock`
- `socket`
- `solarBlind`
- `sos`
- `sound`
- `soundMute`
- `spaceShip`
- `spanner`
- `spoonFork`
- `spray`
- `square`
- `squareChecked`
- `squareDashed1`
- `squareDashed2`
- `squareDelicious`
- `squareEightAnglePoint`
- `squareFour`
- `squareFourAnglePoint`
- `squarePlus`
- `squareStar`
- `stamps`
- `starCross`
- `starStick`
- `stele`
- `stelescope`
- `stereoJack`
- `stethoscope`
- `store`
- `stove`
- `strawberry`
- `street2`
- `strolley`
- `strolleyArrowDown`
- `strolleyArrowUp`
- `strolleyPlus`
- `strolleyRemove`
- `subway`
- `suitcase`
- `suitcasePerson`
- `syringe`
- `tShirt`
- `tablet`
- `tag`
- `tag1`
- `tagOnePlus`
- `tagPrice`
- `tank`
- `targer`
- `teaCup`
- `teeth`
- `telephoneBox`
- `telescope`
- `television`
- `tennisRacketBall`
- `tent1`
- `tentCamp`
- `testTube`
- `testTube2`
- `testTubeEmpty`
- `textSearch`
- `thermometer`
- `threeBall`
- `ticTacToe`
- `timeGlass`
- `timeReload`
- `timer`
- `toilet`
- `toolBox`
- `trafficLight`
- `train`
- `trainRail`
- `trash`
- `tree`
- `trees`
- `triangleDoubleArrowDown`
- `triangleDoubleArrowLeft`
- `triangleDoubleArrowRight`
- `triangleDoubleArrowUp`
- `triangleDown`
- `triangleLeft`
- `triangleRight`
- `triangleUp`
- `trolley2`
- `trolleyArrowDown`
- `trolleyArrowUp`
- `trolleyBriefcase`
- `trolleyError`
- `trolleyFull`
- `trolleyPlus`
- `trolleyRemove`
- `truck`
- `trumpet`
- `turnOff`
- `twoArrowDown`
- `twoArrowInDownUp`
- `twoArrowInLeftRight`
- `twoArrowLeft`
- `twoArrowRight`
- `typewriter`
- `umberllaChair`
- `umbrellaClose`
- `umbrellaOpen`
- `umbrellaSea`
- `upstair`
- `upwardsArrowToBar`
- `upwardsArrowWithLoop`
- `usb`
- `view`
- `wacomTablet`
- `wall`
- `wallet`
- `washMachine`
- `washMachine2`
- `watch`
- `webcam`
- `weightDown`
- `weightKilograms`
- `weightUp`
- `wheelChair`
- `wheelSteel`
- `wieght`
- `wifi1`
- `windTurbines`
- `window`
- `woodStove`
- `wrench`
- `wrenchScrewdriver`
- `yen`
- `yingYang`
- `zip`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AbacusIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdjustmentHorizonIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdjustmentVerticalIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AirBalloonIcon size="20" class="nav-icon" /> Settings</a>
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
<AbacusIcon
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
    <AbacusIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdjustmentHorizonIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdjustmentVerticalIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AbacusIcon size="24" />
   <AdjustmentHorizonIcon size="24" color="#4a90e2" />
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
   <AbacusIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AbacusIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AbacusIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { abacus } from '@stacksjs/iconify-si-glyph'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(abacus, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abacus } from '@stacksjs/iconify-si-glyph'

// Icons are typed as IconData
const myIcon: IconData = abacus
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: SmartIcons
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/si-glyph/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/si-glyph/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
