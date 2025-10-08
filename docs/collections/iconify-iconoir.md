# Iconoir

> Iconoir icons for stx from Iconify

## Overview

This package provides access to 1682 icons from the Iconoir collection through the stx iconify integration.

**Collection ID:** `iconoir`
**Total Icons:** 1682
**Author:** Luca Burgio ([Website](https://github.com/iconoir-icons/iconoir))
**License:** MIT ([Details](https://github.com/iconoir-icons/iconoir/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-iconoir
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />

<!-- Using width and height -->
<AccessibilityIcon width="24" height="32" />

<!-- With color -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccessibilityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccessibilityIcon
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
    <AccessibilityIcon size="24" />
    <AccessibilitySignIcon size="24" color="#4a90e2" />
    <AccessibilityTechIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accessibility, accessibilitySign, accessibilityTech } from '@stacksjs/iconify-iconoir'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility, { size: 24 })
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
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccessibilityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccessibilityIcon size="24" class="text-primary" />
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
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.iconoir-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccessibilityIcon class="iconoir-icon" />
```

## Available Icons

This package contains **1682** icons:

- `accessibility`
- `accessibilitySign`
- `accessibilityTech`
- `activity`
- `adobeAfterEffects`
- `adobeAfterEffectsSolid`
- `adobeIllustrator`
- `adobeIllustratorSolid`
- `adobeIndesign`
- `adobeIndesignSolid`
- `adobeLightroom`
- `adobeLightroomSolid`
- `adobePhotoshop`
- `adobePhotoshopSolid`
- `adobeXd`
- `adobeXdSolid`
- `africanTree`
- `agile`
- `airConditioner`
- `airplane`
- `airplaneHelix`
- `airplaneHelix45deg`
- `airplaneOff`
- `airplaneRotation`
- `airplay`
- `airplaySolid`
- `alarm`
- `alarmSolid`
- `album`
- `albumCarousel`
- `albumList`
- `albumOpen`
- `alignBottomBox`
- `alignBottomBoxSolid`
- `alignCenter`
- `alignHorizontalCenters`
- `alignHorizontalCentersSolid`
- `alignHorizontalSpacing`
- `alignHorizontalSpacingSolid`
- `alignJustify`
- `alignLeft`
- `alignLeftBox`
- `alignLeftBoxSolid`
- `alignRight`
- `alignRightBox`
- `alignRightBoxSolid`
- `alignTopBox`
- `alignTopBoxSolid`
- `alignVerticalCenters`
- `alignVerticalCentersSolid`
- `alignVerticalSpacing`
- `alignVerticalSpacingSolid`
- `angleTool`
- `antenna`
- `antennaOff`
- `antennaSignal`
- `antennaSignalTag`
- `appNotification`
- `appNotificationSolid`
- `appStore`
- `appStoreSolid`
- `appWindow`
- `apple`
- `appleHalf`
- `appleHalfAlt`
- `appleImac2021`
- `appleImac2021Side`
- `appleMac`
- `appleShortcuts`
- `appleShortcutsSolid`
- `appleSwift`
- `appleWallet`
- `arTag`
- `arc3d`
- `arc3dCenterPoint`
- `arcade`
- `archery`
- `archeryMatch`
- `archive`
- `areaSearch`
- `arrowArchery`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownCircleSolid`
- `arrowDownLeft`
- `arrowDownLeftCircle`
- `arrowDownLeftCircleSolid`
- `arrowDownLeftSquare`
- `arrowDownLeftSquareSolid`
- `arrowDownRight`
- `arrowDownRightCircle`
- `arrowDownRightCircleSolid`
- `arrowDownRightSquare`
- `arrowDownRightSquareSolid`
- `arrowDownTag`
- `arrowEmailForward`
- `arrowEnlargeTag`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftCircleSolid`
- `arrowLeftTag`
- `arrowLeftTagSolid`
- `arrowReduceTag`
- `arrowRight`
- `arrowRightCircle`
- `arrowRightCircleSolid`
- `arrowRightTag`
- `arrowRightTagSolid`
- `arrowSeparate`
- `arrowSeparateVertical`
- `arrowUnion`
- `arrowUnionVertical`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpCircleSolid`
- `arrowUpLeft`
- `arrowUpLeftCircle`
- `arrowUpLeftCircleSolid`
- `arrowUpLeftSquare`
- `arrowUpLeftSquareSolid`
- `arrowUpRight`
- `arrowUpRightCircle`
- `arrowUpRightCircleSolid`
- `arrowUpRightSquare`
- `arrowUpRightSquareSolid`
- `arrowUpTag`
- `arrowsUpFromLine`
- `asana`
- `asterisk`
- `atSign`
- `atSignCircle`
- `atom`
- `attachment`
- `augmentedReality`
- `autoFlash`
- `aviFormat`
- `axes`
- `backward15Seconds`
- `badgeCheck`
- `bag`
- `balcony`
- `bank`
- `barcode`
- `basketball`
- `basketballField`
- `bathroom`
- `bathroomSolid`
- `battery25`
- `battery50`
- `battery75`
- `batteryCharging`
- `batteryEmpty`
- `batteryFull`
- `batteryIndicator`
- `batterySlash`
- `batteryWarning`
- `bbq`
- `beachBag`
- `beachBagBig`
- `bed`
- `bedReady`
- `behance`
- `behanceTag`
- `bell`
- `bellNotification`
- `bellNotificationSolid`
- `bellOff`
- `bicycle`
- `bin`
- `binFull`
- `binHalf`
- `binMinusIn`
- `binPlusIn`
- `binocular`
- `birthdayCake`
- `bishop`
- `bitbucket`
- `bitcoinCircle`
- `bitcoinCircleSolid`
- `bitcoinRotateOut`
- `bluetooth`
- `bluetoothTag`
- `bluetoothTagSolid`
- `bold`
- `boldSquare`
- `boldSquareSolid`
- `bonfire`
- `book`
- `bookLock`
- `bookSolid`
- `bookStack`
- `bookmark`
- `bookmarkBook`
- `bookmarkCircle`
- `bookmarkCircleSolid`
- `bookmarkSolid`
- `borderBl`
- `borderBottom`
- `borderBr`
- `borderInner`
- `borderLeft`
- `borderOut`
- `borderRight`
- `borderTl`
- `borderTop`
- `borderTr`
- `bounceLeft`
- `bounceRight`
- `bowlingBall`
- `box`
- `box3dCenter`
- `box3dPoint`
- `box3dThreePoints`
- `boxIso`
- `boxingGlove`
- `brain`
- `brainElectricity`
- `brainResearch`
- `brainWarning`
- `breadSlice`
- `bridge3d`
- `bridgeSurface`
- `brightCrown`
- `brightStar`
- `brightness`
- `brightnessWindow`
- `bubbleDownload`
- `bubbleIncome`
- `bubbleOutcome`
- `bubbleSearch`
- `bubbleSearchSolid`
- `bubbleStar`
- `bubbleUpload`
- `bubbleWarning`
- `bubbleXmark`
- `bubbleXmarkSolid`
- `bug`
- `bugSolid`
- `building`
- `bus`
- `busGreen`
- `busStop`
- `cSquare`
- `cableTag`
- `cableTagSolid`
- `calculator`
- `calendar`
- `calendarArrowDown`
- `calendarArrowDownSolid`
- `calendarArrowUp`
- `calendarArrowUpSolid`
- `calendarCheck`
- `calendarCheckSolid`
- `calendarMinus`
- `calendarMinusSolid`
- `calendarPlus`
- `calendarPlusSolid`
- `calendarRotate`
- `calendarRotateSolid`
- `calendarXmark`
- `calendarXmarkSolid`
- `camera`
- `cameraSolid`
- `candlestickChart`
- `car`
- `cardLock`
- `cardNoAccess`
- `cardReader`
- `cardShield`
- `cardWallet`
- `cart`
- `cartAlt`
- `cartMinus`
- `cartPlus`
- `cash`
- `cashSolid`
- `cell2x2`
- `cellar`
- `centerAlign`
- `centerAlignSolid`
- `chatBubble`
- `chatBubbleCheck`
- `chatBubbleCheckSolid`
- `chatBubbleEmpty`
- `chatBubbleEmptySolid`
- `chatBubbleQuestion`
- `chatBubbleQuestionSolid`
- `chatBubbleSolid`
- `chatBubbleTranslate`
- `chatBubbleTranslateSolid`
- `chatBubbleWarning`
- `chatBubbleWarningSolid`
- `chatBubbleXmark`
- `chatBubbleXmarkSolid`
- `chatLines`
- `chatLinesSolid`
- `chatMinusIn`
- `chatMinusInSolid`
- `chatPlusIn`
- `chatPlusInSolid`
- `check`
- `checkCircle`
- `checkCircleSolid`
- `checkSquare`
- `checkSquareSolid`
- `chocolate`
- `chromecast`
- `chromecastActive`
- `church`
- `churchSide`
- `cigaretteSlash`
- `cinemaOld`
- `circle`
- `circleSpark`
- `city`
- `clipboardCheck`
- `clock`
- `clockRotateRight`
- `clockSolid`
- `closedCaptionsTag`
- `closedCaptionsTagSolid`
- `closet`
- `cloud`
- `cloudBookmark`
- `cloudCheck`
- `cloudDesync`
- `cloudDownload`
- `cloudSquare`
- `cloudSquareSolid`
- `cloudSunny`
- `cloudSync`
- `cloudUpload`
- `cloudXmark`
- `code`
- `codeBrackets`
- `codeBracketsSquare`
- `codepen`
- `coffeeCup`
- `coinSlash`
- `coins`
- `coinsSwap`
- `collageFrame`
- `collapse`
- `colorFilter`
- `colorPicker`
- `colorPickerEmpty`
- `colorWheel`
- `combine`
- `commodity`
- `community`
- `compAlignBottom`
- `compAlignBottomSolid`
- `compAlignLeft`
- `compAlignLeftSolid`
- `compAlignRight`
- `compAlignRightSolid`
- `compAlignTop`
- `compAlignTopSolid`
- `compactDisc`
- `compass`
- `compassSolid`
- `component`
- `componentSolid`
- `compress`
- `compressLines`
- `computer`
- `constrainedSurface`
- `consumable`
- `contactless`
- `controlSlider`
- `cookie`
- `coolingSquare`
- `coolingSquareSolid`
- `copy`
- `copyright`
- `cornerBottomLeft`
- `cornerBottomRight`
- `cornerTopLeft`
- `cornerTopRight`
- `cpu`
- `cpuWarning`
- `crackedEgg`
- `creativeCommons`
- `creditCard`
- `creditCard2`
- `creditCardSlash`
- `creditCardSolid`
- `creditCards`
- `crib`
- `crop`
- `cropRotateBl`
- `cropRotateBr`
- `cropRotateTl`
- `cropRotateTr`
- `crown`
- `crownCircle`
- `css3`
- `cube`
- `cubeBandage`
- `cubeCutWithCurve`
- `cubeDots`
- `cubeDotsSolid`
- `cubeHole`
- `cubeReplaceFace`
- `cubeScan`
- `cubeScanSolid`
- `cursorPointer`
- `curveArray`
- `cut`
- `cutAlt`
- `cutlery`
- `cycling`
- `cylinder`
- `dashFlag`
- `dashboard`
- `dashboardDots`
- `dashboardSpeed`
- `dataTransferBoth`
- `dataTransferCheck`
- `dataTransferDown`
- `dataTransferUp`
- `dataTransferWarning`
- `database`
- `databaseBackup`
- `databaseCheck`
- `databaseCheckSolid`
- `databaseExport`
- `databaseMonitor`
- `databaseRestore`
- `databaseScript`
- `databaseScriptMinus`
- `databaseScriptPlus`
- `databaseSearch`
- `databaseSettings`
- `databaseSolid`
- `databaseStar`
- `databaseStats`
- `databaseTag`
- `databaseTagSolid`
- `databaseWarning`
- `databaseXmark`
- `databaseXmarkSolid`
- `dbStar`
- `deCompress`
- `delivery`
- `deliveryTruck`
- `depth`
- `designNib`
- `designNibSolid`
- `designPencil`
- `desk`
- `developer`
- `dewPoint`
- `dialpad`
- `diameter`
- `diameterSolid`
- `diceFive`
- `diceFour`
- `diceOne`
- `diceSix`
- `diceThree`
- `diceTwo`
- `dimmerSwitch`
- `directorChair`
- `discord`
- `dishwasher`
- `display4k`
- `divide`
- `divideSolid`
- `divideThree`
- `divideThreeSolid`
- `dna`
- `dns`
- `docMagnifyingGlass`
- `docMagnifyingGlassIn`
- `docStar`
- `docStarIn`
- `dogecoinCircle`
- `dogecoinCircleSolid`
- `dogecoinRotateOut`
- `dollar`
- `dollarCircle`
- `dollarCircleSolid`
- `domoticWarning`
- `donate`
- `dotArrowDown`
- `dotArrowLeft`
- `dotArrowRight`
- `dotArrowUp`
- `dotsGrid3x3`
- `dotsGrid3x3Solid`
- `doubleCheck`
- `download`
- `downloadCircle`
- `downloadCircleSolid`
- `downloadDataWindow`
- `downloadSquare`
- `downloadSquareSolid`
- `drag`
- `dragHandGesture`
- `dragSolid`
- `drawer`
- `dribbble`
- `drone`
- `droneChargeFull`
- `droneChargeHalf`
- `droneChargeLow`
- `droneCheck`
- `droneLanding`
- `droneRefresh`
- `droneTakeOff`
- `droneXmark`
- `droplet`
- `dropletCheck`
- `dropletHalf`
- `dropletSnowFlakeIn`
- `dropletSnowFlakeInSolid`
- `dropletSolid`
- `easeCurveControlPoints`
- `easeIn`
- `easeInControlPoint`
- `easeInOut`
- `easeOut`
- `easeOutControlPoint`
- `ecologyBook`
- `edit`
- `editPencil`
- `egg`
- `eject`
- `electronicsChip`
- `electronicsTransistor`
- `elevator`
- `ellipse3d`
- `ellipse3dThreePoints`
- `emoji`
- `emojiBall`
- `emojiBlinkLeft`
- `emojiBlinkRight`
- `emojiLookDown`
- `emojiLookLeft`
- `emojiLookRight`
- `emojiLookUp`
- `emojiPuzzled`
- `emojiQuite`
- `emojiReally`
- `emojiSad`
- `emojiSatisfied`
- `emojiSingLeft`
- `emojiSingLeftNote`
- `emojiSingRight`
- `emojiSingRightNote`
- `emojiSurprise`
- `emojiSurpriseAlt`
- `emojiTalkingAngry`
- `emojiTalkingHappy`
- `emojiThinkLeft`
- `emojiThinkRight`
- `emptyPage`
- `energyUsageWindow`
- `enlarge`
- `erase`
- `eraseSolid`
- `ethereumCircle`
- `ethereumCircleSolid`
- `ethereumRotateOut`
- `euro`
- `euroSquare`
- `euroSquareSolid`
- `evCharge`
- `evChargeAlt`
- `evPlug`
- `evPlugCharging`
- `evPlugXmark`
- `evStation`
- `evTag`
- `exclude`
- `expand`
- `expandLines`
- `extrude`
- `eye`
- `eyeClosed`
- `eyeEmpty`
- `eyeOff`
- `eyeSolid`
- `fSquare`
- `face3dDraft`
- `faceId`
- `facebook`
- `facebookTag`
- `facetime`
- `facetimeSolid`
- `farm`
- `fastArrowDown`
- `fastArrowDownSquare`
- `fastArrowDownSquareSolid`
- `fastArrowLeft`
- `fastArrowLeftSquare`
- `fastArrowLeftSquareSolid`
- `fastArrowRight`
- `fastArrowRightSquare`
- `fastArrowRightSquareSolid`
- `fastArrowUp`
- `fastArrowUpSquare`
- `fastArrowUpSquareSolid`
- `fastDownCircle`
- `fastLeftCircle`
- `fastRightCircle`
- `fastUpCircle`
- `favouriteBook`
- `favouriteWindow`
- `female`
- `figma`
- `fileNotFound`
- `fillColor`
- `fillColorSolid`
- `fillet3d`
- `filter`
- `filterAlt`
- `filterList`
- `filterListCircle`
- `filterListCircleSolid`
- `filterSolid`
- `finder`
- `fingerprint`
- `fingerprintCheckCircle`
- `fingerprintCircle`
- `fingerprintLockCircle`
- `fingerprintScan`
- `fingerprintSquare`
- `fingerprintWindow`
- `fingerprintXmarkCircle`
- `fireFlame`
- `fish`
- `fishing`
- `flare`
- `flash`
- `flashOff`
- `flashSolid`
- `flask`
- `flaskSolid`
- `flip`
- `flipReverse`
- `floppyDisk`
- `floppyDiskArrowIn`
- `floppyDiskArrowOut`
- `flower`
- `fog`
- `folder`
- `folderMinus`
- `folderPlus`
- `folderSettings`
- `folderWarning`
- `fontQuestion`
- `football`
- `footballBall`
- `forward`
- `forward15Seconds`
- `forwardMessage`
- `forwardSolid`
- `frame`
- `frameAlt`
- `frameAltEmpty`
- `frameMinusIn`
- `framePlusIn`
- `frameSelect`
- `frameSimple`
- `frameTool`
- `frameToolSolid`
- `fridge`
- `fx`
- `fxTag`
- `fxTagSolid`
- `gamepad`
- `garage`
- `gas`
- `gasTank`
- `gasTankDroplet`
- `gifFormat`
- `gift`
- `git`
- `gitBranch`
- `gitCherryPickCommit`
- `gitCommit`
- `gitCompare`
- `gitFork`
- `gitMerge`
- `gitPullRequest`
- `gitPullRequestClosed`
- `gitSolid`
- `github`
- `githubCircle`
- `gitlabFull`
- `glassEmpty`
- `glassFragile`
- `glassHalf`
- `glassHalfAlt`
- `glasses`
- `globe`
- `golf`
- `google`
- `googleCircle`
- `googleCircleSolid`
- `googleDocs`
- `googleDrive`
- `googleDriveCheck`
- `googleDriveSync`
- `googleDriveWarning`
- `googleHome`
- `googleOne`
- `gps`
- `graduationCap`
- `graduationCapSolid`
- `graphDown`
- `graphUp`
- `gridMinus`
- `gridPlus`
- `gridXmark`
- `group`
- `gym`
- `hSquare`
- `halfCookie`
- `halfMoon`
- `hammer`
- `handBrake`
- `handCard`
- `handCash`
- `handContactless`
- `handbag`
- `hardDrive`
- `hashtag`
- `hat`
- `hd`
- `hdDisplay`
- `hdDisplaySolid`
- `hdr`
- `headset`
- `headsetBolt`
- `headsetBoltSolid`
- `headsetHelp`
- `headsetSolid`
- `headsetWarning`
- `headsetWarningSolid`
- `healthShield`
- `healthcare`
- `heart`
- `heartArrowDown`
- `heartSolid`
- `heatingSquare`
- `heatingSquareSolid`
- `heavyRain`
- `helpCircle`
- `helpCircleSolid`
- `helpSquare`
- `helpSquareSolid`
- `heptagon`
- `hexagon`
- `hexagonAlt`
- `hexagonDice`
- `hexagonPlus`
- `historicShield`
- `historicShieldAlt`
- `home`
- `homeAlt`
- `homeAltSlim`
- `homeAltSlimHoriz`
- `homeHospital`
- `homeSale`
- `homeSecure`
- `homeShield`
- `homeSimple`
- `homeSimpleDoor`
- `homeTable`
- `homeTemperatureIn`
- `homeTemperatureOut`
- `homeUser`
- `horizDistributionLeft`
- `horizDistributionLeftSolid`
- `horizDistributionRight`
- `horizDistributionRightSolid`
- `horizontalMerge`
- `horizontalSplit`
- `hospital`
- `hospitalCircle`
- `hospitalCircleSolid`
- `hotAirBalloon`
- `hourglass`
- `houseRooms`
- `html5`
- `iceCream`
- `iceCreamSolid`
- `iconoir`
- `import`
- `inclination`
- `industry`
- `infinite`
- `infoCircle`
- `infoCircleSolid`
- `inputField`
- `inputOutput`
- `inputSearch`
- `instagram`
- `internet`
- `intersect`
- `intersectAlt`
- `iosSettings`
- `ipAddressTag`
- `irisScan`
- `italic`
- `italicSquare`
- `italicSquareSolid`
- `jellyfish`
- `journal`
- `journalPage`
- `jpegFormat`
- `jpgFormat`
- `kanbanBoard`
- `key`
- `keyBack`
- `keyCommand`
- `keyMinus`
- `keyPlus`
- `keyXmark`
- `keyframe`
- `keyframeAlignCenter`
- `keyframeAlignCenterSolid`
- `keyframeAlignHorizontal`
- `keyframeAlignHorizontalSolid`
- `keyframeAlignVertical`
- `keyframeAlignVerticalSolid`
- `keyframeMinus`
- `keyframeMinusIn`
- `keyframeMinusInSolid`
- `keyframeMinusSolid`
- `keyframePlus`
- `keyframePlusIn`
- `keyframePlusInSolid`
- `keyframePlusSolid`
- `keyframePosition`
- `keyframePositionSolid`
- `keyframeSolid`
- `keyframes`
- `keyframesCouple`
- `keyframesCoupleSolid`
- `keyframesMinus`
- `keyframesPlus`
- `keyframesSolid`
- `label`
- `labelSolid`
- `lamp`
- `language`
- `laptop`
- `laptopCharging`
- `laptopDevMode`
- `laptopFix`
- `laptopWarning`
- `layoutLeft`
- `layoutRight`
- `leaderboard`
- `leaderboardStar`
- `leaf`
- `learning`
- `lens`
- `lensPlus`
- `lifebelt`
- `lightBulb`
- `lightBulbOff`
- `lightBulbOn`
- `lineSpace`
- `linear`
- `link`
- `linkSlash`
- `linkXmark`
- `linkedin`
- `linux`
- `list`
- `listSelect`
- `litecoinCircle`
- `litecoinCircleSolid`
- `litecoinRotateOut`
- `lock`
- `lockSlash`
- `lockSquare`
- `loft3d`
- `logIn`
- `logNoAccess`
- `logOut`
- `longArrowDownLeft`
- `longArrowDownLeftSolid`
- `longArrowDownRight`
- `longArrowDownRightSolid`
- `longArrowLeftDown`
- `longArrowLeftDownSolid`
- `longArrowLeftUp`
- `longArrowLeftUpSolid`
- `longArrowRightDown`
- `longArrowRightDownSolid`
- `longArrowRightUp`
- `longArrowRightUp1`
- `longArrowRightUpSolid`
- `longArrowUpLeft`
- `longArrowUpLeftSolid`
- `longArrowUpRight`
- `longArrowUpRightSolid`
- `lotOfCash`
- `lullaby`
- `macControlKey`
- `macDock`
- `macOptionKey`
- `macOsWindow`
- `magicWand`
- `magnet`
- `magnetEnergy`
- `magnetSolid`
- `mail`
- `mailIn`
- `mailInSolid`
- `mailOpen`
- `mailOpenSolid`
- `mailOut`
- `mailOutSolid`
- `mailSolid`
- `male`
- `map`
- `mapPin`
- `mapPinMinus`
- `mapPinPlus`
- `mapPinXmark`
- `mapXmark`
- `mapsArrow`
- `mapsArrowDiagonal`
- `mapsArrowXmark`
- `mapsGoStraight`
- `mapsTurnBack`
- `mapsTurnLeft`
- `mapsTurnRight`
- `maskSquare`
- `mastercardCard`
- `mastodon`
- `mathBook`
- `maximize`
- `medal`
- `medal1st`
- `medal1stSolid`
- `medalSolid`
- `mediaImage`
- `mediaImageFolder`
- `mediaImageList`
- `mediaImagePlus`
- `mediaImageXmark`
- `mediaVideo`
- `mediaVideoFolder`
- `mediaVideoList`
- `mediaVideoPlus`
- `mediaVideoXmark`
- `medium`
- `megaphone`
- `menu`
- `menuScale`
- `message`
- `messageAlert`
- `messageAlertSolid`
- `messageSolid`
- `messageText`
- `messageTextSolid`
- `meterArrowDownRight`
- `metro`
- `microphone`
- `microphoneCheck`
- `microphoneCheckSolid`
- `microphoneMinus`
- `microphoneMinusSolid`
- `microphoneMute`
- `microphoneMuteSolid`
- `microphonePlus`
- `microphonePlusSolid`
- `microphoneSolid`
- `microphoneSpeaking`
- `microphoneSpeakingSolid`
- `microphoneWarning`
- `microphoneWarningSolid`
- `microscope`
- `microscopeSolid`
- `minus`
- `minusCircle`
- `minusCircleSolid`
- `minusHexagon`
- `minusSquare`
- `minusSquareDashed`
- `minusSquareSolid`
- `mirror`
- `mobileDevMode`
- `mobileFingerprint`
- `mobileVoice`
- `modernTv`
- `modernTv4k`
- `moneySquare`
- `moneySquareSolid`
- `moonSat`
- `moreHoriz`
- `moreHorizCircle`
- `moreVert`
- `moreVertCircle`
- `motorcycle`
- `mouseButtonLeft`
- `mouseButtonRight`
- `mouseScrollWheel`
- `movie`
- `mpegFormat`
- `multiBubble`
- `multiBubbleSolid`
- `multiMacOsWindow`
- `multiWindow`
- `multiplePages`
- `multiplePagesEmpty`
- `multiplePagesMinus`
- `multiplePagesPlus`
- `multiplePagesXmark`
- `musicDoubleNote`
- `musicDoubleNotePlus`
- `musicNote`
- `musicNotePlus`
- `musicNotePlusSolid`
- `musicNoteSolid`
- `nSquare`
- `navArrowDown`
- `navArrowDownSolid`
- `navArrowLeft`
- `navArrowLeftSolid`
- `navArrowRight`
- `navArrowRightSolid`
- `navArrowUp`
- `navArrowUpSolid`
- `navigator`
- `navigatorAlt`
- `neighbourhood`
- `network`
- `networkLeft`
- `networkLeftSolid`
- `networkReverse`
- `networkReverseSolid`
- `networkRight`
- `networkRightSolid`
- `networkSolid`
- `newTab`
- `nintendoSwitch`
- `noSmokingCircle`
- `nonBinary`
- `notes`
- `npm`
- `npmSquare`
- `number0Square`
- `number0SquareSolid`
- `number1Square`
- `number1SquareSolid`
- `number2Square`
- `number2SquareSolid`
- `number3Square`
- `number3SquareSolid`
- `number4Square`
- `number4SquareSolid`
- `number5Square`
- `number5SquareSolid`
- `number6Square`
- `number6SquareSolid`
- `number7Square`
- `number7SquareSolid`
- `number8Square`
- `number8SquareSolid`
- `number9Square`
- `number9SquareSolid`
- `numberedListLeft`
- `numberedListRight`
- `oSquare`
- `octagon`
- `offTag`
- `oilIndustry`
- `okrs`
- `onTag`
- `oneFingerSelectHandGesture`
- `onePointCircle`
- `openBook`
- `openInBrowser`
- `openInWindow`
- `openNewWindow`
- `openSelectHandGesture`
- `openVpn`
- `orangeHalf`
- `orangeSlice`
- `orangeSliceAlt`
- `organicFood`
- `organicFoodSquare`
- `orthogonalView`
- `package`
- `packageLock`
- `packages`
- `pacman`
- `page`
- `pageDown`
- `pageDownSolid`
- `pageEdit`
- `pageFlip`
- `pageLeft`
- `pageLeftSolid`
- `pageMinus`
- `pageMinusIn`
- `pagePlus`
- `pagePlusIn`
- `pageRight`
- `pageRightSolid`
- `pageSearch`
- `pageStar`
- `pageUp`
- `pageUpSolid`
- `palette`
- `panoramaEnlarge`
- `panoramaReduce`
- `pants`
- `pantsPockets`
- `parking`
- `passwordCheck`
- `passwordCursor`
- `passwordXmark`
- `pasteClipboard`
- `pathArrow`
- `pathArrowSolid`
- `pause`
- `pauseSolid`
- `pauseWindow`
- `paypal`
- `pcCheck`
- `pcFirewall`
- `pcMouse`
- `pcNoEntry`
- `pcWarning`
- `peaceHand`
- `peerlist`
- `peerlistSolid`
- `penConnectBluetooth`
- `penConnectWifi`
- `penTablet`
- `penTabletConnectUsb`
- `penTabletConnectWifi`
- `pentagon`
- `peopleTag`
- `percentRotateOut`
- `percentage`
- `percentageCircle`
- `percentageCircleSolid`
- `percentageSquare`
- `percentageSquareSolid`
- `perspectiveView`
- `pharmacyCrossCircle`
- `pharmacyCrossTag`
- `phone`
- `phoneDisabled`
- `phoneIncome`
- `phoneIncomeSolid`
- `phoneMinus`
- `phoneMinusSolid`
- `phoneOutcome`
- `phoneOutcomeSolid`
- `phonePaused`
- `phonePausedSolid`
- `phonePlus`
- `phonePlusSolid`
- `phoneSolid`
- `phoneXmark`
- `phoneXmarkSolid`
- `piggyBank`
- `pillow`
- `pin`
- `pinSlash`
- `pinSlashSolid`
- `pinSolid`
- `pineTree`
- `pinterest`
- `pipe3d`
- `pizzaSlice`
- `planet`
- `planetAlt`
- `planetSat`
- `planetSolid`
- `planimetry`
- `play`
- `playSolid`
- `playlist`
- `playlistPlay`
- `playlistPlus`
- `playstationGamepad`
- `plugTypeA`
- `plugTypeC`
- `plugTypeG`
- `plugTypeL`
- `plus`
- `plusCircle`
- `plusCircleSolid`
- `plusSquare`
- `plusSquareDashed`
- `plusSquareSolid`
- `pngFormat`
- `pocket`
- `pocketSolid`
- `podcast`
- `podcastSolid`
- `pokeball`
- `polarSh`
- `position`
- `positionAlign`
- `post`
- `postSolid`
- `potion`
- `pound`
- `precisionTool`
- `presentation`
- `presentationSolid`
- `printer`
- `printingPage`
- `priorityDown`
- `priorityDownSolid`
- `priorityHigh`
- `priorityHighSolid`
- `priorityMedium`
- `priorityMediumSolid`
- `priorityUp`
- `priorityUpSolid`
- `privacyPolicy`
- `privateWifi`
- `profileCircle`
- `prohibition`
- `projectCurve3d`
- `puzzle`
- `qrCode`
- `questionMark`
- `quote`
- `quoteMessage`
- `quoteMessageSolid`
- `quoteSolid`
- `radiation`
- `radiationSolid`
- `radius`
- `radiusSolid`
- `rain`
- `rawFormat`
- `receiveDollars`
- `receiveEuros`
- `receivePounds`
- `receiveYens`
- `redo`
- `redoAction`
- `redoCircle`
- `redoCircleSolid`
- `reduce`
- `refresh`
- `refreshCircle`
- `refreshCircleSolid`
- `refreshDouble`
- `reloadWindow`
- `reminderHandGesture`
- `repeat`
- `repeatOnce`
- `reply`
- `replyToMessage`
- `reportColumns`
- `reports`
- `reportsSolid`
- `repository`
- `restart`
- `rewind`
- `rewindSolid`
- `rhombus`
- `rhombusArrowRight`
- `rhombusArrowRightSolid`
- `rings`
- `rocket`
- `rook`
- `rotateCameraLeft`
- `rotateCameraRight`
- `roundFlask`
- `roundFlaskSolid`
- `roundedMirror`
- `rssFeed`
- `rssFeedTag`
- `rssFeedTagSolid`
- `rubikCube`
- `ruler`
- `rulerArrows`
- `rulerCombine`
- `rulerMinus`
- `rulerPlus`
- `running`
- `safari`
- `safe`
- `safeArrowLeft`
- `safeArrowRight`
- `safeOpen`
- `sandals`
- `scaleFrameEnlarge`
- `scaleFrameReduce`
- `scanBarcode`
- `scanQrCode`
- `scanning`
- `scarf`
- `scissor`
- `scissorAlt`
- `screenshot`
- `seaAndSun`
- `seaWaves`
- `search`
- `searchEngine`
- `searchWindow`
- `secureWindow`
- `securityPass`
- `selectEdge3d`
- `selectFace3d`
- `selectPoint3d`
- `selectWindow`
- `selectiveTool`
- `send`
- `sendDiagonal`
- `sendDiagonalSolid`
- `sendDollars`
- `sendEuros`
- `sendMail`
- `sendMailSolid`
- `sendPounds`
- `sendSolid`
- `sendYens`
- `server`
- `serverConnection`
- `serverConnectionSolid`
- `serverSolid`
- `settings`
- `settingsProfiles`
- `shareAndroid`
- `shareAndroidSolid`
- `shareIos`
- `shield`
- `shieldAlert`
- `shieldAlt`
- `shieldBroken`
- `shieldCheck`
- `shieldDownload`
- `shieldEye`
- `shieldLoading`
- `shieldMinus`
- `shieldPlusIn`
- `shieldQuestion`
- `shieldSearch`
- `shieldUpload`
- `shieldXmark`
- `shirt`
- `shirtTankTop`
- `shop`
- `shopFourTiles`
- `shopFourTilesWindow`
- `shopWindow`
- `shoppingBag`
- `shoppingBagArrowDown`
- `shoppingBagArrowUp`
- `shoppingBagCheck`
- `shoppingBagMinus`
- `shoppingBagPlus`
- `shoppingBagPocket`
- `shoppingBagWarning`
- `shoppingCode`
- `shoppingCodeCheck`
- `shoppingCodeXmark`
- `shortPants`
- `shortPantsPockets`
- `shortcutSquare`
- `shortcutSquareSolid`
- `shuffle`
- `sidebarCollapse`
- `sidebarExpand`
- `sigmaFunction`
- `simpleCart`
- `sineWave`
- `singleTapGesture`
- `skateboard`
- `skateboarding`
- `skipNext`
- `skipNextSolid`
- `skipPrev`
- `skipPrevSolid`
- `slash`
- `slashSquare`
- `sleeperChair`
- `slips`
- `smallLamp`
- `smallLampAlt`
- `smartphoneDevice`
- `smoking`
- `snapchat`
- `snapchatSolid`
- `snow`
- `snowFlake`
- `soap`
- `soccerBall`
- `sofa`
- `soil`
- `soilAlt`
- `sort`
- `sortDown`
- `sortUp`
- `soundHigh`
- `soundHighSolid`
- `soundLow`
- `soundLowSolid`
- `soundMin`
- `soundMinSolid`
- `soundOff`
- `soundOffSolid`
- `spades`
- `spark`
- `sparkSolid`
- `sparks`
- `sparksSolid`
- `sphere`
- `spiral`
- `splitArea`
- `splitSquareDashed`
- `spockHandGesture`
- `spotify`
- `square`
- `square3dCornerToCorner`
- `square3dFromCenter`
- `square3dThreePoints`
- `squareCursor`
- `squareCursorSolid`
- `squareDashed`
- `squareWave`
- `stackoverflow`
- `star`
- `starDashed`
- `starHalfDashed`
- `starSolid`
- `statDown`
- `statUp`
- `statsDownSquare`
- `statsDownSquareSolid`
- `statsReport`
- `statsUpSquare`
- `statsUpSquareSolid`
- `strategy`
- `stretching`
- `strikethrough`
- `stroller`
- `styleBorder`
- `styleBorderSolid`
- `submitDocument`
- `substract`
- `suggestion`
- `suitcase`
- `sunLight`
- `svgFormat`
- `sweep3d`
- `swimming`
- `swipeDownGesture`
- `swipeLeftGesture`
- `swipeRightGesture`
- `swipeTwoFingersDownGesture`
- `swipeTwoFingersLeftGesture`
- `swipeTwoFingersRightGesture`
- `swipeTwoFingersUpGesture`
- `swipeUpGesture`
- `switchOff`
- `switchOn`
- `systemRestart`
- `systemShut`
- `table`
- `table2Columns`
- `tableRows`
- `taskList`
- `telegram`
- `telegramCircle`
- `temperatureDown`
- `temperatureHigh`
- `temperatureLow`
- `temperatureUp`
- `tennisBall`
- `tennisBallAlt`
- `terminal`
- `terminalTag`
- `testTube`
- `testTubeSolid`
- `text`
- `textArrowsUpDown`
- `textBox`
- `textMagnifyingGlass`
- `textSize`
- `textSquare`
- `textSquareSolid`
- `threads`
- `threePointsCircle`
- `threeStars`
- `threeStarsSolid`
- `thumbsDown`
- `thumbsUp`
- `thunderstorm`
- `tifFormat`
- `tiffFormat`
- `tiktok`
- `tiktokSolid`
- `timeZone`
- `timer`
- `timerOff`
- `timerSolid`
- `tools`
- `tournament`
- `tower`
- `towerCheck`
- `towerNoAccess`
- `towerWarning`
- `trademark`
- `train`
- `tram`
- `transitionDown`
- `transitionDownSolid`
- `transitionLeft`
- `transitionLeftSolid`
- `transitionRight`
- `transitionRightSolid`
- `transitionUp`
- `transitionUpSolid`
- `translate`
- `trash`
- `trashSolid`
- `treadmill`
- `tree`
- `trekking`
- `trello`
- `triangle`
- `triangleFlag`
- `triangleFlagCircle`
- `triangleFlagTwoStripes`
- `trophy`
- `truck`
- `truckGreen`
- `truckLength`
- `tunnel`
- `tv`
- `tvFix`
- `tvWarning`
- `twitter`
- `twoPointsCircle`
- `twoSeaterSofa`
- `type`
- `uTurnArrowLeft`
- `uTurnArrowRight`
- `umbrella`
- `underline`
- `underlineSquare`
- `underlineSquareSolid`
- `undo`
- `undoAction`
- `undoCircle`
- `undoCircleSolid`
- `union`
- `unionAlt`
- `unionHorizAlt`
- `unity`
- `unity5`
- `unjoin3d`
- `upload`
- `uploadDataWindow`
- `uploadSquare`
- `uploadSquareSolid`
- `usb`
- `usbSolid`
- `user`
- `userBadgeCheck`
- `userBag`
- `userCart`
- `userCircle`
- `userCrown`
- `userLove`
- `userPlus`
- `userScan`
- `userSquare`
- `userStar`
- `userXmark`
- `vegan`
- `veganCircle`
- `veganSquare`
- `vehicleGreen`
- `verifiedBadge`
- `verticalMerge`
- `verticalSplit`
- `vials`
- `vialsSolid`
- `videoCamera`
- `videoCameraOff`
- `videoProjector`
- `view360`
- `viewColumns2`
- `viewColumns3`
- `viewGrid`
- `viewStructureDown`
- `viewStructureUp`
- `voice`
- `voiceCheck`
- `voiceCircle`
- `voiceLockCircle`
- `voiceScan`
- `voiceSquare`
- `voiceXmark`
- `vrTag`
- `vueJs`
- `waist`
- `walking`
- `wallet`
- `walletSolid`
- `warningCircle`
- `warningCircleSolid`
- `warningHexagon`
- `warningSquare`
- `warningSquareSolid`
- `warningTriangle`
- `warningTriangleSolid`
- `warningWindow`
- `wash`
- `washingMachine`
- `wateringSoil`
- `webWindow`
- `webWindowEnergyConsumption`
- `webWindowEnergyConsumptionSolid`
- `webWindowSolid`
- `webWindowXmark`
- `webWindowXmarkSolid`
- `webpFormat`
- `weight`
- `weightAlt`
- `whatsapp`
- `whatsappSolid`
- `whiteFlag`
- `whiteFlagSolid`
- `wifi`
- `wifiOff`
- `wifiSignalNone`
- `wifiSignalNoneSolid`
- `wifiTag`
- `wifiTagSolid`
- `wifiWarning`
- `wifiWarningSolid`
- `wifiXmark`
- `wind`
- `windowCheck`
- `windowLock`
- `windowNoAccess`
- `windowTabs`
- `windowTabsSolid`
- `windowXmark`
- `windows`
- `wolf`
- `wolfSolid`
- `wrapText`
- `wrench`
- `wristwatch`
- `www`
- `x`
- `xSquare`
- `xboxA`
- `xboxB`
- `xboxX`
- `xboxY`
- `xmark`
- `xmarkCircle`
- `xmarkCircleSolid`
- `xmarkSquare`
- `xmarkSquareSolid`
- `xrayView`
- `ySquare`
- `yelp`
- `yen`
- `yenSquare`
- `yenSquareSolid`
- `yoga`
- `youtube`
- `youtubeSolid`
- `zSquare`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccessibilityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccessibilitySignIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccessibilityTechIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ActivityIcon size="20" class="nav-icon" /> Settings</a>
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
<AccessibilityIcon
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
    <AccessibilityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccessibilitySignIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccessibilityTechIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccessibilityIcon size="24" />
   <AccessibilitySignIcon size="24" color="#4a90e2" />
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
   <AccessibilityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccessibilityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccessibilityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-iconoir'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessibility, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility } from '@stacksjs/iconify-iconoir'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/iconoir-icons/iconoir/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Luca Burgio ([Website](https://github.com/iconoir-icons/iconoir))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/iconoir/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/iconoir/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
