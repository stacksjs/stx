# Stash Icons

> Stash Icons icons for stx from Iconify

## Overview

This package provides access to 982 icons from the Stash Icons collection through the stx iconify integration.

**Collection ID:** `stash`
**Total Icons:** 982
**Author:** Pingback LLC ([Website](https://github.com/stash-ui/icons))
**License:** MIT ([Details](https://github.com/stash-ui/icons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-stash
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AirplaneIcon height="1em" />
<AirplaneIcon width="1em" height="1em" />
<AirplaneIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AirplaneIcon size="24" />
<AirplaneIcon size="1em" />

<!-- Using width and height -->
<AirplaneIcon width="24" height="32" />

<!-- With color -->
<AirplaneIcon size="24" color="red" />
<AirplaneIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AirplaneIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AirplaneIcon
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
    <AirplaneIcon size="24" />
    <AirplaneDuotoneIcon size="24" color="#4a90e2" />
    <AirplaneLightIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { airplane, airplaneDuotone, airplaneLight } from '@stacksjs/iconify-stash'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(airplane, { size: 24 })
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
<AirplaneIcon size="24" color="red" />
<AirplaneIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AirplaneIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AirplaneIcon size="24" class="text-primary" />
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
<AirplaneIcon height="1em" />
<AirplaneIcon width="1em" height="1em" />
<AirplaneIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AirplaneIcon size="24" />
<AirplaneIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.stash-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AirplaneIcon class="stash-icon" />
```

## Available Icons

This package contains **982** icons:

- `airplane`
- `airplaneDuotone`
- `airplaneLight`
- `airplaneSolid`
- `angleDown`
- `angleDownDuotone`
- `angleDownLight`
- `angleLeft`
- `angleLeftDuotone`
- `angleLeftLight`
- `angleRight`
- `angleRightDuotone`
- `angleRightLight`
- `angleUp`
- `angleUpDuotone`
- `angleUpLight`
- `arrowDown`
- `arrowDownDuotone`
- `arrowDownLarge`
- `arrowDownLargeDuotone`
- `arrowDownLargeLight`
- `arrowDownLight`
- `arrowDownSolid`
- `arrowLeft`
- `arrowLeftDuotone`
- `arrowLeftLarge`
- `arrowLeftLargeDuotone`
- `arrowLeftLargeLight`
- `arrowLeftLight`
- `arrowLeftSolid`
- `arrowReply`
- `arrowReplyDuotone`
- `arrowReplyLight`
- `arrowReplySolid`
- `arrowRetry`
- `arrowRetryDuotone`
- `arrowRetryLight`
- `arrowRight`
- `arrowRightDuotone`
- `arrowRightLarge`
- `arrowRightLargeDuotone`
- `arrowRightLargeLight`
- `arrowRightLight`
- `arrowRightSolid`
- `arrowUp`
- `arrowUpDuotone`
- `arrowUpLarge`
- `arrowUpLargeDuotone`
- `arrowUpLargeLight`
- `arrowUpLight`
- `arrowUpSolid`
- `arrowsSwitch`
- `arrowsSwitchDuotone`
- `arrowsSwitchLight`
- `arrowsSwitchSolid`
- `article`
- `articleAlt`
- `articleAltDuotone`
- `articleAltLight`
- `articleAltSolid`
- `articleDuotone`
- `articleLight`
- `articlePlus`
- `articlePlusDuotone`
- `articlePlusLight`
- `articlePlusSolid`
- `articleShare`
- `articleShareDuotone`
- `articleShareLight`
- `articleShareSolid`
- `articleSolid`
- `asterisk`
- `asteriskDuotone`
- `asteriskLight`
- `asteriskSolid`
- `atSymbol`
- `atSymbolDuotone`
- `atSymbolLight`
- `atSymbolSolid`
- `badgeDollar`
- `badgeDollarDuotone`
- `badgeDollarLight`
- `badgeDollarSolid`
- `badgeVerified`
- `badgeVerifiedDuotone`
- `badgeVerifiedLight`
- `badgeVerifiedSolid`
- `balance`
- `balanceDuotone`
- `balanceLight`
- `balanceSolid`
- `bell`
- `bellDuotone`
- `bellLight`
- `billingInfo`
- `billingInfoDuotone`
- `billingInfoLight`
- `billingInfoSolid`
- `browser`
- `browserDuotone`
- `browserLight`
- `browserSolid`
- `bug`
- `bugDuotone`
- `bugLight`
- `bugSolid`
- `burger`
- `burgerArrowLeft`
- `burgerArrowLeftDuotone`
- `burgerArrowLeftLight`
- `burgerArrowRight`
- `burgerArrowRightDuotone`
- `burgerArrowRightLight`
- `burgerClassic`
- `burgerClassicDuotone`
- `burgerClassicLight`
- `burgerDuotone`
- `burgerLight`
- `burgerSolid`
- `calendar`
- `calendarDuotone`
- `calendarEnd`
- `calendarEndDuotone`
- `calendarEndLight`
- `calendarEndSolid`
- `calendarLight`
- `calendarNine`
- `calendarNineDuotone`
- `calendarNineLight`
- `calendarNineSolid`
- `calendarSolid`
- `calendarStar`
- `calendarStarDuotone`
- `calendarStarLight`
- `calendarStarSolid`
- `camVideo`
- `camVideoDuotone`
- `camVideoLight`
- `camVideoSolid`
- `camWeb`
- `camWebDuotone`
- `camWebLight`
- `camWebSolid`
- `caretDown`
- `caretDownDuotone`
- `caretDownLight`
- `caretLeft`
- `caretLeftDuotone`
- `caretLeftLight`
- `caretRight`
- `caretRightDuotone`
- `caretRightLight`
- `caretUp`
- `caretUpDuotone`
- `caretUpLight`
- `chartPie`
- `chartPieDuotone`
- `chartPieLight`
- `chartTrendDown`
- `chartTrendDownDuotone`
- `chartTrendDownLight`
- `chartTrendDownSolid`
- `chartTrendUp`
- `chartTrendUpDuotone`
- `chartTrendUpLight`
- `chartTrendUpSolid`
- `check`
- `checkCircle`
- `checkCircleDuotone`
- `checkCircleLight`
- `checkCircleSolid`
- `checkDuotone`
- `checkLight`
- `checkSolid`
- `chevronDoubleDown`
- `chevronDoubleDownDuotone`
- `chevronDoubleDownLight`
- `chevronDoubleDownSolid`
- `chevronDoubleLeft`
- `chevronDoubleLeftDuotone`
- `chevronDoubleLeftLight`
- `chevronDoubleLeftSolid`
- `chevronDoubleRight`
- `chevronDoubleRightDuotone`
- `chevronDoubleRightLight`
- `chevronDoubleRightSolid`
- `chevronDoubleUp`
- `chevronDoubleUpDuotone`
- `chevronDoubleUpLight`
- `chevronDoubleUpSolid`
- `chevronDown`
- `chevronDownDuotone`
- `chevronDownLight`
- `chevronDownSolid`
- `chevronLeft`
- `chevronLeftDuotone`
- `chevronLeftLight`
- `chevronLeftSolid`
- `chevronRight`
- `chevronRightDuotone`
- `chevronRightLight`
- `chevronRightSolid`
- `chevronUp`
- `chevronUpDuotone`
- `chevronUpLight`
- `chevronUpSolid`
- `circle`
- `circleDot`
- `circleDotDuotone`
- `circleDotLight`
- `circleDotSolid`
- `circleDuotone`
- `circleLight`
- `circleSolid`
- `clock`
- `clockDuotone`
- `clockLight`
- `clockSolid`
- `cloud`
- `cloudArrowDown`
- `cloudArrowDownDuotone`
- `cloudArrowDownLight`
- `cloudArrowUp`
- `cloudArrowUpDuotone`
- `cloudArrowUpLight`
- `cloudCheck`
- `cloudCheckDuotone`
- `cloudCheckLight`
- `cloudCheckSolid`
- `cloudDuotone`
- `cloudLight`
- `cloudMinus`
- `cloudMinusDuotone`
- `cloudMinusLight`
- `cloudPlus`
- `cloudPlusDuotone`
- `cloudPlusLight`
- `cloudSolid`
- `cog`
- `cogDuotone`
- `cogLight`
- `comments`
- `commentsDuotone`
- `commentsLight`
- `commentsSolid`
- `compass`
- `compassDuotone`
- `compassLight`
- `contentShare`
- `contentShareDuotone`
- `contentShareLight`
- `contentShareSolid`
- `copy`
- `copyDuotone`
- `copyLight`
- `cornerDownLeft`
- `cornerDownLeftDuotone`
- `cornerDownLeftLight`
- `cornerDownLeftSolid`
- `cornerDownRight`
- `cornerDownRightDuotone`
- `cornerDownRightLight`
- `cornerDownRightSolid`
- `cornerUpLeft`
- `cornerUpLeftDuotone`
- `cornerUpLeftLight`
- `cornerUpLeftSolid`
- `cornerUpRight`
- `cornerUpRightDuotone`
- `cornerUpRightLight`
- `cornerUpRightSolid`
- `creatorsClub`
- `creatorsClubDuotone`
- `creatorsClubLight`
- `creditCard`
- `creditCardDuotone`
- `creditCardLight`
- `creditCardSolid`
- `crown`
- `crownDuotone`
- `crownLight`
- `crownSolid`
- `cursorArrow`
- `cursorArrowDuotone`
- `cursorArrowLight`
- `cursorArrowSolid`
- `dashboard`
- `dashboardDuotone`
- `dashboardLight`
- `dataBoolean`
- `dataBooleanDuotone`
- `dataBooleanLight`
- `dataBooleanSolid`
- `dataDate`
- `dataDateDuotone`
- `dataDateLight`
- `dataDateSolid`
- `dataNumbers`
- `dataNumbersDuotone`
- `dataNumbersLight`
- `dataNumbersSolid`
- `dataText`
- `dataTextDuotone`
- `dataTextLight`
- `dataTextSolid`
- `desktop`
- `desktopCheck`
- `desktopCheckDuotone`
- `desktopCheckLight`
- `desktopCheckSolid`
- `desktopDuotone`
- `desktopLight`
- `desktopSolid`
- `divide`
- `divideDuotone`
- `divideLight`
- `divideSolid`
- `dollarSign`
- `dollarSignDuotone`
- `dollarSignLight`
- `dollarSignSolid`
- `domain`
- `domainDuotone`
- `domainLight`
- `dragSquaresHorizontal`
- `dragSquaresHorizontalDuotone`
- `dragSquaresHorizontalLight`
- `dragSquaresHorizontalSolid`
- `dragSquaresVertical`
- `dragSquaresVerticalDuotone`
- `dragSquaresVerticalLight`
- `dragSquaresVerticalSolid`
- `ellipsisH`
- `ellipsisHDuotone`
- `ellipsisHLight`
- `ellipsisHSolid`
- `ellipsisV`
- `ellipsisVDuotone`
- `ellipsisVLight`
- `ellipsisVSolid`
- `emojiJoy`
- `emojiJoyDuotone`
- `emojiJoyLight`
- `emojiJoySolid`
- `emojiLaugh`
- `emojiLaughDuotone`
- `emojiLaughLight`
- `emojiLaughSolid`
- `emojiWink`
- `emojiWinkDuotone`
- `emojiWinkLight`
- `emojiWinkPlus`
- `emojiWinkPlusDuotone`
- `emojiWinkPlusLight`
- `emojiWinkPlusSolid`
- `emojiWinkSolid`
- `engagement`
- `engagementDuotone`
- `engagementLight`
- `envelope`
- `envelopeAt`
- `envelopeAtDuotone`
- `envelopeAtLight`
- `envelopeDuotone`
- `envelopeFlying`
- `envelopeFlyingDuotone`
- `envelopeFlyingLight`
- `envelopeLight`
- `equal`
- `equalDuotone`
- `equalLight`
- `equalSolid`
- `espiralBook`
- `espiralBookDuotone`
- `espiralBookLight`
- `espiralBookSolid`
- `exclamationAlert`
- `exclamationAlertDuotone`
- `exclamationAlertLight`
- `exclamationAlertSolid`
- `exclamationCircle`
- `exclamationCircleDuotone`
- `exclamationCircleLight`
- `exclamationCircleSolid`
- `exclamationTriangle`
- `exclamationTriangleDuotone`
- `exclamationTriangleLight`
- `exclamationTriangleSolid`
- `expandDiagonal`
- `expandDiagonalDuotone`
- `expandDiagonalLight`
- `expandDiagonalSolid`
- `expandVertical`
- `expandVerticalDuotone`
- `expandVerticalLight`
- `expandVerticalSolid`
- `explicitContent`
- `explicitContentDuotone`
- `explicitContentLight`
- `explicitContentSolid`
- `eyeClosed`
- `eyeClosedDuotone`
- `eyeClosedLight`
- `eyeClosedSolid`
- `eyeOpened`
- `eyeOpenedDuotone`
- `eyeOpenedLight`
- `eyeOpenedSolid`
- `feed`
- `feedDuotone`
- `feedLight`
- `fileExport`
- `fileExportDuotone`
- `fileExportLight`
- `fileExportSolid`
- `fileImport`
- `fileImportDuotone`
- `fileImportLight`
- `fileImportSolid`
- `filter`
- `filterDuotone`
- `filterLight`
- `filterSolid`
- `flag`
- `flagDuotone`
- `flagLight`
- `flagSolid`
- `folder`
- `folderAlt`
- `folderAltDuotone`
- `folderAltLight`
- `folderAltSolid`
- `folderArrowDown`
- `folderArrowDownDuotone`
- `folderArrowDownLight`
- `folderArrowDownSolid`
- `folderArrowLeft`
- `folderArrowLeftDuotone`
- `folderArrowLeftLight`
- `folderArrowLeftSolid`
- `folderArrowRight`
- `folderArrowRightDuotone`
- `folderArrowRightLight`
- `folderArrowRightSolid`
- `folderArrowUp`
- `folderArrowUpDuotone`
- `folderArrowUpLight`
- `folderArrowUpSolid`
- `folderDuotone`
- `folderLight`
- `folderLock`
- `folderLockDuotone`
- `folderLockLight`
- `folderLockSolid`
- `folderMultiple`
- `folderMultipleDuotone`
- `folderMultipleLight`
- `folderMultipleSolid`
- `folderPlus`
- `folderPlusDuotone`
- `folderPlusLight`
- `folderPlusSolid`
- `folderRefresh`
- `folderRefreshDuotone`
- `folderRefreshLight`
- `folderRefreshSolid`
- `folderSearch`
- `folderSearchDuotone`
- `folderSearchLight`
- `folderSearchSolid`
- `folderSolid`
- `football`
- `footballDuotone`
- `footballLight`
- `footballSolid`
- `gif`
- `gifDuotone`
- `gifLight`
- `gifSolid`
- `globe`
- `globeDuotone`
- `globeLight`
- `globeSolid`
- `globeTimezone`
- `globeTimezoneDuotone`
- `globeTimezoneLight`
- `globeTimezoneSolid`
- `googleDrive`
- `googleDriveDuotone`
- `googleDriveLight`
- `googleDriveSolid`
- `graduationCap`
- `graduationCapDuotone`
- `graduationCapLight`
- `graduationCapSolid`
- `handHoldingDollar`
- `handHoldingDollarDuotone`
- `handHoldingDollarLight`
- `handHoldingDollarSolid`
- `hash`
- `hashDuotone`
- `hashLight`
- `hashSolid`
- `headphones`
- `headphonesDuotone`
- `headphonesLight`
- `headphonesSolid`
- `headset`
- `headsetDuotone`
- `headsetLight`
- `headsetSolid`
- `heart`
- `heartDuotone`
- `heartLight`
- `heartSolid`
- `home`
- `homeDuotone`
- `homeLight`
- `image`
- `imageArrowDown`
- `imageArrowDownDuotone`
- `imageArrowDownLight`
- `imageArrowUp`
- `imageArrowUpDuotone`
- `imageArrowUpLight`
- `imageBan`
- `imageBanDuotone`
- `imageBanLight`
- `imageDuotone`
- `imageExclamation`
- `imageExclamationDuotone`
- `imageExclamationLight`
- `imageLight`
- `imageMinus`
- `imageMinusDuotone`
- `imageMinusLight`
- `imageMoveDuotone`
- `imageMoveLight`
- `imageMoveSolid`
- `imageOpen`
- `imageOpenDuotone`
- `imageOpenLight`
- `imagePlus`
- `imagePlusDuotone`
- `imagePlusLight`
- `imageSearch`
- `imageSearchDuotone`
- `imageSearchLight`
- `imageSwitch`
- `imageSwitchDuotone`
- `imageSwitchLight`
- `imageTimes`
- `imageTimesDuotone`
- `imageTimesLight`
- `imageTrash`
- `imageTrashDuotone`
- `imageTrashLight`
- `inbox`
- `inboxDuotone`
- `inboxLight`
- `infinity`
- `infinityDuotone`
- `infinityLight`
- `infinitySolid`
- `infoCircle`
- `infoCircleDuotone`
- `infoCircleLight`
- `infoCircleSolid`
- `integrations`
- `integrationsDuotone`
- `integrationsLight`
- `invoice`
- `invoiceDuotone`
- `invoiceLight`
- `lastUpdates`
- `lastUpdatesDuotone`
- `lastUpdatesLight`
- `lastUpdatesSolid`
- `leaf`
- `leafDuotone`
- `leafLight`
- `leafSolid`
- `lifeRing`
- `lifeRingDuotone`
- `lifeRingLight`
- `lightBulb`
- `lightBulbDuotone`
- `lightBulbExclamation`
- `lightBulbExclamationDuotone`
- `lightBulbExclamationLight`
- `lightBulbLight`
- `link`
- `linkDuotone`
- `linkLight`
- `linkSolid`
- `listAdd`
- `listAddDuotone`
- `listAddLight`
- `listUl`
- `listUlDuotone`
- `listUlLight`
- `location`
- `locationDuotone`
- `locationLight`
- `lockClosed`
- `lockClosedDuotone`
- `lockClosedLight`
- `lockOpened`
- `lockOpenedDuotone`
- `lockOpenedLight`
- `mailboxEmpty`
- `mailboxEmptyDuotone`
- `mailboxEmptyLight`
- `mailboxFull`
- `mailboxFullDuotone`
- `mailboxFullLight`
- `marker`
- `markerDuotone`
- `markerLight`
- `markerSolid`
- `megaphone`
- `megaphoneDuotone`
- `megaphoneLight`
- `megaphoneSolid`
- `mic`
- `micDuotone`
- `micLight`
- `micSolid`
- `minus`
- `minusDuotone`
- `minusLight`
- `minusSolid`
- `monetize`
- `monetizeDuotone`
- `monetizeLight`
- `moon`
- `moonDuotone`
- `moonLight`
- `moonSolid`
- `newWindowPage`
- `newWindowPageDuotone`
- `newWindowPageLight`
- `notebook`
- `notebookDuotone`
- `notebookLight`
- `notebookSolid`
- `outbox`
- `outboxDuotone`
- `outboxLight`
- `pack`
- `packDuotone`
- `packLight`
- `packSolid`
- `paginationAlt`
- `paginationAltDuotone`
- `paginationAltLight`
- `paginationAltSolid`
- `paginationDuotone`
- `paginationLight`
- `paginationSolid`
- `paperClock`
- `paperClockDuotone`
- `paperClockLight`
- `paperClockSolid`
- `paperplane`
- `paperplaneDuotone`
- `paperplaneLight`
- `paperplaneSolid`
- `pause`
- `pauseDuotone`
- `pauseLight`
- `pauseSolid`
- `paymentLink`
- `paymentLinkDuotone`
- `paymentLinkLight`
- `paymentLinkSolid`
- `peaceSymbol`
- `peaceSymbolDuotone`
- `peaceSymbolLight`
- `peaceSymbolSolid`
- `pencilSingle`
- `pencilSingleDuotone`
- `pencilSingleLight`
- `pencilSingleSolid`
- `pencilWriting`
- `pencilWritingDuotone`
- `pencilWritingLight`
- `peopleGroup`
- `peopleGroupDuotone`
- `peopleGroupLight`
- `percent`
- `percentDuotone`
- `percentLight`
- `percentSolid`
- `person`
- `personDuotone`
- `personLight`
- `pinLocation`
- `pinLocationDuotone`
- `pinLocationLight`
- `pinPlace`
- `pinPlaceDuotone`
- `pinPlaceLight`
- `pinThumbtack`
- `pinThumbtackDuotone`
- `pinThumbtackLight`
- `pinThumbtackSolid`
- `pix`
- `pixDuotone`
- `pixLight`
- `pixSolid`
- `plan`
- `planDuotone`
- `planLight`
- `play`
- `playBtn`
- `playBtnDuotone`
- `playBtnLight`
- `playBtnSolid`
- `playDuotone`
- `playLight`
- `playSolid`
- `plus`
- `plusDuotone`
- `plusLight`
- `plusSolid`
- `podcast`
- `podcastDuotone`
- `podcastLight`
- `podcastSolid`
- `privateContent`
- `privateContentDuotone`
- `privateContentLight`
- `privateContentSolid`
- `qrCode`
- `qrCodeDuotone`
- `qrCodeLight`
- `qrCodeSolid`
- `question`
- `questionDuotone`
- `questionLight`
- `questionSolid`
- `racket`
- `racketBall`
- `racketBallDuotone`
- `racketBallLight`
- `racketBallSolid`
- `racketDuotone`
- `racketLight`
- `racketSolid`
- `radar`
- `radarDuotone`
- `radarLight`
- `readingTime`
- `readingTimeDuotone`
- `readingTimeLight`
- `readingTimeSolid`
- `saveRibbon`
- `saveRibbonDuotone`
- `saveRibbonLight`
- `saveRibbonSolid`
- `screwNut`
- `screwNutDuotone`
- `screwNutLight`
- `search`
- `searchBox`
- `searchBoxDuotone`
- `searchBoxLight`
- `searchBoxSolid`
- `searchDuotone`
- `searchLight`
- `searchResults`
- `searchResultsDuotone`
- `searchResultsLight`
- `searchResultsSolid`
- `searchSolid`
- `searchSplit`
- `searchSplitDuotone`
- `searchSplitLight`
- `searchSplitSolid`
- `sectionDivider`
- `sectionDividerDuotone`
- `sectionDividerLight`
- `sectionDividerSolid`
- `sensitive`
- `sensitiveDuotone`
- `sensitiveLight`
- `sensitiveSolid`
- `share`
- `shareDuotone`
- `shareLight`
- `shareSolid`
- `shield`
- `shieldCheck`
- `shieldCheckDuotone`
- `shieldCheckLight`
- `shieldDuotone`
- `shieldLight`
- `shieldUser`
- `shieldUserDuotone`
- `shieldUserLight`
- `shop`
- `shopDuotone`
- `shopLight`
- `shopSolid`
- `shrinkDiagonal`
- `shrinkDiagonalDuotone`
- `shrinkDiagonalLight`
- `shrinkDiagonalSolid`
- `shrinkVertical`
- `shrinkVerticalDuotone`
- `shrinkVerticalLight`
- `shrinkVerticalSolid`
- `sidePeek`
- `sidePeekDuotone`
- `sidePeekLight`
- `sidePeekSolid`
- `signin`
- `signinAlt`
- `signinAltDuotone`
- `signinAltLight`
- `signinDuotone`
- `signinLight`
- `signout`
- `signoutAlt`
- `signoutAltDuotone`
- `signoutAltLight`
- `signoutDuotone`
- `signoutLight`
- `slidersH`
- `slidersHDuotone`
- `slidersHLight`
- `slidersV`
- `slidersVDuotone`
- `slidersVLight`
- `smartphone`
- `smartphoneDuotone`
- `smartphoneLight`
- `smartphoneSolid`
- `socialFacebook`
- `socialFacebookDuotone`
- `socialFacebookLight`
- `socialFacebookSolid`
- `socialTwitter`
- `socialTwitterDuotone`
- `socialTwitterLight`
- `socialTwitterSolid`
- `socialUnsplash`
- `socialUnsplashDuotone`
- `socialUnsplashLight`
- `socialUnsplashSolid`
- `socialWhatsapp`
- `socialWhatsappDuotone`
- `socialWhatsappLight`
- `socialWhatsappSolid`
- `square`
- `squareCheck`
- `squareCheckDuotone`
- `squareCheckLight`
- `squareCheckSolid`
- `squareDuotone`
- `squareLight`
- `squareMinus`
- `squareMinusDuotone`
- `squareMinusLight`
- `squareMinusSolid`
- `squareSolid`
- `star`
- `starDuotone`
- `starLight`
- `starSolid`
- `stars`
- `starsDuotone`
- `starsLight`
- `stopwatch`
- `stopwatchDuotone`
- `stopwatchLight`
- `stopwatchSolid`
- `subscriptionList`
- `subscriptionListDuotone`
- `subscriptionListLight`
- `subscriptionListSolid`
- `sun`
- `sunDuotone`
- `sunLight`
- `sunSolid`
- `tablet`
- `tabletDuotone`
- `tabletLight`
- `tabletSolid`
- `target`
- `targetDuotone`
- `targetLight`
- `telegram`
- `telegramDuotone`
- `telegramLight`
- `telegramSolid`
- `thumbDown`
- `thumbDownDuotone`
- `thumbDownLight`
- `thumbUp`
- `thumbUpDuotone`
- `thumbUpLight`
- `times`
- `timesCircle`
- `timesCircleDuotone`
- `timesCircleLight`
- `timesCircleSolid`
- `timesDuotone`
- `timesLight`
- `timesSolid`
- `trashCan`
- `trashCanDuotone`
- `trashCanLight`
- `trendArrowDown`
- `trendArrowDownDuotone`
- `trendArrowDownLight`
- `trendArrowUp`
- `trendArrowUpDuotone`
- `trendArrowUpLight`
- `trophy`
- `trophyDuotone`
- `trophyLight`
- `trophySolid`
- `userArrowDown`
- `userArrowDownDuotone`
- `userArrowDownLight`
- `userAt`
- `userAtDuotone`
- `userAtLight`
- `userAvatar`
- `userAvatarDuotone`
- `userAvatarLight`
- `userCheck`
- `userCheckDuotone`
- `userCheckLight`
- `userClock`
- `userClockDuotone`
- `userClockLight`
- `userCog`
- `userCogDuotone`
- `userCogLight`
- `userDollar`
- `userDollarDuotone`
- `userDollarLight`
- `userEnvelope`
- `userEnvelopeDuotone`
- `userEnvelopeLight`
- `userGroup`
- `userGroupDuotone`
- `userGroupLight`
- `userHeart`
- `userHeartDuotone`
- `userHeartLight`
- `userId`
- `userIdDuotone`
- `userIdLight`
- `userMinus`
- `userMinusDuotone`
- `userMinusLight`
- `userPlus`
- `userPlusDuotone`
- `userPlusLight`
- `userShield`
- `userShieldDuotone`
- `userShieldLight`
- `usersCrown`
- `usersCrownDuotone`
- `usersCrownLight`
- `vault`
- `vaultDuotone`
- `vaultLight`
- `version`
- `versionDuotone`
- `versionLight`
- `versionSolid`
- `wallet`
- `walletDuotone`
- `walletLight`
- `wand`
- `wandDuotone`
- `wandLight`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AirplaneIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AirplaneDuotoneIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AirplaneLightIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AirplaneSolidIcon size="20" class="nav-icon" /> Settings</a>
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
<AirplaneIcon
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
    <AirplaneIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AirplaneDuotoneIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AirplaneLightIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AirplaneIcon size="24" />
   <AirplaneDuotoneIcon size="24" color="#4a90e2" />
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
   <AirplaneIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AirplaneIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AirplaneIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { airplane } from '@stacksjs/iconify-stash'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(airplane, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { airplane } from '@stacksjs/iconify-stash'

// Icons are typed as IconData
const myIcon: IconData = airplane
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/stash-ui/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Pingback LLC ([Website](https://github.com/stash-ui/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/stash/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/stash/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
