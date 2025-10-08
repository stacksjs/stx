# Font Awesome Solid

> Font Awesome Solid icons for stx from Iconify

## Overview

This package provides access to 1983 icons from the Font Awesome Solid collection through the stx iconify integration.

**Collection ID:** `fa7-solid`
**Total Icons:** 1983
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa7-solid
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
import { 0, 1, 2 } from '@stacksjs/iconify-fa7-solid'
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
.fa7Solid-icon {
  width: 1em;
  height: 1em;
}
```

```html
<0Icon class="fa7Solid-icon" />
```

## Available Icons

This package contains **1983** icons:

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
- `ad`
- `add`
- `addressBook`
- `addressCard`
- `adjust`
- `airFreshener`
- `alarmClock`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `allergies`
- `ambulance`
- `americanSignLanguageInterpreting`
- `anchor`
- `anchorCircleCheck`
- `anchorCircleExclamation`
- `anchorCircleXmark`
- `anchorLock`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `anglesDown`
- `anglesLeft`
- `anglesRight`
- `anglesUp`
- `angry`
- `ankh`
- `appleAlt`
- `appleWhole`
- `archive`
- `archway`
- `areaChart`
- `arrowAltCircleDown`
- `arrowAltCircleLeft`
- `arrowAltCircleRight`
- `arrowAltCircleUp`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
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
- `arrowLeftRotate`
- `arrowPointer`
- `arrowRight`
- `arrowRightArrowLeft`
- `arrowRightFromBracket`
- `arrowRightFromFile`
- `arrowRightLong`
- `arrowRightRotate`
- `arrowRightToBracket`
- `arrowRightToCity`
- `arrowRightToFile`
- `arrowRotateBack`
- `arrowRotateBackward`
- `arrowRotateForward`
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
- `arrows`
- `arrowsAlt`
- `arrowsAltH`
- `arrowsAltV`
- `arrowsDownToLine`
- `arrowsDownToPeople`
- `arrowsH`
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
- `arrowsV`
- `aslInterpreting`
- `assistiveListeningSystems`
- `asterisk`
- `at`
- `atlas`
- `atom`
- `audioDescription`
- `australSign`
- `automobile`
- `award`
- `b`
- `baby`
- `babyCarriage`
- `backspace`
- `backward`
- `backwardFast`
- `backwardStep`
- `bacon`
- `bacteria`
- `bacterium`
- `bagShopping`
- `bahai`
- `bahtSign`
- `balanceScale`
- `balanceScaleLeft`
- `balanceScaleRight`
- `ban`
- `banSmoking`
- `bandAid`
- `bandage`
- `bangladeshiTakaSign`
- `bank`
- `barChart`
- `barcode`
- `bars`
- `barsProgress`
- `barsStaggered`
- `baseball`
- `baseballBall`
- `baseballBatBall`
- `basketShopping`
- `basketball`
- `basketballBall`
- `bath`
- `bathtub`
- `battery`
- `battery0`
- `battery2`
- `battery3`
- `battery4`
- `battery5`
- `batteryCar`
- `batteryEmpty`
- `batteryFull`
- `batteryHalf`
- `batteryQuarter`
- `batteryThreeQuarters`
- `bed`
- `bedPulse`
- `beer`
- `beerMugEmpty`
- `bell`
- `bellConcierge`
- `bellSlash`
- `bezierCurve`
- `bible`
- `bicycle`
- `biking`
- `binoculars`
- `biohazard`
- `birthdayCake`
- `bitcoinSign`
- `blackboard`
- `blender`
- `blenderPhone`
- `blind`
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
- `bookDead`
- `bookJournalWhills`
- `bookMedical`
- `bookOpen`
- `bookOpenReader`
- `bookQuran`
- `bookReader`
- `bookSkull`
- `bookTanakh`
- `bookmark`
- `borderAll`
- `borderNone`
- `borderStyle`
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
- `boxes`
- `boxesAlt`
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
- `briefcaseClock`
- `briefcaseMedical`
- `broadcastTower`
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
- `burn`
- `burst`
- `bus`
- `busAlt`
- `busSide`
- `busSimple`
- `businessTime`
- `c`
- `cab`
- `cableCar`
- `cake`
- `cakeCandles`
- `calculator`
- `calendar`
- `calendarAlt`
- `calendarCheck`
- `calendarDay`
- `calendarDays`
- `calendarMinus`
- `calendarPlus`
- `calendarTimes`
- `calendarWeek`
- `calendarXmark`
- `camera`
- `cameraAlt`
- `cameraRetro`
- `cameraRotate`
- `campground`
- `cancel`
- `candyCane`
- `cannabis`
- `capsules`
- `car`
- `carAlt`
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
- `caretSquareDown`
- `caretSquareLeft`
- `caretSquareRight`
- `caretSquareUp`
- `caretUp`
- `carriageBaby`
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
- `chain`
- `chainBroken`
- `chainSlash`
- `chair`
- `chalkboard`
- `chalkboardTeacher`
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
- `checkCircle`
- `checkDouble`
- `checkSquare`
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
- `chevronCircleDown`
- `chevronCircleLeft`
- `chevronCircleRight`
- `chevronCircleUp`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `child`
- `childCombatant`
- `childDress`
- `childReaching`
- `childRifle`
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
- `clinicMedical`
- `clipboard`
- `clipboardCheck`
- `clipboardList`
- `clipboardQuestion`
- `clipboardUser`
- `clock`
- `clockFour`
- `clockRotateLeft`
- `clone`
- `close`
- `closedCaptioning`
- `cloud`
- `cloudArrowDown`
- `cloudArrowUp`
- `cloudBolt`
- `cloudDownload`
- `cloudDownloadAlt`
- `cloudMeatball`
- `cloudMoon`
- `cloudMoonRain`
- `cloudRain`
- `cloudShowersHeavy`
- `cloudShowersWater`
- `cloudSun`
- `cloudSunRain`
- `cloudUpload`
- `cloudUploadAlt`
- `clover`
- `cny`
- `cocktail`
- `code`
- `codeBranch`
- `codeCommit`
- `codeCompare`
- `codeFork`
- `codeMerge`
- `codePullRequest`
- `coffee`
- `cog`
- `cogs`
- `coins`
- `colonSign`
- `columns`
- `comment`
- `commentAlt`
- `commentDollar`
- `commentDots`
- `commentMedical`
- `commentNodes`
- `commentSlash`
- `commentSms`
- `commenting`
- `comments`
- `commentsDollar`
- `compactDisc`
- `compass`
- `compassDrafting`
- `compress`
- `compressAlt`
- `compressArrowsAlt`
- `computer`
- `computerMouse`
- `conciergeBell`
- `contactBook`
- `contactCard`
- `cookie`
- `cookieBite`
- `copy`
- `copyright`
- `couch`
- `cow`
- `creditCard`
- `creditCardAlt`
- `crop`
- `cropAlt`
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
- `cut`
- `cutlery`
- `d`
- `dashboard`
- `database`
- `deaf`
- `deafness`
- `dedent`
- `deleteLeft`
- `democrat`
- `desktop`
- `desktopAlt`
- `dharmachakra`
- `diagnoses`
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
- `digging`
- `digitalTachograph`
- `directions`
- `disease`
- `display`
- `divide`
- `dizzy`
- `dna`
- `dog`
- `dollar`
- `dollarSign`
- `dolly`
- `dollyBox`
- `dollyFlatbed`
- `donate`
- `dongSign`
- `doorClosed`
- `doorOpen`
- `dotCircle`
- `dove`
- `downLeftAndUpRightToCenter`
- `downLong`
- `download`
- `draftingCompass`
- `dragon`
- `drawPolygon`
- `driversLicense`
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
- `earth`
- `earthAfrica`
- `earthAmerica`
- `earthAmericas`
- `earthAsia`
- `earthEurope`
- `earthOceania`
- `edit`
- `egg`
- `eject`
- `elevator`
- `ellipsis`
- `ellipsisH`
- `ellipsisV`
- `ellipsisVertical`
- `envelope`
- `envelopeCircleCheck`
- `envelopeOpen`
- `envelopeOpenText`
- `envelopeSquare`
- `envelopesBulk`
- `equals`
- `eraser`
- `ethernet`
- `eur`
- `euro`
- `euroSign`
- `exchange`
- `exchangeAlt`
- `exclamation`
- `exclamationCircle`
- `exclamationTriangle`
- `expand`
- `expandAlt`
- `expandArrowsAlt`
- `explosion`
- `externalLink`
- `externalLinkAlt`
- `externalLinkSquare`
- `externalLinkSquareAlt`
- `eye`
- `eyeDropper`
- `eyeDropperEmpty`
- `eyeLowVision`
- `eyeSlash`
- `eyedropper`
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
- `fastBackward`
- `fastForward`
- `faucet`
- `faucetDrip`
- `fax`
- `feather`
- `featherAlt`
- `featherPointed`
- `feed`
- `female`
- `ferry`
- `fighterJet`
- `file`
- `fileAlt`
- `fileArchive`
- `fileArrowDown`
- `fileArrowUp`
- `fileAudio`
- `fileCircleCheck`
- `fileCircleExclamation`
- `fileCircleMinus`
- `fileCirclePlus`
- `fileCircleQuestion`
- `fileCircleXmark`
- `fileClipboard`
- `fileCode`
- `fileContract`
- `fileCsv`
- `fileDownload`
- `fileEdit`
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
- `fileMedicalAlt`
- `filePdf`
- `filePen`
- `filePowerpoint`
- `filePrescription`
- `fileShield`
- `fileSignature`
- `fileText`
- `fileUpload`
- `fileVideo`
- `fileWaveform`
- `fileWord`
- `fileZipper`
- `fill`
- `fillDrip`
- `film`
- `filmAlt`
- `filmSimple`
- `filter`
- `filterCircleDollar`
- `filterCircleXmark`
- `fingerprint`
- `fire`
- `fireAlt`
- `fireBurner`
- `fireExtinguisher`
- `fireFlameCurved`
- `fireFlameSimple`
- `firstAid`
- `fish`
- `fishFins`
- `fistRaised`
- `flag`
- `flagCheckered`
- `flagUsa`
- `flask`
- `flaskVial`
- `floppyDisk`
- `florinSign`
- `flushed`
- `folder`
- `folderBlank`
- `folderClosed`
- `folderMinus`
- `folderOpen`
- `folderPlus`
- `folderTree`
- `font`
- `fontAwesome`
- `fontAwesomeFlag`
- `football`
- `footballBall`
- `forward`
- `forwardFast`
- `forwardStep`
- `francSign`
- `frog`
- `frown`
- `frownOpen`
- `funnelDollar`
- `futbol`
- `futbolBall`
- `g`
- `gamepad`
- `gasPump`
- `gauge`
- `gaugeHigh`
- `gaugeMed`
- `gaugeSimple`
- `gaugeSimpleHigh`
- `gaugeSimpleMed`
- `gavel`
- `gbp`
- `gear`
- `gears`
- `gem`
- `genderless`
- `ghost`
- `gift`
- `gifts`
- `glassCheers`
- `glassMartini`
- `glassMartiniAlt`
- `glassWater`
- `glassWaterDroplet`
- `glassWhiskey`
- `glasses`
- `globe`
- `globeAfrica`
- `globeAmericas`
- `globeAsia`
- `globeEurope`
- `globeOceania`
- `golfBall`
- `golfBallTee`
- `gopuram`
- `graduationCap`
- `greaterThan`
- `greaterThanEqual`
- `gridHorizontal`
- `gridVertical`
- `grimace`
- `grin`
- `grinAlt`
- `grinBeam`
- `grinBeamSweat`
- `grinHearts`
- `grinSquint`
- `grinSquintTears`
- `grinStars`
- `grinTears`
- `grinTongue`
- `grinTongueSquint`
- `grinTongueWink`
- `grinWink`
- `grip`
- `gripHorizontal`
- `gripLines`
- `gripLinesVertical`
- `gripVertical`
- `groupArrowsRotate`
- `guaraniSign`
- `guitar`
- `gun`
- `h`
- `hSquare`
- `hamburger`
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
- `handHoldingUsd`
- `handHoldingWater`
- `handLizard`
- `handMiddleFinger`
- `handPaper`
- `handPeace`
- `handPointDown`
- `handPointLeft`
- `handPointRight`
- `handPointUp`
- `handPointer`
- `handRock`
- `handScissors`
- `handSparkles`
- `handSpock`
- `handcuffs`
- `hands`
- `handsAmericanSignLanguageInterpreting`
- `handsAslInterpreting`
- `handsBound`
- `handsBubbles`
- `handsClapping`
- `handsHelping`
- `handsHolding`
- `handsHoldingChild`
- `handsHoldingCircle`
- `handsPraying`
- `handsWash`
- `handshake`
- `handshakeAlt`
- `handshakeAltSlash`
- `handshakeAngle`
- `handshakeSimple`
- `handshakeSimpleSlash`
- `handshakeSlash`
- `hanukiah`
- `hardDrive`
- `hardHat`
- `hardOfHearing`
- `hashtag`
- `hatCowboy`
- `hatCowboySide`
- `hatHard`
- `hatWizard`
- `haykal`
- `hdd`
- `headSideCough`
- `headSideCoughSlash`
- `headSideMask`
- `headSideVirus`
- `header`
- `heading`
- `headphones`
- `headphonesAlt`
- `headphonesSimple`
- `headset`
- `heart`
- `heartBroken`
- `heartCircleBolt`
- `heartCircleCheck`
- `heartCircleExclamation`
- `heartCircleMinus`
- `heartCirclePlus`
- `heartCircleXmark`
- `heartCrack`
- `heartMusicCameraBolt`
- `heartPulse`
- `heartbeat`
- `helicopter`
- `helicopterSymbol`
- `helmetSafety`
- `helmetUn`
- `heptagon`
- `hexagon`
- `hexagonNodes`
- `hexagonNodesBolt`
- `highlighter`
- `hiking`
- `hillAvalanche`
- `hillRockslide`
- `hippo`
- `history`
- `hockeyPuck`
- `hollyBerry`
- `home`
- `homeAlt`
- `homeLg`
- `homeLgAlt`
- `homeUser`
- `horse`
- `horseHead`
- `hospital`
- `hospitalAlt`
- `hospitalSymbol`
- `hospitalUser`
- `hospitalWide`
- `hotTub`
- `hotTubPerson`
- `hotdog`
- `hotel`
- `hourglass`
- `hourglass1`
- `hourglass2`
- `hourglass3`
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
- `houseDamage`
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
- `hryvnia`
- `hryvniaSign`
- `hurricane`
- `i`
- `iCursor`
- `iceCream`
- `icicles`
- `icons`
- `idBadge`
- `idCard`
- `idCardAlt`
- `idCardClip`
- `igloo`
- `ils`
- `image`
- `imagePortrait`
- `images`
- `inbox`
- `indent`
- `indianRupee`
- `indianRupeeSign`
- `industry`
- `infinity`
- `info`
- `infoCircle`
- `inr`
- `institution`
- `italic`
- `j`
- `jar`
- `jarWheat`
- `jedi`
- `jetFighter`
- `jetFighterUp`
- `joint`
- `journalWhills`
- `jpy`
- `jugDetergent`
- `k`
- `kaaba`
- `key`
- `keyboard`
- `khanda`
- `kipSign`
- `kiss`
- `kissBeam`
- `kissWinkHeart`
- `kitMedical`
- `kitchenSet`
- `kiwiBird`
- `krw`
- `l`
- `ladderWater`
- `landMineOn`
- `landmark`
- `landmarkAlt`
- `landmarkDome`
- `landmarkFlag`
- `language`
- `laptop`
- `laptopCode`
- `laptopFile`
- `laptopHouse`
- `laptopMedical`
- `lariSign`
- `laugh`
- `laughBeam`
- `laughSquint`
- `laughWink`
- `layerGroup`
- `leaf`
- `leftLong`
- `leftRight`
- `legal`
- `lemon`
- `lessThan`
- `lessThanEqual`
- `levelDown`
- `levelDownAlt`
- `levelUp`
- `levelUpAlt`
- `lifeRing`
- `lightbulb`
- `lineChart`
- `linesLeaning`
- `link`
- `linkSlash`
- `liraSign`
- `list`
- `list12`
- `listAlt`
- `listCheck`
- `listDots`
- `listNumeric`
- `listOl`
- `listSquares`
- `listUl`
- `litecoinSign`
- `location`
- `locationArrow`
- `locationCrosshairs`
- `locationDot`
- `locationPin`
- `locationPinLock`
- `lock`
- `lockOpen`
- `locust`
- `longArrowAltDown`
- `longArrowAltLeft`
- `longArrowAltRight`
- `longArrowAltUp`
- `longArrowDown`
- `longArrowLeft`
- `longArrowRight`
- `longArrowUp`
- `lowVision`
- `luggageCart`
- `lungs`
- `lungsVirus`
- `m`
- `magic`
- `magicWandSparkles`
- `magnet`
- `magnifyingGlass`
- `magnifyingGlassArrowRight`
- `magnifyingGlassChart`
- `magnifyingGlassDollar`
- `magnifyingGlassLocation`
- `magnifyingGlassMinus`
- `magnifyingGlassPlus`
- `mailBulk`
- `mailForward`
- `mailReply`
- `mailReplyAll`
- `male`
- `manatSign`
- `map`
- `mapLocation`
- `mapLocationDot`
- `mapMarked`
- `mapMarkedAlt`
- `mapMarker`
- `mapMarkerAlt`
- `mapPin`
- `mapSigns`
- `marker`
- `mars`
- `marsAndVenus`
- `marsAndVenusBurst`
- `marsDouble`
- `marsStroke`
- `marsStrokeH`
- `marsStrokeRight`
- `marsStrokeUp`
- `marsStrokeV`
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
- `medkit`
- `meh`
- `mehBlank`
- `mehRollingEyes`
- `memory`
- `menorah`
- `mercury`
- `message`
- `meteor`
- `microchip`
- `microphone`
- `microphoneAlt`
- `microphoneAltSlash`
- `microphoneLines`
- `microphoneLinesSlash`
- `microphoneSlash`
- `microscope`
- `millSign`
- `minimize`
- `minus`
- `minusCircle`
- `minusSquare`
- `mitten`
- `mobile`
- `mobileAlt`
- `mobileAndroid`
- `mobileAndroidAlt`
- `mobileButton`
- `mobilePhone`
- `mobileRetro`
- `mobileScreen`
- `mobileScreenButton`
- `mobileVibrate`
- `moneyBill`
- `moneyBill1`
- `moneyBill1Wave`
- `moneyBillAlt`
- `moneyBillTransfer`
- `moneyBillTrendUp`
- `moneyBillWave`
- `moneyBillWaveAlt`
- `moneyBillWheat`
- `moneyBills`
- `moneyCheck`
- `moneyCheckAlt`
- `moneyCheckDollar`
- `monument`
- `moon`
- `mortarBoard`
- `mortarPestle`
- `mosque`
- `mosquito`
- `mosquitoNet`
- `motorcycle`
- `mound`
- `mountain`
- `mountainCity`
- `mountainSun`
- `mouse`
- `mousePointer`
- `mugHot`
- `mugSaucer`
- `multiply`
- `museum`
- `music`
- `n`
- `nairaSign`
- `navicon`
- `networkWired`
- `neuter`
- `newspaper`
- `nonBinary`
- `notEqual`
- `notdef`
- `noteSticky`
- `notesMedical`
- `o`
- `objectGroup`
- `objectUngroup`
- `octagon`
- `oilCan`
- `oilWell`
- `om`
- `otter`
- `outdent`
- `p`
- `pager`
- `paintBrush`
- `paintRoller`
- `paintbrush`
- `palette`
- `pallet`
- `panorama`
- `paperPlane`
- `paperclip`
- `parachuteBox`
- `paragraph`
- `parking`
- `passport`
- `pastafarianism`
- `paste`
- `pause`
- `pauseCircle`
- `paw`
- `peace`
- `pen`
- `penAlt`
- `penClip`
- `penFancy`
- `penNib`
- `penRuler`
- `penSquare`
- `penToSquare`
- `pencil`
- `pencilAlt`
- `pencilRuler`
- `pencilSquare`
- `pentagon`
- `peopleArrows`
- `peopleArrowsLeftRight`
- `peopleCarry`
- `peopleCarryBox`
- `peopleGroup`
- `peopleLine`
- `peoplePulling`
- `peopleRobbery`
- `peopleRoof`
- `pepperHot`
- `percent`
- `percentage`
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
- `phoneAlt`
- `phoneFlip`
- `phoneSlash`
- `phoneSquare`
- `phoneSquareAlt`
- `phoneVolume`
- `photoFilm`
- `photoVideo`
- `pieChart`
- `piggyBank`
- `pills`
- `pingPongPaddleBall`
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
- `playCircle`
- `plug`
- `plugCircleBolt`
- `plugCircleCheck`
- `plugCircleExclamation`
- `plugCircleMinus`
- `plugCirclePlus`
- `plugCircleXmark`
- `plus`
- `plusCircle`
- `plusMinus`
- `plusSquare`
- `podcast`
- `poll`
- `pollH`
- `poo`
- `pooBolt`
- `pooStorm`
- `poop`
- `portrait`
- `poundSign`
- `powerOff`
- `pray`
- `prayingHands`
- `prescription`
- `prescriptionBottle`
- `prescriptionBottleAlt`
- `prescriptionBottleMedical`
- `print`
- `procedures`
- `projectDiagram`
- `pumpMedical`
- `pumpSoap`
- `puzzlePiece`
- `q`
- `qrcode`
- `question`
- `questionCircle`
- `quidditch`
- `quidditchBroomBall`
- `quoteLeft`
- `quoteLeftAlt`
- `quoteRight`
- `quoteRightAlt`
- `quran`
- `r`
- `radiation`
- `radiationAlt`
- `radio`
- `rainbow`
- `random`
- `rankingStar`
- `receipt`
- `recordVinyl`
- `rectangleAd`
- `rectangleList`
- `rectangleTimes`
- `rectangleXmark`
- `recycle`
- `redo`
- `redoAlt`
- `refresh`
- `registered`
- `remove`
- `removeFormat`
- `reorder`
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
- `rmb`
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
- `rodAsclepius`
- `rodSnake`
- `rotate`
- `rotateBack`
- `rotateBackward`
- `rotateForward`
- `rotateLeft`
- `rotateRight`
- `rouble`
- `route`
- `rss`
- `rssSquare`
- `rub`
- `ruble`
- `rubleSign`
- `rug`
- `ruler`
- `rulerCombined`
- `rulerHorizontal`
- `rulerVertical`
- `running`
- `rupee`
- `rupeeSign`
- `rupiahSign`
- `s`
- `sackDollar`
- `sackXmark`
- `sadCry`
- `sadTear`
- `sailboat`
- `satellite`
- `satelliteDish`
- `save`
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
- `search`
- `searchDollar`
- `searchLocation`
- `searchMinus`
- `searchPlus`
- `section`
- `seedling`
- `septagon`
- `server`
- `shapes`
- `share`
- `shareAlt`
- `shareAltSquare`
- `shareFromSquare`
- `shareNodes`
- `shareSquare`
- `sheetPlastic`
- `shekel`
- `shekelSign`
- `sheqel`
- `sheqelSign`
- `shield`
- `shieldAlt`
- `shieldBlank`
- `shieldCat`
- `shieldDog`
- `shieldHalved`
- `shieldHeart`
- `shieldVirus`
- `ship`
- `shippingFast`
- `shirt`
- `shoePrints`
- `shop`
- `shopLock`
- `shopSlash`
- `shoppingBag`
- `shoppingBasket`
- `shoppingCart`
- `shower`
- `shrimp`
- `shuffle`
- `shuttleSpace`
- `shuttleVan`
- `sign`
- `signHanging`
- `signIn`
- `signInAlt`
- `signLanguage`
- `signOut`
- `signOutAlt`
- `signal`
- `signal5`
- `signalPerfect`
- `signature`
- `signing`
- `signsPost`
- `simCard`
- `singleQuoteLeft`
- `singleQuoteRight`
- `sink`
- `sitemap`
- `skating`
- `skiing`
- `skiingNordic`
- `skull`
- `skullCrossbones`
- `slash`
- `sleigh`
- `sliders`
- `slidersH`
- `smile`
- `smileBeam`
- `smileWink`
- `smog`
- `smoking`
- `smokingBan`
- `sms`
- `snowboarding`
- `snowflake`
- `snowman`
- `snowplow`
- `soap`
- `soccerBall`
- `socks`
- `solarPanel`
- `sort`
- `sortAlphaAsc`
- `sortAlphaDesc`
- `sortAlphaDown`
- `sortAlphaDownAlt`
- `sortAlphaUp`
- `sortAlphaUpAlt`
- `sortAmountAsc`
- `sortAmountDesc`
- `sortAmountDown`
- `sortAmountDownAlt`
- `sortAmountUp`
- `sortAmountUpAlt`
- `sortAsc`
- `sortDesc`
- `sortDown`
- `sortNumericAsc`
- `sortNumericDesc`
- `sortNumericDown`
- `sortNumericDownAlt`
- `sortNumericUp`
- `sortNumericUpAlt`
- `sortUp`
- `spa`
- `spaceShuttle`
- `spaghettiMonsterFlying`
- `spellCheck`
- `spider`
- `spinner`
- `spiral`
- `splotch`
- `spoon`
- `sprayCan`
- `sprayCanSparkles`
- `sprout`
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
- `squareRootAlt`
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
- `starHalfAlt`
- `starHalfStroke`
- `starOfDavid`
- `starOfLife`
- `stepBackward`
- `stepForward`
- `sterlingSign`
- `stethoscope`
- `stickyNote`
- `stop`
- `stopCircle`
- `stopwatch`
- `stopwatch20`
- `store`
- `storeAlt`
- `storeAltSlash`
- `storeSlash`
- `stream`
- `streetView`
- `strikethrough`
- `stroopwafel`
- `subscript`
- `subtract`
- `subway`
- `suitcase`
- `suitcaseMedical`
- `suitcaseRolling`
- `sun`
- `sunPlantWilt`
- `superscript`
- `surprise`
- `swatchbook`
- `swimmer`
- `swimmingPool`
- `synagogue`
- `sync`
- `syncAlt`
- `syringe`
- `t`
- `tShirt`
- `table`
- `tableCells`
- `tableCellsColumnLock`
- `tableCellsLarge`
- `tableCellsRowLock`
- `tableCellsRowUnlock`
- `tableColumns`
- `tableList`
- `tableTennis`
- `tableTennisPaddleBall`
- `tablet`
- `tabletAlt`
- `tabletAndroid`
- `tabletButton`
- `tabletScreenButton`
- `tablets`
- `tachographDigital`
- `tachometer`
- `tachometerAlt`
- `tachometerAltAverage`
- `tachometerAltFast`
- `tachometerAverage`
- `tachometerFast`
- `tag`
- `tags`
- `tanakh`
- `tape`
- `tarp`
- `tarpDroplet`
- `tasks`
- `tasksAlt`
- `taxi`
- `teeth`
- `teethOpen`
- `teletype`
- `television`
- `temperature0`
- `temperature1`
- `temperature2`
- `temperature3`
- `temperature4`
- `temperatureArrowDown`
- `temperatureArrowUp`
- `temperatureDown`
- `temperatureEmpty`
- `temperatureFull`
- `temperatureHalf`
- `temperatureHigh`
- `temperatureLow`
- `temperatureQuarter`
- `temperatureThreeQuarters`
- `temperatureUp`
- `tenge`
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
- `th`
- `thLarge`
- `thList`
- `theaterMasks`
- `thermometer`
- `thermometer0`
- `thermometer1`
- `thermometer2`
- `thermometer3`
- `thermometer4`
- `thermometerEmpty`
- `thermometerFull`
- `thermometerHalf`
- `thermometerQuarter`
- `thermometerThreeQuarters`
- `thumbTack`
- `thumbTackSlash`
- `thumbsDown`
- `thumbsUp`
- `thumbtack`
- `thumbtackSlash`
- `thunderstorm`
- `ticket`
- `ticketAlt`
- `ticketSimple`
- `timeline`
- `times`
- `timesCircle`
- `timesRectangle`
- `timesSquare`
- `tint`
- `tintSlash`
- `tired`
- `toggleOff`
- `toggleOn`
- `toilet`
- `toiletPaper`
- `toiletPaperAlt`
- `toiletPaperBlank`
- `toiletPaperSlash`
- `toiletPortable`
- `toiletsPortable`
- `toolbox`
- `tools`
- `tooth`
- `torah`
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
- `tram`
- `transgender`
- `transgenderAlt`
- `trash`
- `trashAlt`
- `trashArrowUp`
- `trashCan`
- `trashCanArrowUp`
- `trashRestore`
- `trashRestoreAlt`
- `tree`
- `treeCity`
- `triangleCircleSquare`
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
- `truckLoading`
- `truckMedical`
- `truckMonster`
- `truckMoving`
- `truckPickup`
- `truckPlane`
- `truckRampBox`
- `try`
- `tshirt`
- `tty`
- `turkishLira`
- `turkishLiraSign`
- `turnDown`
- `turnUp`
- `tv`
- `tvAlt`
- `u`
- `umbrella`
- `umbrellaBeach`
- `underline`
- `undo`
- `undoAlt`
- `universalAccess`
- `university`
- `unlink`
- `unlock`
- `unlockAlt`
- `unlockKeyhole`
- `unsorted`
- `upDown`
- `upDownLeftRight`
- `upLong`
- `upRightAndDownLeftFromCenter`
- `upRightFromSquare`
- `upload`
- `usd`
- `user`
- `userAlt`
- `userAltSlash`
- `userAstronaut`
- `userCheck`
- `userCircle`
- `userClock`
- `userCog`
- `userDoctor`
- `userEdit`
- `userFriends`
- `userGear`
- `userGraduate`
- `userGroup`
- `userInjured`
- `userLarge`
- `userLargeSlash`
- `userLock`
- `userMd`
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
- `userTimes`
- `userXmark`
- `users`
- `usersBetweenLines`
- `usersCog`
- `usersGear`
- `usersLine`
- `usersRays`
- `usersRectangle`
- `usersSlash`
- `usersViewfinder`
- `utensilSpoon`
- `utensils`
- `v`
- `vanShuttle`
- `vault`
- `vcard`
- `vectorPolygon`
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
- `videoCamera`
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
- `volleyballBall`
- `volumeControlPhone`
- `volumeDown`
- `volumeHigh`
- `volumeLow`
- `volumeMute`
- `volumeOff`
- `volumeTimes`
- `volumeUp`
- `volumeXmark`
- `voteYea`
- `vrCardboard`
- `w`
- `walkieTalkie`
- `walking`
- `wallet`
- `wandMagic`
- `wandMagicSparkles`
- `wandSparkles`
- `warehouse`
- `warning`
- `water`
- `waterLadder`
- `waveSquare`
- `webAwesome`
- `weight`
- `weightHanging`
- `weightScale`
- `wheatAlt`
- `wheatAwn`
- `wheatAwnCircleExclamation`
- `wheelchair`
- `wheelchairAlt`
- `wheelchairMove`
- `whiskeyGlass`
- `wifi`
- `wifi3`
- `wifiStrong`
- `wind`
- `windowClose`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`
- `wineBottle`
- `wineGlass`
- `wineGlassAlt`
- `wineGlassEmpty`
- `won`
- `wonSign`
- `worm`
- `wrench`
- `x`
- `xRay`
- `xmark`
- `xmarkCircle`
- `xmarkSquare`
- `xmarksLines`
- `y`
- `yen`
- `yenSign`
- `yinYang`
- `z`
- `zap`

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
     import { 0 } from '@stacksjs/iconify-fa7-solid'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(0, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0 } from '@stacksjs/iconify-fa7-solid'

// Icons are typed as IconData
const myIcon: IconData = 0
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa7-solid/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa7-solid/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
