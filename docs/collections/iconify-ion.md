# IonIcons

> IonIcons icons for stx from Iconify

## Overview

This package provides access to 2361 icons from the IonIcons collection through the stx iconify integration.

**Collection ID:** `ion`
**Total Icons:** 2361
**Author:** Ben Sperry ([Website](https://github.com/ionic-team/ionicons))
**License:** MIT ([Details](https://github.com/ionic-team/ionicons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ion
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccessibilityIcon, AccessibilityOutlineIcon, AccessibilitySharpIcon } from '@stacksjs/iconify-ion'

// Basic usage
const icon = AccessibilityIcon()

// With size
const sizedIcon = AccessibilityIcon({ size: 24 })

// With color
const coloredIcon = AccessibilityOutlineIcon({ color: 'red' })

// With multiple props
const customIcon = AccessibilitySharpIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccessibilityIcon, AccessibilityOutlineIcon, AccessibilitySharpIcon } from '@stacksjs/iconify-ion'

  global.icons = {
    home: AccessibilityIcon({ size: 24 }),
    user: AccessibilityOutlineIcon({ size: 24, color: '#4a90e2' }),
    settings: AccessibilitySharpIcon({ size: 32 })
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
import { accessibility, accessibilityOutline, accessibilitySharp } from '@stacksjs/iconify-ion'
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

```typescript
// Via color property
const redIcon = AccessibilityIcon({ color: 'red' })
const blueIcon = AccessibilityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccessibilityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccessibilityIcon({ class: 'text-primary' })
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
const icon24 = AccessibilityIcon({ size: 24 })
const icon1em = AccessibilityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccessibilityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccessibilityIcon({ height: '1em' })
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
const smallIcon = AccessibilityIcon({ class: 'icon-small' })
const largeIcon = AccessibilityIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **2361** icons:

- `accessibility`
- `accessibilityOutline`
- `accessibilitySharp`
- `add`
- `addCircle`
- `addCircleOutline`
- `addCircleSharp`
- `addOutline`
- `addSharp`
- `airplane`
- `airplaneOutline`
- `airplaneSharp`
- `alarm`
- `alarmOutline`
- `alarmSharp`
- `albums`
- `albumsOutline`
- `albumsSharp`
- `alert`
- `alertCircle`
- `alertCircleOutline`
- `alertCircleSharp`
- `alertCircled`
- `alertOutline`
- `alertSharp`
- `americanFootball`
- `americanFootballOutline`
- `americanFootballSharp`
- `analytics`
- `analyticsOutline`
- `analyticsSharp`
- `androidBulb`
- `androidCheckboxOutlineBlank`
- `androidContact`
- `androidFavoriteOutline`
- `androidHangout`
- `androidMoreHorizontal`
- `androidPlane`
- `androidSunny`
- `androidTime`
- `androidTrain`
- `aperture`
- `apertureOutline`
- `apertureSharp`
- `apps`
- `appsOutline`
- `appsSharp`
- `archive`
- `archiveOutline`
- `archiveSharp`
- `arrowBack`
- `arrowBackCircle`
- `arrowBackCircleOutline`
- `arrowBackCircleSharp`
- `arrowBackOutline`
- `arrowBackSharp`
- `arrowDown`
- `arrowDownA`
- `arrowDownB`
- `arrowDownC`
- `arrowDownCircle`
- `arrowDownCircleOutline`
- `arrowDownCircleSharp`
- `arrowDownLeftBox`
- `arrowDownLeftBoxOutline`
- `arrowDownLeftBoxSharp`
- `arrowDownOutline`
- `arrowDownRightBox`
- `arrowDownRightBoxOutline`
- `arrowDownRightBoxSharp`
- `arrowDownSharp`
- `arrowExpand`
- `arrowForward`
- `arrowForwardCircle`
- `arrowForwardCircleOutline`
- `arrowForwardCircleSharp`
- `arrowForwardOutline`
- `arrowForwardSharp`
- `arrowGraphDownLeft`
- `arrowGraphDownRight`
- `arrowGraphUpLeft`
- `arrowGraphUpRight`
- `arrowLeftA`
- `arrowLeftB`
- `arrowLeftC`
- `arrowMove`
- `arrowRedo`
- `arrowRedoCircle`
- `arrowRedoCircleOutline`
- `arrowRedoCircleSharp`
- `arrowRedoOutline`
- `arrowRedoSharp`
- `arrowResize`
- `arrowReturnLeft`
- `arrowReturnRight`
- `arrowRightA`
- `arrowRightB`
- `arrowRightC`
- `arrowShrink`
- `arrowSwap`
- `arrowUndo`
- `arrowUndoCircle`
- `arrowUndoCircleOutline`
- `arrowUndoCircleSharp`
- `arrowUndoOutline`
- `arrowUndoSharp`
- `arrowUp`
- `arrowUpA`
- `arrowUpB`
- `arrowUpC`
- `arrowUpCircle`
- `arrowUpCircleOutline`
- `arrowUpCircleSharp`
- `arrowUpLeftBox`
- `arrowUpLeftBoxOutline`
- `arrowUpLeftBoxSharp`
- `arrowUpOutline`
- `arrowUpRightBox`
- `arrowUpRightBoxOutline`
- `arrowUpRightBoxSharp`
- `arrowUpSharp`
- `asterisk`
- `at`
- `atCircle`
- `atCircleOutline`
- `atCircleSharp`
- `atOutline`
- `atSharp`
- `attach`
- `attachOutline`
- `attachSharp`
- `backspace`
- `backspaceOutline`
- `backspaceSharp`
- `bag`
- `bagAdd`
- `bagAddOutline`
- `bagAddSharp`
- `bagCheck`
- `bagCheckOutline`
- `bagCheckSharp`
- `bagHandle`
- `bagHandleOutline`
- `bagHandleSharp`
- `bagOutline`
- `bagRemove`
- `bagRemoveOutline`
- `bagRemoveSharp`
- `bagSharp`
- `balloon`
- `balloonOutline`
- `balloonSharp`
- `ban`
- `banOutline`
- `banSharp`
- `bandage`
- `bandageOutline`
- `bandageSharp`
- `barChart`
- `barChartOutline`
- `barChartSharp`
- `barbell`
- `barbellOutline`
- `barbellSharp`
- `barcode`
- `barcodeOutline`
- `barcodeSharp`
- `baseball`
- `baseballOutline`
- `baseballSharp`
- `basket`
- `basketOutline`
- `basketSharp`
- `basketball`
- `basketballOutline`
- `basketballSharp`
- `batteryCharging`
- `batteryChargingOutline`
- `batteryChargingSharp`
- `batteryDead`
- `batteryDeadOutline`
- `batteryDeadSharp`
- `batteryEmpty`
- `batteryFull`
- `batteryFullOutline`
- `batteryFullSharp`
- `batteryHalf`
- `batteryHalfOutline`
- `batteryHalfSharp`
- `batteryLow`
- `beaker`
- `beakerOutline`
- `beakerSharp`
- `bed`
- `bedOutline`
- `bedSharp`
- `beer`
- `beerOutline`
- `beerSharp`
- `bicycle`
- `bicycleOutline`
- `bicycleSharp`
- `binoculars`
- `binocularsOutline`
- `binocularsSharp`
- `bluetooth`
- `bluetoothOutline`
- `bluetoothSharp`
- `boat`
- `boatOutline`
- `boatSharp`
- `body`
- `bodyOutline`
- `bodySharp`
- `bonfire`
- `bonfireOutline`
- `bonfireSharp`
- `book`
- `bookOutline`
- `bookSharp`
- `bookmark`
- `bookmarkOutline`
- `bookmarkSharp`
- `bookmarks`
- `bookmarksOutline`
- `bookmarksSharp`
- `bowlingBall`
- `bowlingBallOutline`
- `bowlingBallSharp`
- `bowtie`
- `briefcase`
- `briefcaseOutline`
- `briefcaseSharp`
- `browsers`
- `browsersOutline`
- `browsersSharp`
- `brush`
- `brushOutline`
- `brushSharp`
- `bug`
- `bugOutline`
- `bugSharp`
- `build`
- `buildOutline`
- `buildSharp`
- `bulb`
- `bulbOutline`
- `bulbSharp`
- `bus`
- `busOutline`
- `busSharp`
- `business`
- `businessOutline`
- `businessSharp`
- `cafe`
- `cafeOutline`
- `cafeSharp`
- `calculator`
- `calculatorOutline`
- `calculatorSharp`
- `calendar`
- `calendarClear`
- `calendarClearOutline`
- `calendarClearSharp`
- `calendarNumber`
- `calendarNumberOutline`
- `calendarNumberSharp`
- `calendarOutline`
- `calendarSharp`
- `call`
- `callOutline`
- `callSharp`
- `camera`
- `cameraOutline`
- `cameraReverse`
- `cameraReverseOutline`
- `cameraReverseSharp`
- `cameraSharp`
- `car`
- `carOutline`
- `carSharp`
- `carSport`
- `carSportOutline`
- `carSportSharp`
- `card`
- `cardOutline`
- `cardSharp`
- `caretBack`
- `caretBackCircle`
- `caretBackCircleOutline`
- `caretBackCircleSharp`
- `caretBackOutline`
- `caretBackSharp`
- `caretDown`
- `caretDownCircle`
- `caretDownCircleOutline`
- `caretDownCircleSharp`
- `caretDownOutline`
- `caretDownSharp`
- `caretForward`
- `caretForwardCircle`
- `caretForwardCircleOutline`
- `caretForwardCircleSharp`
- `caretForwardOutline`
- `caretForwardSharp`
- `caretUp`
- `caretUpCircle`
- `caretUpCircleOutline`
- `caretUpCircleSharp`
- `caretUpOutline`
- `caretUpSharp`
- `cart`
- `cartOutline`
- `cartSharp`
- `cash`
- `cashOutline`
- `cashSharp`
- `cellular`
- `cellularOutline`
- `cellularSharp`
- `chatbox`
- `chatboxEllipses`
- `chatboxEllipsesOutline`
- `chatboxEllipsesSharp`
- `chatboxOutline`
- `chatboxSharp`
- `chatboxWorking`
- `chatboxes`
- `chatbubble`
- `chatbubbleEllipses`
- `chatbubbleEllipsesOutline`
- `chatbubbleEllipsesSharp`
- `chatbubbleOutline`
- `chatbubbleSharp`
- `chatbubbleWorking`
- `chatbubbles`
- `chatbubblesOutline`
- `chatbubblesSharp`
- `checkbox`
- `checkboxOutline`
- `checkboxSharp`
- `checkmark`
- `checkmarkCircle`
- `checkmarkCircleOutline`
- `checkmarkCircleSharp`
- `checkmarkCircled`
- `checkmarkDone`
- `checkmarkDoneCircle`
- `checkmarkDoneCircleOutline`
- `checkmarkDoneCircleSharp`
- `checkmarkDoneOutline`
- `checkmarkDoneSharp`
- `checkmarkOutline`
- `checkmarkRound`
- `checkmarkSharp`
- `chevronBack`
- `chevronBackCircle`
- `chevronBackCircleOutline`
- `chevronBackCircleSharp`
- `chevronBackOutline`
- `chevronBackSharp`
- `chevronCollapse`
- `chevronCollapseOutline`
- `chevronCollapseSharp`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownCircleOutline`
- `chevronDownCircleSharp`
- `chevronDownOutline`
- `chevronDownSharp`
- `chevronExpand`
- `chevronExpandOutline`
- `chevronExpandSharp`
- `chevronForward`
- `chevronForwardCircle`
- `chevronForwardCircleOutline`
- `chevronForwardCircleSharp`
- `chevronForwardOutline`
- `chevronForwardSharp`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpCircleOutline`
- `chevronUpCircleSharp`
- `chevronUpOutline`
- `chevronUpSharp`
- `clipboard`
- `clipboardOutline`
- `clipboardSharp`
- `clock`
- `close`
- `closeCircle`
- `closeCircleOutline`
- `closeCircleSharp`
- `closeCircled`
- `closeOutline`
- `closeRound`
- `closeSharp`
- `closedCaptioning`
- `cloud`
- `cloudCircle`
- `cloudCircleOutline`
- `cloudCircleSharp`
- `cloudDone`
- `cloudDoneOutline`
- `cloudDoneSharp`
- `cloudDownload`
- `cloudDownloadOutline`
- `cloudDownloadSharp`
- `cloudOffline`
- `cloudOfflineOutline`
- `cloudOfflineSharp`
- `cloudOutline`
- `cloudSharp`
- `cloudUpload`
- `cloudUploadOutline`
- `cloudUploadSharp`
- `cloudy`
- `cloudyNight`
- `cloudyNightOutline`
- `cloudyNightSharp`
- `cloudyOutline`
- `cloudySharp`
- `code`
- `codeDownload`
- `codeDownloadOutline`
- `codeDownloadSharp`
- `codeOutline`
- `codeSharp`
- `codeSlash`
- `codeSlashOutline`
- `codeSlashSharp`
- `codeWorking`
- `codeWorkingOutline`
- `codeWorkingSharp`
- `coffee`
- `cog`
- `cogOutline`
- `cogSharp`
- `colorFill`
- `colorFillOutline`
- `colorFillSharp`
- `colorFilter`
- `colorFilterOutline`
- `colorFilterSharp`
- `colorPalette`
- `colorPaletteOutline`
- `colorPaletteSharp`
- `colorWand`
- `colorWandOutline`
- `colorWandSharp`
- `compass`
- `compassOutline`
- `compassSharp`
- `compose`
- `connectionBars`
- `construct`
- `constructOutline`
- `constructSharp`
- `contract`
- `contractOutline`
- `contractSharp`
- `contrast`
- `contrastOutline`
- `contrastSharp`
- `copy`
- `copyOutline`
- `copySharp`
- `create`
- `createOutline`
- `createSharp`
- `crop`
- `cropOutline`
- `cropSharp`
- `cube`
- `cubeOutline`
- `cubeSharp`
- `cut`
- `cutOutline`
- `cutSharp`
- `desktop`
- `desktopOutline`
- `desktopSharp`
- `diamond`
- `diamondOutline`
- `diamondSharp`
- `dice`
- `diceOutline`
- `diceSharp`
- `disc`
- `discOutline`
- `discSharp`
- `document`
- `documentAttach`
- `documentAttachOutline`
- `documentAttachSharp`
- `documentLock`
- `documentLockOutline`
- `documentLockSharp`
- `documentOutline`
- `documentSharp`
- `documentText`
- `documentTextOutline`
- `documentTextSharp`
- `documents`
- `documentsOutline`
- `documentsSharp`
- `download`
- `downloadOutline`
- `downloadSharp`
- `drag`
- `duplicate`
- `duplicateOutline`
- `duplicateSharp`
- `ear`
- `earOutline`
- `earSharp`
- `earth`
- `earthOutline`
- `earthSharp`
- `easel`
- `easelOutline`
- `easelSharp`
- `edit`
- `egg`
- `eggOutline`
- `eggSharp`
- `eject`
- `ellipse`
- `ellipseOutline`
- `ellipseSharp`
- `ellipsisHorizontal`
- `ellipsisHorizontalCircle`
- `ellipsisHorizontalCircleOutline`
- `ellipsisHorizontalCircleSharp`
- `ellipsisHorizontalOutline`
- `ellipsisHorizontalSharp`
- `ellipsisVertical`
- `ellipsisVerticalCircle`
- `ellipsisVerticalCircleOutline`
- `ellipsisVerticalCircleSharp`
- `ellipsisVerticalOutline`
- `ellipsisVerticalSharp`
- `email`
- `emailUnread`
- `enter`
- `enterOutline`
- `enterSharp`
- `erlenmeyerFlask`
- `erlenmeyerFlaskBubbles`
- `exit`
- `exitOutline`
- `exitSharp`
- `expand`
- `expandOutline`
- `expandSharp`
- `extensionPuzzle`
- `extensionPuzzleOutline`
- `extensionPuzzleSharp`
- `eye`
- `eyeDisabled`
- `eyeOff`
- `eyeOffOutline`
- `eyeOffSharp`
- `eyeOutline`
- `eyeSharp`
- `eyedrop`
- `eyedropOutline`
- `eyedropSharp`
- `fastFood`
- `fastFoodOutline`
- `fastFoodSharp`
- `female`
- `femaleOutline`
- `femaleSharp`
- `fileTray`
- `fileTrayFull`
- `fileTrayFullOutline`
- `fileTrayFullSharp`
- `fileTrayOutline`
- `fileTraySharp`
- `fileTrayStacked`
- `fileTrayStackedOutline`
- `fileTrayStackedSharp`
- `filing`
- `film`
- `filmMarker`
- `filmOutline`
- `filmSharp`
- `filter`
- `filterCircle`
- `filterCircleOutline`
- `filterCircleSharp`
- `filterOutline`
- `filterSharp`
- `fingerPrint`
- `fingerPrintOutline`
- `fingerPrintSharp`
- `fireball`
- `fish`
- `fishOutline`
- `fishSharp`
- `fitness`
- `fitnessOutline`
- `fitnessSharp`
- `flag`
- `flagOutline`
- `flagSharp`
- `flame`
- `flameOutline`
- `flameSharp`
- `flash`
- `flashOff`
- `flashOffOutline`
- `flashOffSharp`
- `flashOutline`
- `flashSharp`
- `flashlight`
- `flashlightOutline`
- `flashlightSharp`
- `flask`
- `flaskOutline`
- `flaskSharp`
- `flower`
- `flowerOutline`
- `flowerSharp`
- `folder`
- `folderOpen`
- `folderOpenOutline`
- `folderOpenSharp`
- `folderOutline`
- `folderSharp`
- `football`
- `footballOutline`
- `footballSharp`
- `footsteps`
- `footstepsOutline`
- `footstepsSharp`
- `fork`
- `forkRepo`
- `forward`
- `funnel`
- `funnelOutline`
- `funnelSharp`
- `gameController`
- `gameControllerOutline`
- `gameControllerSharp`
- `gearA`
- `gearB`
- `gift`
- `giftOutline`
- `giftSharp`
- `gitBranch`
- `gitBranchOutline`
- `gitBranchSharp`
- `gitCommit`
- `gitCommitOutline`
- `gitCommitSharp`
- `gitCompare`
- `gitCompareOutline`
- `gitCompareSharp`
- `gitMerge`
- `gitMergeOutline`
- `gitMergeSharp`
- `gitNetwork`
- `gitNetworkOutline`
- `gitNetworkSharp`
- `gitPullRequest`
- `gitPullRequestOutline`
- `gitPullRequestSharp`
- `glasses`
- `glassesOutline`
- `glassesSharp`
- `globe`
- `globeOutline`
- `globeSharp`
- `golf`
- `golfOutline`
- `golfSharp`
- `grid`
- `gridOutline`
- `gridSharp`
- `hammer`
- `hammerOutline`
- `hammerSharp`
- `handLeft`
- `handLeftOutline`
- `handLeftSharp`
- `handRight`
- `handRightOutline`
- `handRightSharp`
- `happy`
- `happyOutline`
- `happySharp`
- `hardwareChip`
- `hardwareChipOutline`
- `hardwareChipSharp`
- `headphone`
- `headset`
- `headsetOutline`
- `headsetSharp`
- `heart`
- `heartBroken`
- `heartCircle`
- `heartCircleOutline`
- `heartCircleSharp`
- `heartDislike`
- `heartDislikeCircle`
- `heartDislikeCircleOutline`
- `heartDislikeCircleSharp`
- `heartDislikeOutline`
- `heartDislikeSharp`
- `heartHalf`
- `heartHalfOutline`
- `heartHalfSharp`
- `heartOutline`
- `heartSharp`
- `help`
- `helpBuoy`
- `helpBuoyOutline`
- `helpBuoySharp`
- `helpCircle`
- `helpCircleOutline`
- `helpCircleSharp`
- `helpCircled`
- `helpOutline`
- `helpSharp`
- `home`
- `homeOutline`
- `homeSharp`
- `hourglass`
- `hourglassOutline`
- `hourglassSharp`
- `iceCream`
- `iceCreamOutline`
- `iceCreamSharp`
- `icecream`
- `idCard`
- `idCardOutline`
- `idCardSharp`
- `image`
- `imageOutline`
- `imageSharp`
- `images`
- `imagesOutline`
- `imagesSharp`
- `infinite`
- `infiniteOutline`
- `infiniteSharp`
- `information`
- `informationCircle`
- `informationCircleOutline`
- `informationCircleSharp`
- `informationCircled`
- `informationOutline`
- `informationSharp`
- `invertMode`
- `invertModeOutline`
- `invertModeSharp`
- `ionic`
- `iosAdd`
- `iosAddCircle`
- `iosAddCircleOutline`
- `iosAirplane`
- `iosAlarm`
- `iosAlarmOutline`
- `iosAlbums`
- `iosAlbumsOutline`
- `iosAlert`
- `iosAmericanFootball`
- `iosAmericanfootball`
- `iosAmericanfootballOutline`
- `iosAnalytics`
- `iosAnalyticsOutline`
- `iosAperture`
- `iosApps`
- `iosAppstore`
- `iosArchive`
- `iosArrowBack`
- `iosArrowDown`
- `iosArrowDropdown`
- `iosArrowDropdownCircle`
- `iosArrowDropleft`
- `iosArrowDropleftCircle`
- `iosArrowDropright`
- `iosArrowDroprightCircle`
- `iosArrowDropup`
- `iosArrowDropupCircle`
- `iosArrowForward`
- `iosArrowLeft`
- `iosArrowRight`
- `iosArrowRoundBack`
- `iosArrowRoundDown`
- `iosArrowRoundForward`
- `iosArrowRoundUp`
- `iosArrowThinDown`
- `iosArrowThinLeft`
- `iosArrowThinRight`
- `iosArrowThinUp`
- `iosArrowUp`
- `iosAt`
- `iosAtOutline`
- `iosAttach`
- `iosBackspace`
- `iosBarcode`
- `iosBarcodeOutline`
- `iosBaseball`
- `iosBaseballOutline`
- `iosBasket`
- `iosBasketball`
- `iosBasketballOutline`
- `iosBatteryCharging`
- `iosBatteryDead`
- `iosBatteryFull`
- `iosBeaker`
- `iosBed`
- `iosBeer`
- `iosBell`
- `iosBellOutline`
- `iosBicycle`
- `iosBluetooth`
- `iosBoat`
- `iosBody`
- `iosBodyOutline`
- `iosBolt`
- `iosBoltOutline`
- `iosBonfire`
- `iosBook`
- `iosBookOutline`
- `iosBookmark`
- `iosBookmarks`
- `iosBookmarksOutline`
- `iosBowtie`
- `iosBox`
- `iosBoxOutline`
- `iosBriefcase`
- `iosBriefcaseOutline`
- `iosBrowsers`
- `iosBrowsersOutline`
- `iosBrush`
- `iosBug`
- `iosBuild`
- `iosBulb`
- `iosBus`
- `iosBusiness`
- `iosCafe`
- `iosCalculator`
- `iosCalculatorOutline`
- `iosCalendar`
- `iosCalendarOutline`
- `iosCall`
- `iosCamera`
- `iosCameraOutline`
- `iosCar`
- `iosCard`
- `iosCart`
- `iosCartOutline`
- `iosCash`
- `iosCellular`
- `iosChatboxes`
- `iosChatboxesOutline`
- `iosChatbubble`
- `iosChatbubbleOutline`
- `iosChatbubbles`
- `iosCheckbox`
- `iosCheckboxOutline`
- `iosCheckmark`
- `iosCheckmarkCircle`
- `iosCheckmarkCircleOutline`
- `iosCheckmarkEmpty`
- `iosCheckmarkOutline`
- `iosCircleFilled`
- `iosCircleOutline`
- `iosClipboard`
- `iosClock`
- `iosClockOutline`
- `iosClose`
- `iosCloseCircle`
- `iosCloseCircleOutline`
- `iosCloseEmpty`
- `iosCloseOutline`
- `iosCloud`
- `iosCloudCircle`
- `iosCloudDone`
- `iosCloudDownload`
- `iosCloudDownloadOutline`
- `iosCloudOutline`
- `iosCloudUpload`
- `iosCloudUploadOutline`
- `iosCloudy`
- `iosCloudyNight`
- `iosCloudyNightOutline`
- `iosCloudyOutline`
- `iosCode`
- `iosCodeDownload`
- `iosCodeWorking`
- `iosCog`
- `iosCogOutline`
- `iosColorFill`
- `iosColorFilter`
- `iosColorFilterOutline`
- `iosColorPalette`
- `iosColorWand`
- `iosColorWandOutline`
- `iosCompass`
- `iosCompose`
- `iosComposeOutline`
- `iosConstruct`
- `iosContact`
- `iosContactOutline`
- `iosContacts`
- `iosContract`
- `iosContrast`
- `iosCopy`
- `iosCopyOutline`
- `iosCreate`
- `iosCrop`
- `iosCropStrong`
- `iosCube`
- `iosCut`
- `iosDesktop`
- `iosDisc`
- `iosDocument`
- `iosDoneAll`
- `iosDownload`
- `iosDownloadOutline`
- `iosEasel`
- `iosEgg`
- `iosEmail`
- `iosEmailOutline`
- `iosExit`
- `iosExpand`
- `iosEye`
- `iosEyeOff`
- `iosEyeOutline`
- `iosFastforward`
- `iosFastforwardOutline`
- `iosFemale`
- `iosFiling`
- `iosFilingOutline`
- `iosFilm`
- `iosFilmOutline`
- `iosFingerPrint`
- `iosFitness`
- `iosFlag`
- `iosFlagOutline`
- `iosFlame`
- `iosFlameOutline`
- `iosFlash`
- `iosFlashOff`
- `iosFlashlight`
- `iosFlask`
- `iosFlaskOutline`
- `iosFlower`
- `iosFlowerOutline`
- `iosFolder`
- `iosFolderOpen`
- `iosFolderOutline`
- `iosFootball`
- `iosFootballOutline`
- `iosFunnel`
- `iosGameControllerA`
- `iosGameControllerAOutline`
- `iosGameControllerB`
- `iosGameControllerBOutline`
- `iosGear`
- `iosGearOutline`
- `iosGift`
- `iosGitBranch`
- `iosGitCommit`
- `iosGitCompare`
- `iosGitMerge`
- `iosGitNetwork`
- `iosGitPullRequest`
- `iosGlasses`
- `iosGlassesOutline`
- `iosGlobe`
- `iosGrid`
- `iosGridView`
- `iosGridViewOutline`
- `iosHammer`
- `iosHand`
- `iosHappy`
- `iosHeadset`
- `iosHeart`
- `iosHeartDislike`
- `iosHeartEmpty`
- `iosHeartHalf`
- `iosHeartOutline`
- `iosHelp`
- `iosHelpBuoy`
- `iosHelpCircle`
- `iosHelpCircleOutline`
- `iosHelpEmpty`
- `iosHelpOutline`
- `iosHome`
- `iosHomeOutline`
- `iosHourglass`
- `iosIceCream`
- `iosImage`
- `iosImages`
- `iosInfinite`
- `iosInfiniteOutline`
- `iosInformation`
- `iosInformationCircle`
- `iosInformationCircleOutline`
- `iosInformationEmpty`
- `iosInformationOutline`
- `iosIonicOutline`
- `iosJet`
- `iosJournal`
- `iosKey`
- `iosKeypad`
- `iosKeypadOutline`
- `iosLaptop`
- `iosLeaf`
- `iosLightbulb`
- `iosLightbulbOutline`
- `iosLink`
- `iosList`
- `iosListBox`
- `iosListOutline`
- `iosLocate`
- `iosLocation`
- `iosLocationOutline`
- `iosLock`
- `iosLocked`
- `iosLockedOutline`
- `iosLogIn`
- `iosLogOut`
- `iosLoop`
- `iosLoopStrong`
- `iosMagnet`
- `iosMail`
- `iosMailOpen`
- `iosMailUnread`
- `iosMale`
- `iosMan`
- `iosMap`
- `iosMedal`
- `iosMedical`
- `iosMedicalOutline`
- `iosMedkit`
- `iosMedkitOutline`
- `iosMegaphone`
- `iosMenu`
- `iosMic`
- `iosMicOff`
- `iosMicOutline`
- `iosMicrophone`
- `iosMinus`
- `iosMinusEmpty`
- `iosMinusOutline`
- `iosMonitor`
- `iosMonitorOutline`
- `iosMoon`
- `iosMoonOutline`
- `iosMore`
- `iosMoreOutline`
- `iosMove`
- `iosMusicalNote`
- `iosMusicalNotes`
- `iosNavigate`
- `iosNavigateOutline`
- `iosNotifications`
- `iosNotificationsOff`
- `iosNotificationsOutline`
- `iosNuclear`
- `iosNutrition`
- `iosNutritionOutline`
- `iosOpen`
- `iosOptions`
- `iosOutlet`
- `iosPaper`
- `iosPaperOutline`
- `iosPaperPlane`
- `iosPaperplane`
- `iosPaperplaneOutline`
- `iosPartlySunny`
- `iosPartlysunny`
- `iosPartlysunnyOutline`
- `iosPause`
- `iosPauseOutline`
- `iosPaw`
- `iosPawOutline`
- `iosPeople`
- `iosPeopleOutline`
- `iosPerson`
- `iosPersonAdd`
- `iosPersonOutline`
- `iosPersonadd`
- `iosPersonaddOutline`
- `iosPhoneLandscape`
- `iosPhonePortrait`
- `iosPhotos`
- `iosPhotosOutline`
- `iosPie`
- `iosPieOutline`
- `iosPin`
- `iosPint`
- `iosPintOutline`
- `iosPizza`
- `iosPlanet`
- `iosPlay`
- `iosPlayCircle`
- `iosPlayOutline`
- `iosPlus`
- `iosPlusEmpty`
- `iosPlusOutline`
- `iosPodium`
- `iosPower`
- `iosPricetag`
- `iosPricetagOutline`
- `iosPricetags`
- `iosPricetagsOutline`
- `iosPrint`
- `iosPrinter`
- `iosPrinterOutline`
- `iosPulse`
- `iosPulseStrong`
- `iosQrScanner`
- `iosQuote`
- `iosRadio`
- `iosRadioButtonOff`
- `iosRadioButtonOn`
- `iosRainy`
- `iosRainyOutline`
- `iosRecording`
- `iosRecordingOutline`
- `iosRedo`
- `iosRedoOutline`
- `iosRefresh`
- `iosRefreshCircle`
- `iosRefreshEmpty`
- `iosRefreshOutline`
- `iosReload`
- `iosRemove`
- `iosRemoveCircle`
- `iosRemoveCircleOutline`
- `iosReorder`
- `iosRepeat`
- `iosResize`
- `iosRestaurant`
- `iosReturnLeft`
- `iosReturnRight`
- `iosReverseCamera`
- `iosReverseCameraOutline`
- `iosRewind`
- `iosRewindOutline`
- `iosRibbon`
- `iosRocket`
- `iosRose`
- `iosRoseOutline`
- `iosSad`
- `iosSave`
- `iosSchool`
- `iosSearch`
- `iosSearchStrong`
- `iosSend`
- `iosSettings`
- `iosSettingsStrong`
- `iosShare`
- `iosShareAlt`
- `iosShirt`
- `iosShuffle`
- `iosShuffleStrong`
- `iosSkipBackward`
- `iosSkipForward`
- `iosSkipbackward`
- `iosSkipbackwardOutline`
- `iosSkipforward`
- `iosSkipforwardOutline`
- `iosSnow`
- `iosSnowy`
- `iosSpeedometer`
- `iosSpeedometerOutline`
- `iosSquare`
- `iosSquareOutline`
- `iosStar`
- `iosStarHalf`
- `iosStarOutline`
- `iosStats`
- `iosStopwatch`
- `iosStopwatchOutline`
- `iosSubway`
- `iosSunny`
- `iosSunnyOutline`
- `iosSwap`
- `iosSwitch`
- `iosSync`
- `iosTabletLandscape`
- `iosTabletPortrait`
- `iosTelephone`
- `iosTelephoneOutline`
- `iosTennisball`
- `iosTennisballOutline`
- `iosText`
- `iosThermometer`
- `iosThumbsDown`
- `iosThumbsUp`
- `iosThunderstorm`
- `iosThunderstormOutline`
- `iosTime`
- `iosTimeOutline`
- `iosTimer`
- `iosTimerOutline`
- `iosToday`
- `iosToggle`
- `iosToggleOutline`
- `iosTrain`
- `iosTransgender`
- `iosTrash`
- `iosTrashOutline`
- `iosTrendingDown`
- `iosTrendingUp`
- `iosTrophy`
- `iosTv`
- `iosUmbrella`
- `iosUndo`
- `iosUndoOutline`
- `iosUnlock`
- `iosUnlocked`
- `iosUnlockedOutline`
- `iosUpload`
- `iosUploadOutline`
- `iosVideocam`
- `iosVideocamOutline`
- `iosVolumeHigh`
- `iosVolumeLow`
- `iosVolumeMute`
- `iosVolumeOff`
- `iosWalk`
- `iosWallet`
- `iosWarning`
- `iosWatch`
- `iosWater`
- `iosWifi`
- `iosWine`
- `iosWineglass`
- `iosWineglassOutline`
- `iosWoman`
- `iosWorld`
- `iosWorldOutline`
- `ipad`
- `iphone`
- `ipod`
- `jet`
- `journal`
- `journalOutline`
- `journalSharp`
- `key`
- `keyOutline`
- `keySharp`
- `keypad`
- `keypadOutline`
- `keypadSharp`
- `knife`
- `language`
- `languageOutline`
- `languageSharp`
- `laptop`
- `laptopOutline`
- `laptopSharp`
- `layers`
- `layersOutline`
- `layersSharp`
- `leaf`
- `leafOutline`
- `leafSharp`
- `levels`
- `library`
- `libraryOutline`
- `librarySharp`
- `lightbulb`
- `link`
- `linkOutline`
- `linkSharp`
- `list`
- `listCircle`
- `listCircleOutline`
- `listCircleSharp`
- `listOutline`
- `listSharp`
- `loadA`
- `loadB`
- `loadC`
- `loadD`
- `locate`
- `locateOutline`
- `locateSharp`
- `location`
- `locationOutline`
- `locationSharp`
- `lockClosed`
- `lockClosedOutline`
- `lockClosedSharp`
- `lockCombination`
- `lockOpen`
- `lockOpenOutline`
- `lockOpenSharp`
- `locked`
- `logIn`
- `logInOutline`
- `logInSharp`
- `logOut`
- `logOutOutline`
- `logOutSharp`
- `logoAlipay`
- `logoAmazon`
- `logoAmplify`
- `logoAndroid`
- `logoAngular`
- `logoAppflow`
- `logoApple`
- `logoAppleAppstore`
- `logoAppleAr`
- `logoBehance`
- `logoBitbucket`
- `logoBitcoin`
- `logoBuffer`
- `logoCapacitor`
- `logoChrome`
- `logoClosedCaptioning`
- `logoCodepen`
- `logoCss3`
- `logoDesignernews`
- `logoDeviantart`
- `logoDiscord`
- `logoDocker`
- `logoDribbble`
- `logoDropbox`
- `logoEdge`
- `logoElectron`
- `logoEuro`
- `logoFacebook`
- `logoFigma`
- `logoFirebase`
- `logoFirefox`
- `logoFlickr`
- `logoFoursquare`
- `logoFreebsdDevil`
- `logoGameControllerA`
- `logoGameControllerB`
- `logoGithub`
- `logoGitlab`
- `logoGoogle`
- `logoGooglePlaystore`
- `logoGoogleplus`
- `logoHackernews`
- `logoHtml5`
- `logoInstagram`
- `logoIonic`
- `logoIonitron`
- `logoJavascript`
- `logoLaravel`
- `logoLinkedin`
- `logoMarkdown`
- `logoMastodon`
- `logoMedium`
- `logoMicrosoft`
- `logoModelS`
- `logoNoSmoking`
- `logoNodejs`
- `logoNpm`
- `logoOctocat`
- `logoPaypal`
- `logoPinterest`
- `logoPlaystation`
- `logoPolymer`
- `logoPwa`
- `logoPython`
- `logoReact`
- `logoReddit`
- `logoRss`
- `logoSass`
- `logoSkype`
- `logoSlack`
- `logoSnapchat`
- `logoSoundcloud`
- `logoStackoverflow`
- `logoSteam`
- `logoStencil`
- `logoTableau`
- `logoThreads`
- `logoTiktok`
- `logoTrapeze`
- `logoTumblr`
- `logoTux`
- `logoTwitch`
- `logoTwitter`
- `logoUsd`
- `logoVenmo`
- `logoVercel`
- `logoVimeo`
- `logoVk`
- `logoVue`
- `logoWebComponent`
- `logoWechat`
- `logoWhatsapp`
- `logoWindows`
- `logoWordpress`
- `logoX`
- `logoXbox`
- `logoXing`
- `logoYahoo`
- `logoYen`
- `logoYoutube`
- `loop`
- `magnet`
- `magnetOutline`
- `magnetSharp`
- `mail`
- `mailOpen`
- `mailOpenOutline`
- `mailOpenSharp`
- `mailOutline`
- `mailSharp`
- `mailUnread`
- `mailUnreadOutline`
- `mailUnreadSharp`
- `male`
- `maleFemale`
- `maleFemaleOutline`
- `maleFemaleSharp`
- `maleOutline`
- `maleSharp`
- `man`
- `manOutline`
- `manSharp`
- `map`
- `mapOutline`
- `mapSharp`
- `mdAdd`
- `mdAddCircle`
- `mdAddCircleOutline`
- `mdAirplane`
- `mdAlarm`
- `mdAlbums`
- `mdAlert`
- `mdAmericanFootball`
- `mdAnalytics`
- `mdAperture`
- `mdApps`
- `mdAppstore`
- `mdArchive`
- `mdArrowBack`
- `mdArrowDown`
- `mdArrowDropdown`
- `mdArrowDropdownCircle`
- `mdArrowDropleft`
- `mdArrowDropleftCircle`
- `mdArrowDropright`
- `mdArrowDroprightCircle`
- `mdArrowDropup`
- `mdArrowDropupCircle`
- `mdArrowForward`
- `mdArrowRoundBack`
- `mdArrowRoundDown`
- `mdArrowRoundForward`
- `mdArrowRoundUp`
- `mdArrowUp`
- `mdAt`
- `mdAttach`
- `mdBackspace`
- `mdBarcode`
- `mdBaseball`
- `mdBasket`
- `mdBasketball`
- `mdBatteryCharging`
- `mdBatteryDead`
- `mdBatteryFull`
- `mdBeaker`
- `mdBed`
- `mdBeer`
- `mdBicycle`
- `mdBluetooth`
- `mdBoat`
- `mdBody`
- `mdBonfire`
- `mdBook`
- `mdBookmark`
- `mdBookmarks`
- `mdBowtie`
- `mdBriefcase`
- `mdBrowsers`
- `mdBrush`
- `mdBug`
- `mdBuild`
- `mdBulb`
- `mdBus`
- `mdBusiness`
- `mdCafe`
- `mdCalculator`
- `mdCalendar`
- `mdCall`
- `mdCamera`
- `mdCar`
- `mdCard`
- `mdCart`
- `mdCash`
- `mdCellular`
- `mdChatboxes`
- `mdChatbubbles`
- `mdCheckbox`
- `mdCheckboxOutline`
- `mdCheckmark`
- `mdCheckmarkCircle`
- `mdCheckmarkCircleOutline`
- `mdClipboard`
- `mdClock`
- `mdClose`
- `mdCloseCircle`
- `mdCloseCircleOutline`
- `mdCloud`
- `mdCloudCircle`
- `mdCloudDone`
- `mdCloudDownload`
- `mdCloudOutline`
- `mdCloudUpload`
- `mdCloudy`
- `mdCloudyNight`
- `mdCode`
- `mdCodeDownload`
- `mdCodeWorking`
- `mdCog`
- `mdColorFill`
- `mdColorFilter`
- `mdColorPalette`
- `mdColorWand`
- `mdCompass`
- `mdConstruct`
- `mdContact`
- `mdContacts`
- `mdContract`
- `mdContrast`
- `mdCopy`
- `mdCreate`
- `mdCrop`
- `mdCube`
- `mdCut`
- `mdDesktop`
- `mdDisc`
- `mdDocument`
- `mdDoneAll`
- `mdDownload`
- `mdEasel`
- `mdEgg`
- `mdExit`
- `mdExpand`
- `mdEye`
- `mdEyeOff`
- `mdFastforward`
- `mdFemale`
- `mdFiling`
- `mdFilm`
- `mdFingerPrint`
- `mdFitness`
- `mdFlag`
- `mdFlame`
- `mdFlash`
- `mdFlashOff`
- `mdFlashlight`
- `mdFlask`
- `mdFlower`
- `mdFolder`
- `mdFolderOpen`
- `mdFootball`
- `mdFunnel`
- `mdGift`
- `mdGitBranch`
- `mdGitCommit`
- `mdGitCompare`
- `mdGitMerge`
- `mdGitNetwork`
- `mdGitPullRequest`
- `mdGlasses`
- `mdGlobe`
- `mdGrid`
- `mdHammer`
- `mdHand`
- `mdHappy`
- `mdHeadset`
- `mdHeart`
- `mdHeartDislike`
- `mdHeartEmpty`
- `mdHeartHalf`
- `mdHelp`
- `mdHelpBuoy`
- `mdHelpCircle`
- `mdHelpCircleOutline`
- `mdHome`
- `mdHourglass`
- `mdIceCream`
- `mdImage`
- `mdImages`
- `mdInfinite`
- `mdInformation`
- `mdInformationCircle`
- `mdInformationCircleOutline`
- `mdJet`
- `mdJournal`
- `mdKey`
- `mdKeypad`
- `mdLaptop`
- `mdLeaf`
- `mdLink`
- `mdList`
- `mdListBox`
- `mdLocate`
- `mdLock`
- `mdLogIn`
- `mdLogOut`
- `mdMagnet`
- `mdMail`
- `mdMailOpen`
- `mdMailUnread`
- `mdMale`
- `mdMan`
- `mdMap`
- `mdMedal`
- `mdMedical`
- `mdMedkit`
- `mdMegaphone`
- `mdMenu`
- `mdMic`
- `mdMicOff`
- `mdMicrophone`
- `mdMoon`
- `mdMore`
- `mdMove`
- `mdMusicalNote`
- `mdMusicalNotes`
- `mdNavigate`
- `mdNotifications`
- `mdNotificationsOff`
- `mdNotificationsOutline`
- `mdNuclear`
- `mdNutrition`
- `mdOpen`
- `mdOptions`
- `mdOutlet`
- `mdPaper`
- `mdPaperPlane`
- `mdPartlySunny`
- `mdPause`
- `mdPaw`
- `mdPeople`
- `mdPerson`
- `mdPersonAdd`
- `mdPhoneLandscape`
- `mdPhonePortrait`
- `mdPhotos`
- `mdPie`
- `mdPin`
- `mdPint`
- `mdPizza`
- `mdPlanet`
- `mdPlay`
- `mdPlayCircle`
- `mdPodium`
- `mdPower`
- `mdPricetag`
- `mdPricetags`
- `mdPrint`
- `mdPulse`
- `mdQrScanner`
- `mdQuote`
- `mdRadio`
- `mdRadioButtonOff`
- `mdRadioButtonOn`
- `mdRainy`
- `mdRecording`
- `mdRedo`
- `mdRefresh`
- `mdRefreshCircle`
- `mdRemove`
- `mdRemoveCircle`
- `mdRemoveCircleOutline`
- `mdReorder`
- `mdRepeat`
- `mdResize`
- `mdRestaurant`
- `mdReturnLeft`
- `mdReturnRight`
- `mdReverseCamera`
- `mdRewind`
- `mdRibbon`
- `mdRocket`
- `mdRose`
- `mdSad`
- `mdSave`
- `mdSchool`
- `mdSearch`
- `mdSend`
- `mdSettings`
- `mdShare`
- `mdShareAlt`
- `mdShirt`
- `mdShuffle`
- `mdSkipBackward`
- `mdSkipForward`
- `mdSnow`
- `mdSpeedometer`
- `mdSquare`
- `mdSquareOutline`
- `mdStar`
- `mdStarHalf`
- `mdStarOutline`
- `mdStats`
- `mdStopwatch`
- `mdSubway`
- `mdSunny`
- `mdSwap`
- `mdSwitch`
- `mdSync`
- `mdTabletLandscape`
- `mdTabletPortrait`
- `mdTennisball`
- `mdText`
- `mdThermometer`
- `mdThumbsDown`
- `mdThumbsUp`
- `mdThunderstorm`
- `mdTime`
- `mdTimer`
- `mdToday`
- `mdTrain`
- `mdTransgender`
- `mdTrash`
- `mdTrendingDown`
- `mdTrendingUp`
- `mdTrophy`
- `mdTv`
- `mdUmbrella`
- `mdUndo`
- `mdUnlock`
- `mdVideocam`
- `mdVolumeHigh`
- `mdVolumeLow`
- `mdVolumeMute`
- `mdVolumeOff`
- `mdWalk`
- `mdWallet`
- `mdWarning`
- `mdWatch`
- `mdWater`
- `mdWifi`
- `mdWine`
- `mdWoman`
- `medal`
- `medalOutline`
- `medalSharp`
- `medical`
- `medicalOutline`
- `medicalSharp`
- `medkit`
- `medkitOutline`
- `medkitSharp`
- `megaphone`
- `megaphoneOutline`
- `megaphoneSharp`
- `menu`
- `menuOutline`
- `menuSharp`
- `merge`
- `mic`
- `micA`
- `micB`
- `micC`
- `micCircle`
- `micCircleOutline`
- `micCircleSharp`
- `micOff`
- `micOffCircle`
- `micOffCircleOutline`
- `micOffCircleSharp`
- `micOffOutline`
- `micOffSharp`
- `micOutline`
- `micSharp`
- `minus`
- `minusCircled`
- `minusRound`
- `modelS`
- `monitor`
- `moon`
- `moonOutline`
- `moonSharp`
- `more`
- `mouse`
- `move`
- `moveOutline`
- `moveSharp`
- `musicNote`
- `musicalNote`
- `musicalNoteOutline`
- `musicalNoteSharp`
- `musicalNotes`
- `musicalNotesOutline`
- `musicalNotesSharp`
- `navicon`
- `naviconRound`
- `navigate`
- `navigateCircle`
- `navigateCircleOutline`
- `navigateCircleSharp`
- `navigateOutline`
- `navigateSharp`
- `network`
- `newspaper`
- `newspaperOutline`
- `newspaperSharp`
- `noSmoking`
- `notifications`
- `notificationsCircle`
- `notificationsCircleOutline`
- `notificationsCircleSharp`
- `notificationsOff`
- `notificationsOffCircle`
- `notificationsOffCircleOutline`
- `notificationsOffCircleSharp`
- `notificationsOffOutline`
- `notificationsOffSharp`
- `notificationsOutline`
- `notificationsSharp`
- `nuclear`
- `nuclearOutline`
- `nuclearSharp`
- `nutrition`
- `nutritionOutline`
- `nutritionSharp`
- `open`
- `openOutline`
- `openSharp`
- `options`
- `optionsOutline`
- `optionsSharp`
- `outlet`
- `paintbrush`
- `paintbucket`
- `paperAirplane`
- `paperPlane`
- `paperPlaneOutline`
- `paperPlaneSharp`
- `paperclip`
- `partlySunny`
- `partlySunnyOutline`
- `partlySunnySharp`
- `pause`
- `pauseCircle`
- `pauseCircleOutline`
- `pauseCircleSharp`
- `pauseOutline`
- `pauseSharp`
- `paw`
- `pawOutline`
- `pawSharp`
- `pencil`
- `pencilOutline`
- `pencilSharp`
- `people`
- `peopleCircle`
- `peopleCircleOutline`
- `peopleCircleSharp`
- `peopleOutline`
- `peopleSharp`
- `person`
- `personAdd`
- `personAddOutline`
- `personAddSharp`
- `personCircle`
- `personCircleOutline`
- `personCircleSharp`
- `personOutline`
- `personRemove`
- `personRemoveOutline`
- `personRemoveSharp`
- `personSharp`
- `personStalker`
- `phoneLandscape`
- `phoneLandscapeOutline`
- `phoneLandscapeSharp`
- `phonePortrait`
- `phonePortraitOutline`
- `phonePortraitSharp`
- `pieChart`
- `pieChartOutline`
- `pieChartSharp`
- `pin`
- `pinOutline`
- `pinSharp`
- `pinpoint`
- `pint`
- `pintOutline`
- `pintSharp`
- `pizza`
- `pizzaOutline`
- `pizzaSharp`
- `plane`
- `planet`
- `planetOutline`
- `planetSharp`
- `play`
- `playBack`
- `playBackCircle`
- `playBackCircleOutline`
- `playBackCircleSharp`
- `playBackOutline`
- `playBackSharp`
- `playCircle`
- `playCircleOutline`
- `playCircleSharp`
- `playForward`
- `playForwardCircle`
- `playForwardCircleOutline`
- `playForwardCircleSharp`
- `playForwardOutline`
- `playForwardSharp`
- `playOutline`
- `playSharp`
- `playSkipBack`
- `playSkipBackCircle`
- `playSkipBackCircleOutline`
- `playSkipBackCircleSharp`
- `playSkipBackOutline`
- `playSkipBackSharp`
- `playSkipForward`
- `playSkipForwardCircle`
- `playSkipForwardCircleOutline`
- `playSkipForwardCircleSharp`
- `playSkipForwardOutline`
- `playSkipForwardSharp`
- `playstation`
- `plus`
- `plusCircled`
- `plusRound`
- `podium`
- `podiumOutline`
- `podiumSharp`
- `pound`
- `power`
- `powerOutline`
- `powerSharp`
- `pricetag`
- `pricetagOutline`
- `pricetagSharp`
- `pricetags`
- `pricetagsOutline`
- `pricetagsSharp`
- `print`
- `printOutline`
- `printSharp`
- `printer`
- `prism`
- `prismOutline`
- `prismSharp`
- `pullRequest`
- `pulse`
- `pulseOutline`
- `pulseSharp`
- `push`
- `pushOutline`
- `pushSharp`
- `qrCode`
- `qrCodeOutline`
- `qrCodeSharp`
- `qrScanner`
- `quote`
- `radio`
- `radioButtonOff`
- `radioButtonOffOutline`
- `radioButtonOffSharp`
- `radioButtonOn`
- `radioButtonOnOutline`
- `radioButtonOnSharp`
- `radioOutline`
- `radioSharp`
- `radioWaves`
- `rainy`
- `rainyOutline`
- `rainySharp`
- `reader`
- `readerOutline`
- `readerSharp`
- `receipt`
- `receiptOutline`
- `receiptSharp`
- `record`
- `recording`
- `recordingOutline`
- `recordingSharp`
- `refresh`
- `refreshCircle`
- `refreshCircleOutline`
- `refreshCircleSharp`
- `refreshOutline`
- `refreshSharp`
- `reload`
- `reloadCircle`
- `reloadCircleOutline`
- `reloadCircleSharp`
- `reloadOutline`
- `reloadSharp`
- `remove`
- `removeCircle`
- `removeCircleOutline`
- `removeCircleSharp`
- `removeOutline`
- `removeSharp`
- `reorderFour`
- `reorderFourOutline`
- `reorderFourSharp`
- `reorderThree`
- `reorderThreeOutline`
- `reorderThreeSharp`
- `reorderTwo`
- `reorderTwoOutline`
- `reorderTwoSharp`
- `repeat`
- `repeatOutline`
- `repeatSharp`
- `reply`
- `replyAll`
- `resize`
- `resizeOutline`
- `resizeSharp`
- `restaurant`
- `restaurantOutline`
- `restaurantSharp`
- `returnDownBack`
- `returnDownBackOutline`
- `returnDownBackSharp`
- `returnDownForward`
- `returnDownForwardOutline`
- `returnDownForwardSharp`
- `returnUpBack`
- `returnUpBackOutline`
- `returnUpBackSharp`
- `returnUpForward`
- `returnUpForwardOutline`
- `returnUpForwardSharp`
- `ribbon`
- `ribbonA`
- `ribbonB`
- `ribbonOutline`
- `ribbonSharp`
- `rocket`
- `rocketOutline`
- `rocketSharp`
- `rose`
- `roseOutline`
- `roseSharp`
- `sad`
- `sadOutline`
- `sadSharp`
- `save`
- `saveOutline`
- `saveSharp`
- `scale`
- `scaleOutline`
- `scaleSharp`
- `scan`
- `scanCircle`
- `scanCircleOutline`
- `scanCircleSharp`
- `scanOutline`
- `scanSharp`
- `school`
- `schoolOutline`
- `schoolSharp`
- `scissors`
- `search`
- `searchCircle`
- `searchCircleOutline`
- `searchCircleSharp`
- `searchOutline`
- `searchSharp`
- `send`
- `sendOutline`
- `sendSharp`
- `server`
- `serverOutline`
- `serverSharp`
- `settings`
- `settingsOutline`
- `settingsSharp`
- `shapes`
- `shapesOutline`
- `shapesSharp`
- `share`
- `shareOutline`
- `shareSharp`
- `shareSocial`
- `shareSocialOutline`
- `shareSocialSharp`
- `shield`
- `shieldCheckmark`
- `shieldCheckmarkOutline`
- `shieldCheckmarkSharp`
- `shieldHalf`
- `shieldHalfOutline`
- `shieldHalfSharp`
- `shieldOutline`
- `shieldSharp`
- `shirt`
- `shirtOutline`
- `shirtSharp`
- `shuffle`
- `shuffleOutline`
- `shuffleSharp`
- `skipBackward`
- `skipForward`
- `skull`
- `skullOutline`
- `skullSharp`
- `snow`
- `snowOutline`
- `snowSharp`
- `socialAndroidOutline`
- `socialAngularOutline`
- `socialAppleOutline`
- `socialBitcoinOutline`
- `socialBufferOutline`
- `socialChromeOutline`
- `socialCodepenOutline`
- `socialCss3Outline`
- `socialDesignernewsOutline`
- `socialDribbble`
- `socialDropboxOutline`
- `socialEuroOutline`
- `socialFacebook`
- `socialFacebookOutline`
- `socialFoursquareOutline`
- `socialGithubOutline`
- `socialGoogle`
- `socialGoogleOutline`
- `socialGoogleplus`
- `socialGoogleplusOutline`
- `socialHackernewsOutline`
- `socialHtml5Outline`
- `socialInstagram`
- `socialInstagramOutline`
- `socialJavascriptOutline`
- `socialLinkedinOutline`
- `socialOctocat`
- `socialPinterestOutline`
- `socialReddit`
- `socialRssOutline`
- `socialSkypeOutline`
- `socialSnapchatOutline`
- `socialTumblrOutline`
- `socialTux`
- `socialTwitch`
- `socialTwitterOutline`
- `socialUsdOutline`
- `socialVimeo`
- `socialVimeoOutline`
- `socialWhatsappOutline`
- `socialWindowsOutline`
- `socialWordpressOutline`
- `socialYahooOutline`
- `socialYenOutline`
- `socialYoutubeOutline`
- `soupCan`
- `soupCanOutline`
- `sparkles`
- `sparklesOutline`
- `sparklesSharp`
- `speakerphone`
- `speedometer`
- `speedometerOutline`
- `speedometerSharp`
- `spoon`
- `square`
- `squareOutline`
- `squareSharp`
- `star`
- `starHalf`
- `starHalfOutline`
- `starHalfSharp`
- `starOutline`
- `starSharp`
- `statsBars`
- `statsChart`
- `statsChartOutline`
- `statsChartSharp`
- `steam`
- `stop`
- `stopCircle`
- `stopCircleOutline`
- `stopCircleSharp`
- `stopOutline`
- `stopSharp`
- `stopwatch`
- `stopwatchOutline`
- `stopwatchSharp`
- `storefront`
- `storefrontOutline`
- `storefrontSharp`
- `subway`
- `subwayOutline`
- `subwaySharp`
- `sunny`
- `sunnyOutline`
- `sunnySharp`
- `swapHorizontal`
- `swapHorizontalOutline`
- `swapHorizontalSharp`
- `swapVertical`
- `swapVerticalOutline`
- `swapVerticalSharp`
- `sync`
- `syncCircle`
- `syncCircleOutline`
- `syncCircleSharp`
- `syncOutline`
- `syncSharp`
- `tabletLandscape`
- `tabletLandscapeOutline`
- `tabletLandscapeSharp`
- `tabletPortrait`
- `tabletPortraitOutline`
- `tabletPortraitSharp`
- `telescope`
- `telescopeOutline`
- `telescopeSharp`
- `tennisball`
- `tennisballOutline`
- `tennisballSharp`
- `terminal`
- `terminalOutline`
- `terminalSharp`
- `text`
- `textOutline`
- `textSharp`
- `thermometer`
- `thermometerOutline`
- `thermometerSharp`
- `thumbsDown`
- `thumbsDownOutline`
- `thumbsDownSharp`
- `thumbsUp`
- `thumbsUpOutline`
- `thumbsUpSharp`
- `thumbsdown`
- `thumbsup`
- `thunderstorm`
- `thunderstormOutline`
- `thunderstormSharp`
- `ticket`
- `ticketOutline`
- `ticketSharp`
- `time`
- `timeOutline`
- `timeSharp`
- `timer`
- `timerOutline`
- `timerSharp`
- `today`
- `todayOutline`
- `todaySharp`
- `toggle`
- `toggleFilled`
- `toggleOutline`
- `toggleSharp`
- `trailSign`
- `trailSignOutline`
- `trailSignSharp`
- `train`
- `trainOutline`
- `trainSharp`
- `transgender`
- `transgenderOutline`
- `transgenderSharp`
- `trash`
- `trashA`
- `trashB`
- `trashBin`
- `trashBinOutline`
- `trashBinSharp`
- `trashOutline`
- `trashSharp`
- `trendingDown`
- `trendingDownOutline`
- `trendingDownSharp`
- `trendingUp`
- `trendingUpOutline`
- `trendingUpSharp`
- `triangle`
- `triangleOutline`
- `triangleSharp`
- `trophy`
- `trophyOutline`
- `trophySharp`
- `tshirt`
- `tshirtOutline`
- `tv`
- `tvOutline`
- `tvSharp`
- `umbrella`
- `umbrellaOutline`
- `umbrellaSharp`
- `university`
- `unlink`
- `unlinkOutline`
- `unlinkSharp`
- `unlocked`
- `upload`
- `usb`
- `videocam`
- `videocamOff`
- `videocamOffOutline`
- `videocamOffSharp`
- `videocamOutline`
- `videocamSharp`
- `videocamera`
- `volumeHigh`
- `volumeHighOutline`
- `volumeHighSharp`
- `volumeLow`
- `volumeLowOutline`
- `volumeLowSharp`
- `volumeMedium`
- `volumeMediumOutline`
- `volumeMediumSharp`
- `volumeMute`
- `volumeMuteOutline`
- `volumeMuteSharp`
- `volumeOff`
- `volumeOffOutline`
- `volumeOffSharp`
- `walk`
- `walkOutline`
- `walkSharp`
- `wallet`
- `walletOutline`
- `walletSharp`
- `wand`
- `warning`
- `warningOutline`
- `warningSharp`
- `watch`
- `watchOutline`
- `watchSharp`
- `water`
- `waterOutline`
- `waterSharp`
- `waterdrop`
- `wifi`
- `wifiOutline`
- `wifiSharp`
- `wine`
- `wineOutline`
- `wineSharp`
- `wineglass`
- `woman`
- `womanOutline`
- `womanSharp`
- `wrench`
- `xbox`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccessibilityIcon, AccessibilityOutlineIcon, AccessibilitySharpIcon, AddIcon } from '@stacksjs/iconify-ion'

  global.navIcons = {
    home: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    about: AccessibilityOutlineIcon({ size: 20, class: 'nav-icon' }),
    contact: AccessibilitySharpIcon({ size: 20, class: 'nav-icon' }),
    settings: AddIcon({ size: 20, class: 'nav-icon' })
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
import { AccessibilityIcon } from '@stacksjs/iconify-ion'

const icon = AccessibilityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccessibilityIcon, AccessibilityOutlineIcon, AccessibilitySharpIcon } from '@stacksjs/iconify-ion'

const successIcon = AccessibilityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccessibilityOutlineIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccessibilitySharpIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccessibilityIcon, AccessibilityOutlineIcon } from '@stacksjs/iconify-ion'
   const icon = AccessibilityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility, accessibilityOutline } from '@stacksjs/iconify-ion'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccessibilityIcon, AccessibilityOutlineIcon } from '@stacksjs/iconify-ion'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-ion'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccessibilityIcon } from '@stacksjs/iconify-ion'
     global.icon = AccessibilityIcon({ size: 24 })
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
   const icon = AccessibilityIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility } from '@stacksjs/iconify-ion'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/ionic-team/ionicons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Ben Sperry ([Website](https://github.com/ionic-team/ionicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ion/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ion/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
