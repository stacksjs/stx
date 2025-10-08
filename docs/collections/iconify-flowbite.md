# Flowbite Icons

> Flowbite Icons icons for stx from Iconify

## Overview

This package provides access to 804 icons from the Flowbite Icons collection through the stx iconify integration.

**Collection ID:** `flowbite`
**Total Icons:** 804
**Author:** Themesberg ([Website](https://github.com/themesberg/flowbite-icons))
**License:** MIT ([Details](https://github.com/themesberg/flowbite-icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-flowbite
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddColumnAfterOutlineIcon height="1em" />
<AddColumnAfterOutlineIcon width="1em" height="1em" />
<AddColumnAfterOutlineIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddColumnAfterOutlineIcon size="24" />
<AddColumnAfterOutlineIcon size="1em" />

<!-- Using width and height -->
<AddColumnAfterOutlineIcon width="24" height="32" />

<!-- With color -->
<AddColumnAfterOutlineIcon size="24" color="red" />
<AddColumnAfterOutlineIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddColumnAfterOutlineIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddColumnAfterOutlineIcon
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
    <AddColumnAfterOutlineIcon size="24" />
    <AddColumnBeforeOutlineIcon size="24" color="#4a90e2" />
    <AddressBookOutlineIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addColumnAfterOutline, addColumnBeforeOutline, addressBookOutline } from '@stacksjs/iconify-flowbite'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addColumnAfterOutline, { size: 24 })
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
<AddColumnAfterOutlineIcon size="24" color="red" />
<AddColumnAfterOutlineIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddColumnAfterOutlineIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddColumnAfterOutlineIcon size="24" class="text-primary" />
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
<AddColumnAfterOutlineIcon height="1em" />
<AddColumnAfterOutlineIcon width="1em" height="1em" />
<AddColumnAfterOutlineIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddColumnAfterOutlineIcon size="24" />
<AddColumnAfterOutlineIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.flowbite-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddColumnAfterOutlineIcon class="flowbite-icon" />
```

## Available Icons

This package contains **804** icons:

- `addColumnAfterOutline`
- `addColumnBeforeOutline`
- `addressBookOutline`
- `addressBookSolid`
- `adjustmentsHorizontalOutline`
- `adjustmentsHorizontalSolid`
- `adjustmentsVerticalOutline`
- `adjustmentsVerticalSolid`
- `alignCenterOutline`
- `alignCenterSolid`
- `alignJustifyOutline`
- `alignLeftOutline`
- `alignRightOutline`
- `angleDownOutline`
- `angleLeftOutline`
- `angleRightOutline`
- `angleUpOutline`
- `annotationOutline`
- `annotationSolid`
- `apiKeyOutline`
- `appleFullOutline`
- `appleFullSolid`
- `appleSolid`
- `archiveArrowDownOutline`
- `archiveArrowDownSolid`
- `archiveOutline`
- `archiveSolid`
- `arrowDownOutline`
- `arrowDownToBracketOutline`
- `arrowDownToBracketSolid`
- `arrowLeftOutline`
- `arrowLeftSolid`
- `arrowLeftToBracketOutline`
- `arrowLeftToBracketSolid`
- `arrowRightAltOutline`
- `arrowRightAltSolid`
- `arrowRightArrowLeftSolid`
- `arrowRightOutline`
- `arrowRightSolid`
- `arrowRightToBracketOutline`
- `arrowRightToBracketSolid`
- `arrowSortLettersOutline`
- `arrowSortLettersSolid`
- `arrowUpDownOutline`
- `arrowUpDownSolid`
- `arrowUpFromBracketOutline`
- `arrowUpOutline`
- `arrowUpRightDownLeftOutline`
- `arrowUpRightDownLeftSolid`
- `arrowUpRightFromSquareOutline`
- `arrowUpRightFromSquareSolid`
- `arrowUpSolid`
- `arrowsRepeatCountOutline`
- `arrowsRepeatOutline`
- `atomOutline`
- `atomSolid`
- `awardOutline`
- `awardSolid`
- `awsSolid`
- `backwardStepOutline`
- `backwardStepSolid`
- `baconOutline`
- `baconSolid`
- `badgeCheckOutline`
- `badgeCheckSolid`
- `banOutline`
- `barcodeOutline`
- `barsFromLeftOutline`
- `barsOutline`
- `batteryOutline`
- `batterySolid`
- `bedOutline`
- `bedSolid`
- `beerMugEmptyOutline`
- `beerMugEmptySolid`
- `bellActiveAltOutline`
- `bellActiveAltSolid`
- `bellActiveOutline`
- `bellActiveSolid`
- `bellOutline`
- `bellRingOutline`
- `bellRingSolid`
- `bellSolid`
- `bitcoinSolid`
- `blenderPhoneOutline`
- `blenderPhoneSolid`
- `boneOutline`
- `boneSolid`
- `bookOpenOutline`
- `bookOpenReaderOutline`
- `bookOpenReaderSolid`
- `bookOpenSolid`
- `bookOutline`
- `bookSolid`
- `bookmarkOutline`
- `bookmarkSolid`
- `boothCurtainOutline`
- `boothCurtainSolid`
- `bowlFoodOutline`
- `bowlFoodSolid`
- `bowlRiceOutline`
- `bowlRiceSolid`
- `brainOutline`
- `brainSolid`
- `breadSliceOutline`
- `breadSliceSolid`
- `briefcaseOutline`
- `briefcaseSolid`
- `bugOutline`
- `bugSolid`
- `buildingOutline`
- `buildingSolid`
- `bullhornOutline`
- `bullhornSolid`
- `burgerOutline`
- `burgerSolid`
- `cakeCandlesOutline`
- `cakeCandlesSolid`
- `calendarEditOutline`
- `calendarEditSolid`
- `calendarMonthOutline`
- `calendarMonthSolid`
- `calendarPlusOutline`
- `calendarPlusSolid`
- `calendarWeekOutline`
- `calendarWeekSolid`
- `cameraFotoOutline`
- `cameraFotoSolid`
- `cameraPhotoOutline`
- `cameraPhotoSolid`
- `candyCaneOutline`
- `candyCaneSolid`
- `captionOutline`
- `captionSolid`
- `captioningOutline`
- `captioningSolid`
- `caretDownOutline`
- `caretDownSolid`
- `caretLeftOutline`
- `caretLeftSolid`
- `caretRightOutline`
- `caretRightSolid`
- `caretSortOutline`
- `caretSortSolid`
- `caretUpOutline`
- `caretUpSolid`
- `carrotOutline`
- `carrotSolid`
- `cartOutline`
- `cartPlusAltOutline`
- `cartPlusAltSolid`
- `cartPlusOutline`
- `cartPlusSolid`
- `cartSolid`
- `cashOutline`
- `cashRegisterOutline`
- `cashRegisterSolid`
- `cashSolid`
- `cellAttributesOutline`
- `chalkboardOutline`
- `chalkboardSolid`
- `chalkboardUserOutline`
- `chalkboardUserSolid`
- `champagneGlassesOutline`
- `champagneGlassesSolid`
- `chartLineDownOutline`
- `chartLineUpOutline`
- `chartLineUpSolid`
- `chartMixedDollarOutline`
- `chartMixedDollarSolid`
- `chartMixedOutline`
- `chartOutline`
- `chartPieOutline`
- `chartPieSolid`
- `chartSolid`
- `checkCircleOutline`
- `checkCircleSolid`
- `checkOutline`
- `checkPlusCircleOutline`
- `checkPlusCircleSolid`
- `checkSolid`
- `cheeseOutline`
- `cheeseSolid`
- `chevronDoubleDownOutline`
- `chevronDoubleLeftOutline`
- `chevronDoubleRightOutline`
- `chevronDoubleUpOutline`
- `chevronDownOutline`
- `chevronLeftOutline`
- `chevronRightOutline`
- `chevronSortOutline`
- `chevronUpOutline`
- `circleMinusOutline`
- `circleMinusSolid`
- `circlePauseOutline`
- `circlePauseSolid`
- `circlePlusOutline`
- `circlePlusSolid`
- `clapperboardPlayOutline`
- `clapperboardPlaySolid`
- `clipboardCheckOutline`
- `clipboardCheckSolid`
- `clipboardCleanOutline`
- `clipboardCleanSolid`
- `clipboardListOutline`
- `clipboardListSolid`
- `clipboardOutline`
- `clipboardSolid`
- `clockArrowOutline`
- `clockOutline`
- `clockSolid`
- `closeCircleOutline`
- `closeCircleSolid`
- `closeOutline`
- `closeSidebarAltOutline`
- `closeSidebarAltSolid`
- `closeSidebarOutline`
- `closeSidebarSolid`
- `closeSolid`
- `cloudArrowUpOutline`
- `cloudArrowUpSolid`
- `cloudMeatballOutline`
- `cloudMeatballSolid`
- `codeBranchOutline`
- `codeBranchSolid`
- `codeForkOutline`
- `codeForkSolid`
- `codeMergeOutline`
- `codeMergeSolid`
- `codeOutline`
- `codePullRequestOutline`
- `codePullRequestSolid`
- `codeSolid`
- `cogOutline`
- `cogSolid`
- `columnOutline`
- `columnSolid`
- `commandOutline`
- `commandSolid`
- `compressOutline`
- `computerSpeakerOutline`
- `computerSpeakerSolid`
- `cookieOutline`
- `cookieSolid`
- `creditCardOutline`
- `creditCardPlusAltOutline`
- `creditCardPlusAltSolid`
- `creditCardPlusOutline`
- `creditCardPlusSolid`
- `creditCardSolid`
- `cssSolid`
- `cubeSolid`
- `cubesStackedOutline`
- `cubesStackedSolid`
- `databaseOutline`
- `databaseSolid`
- `deleteColumnOutline`
- `deleteRowOutline`
- `deleteTableOutline`
- `desktopPcOutline`
- `desktopPcSolid`
- `discordSolid`
- `dnaOutline`
- `dollarOutline`
- `dollarSolid`
- `dotsHorizontalOutline`
- `dotsHorizontalSolid`
- `dotsVerticalOutline`
- `dotsVerticalSolid`
- `downloadOutline`
- `downloadSolid`
- `drawSquareOutline`
- `drawSquareSolid`
- `dribbbleSolid`
- `dropboxSolid`
- `dropletBottleAltOutline`
- `dropletBottleAltSolid`
- `dropletBottleOutline`
- `dropletBottleSolid`
- `drumstickBiteOutline`
- `drumstickBiteSolid`
- `editOutline`
- `editSolid`
- `eggOutline`
- `eggSolid`
- `envelopeOpenOutline`
- `envelopeOpenSolid`
- `envelopeOutline`
- `envelopeSolid`
- `euroOutline`
- `euroSolid`
- `exclamationCircleOutline`
- `exclamationCircleSolid`
- `expandOutline`
- `expandSolid`
- `eyeOutline`
- `eyeSlashOutline`
- `eyeSlashSolid`
- `eyeSolid`
- `faceExplodeOutline`
- `faceExplodeSolid`
- `faceGrinOutline`
- `faceGrinSolid`
- `faceGrinStarsOutline`
- `faceGrinStarsSolid`
- `faceLaughOutline`
- `faceLaughSolid`
- `facebookSolid`
- `fileChartBarOutline`
- `fileChartBarSolid`
- `fileCheckOutline`
- `fileCheckSolid`
- `fileCirclePlusOutline`
- `fileCirclePlusSolid`
- `fileCloneOutline`
- `fileCloneSolid`
- `fileCodeOutline`
- `fileCodeSolid`
- `fileCopyAltOutline`
- `fileCopyAltSolid`
- `fileCopyOutline`
- `fileCopySolid`
- `fileCsvOutline`
- `fileCsvSolid`
- `fileDocOutline`
- `fileDocSolid`
- `fileExportOutline`
- `fileExportSolid`
- `fileIcvoiceSolid`
- `fileImageOutline`
- `fileImageSolid`
- `fileImportOutline`
- `fileImportSolid`
- `fileInvoiceOutline`
- `fileInvoiceSolid`
- `fileLinesOutline`
- `fileLinesSolid`
- `fileMusicOutline`
- `fileMusicSolid`
- `fileOutline`
- `filePasteOutline`
- `filePasteSolid`
- `filePdfOutline`
- `filePdfSolid`
- `filePenOutline`
- `filePenSolid`
- `filePptOutline`
- `filePptSolid`
- `fileSearchOutline`
- `fileSearchSolid`
- `fileShieldOutline`
- `fileShieldSolid`
- `fileSolid`
- `fileVideoOutline`
- `fileVideoSolid`
- `fileWordOutline`
- `fileWordSolid`
- `fileZipOutline`
- `fileZipSolid`
- `filterDollarOutline`
- `filterDollarSolid`
- `filterOutline`
- `filterSolid`
- `fingerprintOutline`
- `fingerprintSolid`
- `fireOutline`
- `fireSolid`
- `fishAltOutline`
- `fishAltSolid`
- `fishOutline`
- `fishSolid`
- `fixTablesOutline`
- `flagOutline`
- `flagSolid`
- `flaskOutline`
- `flaskSolid`
- `floppyDiskAltOutline`
- `floppyDiskAltSolid`
- `floppyDiskOutline`
- `floppyDiskSolid`
- `flowbiteSolid`
- `folderArrowRightOutline`
- `folderArrowRightSolid`
- `folderDuplicateOutline`
- `folderDuplicateSolid`
- `folderOpenOutline`
- `folderOpenSolid`
- `folderOutline`
- `folderPlusOutline`
- `folderPlusSolid`
- `folderSolid`
- `fontColorAltSolid`
- `fontColorOutline`
- `fontFamilyOutline`
- `fontHighlightOutline`
- `forwardOutline`
- `forwardSolid`
- `forwardStepOutline`
- `forwardStepSolid`
- `giftBoxOutline`
- `giftBoxSolid`
- `githubSolid`
- `gitlabSolid`
- `glassWaterDropletOutline`
- `glassWaterDropletSolid`
- `glassWaterOutline`
- `glassWaterSolid`
- `globeOutline`
- `globeSolid`
- `goToNextCellOutline`
- `goToPrevCellOutline`
- `googleSolid`
- `graduationCapOutline`
- `graduationCapSolid`
- `gridOutline`
- `gridPlusOutline`
- `gridPlusSolid`
- `gridSolid`
- `hammerOutline`
- `hammerSolid`
- `headphonesOutline`
- `headphonesSolid`
- `heartOutline`
- `heartSolid`
- `homeOutline`
- `homeSolid`
- `horizontalLinesOutline`
- `hotdogOutline`
- `hotdogSolid`
- `hourglassOutline`
- `hourglassSolid`
- `htmlSolid`
- `icecreamAltOutline`
- `icecreamAltSolid`
- `icecreamOutline`
- `icecreamSolid`
- `imageOutline`
- `imageSolid`
- `inboxFullOutline`
- `inboxFullSolid`
- `inboxOutline`
- `inboxSolid`
- `incomingCallOutline`
- `incomingCallSolid`
- `indentOutline`
- `indentSolid`
- `infoCircleOutline`
- `infoCircleSolid`
- `insertRowAfterOutline`
- `insertRowBeforeOutline`
- `insertTableAltOutline`
- `insertTableOutline`
- `instagramSolid`
- `jarOutline`
- `jarSolid`
- `jarWheatOutline`
- `jarWheatSolid`
- `keyboardOutline`
- `keyboardSolid`
- `labelOutline`
- `labelSolid`
- `landmarkOutline`
- `landmarkSolid`
- `languageOutline`
- `laptopCodeOutline`
- `laptopCodeSolid`
- `laptopFileOutline`
- `laptopFileSolid`
- `laravelSolid`
- `layersOutline`
- `layersSolid`
- `lemonOutline`
- `lemonSolid`
- `letterBoldOutline`
- `letterBoldSolid`
- `letterItalicOutline`
- `letterItalicSolid`
- `letterUnderlineOutline`
- `letterUnderlineSolid`
- `lifeSaverOutline`
- `lifeSaverSolid`
- `lightbulbOutline`
- `lightbulbSolid`
- `linkBreakOutline`
- `linkOutline`
- `linkSolid`
- `linkedinSolid`
- `listMusicOutline`
- `listMusicSolid`
- `listOutline`
- `listSolid`
- `lockOpenOutline`
- `lockOpenSolid`
- `lockOutline`
- `lockSolid`
- `lockTimeOutline`
- `lockTimeSolid`
- `magicWandOutline`
- `magicWandSolid`
- `mailBoxOutline`
- `mailBoxSolid`
- `mapLocationOutline`
- `mapPinAltOutline`
- `mapPinAltSolid`
- `mapPinOutline`
- `mapPinSolid`
- `martiniGlassCitrusOutline`
- `martiniGlassCitrusSolid`
- `martiniGlassEmptyOutline`
- `martiniGlassEmptySolid`
- `martiniGlassOutline`
- `martiniGlassSolid`
- `mastercardSolid`
- `mergeCellsOutline`
- `mergeOrSplitOutline`
- `messageCaptionOutline`
- `messageCaptionSolid`
- `messageDotsOutline`
- `messageDotsSolid`
- `messagesOutline`
- `messagesSolid`
- `microphoneOutline`
- `microphoneSlashOutline`
- `microphoneSlashSolid`
- `microphoneSolid`
- `microscopeOutline`
- `microscopeSolid`
- `minimizeOutline`
- `minimizeSolid`
- `minusOutline`
- `missedCallOutline`
- `missedCallSolid`
- `mobilePhoneOutline`
- `mobilePhoneSolid`
- `mongoDbSolid`
- `moonOutline`
- `moonPlusOutline`
- `moonPlusSolid`
- `moonSolid`
- `mugHotOutline`
- `mugHotSolid`
- `mugSaucerOutline`
- `mugSaucerSolid`
- `musicAltOutline`
- `musicAltSolid`
- `musicOutline`
- `musicSolid`
- `newspaperOutline`
- `newspaperSolid`
- `newspapperOutline`
- `newspapperSolid`
- `npmSolid`
- `objectsColumnOutline`
- `objectsColumnSolid`
- `openDoorOutline`
- `openDoorSolid`
- `openSidebarAltOutline`
- `openSidebarAltSolid`
- `openSidebarOutline`
- `openSidebarSolid`
- `orderedListOutline`
- `ordoredListOutline`
- `ordoredListSolid`
- `outdentOutline`
- `outdentSolid`
- `outgoingCallOutline`
- `outgoingCallSolid`
- `paletteOutline`
- `paletteSolid`
- `paperClipOutline`
- `paperPlaneOutline`
- `paperPlaneSolid`
- `papperPlaneSolid`
- `paragraphOutline`
- `paragraphSolid`
- `pauseOutline`
- `pauseSolid`
- `penNibOutline`
- `penNibSolid`
- `penOutline`
- `penSolid`
- `pepperHotOutline`
- `pepperHotSolid`
- `personChalkboardOutline`
- `personChalkboardSolid`
- `phoneHangupOutline`
- `phoneHangupSolid`
- `phoneOutline`
- `phoneSolid`
- `pieChartSolid`
- `pizzaSliceOutline`
- `pizzaSliceSolid`
- `plateWheatOutline`
- `plateWheatSolid`
- `playOutline`
- `playSolid`
- `plusOutline`
- `printerOutline`
- `printerSolid`
- `profileCardOutline`
- `profileCardSolid`
- `qrCodeOutline`
- `questionCircleOutline`
- `questionCircleSolid`
- `quoteOutline`
- `quoteSolid`
- `reactSolid`
- `receiptOutline`
- `receiptSolid`
- `rectangleListOutline`
- `rectangleListSolid`
- `redditSolid`
- `redoOutline`
- `redoSolid`
- `refreshOutline`
- `replyAllOutline`
- `replyAllSolid`
- `replyOutline`
- `replySolid`
- `restoreWindowOutline`
- `rocketOutline`
- `rocketSolid`
- `rotateSolid`
- `rulerCombinedOutline`
- `rulerCombinedSolid`
- `salePercentOutline`
- `salePercentSolid`
- `scaleBalancedOutline`
- `scaleBalancedSolid`
- `schoolAltOutline`
- `schoolAltSolid`
- `schoolCheckAltOutline`
- `schoolCheckAltSolid`
- `schoolCheckOutline`
- `schoolCheckSolid`
- `schoolExclamationAltOutline`
- `schoolExclamationAltSolid`
- `schoolExclamationOutline`
- `schoolExclamationSolid`
- `schoolFlagAltOutline`
- `schoolFlagAltSolid`
- `schoolFlagOutline`
- `schoolFlagSolid`
- `schoolLockAltOutline`
- `schoolLockAltSolid`
- `schoolLockOutline`
- `schoolLockSolid`
- `schoolOutline`
- `schoolSolid`
- `schoolXmarkAltOutline`
- `schoolXmarkAltSolid`
- `schoolXmarkOutline`
- `schoolXmarkSolid`
- `searchOutline`
- `searchSolid`
- `seedlingOutline`
- `seedlingSolid`
- `serverOutline`
- `serverSolid`
- `shapesOutline`
- `shapesSolid`
- `shareAllOutline`
- `shareAllSolid`
- `shareNodesOutline`
- `shareNodesSolid`
- `shieldCheckOutline`
- `shieldCheckSolid`
- `shieldOutline`
- `shieldSolid`
- `shoppingBagOutline`
- `shoppingBagSolid`
- `shrimpOutline`
- `shrimpSolid`
- `shuffleOutline`
- `shuffleSolid`
- `sortHorizontalOutline`
- `sortOutline`
- `sortSolid`
- `splitCellsOutline`
- `stackoverflowSolid`
- `starHalfOutline`
- `starHalfSolid`
- `starHalfStrokeOutline`
- `starHalfStrokeSolid`
- `starOutline`
- `starSolid`
- `stopOutline`
- `stopSolid`
- `storeOutline`
- `storeSolid`
- `stroopwafelOutline`
- `stroopwafelSolid`
- `subscriptOutline`
- `sunOutline`
- `sunSolid`
- `superscriptOutline`
- `swatchbookOutline`
- `swatchbookSolid`
- `tShirtOutline`
- `tShirtSolid`
- `tableColumnOutline`
- `tableColumnSolid`
- `tableRowOutline`
- `tableRowSolid`
- `tabletOutline`
- `tabletSolid`
- `tagOutline`
- `tagSolid`
- `tailwindSolid`
- `teddyBearOutline`
- `teddyBearSolid`
- `terminalOutline`
- `terminalSolid`
- `textSizeOutline`
- `textSizeSolid`
- `textSlashOutline`
- `textSlashSolid`
- `textUnderlineOutline`
- `theatreOutline`
- `theatreSolid`
- `thumbsDownOutline`
- `thumbsDownSolid`
- `thumbsUpOutline`
- `thumbsUpSolid`
- `thumbtackOutline`
- `thumbtackSolid`
- `ticketOutline`
- `ticketSolid`
- `toggleHeaderCellOutline`
- `toggleHeaderColumnOutline`
- `toggleHeaderRowOutline`
- `toolsOutline`
- `trackingOutline`
- `trackingSolid`
- `trashBinOutline`
- `trashBinSolid`
- `truckClockOutline`
- `truckClockSolid`
- `truckOutline`
- `truckSolid`
- `twitterSolid`
- `undoOutline`
- `undoSolid`
- `uploadOutline`
- `uploadSolid`
- `userAddOutline`
- `userAddSolid`
- `userCircleOutline`
- `userCircleSolid`
- `userEditOutline`
- `userEditSolid`
- `userGraduateOutline`
- `userGraduateSolid`
- `userHeadsetOutline`
- `userHeadsetSolid`
- `userOutline`
- `userRemoveOutline`
- `userRemoveSolid`
- `userSettingsOutline`
- `userSettingsSolid`
- `userSolid`
- `usersGroupOutline`
- `usersGroupSolid`
- `usersOutline`
- `usersSolid`
- `videoCameraOutline`
- `videoCameraSolid`
- `visaSolid`
- `volumeDownOutline`
- `volumeDownSolid`
- `volumeMuteOutline`
- `volumeMuteSolid`
- `volumeUpOutline`
- `volumeUpSolid`
- `vueSolid`
- `walletOutline`
- `walletSolid`
- `wandMagicSparklesOutline`
- `wandMagicSparklesSolid`
- `waterBottleOutline`
- `waterBottleSolid`
- `whatsappSolid`
- `wheatExclamationOutline`
- `wheatOutline`
- `whiskeyGlassOutline`
- `whiskeyGlassSolid`
- `windowOutline`
- `windowRestoreSolid`
- `windowSolid`
- `windowsSolid`
- `wineBottleOutline`
- `wineBottleSolid`
- `wineGlassEmptyOutline`
- `wineGlassEmptySolid`
- `wineGlassOutline`
- `wineGlassSolid`
- `xCircleSolid`
- `xCompanySolid`
- `xSolid`
- `youtubeSolid`
- `zoomInOutline`
- `zoomInSolid`
- `zoomOutOutline`
- `zoomOutSolid`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddColumnAfterOutlineIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddColumnBeforeOutlineIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddressBookOutlineIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddressBookSolidIcon size="20" class="nav-icon" /> Settings</a>
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
<AddColumnAfterOutlineIcon
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
    <AddColumnAfterOutlineIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddColumnBeforeOutlineIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddressBookOutlineIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddColumnAfterOutlineIcon size="24" />
   <AddColumnBeforeOutlineIcon size="24" color="#4a90e2" />
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
   <AddColumnAfterOutlineIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddColumnAfterOutlineIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddColumnAfterOutlineIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addColumnAfterOutline } from '@stacksjs/iconify-flowbite'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addColumnAfterOutline, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addColumnAfterOutline } from '@stacksjs/iconify-flowbite'

// Icons are typed as IconData
const myIcon: IconData = addColumnAfterOutline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/themesberg/flowbite-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Themesberg ([Website](https://github.com/themesberg/flowbite-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flowbite/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flowbite/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
