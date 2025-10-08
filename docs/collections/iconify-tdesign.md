# TDesign Icons

> TDesign Icons icons for stx from Iconify

## Overview

This package provides access to 2138 icons from the TDesign Icons collection through the stx iconify integration.

**Collection ID:** `tdesign`
**Total Icons:** 2138
**Author:** TDesign ([Website](https://github.com/Tencent/tdesign-icons))
**License:** MIT ([Details](https://github.com/Tencent/tdesign-icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-tdesign
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccessibilityIcon, AccessibilityFilledIcon, ActivityIcon } from '@stacksjs/iconify-tdesign'

// Basic usage
const icon = AccessibilityIcon()

// With size
const sizedIcon = AccessibilityIcon({ size: 24 })

// With color
const coloredIcon = AccessibilityFilledIcon({ color: 'red' })

// With multiple props
const customIcon = ActivityIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccessibilityIcon, AccessibilityFilledIcon, ActivityIcon } from '@stacksjs/iconify-tdesign'

  global.icons = {
    home: AccessibilityIcon({ size: 24 }),
    user: AccessibilityFilledIcon({ size: 24, color: '#4a90e2' }),
    settings: ActivityIcon({ size: 32 })
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
import { accessibility, accessibilityFilled, activity } from '@stacksjs/iconify-tdesign'
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

This package contains **2138** icons:

- `accessibility`
- `accessibilityFilled`
- `activity`
- `activityFilled`
- `add`
- `addAndSubtract`
- `addCircle`
- `addCircleFilled`
- `addRectangle`
- `addRectangleFilled`
- `addressBook`
- `addressBookFilled`
- `adjustment`
- `adjustmentFilled`
- `airplayWave`
- `airplayWaveFilled`
- `alarm`
- `alarmAdd`
- `alarmAddFilled`
- `alarmFilled`
- `alarmOff`
- `alarmOffFilled`
- `alignBottom`
- `alignTop`
- `alignVertical`
- `alpha`
- `analytics`
- `analyticsFilled`
- `anchor`
- `angry`
- `angryFilled`
- `animation`
- `animation1`
- `animation1Filled`
- `animationFilled`
- `anticlockwise`
- `anticlockwiseFilled`
- `api`
- `app`
- `appFilled`
- `apple`
- `appleFilled`
- `application`
- `applicationFilled`
- `architectureHuiStyle`
- `architectureHuiStyleFilled`
- `archway`
- `archway1`
- `archway1Filled`
- `archwayFilled`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownCircleFilled`
- `arrowDownRectangle`
- `arrowDownRectangleFilled`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftCircleFilled`
- `arrowLeftDown`
- `arrowLeftDownCircle`
- `arrowLeftDownCircleFilled`
- `arrowLeftRight1`
- `arrowLeftRight2`
- `arrowLeftRight3`
- `arrowLeftRightCircle`
- `arrowLeftRightCircleFilled`
- `arrowLeftUp`
- `arrowLeftUpCircle`
- `arrowLeftUpCircleFilled`
- `arrowRight`
- `arrowRightCircle`
- `arrowRightCircleFilled`
- `arrowRightDown`
- `arrowRightDownCircle`
- `arrowRightDownCircleFilled`
- `arrowRightUp`
- `arrowRightUpCircle`
- `arrowRightUpCircleFilled`
- `arrowTriangleDown`
- `arrowTriangleDownFilled`
- `arrowTriangleUp`
- `arrowTriangleUpFilled`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpCircleFilled`
- `arrowUpDown1`
- `arrowUpDown2`
- `arrowUpDown3`
- `arrowUpDownCircle`
- `arrowUpDownCircleFilled`
- `artboard`
- `article`
- `articleFilled`
- `assignment`
- `assignmentChecked`
- `assignmentCheckedFilled`
- `assignmentCode`
- `assignmentCodeFilled`
- `assignmentError`
- `assignmentErrorFilled`
- `assignmentFilled`
- `assignmentUser`
- `assignmentUserFilled`
- `attach`
- `attic`
- `attic1`
- `attic1Filled`
- `atticFilled`
- `audio`
- `audioFilled`
- `awkward`
- `awkwardFilled`
- `backtop`
- `backtopRectangle`
- `backtopRectangleFilled`
- `backup`
- `backupFilled`
- `backward`
- `backwardFilled`
- `badLaugh`
- `badLaughFilled`
- `bambooShoot`
- `bambooShootFilled`
- `banana`
- `bananaFilled`
- `barbecue`
- `barbecueFilled`
- `barcode`
- `barcode1`
- `baseStation`
- `battery`
- `batteryAdd`
- `batteryAddFilled`
- `batteryCharging`
- `batteryChargingFilled`
- `batteryFilled`
- `batteryLow`
- `batteryLowFilled`
- `bean`
- `beanFilled`
- `beer`
- `beerFilled`
- `beta`
- `bifurcate`
- `bifurcateFilled`
- `bill`
- `billFilled`
- `blockchain`
- `bluetooth`
- `bone`
- `boneFilled`
- `book`
- `bookFilled`
- `bookOpen`
- `bookOpenFilled`
- `bookUnknown`
- `bookUnknownFilled`
- `bookmark`
- `bookmarkAdd`
- `bookmarkAddFilled`
- `bookmarkChecked`
- `bookmarkCheckedFilled`
- `bookmarkDouble`
- `bookmarkDoubleFilled`
- `bookmarkFilled`
- `bookmarkMinus`
- `bookmarkMinusFilled`
- `braces`
- `brackets`
- `bread`
- `breadFilled`
- `bridge`
- `bridge1`
- `bridge1Filled`
- `bridge2`
- `bridge2Filled`
- `bridge3`
- `bridge4`
- `bridge5`
- `bridge5Filled`
- `bridge6`
- `bridge6Filled`
- `brightness`
- `brightness1`
- `brightness1Filled`
- `brightnessFilled`
- `broccoli`
- `broccoliFilled`
- `browse`
- `browseFilled`
- `browseGallery`
- `browseGalleryFilled`
- `browseOff`
- `browseOffFilled`
- `brush`
- `brushFilled`
- `bug`
- `bugFilled`
- `bugReport`
- `bugReportFilled`
- `building`
- `building1`
- `building1Filled`
- `building2`
- `building2Filled`
- `building3`
- `building3Filled`
- `building4`
- `building4Filled`
- `building5`
- `building5Filled`
- `buildingFilled`
- `bulletpoint`
- `button`
- `buttonFilled`
- `cabbage`
- `cabbageFilled`
- `cake`
- `cakeFilled`
- `calculation`
- `calculation1`
- `calculation1Filled`
- `calculator`
- `calculator1`
- `calculatorFilled`
- `calendar`
- `calendar1`
- `calendar1Filled`
- `calendar2`
- `calendar2Filled`
- `calendarEdit`
- `calendarEditFilled`
- `calendarEvent`
- `calendarEventFilled`
- `calendarFilled`
- `call`
- `call1`
- `call1Filled`
- `callCancel`
- `callCancelFilled`
- `callFilled`
- `callForwarded`
- `callForwardedFilled`
- `callIncoming`
- `callIncomingFilled`
- `callOff`
- `callOffFilled`
- `calm`
- `calm1`
- `calm1Filled`
- `calmFilled`
- `camera`
- `camera1`
- `camera1Filled`
- `camera2`
- `camera2Filled`
- `cameraFilled`
- `cameraOff`
- `cameraOffFilled`
- `candy`
- `candyFilled`
- `card`
- `cardFilled`
- `cardmembership`
- `cardmembershipFilled`
- `caretDown`
- `caretDownSmall`
- `caretLeft`
- `caretLeftSmall`
- `caretRight`
- `caretRightSmall`
- `caretUp`
- `caretUpSmall`
- `cart`
- `cartAdd`
- `cartAddFilled`
- `cartFilled`
- `cast`
- `castFilled`
- `castle`
- `castle1`
- `castle1Filled`
- `castle2`
- `castle2Filled`
- `castle3`
- `castle3Filled`
- `castle4`
- `castle4Filled`
- `castle5`
- `castle5Filled`
- `castle6`
- `castle6Filled`
- `castle7`
- `castle7Filled`
- `castleFilled`
- `cat`
- `catFilled`
- `catalog`
- `catalogFilled`
- `cd`
- `cdFilled`
- `celsius`
- `centerFocusStrong`
- `centerFocusStrongFilled`
- `centimeter`
- `certificate`
- `certificate1`
- `certificate1Filled`
- `certificateFilled`
- `chart`
- `chart3d`
- `chart3dFilled`
- `chartAdd`
- `chartAddFilled`
- `chartAnalytics`
- `chartArea`
- `chartAreaFilled`
- `chartAreaMulti`
- `chartAreaMultiFilled`
- `chartBar`
- `chartBarFilled`
- `chartBubble`
- `chartBubbleFilled`
- `chartColumn`
- `chartColumnFilled`
- `chartCombo`
- `chartComboFilled`
- `chartFilled`
- `chartLine`
- `chartLineData`
- `chartLineData1`
- `chartLineMulti`
- `chartMaximum`
- `chartMedian`
- `chartMinimum`
- `chartPie`
- `chartPieFilled`
- `chartRadar`
- `chartRadarFilled`
- `chartRadial`
- `chartRing`
- `chartRing1`
- `chartRing1Filled`
- `chartRingFilled`
- `chartScatter`
- `chartStacked`
- `chartStackedFilled`
- `chat`
- `chatAdd`
- `chatAddFilled`
- `chatBubble`
- `chatBubble1`
- `chatBubble1Filled`
- `chatBubbleAdd`
- `chatBubbleAddFilled`
- `chatBubbleError`
- `chatBubbleErrorFilled`
- `chatBubbleFilled`
- `chatBubbleHelp`
- `chatBubbleHelpFilled`
- `chatBubbleHistory`
- `chatBubbleHistoryFilled`
- `chatBubbleLocked`
- `chatBubbleLockedFilled`
- `chatBubbleSmile`
- `chatBubbleSmileFilled`
- `chatChecked`
- `chatCheckedFilled`
- `chatClear`
- `chatClearFilled`
- `chatDouble`
- `chatDoubleFilled`
- `chatError`
- `chatErrorFilled`
- `chatFilled`
- `chatHeart`
- `chatHeartFilled`
- `chatMessage`
- `chatMessageFilled`
- `chatOff`
- `chatOffFilled`
- `chatPoll`
- `chatPollFilled`
- `chatSetting`
- `chatSettingFilled`
- `check`
- `checkCircle`
- `checkCircleFilled`
- `checkDouble`
- `checkRectangle`
- `checkRectangleFilled`
- `cheese`
- `cheeseFilled`
- `cherry`
- `cherryFilled`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownCircleFilled`
- `chevronDownDouble`
- `chevronDownDoubleS`
- `chevronDownRectangle`
- `chevronDownRectangleFilled`
- `chevronDownS`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronLeftCircleFilled`
- `chevronLeftDouble`
- `chevronLeftDoubleS`
- `chevronLeftRectangle`
- `chevronLeftRectangleFilled`
- `chevronLeftS`
- `chevronRight`
- `chevronRightCircle`
- `chevronRightCircleFilled`
- `chevronRightDouble`
- `chevronRightDoubleS`
- `chevronRightRectangle`
- `chevronRightRectangleFilled`
- `chevronRightS`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpCircleFilled`
- `chevronUpDouble`
- `chevronUpDoubleS`
- `chevronUpRectangle`
- `chevronUpRectangleFilled`
- `chevronUpS`
- `chicken`
- `chili`
- `chiliFilled`
- `chimney`
- `chimney1`
- `chimney1Filled`
- `chimney2`
- `chimney2Filled`
- `chimneyFilled`
- `chineseCabbage`
- `chineseCabbageFilled`
- `church`
- `churchFilled`
- `circle`
- `circleFilled`
- `city`
- `city1`
- `city1Filled`
- `city10`
- `city10Filled`
- `city11`
- `city11Filled`
- `city12`
- `city12Filled`
- `city13`
- `city13Filled`
- `city14`
- `city14Filled`
- `city15`
- `city15Filled`
- `city2`
- `city2Filled`
- `city3`
- `city3Filled`
- `city4`
- `city4Filled`
- `city5`
- `city5Filled`
- `city6`
- `city6Filled`
- `city7`
- `city7Filled`
- `city8`
- `city8Filled`
- `city9`
- `city9Filled`
- `cityAncient`
- `cityAncient1`
- `cityAncient1Filled`
- `cityAncient2`
- `cityAncient2Filled`
- `cityAncientFilled`
- `cityFilled`
- `clear`
- `clearFilled`
- `clearFormatting`
- `clearFormatting1`
- `clearFormatting1Filled`
- `clearFormattingFilled`
- `close`
- `closeCircle`
- `closeCircleFilled`
- `closeOctagon`
- `closeOctagonFilled`
- `closeRectangle`
- `closeRectangleFilled`
- `cloud`
- `cloudDownload`
- `cloudFilled`
- `cloudUpload`
- `cloudyDay`
- `cloudyDayFilled`
- `cloudyNight`
- `cloudyNightFilled`
- `cloudyNightRain`
- `cloudyNightRainFilled`
- `cloudyRain`
- `cloudyRainFilled`
- `cloudySunny`
- `cloudySunnyFilled`
- `code`
- `code1`
- `codeOff`
- `cola`
- `colaFilled`
- `collage`
- `collageFilled`
- `collection`
- `collectionFilled`
- `colorInvert`
- `colorInvertFilled`
- `combination`
- `combinationFilled`
- `command`
- `compass`
- `compass1`
- `compass1Filled`
- `compassFilled`
- `componentBreadcrumb`
- `componentBreadcrumbFilled`
- `componentCheckbox`
- `componentCheckboxFilled`
- `componentDividerHorizontal`
- `componentDividerHorizontalFilled`
- `componentDividerVertical`
- `componentDividerVerticalFilled`
- `componentDropdown`
- `componentDropdownFilled`
- `componentGrid`
- `componentGridFilled`
- `componentInput`
- `componentInputFilled`
- `componentLayout`
- `componentLayoutFilled`
- `componentRadio`
- `componentSpace`
- `componentSpaceFilled`
- `componentSteps`
- `componentStepsFilled`
- `componentSwitch`
- `componentSwitchFilled`
- `constraint`
- `contrast`
- `contrast1`
- `contrast1Filled`
- `contrastFilled`
- `controlPlatform`
- `controlPlatformFilled`
- `cooperate`
- `cooperateFilled`
- `coordinateSystem`
- `coordinateSystemFilled`
- `copy`
- `copyFilled`
- `copyright`
- `copyrightFilled`
- `corn`
- `cornFilled`
- `coupon`
- `couponFilled`
- `course`
- `courseFilled`
- `cpu`
- `cpuFilled`
- `crack`
- `crackFilled`
- `creditcard`
- `creditcardAdd`
- `creditcardAddFilled`
- `creditcardFilled`
- `creditcardOff`
- `creditcardOffFilled`
- `crookedSmile`
- `crookedSmileFilled`
- `cryAndLaugh`
- `cryAndLaughFilled`
- `cryLoudly`
- `cryLoudlyFilled`
- `css3`
- `css3Filled`
- `cucumber`
- `currencyExchange`
- `cursor`
- `cursorFilled`
- `curtain`
- `curtainFilled`
- `curve`
- `cut`
- `cut1`
- `dam`
- `dam1`
- `dam1Filled`
- `dam2`
- `dam2Filled`
- `dam3`
- `dam3Filled`
- `dam4`
- `dam4Filled`
- `dam5`
- `dam5Filled`
- `dam6`
- `dam6Filled`
- `dam7`
- `dam7Filled`
- `damFilled`
- `dartBoard`
- `dartBoardFilled`
- `dashboard`
- `dashboard1`
- `dashboard1Filled`
- `dashboardFilled`
- `data`
- `dataBase`
- `dataBaseFilled`
- `dataChecked`
- `dataCheckedFilled`
- `dataDisplay`
- `dataError`
- `dataErrorFilled`
- `dataFilled`
- `dataSearch`
- `dataSearchFilled`
- `delete`
- `delete1`
- `delete1Filled`
- `deleteFilled`
- `deleteTime`
- `deleteTimeFilled`
- `delta`
- `deltaFilled`
- `depressed`
- `depressedFilled`
- `desktop`
- `desktop1`
- `desktop1Filled`
- `desktopFilled`
- `despise`
- `despiseFilled`
- `device`
- `deviceFilled`
- `discount`
- `discountFilled`
- `dissatisfaction`
- `dissatisfactionFilled`
- `divide`
- `dividers`
- `dividers1`
- `doge`
- `dogeFilled`
- `doubleStorey`
- `doubleStoreyFilled`
- `download`
- `download1`
- `download2`
- `download2Filled`
- `downscale`
- `dragDrop`
- `dragMove`
- `drink`
- `drinkFilled`
- `drumstick`
- `drumstickFilled`
- `dv`
- `dvFilled`
- `dvd`
- `dvdFilled`
- `earphone`
- `earphoneFilled`
- `earth`
- `earthFilled`
- `edit`
- `edit1`
- `edit1Filled`
- `edit2`
- `edit2Filled`
- `editFilled`
- `editOff`
- `editOffFilled`
- `education`
- `educationFilled`
- `eggplant`
- `eggplantFilled`
- `ellipsis`
- `emoEmotional`
- `emoEmotionalFilled`
- `enter`
- `equal`
- `error`
- `errorCircle`
- `errorCircleFilled`
- `errorTriangle`
- `errorTriangleFilled`
- `excited`
- `excited1`
- `excited1Filled`
- `excitedFilled`
- `expandDown`
- `expandDownFilled`
- `expandHorizontal`
- `expandUp`
- `expandUpFilled`
- `expandVertical`
- `explore`
- `exploreFilled`
- `exploreOff`
- `exploreOffFilled`
- `exposure`
- `exposureFilled`
- `extension`
- `extensionFilled`
- `extensionOff`
- `extensionOffFilled`
- `faceRetouching`
- `faceRetouchingFilled`
- `factCheck`
- `factCheckFilled`
- `fahrenheitScale`
- `feelAtEase`
- `feelAtEaseFilled`
- `ferocious`
- `ferociousFilled`
- `ferrisWheel`
- `ferrisWheelFilled`
- `file`
- `file1`
- `file1Filled`
- `fileAdd`
- `fileAdd1`
- `fileAdd1Filled`
- `fileAddFilled`
- `fileAttachment`
- `fileAttachmentFilled`
- `fileBlocked`
- `fileBlockedFilled`
- `fileCode`
- `fileCode1`
- `fileCode1Filled`
- `fileCodeFilled`
- `fileCopy`
- `fileCopyFilled`
- `fileDownload`
- `fileDownloadFilled`
- `fileExcel`
- `fileExcelFilled`
- `fileExport`
- `fileExportFilled`
- `fileFilled`
- `fileIcon`
- `fileIconFilled`
- `fileImage`
- `fileImageFilled`
- `fileImport`
- `fileImportFilled`
- `fileLocked`
- `fileLockedFilled`
- `fileMinus`
- `fileMinusFilled`
- `fileMusic`
- `fileMusicFilled`
- `fileOnenote`
- `fileOnenoteFilled`
- `fileOutlook`
- `fileOutlookFilled`
- `filePaste`
- `filePasteFilled`
- `filePdf`
- `filePdfFilled`
- `filePowerpoint`
- `filePowerpointFilled`
- `fileRestore`
- `fileRestoreFilled`
- `fileSafety`
- `fileSafetyFilled`
- `fileSearch`
- `fileSearchFilled`
- `fileSetting`
- `fileSettingFilled`
- `fileTeams`
- `fileTeamsFilled`
- `fileTransmit`
- `fileTransmitDouble`
- `fileTransmitDoubleFilled`
- `fileTransmitFilled`
- `fileUnknown`
- `fileUnknownFilled`
- `fileUnlocked`
- `fileUnlockedFilled`
- `fileWord`
- `fileWordFilled`
- `fileZip`
- `fileZipFilled`
- `fillColor`
- `fillColor1`
- `fillColor1Filled`
- `fillColorFilled`
- `film`
- `film1`
- `film1Filled`
- `filmFilled`
- `filter`
- `filter1`
- `filter1Filled`
- `filter2`
- `filter2Filled`
- `filter3`
- `filter3Filled`
- `filterClear`
- `filterClearFilled`
- `filterFilled`
- `filterOff`
- `filterOffFilled`
- `filterSort`
- `filterSortFilled`
- `fingerprint`
- `fingerprint1`
- `fingerprint2`
- `fingerprint3`
- `fish`
- `fishFilled`
- `flag`
- `flag1`
- `flag1Filled`
- `flag2`
- `flag2Filled`
- `flag3`
- `flag3Filled`
- `flag4`
- `flag4Filled`
- `flagFilled`
- `flashlight`
- `flashlightFilled`
- `flightLanding`
- `flightLandingFilled`
- `flightTakeoff`
- `flightTakeoffFilled`
- `flipSmilingFace`
- `flipSmilingFaceFilled`
- `flipToBack`
- `flipToBackFilled`
- `flipToFront`
- `flipToFrontFilled`
- `focus`
- `focusFilled`
- `fog`
- `fogFilled`
- `fogNight`
- `fogNightFilled`
- `fogSunny`
- `fogSunnyFilled`
- `folder`
- `folder1`
- `folder1Filled`
- `folderAdd`
- `folderAdd1`
- `folderAdd1Filled`
- `folderAddFilled`
- `folderBlocked`
- `folderBlockedFilled`
- `folderDetails`
- `folderDetailsFilled`
- `folderExport`
- `folderExportFilled`
- `folderFilled`
- `folderImport`
- `folderImportFilled`
- `folderLocked`
- `folderLockedFilled`
- `folderMinus`
- `folderMinusFilled`
- `folderMove`
- `folderMoveFilled`
- `folderOff`
- `folderOffFilled`
- `folderOpen`
- `folderOpen1`
- `folderOpen1Filled`
- `folderOpenFilled`
- `folderSearch`
- `folderSearchFilled`
- `folderSetting`
- `folderSettingFilled`
- `folderShared`
- `folderSharedFilled`
- `folderUnlocked`
- `folderUnlockedFilled`
- `folderZip`
- `folderZipFilled`
- `forest`
- `forestFilled`
- `fork`
- `forkFilled`
- `form`
- `formFilled`
- `formatHorizontalAlignBottom`
- `formatHorizontalAlignCenter`
- `formatHorizontalAlignTop`
- `formatVerticalAlignCenter`
- `formatVerticalAlignLeft`
- `formatVerticalAlignRight`
- `forward`
- `forwardFilled`
- `frame`
- `frame1`
- `frame1Filled`
- `frameFilled`
- `fries`
- `friesFilled`
- `fullscreen`
- `fullscreen1`
- `fullscreen2`
- `fullscreenExit`
- `fullscreenExit1`
- `functionCurve`
- `functions`
- `functions1`
- `gamepad`
- `gamepad1`
- `gamepad1Filled`
- `gamepadFilled`
- `gamma`
- `garlic`
- `garlicFilled`
- `genderFemale`
- `genderMale`
- `gestureApplause`
- `gestureApplauseFilled`
- `gestureClick`
- `gestureClickFilled`
- `gestureDown`
- `gestureDownFilled`
- `gestureExpansion`
- `gestureExpansionFilled`
- `gestureLeft`
- `gestureLeftFilled`
- `gestureLeftSlip`
- `gestureLeftSlipFilled`
- `gestureOpen`
- `gestureOpenFilled`
- `gesturePray`
- `gesturePray1`
- `gesturePrayFilled`
- `gesturePress`
- `gesturePressFilled`
- `gestureRanslation`
- `gestureRanslation1`
- `gestureRanslationFilled`
- `gestureRight`
- `gestureRightFilled`
- `gestureRightSlip`
- `gestureRightSlipFilled`
- `gestureSlideLeftAndRight`
- `gestureSlideLeftAndRightFilled`
- `gestureSlideUp`
- `gestureSlideUpFilled`
- `gestureTyping`
- `gestureTypingFilled`
- `gestureUp`
- `gestureUp2`
- `gestureUpAndDown`
- `gestureUpAndDownFilled`
- `gestureUpFilled`
- `gestureWipeDown`
- `gestureWipeDownFilled`
- `gift`
- `giftFilled`
- `giggle`
- `giggleFilled`
- `gitBranch`
- `gitBranchFilled`
- `gitCommit`
- `gitCommitFilled`
- `gitMerge`
- `gitMergeFilled`
- `gitPullRequest`
- `gitPullRequestFilled`
- `gitRepository`
- `gitRepositoryCommits`
- `gitRepositoryCommitsFilled`
- `gitRepositoryFilled`
- `gitRepositoryPrivate`
- `gitRepositoryPrivateFilled`
- `gps`
- `gpsFilled`
- `grape`
- `grapeFilled`
- `greaterThan`
- `greaterThanOrEqual`
- `greenOnion`
- `gridAdd`
- `gridAddFilled`
- `gridView`
- `gridViewFilled`
- `guitar`
- `guitarFilled`
- `hamburger`
- `hamburgerFilled`
- `happy`
- `happyFilled`
- `hardDiskStorage`
- `hardDiskStorageFilled`
- `hardDrive`
- `hardDriveFilled`
- `hashtag`
- `hd`
- `hdFilled`
- `heart`
- `heartFilled`
- `help`
- `helpCircle`
- `helpCircleFilled`
- `helpRectangle`
- `helpRectangleFilled`
- `highlight`
- `highlight1`
- `highlight1Filled`
- `history`
- `historySetting`
- `home`
- `homeFilled`
- `horizontal`
- `horizontalFilled`
- `hospital`
- `hospital1`
- `hospital1Filled`
- `hospitalFilled`
- `hotspotWave`
- `hotspotWaveFilled`
- `hourglass`
- `hourglassFilled`
- `houses`
- `houses1`
- `houses1Filled`
- `houses2`
- `houses2Filled`
- `housesFilled`
- `html5`
- `html5Filled`
- `https`
- `httpsFilled`
- `iceCream`
- `iceCreamFilled`
- `icon`
- `iconFilled`
- `image`
- `image1`
- `image1Filled`
- `imageAdd`
- `imageAddFilled`
- `imageEdit`
- `imageEditFilled`
- `imageError`
- `imageErrorFilled`
- `imageFilled`
- `imageOff`
- `imageOffFilled`
- `imageSearch`
- `imageSearchFilled`
- `indentLeft`
- `indentRight`
- `indicator`
- `indicatorFilled`
- `infoCircle`
- `infoCircleFilled`
- `ink`
- `inkFilled`
- `install`
- `installDesktop`
- `installDesktopFilled`
- `installFilled`
- `installMobile`
- `installMobileFilled`
- `institution`
- `institutionChecked`
- `institutionCheckedFilled`
- `institutionFilled`
- `internet`
- `internetFilled`
- `ipod`
- `ipodFilled`
- `joyful`
- `joyfulFilled`
- `jump`
- `jumpDouble`
- `jumpOff`
- `key`
- `keyFilled`
- `keyboard`
- `keyboardFilled`
- `laptop`
- `laptopFilled`
- `layers`
- `layersFilled`
- `layout`
- `layoutFilled`
- `leaderboard`
- `leaderboardFilled`
- `lemon`
- `lemonFilled`
- `lemonSlice`
- `lemonSliceFilled`
- `lessThan`
- `lessThanOrEqual`
- `lettersA`
- `lettersB`
- `lettersC`
- `lettersD`
- `lettersE`
- `lettersF`
- `lettersG`
- `lettersH`
- `lettersI`
- `lettersJ`
- `lettersK`
- `lettersL`
- `lettersM`
- `lettersN`
- `lettersO`
- `lettersP`
- `lettersQ`
- `lettersR`
- `lettersS`
- `lettersT`
- `lettersU`
- `lettersV`
- `lettersW`
- `lettersX`
- `lettersY`
- `lettersZ`
- `lightbulb`
- `lightbulbCircle`
- `lightbulbCircleFilled`
- `lightbulbFilled`
- `lighthouse`
- `lighthouse1`
- `lighthouse1Filled`
- `lighthouse2`
- `lighthouse2Filled`
- `lighthouseFilled`
- `lightingCircle`
- `lightingCircleFilled`
- `lineHeight`
- `link`
- `link1`
- `linkUnlink`
- `liquor`
- `liquorFilled`
- `list`
- `listNumbered`
- `load`
- `loading`
- `location`
- `location1`
- `location1Filled`
- `locationEnlargement`
- `locationEnlargementFilled`
- `locationError`
- `locationErrorFilled`
- `locationFilled`
- `locationParkingPlace`
- `locationParkingPlaceFilled`
- `locationReduction`
- `locationReductionFilled`
- `locationSetting`
- `locationSettingFilled`
- `lockOff`
- `lockOffFilled`
- `lockOn`
- `lockOnFilled`
- `lockTime`
- `lockTimeFilled`
- `login`
- `logoAdobeIllustrate`
- `logoAdobeIllustrateFilled`
- `logoAdobeLightroom`
- `logoAdobeLightroomFilled`
- `logoAdobePhotoshop`
- `logoAdobePhotoshopFilled`
- `logoAlipay`
- `logoAlipayFilled`
- `logoAndroid`
- `logoAndroidFilled`
- `logoApple`
- `logoAppleFilled`
- `logoBehance`
- `logoBehanceFilled`
- `logoChrome`
- `logoChromeFilled`
- `logoCinema4d`
- `logoCinema4dFilled`
- `logoCnb`
- `logoCnbFilled`
- `logoCodepen`
- `logoCodesandbox`
- `logoDribbble`
- `logoDribbbleFilled`
- `logoFacebook`
- `logoFacebookFilled`
- `logoFigma`
- `logoFigmaFilled`
- `logoFramer`
- `logoFramerFilled`
- `logoGithub`
- `logoGithubFilled`
- `logoGitlab`
- `logoGitlabFilled`
- `logoIe`
- `logoIeFilled`
- `logoInstagram`
- `logoInstagramFilled`
- `logoMiniprogram`
- `logoMiniprogramFilled`
- `logoQq`
- `logoQqFilled`
- `logoStackblitz`
- `logoStackblitzFilled`
- `logoTwitter`
- `logoTwitterFilled`
- `logoWechat`
- `logoWechatStroke`
- `logoWechatStrokeFilled`
- `logoWechatpay`
- `logoWechatpayFilled`
- `logoWecom`
- `logoWecomFilled`
- `logoWindows`
- `logoWindowsFilled`
- `logoYoutube`
- `logoYoutubeFilled`
- `logout`
- `lookAround`
- `lookAroundFilled`
- `loudspeaker`
- `loudspeakerFilled`
- `mail`
- `mailFilled`
- `map`
- `map3d`
- `map3dFilled`
- `mapAdd`
- `mapAddFilled`
- `mapAiming`
- `mapAimingFilled`
- `mapBlocked`
- `mapBlockedFilled`
- `mapBubble`
- `mapBubbleFilled`
- `mapCancel`
- `mapCancelFilled`
- `mapChat`
- `mapChatFilled`
- `mapChecked`
- `mapCheckedFilled`
- `mapCollection`
- `mapCollectionFilled`
- `mapConnection`
- `mapConnectionFilled`
- `mapDistance`
- `mapDistanceFilled`
- `mapDouble`
- `mapDoubleFilled`
- `mapEdit`
- `mapEditFilled`
- `mapFilled`
- `mapGrid`
- `mapGridFilled`
- `mapInformation`
- `mapInformation1`
- `mapInformation1Filled`
- `mapInformation2`
- `mapInformation2Filled`
- `mapInformationFilled`
- `mapLocation`
- `mapLocationFilled`
- `mapLocked`
- `mapLockedFilled`
- `mapMarked`
- `mapMarkedFilled`
- `mapNavigation`
- `mapNavigationFilled`
- `mapOutline`
- `mapOutlineFilled`
- `mapRoutePlanning`
- `mapRoutePlanningFilled`
- `mapRuler`
- `mapRulerFilled`
- `mapSafety`
- `mapSafetyFilled`
- `mapSearch`
- `mapSearch1`
- `mapSearch1Filled`
- `mapSearchFilled`
- `mapSetting`
- `mapSettingFilled`
- `mapUnlocked`
- `mapUnlockedFilled`
- `markAsUnread`
- `markAsUnreadFilled`
- `markup`
- `markupFilled`
- `mathematics`
- `mathematicsFilled`
- `measurement`
- `measurement1`
- `measurement1Filled`
- `measurement2`
- `measurement2Filled`
- `measurementFilled`
- `meatPepper`
- `meatPepperFilled`
- `mediaLibrary`
- `mediaLibraryFilled`
- `member`
- `memberFilled`
- `menu`
- `menuApplication`
- `menuFilled`
- `menuFold`
- `menuUnfold`
- `mergeCells`
- `mergeCellsFilled`
- `microphone`
- `microphone1`
- `microphone1Filled`
- `microphone2`
- `microphone2Filled`
- `microphoneFilled`
- `milk`
- `milkFilled`
- `minus`
- `minusCircle`
- `minusCircleFilled`
- `minusRectangle`
- `minusRectangleFilled`
- `mirror`
- `mirrorFilled`
- `mobile`
- `mobileBlocked`
- `mobileBlockedFilled`
- `mobileFilled`
- `mobileList`
- `mobileListFilled`
- `mobileNavigation`
- `mobileNavigationFilled`
- `mobileShortcut`
- `mobileShortcutFilled`
- `mobileVibrate`
- `mobileVibrateFilled`
- `modeDark`
- `modeDarkFilled`
- `modeLight`
- `modeLightFilled`
- `module`
- `moduleFilled`
- `money`
- `moneyFilled`
- `monument`
- `monumentFilled`
- `moon`
- `moonFall`
- `moonFallFilled`
- `moonFilled`
- `moonRising`
- `moonRisingFilled`
- `more`
- `mosque`
- `mosque1`
- `mosque1Filled`
- `mosqueFilled`
- `mouse`
- `mouseFilled`
- `move`
- `move1`
- `movieClapper`
- `movieClapperFilled`
- `multiply`
- `museum`
- `museum1`
- `museum1Filled`
- `museum2`
- `museum2Filled`
- `museumFilled`
- `mushroom`
- `mushroom1`
- `mushroom1Filled`
- `mushroomFilled`
- `music`
- `music1`
- `music1Filled`
- `music2`
- `music2Filled`
- `musicFilled`
- `musicRectangleAdd`
- `musicRectangleAddFilled`
- `navigationArrow`
- `navigationArrowFilled`
- `next`
- `nextFilled`
- `noExpression`
- `noExpressionFilled`
- `noResult`
- `noResultFilled`
- `noodle`
- `noodleFilled`
- `notification`
- `notificationAdd`
- `notificationAddFilled`
- `notificationCircle`
- `notificationCircleFilled`
- `notificationError`
- `notificationErrorFilled`
- `notificationFilled`
- `numbers0`
- `numbers01`
- `numbers1`
- `numbers11`
- `numbers2`
- `numbers21`
- `numbers3`
- `numbers31`
- `numbers4`
- `numbers41`
- `numbers5`
- `numbers51`
- `numbers6`
- `numbers61`
- `numbers7`
- `numbers71`
- `numbers8`
- `numbers81`
- `numbers9`
- `numbers91`
- `nut`
- `nutFilled`
- `objectStorage`
- `openMouth`
- `openMouthFilled`
- `opera`
- `operaFilled`
- `orderAdjustmentColumn`
- `orderAscending`
- `orderDescending`
- `outbox`
- `outboxFilled`
- `pageFirst`
- `pageHead`
- `pageHeadFilled`
- `pageLast`
- `palace`
- `palace1`
- `palace1Filled`
- `palace2`
- `palace2Filled`
- `palace3`
- `palace3Filled`
- `palace4`
- `palace4Filled`
- `palaceFilled`
- `palette`
- `palette1`
- `palette1Filled`
- `paletteFilled`
- `panoramaHorizontal`
- `panoramaHorizontalFilled`
- `panoramaVertical`
- `panoramaVerticalFilled`
- `pantone`
- `pantoneFilled`
- `parabola`
- `parentheses`
- `paste`
- `pasteFilled`
- `patio`
- `patioFilled`
- `pause`
- `pauseCircle`
- `pauseCircleFilled`
- `pauseCircleStroke`
- `pauseCircleStrokeFilled`
- `pea`
- `peaFilled`
- `peach`
- `peachFilled`
- `pear`
- `pearFilled`
- `pearlOfTheOrient`
- `pearlOfTheOrientFilled`
- `pen`
- `penBall`
- `penBallFilled`
- `penBrush`
- `penBrushFilled`
- `penFilled`
- `penMark`
- `penMarkFilled`
- `penQuill`
- `penQuillFilled`
- `pending`
- `pendingFilled`
- `percent`
- `personalInformation`
- `personalInformationFilled`
- `phoneLocked`
- `phoneLockedFilled`
- `phoneSearch`
- `phoneSearchFilled`
- `pi`
- `piano`
- `pianoFilled`
- `pin`
- `pinFilled`
- `play`
- `playCircle`
- `playCircleFilled`
- `playCircleStroke`
- `playCircleStrokeAdd`
- `playCircleStrokeAddFilled`
- `playCircleStrokeFilled`
- `playDemo`
- `playDemoFilled`
- `playRectangle`
- `playRectangleFilled`
- `plus`
- `popsicle`
- `popsicleFilled`
- `portrait`
- `portraitFilled`
- `pout`
- `poutFilled`
- `poweroff`
- `preciseMonitor`
- `previous`
- `previousFilled`
- `print`
- `printFilled`
- `pumpkin`
- `pumpkinFilled`
- `pyramid`
- `pyramidFilled`
- `pyramidMaya`
- `pyramidMayaFilled`
- `qrcode`
- `quadratic`
- `questionnaire`
- `questionnaireDouble`
- `questionnaireDoubleFilled`
- `questionnaireFilled`
- `queue`
- `queueFilled`
- `quote`
- `quoteFilled`
- `radar`
- `radio1`
- `radio1Filled`
- `radio2`
- `radio2Filled`
- `radish`
- `radishFilled`
- `rainHeavy`
- `rainLight`
- `rainLightFilled`
- `rainMedium`
- `rainbow`
- `rectangle`
- `rectangleFilled`
- `refresh`
- `relation`
- `relativity`
- `relativityFilled`
- `remoteWave`
- `remoteWaveFilled`
- `remove`
- `replay`
- `replayFilled`
- `rice`
- `riceBall`
- `riceBallFilled`
- `riceFilled`
- `roast`
- `roastFilled`
- `rocket`
- `rocketFilled`
- `rollback`
- `rollfront`
- `rootList`
- `rootListFilled`
- `rotate`
- `rotateLocked`
- `rotateLockedFilled`
- `rotation`
- `round`
- `roundFilled`
- `routerWave`
- `routerWaveFilled`
- `rss`
- `ruler`
- `rulerFilled`
- `sailingHotel`
- `sailingHotelFilled`
- `sandwich`
- `sandwichFilled`
- `saturation`
- `saturationFilled`
- `sausage`
- `sausageFilled`
- `save`
- `saveFilled`
- `savingPot`
- `savingPotFilled`
- `scan`
- `screen4k`
- `screen4kFilled`
- `screencast`
- `screencastFilled`
- `screenshot`
- `scrollBar`
- `scrollBarFilled`
- `sdCard`
- `sdCard1`
- `sdCard1Filled`
- `sdCardFilled`
- `seal`
- `sealFilled`
- `search`
- `searchError`
- `searchErrorFilled`
- `searchFilled`
- `secured`
- `securedFilled`
- `send`
- `sendCancel`
- `sendCancelFilled`
- `sendFilled`
- `sensors`
- `sensors1`
- `sensors2`
- `sensorsOff`
- `sequence`
- `sequenceFilled`
- `serenity`
- `serenityFilled`
- `server`
- `serverFilled`
- `service`
- `serviceFilled`
- `setting`
- `setting1`
- `setting1Filled`
- `settingFilled`
- `share`
- `share1`
- `share1Filled`
- `shareFilled`
- `sharpness`
- `sharpnessFilled`
- `shieldError`
- `shieldErrorFilled`
- `shimen`
- `shimenFilled`
- `shop`
- `shop1`
- `shop1Filled`
- `shop2`
- `shop2Filled`
- `shop3`
- `shop3Filled`
- `shop4`
- `shop4Filled`
- `shop5`
- `shop5Filled`
- `shopFilled`
- `shrimp`
- `shrimpFilled`
- `shrinkHorizontal`
- `shrinkVertical`
- `shutter`
- `shutterFilled`
- `shutup`
- `shutupFilled`
- `simCard`
- `simCard1`
- `simCard1Filled`
- `simCard2`
- `simCard2Filled`
- `simCardFilled`
- `sinisterSmile`
- `sinisterSmileFilled`
- `sip`
- `sipFilled`
- `sitemap`
- `sitemapFilled`
- `slash`
- `sleep`
- `sleepFilled`
- `slice`
- `sliceFilled`
- `slideshow`
- `slideshowFilled`
- `smile`
- `smileFilled`
- `sneer`
- `sneerFilled`
- `snowflake`
- `sonic`
- `sound`
- `soundDown`
- `soundDownFilled`
- `soundFilled`
- `soundHigh`
- `soundHighFilled`
- `soundLow`
- `soundLowFilled`
- `soundMute`
- `soundMute1`
- `soundMute1Filled`
- `soundMuteFilled`
- `soundUp`
- `soundUpFilled`
- `space`
- `speechless`
- `speechless1`
- `speechless1Filled`
- `speechlessFilled`
- `star`
- `starFilled`
- `statueOfJesus`
- `statueOfJesusFilled`
- `stickyNote`
- `stickyNoteFilled`
- `stop`
- `stopCircle`
- `stopCircleFilled`
- `stopCircleStroke`
- `stopCircleStrokeFilled`
- `store`
- `storeFilled`
- `streetRoad`
- `streetRoad1`
- `streetRoad1Filled`
- `streetRoadFilled`
- `subtitle`
- `subtitleFilled`
- `subwayLine`
- `subwayLineFilled`
- `sum`
- `sunFall`
- `sunFallFilled`
- `sunRising`
- `sunRisingFilled`
- `sunny`
- `sunnyFilled`
- `support`
- `supportFilled`
- `surprised`
- `surprised1`
- `surprised1Filled`
- `surprisedFilled`
- `swap`
- `swapLeft`
- `swapRight`
- `swear1`
- `swear1Filled`
- `swear2`
- `swear2Filled`
- `system2`
- `system3`
- `system3Filled`
- `systemApplication`
- `systemApplicationFilled`
- `systemBlocked`
- `systemBlockedFilled`
- `systemCode`
- `systemCodeFilled`
- `systemComponents`
- `systemComponentsFilled`
- `systemCoordinate`
- `systemCoordinateFilled`
- `systemDevice`
- `systemDeviceFilled`
- `systemInterface`
- `systemInterfaceFilled`
- `systemLocation`
- `systemLocationFilled`
- `systemLocked`
- `systemLockedFilled`
- `systemLog`
- `systemLogFilled`
- `systemMarked`
- `systemMarkedFilled`
- `systemMessages`
- `systemMessagesFilled`
- `systemRegulation`
- `systemRegulationFilled`
- `systemSearch`
- `systemSearchFilled`
- `systemSetting`
- `systemSettingFilled`
- `systemStorage`
- `systemStorageFilled`
- `systemSum`
- `systemUnlocked`
- `systemUnlockedFilled`
- `tab`
- `tabFilled`
- `table`
- `table1`
- `table1Filled`
- `table2`
- `table2Filled`
- `tableAdd`
- `tableAddFilled`
- `tableFilled`
- `tableSplit`
- `tableSplitFilled`
- `tag`
- `tagFilled`
- `tangerinr`
- `tangerinrFilled`
- `tape`
- `tapeFilled`
- `task`
- `task1`
- `task1Filled`
- `taskAdd`
- `taskAdd1`
- `taskAddFilled`
- `taskChecked`
- `taskChecked1`
- `taskCheckedFilled`
- `taskDouble`
- `taskDoubleFilled`
- `taskError`
- `taskErrorFilled`
- `taskFilled`
- `taskLocation`
- `taskLocationFilled`
- `taskMarked`
- `taskMarkedFilled`
- `taskSetting`
- `taskSettingFilled`
- `taskTime`
- `taskTimeFilled`
- `taskVisible`
- `taskVisibleFilled`
- `tea`
- `teaFilled`
- `teahouse`
- `teahouseFilled`
- `template`
- `templateFilled`
- `temple`
- `templeFilled`
- `terminal`
- `terminalRectangle`
- `terminalRectangle1`
- `terminalRectangle1Filled`
- `terminalRectangleFilled`
- `terminalWindow`
- `terminalWindowFilled`
- `textbox`
- `textboxFilled`
- `textformatBold`
- `textformatColor`
- `textformatItalic`
- `textformatStrikethrough`
- `textformatUnderline`
- `textformatWrap`
- `theaters`
- `theatersFilled`
- `thumbDown`
- `thumbDown1`
- `thumbDown1Filled`
- `thumbDown2`
- `thumbDown2Filled`
- `thumbDownFilled`
- `thumbUp`
- `thumbUp1`
- `thumbUp1Filled`
- `thumbUp2`
- `thumbUp2Filled`
- `thumbUpFilled`
- `thunder`
- `thunderstorm`
- `thunderstormNight`
- `thunderstormNightFilled`
- `thunderstormSunny`
- `thunderstormSunnyFilled`
- `ticket`
- `ticketFilled`
- `time`
- `timeFilled`
- `tips`
- `tipsDouble`
- `tipsDoubleFilled`
- `tipsFilled`
- `tomato`
- `tomatoFilled`
- `tools`
- `toolsCircle`
- `toolsCircleFilled`
- `toolsFilled`
- `tornado`
- `tower`
- `tower1`
- `tower1Filled`
- `tower2`
- `tower2Filled`
- `tower3`
- `tower3Filled`
- `towerClock`
- `towerClockFilled`
- `towerFilled`
- `town`
- `townFilled`
- `traffic`
- `trafficEvents`
- `trafficEventsFilled`
- `trafficFilled`
- `transform`
- `transform1`
- `transform1Filled`
- `transform2`
- `transform3`
- `transformFilled`
- `translate`
- `translate1`
- `treeList`
- `treeRoundDot`
- `treeRoundDotFilled`
- `treeRoundDotVertical`
- `treeRoundDotVerticalFilled`
- `treeSquareDot`
- `treeSquareDotFilled`
- `treeSquareDotVertical`
- `treeSquareDotVerticalFilled`
- `trendingDown`
- `trendingUp`
- `tv`
- `tv1`
- `tv1Filled`
- `tv2`
- `tv2Filled`
- `tvFilled`
- `typography`
- `typographyFilled`
- `uncomfortable`
- `uncomfortable1`
- `uncomfortable1Filled`
- `uncomfortable2`
- `uncomfortable2Filled`
- `uncomfortableFilled`
- `undertake`
- `undertakeDelivery`
- `undertakeDeliveryFilled`
- `undertakeEnvironmentProtection`
- `undertakeEnvironmentProtectionFilled`
- `undertakeFilled`
- `undertakeHoldUp`
- `undertakeHoldUpFilled`
- `undertakeTransaction`
- `undertakeTransactionFilled`
- `unfoldLess`
- `unfoldMore`
- `unhappy`
- `unhappy1`
- `unhappy1Filled`
- `unhappyFilled`
- `uninstall`
- `uninstallFilled`
- `upload`
- `upload1`
- `upscale`
- `usb`
- `usbFilled`
- `user`
- `user1`
- `user1Filled`
- `userAdd`
- `userAddFilled`
- `userArrowDown`
- `userArrowDownFilled`
- `userArrowLeft`
- `userArrowLeftFilled`
- `userArrowRight`
- `userArrowRightFilled`
- `userArrowUp`
- `userArrowUpFilled`
- `userAvatar`
- `userAvatarFilled`
- `userBlocked`
- `userBlockedFilled`
- `userBusiness`
- `userBusinessFilled`
- `userChecked`
- `userChecked1`
- `userChecked1Filled`
- `userCheckedFilled`
- `userCircle`
- `userCircleFilled`
- `userClear`
- `userClearFilled`
- `userError1`
- `userError1Filled`
- `userFilled`
- `userInvisible`
- `userInvisibleFilled`
- `userList`
- `userListFilled`
- `userLocked`
- `userLockedFilled`
- `userMarked`
- `userMarkedFilled`
- `userPassword`
- `userPasswordFilled`
- `userSafety`
- `userSafetyFilled`
- `userSearch`
- `userSearchFilled`
- `userSetting`
- `userSettingFilled`
- `userTalk`
- `userTalk1`
- `userTalk1Filled`
- `userTalkFilled`
- `userTalkOff1`
- `userTalkOff1Filled`
- `userTime`
- `userTimeFilled`
- `userTransmit`
- `userTransmitFilled`
- `userUnknown`
- `userUnknownFilled`
- `userUnlocked`
- `userUnlockedFilled`
- `userVip`
- `userVipFilled`
- `userVisible`
- `userVisibleFilled`
- `usercase`
- `usercaseFilled`
- `usercaseLink`
- `usercaseLinkFilled`
- `usergroup`
- `usergroupAdd`
- `usergroupAddFilled`
- `usergroupClear`
- `usergroupClearFilled`
- `usergroupFilled`
- `vehicle`
- `vehicleFilled`
- `verified`
- `verifiedFilled`
- `verify`
- `verifyFilled`
- `vertical`
- `verticalFilled`
- `video`
- `videoCamera`
- `videoCamera1`
- `videoCamera1Filled`
- `videoCamera2`
- `videoCamera2Filled`
- `videoCamera3`
- `videoCamera3Filled`
- `videoCameraDollar`
- `videoCameraDollarFilled`
- `videoCameraFilled`
- `videoCameraMinus`
- `videoCameraMinusFilled`
- `videoCameraMusic`
- `videoCameraMusicFilled`
- `videoCameraOff`
- `videoCameraOffFilled`
- `videoFilled`
- `videoLibrary`
- `videoLibraryFilled`
- `viewAgenda`
- `viewAgendaFilled`
- `viewColumn`
- `viewInAr`
- `viewInArFilled`
- `viewList`
- `viewModule`
- `viewModuleFilled`
- `visualRecognition`
- `visualRecognitionFilled`
- `wallet`
- `walletFilled`
- `watch`
- `watchFilled`
- `watermelon`
- `watermelonFilled`
- `waveBye`
- `waveByeFilled`
- `waveLeft`
- `waveLeftFilled`
- `waveRight`
- `waveRightFilled`
- `wealth`
- `wealth1`
- `wealth1Filled`
- `wealthFilled`
- `widget`
- `widgetFilled`
- `wifi`
- `wifi1`
- `wifi1Filled`
- `wifiNo`
- `wifiNoFilled`
- `wifiOff`
- `wifiOff1`
- `wifiOff1Filled`
- `window`
- `window1`
- `window1Filled`
- `windowFilled`
- `windy`
- `windyRain`
- `wink`
- `winkFilled`
- `work`
- `workFilled`
- `workHistory`
- `workHistoryFilled`
- `workOff`
- `workOffFilled`
- `wrySmile`
- `wrySmileFilled`
- `zoomIn`
- `zoomInFilled`
- `zoomOut`
- `zoomOutFilled`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccessibilityIcon, AccessibilityFilledIcon, ActivityIcon, ActivityFilledIcon } from '@stacksjs/iconify-tdesign'

  global.navIcons = {
    home: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    about: AccessibilityFilledIcon({ size: 20, class: 'nav-icon' }),
    contact: ActivityIcon({ size: 20, class: 'nav-icon' }),
    settings: ActivityFilledIcon({ size: 20, class: 'nav-icon' })
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
import { AccessibilityIcon } from '@stacksjs/iconify-tdesign'

const icon = AccessibilityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccessibilityIcon, AccessibilityFilledIcon, ActivityIcon } from '@stacksjs/iconify-tdesign'

const successIcon = AccessibilityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccessibilityFilledIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ActivityIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccessibilityIcon, AccessibilityFilledIcon } from '@stacksjs/iconify-tdesign'
   const icon = AccessibilityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility, accessibilityFilled } from '@stacksjs/iconify-tdesign'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccessibilityIcon, AccessibilityFilledIcon } from '@stacksjs/iconify-tdesign'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-tdesign'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccessibilityIcon } from '@stacksjs/iconify-tdesign'
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
import { accessibility } from '@stacksjs/iconify-tdesign'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/Tencent/tdesign-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: TDesign ([Website](https://github.com/Tencent/tdesign-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/tdesign/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/tdesign/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
