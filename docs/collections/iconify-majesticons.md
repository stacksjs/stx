# Majesticons

> Majesticons icons for stx from Iconify

## Overview

This package provides access to 1045 icons from the Majesticons collection through the stx iconify integration.

**Collection ID:** `majesticons`
**Total Icons:** 1045
**Author:** Gerrit Halfmann ([Website](https://github.com/halfmage/majesticons))
**License:** MIT ([Details](https://github.com/halfmage/majesticons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-majesticons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AcademicCapIcon, AcademicCapLineIcon, AddColumnIcon } from '@stacksjs/iconify-majesticons'

// Basic usage
const icon = AcademicCapIcon()

// With size
const sizedIcon = AcademicCapIcon({ size: 24 })

// With color
const coloredIcon = AcademicCapLineIcon({ color: 'red' })

// With multiple props
const customIcon = AddColumnIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AcademicCapIcon, AcademicCapLineIcon, AddColumnIcon } from '@stacksjs/iconify-majesticons'

  global.icons = {
    home: AcademicCapIcon({ size: 24 }),
    user: AcademicCapLineIcon({ size: 24, color: '#4a90e2' }),
    settings: AddColumnIcon({ size: 32 })
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
import { academicCap, academicCapLine, addColumn } from '@stacksjs/iconify-majesticons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(academicCap, { size: 24 })
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
const redIcon = AcademicCapIcon({ color: 'red' })
const blueIcon = AcademicCapIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AcademicCapIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AcademicCapIcon({ class: 'text-primary' })
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
const icon24 = AcademicCapIcon({ size: 24 })
const icon1em = AcademicCapIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AcademicCapIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AcademicCapIcon({ height: '1em' })
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
const smallIcon = AcademicCapIcon({ class: 'icon-small' })
const largeIcon = AcademicCapIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1045** icons:

- `academicCap`
- `academicCapLine`
- `addColumn`
- `addColumnLine`
- `addRow`
- `addRowLine`
- `adjustments`
- `adjustmentsLine`
- `airplane`
- `airplaneFlight2`
- `airplaneFlight2Line`
- `airplaneLine`
- `alertCircle`
- `alertCircleLine`
- `alignBottom`
- `alignBottomLine`
- `alignHorizontalCenter`
- `alignHorizontalCenterLine`
- `alignLeft`
- `alignLeftLine`
- `alignRight`
- `alignRightLine`
- `alignTop`
- `alignTopLine`
- `alignVerticalCenter`
- `alignVerticalCenterLine`
- `analytics`
- `analyticsDelete`
- `analyticsDeleteLine`
- `analyticsLine`
- `analyticsPlus`
- `analyticsPlusLine`
- `analyticsRestricted`
- `analyticsRestrictedLine`
- `annotation`
- `annotationLine`
- `applications`
- `applicationsAdd`
- `applicationsAddLine`
- `applicationsLine`
- `archive`
- `archiveLine`
- `arrowCircleDown`
- `arrowCircleDownLine`
- `arrowCircleLeft`
- `arrowCircleLeftLine`
- `arrowCircleRight`
- `arrowCircleRightLine`
- `arrowCircleUp`
- `arrowCircleUpLine`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownCircleLine`
- `arrowDownLine`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftCircleLine`
- `arrowLeftLine`
- `arrowRight`
- `arrowRightCircle`
- `arrowRightCircleLine`
- `arrowRightLine`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpCircleLine`
- `arrowUpLine`
- `arrowsCollapseFull`
- `arrowsCollapseFullLine`
- `arrowsExpand`
- `arrowsExpandFull`
- `arrowsExpandFullLine`
- `arrowsExpandLine`
- `article`
- `articleLine`
- `articleSearch`
- `articleSearchLine`
- `atSymbol`
- `atSymbolLine`
- `atom2`
- `atom2Line`
- `attachment`
- `attachmentLine`
- `award`
- `awardLine`
- `backCircle`
- `backCircleLine`
- `backspace`
- `backspaceLine`
- `backwardCircle`
- `backwardCircleLine`
- `backwardStartCircle`
- `backwardStartCircleLine`
- `badgeCheck`
- `badgeCheckLine`
- `ban`
- `banLine`
- `bandAids`
- `bandAidsLine`
- `barcode2`
- `barcode2Line`
- `basket2`
- `basket2Line`
- `bathShower`
- `bathShowerLine`
- `battery`
- `batteryFull`
- `batteryFullLine`
- `batteryHalf`
- `batteryHalfLine`
- `batteryLine`
- `batteryLow`
- `batteryLowLine`
- `beach`
- `beachLine`
- `beaker`
- `beakerLine`
- `bell`
- `bellLine`
- `bitcoinCircle`
- `bitcoinCircleLine`
- `bluetooth`
- `bluetoothLine`
- `bold`
- `boldLine`
- `book`
- `bookLine`
- `bookMinus`
- `bookMinusLine`
- `bookOpen`
- `bookOpenLine`
- `bookPlus`
- `bookPlusLine`
- `bookmark`
- `bookmarkBook`
- `bookmarkBookLine`
- `bookmarkLine`
- `bookmarkMinus`
- `bookmarkMinusLine`
- `bookmarkPlus`
- `bookmarkPlusLine`
- `box`
- `boxLine`
- `briefcase`
- `briefcaseLine`
- `browser`
- `browserCookie`
- `browserCookieLine`
- `browserLine`
- `bug2`
- `bug2Line`
- `burger`
- `burgerLine`
- `bus`
- `busLine`
- `cake`
- `cakeLine`
- `calculator`
- `calculatorLine`
- `calendar`
- `calendarLine`
- `calendarPlus`
- `calendarPlusLine`
- `camera`
- `cameraLine`
- `cameraOff`
- `cameraOffLine`
- `car`
- `carLine`
- `cash`
- `cashLine`
- `centCircle`
- `centCircleLine`
- `chartBar`
- `chartBarLine`
- `chartPie`
- `chartPieLine`
- `chat`
- `chat2`
- `chat2Line`
- `chat2Text`
- `chat2TextLine`
- `chatLine`
- `chatSignal`
- `chatSignalLine`
- `chatStatus`
- `chatStatusLine`
- `chatText`
- `chatTextLine`
- `chats`
- `chats2`
- `chats2Line`
- `chatsLine`
- `check`
- `checkCircle`
- `checkCircleLine`
- `checkLine`
- `checkboxList`
- `checkboxListDetail`
- `checkboxListDetailLine`
- `checkboxListLine`
- `cheese`
- `cheeseLine`
- `chevronDoubleDown`
- `chevronDoubleDownLine`
- `chevronDoubleLeft`
- `chevronDoubleLeftLine`
- `chevronDoubleRight`
- `chevronDoubleRightLine`
- `chevronDoubleUp`
- `chevronDoubleUpLine`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownCircleLine`
- `chevronDownLine`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronLeftCircleLine`
- `chevronLeftLine`
- `chevronRight`
- `chevronRightCircle`
- `chevronRightCircleLine`
- `chevronRightLine`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpCircleLine`
- `chevronUpLine`
- `chip`
- `chipLine`
- `chromecast`
- `chromecastLine`
- `church`
- `churchLine`
- `clipboard`
- `clipboardCheck`
- `clipboardCheckLine`
- `clipboardCopy`
- `clipboardCopyLine`
- `clipboardLine`
- `clipboardList`
- `clipboardListLine`
- `clipboardMinus`
- `clipboardMinusLine`
- `clipboardPlus`
- `clipboardPlusLine`
- `clock`
- `clockLine`
- `clockPlus`
- `clockPlusLine`
- `close`
- `closeCircle`
- `closeCircleLine`
- `closeLine`
- `cloud`
- `cloudDownload`
- `cloudDownloadLine`
- `cloudLine`
- `cloudUpload`
- `cloudUploadLine`
- `code`
- `codeBlock`
- `codeBlockLine`
- `codeLine`
- `cog`
- `cogLine`
- `coins`
- `coinsLine`
- `collection`
- `collectionLine`
- `colorSwatch`
- `colorSwatchLine`
- `comet`
- `cometLine`
- `comment`
- `comment2`
- `comment2Line`
- `comment2Text`
- `comment2TextLine`
- `commentLine`
- `commentText`
- `commentTextLine`
- `comments`
- `comments2`
- `comments2Line`
- `commentsLine`
- `community`
- `communityLine`
- `compass`
- `compass2`
- `compass2Line`
- `compassLine`
- `contact`
- `contactLine`
- `cookie`
- `cookieLine`
- `covid`
- `covidExclamation`
- `covidExclamationLine`
- `covidLine`
- `covidOff`
- `covidOffLine`
- `cpu`
- `cpuLine`
- `creditCard`
- `creditCardLine`
- `creditcard`
- `creditcardHand`
- `creditcardHandLine`
- `creditcardLine`
- `creditcardPlus`
- `creditcardPlusLine`
- `crown`
- `crownLine`
- `cube`
- `cubeLine`
- `cup`
- `cupLine`
- `curlyBraces`
- `curlyBracesLine`
- `cursorClick`
- `cursorClickLine`
- `dashboard`
- `dashboardLine`
- `data`
- `dataLine`
- `dataMinus`
- `dataMinusLine`
- `dataPlus`
- `dataPlusLine`
- `database`
- `databaseLine`
- `deleteBin`
- `deleteBinLine`
- `desktopComputer`
- `desktopComputerLine`
- `deviceMobile`
- `deviceMobileLine`
- `deviceTablet`
- `deviceTabletLine`
- `distributeHorizontal`
- `distributeHorizontalLine`
- `distributeVertical`
- `distributeVerticalLine`
- `divide`
- `divideLine`
- `document`
- `documentAward`
- `documentAwardLine`
- `documentLine`
- `dollarCircle`
- `dollarCircleLine`
- `doorEnter`
- `doorEnterLine`
- `doorExit`
- `doorExitLine`
- `dotsCircle`
- `dotsCircleLine`
- `dotsHorizontal`
- `dotsHorizontalLine`
- `dotsVertical`
- `dotsVerticalLine`
- `duplicate`
- `duplicateLine`
- `earthSphere`
- `earthSphereLine`
- `editPen2`
- `editPen2Line`
- `editPen4`
- `editPen4Line`
- `eject`
- `ejectLine`
- `emojiHappy`
- `emojiHappyLine`
- `emojiSad`
- `emojiSadLine`
- `eraser`
- `eraserLine`
- `etheriumCircle`
- `etheriumCircleLine`
- `euroCircle`
- `euroCircleLine`
- `exclamation`
- `exclamationCircle`
- `exclamationCircleLine`
- `exclamationLine`
- `externalLink`
- `externalLinkLine`
- `eye`
- `eyeLine`
- `eyeOff`
- `eyeOffLine`
- `fastForward`
- `fastForwardLine`
- `ferrisWheel`
- `ferrisWheelLine`
- `file`
- `fileAdd`
- `fileAddLine`
- `fileDownload`
- `fileDownloadLine`
- `fileDuplicate`
- `fileDuplicateLine`
- `fileLine`
- `fileMinus`
- `fileMinusLine`
- `filePlus`
- `filePlusLine`
- `fileRemove`
- `fileRemoveLine`
- `fileReport`
- `fileReportLine`
- `fileSearch`
- `fileSearchLine`
- `fileText`
- `fileTextLine`
- `film`
- `filmLine`
- `filter`
- `filterLine`
- `fire`
- `fireLine`
- `fish`
- `fishLine`
- `flag`
- `flagLine`
- `flask`
- `flaskLine`
- `flower2`
- `flower2Line`
- `folder`
- `folderAdd`
- `folderAddLine`
- `folderCheck`
- `folderCheckLine`
- `folderDownload`
- `folderDownloadLine`
- `folderLine`
- `folderMinus`
- `folderMinusLine`
- `folderOpen`
- `folderOpenLine`
- `folderPlus`
- `folderPlusLine`
- `folderRemove`
- `folderRemoveLine`
- `fontSize`
- `fontSizeLine`
- `forward`
- `forwardCircle`
- `forwardCircleLine`
- `forwardEndCircle`
- `forwardEndCircleLine`
- `forwardLine`
- `ghost`
- `ghostLine`
- `gitBranch`
- `gitBranchLine`
- `gitCommit`
- `gitCommitLine`
- `gitCompare`
- `gitCompareLine`
- `gitFork`
- `gitForkLine`
- `gitMerge`
- `gitMergeLine`
- `gitPull`
- `gitPullLine`
- `glasWater`
- `glasWaterLine`
- `globe`
- `globeEarth`
- `globeEarth2`
- `globeEarth2Line`
- `globeEarthLine`
- `globeGrid`
- `globeGridLine`
- `globeLine`
- `hand`
- `handLine`
- `handPointer`
- `handPointer2`
- `handPointer2Line`
- `handPointerEvent`
- `handPointerEventLine`
- `handPointerLine`
- `hardDrive`
- `hardDriveLine`
- `hashtag`
- `hashtagLine`
- `headset`
- `headsetLine`
- `heart`
- `heartLine`
- `home`
- `homeAnalytics`
- `homeAnalyticsLine`
- `homeLine`
- `homeSimple`
- `homeSimpleLine`
- `image`
- `imageCircle`
- `imageCircleLine`
- `imageCircleOff`
- `imageCircleOffLine`
- `imageCirclePlus`
- `imageCirclePlusLine`
- `imageCircleStory`
- `imageCircleStoryLine`
- `imageFrame`
- `imageFrameLine`
- `imageInPicture`
- `imageInPictureLine`
- `imageLine`
- `imageMultiple`
- `imageMultipleLine`
- `imageOff`
- `imageOffLine`
- `imagePhotography`
- `imagePhotographyLine`
- `imagePlus`
- `imagePlusLine`
- `inbox`
- `inboxIn`
- `inboxInLine`
- `inboxLine`
- `incognito`
- `incognitoLine`
- `infoCircle`
- `infoCircleLine`
- `informationCircle`
- `informationCircleLine`
- `iphoneOldApps`
- `iphoneOldAppsLine`
- `iphoneXApps`
- `iphoneXAppsLine`
- `italic`
- `italicLine`
- `key`
- `keyLine`
- `keyboard`
- `keyboardLine`
- `laptop`
- `laptopLine`
- `leaf3Angled`
- `leaf3AngledLine`
- `library`
- `libraryLine`
- `lidquidDropWaves2`
- `lidquidDropWaves2Line`
- `lifebuoy`
- `lifebuoyLine`
- `lightBulb`
- `lightBulbLine`
- `lightbulbShine`
- `lightbulbShineLine`
- `lightningBolt`
- `lightningBoltLine`
- `lineHeight`
- `lineHeightLine`
- `link`
- `linkCircle`
- `linkCircleLine`
- `linkLine`
- `liraCircle`
- `liraCircleLine`
- `listBox`
- `listBoxLine`
- `locationMarker`
- `locationMarkerLine`
- `lock`
- `lockClosed`
- `lockClosedLine`
- `lockLine`
- `lockOff`
- `lockOffLine`
- `lockOpen`
- `lockOpenLine`
- `login`
- `loginHalfCircle`
- `loginHalfCircleLine`
- `loginLine`
- `logout`
- `logoutHalfCircle`
- `logoutHalfCircleLine`
- `logoutLine`
- `mail`
- `mailLine`
- `mailOpen`
- `mailOpenLine`
- `map`
- `mapLine`
- `mapMarker`
- `mapMarkerArea`
- `mapMarkerAreaLine`
- `mapMarkerLine`
- `mapMarkerPath`
- `mapMarkerPathLine`
- `mapMarkerPlus`
- `mapMarkerPlusLine`
- `mapSimple`
- `mapSimpleDestination`
- `mapSimpleDestinationLine`
- `mapSimpleLine`
- `mapSimpleMarker`
- `mapSimpleMarkerLine`
- `mapSimpleOff`
- `mapSimpleOffLine`
- `maximize`
- `maximizeLine`
- `megaphone`
- `megaphoneLine`
- `menu`
- `menuAlt`
- `menuAltLine`
- `menuExpandLeft`
- `menuExpandLeftLine`
- `menuExpandRight`
- `menuExpandRightLine`
- `menuLine`
- `message`
- `messageLine`
- `messages`
- `messagesLine`
- `microphone`
- `microphoneLine`
- `minimize`
- `minimizeLine`
- `minus`
- `minusCircle`
- `minusCircleLine`
- `minusFiveCircle`
- `minusFiveCircleLine`
- `minusLine`
- `minusTenCircle`
- `minusTenCircleLine`
- `money`
- `moneyHand`
- `moneyHandLine`
- `moneyLine`
- `moneyMinus`
- `moneyMinusLine`
- `moneyPlus`
- `moneyPlusLine`
- `monitor`
- `monitorLine`
- `moon`
- `moonLine`
- `moreMenu`
- `moreMenuLine`
- `moreMenuVertical`
- `moreMenuVerticalLine`
- `mouse`
- `mouseLine`
- `multiply`
- `multiplyLine`
- `music`
- `musicLine`
- `musicNote`
- `musicNoteLine`
- `newspaper`
- `newspaperLine`
- `nextCircle`
- `nextCircleLine`
- `noteText`
- `noteTextLine`
- `noteTextMinus`
- `noteTextMinusLine`
- `noteTextPlus`
- `noteTextPlusLine`
- `noteblock`
- `noteblockLine`
- `noteblockText`
- `noteblockTextLine`
- `open`
- `openLine`
- `paperAirplane`
- `paperAirplaneLine`
- `paperClip`
- `paperClipLine`
- `paperFold`
- `paperFoldLine`
- `paperFoldText`
- `paperFoldTextLine`
- `paperRoll2`
- `paperRoll2Line`
- `paragraph`
- `paragraphLine`
- `pause`
- `pauseCircle`
- `pauseCircleLine`
- `pauseLine`
- `pencil`
- `pencilAlt`
- `pencilAltLine`
- `pencilLine`
- `percent`
- `percentLine`
- `phone`
- `phoneDial`
- `phoneDialLine`
- `phoneHangup`
- `phoneHangupLine`
- `phoneIncoming`
- `phoneIncomingLine`
- `phoneLine`
- `phoneMissedCall`
- `phoneMissedCallLine`
- `phoneOutgoing`
- `phoneOutgoingLine`
- `phoneRetro`
- `phoneRetroLine`
- `phoneRing`
- `phoneRingLine`
- `pill`
- `pillLine`
- `pin`
- `pinLine`
- `pinwheel`
- `pinwheelLine`
- `planet`
- `planetLine`
- `planetRing2`
- `planetRing2Line`
- `planetRocket`
- `planetRocketLine`
- `playCircle`
- `playCircleLine`
- `playlist`
- `playlistLine`
- `plus`
- `plusCircle`
- `plusCircleLine`
- `plusFiveCircle`
- `plusFiveCircleLine`
- `plusLine`
- `plusMinus`
- `plusMinus2`
- `plusMinus2Line`
- `plusMinusLine`
- `plusTenCircle`
- `plusTenCircleLine`
- `poundCircle`
- `poundCircleLine`
- `presentation`
- `presentationChart`
- `presentationChartLine`
- `presentationLine`
- `presentationLineLine`
- `presentationPlay`
- `presentationPlayLine`
- `presentationReport`
- `presentationReportLine`
- `printer`
- `printerLine`
- `pulse`
- `pulseLine`
- `puzzle`
- `puzzleLine`
- `qrCode`
- `qrCodeLine`
- `qrcode`
- `qrcodeLine`
- `questionCircle`
- `questionCircleLine`
- `questionMarkCircle`
- `questionMarkCircleLine`
- `radioList`
- `radioListLine`
- `receipt`
- `receiptLine`
- `receiptRefund`
- `receiptRefundLine`
- `receiptText`
- `receiptTextLine`
- `redo`
- `redoLine`
- `refresh`
- `refreshLine`
- `reload`
- `reloadCircle`
- `reloadCircleLine`
- `reloadLine`
- `removeColumn`
- `removeColumnLine`
- `removeFormat`
- `removeFormatLine`
- `removeRow`
- `removeRowLine`
- `repeatCircle`
- `repeatCircleLine`
- `reply`
- `replyAll`
- `replyAllLine`
- `replyLine`
- `restricted`
- `restrictedLine`
- `rewind`
- `rewindLine`
- `robot`
- `robotLine`
- `rocket3Start`
- `rocket3StartLine`
- `rss`
- `rssLine`
- `rubelCircle`
- `rubelCircleLine`
- `ruler2`
- `ruler2Line`
- `rupeeCircle`
- `rupeeCircleLine`
- `save`
- `saveAlt`
- `saveAltLine`
- `saveAs`
- `saveAsLine`
- `saveLine`
- `scaleLight`
- `scaleLightLine`
- `scanFingerprint`
- `scanFingerprintLine`
- `scanUser`
- `scanUserLine`
- `scanner`
- `scannerLine`
- `scissors`
- `scissorsLine`
- `scooter`
- `scooterLine`
- `scriptPrescription`
- `scriptPrescriptionLine`
- `scroll`
- `scrollLine`
- `scrollText`
- `scrollTextLine`
- `search`
- `searchCircle`
- `searchCircleLine`
- `searchLine`
- `searchMinus`
- `searchMinusLine`
- `searchPlus`
- `searchPlusLine`
- `searchText`
- `searchTextLine`
- `selector`
- `selectorLine`
- `send`
- `sendLine`
- `server`
- `serverLine`
- `settingsCog`
- `settingsCogCheck`
- `settingsCogCheckLine`
- `settingsCogLine`
- `settingsCogPlus`
- `settingsCogPlusLine`
- `share`
- `shareCircle`
- `shareCircleLine`
- `shareLine`
- `shield`
- `shieldCheck`
- `shieldCheckLine`
- `shieldExclamation`
- `shieldExclamationLine`
- `shieldLine`
- `shieldOff`
- `shieldOffLine`
- `shieldPlus`
- `shieldPlusLine`
- `ship`
- `shipLine`
- `shootingStar`
- `shootingStarLine`
- `shoppingBag`
- `shoppingBagLine`
- `shoppingCart`
- `shoppingCartLine`
- `simCard`
- `simCardLine`
- `sitemap`
- `sitemapLine`
- `skull`
- `skullLine`
- `smartphoneApps`
- `smartphoneAppsLine`
- `sortHorizontal`
- `sortHorizontalLine`
- `sortVertical`
- `sortVerticalLine`
- `soundOff`
- `soundOffLine`
- `soundUp`
- `soundUpLine`
- `sparkles`
- `sparklesLine`
- `speaker`
- `speakerLine`
- `speakerphone`
- `speakerphoneLine`
- `star`
- `starLine`
- `statusOffline`
- `statusOfflineLine`
- `statusOnline`
- `statusOnlineLine`
- `stopCircle`
- `stopCircleLine`
- `strikeThrough`
- `strikeThroughLine`
- `suitcase`
- `suitcase2`
- `suitcase2Line`
- `suitcase3`
- `suitcase3Line`
- `suitcaseLine`
- `sun`
- `sunLine`
- `support`
- `supportLine`
- `tShirt`
- `tShirtLine`
- `table`
- `tableHeart`
- `tableHeartLine`
- `tableLine`
- `tablePlus`
- `tablePlusLine`
- `tag`
- `tagLine`
- `tagOff`
- `tagOffLine`
- `telescope`
- `telescopeLine`
- `terminal`
- `terminalLine`
- `testTubeFilled`
- `testTubeFilledLine`
- `text`
- `textAlignCenter`
- `textAlignCenterLine`
- `textAlignJustify`
- `textAlignJustifyLine`
- `textAlignLeft`
- `textAlignLeftLine`
- `textAlignRight`
- `textAlignRightLine`
- `textLine`
- `textWrap`
- `textWrapLine`
- `textbox`
- `textboxLine`
- `textboxMinus`
- `textboxMinusLine`
- `textboxPlus`
- `textboxPlusLine`
- `thumbDown`
- `thumbDownLine`
- `thumbUp`
- `thumbUpLine`
- `ticket`
- `ticketCheck`
- `ticketCheckLine`
- `ticketLine`
- `ticketText`
- `ticketTextLine`
- `tickets`
- `ticketsLine`
- `timer`
- `timerLine`
- `tooltip`
- `tooltipLine`
- `tooltipText`
- `tooltipTextLine`
- `tooltips`
- `tooltips2`
- `tooltips2Line`
- `tooltipsLine`
- `translate`
- `translateLine`
- `trash`
- `trashLine`
- `trendingDown`
- `trendingDownLine`
- `trendingUp`
- `trendingUpLine`
- `truck`
- `truckLine`
- `tvOld`
- `tvOldLine`
- `umbrella`
- `umbrellaLine`
- `underline`
- `underline2`
- `underline2Line`
- `underlineLine`
- `undo`
- `undoLine`
- `unlockOpen`
- `unlockOpenLine`
- `usb`
- `usbLine`
- `user`
- `userAdd`
- `userAddLine`
- `userBox`
- `userBoxLine`
- `userCircle`
- `userCircleLine`
- `userGroup`
- `userGroupLine`
- `userLine`
- `userRemove`
- `userRemoveLine`
- `users`
- `usersLine`
- `uxCircle`
- `uxCircleLine`
- `video`
- `videoCamera`
- `videoCameraLine`
- `videoLine`
- `videoMinus`
- `videoMinusLine`
- `videoPlus`
- `videoPlusLine`
- `viewBoards`
- `viewBoardsLine`
- `viewColumns`
- `viewColumnsLine`
- `viewGrid`
- `viewGridLine`
- `viewList`
- `viewListLine`
- `viewRows`
- `viewRowsLine`
- `watch`
- `watchLine`
- `wifi`
- `wifiLine`
- `yenCircle`
- `yenCircleLine`
- `zoomIn`
- `zoomInLine`
- `zoomOut`
- `zoomOutLine`

## Usage Examples

### Navigation Menu

```html
@js
  import { AcademicCapIcon, AcademicCapLineIcon, AddColumnIcon, AddColumnLineIcon } from '@stacksjs/iconify-majesticons'

  global.navIcons = {
    home: AcademicCapIcon({ size: 20, class: 'nav-icon' }),
    about: AcademicCapLineIcon({ size: 20, class: 'nav-icon' }),
    contact: AddColumnIcon({ size: 20, class: 'nav-icon' }),
    settings: AddColumnLineIcon({ size: 20, class: 'nav-icon' })
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
import { AcademicCapIcon } from '@stacksjs/iconify-majesticons'

const icon = AcademicCapIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AcademicCapIcon, AcademicCapLineIcon, AddColumnIcon } from '@stacksjs/iconify-majesticons'

const successIcon = AcademicCapIcon({ size: 16, color: '#22c55e' })
const warningIcon = AcademicCapLineIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddColumnIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AcademicCapIcon, AcademicCapLineIcon } from '@stacksjs/iconify-majesticons'
   const icon = AcademicCapIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { academicCap, academicCapLine } from '@stacksjs/iconify-majesticons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(academicCap, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AcademicCapIcon, AcademicCapLineIcon } from '@stacksjs/iconify-majesticons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-majesticons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AcademicCapIcon } from '@stacksjs/iconify-majesticons'
     global.icon = AcademicCapIcon({ size: 24 })
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
   const icon = AcademicCapIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { academicCap } from '@stacksjs/iconify-majesticons'

// Icons are typed as IconData
const myIcon: IconData = academicCap
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/halfmage/majesticons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Gerrit Halfmann ([Website](https://github.com/halfmage/majesticons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/majesticons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/majesticons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
