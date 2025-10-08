# Material Line Icons

> Material Line Icons icons for stx from Iconify

## Overview

This package provides access to 1093 icons from the Material Line Icons collection through the stx iconify integration.

**Collection ID:** `line-md`
**Total Icons:** 1093
**Author:** Vjacheslav Trushkin ([Website](https://github.com/cyberalien/line-md))
**License:** MIT ([Details](https://github.com/cyberalien/line-md/blob/master/license.txt))
**Category:** Material
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-line-md
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccountIcon, AccountAddIcon, AccountAlertIcon } from '@stacksjs/iconify-line-md'

// Basic usage
const icon = AccountIcon()

// With size
const sizedIcon = AccountIcon({ size: 24 })

// With color
const coloredIcon = AccountAddIcon({ color: 'red' })

// With multiple props
const customIcon = AccountAlertIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccountIcon, AccountAddIcon, AccountAlertIcon } from '@stacksjs/iconify-line-md'

  global.icons = {
    home: AccountIcon({ size: 24 }),
    user: AccountAddIcon({ size: 24, color: '#4a90e2' }),
    settings: AccountAlertIcon({ size: 32 })
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
import { account, accountAdd, accountAlert } from '@stacksjs/iconify-line-md'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(account, { size: 24 })
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
const redIcon = AccountIcon({ color: 'red' })
const blueIcon = AccountIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccountIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccountIcon({ class: 'text-primary' })
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
const icon24 = AccountIcon({ size: 24 })
const icon1em = AccountIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccountIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccountIcon({ height: '1em' })
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
const smallIcon = AccountIcon({ class: 'icon-small' })
const largeIcon = AccountIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1093** icons:

- `account`
- `accountAdd`
- `accountAlert`
- `accountAlertLoop`
- `accountDelete`
- `accountRemove`
- `accountSmall`
- `alert`
- `alertCircle`
- `alertCircleLoop`
- `alertCircleTwotone`
- `alertCircleTwotoneLoop`
- `alertLoop`
- `alertSquare`
- `alertSquareLoop`
- `alertSquareTwotone`
- `alertSquareTwotoneLoop`
- `alertTwotone`
- `alertTwotoneLoop`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `arrowAlignBottom`
- `arrowAlignCenter`
- `arrowAlignLeft`
- `arrowAlignMiddle`
- `arrowAlignRight`
- `arrowAlignTop`
- `arrowCloseDown`
- `arrowCloseLeft`
- `arrowCloseRight`
- `arrowCloseUp`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownCircleTwotone`
- `arrowDownSquare`
- `arrowDownSquareTwotone`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftCircleTwotone`
- `arrowLeftSquare`
- `arrowLeftSquareTwotone`
- `arrowOpenDown`
- `arrowOpenLeft`
- `arrowOpenRight`
- `arrowOpenUp`
- `arrowRight`
- `arrowRightCircle`
- `arrowRightCircleTwotone`
- `arrowRightSquare`
- `arrowRightSquareTwotone`
- `arrowSmallDown`
- `arrowSmallLeft`
- `arrowSmallRight`
- `arrowSmallUp`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpCircleTwotone`
- `arrowUpSquare`
- `arrowUpSquareTwotone`
- `arrowsDiagonal`
- `arrowsDiagonalRotated`
- `arrowsHorizontal`
- `arrowsHorizontalAlt`
- `arrowsLongDiagonal`
- `arrowsLongDiagonalRotated`
- `arrowsVertical`
- `arrowsVerticalAlt`
- `at`
- `backupRestore`
- `beer`
- `beerAlt`
- `beerAltFilled`
- `beerAltFilledLoop`
- `beerAltLoop`
- `beerAltTwotone`
- `beerAltTwotoneLoop`
- `beerFilled`
- `beerFilledLoop`
- `beerLoop`
- `beerTwotone`
- `beerTwotoneLoop`
- `bell`
- `bellAlert`
- `bellAlertFilled`
- `bellAlertFilledLoop`
- `bellAlertLoop`
- `bellAlertTwotone`
- `bellAlertTwotoneLoop`
- `bellFilled`
- `bellFilledLoop`
- `bellLoop`
- `bellTwotone`
- `bellTwotoneLoop`
- `bluesky`
- `brake`
- `brakeAbs`
- `brakeAbsFilled`
- `brakeAbsTwotone`
- `brakeAlert`
- `brakeAlertFilled`
- `brakeAlertTwotone`
- `brakeFilled`
- `brakeHold`
- `brakeHoldFilled`
- `brakeHoldTwotone`
- `brakeParking`
- `brakeParkingFilled`
- `brakeParkingTwotone`
- `brakeTwotone`
- `briefcase`
- `briefcaseCancel`
- `briefcaseCancelFilled`
- `briefcaseCancelTwotone`
- `briefcaseCheck`
- `briefcaseCheckFilled`
- `briefcaseCheckTwotone`
- `briefcaseFilled`
- `briefcaseMinus`
- `briefcaseMinusFilled`
- `briefcaseMinusTwotone`
- `briefcasePlus`
- `briefcasePlusFilled`
- `briefcasePlusTwotone`
- `briefcaseRemove`
- `briefcaseRemoveFilled`
- `briefcaseRemoveTwotone`
- `briefcaseTwotone`
- `buyMeACoffee`
- `buyMeACoffeeFilled`
- `buyMeACoffeeTwotone`
- `cake`
- `cakeFilled`
- `cakeTwotone`
- `calendar`
- `calendarOut`
- `cancel`
- `cancelTwotone`
- `carLight`
- `carLightAlert`
- `carLightAlertFilled`
- `carLightAlertOff`
- `carLightAlertOffFilled`
- `carLightAlertOffTwotone`
- `carLightAlertTwotone`
- `carLightDimmed`
- `carLightDimmedFilled`
- `carLightDimmedOff`
- `carLightDimmedOffFilled`
- `carLightDimmedOffTwotone`
- `carLightDimmedTwotone`
- `carLightFilled`
- `carLightOff`
- `carLightOffFilled`
- `carLightOffTwotone`
- `carLightTwotone`
- `cellphone`
- `cellphoneArrowDown`
- `cellphoneArrowDownTwotone`
- `cellphoneArrowUp`
- `cellphoneArrowUpTwotone`
- `cellphoneOff`
- `cellphoneOffTwotone`
- `cellphoneScreenshot`
- `cellphoneScreenshotTwotone`
- `cellphoneTwotone`
- `chat`
- `chatAlert`
- `chatAlertFilled`
- `chatAlertTwotone`
- `chatBubble`
- `chatBubbleFilled`
- `chatBubbleOff`
- `chatBubbleOffFilled`
- `chatBubbleOffTwotone`
- `chatBubbleTwotone`
- `chatFilled`
- `chatOff`
- `chatOffFilled`
- `chatOffTwotone`
- `chatRound`
- `chatRoundAlert`
- `chatRoundAlertFilled`
- `chatRoundAlertTwotone`
- `chatRoundDots`
- `chatRoundDotsFilled`
- `chatRoundDotsTwotone`
- `chatRoundFilled`
- `chatRoundOff`
- `chatRoundOffFilled`
- `chatRoundOffTwotone`
- `chatRoundTwotone`
- `chatTwotone`
- `checkAll`
- `checkList3`
- `checkList3Filled`
- `checkList3Twotone`
- `chevronDoubleDown`
- `chevronDoubleLeft`
- `chevronDoubleRight`
- `chevronDoubleUp`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownCircleTwotone`
- `chevronDownSquare`
- `chevronDownSquareTwotone`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronLeftCircleTwotone`
- `chevronLeftSquare`
- `chevronLeftSquareTwotone`
- `chevronRight`
- `chevronRightCircle`
- `chevronRightCircleTwotone`
- `chevronRightSquare`
- `chevronRightSquareTwotone`
- `chevronSmallDoubleDown`
- `chevronSmallDoubleLeft`
- `chevronSmallDoubleRight`
- `chevronSmallDoubleUp`
- `chevronSmallDown`
- `chevronSmallLeft`
- `chevronSmallRight`
- `chevronSmallTripleDown`
- `chevronSmallTripleLeft`
- `chevronSmallTripleRight`
- `chevronSmallTripleUp`
- `chevronSmallUp`
- `chevronTripleDown`
- `chevronTripleLeft`
- `chevronTripleRight`
- `chevronTripleUp`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpCircleTwotone`
- `chevronUpSquare`
- `chevronUpSquareTwotone`
- `circle`
- `circleFilledToConfirmCircleFilledTransition`
- `circleToConfirmCircleTransition`
- `circleToConfirmCircleTwotoneTransition`
- `circleTwotone`
- `circleTwotoneToConfirmCircleTransition`
- `circleTwotoneToConfirmCircleTwotoneTransition`
- `clipboard`
- `clipboardArrow`
- `clipboardArrowTwotone`
- `clipboardCheck`
- `clipboardCheckToClipboardTransition`
- `clipboardCheckTwotone`
- `clipboardCheckTwotoneToClipboardTwotoneTransition`
- `clipboardList`
- `clipboardListTwotone`
- `clipboardMinus`
- `clipboardMinusTwotone`
- `clipboardPlus`
- `clipboardPlusTwotone`
- `clipboardRemove`
- `clipboardRemoveTwotone`
- `clipboardToClipboardCheckTransition`
- `clipboardTwotone`
- `clipboardTwotoneToClipboardCheckTwotoneTransition`
- `close`
- `closeCircle`
- `closeCircleFilled`
- `closeCircleTwotone`
- `closeSmall`
- `closeToMenuAltTransition`
- `closeToMenuTransition`
- `cloud`
- `cloudAlt`
- `cloudAltBraces`
- `cloudAltBracesLoop`
- `cloudAltDownload`
- `cloudAltDownloadFilled`
- `cloudAltDownloadFilledLoop`
- `cloudAltDownloadLoop`
- `cloudAltDownloadTwotone`
- `cloudAltDownloadTwotoneLoop`
- `cloudAltFilled`
- `cloudAltFilledLoop`
- `cloudAltLoop`
- `cloudAltOff`
- `cloudAltOffFilled`
- `cloudAltOffFilledLoop`
- `cloudAltOffLoop`
- `cloudAltOffTwotone`
- `cloudAltOffTwotoneLoop`
- `cloudAltPrintFilledLoop`
- `cloudAltPrintLoop`
- `cloudAltPrintTwotoneLoop`
- `cloudAltTags`
- `cloudAltTagsFilled`
- `cloudAltTagsFilledLoop`
- `cloudAltTagsLoop`
- `cloudAltTagsTwotone`
- `cloudAltTagsTwotoneLoop`
- `cloudAltTwotone`
- `cloudAltTwotoneLoop`
- `cloudAltUpload`
- `cloudAltUploadFilled`
- `cloudAltUploadFilledLoop`
- `cloudAltUploadLoop`
- `cloudAltUploadTwotone`
- `cloudAltUploadTwotoneLoop`
- `cloudDown`
- `cloudDownTwotone`
- `cloudFilled`
- `cloudTwotone`
- `cloudUp`
- `cloudUpTwotone`
- `coffee`
- `coffeeArrow`
- `coffeeArrowFilled`
- `coffeeArrowTwotone`
- `coffeeFilled`
- `coffeeFilledLoop`
- `coffeeHalfEmptyFilledLoop`
- `coffeeHalfEmptyTwotoneLoop`
- `coffeeLoop`
- `coffeeTwotone`
- `coffeeTwotoneLoop`
- `cog`
- `cogFilled`
- `cogFilledLoop`
- `cogLoop`
- `cogOff`
- `cogOffFilled`
- `cogOffFilledLoop`
- `cogOffLoop`
- `compass`
- `compassFilled`
- `compassFilledLoop`
- `compassLoop`
- `compassOff`
- `compassOffFilled`
- `compassOffFilledLoop`
- `compassOffLoop`
- `compassOffTwotone`
- `compassOffTwotoneLoop`
- `compassTwotone`
- `compassTwotoneLoop`
- `computer`
- `computerTwotone`
- `confirm`
- `confirmCircle`
- `confirmCircleFilled`
- `confirmCircleFilledToCircleFilledTransition`
- `confirmCircleToCircleTransition`
- `confirmCircleToCircleTwotoneTransition`
- `confirmCircleTwotone`
- `confirmCircleTwotoneToCircleTransition`
- `confirmCircleTwotoneToCircleTwotoneTransition`
- `confirmSquare`
- `confirmSquareFilled`
- `confirmSquareFilledToSquareFilledTransition`
- `confirmSquareToSquareTransition`
- `confirmSquareToSquareTwotoneTransition`
- `confirmSquareTwotone`
- `confirmSquareTwotoneToSquareTransition`
- `confirmSquareTwotoneToSquareTwotoneTransition`
- `construction`
- `constructionTwotone`
- `cookie`
- `cookieCheck`
- `cookieCheckFilled`
- `cookieCheckTwotone`
- `cookieFilled`
- `cookieMinus`
- `cookieMinusFilled`
- `cookieMinusTwotone`
- `cookieOff`
- `cookieOffFilled`
- `cookieOffTwotone`
- `cookiePlus`
- `cookiePlusFilled`
- `cookiePlusTwotone`
- `cookieRemove`
- `cookieRemoveFilled`
- `cookieRemoveTwotone`
- `cookieSettings`
- `cookieSettingsFilled`
- `cookieSettingsTwotone`
- `cookieTwotone`
- `discord`
- `discordTwotone`
- `document`
- `documentAdd`
- `documentAddTwotone`
- `documentCode`
- `documentCodeTwotone`
- `documentDelete`
- `documentDeleteTwotone`
- `documentList`
- `documentListTwotone`
- `documentRemove`
- `documentRemoveTwotone`
- `documentReport`
- `documentReportTwotone`
- `documentTwotone`
- `doubleArrowHorizontal`
- `doubleArrowVertical`
- `download`
- `downloadLoop`
- `downloadOff`
- `downloadOffLoop`
- `downloadOffOutline`
- `downloadOffOutlineLoop`
- `downloadOffTwotone`
- `downloadOffTwotoneLoop`
- `downloadOutline`
- `downloadOutlineLoop`
- `downloadTwotone`
- `downloadTwotoneLoop`
- `downloading`
- `downloadingLoop`
- `edit`
- `editFilled`
- `editFullFilled`
- `editFullTwotone`
- `editTwotone`
- `email`
- `emailAlert`
- `emailAlertFilled`
- `emailAlertTwotone`
- `emailAltFilled`
- `emailAltTwotone`
- `emailArrowDown`
- `emailArrowDownFilled`
- `emailArrowDownTwotone`
- `emailArrowLeft`
- `emailArrowLeftFilled`
- `emailArrowLeftTwotone`
- `emailArrowRight`
- `emailArrowRightFilled`
- `emailArrowRightTwotone`
- `emailArrowUp`
- `emailArrowUpFilled`
- `emailArrowUpTwotone`
- `emailCheck`
- `emailCheckFilled`
- `emailCheckTwotone`
- `emailFilled`
- `emailMinus`
- `emailMinusFilled`
- `emailMinusTwotone`
- `emailMultiple`
- `emailMultipleFilled`
- `emailMultipleTwotone`
- `emailOpened`
- `emailOpenedAltFilled`
- `emailOpenedAltTwotone`
- `emailOpenedFilled`
- `emailOpenedMultiple`
- `emailOpenedMultipleFilled`
- `emailOpenedMultipleTwotone`
- `emailOpenedTwotone`
- `emailPlus`
- `emailPlusFilled`
- `emailPlusTwotone`
- `emailRemove`
- `emailRemoveFilled`
- `emailRemoveTwotone`
- `emailTwotone`
- `emojiAngry`
- `emojiAngryFilled`
- `emojiAngryTwotone`
- `emojiCry`
- `emojiCryFilled`
- `emojiFrown`
- `emojiFrownFilled`
- `emojiFrownOpen`
- `emojiFrownOpenFilled`
- `emojiFrownOpenTwotone`
- `emojiFrownTwotone`
- `emojiGrin`
- `emojiGrinFilled`
- `emojiGrinTwotone`
- `emojiNeutral`
- `emojiNeutralFilled`
- `emojiNeutralTwotone`
- `emojiSmile`
- `emojiSmileFilled`
- `emojiSmileTwotone`
- `emojiSmileWink`
- `emojiSmileWinkFilled`
- `emojiSmileWinkTwotone`
- `engine`
- `engineFilled`
- `engineOff`
- `engineOffFilled`
- `engineOffTwotone`
- `engineTwotone`
- `externalLink`
- `externalLinkRounded`
- `facebook`
- `file`
- `fileCancel`
- `fileCancelFilled`
- `fileCancelTwotone`
- `fileDocument`
- `fileDocumentCancel`
- `fileDocumentCancelFilled`
- `fileDocumentCancelTwotone`
- `fileDocumentFilled`
- `fileDocumentMinus`
- `fileDocumentMinusFilled`
- `fileDocumentMinusTwotone`
- `fileDocumentOff`
- `fileDocumentOffFilled`
- `fileDocumentOffTwotone`
- `fileDocumentPlus`
- `fileDocumentPlusFilled`
- `fileDocumentPlusTwotone`
- `fileDocumentRemove`
- `fileDocumentRemoveFilled`
- `fileDocumentRemoveTwotone`
- `fileDocumentTwotone`
- `fileDownload`
- `fileDownloadFilled`
- `fileDownloadTwotone`
- `fileExport`
- `fileExportFilled`
- `fileExportTwotone`
- `fileFilled`
- `fileImport`
- `fileImportFilled`
- `fileImportTwotone`
- `fileMinus`
- `fileMinusFilled`
- `fileMinusTwotone`
- `fileOff`
- `fileOffFilled`
- `fileOffTwotone`
- `filePlus`
- `filePlusFilled`
- `filePlusTwotone`
- `fileRemove`
- `fileRemoveFilled`
- `fileRemoveTwotone`
- `fileSearch`
- `fileSearchFilled`
- `fileSearchTwotone`
- `fileTwotone`
- `fileUpload`
- `fileUploadFilled`
- `fileUploadTwotone`
- `filter`
- `filterAlt`
- `filterAltOff`
- `filterConfirm`
- `filterConfirmFilled`
- `filterConfirmTwotone`
- `filterFilled`
- `filterMinus`
- `filterMinusFilled`
- `filterMinusTwotone`
- `filterOff`
- `filterOffFilled`
- `filterOffTwotone`
- `filterPlus`
- `filterPlusFilled`
- `filterPlusTwotone`
- `filterRemove`
- `filterRemoveFilled`
- `filterRemoveTwotone`
- `filterTwotone`
- `folder`
- `folderArrowDown`
- `folderArrowDownFilled`
- `folderArrowDownTwotone`
- `folderArrowLeft`
- `folderArrowLeftFilled`
- `folderArrowLeftTwotone`
- `folderArrowRight`
- `folderArrowRightFilled`
- `folderArrowRightTwotone`
- `folderArrowUp`
- `folderArrowUpFilled`
- `folderArrowUpTwotone`
- `folderCancel`
- `folderCancelFilled`
- `folderCancelTwotone`
- `folderCheck`
- `folderCheckFilled`
- `folderCheckTwotone`
- `folderFilled`
- `folderMinus`
- `folderMinusFilled`
- `folderMinusTwotone`
- `folderMultiple`
- `folderMultipleFilled`
- `folderMultipleTwotone`
- `folderMusic`
- `folderMusicFilled`
- `folderMusicTwotone`
- `folderNetwork`
- `folderNetworkFilled`
- `folderNetworkTwotone`
- `folderOff`
- `folderOffFilled`
- `folderOffTwotone`
- `folderPlus`
- `folderPlusFilled`
- `folderPlusTwotone`
- `folderRemove`
- `folderRemoveFilled`
- `folderRemoveTwotone`
- `folderSettings`
- `folderSettingsFilled`
- `folderSettingsTwotone`
- `folderTwotone`
- `folderZip`
- `folderZipFilled`
- `folderZipTwotone`
- `forkLeft`
- `forkRight`
- `gauge`
- `gaugeEmpty`
- `gaugeEmptyTwotone`
- `gaugeFull`
- `gaugeFullTwotone`
- `gaugeLoop`
- `gaugeLow`
- `gaugeLowTwotone`
- `gaugeTwotone`
- `gaugeTwotoneLoop`
- `github`
- `githubLoop`
- `githubTwotone`
- `grid3`
- `grid3Filled`
- `grid3Twotone`
- `hash`
- `hashSmall`
- `hazardLights`
- `hazardLightsFilled`
- `hazardLightsFilledLoop`
- `hazardLightsLoop`
- `hazardLightsOff`
- `hazardLightsOffFilled`
- `hazardLightsOffFilledLoop`
- `hazardLightsOffLoop`
- `heart`
- `heartFilled`
- `heartFilledHalf`
- `heartHalf`
- `heartHalfFilled`
- `heartHalfTwotone`
- `heartTwotone`
- `heartTwotoneHalf`
- `heartTwotoneHalfFilled`
- `home`
- `homeAltTwotone`
- `homeMd`
- `homeMdAltTwotone`
- `homeMdTwotone`
- `homeSimple`
- `homeSimpleFilled`
- `homeSimpleTwotone`
- `homeTwotone`
- `iconify1`
- `iconify2`
- `iconify2Static`
- `iconify2StaticTwotone`
- `image`
- `imageFilled`
- `imageTwotone`
- `instagram`
- `laptop`
- `laptopTwotone`
- `lightDark`
- `lightDarkLoop`
- `lightbulb`
- `lightbulbFilled`
- `lightbulbOff`
- `lightbulbOffFilled`
- `lightbulbOffFilledLoop`
- `lightbulbOffLoop`
- `lightbulbOffTwotone`
- `lightbulbOffTwotoneLoop`
- `lightbulbTwotone`
- `link`
- `linkedin`
- `list`
- `list3`
- `list3Filled`
- `list3Twotone`
- `listIndented`
- `listIndentedReversed`
- `loadingAltLoop`
- `loadingLoop`
- `loadingTwotoneLoop`
- `logIn`
- `logOut`
- `login`
- `logout`
- `mapMarker`
- `mapMarkerAlt`
- `mapMarkerAltFilled`
- `mapMarkerAltFilledLoop`
- `mapMarkerAltLoop`
- `mapMarkerAltOff`
- `mapMarkerAltOffFilled`
- `mapMarkerAltOffFilledLoop`
- `mapMarkerAltOffLoop`
- `mapMarkerAltOffTwotone`
- `mapMarkerAltOffTwotoneLoop`
- `mapMarkerAltTwotone`
- `mapMarkerAltTwotoneLoop`
- `mapMarkerFilled`
- `mapMarkerFilledLoop`
- `mapMarkerLoop`
- `mapMarkerMinus`
- `mapMarkerMinusFilled`
- `mapMarkerMinusTwotone`
- `mapMarkerMultipleAlt`
- `mapMarkerMultipleAltFilled`
- `mapMarkerMultipleAltTwotone`
- `mapMarkerOff`
- `mapMarkerOffFilled`
- `mapMarkerOffFilledLoop`
- `mapMarkerOffLoop`
- `mapMarkerOffTwotone`
- `mapMarkerOffTwotoneLoop`
- `mapMarkerPlus`
- `mapMarkerPlusFilled`
- `mapMarkerPlusTwotone`
- `mapMarkerRadius`
- `mapMarkerRadiusFilled`
- `mapMarkerRadiusTwotone`
- `mapMarkerRemove`
- `mapMarkerRemoveFilled`
- `mapMarkerRemoveTwotone`
- `mapMarkerTwotone`
- `mapMarkerTwotoneLoop`
- `marker`
- `markerFilled`
- `markerTwotone`
- `mastodon`
- `mastodonFilled`
- `mastodonTwotone`
- `medicalServices`
- `medicalServicesFilled`
- `medicalServicesTwotone`
- `menu`
- `menuFoldLeft`
- `menuFoldRight`
- `menuToCloseAltTransition`
- `menuToCloseTransition`
- `menuUnfoldLeft`
- `menuUnfoldRight`
- `minus`
- `minusCircle`
- `minusCircleFilled`
- `minusCircleTwotone`
- `minusSquare`
- `minusSquareFilled`
- `minusSquareTwotone`
- `monitor`
- `monitorArrowDown`
- `monitorArrowDownTwotone`
- `monitorArrowUp`
- `monitorArrowUpTwotone`
- `monitorFilled`
- `monitorMutlple`
- `monitorMutlpleTwotone`
- `monitorOff`
- `monitorOffFilled`
- `monitorOffTwotone`
- `monitorScreenshot`
- `monitorScreenshotTwotone`
- `monitorSmall`
- `monitorSmallFilled`
- `monitorSmallTwotone`
- `monitorTwotone`
- `moon`
- `moonAltLoop`
- `moonAltToSunnyOutlineLoopTransition`
- `moonFilled`
- `moonFilledAltLoop`
- `moonFilledAltToSunnyFilledLoopTransition`
- `moonFilledLoop`
- `moonFilledToSunnyFilledLoopTransition`
- `moonFilledToSunnyFilledTransition`
- `moonLoop`
- `moonRisingAltLoop`
- `moonRisingFilledAltLoop`
- `moonRisingFilledLoop`
- `moonRisingLoop`
- `moonRisingTwotoneAltLoop`
- `moonRisingTwotoneLoop`
- `moonSimple`
- `moonSimpleFilled`
- `moonSimpleTwotone`
- `moonToSunnyOutlineLoopTransition`
- `moonToSunnyOutlineTransition`
- `moonTwotone`
- `moonTwotoneAltLoop`
- `moonTwotoneLoop`
- `mushroom`
- `mushroomFilled`
- `mushroomOff`
- `mushroomOffFilled`
- `mushroomOffTwotone`
- `mushroomTwotone`
- `myLocation`
- `myLocationLoop`
- `myLocationOff`
- `myLocationOffLoop`
- `navigationLeftDown`
- `navigationLeftUp`
- `navigationRightDown`
- `navigationRightUp`
- `paintDrop`
- `paintDropFilled`
- `paintDropHalfFilled`
- `paintDropHalfFilledTwotone`
- `paintDropHalfTwotone`
- `paintDropTwotone`
- `patreon`
- `pause`
- `pauseToPlayFilledTransition`
- `pauseToPlayTransition`
- `peanut`
- `peanutFilled`
- `peanutOff`
- `peanutOffFilled`
- `peanutOffTwotone`
- `peanutTwotone`
- `peertube`
- `peertubeAlt`
- `pencil`
- `pencilAltTwotone`
- `pencilTwotone`
- `person`
- `personAdd`
- `personAddFilled`
- `personAddTwotone`
- `personFilled`
- `personOff`
- `personOffFilled`
- `personOffFilledLoop`
- `personOffLoop`
- `personOffTwotone`
- `personOffTwotoneLoop`
- `personRemove`
- `personRemoveFilled`
- `personRemoveTwotone`
- `personSearch`
- `personSearchFilled`
- `personSearchTwotone`
- `personTwotone`
- `phone`
- `phoneAdd`
- `phoneAddFilled`
- `phoneAddTwotone`
- `phoneCall`
- `phoneCallFilled`
- `phoneCallLoop`
- `phoneCallTwotone`
- `phoneCallTwotoneLoop`
- `phoneFilled`
- `phoneIncoming`
- `phoneIncomingFilled`
- `phoneIncomingTwotone`
- `phoneOff`
- `phoneOffFilled`
- `phoneOffFilledLoop`
- `phoneOffLoop`
- `phoneOffTwotone`
- `phoneOffTwotoneLoop`
- `phoneOutgoing`
- `phoneOutgoingFilled`
- `phoneOutgoingTwotone`
- `phoneRemove`
- `phoneRemoveFilled`
- `phoneRemoveTwotone`
- `phoneTwotone`
- `pixelfed`
- `pixelfedFilled`
- `pixelfedTwotone`
- `pizza`
- `pizzaFilled`
- `pizzaOff`
- `pizzaOffFilled`
- `pizzaOffTwotone`
- `pizzaTwotone`
- `play`
- `playFilled`
- `playFilledToPauseTransition`
- `playToPauseTransition`
- `playTwotone`
- `pleroma`
- `plus`
- `plusCircle`
- `plusCircleFilled`
- `plusCircleTwotone`
- `plusSquare`
- `plusSquareFilled`
- `plusSquareTwotone`
- `question`
- `questionCircle`
- `questionCircleTwotone`
- `questionSquare`
- `questionSquareTwotone`
- `reddit`
- `redditCircle`
- `redditCircleLoop`
- `redditLoop`
- `remove`
- `rotate180`
- `rotate270`
- `rotate90`
- `round360`
- `roundRampLeft`
- `roundRampRight`
- `roundaboutLeft`
- `roundaboutRight`
- `rss`
- `search`
- `searchFilled`
- `searchTwotone`
- `security`
- `securityTwotone`
- `soundcloud`
- `speed`
- `speedLoop`
- `speedTwotone`
- `speedTwotoneLoop`
- `speedometer`
- `speedometerLoop`
- `spotify`
- `spotifyFilled`
- `square`
- `squareFilledToConfirmSquareFilledTransition`
- `squareToConfirmSquareTransition`
- `squareToConfirmSquareTwotoneTransition`
- `squareTwotone`
- `squareTwotoneToConfirmSquareTransition`
- `squareTwotoneToConfirmSquareTwotoneTransition`
- `star`
- `starAlt`
- `starAltFilled`
- `starAltTwotone`
- `starFilled`
- `starFilledHalf`
- `starFilledRightHalf`
- `starHalf`
- `starHalfFilled`
- `starHalfTwotone`
- `starPulsatingFilledLoop`
- `starPulsatingLoop`
- `starPulsatingTwotoneLoop`
- `starRightHalf`
- `starRightHalfFilled`
- `starRightHalfTwotone`
- `starTwotone`
- `starTwotoneHalf`
- `starTwotoneRightHalf`
- `steering`
- `steeringOff`
- `sunRisingFilledLoop`
- `sunRisingLoop`
- `sunRisingTwotoneLoop`
- `sunny`
- `sunnyFilled`
- `sunnyFilledLoop`
- `sunnyFilledLoopToMoonFilledAltLoopTransition`
- `sunnyFilledLoopToMoonFilledLoopTransition`
- `sunnyFilledLoopToMoonFilledTransition`
- `sunnyLoop`
- `sunnyOutline`
- `sunnyOutlineLoop`
- `sunnyOutlineToMoonAltLoopTransition`
- `sunnyOutlineToMoonLoopTransition`
- `sunnyOutlineToMoonTransition`
- `sunnyOutlineTwotone`
- `sunnyOutlineTwotoneLoop`
- `sunnyTwotone`
- `sunnyTwotoneLoop`
- `switch`
- `switchFilled`
- `switchFilledToSwitchOffFilledTransition`
- `switchOff`
- `switchOffFilled`
- `switchOffFilledToSwitchFilledTransition`
- `switchOffToSwitchTransition`
- `switchOffTwotone`
- `switchOffTwotoneToSwitchTwotoneTransition`
- `switchToSwitchOffTransition`
- `switchTwotone`
- `switchTwotoneToSwitchOffTwotoneTransition`
- `tablet`
- `tabletArrowDown`
- `tabletArrowDownTwotone`
- `tabletArrowUp`
- `tabletArrowUpTwotone`
- `tabletOff`
- `tabletOffTwotone`
- `tabletScreenshot`
- `tabletScreenshotTwotone`
- `tabletTwotone`
- `taco`
- `telegram`
- `textBox`
- `textBoxMultiple`
- `textBoxMultipleToTextBoxTransition`
- `textBoxMultipleTwotone`
- `textBoxMultipleTwotoneToTextBoxTwotoneTransition`
- `textBoxToTextBoxMultipleTransition`
- `textBoxTwotone`
- `textBoxTwotoneToTextBoxMultipleTwotoneTransition`
- `thumbsDown`
- `thumbsDownFilled`
- `thumbsDownTwotone`
- `thumbsUp`
- `thumbsUpFilled`
- `thumbsUpTwotone`
- `tiktok`
- `trash`
- `turnLeft`
- `turnRight`
- `turnSharpLeft`
- `turnSharpRight`
- `turnSlightLeft`
- `turnSlightRight`
- `twitter`
- `twitterFilled`
- `twitterTwotone`
- `twitterX`
- `twitterXAlt`
- `uTurnLeft`
- `uTurnRight`
- `upload`
- `uploadLoop`
- `uploadOff`
- `uploadOffLoop`
- `uploadOffOutline`
- `uploadOffOutlineLoop`
- `uploadOffTwotone`
- `uploadOffTwotoneLoop`
- `uploadOutline`
- `uploadOutlineLoop`
- `uploadTwotone`
- `uploadTwotoneLoop`
- `uploading`
- `uploadingLoop`
- `valignBaseline`
- `valignBaselineTwotone`
- `valignBottom`
- `valignBottomTwotone`
- `valignMiddle`
- `valignMiddleTwotone`
- `valignTop`
- `valignTopTwotone`
- `volumeHigh`
- `volumeHighFilled`
- `volumeHighTwotone`
- `volumeLow`
- `volumeLowFilled`
- `volumeLowTwotone`
- `volumeMedium`
- `volumeMediumFilled`
- `volumeMediumTwotone`
- `volumeMinus`
- `volumeMinusFilled`
- `volumeMinusTwotone`
- `volumePlus`
- `volumePlusFilled`
- `volumePlusTwotone`
- `volumeRemove`
- `volumeRemoveFilled`
- `volumeRemoveTwotone`
- `watch`
- `watchLoop`
- `watchOff`
- `watchOffLoop`
- `watchOffTwotone`
- `watchOffTwotoneLoop`
- `watchTwotone`
- `watchTwotoneLoop`
- `water`
- `waterFilled`
- `waterOff`
- `waterOffFilled`
- `waterOffTwotone`
- `waterTwotone`
- `weatherCloudyLoop`
- `youtube`
- `youtubeFilled`
- `youtubeTwotone`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccountIcon, AccountAddIcon, AccountAlertIcon, AccountAlertLoopIcon } from '@stacksjs/iconify-line-md'

  global.navIcons = {
    home: AccountIcon({ size: 20, class: 'nav-icon' }),
    about: AccountAddIcon({ size: 20, class: 'nav-icon' }),
    contact: AccountAlertIcon({ size: 20, class: 'nav-icon' }),
    settings: AccountAlertLoopIcon({ size: 20, class: 'nav-icon' })
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
import { AccountIcon } from '@stacksjs/iconify-line-md'

const icon = AccountIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccountIcon, AccountAddIcon, AccountAlertIcon } from '@stacksjs/iconify-line-md'

const successIcon = AccountIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccountAddIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccountAlertIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccountIcon, AccountAddIcon } from '@stacksjs/iconify-line-md'
   const icon = AccountIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { account, accountAdd } from '@stacksjs/iconify-line-md'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(account, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccountIcon, AccountAddIcon } from '@stacksjs/iconify-line-md'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-line-md'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccountIcon } from '@stacksjs/iconify-line-md'
     global.icon = AccountIcon({ size: 24 })
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
   const icon = AccountIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { account } from '@stacksjs/iconify-line-md'

// Icons are typed as IconData
const myIcon: IconData = account
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/cyberalien/line-md/blob/master/license.txt) for more information.

## Credits

- **Icons**: Vjacheslav Trushkin ([Website](https://github.com/cyberalien/line-md))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/line-md/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/line-md/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
