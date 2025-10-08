# Font Awesome 6 Solid

> Font Awesome 6 Solid icons for stx from Iconify

## Overview

This package provides access to 1407 icons from the Font Awesome 6 Solid collection through the stx iconify integration.

**Collection ID:** `fa6-solid`
**Total Icons:** 1407
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa6-solid
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<0Icon height="1em" />
<0Icon width="1em" height="1em" />
<0Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<0Icon size="24" />
<0Icon size="1em" />

<!-- Using width and height -->
<0Icon width="24" height="32" />

<!-- With color -->
<0Icon size="24" color="red" />
<0Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<0Icon size="24" class="icon-primary" />

<!-- With all properties -->
<0Icon
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
    <0Icon size="24" />
    <1Icon size="24" color="#4a90e2" />
    <2Icon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 0, 1, 2 } from '@stacksjs/iconify-fa6-solid'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(0, { size: 24 })
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
<0Icon size="24" color="red" />
<0Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<0Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<0Icon size="24" class="text-primary" />
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
<0Icon height="1em" />
<0Icon width="1em" height="1em" />
<0Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<0Icon size="24" />
<0Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fa6Solid-icon {
  width: 1em;
  height: 1em;
}
```

```html
<0Icon class="fa6Solid-icon" />
```

## Available Icons

This package contains **1407** icons:

- `0`
- `1`
- `2`
- `3`
- `4`
- `5`
- `6`
- `7`
- `8`
- `9`
- `a`
- `addressBook`
- `addressCard`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `anchor`
- `anchorCircleCheck`
- `anchorCircleExclamation`
- `anchorCircleXmark`
- `anchorLock`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `anglesDown`
- `anglesLeft`
- `anglesRight`
- `anglesUp`
- `ankh`
- `appleWhole`
- `archway`
- `arrowDown`
- `arrowDown19`
- `arrowDown91`
- `arrowDownAZ`
- `arrowDownLong`
- `arrowDownShortWide`
- `arrowDownUpAcrossLine`
- `arrowDownUpLock`
- `arrowDownWideShort`
- `arrowDownZA`
- `arrowLeft`
- `arrowLeftLong`
- `arrowPointer`
- `arrowRight`
- `arrowRightArrowLeft`
- `arrowRightFromBracket`
- `arrowRightLong`
- `arrowRightToBracket`
- `arrowRightToCity`
- `arrowRotateLeft`
- `arrowRotateRight`
- `arrowTrendDown`
- `arrowTrendUp`
- `arrowTurnDown`
- `arrowTurnUp`
- `arrowUp`
- `arrowUp19`
- `arrowUp91`
- `arrowUpAZ`
- `arrowUpFromBracket`
- `arrowUpFromGroundWater`
- `arrowUpFromWaterPump`
- `arrowUpLong`
- `arrowUpRightDots`
- `arrowUpRightFromSquare`
- `arrowUpShortWide`
- `arrowUpWideShort`
- `arrowUpZA`
- `arrowsDownToLine`
- `arrowsDownToPeople`
- `arrowsLeftRight`
- `arrowsLeftRightToLine`
- `arrowsRotate`
- `arrowsSpin`
- `arrowsSplitUpAndLeft`
- `arrowsToCircle`
- `arrowsToDot`
- `arrowsToEye`
- `arrowsTurnRight`
- `arrowsTurnToDots`
- `arrowsUpDown`
- `arrowsUpDownLeftRight`
- `arrowsUpToLine`
- `asterisk`
- `at`
- `atom`
- `audioDescription`
- `australSign`
- `award`
- `b`
- `baby`
- `babyCarriage`
- `backward`
- `backwardFast`
- `backwardStep`
- `bacon`
- `bacteria`
- `bacterium`
- `bagShopping`
- `bahai`
- `bahtSign`
- `ban`
- `banSmoking`
- `bandage`
- `bangladeshiTakaSign`
- `barcode`
- `bars`
- `barsProgress`
- `barsStaggered`
- `baseball`
- `baseballBatBall`
- `basketShopping`
- `basketball`
- `bath`
- `batteryEmpty`
- `batteryFull`
- `batteryHalf`
- `batteryQuarter`
- `batteryThreeQuarters`
- `bed`
- `bedPulse`
- `beerMugEmpty`
- `bell`
- `bellConcierge`
- `bellSlash`
- `bezierCurve`
- `bicycle`
- `binoculars`
- `biohazard`
- `bitcoinSign`
- `blender`
- `blenderPhone`
- `blog`
- `bold`
- `bolt`
- `boltLightning`
- `bomb`
- `bone`
- `bong`
- `book`
- `bookAtlas`
- `bookBible`
- `bookBookmark`
- `bookJournalWhills`
- `bookMedical`
- `bookOpen`
- `bookOpenReader`
- `bookQuran`
- `bookSkull`
- `bookTanakh`
- `bookmark`
- `borderAll`
- `borderNone`
- `borderTopLeft`
- `boreHole`
- `bottleDroplet`
- `bottleWater`
- `bowlFood`
- `bowlRice`
- `bowlingBall`
- `box`
- `boxArchive`
- `boxOpen`
- `boxTissue`
- `boxesPacking`
- `boxesStacked`
- `braille`
- `brain`
- `brazilianRealSign`
- `breadSlice`
- `bridge`
- `bridgeCircleCheck`
- `bridgeCircleExclamation`
- `bridgeCircleXmark`
- `bridgeLock`
- `bridgeWater`
- `briefcase`
- `briefcaseMedical`
- `broom`
- `broomBall`
- `brush`
- `bucket`
- `bug`
- `bugSlash`
- `bugs`
- `building`
- `buildingCircleArrowRight`
- `buildingCircleCheck`
- `buildingCircleExclamation`
- `buildingCircleXmark`
- `buildingColumns`
- `buildingFlag`
- `buildingLock`
- `buildingNgo`
- `buildingShield`
- `buildingUn`
- `buildingUser`
- `buildingWheat`
- `bullhorn`
- `bullseye`
- `burger`
- `burst`
- `bus`
- `busSimple`
- `businessTime`
- `c`
- `cableCar`
- `cakeCandles`
- `calculator`
- `calendar`
- `calendarCheck`
- `calendarDay`
- `calendarDays`
- `calendarMinus`
- `calendarPlus`
- `calendarWeek`
- `calendarXmark`
- `camera`
- `cameraRetro`
- `cameraRotate`
- `campground`
- `candyCane`
- `cannabis`
- `capsules`
- `car`
- `carBattery`
- `carBurst`
- `carCrash`
- `carOn`
- `carRear`
- `carSide`
- `carTunnel`
- `caravan`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `carrot`
- `cartArrowDown`
- `cartFlatbed`
- `cartFlatbedSuitcase`
- `cartPlus`
- `cartShopping`
- `cashRegister`
- `cat`
- `cediSign`
- `centSign`
- `certificate`
- `chair`
- `chalkboard`
- `chalkboardUser`
- `champagneGlasses`
- `chargingStation`
- `chartArea`
- `chartBar`
- `chartColumn`
- `chartDiagram`
- `chartGantt`
- `chartLine`
- `chartPie`
- `chartSimple`
- `check`
- `checkDouble`
- `checkToSlot`
- `cheese`
- `chess`
- `chessBishop`
- `chessBoard`
- `chessKing`
- `chessKnight`
- `chessPawn`
- `chessQueen`
- `chessRook`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `child`
- `childCombatant`
- `childDress`
- `childReaching`
- `children`
- `church`
- `circle`
- `circleArrowDown`
- `circleArrowLeft`
- `circleArrowRight`
- `circleArrowUp`
- `circleCheck`
- `circleChevronDown`
- `circleChevronLeft`
- `circleChevronRight`
- `circleChevronUp`
- `circleDollarToSlot`
- `circleDot`
- `circleDown`
- `circleExclamation`
- `circleH`
- `circleHalfStroke`
- `circleInfo`
- `circleLeft`
- `circleMinus`
- `circleNodes`
- `circleNotch`
- `circlePause`
- `circlePlay`
- `circlePlus`
- `circleQuestion`
- `circleRadiation`
- `circleRight`
- `circleStop`
- `circleUp`
- `circleUser`
- `circleXmark`
- `city`
- `clapperboard`
- `clipboard`
- `clipboardCheck`
- `clipboardList`
- `clipboardQuestion`
- `clipboardUser`
- `clock`
- `clockRotateLeft`
- `clone`
- `closedCaptioning`
- `cloud`
- `cloudArrowDown`
- `cloudArrowUp`
- `cloudBolt`
- `cloudMeatball`
- `cloudMoon`
- `cloudMoonRain`
- `cloudRain`
- `cloudShowersHeavy`
- `cloudShowersWater`
- `cloudSun`
- `cloudSunRain`
- `clover`
- `code`
- `codeBranch`
- `codeCommit`
- `codeCompare`
- `codeFork`
- `codeMerge`
- `codePullRequest`
- `coins`
- `colonSign`
- `comment`
- `commentDollar`
- `commentDots`
- `commentMedical`
- `commentNodes`
- `commentSlash`
- `commentSms`
- `comments`
- `commentsDollar`
- `compactDisc`
- `compass`
- `compassDrafting`
- `compress`
- `computer`
- `computerMouse`
- `cookie`
- `cookieBite`
- `copy`
- `copyright`
- `couch`
- `cow`
- `creditCard`
- `crop`
- `cropSimple`
- `cross`
- `crosshairs`
- `crow`
- `crown`
- `crutch`
- `cruzeiroSign`
- `cube`
- `cubes`
- `cubesStacked`
- `d`
- `database`
- `deleteLeft`
- `democrat`
- `desktop`
- `dharmachakra`
- `diagramNext`
- `diagramPredecessor`
- `diagramProject`
- `diagramSuccessor`
- `diamond`
- `diamondTurnRight`
- `dice`
- `diceD20`
- `diceD6`
- `diceFive`
- `diceFour`
- `diceOne`
- `diceSix`
- `diceThree`
- `diceTwo`
- `disease`
- `display`
- `divide`
- `dna`
- `dog`
- `dollarSign`
- `dolly`
- `dongSign`
- `doorClosed`
- `doorOpen`
- `dove`
- `downLeftAndUpRightToCenter`
- `downLong`
- `download`
- `dragon`
- `drawPolygon`
- `droplet`
- `dropletSlash`
- `drum`
- `drumSteelpan`
- `drumstickBite`
- `dumbbell`
- `dumpster`
- `dumpsterFire`
- `dungeon`
- `e`
- `earDeaf`
- `earListen`
- `earthAfrica`
- `earthAmericas`
- `earthAsia`
- `earthEurope`
- `earthOceania`
- `egg`
- `eject`
- `elevator`
- `ellipsis`
- `ellipsisVertical`
- `envelope`
- `envelopeCircleCheck`
- `envelopeOpen`
- `envelopeOpenText`
- `envelopesBulk`
- `equals`
- `eraser`
- `ethernet`
- `euroSign`
- `exclamation`
- `expand`
- `explosion`
- `eye`
- `eyeDropper`
- `eyeLowVision`
- `eyeSlash`
- `f`
- `faceAngry`
- `faceDizzy`
- `faceFlushed`
- `faceFrown`
- `faceFrownOpen`
- `faceGrimace`
- `faceGrin`
- `faceGrinBeam`
- `faceGrinBeamSweat`
- `faceGrinHearts`
- `faceGrinSquint`
- `faceGrinSquintTears`
- `faceGrinStars`
- `faceGrinTears`
- `faceGrinTongue`
- `faceGrinTongueSquint`
- `faceGrinTongueWink`
- `faceGrinWide`
- `faceGrinWink`
- `faceKiss`
- `faceKissBeam`
- `faceKissWinkHeart`
- `faceLaugh`
- `faceLaughBeam`
- `faceLaughSquint`
- `faceLaughWink`
- `faceMeh`
- `faceMehBlank`
- `faceRollingEyes`
- `faceSadCry`
- `faceSadTear`
- `faceSmile`
- `faceSmileBeam`
- `faceSmileWink`
- `faceSurprise`
- `faceTired`
- `fan`
- `faucet`
- `faucetDrip`
- `fax`
- `feather`
- `featherPointed`
- `ferry`
- `file`
- `fileArrowDown`
- `fileArrowUp`
- `fileAudio`
- `fileCircleCheck`
- `fileCircleExclamation`
- `fileCircleMinus`
- `fileCirclePlus`
- `fileCircleQuestion`
- `fileCircleXmark`
- `fileCode`
- `fileContract`
- `fileCsv`
- `fileExcel`
- `fileExport`
- `fileFragment`
- `fileHalfDashed`
- `fileImage`
- `fileImport`
- `fileInvoice`
- `fileInvoiceDollar`
- `fileLines`
- `fileMedical`
- `filePdf`
- `filePen`
- `filePowerpoint`
- `filePrescription`
- `fileShield`
- `fileSignature`
- `fileVideo`
- `fileWaveform`
- `fileWord`
- `fileZipper`
- `fill`
- `fillDrip`
- `film`
- `filter`
- `filterCircleDollar`
- `filterCircleXmark`
- `fingerprint`
- `fire`
- `fireBurner`
- `fireExtinguisher`
- `fireFlameCurved`
- `fireFlameSimple`
- `fish`
- `fishFins`
- `flag`
- `flagCheckered`
- `flagUsa`
- `flask`
- `flaskVial`
- `floppyDisk`
- `florinSign`
- `folder`
- `folderClosed`
- `folderMinus`
- `folderOpen`
- `folderPlus`
- `folderTree`
- `font`
- `fontAwesome`
- `football`
- `forward`
- `forwardFast`
- `forwardStep`
- `francSign`
- `frog`
- `futbol`
- `g`
- `gamepad`
- `gasPump`
- `gauge`
- `gaugeHigh`
- `gaugeSimple`
- `gaugeSimpleHigh`
- `gavel`
- `gear`
- `gears`
- `gem`
- `genderless`
- `ghost`
- `gift`
- `gifts`
- `glassWater`
- `glassWaterDroplet`
- `glasses`
- `globe`
- `golfBallTee`
- `gopuram`
- `graduationCap`
- `greaterThan`
- `greaterThanEqual`
- `grip`
- `gripLines`
- `gripLinesVertical`
- `gripVertical`
- `groupArrowsRotate`
- `guaraniSign`
- `guitar`
- `gun`
- `h`
- `hammer`
- `hamsa`
- `hand`
- `handBackFist`
- `handDots`
- `handFist`
- `handHolding`
- `handHoldingDollar`
- `handHoldingDroplet`
- `handHoldingHand`
- `handHoldingHeart`
- `handHoldingMedical`
- `handLizard`
- `handMiddleFinger`
- `handPeace`
- `handPointDown`
- `handPointLeft`
- `handPointRight`
- `handPointUp`
- `handPointer`
- `handScissors`
- `handSparkles`
- `handSpock`
- `handcuffs`
- `hands`
- `handsAslInterpreting`
- `handsBound`
- `handsBubbles`
- `handsClapping`
- `handsHolding`
- `handsHoldingChild`
- `handsHoldingCircle`
- `handsPraying`
- `handshake`
- `handshakeAngle`
- `handshakeSimple`
- `handshakeSimpleSlash`
- `handshakeSlash`
- `hanukiah`
- `hardDrive`
- `hashtag`
- `hatCowboy`
- `hatCowboySide`
- `hatWizard`
- `headSideCough`
- `headSideCoughSlash`
- `headSideMask`
- `headSideVirus`
- `heading`
- `headphones`
- `headphonesSimple`
- `headset`
- `heart`
- `heartCircleBolt`
- `heartCircleCheck`
- `heartCircleExclamation`
- `heartCircleMinus`
- `heartCirclePlus`
- `heartCircleXmark`
- `heartCrack`
- `heartPulse`
- `helicopter`
- `helicopterSymbol`
- `helmetSafety`
- `helmetUn`
- `hexagonNodes`
- `hexagonNodesBolt`
- `highlighter`
- `hillAvalanche`
- `hillRockslide`
- `hippo`
- `hockeyPuck`
- `hollyBerry`
- `horse`
- `horseHead`
- `hospital`
- `hospitalUser`
- `hotTubPerson`
- `hotdog`
- `hotel`
- `hourglass`
- `hourglassEmpty`
- `hourglassEnd`
- `hourglassHalf`
- `hourglassStart`
- `house`
- `houseChimney`
- `houseChimneyCrack`
- `houseChimneyMedical`
- `houseChimneyUser`
- `houseChimneyWindow`
- `houseCircleCheck`
- `houseCircleExclamation`
- `houseCircleXmark`
- `houseCrack`
- `houseFire`
- `houseFlag`
- `houseFloodWater`
- `houseFloodWaterCircleArrowRight`
- `houseLaptop`
- `houseLock`
- `houseMedical`
- `houseMedicalCircleCheck`
- `houseMedicalCircleExclamation`
- `houseMedicalCircleXmark`
- `houseMedicalFlag`
- `houseSignal`
- `houseTsunami`
- `houseUser`
- `hryvniaSign`
- `hurricane`
- `i`
- `iCursor`
- `iceCream`
- `icicles`
- `icons`
- `idBadge`
- `idCard`
- `idCardClip`
- `igloo`
- `image`
- `imagePortrait`
- `images`
- `inbox`
- `indent`
- `indianRupeeSign`
- `industry`
- `infinity`
- `info`
- `italic`
- `j`
- `jar`
- `jarWheat`
- `jedi`
- `jetFighter`
- `jetFighterUp`
- `joint`
- `jugDetergent`
- `k`
- `kaaba`
- `key`
- `keyboard`
- `khanda`
- `kipSign`
- `kitMedical`
- `kitchenSet`
- `kiwiBird`
- `l`
- `landMineOn`
- `landmark`
- `landmarkDome`
- `landmarkFlag`
- `language`
- `laptop`
- `laptopCode`
- `laptopFile`
- `laptopMedical`
- `lariSign`
- `layerGroup`
- `leaf`
- `leftLong`
- `leftRight`
- `lemon`
- `lessThan`
- `lessThanEqual`
- `lifeRing`
- `lightbulb`
- `linesLeaning`
- `link`
- `linkSlash`
- `liraSign`
- `list`
- `listCheck`
- `listOl`
- `listUl`
- `litecoinSign`
- `locationArrow`
- `locationCrosshairs`
- `locationDot`
- `locationPin`
- `locationPinLock`
- `lock`
- `lockOpen`
- `locust`
- `lungs`
- `lungsVirus`
- `m`
- `magnet`
- `magnifyingGlass`
- `magnifyingGlassArrowRight`
- `magnifyingGlassChart`
- `magnifyingGlassDollar`
- `magnifyingGlassLocation`
- `magnifyingGlassMinus`
- `magnifyingGlassPlus`
- `manatSign`
- `map`
- `mapLocation`
- `mapLocationDot`
- `mapPin`
- `marker`
- `mars`
- `marsAndVenus`
- `marsAndVenusBurst`
- `marsDouble`
- `marsStroke`
- `marsStrokeRight`
- `marsStrokeUp`
- `martiniGlass`
- `martiniGlassCitrus`
- `martiniGlassEmpty`
- `mask`
- `maskFace`
- `maskVentilator`
- `masksTheater`
- `mattressPillow`
- `maximize`
- `medal`
- `memory`
- `menorah`
- `mercury`
- `message`
- `meteor`
- `microchip`
- `microphone`
- `microphoneLines`
- `microphoneLinesSlash`
- `microphoneSlash`
- `microscope`
- `millSign`
- `minimize`
- `minus`
- `mitten`
- `mobile`
- `mobileButton`
- `mobileRetro`
- `mobileScreen`
- `mobileScreenButton`
- `moneyBill`
- `moneyBill1`
- `moneyBill1Wave`
- `moneyBillTransfer`
- `moneyBillTrendUp`
- `moneyBillWave`
- `moneyBillWheat`
- `moneyBills`
- `moneyCheck`
- `moneyCheckDollar`
- `monument`
- `moon`
- `mortarPestle`
- `mosque`
- `mosquito`
- `mosquitoNet`
- `motorcycle`
- `mound`
- `mountain`
- `mountainCity`
- `mountainSun`
- `mugHot`
- `mugSaucer`
- `music`
- `n`
- `nairaSign`
- `networkWired`
- `neuter`
- `newspaper`
- `notEqual`
- `notdef`
- `noteSticky`
- `notesMedical`
- `o`
- `objectGroup`
- `objectUngroup`
- `oilCan`
- `oilWell`
- `om`
- `otter`
- `outdent`
- `p`
- `pager`
- `paintRoller`
- `paintbrush`
- `palette`
- `pallet`
- `panorama`
- `paperPlane`
- `paperclip`
- `parachuteBox`
- `paragraph`
- `passport`
- `paste`
- `pause`
- `paw`
- `peace`
- `pen`
- `penClip`
- `penFancy`
- `penNib`
- `penRuler`
- `penToSquare`
- `pencil`
- `peopleArrows`
- `peopleArrowsLeftRight`
- `peopleCarryBox`
- `peopleGroup`
- `peopleLine`
- `peoplePulling`
- `peopleRobbery`
- `peopleRoof`
- `pepperHot`
- `percent`
- `person`
- `personArrowDownToLine`
- `personArrowUpFromLine`
- `personBiking`
- `personBooth`
- `personBreastfeeding`
- `personBurst`
- `personCane`
- `personChalkboard`
- `personCircleCheck`
- `personCircleExclamation`
- `personCircleMinus`
- `personCirclePlus`
- `personCircleQuestion`
- `personCircleXmark`
- `personDigging`
- `personDotsFromLine`
- `personDress`
- `personDressBurst`
- `personDrowning`
- `personFalling`
- `personFallingBurst`
- `personHalfDress`
- `personHarassing`
- `personHiking`
- `personMilitaryPointing`
- `personMilitaryRifle`
- `personMilitaryToPerson`
- `personPraying`
- `personPregnant`
- `personRays`
- `personRifle`
- `personRunning`
- `personShelter`
- `personSkating`
- `personSkiing`
- `personSkiingNordic`
- `personSnowboarding`
- `personSwimming`
- `personThroughWindow`
- `personWalking`
- `personWalkingArrowLoopLeft`
- `personWalkingArrowRight`
- `personWalkingDashedLineArrowRight`
- `personWalkingLuggage`
- `personWalkingWithCane`
- `pesetaSign`
- `pesoSign`
- `phone`
- `phoneFlip`
- `phoneSlash`
- `phoneVolume`
- `photoFilm`
- `piggyBank`
- `pills`
- `pizzaSlice`
- `placeOfWorship`
- `plane`
- `planeArrival`
- `planeCircleCheck`
- `planeCircleExclamation`
- `planeCircleXmark`
- `planeDeparture`
- `planeLock`
- `planeSlash`
- `planeUp`
- `plantWilt`
- `plateWheat`
- `play`
- `plug`
- `plugCircleBolt`
- `plugCircleCheck`
- `plugCircleExclamation`
- `plugCircleMinus`
- `plugCirclePlus`
- `plugCircleXmark`
- `plus`
- `plusMinus`
- `podcast`
- `poo`
- `pooStorm`
- `poop`
- `powerOff`
- `prescription`
- `prescriptionBottle`
- `prescriptionBottleMedical`
- `print`
- `pumpMedical`
- `pumpSoap`
- `puzzlePiece`
- `q`
- `qrcode`
- `question`
- `quoteLeft`
- `quoteRight`
- `r`
- `radiation`
- `radio`
- `rainbow`
- `rankingStar`
- `receipt`
- `recordVinyl`
- `rectangleAd`
- `rectangleList`
- `rectangleXmark`
- `recycle`
- `registered`
- `repeat`
- `reply`
- `replyAll`
- `republican`
- `restroom`
- `retweet`
- `ribbon`
- `rightFromBracket`
- `rightLeft`
- `rightLong`
- `rightToBracket`
- `ring`
- `road`
- `roadBarrier`
- `roadBridge`
- `roadCircleCheck`
- `roadCircleExclamation`
- `roadCircleXmark`
- `roadLock`
- `roadSpikes`
- `robot`
- `rocket`
- `rotate`
- `rotateLeft`
- `rotateRight`
- `route`
- `rss`
- `rubleSign`
- `rug`
- `ruler`
- `rulerCombined`
- `rulerHorizontal`
- `rulerVertical`
- `rupeeSign`
- `rupiahSign`
- `s`
- `sackDollar`
- `sackXmark`
- `sailboat`
- `satellite`
- `satelliteDish`
- `scaleBalanced`
- `scaleUnbalanced`
- `scaleUnbalancedFlip`
- `school`
- `schoolCircleCheck`
- `schoolCircleExclamation`
- `schoolCircleXmark`
- `schoolFlag`
- `schoolLock`
- `scissors`
- `screwdriver`
- `screwdriverWrench`
- `scroll`
- `scrollTorah`
- `sdCard`
- `section`
- `seedling`
- `server`
- `shapes`
- `share`
- `shareFromSquare`
- `shareNodes`
- `sheetPlastic`
- `shekelSign`
- `shield`
- `shieldBlank`
- `shieldCat`
- `shieldDog`
- `shieldHalved`
- `shieldHeart`
- `shieldVirus`
- `ship`
- `shirt`
- `shoePrints`
- `shop`
- `shopLock`
- `shopSlash`
- `shower`
- `shrimp`
- `shuffle`
- `shuttleSpace`
- `signHanging`
- `signal`
- `signature`
- `signsPost`
- `simCard`
- `sink`
- `sitemap`
- `skull`
- `skullCrossbones`
- `slash`
- `sleigh`
- `sliders`
- `smog`
- `smoking`
- `snowflake`
- `snowman`
- `snowplow`
- `soap`
- `socks`
- `solarPanel`
- `sort`
- `sortDown`
- `sortUp`
- `spa`
- `spaghettiMonsterFlying`
- `spellCheck`
- `spider`
- `spinner`
- `splotch`
- `spoon`
- `sprayCan`
- `sprayCanSparkles`
- `square`
- `squareArrowUpRight`
- `squareBinary`
- `squareCaretDown`
- `squareCaretLeft`
- `squareCaretRight`
- `squareCaretUp`
- `squareCheck`
- `squareEnvelope`
- `squareFull`
- `squareH`
- `squareMinus`
- `squareNfi`
- `squareParking`
- `squarePen`
- `squarePersonConfined`
- `squarePhone`
- `squarePhoneFlip`
- `squarePlus`
- `squarePollHorizontal`
- `squarePollVertical`
- `squareRootVariable`
- `squareRss`
- `squareShareNodes`
- `squareUpRight`
- `squareVirus`
- `squareXmark`
- `staffAesculapius`
- `staffSnake`
- `stairs`
- `stamp`
- `stapler`
- `star`
- `starAndCrescent`
- `starHalf`
- `starHalfStroke`
- `starOfDavid`
- `starOfLife`
- `sterlingSign`
- `stethoscope`
- `stop`
- `stopwatch`
- `stopwatch20`
- `store`
- `storeSlash`
- `streetView`
- `strikethrough`
- `stroopwafel`
- `subscript`
- `suitcase`
- `suitcaseMedical`
- `suitcaseRolling`
- `sun`
- `sunPlantWilt`
- `superscript`
- `swatchbook`
- `synagogue`
- `syringe`
- `t`
- `table`
- `tableCells`
- `tableCellsColumnLock`
- `tableCellsLarge`
- `tableCellsRowLock`
- `tableCellsRowUnlock`
- `tableColumns`
- `tableList`
- `tableTennisPaddleBall`
- `tablet`
- `tabletButton`
- `tabletScreenButton`
- `tablets`
- `tachographDigital`
- `tag`
- `tags`
- `tape`
- `tarp`
- `tarpDroplet`
- `taxi`
- `teeth`
- `teethOpen`
- `temperatureArrowDown`
- `temperatureArrowUp`
- `temperatureEmpty`
- `temperatureFull`
- `temperatureHalf`
- `temperatureHigh`
- `temperatureLow`
- `temperatureQuarter`
- `temperatureThreeQuarters`
- `tengeSign`
- `tent`
- `tentArrowDownToLine`
- `tentArrowLeftRight`
- `tentArrowTurnLeft`
- `tentArrowsDown`
- `tents`
- `terminal`
- `textHeight`
- `textSlash`
- `textWidth`
- `thermometer`
- `thumbsDown`
- `thumbsUp`
- `thumbtack`
- `thumbtackSlash`
- `ticket`
- `ticketSimple`
- `timeline`
- `toggleOff`
- `toggleOn`
- `toilet`
- `toiletPaper`
- `toiletPaperSlash`
- `toiletPortable`
- `toiletsPortable`
- `toolbox`
- `tooth`
- `toriiGate`
- `tornado`
- `towerBroadcast`
- `towerCell`
- `towerObservation`
- `tractor`
- `trademark`
- `trafficLight`
- `trailer`
- `train`
- `trainSubway`
- `trainTram`
- `transgender`
- `trash`
- `trashArrowUp`
- `trashCan`
- `trashCanArrowUp`
- `tree`
- `treeCity`
- `triangleExclamation`
- `trophy`
- `trowel`
- `trowelBricks`
- `truck`
- `truckArrowRight`
- `truckDroplet`
- `truckFast`
- `truckField`
- `truckFieldUn`
- `truckFront`
- `truckMedical`
- `truckMonster`
- `truckMoving`
- `truckPickup`
- `truckPlane`
- `truckRampBox`
- `tty`
- `turkishLiraSign`
- `turnDown`
- `turnUp`
- `tv`
- `u`
- `umbrella`
- `umbrellaBeach`
- `underline`
- `universalAccess`
- `unlock`
- `unlockKeyhole`
- `upDown`
- `upDownLeftRight`
- `upLong`
- `upRightAndDownLeftFromCenter`
- `upRightFromSquare`
- `upload`
- `user`
- `userAstronaut`
- `userCheck`
- `userClock`
- `userDoctor`
- `userGear`
- `userGraduate`
- `userGroup`
- `userInjured`
- `userLarge`
- `userLargeSlash`
- `userLock`
- `userMinus`
- `userNinja`
- `userNurse`
- `userPen`
- `userPlus`
- `userSecret`
- `userShield`
- `userSlash`
- `userTag`
- `userTie`
- `userXmark`
- `users`
- `usersBetweenLines`
- `usersGear`
- `usersLine`
- `usersRays`
- `usersRectangle`
- `usersSlash`
- `usersViewfinder`
- `utensils`
- `v`
- `vanShuttle`
- `vault`
- `vectorSquare`
- `venus`
- `venusDouble`
- `venusMars`
- `vest`
- `vestPatches`
- `vial`
- `vialCircleCheck`
- `vialVirus`
- `vials`
- `video`
- `videoSlash`
- `vihara`
- `virus`
- `virusCovid`
- `virusCovidSlash`
- `virusSlash`
- `viruses`
- `voicemail`
- `volcano`
- `volleyball`
- `volumeHigh`
- `volumeLow`
- `volumeOff`
- `volumeXmark`
- `vrCardboard`
- `w`
- `walkieTalkie`
- `wallet`
- `wandMagic`
- `wandMagicSparkles`
- `wandSparkles`
- `warehouse`
- `water`
- `waterLadder`
- `waveSquare`
- `webAwesome`
- `weightHanging`
- `weightScale`
- `wheatAwn`
- `wheatAwnCircleExclamation`
- `wheelchair`
- `wheelchairMove`
- `whiskeyGlass`
- `wifi`
- `wind`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`
- `wineBottle`
- `wineGlass`
- `wineGlassEmpty`
- `wonSign`
- `worm`
- `wrench`
- `x`
- `xRay`
- `xmark`
- `xmarksLines`
- `y`
- `yenSign`
- `yinYang`
- `z`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><0Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><1Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><2Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3Icon size="20" class="nav-icon" /> Settings</a>
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
<0Icon
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
    <0Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <1Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <2Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <0Icon size="24" />
   <1Icon size="24" color="#4a90e2" />
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
   <0Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <0Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <0Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 0 } from '@stacksjs/iconify-fa6-solid'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(0, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0 } from '@stacksjs/iconify-fa6-solid'

// Icons are typed as IconData
const myIcon: IconData = 0
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa6-solid/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa6-solid/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
