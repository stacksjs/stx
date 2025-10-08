# Streamline color

> Streamline color icons for stx from Iconify

## Overview

This package provides access to 2000 icons from the Streamline color collection through the stx iconify integration.

**Collection ID:** `streamline-color`
**Total Icons:** 2000
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-color
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { Add1Icon, Add1FlatIcon, AddBellNotificationIcon } from '@stacksjs/iconify-streamline-color'

// Basic usage
const icon = Add1Icon()

// With size
const sizedIcon = Add1Icon({ size: 24 })

// With color
const coloredIcon = Add1FlatIcon({ color: 'red' })

// With multiple props
const customIcon = AddBellNotificationIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { Add1Icon, Add1FlatIcon, AddBellNotificationIcon } from '@stacksjs/iconify-streamline-color'

  global.icons = {
    home: Add1Icon({ size: 24 }),
    user: Add1FlatIcon({ size: 24, color: '#4a90e2' }),
    settings: AddBellNotificationIcon({ size: 32 })
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
import { add1, add1Flat, addBellNotification } from '@stacksjs/iconify-streamline-color'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(add1, { size: 24 })
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

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```typescript
// Via color property
const redIcon = Add1Icon({ color: 'red' })
const blueIcon = Add1Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = Add1Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = Add1Icon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = Add1Icon({ size: 24 })
const icon1em = Add1Icon({ size: '1em' })

// Set individual dimensions
const customIcon = Add1Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = Add1Icon({ height: '1em' })
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
const smallIcon = Add1Icon({ class: 'icon-small' })
const largeIcon = Add1Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **2000** icons:

- `add1`
- `add1Flat`
- `addBellNotification`
- `addBellNotificationFlat`
- `addCircle`
- `addCircleFlat`
- `addLayer2`
- `addLayer2Flat`
- `addSquare`
- `addSquareFlat`
- `adobe`
- `adobeFlat`
- `affordableAndCleanEnergy`
- `affordableAndCleanEnergyFlat`
- `aiChipSpark`
- `aiChipSparkFlat`
- `aiCloudSpark`
- `aiCloudSparkFlat`
- `aiEditSpark`
- `aiEditSparkFlat`
- `aiEmailGeneratorSpark`
- `aiEmailGeneratorSparkFlat`
- `aiGamingSpark`
- `aiGamingSparkFlat`
- `aiGenerateLandscapeImageSpark`
- `aiGenerateLandscapeImageSparkFlat`
- `aiGenerateMusicSpark`
- `aiGenerateMusicSparkFlat`
- `aiGeneratePortraitImageSpark`
- `aiGeneratePortraitImageSparkFlat`
- `aiGenerateVariationSpark`
- `aiGenerateVariationSparkFlat`
- `aiNavigationSpark`
- `aiNavigationSparkFlat`
- `aiNetworkSpark`
- `aiNetworkSparkFlat`
- `aiPromptSpark`
- `aiPromptSparkFlat`
- `aiRedoSpark`
- `aiRedoSparkFlat`
- `aiScienceSpark`
- `aiScienceSparkFlat`
- `aiSettingsSpark`
- `aiSettingsSparkFlat`
- `aiTechnologySpark`
- `aiTechnologySparkFlat`
- `aiUpscaleSpark`
- `aiUpscaleSparkFlat`
- `aiVehicleSpark1`
- `aiVehicleSpark1Flat`
- `airplane`
- `airplaneDisabled`
- `airplaneDisabledFlat`
- `airplaneEnabled`
- `airplaneEnabledFlat`
- `airplaneFlat`
- `airportPlane`
- `airportPlaneFlat`
- `airportPlaneTransit`
- `airportPlaneTransitFlat`
- `airportSecurity`
- `airportSecurityFlat`
- `alarmClock`
- `alarmClockFlat`
- `alien`
- `alienFlat`
- `alignBack1`
- `alignBack1Flat`
- `alignCenter`
- `alignCenterFlat`
- `alignFront1`
- `alignFront1Flat`
- `alignLeft`
- `alignLeftFlat`
- `alignRight`
- `alignRightFlat`
- `alt`
- `altFlat`
- `amazon`
- `amazonFlat`
- `ambulance`
- `ambulanceFlat`
- `ampersand`
- `ampersandFlat`
- `anchor`
- `anchorFlat`
- `android`
- `androidFlat`
- `announcementMegaphone`
- `announcementMegaphoneFlat`
- `appStore`
- `appStoreFlat`
- `apple`
- `appleFlat`
- `applicationAdd`
- `applicationAddFlat`
- `archiveBox`
- `archiveBoxFlat`
- `arrowBendLeftDown2`
- `arrowBendLeftDown2Flat`
- `arrowBendRightDown2`
- `arrowBendRightDown2Flat`
- `arrowCrossoverDown`
- `arrowCrossoverDownFlat`
- `arrowCrossoverLeft`
- `arrowCrossoverLeftFlat`
- `arrowCrossoverRight`
- `arrowCrossoverRightFlat`
- `arrowCrossoverUp`
- `arrowCrossoverUpFlat`
- `arrowCursor1`
- `arrowCursor1Flat`
- `arrowCursor2`
- `arrowCursor2Flat`
- `arrowCurvyUpDown1`
- `arrowCurvyUpDown1Flat`
- `arrowCurvyUpDown2`
- `arrowCurvyUpDown2Flat`
- `arrowDown2`
- `arrowDown2Flat`
- `arrowDownDashedSquare`
- `arrowDownDashedSquareFlat`
- `arrowExpand`
- `arrowExpandFlat`
- `arrowInfiniteLoop`
- `arrowInfiniteLoopFlat`
- `arrowMove`
- `arrowMoveFlat`
- `arrowReloadHorizontal1`
- `arrowReloadHorizontal1Flat`
- `arrowReloadHorizontal2`
- `arrowReloadHorizontal2Flat`
- `arrowReloadVertical1`
- `arrowReloadVertical1Flat`
- `arrowReloadVertical2`
- `arrowReloadVertical2Flat`
- `arrowRoadmap`
- `arrowRoadmapFlat`
- `arrowRoundLeft`
- `arrowRoundLeftFlat`
- `arrowRoundRight`
- `arrowRoundRightFlat`
- `arrowShrink`
- `arrowShrinkDiagonal1`
- `arrowShrinkDiagonal1Flat`
- `arrowShrinkDiagonal2`
- `arrowShrinkDiagonal2Flat`
- `arrowShrinkFlat`
- `arrowTransferDiagonal1`
- `arrowTransferDiagonal1Flat`
- `arrowTransferDiagonal2`
- `arrowTransferDiagonal2Flat`
- `arrowTransferDiagonal3`
- `arrowTransferDiagonal3Flat`
- `arrowUp1`
- `arrowUp1Flat`
- `arrowUpDashedSquare`
- `arrowUpDashedSquareFlat`
- `artificialIntelligenceSpark`
- `artificialIntelligenceSparkFlat`
- `ascendingNumberOrder`
- `ascendingNumberOrderFlat`
- `asterisk1`
- `asterisk1Flat`
- `attribution`
- `attributionFlat`
- `autoFlash`
- `autoFlashFlat`
- `backCamera1`
- `backCamera1Flat`
- `backpack`
- `backpackFlat`
- `bacteriaVirusCellsBiology`
- `bacteriaVirusCellsBiologyFlat`
- `bag`
- `bagDollar`
- `bagDollarFlat`
- `bagFlat`
- `bagPound`
- `bagPoundFlat`
- `bagRupee`
- `bagRupeeFlat`
- `bagSuitcase1`
- `bagSuitcase1Flat`
- `bagSuitcase2`
- `bagSuitcase2Flat`
- `bagYen`
- `bagYenFlat`
- `baggage`
- `baggageFlat`
- `ball`
- `ballFlat`
- `balloon`
- `balloonFlat`
- `bandage`
- `bandageFlat`
- `bank`
- `bankFlat`
- `batteryAlert1`
- `batteryAlert1Flat`
- `batteryCharging`
- `batteryChargingFlat`
- `batteryEmpty1`
- `batteryEmpty1Flat`
- `batteryEmpty2`
- `batteryEmpty2Flat`
- `batteryFull1`
- `batteryFull1Flat`
- `batteryLow1`
- `batteryLow1Flat`
- `batteryMedium1`
- `batteryMedium1Flat`
- `beach`
- `beachFlat`
- `beanie`
- `beanieFlat`
- `beerMug`
- `beerMugFlat`
- `beerPitch`
- `beerPitchFlat`
- `bicycleBike`
- `bicycleBikeFlat`
- `bill1`
- `bill1Flat`
- `bill2`
- `bill2Flat`
- `bill4`
- `bill4Flat`
- `billCashless`
- `billCashlessFlat`
- `binanceCircle`
- `binanceCircleFlat`
- `bitcoin`
- `bitcoinFlat`
- `blankCalendar`
- `blankCalendarFlat`
- `blankNotepad`
- `blankNotepadFlat`
- `blockBellNotification`
- `blockBellNotificationFlat`
- `bloodBagDonation`
- `bloodBagDonationFlat`
- `bloodDonateDrop`
- `bloodDonateDropFlat`
- `bloodDropDonation`
- `bloodDropDonationFlat`
- `bluetooth`
- `bluetoothDisabled`
- `bluetoothDisabledFlat`
- `bluetoothFlat`
- `bluetoothSearching`
- `bluetoothSearchingFlat`
- `bomb`
- `bombFlat`
- `bone`
- `boneFlat`
- `bookReading`
- `bookReadingFlat`
- `bookmark`
- `bookmarkFlat`
- `bow`
- `bowFlat`
- `bowTie`
- `bowTieFlat`
- `boxSign`
- `boxSignFlat`
- `bracesCircle`
- `bracesCircleFlat`
- `bracket`
- `bracketFlat`
- `brailleBlind`
- `brailleBlindFlat`
- `brain`
- `brainCognitive`
- `brainCognitiveFlat`
- `brainFlat`
- `briefcaseDollar`
- `briefcaseDollarFlat`
- `brightness1`
- `brightness1Flat`
- `brightness2`
- `brightness2Flat`
- `brightness3`
- `brightness3Flat`
- `brokenLink2`
- `brokenLink2Flat`
- `browserAdd`
- `browserAddFlat`
- `browserBlock`
- `browserBlockFlat`
- `browserBuild`
- `browserBuildFlat`
- `browserCheck`
- `browserCheckFlat`
- `browserDelete`
- `browserDeleteFlat`
- `browserHash`
- `browserHashFlat`
- `browserLock`
- `browserLockFlat`
- `browserMultipleWindow`
- `browserMultipleWindowFlat`
- `browserRemove`
- `browserRemoveFlat`
- `browserWebsite1`
- `browserWebsite1Flat`
- `browserWifi`
- `browserWifiFlat`
- `bug`
- `bugAntivirusDebugging`
- `bugAntivirusDebuggingFlat`
- `bugAntivirusShield`
- `bugAntivirusShieldFlat`
- `bugFlat`
- `bugVirusBrowser`
- `bugVirusBrowserFlat`
- `bugVirusDocument`
- `bugVirusDocumentFlat`
- `bugVirusFolder`
- `bugVirusFolderFlat`
- `building2`
- `building2Flat`
- `bulletList`
- `bulletListFlat`
- `burger`
- `burgerFlat`
- `burritoFastfood`
- `burritoFastfoodFlat`
- `bus`
- `busFlat`
- `businessCard`
- `businessCardFlat`
- `businessHandshake`
- `businessHandshakeFlat`
- `businessIdeaMoney`
- `businessIdeaMoneyFlat`
- `businessProfessionHomeOffice`
- `businessProfessionHomeOfficeFlat`
- `businessProgressBar2`
- `businessProgressBar2Flat`
- `businessUserCurriculum`
- `businessUserCurriculumFlat`
- `buttonFastForward1`
- `buttonFastForward1Flat`
- `buttonFastForward2`
- `buttonFastForward2Flat`
- `buttonNext`
- `buttonNextFlat`
- `buttonPause2`
- `buttonPause2Flat`
- `buttonPlay`
- `buttonPlayFlat`
- `buttonPower1`
- `buttonPower1Flat`
- `buttonPrevious`
- `buttonPreviousFlat`
- `buttonRecord3`
- `buttonRecord3Flat`
- `buttonRewind1`
- `buttonRewind1Flat`
- `buttonRewind2`
- `buttonRewind2Flat`
- `buttonStop`
- `buttonStopFlat`
- `cakeSlice`
- `cakeSliceFlat`
- `calculator1`
- `calculator1Flat`
- `calculator2`
- `calculator2Flat`
- `calendarAdd`
- `calendarAddFlat`
- `calendarEdit`
- `calendarEditFlat`
- `calendarJumpToDate`
- `calendarJumpToDateFlat`
- `calendarStar`
- `calendarStarFlat`
- `callCenterSupportService`
- `callCenterSupportServiceFlat`
- `callHangUp`
- `callHangUpFlat`
- `camera1`
- `camera1Flat`
- `cameraDisabled`
- `cameraDisabledFlat`
- `cameraLoading`
- `cameraLoadingFlat`
- `cameraSquare`
- `cameraSquareFlat`
- `cameraVideo`
- `cameraVideoFlat`
- `campingTent`
- `campingTentFlat`
- `candyCane`
- `candyCaneFlat`
- `cane`
- `caneAlt`
- `caneAltFlat`
- `caneFlat`
- `capitol`
- `capitolFlat`
- `carBatteryCharging`
- `carBatteryChargingFlat`
- `carTaxi1`
- `carTaxi1Flat`
- `cards`
- `cardsFlat`
- `cat1`
- `cat1Flat`
- `cellularNetwork4g`
- `cellularNetwork4gFlat`
- `cellularNetwork5g`
- `cellularNetwork5gFlat`
- `cellularNetworkLte`
- `cellularNetworkLteFlat`
- `celsius`
- `celsiusFlat`
- `chair`
- `chairFlat`
- `champagnePartyAlcohol`
- `champagnePartyAlcoholFlat`
- `chatBubbleOval`
- `chatBubbleOvalFlat`
- `chatBubbleOvalNotification`
- `chatBubbleOvalNotificationFlat`
- `chatBubbleOvalSmiley1`
- `chatBubbleOvalSmiley1Flat`
- `chatBubbleOvalSmiley2`
- `chatBubbleOvalSmiley2Flat`
- `chatBubbleSquareBlock`
- `chatBubbleSquareBlockFlat`
- `chatBubbleSquareQuestion`
- `chatBubbleSquareQuestionFlat`
- `chatBubbleSquareWarning`
- `chatBubbleSquareWarningFlat`
- `chatBubbleSquareWrite`
- `chatBubbleSquareWriteFlat`
- `chatBubbleTextSquare`
- `chatBubbleTextSquareFlat`
- `chatBubbleTypingOval`
- `chatBubbleTypingOvalFlat`
- `chatTwoBubblesOval`
- `chatTwoBubblesOvalFlat`
- `check`
- `checkFlat`
- `checkSquare`
- `checkSquareFlat`
- `checkupMedicalReportClipboard`
- `checkupMedicalReportClipboardFlat`
- `cheese`
- `cheeseFlat`
- `cherries`
- `cherriesFlat`
- `chessBishop`
- `chessBishopFlat`
- `chessKing`
- `chessKingFlat`
- `chessKnight`
- `chessKnightFlat`
- `chessPawn`
- `chessPawnFlat`
- `chickenGrilledStream`
- `chickenGrilledStreamFlat`
- `christianCross1`
- `christianCross1Flat`
- `christianCross2`
- `christianCross2Flat`
- `christianity`
- `christianityFlat`
- `chrome`
- `chromeFlat`
- `circle`
- `circleClock`
- `circleClockFlat`
- `circleFlask`
- `circleFlaskFlat`
- `circleFlat`
- `cityHall`
- `cityHallFlat`
- `classLesson`
- `classLessonFlat`
- `cleanWaterAndSanitation`
- `cleanWaterAndSanitationFlat`
- `clipboardAdd`
- `clipboardAddFlat`
- `clipboardCheck`
- `clipboardCheckFlat`
- `clipboardRemove`
- `clipboardRemoveFlat`
- `closet`
- `closetFlat`
- `cloud`
- `cloudAdd`
- `cloudAddFlat`
- `cloudBlock`
- `cloudBlockFlat`
- `cloudCheck`
- `cloudCheckFlat`
- `cloudDataTransfer`
- `cloudDataTransferFlat`
- `cloudFlat`
- `cloudGaming1`
- `cloudGaming1Flat`
- `cloudRefresh`
- `cloudRefreshFlat`
- `cloudShare`
- `cloudShareFlat`
- `cloudWarning`
- `cloudWarningFlat`
- `cloudWifi`
- `cloudWifiFlat`
- `clubsSymbol`
- `clubsSymbolFlat`
- `cocktail`
- `cocktailFlat`
- `codeAnalysis`
- `codeAnalysisFlat`
- `codeMonitor1`
- `codeMonitor1Flat`
- `codeMonitor2`
- `codeMonitor2Flat`
- `coffeeBean`
- `coffeeBeanFlat`
- `coffeeMug`
- `coffeeMugFlat`
- `coffeeTakeawayCup`
- `coffeeTakeawayCupFlat`
- `cog`
- `cogFlat`
- `coinShare`
- `coinShareFlat`
- `coinsStack`
- `coinsStackFlat`
- `collaborationsIdea`
- `collaborationsIdeaFlat`
- `colorPalette`
- `colorPaletteFlat`
- `colorPicker`
- `colorPickerFlat`
- `colorSwatches`
- `colorSwatchesFlat`
- `comet`
- `cometFlat`
- `command`
- `commandFlat`
- `compassNavigator`
- `compassNavigatorFlat`
- `compositionOval`
- `compositionOvalFlat`
- `compositionVertical`
- `compositionVerticalFlat`
- `compsitionHorizontal`
- `compsitionHorizontalFlat`
- `computerChip1`
- `computerChip1Flat`
- `computerChip2`
- `computerChip2Flat`
- `computerPcDesktop`
- `computerPcDesktopFlat`
- `coneShape`
- `coneShapeFlat`
- `contactPhonebook2`
- `contactPhonebook2Flat`
- `container`
- `containerFlat`
- `controller`
- `controller1`
- `controller1Flat`
- `controllerFlat`
- `controllerWireless`
- `controllerWirelessFlat`
- `convertPdf2`
- `convertPdf2Flat`
- `copyPaste`
- `copyPasteFlat`
- `creativeCommons`
- `creativeCommonsFlat`
- `creditCard1`
- `creditCard1Flat`
- `creditCard2`
- `creditCard2Flat`
- `cropSelection`
- `cropSelectionFlat`
- `crown`
- `crownFlat`
- `crutch`
- `crutchFlat`
- `cssThree`
- `cssThreeFlat`
- `curlyBrackets`
- `curlyBracketsFlat`
- `cursorClick`
- `cursorClickFlat`
- `customerSupport1`
- `customerSupport1Flat`
- `cut`
- `cutFlat`
- `cyborg`
- `cyborg2`
- `cyborg2Flat`
- `cyborgFlat`
- `dangerousZoneSign`
- `dangerousZoneSignFlat`
- `darkDislayMode`
- `darkDislayModeFlat`
- `dashboard3`
- `dashboard3Flat`
- `dashboardCircle`
- `dashboardCircleFlat`
- `database`
- `databaseCheck`
- `databaseCheckFlat`
- `databaseFlat`
- `databaseLock`
- `databaseLockFlat`
- `databaseRefresh`
- `databaseRefreshFlat`
- `databaseRemove`
- `databaseRemoveFlat`
- `databaseServer1`
- `databaseServer1Flat`
- `databaseServer2`
- `databaseServer2Flat`
- `databaseSetting`
- `databaseSettingFlat`
- `databaseSubtract2RaidStorageCodeDiskProgrammingDatabaseArrayHardDiscMinus`
- `databaseSubtract2RaidStorageCodeDiskProgrammingDatabaseArrayHardDiscMinusFlat`
- `decentWorkAndEconomicGrowth`
- `decentWorkAndEconomicGrowthFlat`
- `definitionSearchBook`
- `definitionSearchBookFlat`
- `delete1`
- `delete1Flat`
- `deleteKeyboard`
- `deleteKeyboardFlat`
- `descendingNumberOrder`
- `descendingNumberOrderFlat`
- `desktopChat`
- `desktopChatFlat`
- `desktopCheck`
- `desktopCheckFlat`
- `desktopCode`
- `desktopCodeFlat`
- `desktopDelete`
- `desktopDeleteFlat`
- `desktopDollar`
- `desktopDollarFlat`
- `desktopEmoji`
- `desktopEmojiFlat`
- `desktopFavoriteStar`
- `desktopFavoriteStarFlat`
- `desktopGame`
- `desktopGameFlat`
- `desktopHelp`
- `desktopHelpFlat`
- `deviceDatabaseEncryption1`
- `deviceDatabaseEncryption1Flat`
- `dhammajak`
- `dhammajakFlat`
- `diamond2`
- `diamond2Flat`
- `diamondsSymbol`
- `diamondsSymbolFlat`
- `dice1`
- `dice1Flat`
- `dice2`
- `dice2Flat`
- `dice3`
- `dice3Flat`
- `dice4`
- `dice4Flat`
- `dice5`
- `dice5Flat`
- `dice6`
- `dice6Flat`
- `dicesEntertainmentGamingDices`
- `dicesEntertainmentGamingDicesFlat`
- `dictionaryLanguageBook`
- `dictionaryLanguageBookFlat`
- `disableBellNotification`
- `disableBellNotificationFlat`
- `disableHeart`
- `disableHeartFlat`
- `discord`
- `discordFlat`
- `discountPercentBadge`
- `discountPercentBadgeFlat`
- `discountPercentCircle`
- `discountPercentCircleFlat`
- `discountPercentCoupon`
- `discountPercentCouponFlat`
- `discountPercentCutout`
- `discountPercentCutoutFlat`
- `discountPercentFire`
- `discountPercentFireFlat`
- `discussionConverstionReply`
- `discussionConverstionReplyFlat`
- `divisionCircle`
- `divisionCircleFlat`
- `dna`
- `dnaFlat`
- `dollarCoin`
- `dollarCoin1`
- `dollarCoin1Flat`
- `dollarCoinFlat`
- `donut`
- `donutFlat`
- `downloadBox1`
- `downloadBox1Flat`
- `downloadCircle`
- `downloadCircleFlat`
- `downloadComputer`
- `downloadComputerFlat`
- `downloadFile`
- `downloadFileFlat`
- `dressingTable`
- `dressingTableFlat`
- `drone`
- `droneFlat`
- `dropbox`
- `dropboxFlat`
- `earHearing`
- `earHearingFlat`
- `earpods`
- `earpodsFlat`
- `earth1`
- `earth1Flat`
- `earthAirplane`
- `earthAirplaneFlat`
- `editImagePhoto`
- `editImagePhotoFlat`
- `eject`
- `ejectFlat`
- `electricCord1`
- `electricCord1Flat`
- `electricCord3`
- `electricCord3Flat`
- `emergencyExit`
- `emergencyExitFlat`
- `emptyClipboard`
- `emptyClipboardFlat`
- `epicGames1`
- `epicGames1Flat`
- `equalSign`
- `equalSignFlat`
- `erlenmeyerFlask`
- `erlenmeyerFlaskFlat`
- `esports`
- `esportsFlat`
- `ethereum`
- `ethereumCircle`
- `ethereumCircleFlat`
- `ethereumFlat`
- `euro`
- `euroFlat`
- `expand`
- `expandFlat`
- `expandHorizontal1`
- `expandHorizontal1Flat`
- `expandWindow2`
- `expandWindow2Flat`
- `eyeOptic`
- `eyeOpticFlat`
- `faceScan1`
- `faceScan1Flat`
- `facebook1`
- `facebook1Flat`
- `factorial`
- `factorialFlat`
- `fahrenheit`
- `fahrenheitFlat`
- `fastforwardClock`
- `fastforwardClockFlat`
- `figma`
- `figmaFlat`
- `fileAddAlternate`
- `fileAddAlternateFlat`
- `fileCode1`
- `fileCode1Flat`
- `fileDeleteAlternate`
- `fileDeleteAlternateFlat`
- `fileRemoveAlternate`
- `fileRemoveAlternateFlat`
- `filmRoll1`
- `filmRoll1Flat`
- `filmSlate`
- `filmSlateFlat`
- `filter2`
- `filter2Flat`
- `fingerprint1`
- `fingerprint1Flat`
- `fingerprint2`
- `fingerprint2Flat`
- `fireAlarm2`
- `fireAlarm2Flat`
- `fireExtinguisherSign`
- `fireExtinguisherSignFlat`
- `fireworksRocket`
- `fireworksRocketFlat`
- `fist`
- `fistFlat`
- `fitToHeightSquare`
- `fitToHeightSquareFlat`
- `flash1`
- `flash1Flat`
- `flash2`
- `flash2Flat`
- `flash3`
- `flash3Flat`
- `flashOff`
- `flashOffFlat`
- `flipVerticalArrow2`
- `flipVerticalArrow2Flat`
- `flipVerticalCircle1`
- `flipVerticalCircle1Flat`
- `flipVerticalSquare2`
- `flipVerticalSquare2Flat`
- `floppyDisk`
- `floppyDiskFlat`
- `flower`
- `flowerAlt`
- `flowerAltFlat`
- `flowerFlat`
- `fluMask`
- `fluMaskFlat`
- `focusPoints`
- `focusPointsFlat`
- `folderAdd`
- `folderAddFlat`
- `folderCheck`
- `folderCheckFlat`
- `folderDelete`
- `folderDeleteFlat`
- `forkKnife`
- `forkKnifeFlat`
- `forkSpoon`
- `forkSpoonFlat`
- `fragile`
- `fragileFlat`
- `frontCamera`
- `frontCameraFlat`
- `galaxy1`
- `galaxy1Flat`
- `galaxy2`
- `galaxy2Flat`
- `gameboy`
- `gameboyFlat`
- `gasStationFuelPetroleum`
- `gasStationFuelPetroleumFlat`
- `genderEquality`
- `genderEqualityFlat`
- `gifFormat`
- `gifFormatFlat`
- `gift`
- `gift2`
- `gift2Flat`
- `giftFlat`
- `giveGift`
- `giveGiftFlat`
- `glasses`
- `glassesFlat`
- `globalLearning`
- `globalLearningFlat`
- `gmail`
- `gmailFlat`
- `gold`
- `goldFlat`
- `goodHealthAndWellBeing`
- `goodHealthAndWellBeingFlat`
- `google`
- `googleDrive`
- `googleDriveFlat`
- `googleFlat`
- `graduationCap`
- `graduationCapFlat`
- `gramophone`
- `gramophoneFlat`
- `graph`
- `graphArrowDecrease`
- `graphArrowDecreaseFlat`
- `graphArrowIncrease`
- `graphArrowIncreaseFlat`
- `graphBarDecrease`
- `graphBarDecreaseFlat`
- `graphBarIncrease`
- `graphBarIncreaseFlat`
- `graphDot`
- `graphDotFlat`
- `graphFlat`
- `groupMeetingCall`
- `groupMeetingCallFlat`
- `halfStar1`
- `halfStar1Flat`
- `handCursor`
- `handCursorFlat`
- `handGrab`
- `handGrabFlat`
- `handHeld`
- `handHeldFlat`
- `handHeldTabletDrawing`
- `handHeldTabletDrawingFlat`
- `handHeldTabletWriting`
- `handHeldTabletWritingFlat`
- `hangUp1`
- `hangUp1Flat`
- `hangUp2`
- `hangUp2Flat`
- `happyFace`
- `happyFaceFlat`
- `hardDisk`
- `hardDiskFlat`
- `hardDrive1`
- `hardDrive1Flat`
- `heading1ParagraphStylesHeading`
- `heading1ParagraphStylesHeadingFlat`
- `heading2ParagraphStylesHeading`
- `heading2ParagraphStylesHeadingFlat`
- `heading3ParagraphStylesHeading`
- `heading3ParagraphStylesHeadingFlat`
- `healthCare2`
- `healthCare2Flat`
- `hearingDeaf1`
- `hearingDeaf1Flat`
- `hearingDeaf2`
- `hearingDeaf2Flat`
- `heart`
- `heartFlat`
- `heartRatePulseGraph`
- `heartRatePulseGraphFlat`
- `heartRateSearch`
- `heartRateSearchFlat`
- `heartsSymbol`
- `heartsSymbolFlat`
- `helpChat2`
- `helpChat2Flat`
- `helpQuestion1`
- `helpQuestion1Flat`
- `hexagram`
- `hexagramFlat`
- `hierarchy10`
- `hierarchy10Flat`
- `hierarchy13`
- `hierarchy13Flat`
- `hierarchy14`
- `hierarchy14Flat`
- `hierarchy2`
- `hierarchy2Flat`
- `hierarchy4`
- `hierarchy4Flat`
- `hierarchy7`
- `hierarchy7Flat`
- `highSpeedTrainFront`
- `highSpeedTrainFrontFlat`
- `hinduism`
- `hinduismFlat`
- `home3`
- `home3Flat`
- `home4`
- `home4Flat`
- `horizontalMenuCircle`
- `horizontalMenuCircleFlat`
- `hospitalSignCircle`
- `hospitalSignCircleFlat`
- `hospitalSignSquare`
- `hospitalSignSquareFlat`
- `hotSpring`
- `hotSpringFlat`
- `hotelAirConditioner`
- `hotelAirConditionerFlat`
- `hotelBed2`
- `hotelBed2Flat`
- `hotelLaundry`
- `hotelLaundryFlat`
- `hotelOneStar`
- `hotelOneStarFlat`
- `hotelShowerHead`
- `hotelShowerHeadFlat`
- `hotelTwoStar`
- `hotelTwoStarFlat`
- `humidityNone`
- `humidityNoneFlat`
- `iceCream2`
- `iceCream2Flat`
- `iceCream3`
- `iceCream3Flat`
- `imageBlur`
- `imageBlurFlat`
- `imageSaturation`
- `imageSaturationFlat`
- `inboxBlock`
- `inboxBlockFlat`
- `inboxFavorite`
- `inboxFavoriteFlat`
- `inboxFavoriteHeart`
- `inboxFavoriteHeartFlat`
- `inboxLock`
- `inboxLockFlat`
- `inboxTray1`
- `inboxTray1Flat`
- `inboxTray2`
- `inboxTray2Flat`
- `incognitoMode`
- `incognitoModeFlat`
- `incomingCall`
- `incomingCallFlat`
- `industryInnovationAndInfrastructure`
- `industryInnovationAndInfrastructureFlat`
- `informationCircle`
- `informationCircleFlat`
- `informationDesk`
- `informationDeskCustomer`
- `informationDeskCustomerFlat`
- `informationDeskFlat`
- `inputBox`
- `inputBoxFlat`
- `insertCloudVideo`
- `insertCloudVideoFlat`
- `insertSide`
- `insertSideFlat`
- `insertTopLeft`
- `insertTopLeftFlat`
- `insertTopRight`
- `insertTopRightFlat`
- `instagram`
- `instagramFlat`
- `insuranceHand`
- `insuranceHandFlat`
- `investmentSelection`
- `investmentSelectionFlat`
- `invisible1`
- `invisible1Flat`
- `invisible2`
- `invisible2Flat`
- `iron`
- `ironFlat`
- `islam`
- `islamFlat`
- `jumpObject`
- `jumpObjectFlat`
- `justiceHammer`
- `justiceHammerFlat`
- `justiceScale1`
- `justiceScale1Flat`
- `justiceScale2`
- `justiceScale2Flat`
- `key`
- `keyFlat`
- `keyboard`
- `keyboardFlat`
- `keyboardVirtual`
- `keyboardVirtualFlat`
- `keyboardWireless2`
- `keyboardWireless2Flat`
- `keyholeLockCircle`
- `keyholeLockCircleFlat`
- `ladder`
- `ladderFlat`
- `landscape2`
- `landscape2Flat`
- `landscapeSetting`
- `landscapeSettingFlat`
- `laptopCamera`
- `laptopCameraFlat`
- `laptopCharging`
- `laptopChargingFlat`
- `lassoTool`
- `lassoToolFlat`
- `layers1`
- `layers1Flat`
- `layers2`
- `layers2Flat`
- `layoutWindow1`
- `layoutWindow1Flat`
- `layoutWindow11`
- `layoutWindow11Flat`
- `layoutWindow2`
- `layoutWindow2Flat`
- `layoutWindow8`
- `layoutWindow8Flat`
- `leaf`
- `leafFlat`
- `lemonFruitSeasoning`
- `lemonFruitSeasoningFlat`
- `lift`
- `liftDisability`
- `liftDisabilityFlat`
- `liftFlat`
- `lightbulb`
- `lightbulbFlat`
- `like1`
- `like1Flat`
- `linkChain`
- `linkChainFlat`
- `linkedin`
- `linkedinFlat`
- `lipstick`
- `lipstickFlat`
- `liveVideo`
- `liveVideoFlat`
- `localStorageFolder`
- `localStorageFolderFlat`
- `locationCompass1`
- `locationCompass1Flat`
- `locationPin3`
- `locationPin3Flat`
- `locationPinDisabled`
- `locationPinDisabledFlat`
- `locationTarget1`
- `locationTarget1Flat`
- `lockRotation`
- `lockRotationFlat`
- `log`
- `logFlat`
- `login1`
- `login1Flat`
- `logout1`
- `logout1Flat`
- `loop1`
- `loop1Flat`
- `lostAndFound`
- `lostAndFoundFlat`
- `magicWand2`
- `magicWand2Flat`
- `magnifyingGlass`
- `magnifyingGlassCircle`
- `magnifyingGlassCircleFlat`
- `magnifyingGlassFlat`
- `mailIncoming`
- `mailIncomingFlat`
- `mailSearch`
- `mailSearchFlat`
- `mailSendEmailMessage`
- `mailSendEmailMessageFlat`
- `mailSendEnvelope`
- `mailSendEnvelopeFlat`
- `mailSendReplyAll`
- `mailSendReplyAllFlat`
- `makeUpBrush`
- `makeUpBrushFlat`
- `manSymbol`
- `manSymbolFlat`
- `manualBook`
- `manualBookFlat`
- `mapFold`
- `mapFoldFlat`
- `markdownCircleProgramming`
- `markdownCircleProgrammingFlat`
- `markdownDocumentProgramming`
- `markdownDocumentProgrammingFlat`
- `medicalBag`
- `medicalBagFlat`
- `medicalCrossSignHealthcare`
- `medicalCrossSignHealthcareFlat`
- `medicalCrossSymbol`
- `medicalCrossSymbolFlat`
- `medicalFilesReportHistory`
- `medicalFilesReportHistoryFlat`
- `medicalRibbon1`
- `medicalRibbon1Flat`
- `medicalSearchDiagnosis`
- `medicalSearchDiagnosisFlat`
- `megaphone2`
- `megaphone2Flat`
- `meta`
- `metaFlat`
- `microscopeObservationSciene`
- `microscopeObservationScieneFlat`
- `microwave`
- `microwaveFlat`
- `milkshake`
- `milkshakeFlat`
- `minimizeWindow2`
- `minimizeWindow2Flat`
- `missedCall`
- `missedCallFlat`
- `mobilePhoneCamera`
- `mobilePhoneCameraFlat`
- `modulePuzzle1`
- `modulePuzzle1Flat`
- `modulePuzzle3`
- `modulePuzzle3Flat`
- `moduleThree`
- `moduleThreeFlat`
- `moonCloud`
- `moonCloudFlat`
- `mouse`
- `mouseFlat`
- `mouseWireless`
- `mouseWireless1`
- `mouseWireless1Flat`
- `mouseWirelessFlat`
- `moustache`
- `moustacheFlat`
- `mouthLip`
- `mouthLipFlat`
- `moveLeft`
- `moveLeftFlat`
- `moveRight`
- `moveRightFlat`
- `multipleFile2`
- `multipleFile2Flat`
- `musicEqualizer`
- `musicEqualizerFlat`
- `musicFolderSong`
- `musicFolderSongFlat`
- `musicNote1`
- `musicNote1Flat`
- `musicNote2`
- `musicNote2Flat`
- `musicNoteOff1`
- `musicNoteOff1Flat`
- `musicNoteOff2`
- `musicNoteOff2Flat`
- `navigationArrowOff`
- `navigationArrowOffFlat`
- `navigationArrowOn`
- `navigationArrowOnFlat`
- `necklace`
- `necklaceFlat`
- `necktie`
- `necktieFlat`
- `netflix`
- `netflixFlat`
- `network`
- `networkFlat`
- `newFile`
- `newFileFlat`
- `newFolder`
- `newFolderFlat`
- `newStickyNote`
- `newStickyNoteFlat`
- `newsPaper`
- `newsPaperFlat`
- `next`
- `nextFlat`
- `nintendoSwitch`
- `nintendoSwitchFlat`
- `noPoverty`
- `noPovertyFlat`
- `notEqualSign`
- `notEqualSignFlat`
- `notificationAlarm2`
- `notificationAlarm2Flat`
- `notificationApplication1`
- `notificationApplication1Flat`
- `notificationApplication2`
- `notificationApplication2Flat`
- `notificationMessageAlert`
- `notificationMessageAlertFlat`
- `nurseAssistantEmergency`
- `nurseAssistantEmergencyFlat`
- `nurseHat`
- `nurseHatFlat`
- `octopus`
- `octopusFlat`
- `officeBuilding1`
- `officeBuilding1Flat`
- `officeWorker`
- `officeWorkerFlat`
- `okHand`
- `okHandFlat`
- `oneFingerDragHorizontal`
- `oneFingerDragHorizontalFlat`
- `oneFingerDragVertical`
- `oneFingerDragVerticalFlat`
- `oneFingerHold`
- `oneFingerHoldFlat`
- `oneFingerTap`
- `oneFingerTapFlat`
- `oneVesusOne`
- `oneVesusOneFlat`
- `onlineMedicalCallService`
- `onlineMedicalCallServiceFlat`
- `onlineMedicalServiceMonitor`
- `onlineMedicalServiceMonitorFlat`
- `onlineMedicalWebService`
- `onlineMedicalWebServiceFlat`
- `openBook`
- `openBookFlat`
- `openUmbrella`
- `openUmbrellaFlat`
- `orientationLandscape`
- `orientationLandscapeFlat`
- `orientationPortrait`
- `orientationPortraitFlat`
- `outgoingCall`
- `outgoingCallFlat`
- `pacman`
- `pacmanFlat`
- `padlockSquare1`
- `padlockSquare1Flat`
- `pageSetting`
- `pageSettingFlat`
- `paintBucket`
- `paintBucketFlat`
- `paintPalette`
- `paintPaletteFlat`
- `paintbrush1`
- `paintbrush1Flat`
- `paintbrush2`
- `paintbrush2Flat`
- `paperclip1`
- `paperclip1Flat`
- `parachuteDrop`
- `parachuteDropFlat`
- `paragraph`
- `paragraphFlat`
- `parkingSign`
- `parkingSignFlat`
- `parliament`
- `parliamentFlat`
- `partyPopper`
- `partyPopperFlat`
- `passport`
- `passportFlat`
- `pathfinderDivide`
- `pathfinderDivideFlat`
- `pathfinderExclude`
- `pathfinderExcludeFlat`
- `pathfinderIntersect`
- `pathfinderIntersectFlat`
- `pathfinderMerge`
- `pathfinderMergeFlat`
- `pathfinderMinusFront1`
- `pathfinderMinusFront1Flat`
- `pathfinderTrim`
- `pathfinderTrimFlat`
- `pathfinderUnion`
- `pathfinderUnionFlat`
- `payment10`
- `payment10Flat`
- `paymentCashOut3`
- `paymentCashOut3Flat`
- `paypal`
- `paypalFlat`
- `peaceHand`
- `peaceHandFlat`
- `peaceSymbol`
- `peaceSymbolFlat`
- `pen3`
- `pen3Flat`
- `penDraw`
- `penDrawFlat`
- `penTool`
- `penToolFlat`
- `pencil`
- `pencilFlat`
- `pentagon`
- `pentagonFlat`
- `petPaw`
- `petPawFlat`
- `petriDishLabEquipment`
- `petriDishLabEquipmentFlat`
- `petsAllowed`
- `petsAllowedFlat`
- `pharmacy`
- `pharmacyFlat`
- `phone`
- `phoneFlat`
- `phoneMobilePhone`
- `phoneMobilePhoneFlat`
- `phoneQr`
- `phoneQrFlat`
- `phoneRinging1`
- `phoneRinging1Flat`
- `phoneRinging2`
- `phoneRinging2Flat`
- `piSymbolCircle`
- `piSymbolCircleFlat`
- `picturesFolderMemories`
- `picturesFolderMemoriesFlat`
- `pieChart`
- `pieChartFlat`
- `piggyBank`
- `piggyBankFlat`
- `planet`
- `planetFlat`
- `playList4`
- `playList4Flat`
- `playList5`
- `playList5Flat`
- `playList8`
- `playList8Flat`
- `playList9`
- `playList9Flat`
- `playListFolder`
- `playListFolderFlat`
- `playStation`
- `playStationFlat`
- `playStore`
- `playStoreFlat`
- `podium`
- `podiumFlat`
- `polaroidFour`
- `polaroidFourFlat`
- `politicsCompaign`
- `politicsCompaignFlat`
- `politicsSpeech`
- `politicsSpeechFlat`
- `politicsVote2`
- `politicsVote2Flat`
- `polkaDotCircle`
- `polkaDotCircleFlat`
- `polygon`
- `polygonFlat`
- `poolLadder`
- `poolLadderFlat`
- `popcorn`
- `popcornFlat`
- `porkMeat`
- `porkMeatFlat`
- `pottedFlowerTulip`
- `pottedFlowerTulipFlat`
- `prayingHand`
- `prayingHandFlat`
- `prescriptionPillsDrugsHealthcare`
- `prescriptionPillsDrugsHealthcareFlat`
- `printer`
- `printerFlat`
- `productionBelt`
- `productionBeltFlat`
- `projectorBoard`
- `projectorBoardFlat`
- `pyramidShape`
- `pyramidShapeFlat`
- `qrCode`
- `qrCodeFlat`
- `qualityEducation`
- `qualityEducationFlat`
- `quotation2`
- `quotation2Flat`
- `radio`
- `radioFlat`
- `radioactive2`
- `radioactive2Flat`
- `rainCloud`
- `rainCloudFlat`
- `rainbow`
- `rainbowFlat`
- `receipt`
- `receiptAdd`
- `receiptAddFlat`
- `receiptCheck`
- `receiptCheckFlat`
- `receiptFlat`
- `receiptSubtract`
- `receiptSubtractFlat`
- `recordingTapeBubbleCircle`
- `recordingTapeBubbleCircleFlat`
- `recordingTapeBubbleSquare`
- `recordingTapeBubbleSquareFlat`
- `recycle1`
- `recycle1Flat`
- `recycleBin2`
- `recycleBin2Flat`
- `reducedInequalities`
- `reducedInequalitiesFlat`
- `refrigerator`
- `refrigeratorFlat`
- `return2`
- `return2Flat`
- `ringingBellNotification`
- `ringingBellNotificationFlat`
- `rockAndRollHand`
- `rockAndRollHandFlat`
- `rockSlide`
- `rockSlideFlat`
- `rose`
- `roseFlat`
- `rotateAngle45`
- `rotateAngle45Flat`
- `roundCap`
- `roundCapFlat`
- `rssSquare`
- `rssSquareFlat`
- `rssSymbol`
- `rssSymbolFlat`
- `sadFace`
- `sadFaceFlat`
- `safeVault`
- `safeVaultFlat`
- `sailShip`
- `sailShipFlat`
- `satelliteDish`
- `satelliteDishFlat`
- `scanner`
- `scanner3`
- `scanner3Flat`
- `scannerBarCode`
- `scannerBarCodeFlat`
- `scannerFlat`
- `schoolBusSide`
- `schoolBusSideFlat`
- `screen1`
- `screen1Flat`
- `screen2`
- `screen2Flat`
- `screenBroadcast`
- `screenBroadcastFlat`
- `screenCurve`
- `screenCurveFlat`
- `screensaverMonitorWallpaper`
- `screensaverMonitorWallpaperFlat`
- `script2`
- `script2Flat`
- `searchDollar`
- `searchDollarFlat`
- `searchVisual`
- `searchVisualFlat`
- `selectCircleArea1`
- `selectCircleArea1Flat`
- `sendEmail`
- `sendEmailFlat`
- `servingDome`
- `servingDomeFlat`
- `shareLink`
- `shareLinkFlat`
- `shelf`
- `shelfFlat`
- `shell`
- `shellFlat`
- `shield1`
- `shield1Flat`
- `shield2`
- `shield2Flat`
- `shieldCheck`
- `shieldCheckFlat`
- `shieldCross`
- `shieldCrossFlat`
- `shift`
- `shiftFlat`
- `shipmentAdd`
- `shipmentAddFlat`
- `shipmentCheck`
- `shipmentCheckFlat`
- `shipmentDownload`
- `shipmentDownloadFlat`
- `shipmentRemove`
- `shipmentRemoveFlat`
- `shipmentUpload`
- `shipmentUploadFlat`
- `shippingBox1`
- `shippingBox1Flat`
- `shippingTruck`
- `shippingTruckFlat`
- `shoppingBagHandBag2`
- `shoppingBagHandBag2Flat`
- `shoppingBasket1`
- `shoppingBasket1Flat`
- `shoppingBasket2`
- `shoppingBasket2Flat`
- `shoppingCart1`
- `shoppingCart1Flat`
- `shoppingCart2`
- `shoppingCart2Flat`
- `shoppingCart3`
- `shoppingCart3Flat`
- `shoppingCartAdd`
- `shoppingCartAddFlat`
- `shoppingCartCheck`
- `shoppingCartCheckFlat`
- `shoppingCartSubtract`
- `shoppingCartSubtractFlat`
- `shovelRake`
- `shovelRakeFlat`
- `shredder`
- `shredderFlat`
- `shrimp`
- `shrimpFlat`
- `shrinkHorizontal1`
- `shrinkHorizontal1Flat`
- `shuffle`
- `shuffleFlat`
- `sigma`
- `sigmaFlat`
- `signAt`
- `signAtFlat`
- `signCrossSquare`
- `signCrossSquareFlat`
- `signHashtag`
- `signHashtagFlat`
- `signage3`
- `signage3Flat`
- `signage4`
- `signage4Flat`
- `signalFull`
- `signalFullFlat`
- `signalLoading`
- `signalLoadingFlat`
- `signalLow`
- `signalLowFlat`
- `signalMedium`
- `signalMediumFlat`
- `signalNone`
- `signalNoneFlat`
- `skull1`
- `skull1Flat`
- `slack`
- `slackFlat`
- `sleep`
- `sleepFlat`
- `smileyAngry`
- `smileyAngryFlat`
- `smileyCool`
- `smileyCoolFlat`
- `smileyCrying1`
- `smileyCrying1Flat`
- `smileyCute`
- `smileyCuteFlat`
- `smileyDrool`
- `smileyDroolFlat`
- `smileyEmojiKissNervous`
- `smileyEmojiKissNervousFlat`
- `smileyEmojiTerrified`
- `smileyEmojiTerrifiedFlat`
- `smileyGrumpy`
- `smileyGrumpyFlat`
- `smileyHappy`
- `smileyHappyFlat`
- `smileyInLove`
- `smileyInLoveFlat`
- `smileyKiss`
- `smileyKissFlat`
- `smileyLaughing3`
- `smileyLaughing3Flat`
- `smileyMask`
- `smileyMaskFlat`
- `smileyNauseas`
- `smileyNauseasFlat`
- `smileySmirk`
- `smileySmirkFlat`
- `smileySparks`
- `smileySparksFlat`
- `smileySurprised`
- `smileySurprisedFlat`
- `smileyThrowUp`
- `smileyThrowUpFlat`
- `smileyVeryShocked`
- `smileyVeryShockedFlat`
- `smokeDetector`
- `smokeDetectorFlat`
- `smokingArea`
- `smokingAreaFlat`
- `snorkle`
- `snorkleFlat`
- `snowFlake`
- `snowFlakeFlat`
- `songRecommendation`
- `songRecommendationFlat`
- `sortDescending`
- `sortDescendingFlat`
- `sosHelpEmergencySign`
- `sosHelpEmergencySignFlat`
- `spadesSymbol`
- `spadesSymbolFlat`
- `speaker1`
- `speaker1Flat`
- `speaker2`
- `speaker2Flat`
- `spiralShape`
- `spiralShapeFlat`
- `splitVertical`
- `splitVerticalFlat`
- `spotify`
- `spotifyFlat`
- `sprayPaint`
- `sprayPaintFlat`
- `sprout`
- `sproutFlat`
- `squareBracketsCircle`
- `squareBracketsCircleFlat`
- `squareCap`
- `squareCapFlat`
- `squareClock`
- `squareClockFlat`
- `squareRootXCircle`
- `squareRootXCircleFlat`
- `star1`
- `star1Flat`
- `star2`
- `star2Flat`
- `starBadge`
- `starBadgeFlat`
- `startup`
- `startupFlat`
- `steeringWheel`
- `steeringWheelFlat`
- `stepsNumber`
- `stepsNumberFlat`
- `stethoscope`
- `stethoscopeFlat`
- `stock`
- `stockFlat`
- `store1`
- `store1Flat`
- `store2`
- `store2Flat`
- `storeComputer`
- `storeComputerFlat`
- `straightCap`
- `straightCapFlat`
- `straightFace`
- `straightFaceFlat`
- `strategyTasks`
- `strategyTasksFlat`
- `strawberry`
- `strawberryFlat`
- `stream`
- `streamFlat`
- `streetRoad`
- `streetRoadFlat`
- `streetSign`
- `streetSignFlat`
- `subscriptionCashflow`
- `subscriptionCashflowFlat`
- `subtract1`
- `subtract1Flat`
- `subtractCircle`
- `subtractCircleFlat`
- `subtractSquare`
- `subtractSquareFlat`
- `sunCloud`
- `sunCloudFlat`
- `synchronizeDisable`
- `synchronizeDisableFlat`
- `synchronizeWarning`
- `synchronizeWarningFlat`
- `syringe`
- `syringeFlat`
- `tableLamp1`
- `tableLamp1Flat`
- `tabletCapsule`
- `tabletCapsuleFlat`
- `tag`
- `tagAlt`
- `tagAltFlat`
- `tagFlat`
- `takeOff`
- `takeOffFlat`
- `tallHat`
- `tallHatFlat`
- `tapeCassetteRecord`
- `tapeCassetteRecordFlat`
- `target`
- `target3`
- `target3Flat`
- `targetFlat`
- `taskList`
- `taskListFlat`
- `teaCup`
- `teaCupFlat`
- `telegram`
- `telegramFlat`
- `telescope`
- `telescopeFlat`
- `testTube`
- `testTubeFlat`
- `textFlowRows`
- `textFlowRowsFlat`
- `textSquare`
- `textSquareFlat`
- `textStyle`
- `textStyleFlat`
- `thermometer`
- `thermometerFlat`
- `threatBrowser1`
- `threatBrowser1Flat`
- `threatDocument`
- `threatDocumentFlat`
- `threatFolder`
- `threatFolderFlat`
- `ticket1`
- `ticket1Flat`
- `tickets`
- `ticketsFlat`
- `tidalWave`
- `tidalWaveFlat`
- `tiktok`
- `tiktokFlat`
- `tinder`
- `tinderFlat`
- `toast`
- `toastFlat`
- `toiletMan`
- `toiletManFlat`
- `toiletSignManWoman2`
- `toiletSignManWoman2Flat`
- `toiletWomen`
- `toiletWomenFlat`
- `tooth`
- `toothFlat`
- `trafficCone`
- `trafficConeFlat`
- `transferMotorcycle`
- `transferMotorcycleFlat`
- `transferVan`
- `transferVanFlat`
- `tree2`
- `tree2Flat`
- `tree3`
- `tree3Flat`
- `trendingContent`
- `trendingContentFlat`
- `triangleFlag`
- `triangleFlagFlat`
- `trophy`
- `trophyFlat`
- `twitter`
- `twitterFlat`
- `twoFingerDragHotizontal`
- `twoFingerDragHotizontalFlat`
- `twoFingerTap`
- `twoFingerTapFlat`
- `underlineText1`
- `underlineText1Flat`
- `uploadBox1`
- `uploadBox1Flat`
- `uploadCircle`
- `uploadCircleFlat`
- `uploadComputer`
- `uploadComputerFlat`
- `uploadFile`
- `uploadFileFlat`
- `usbDrive`
- `usbDriveFlat`
- `userAddPlus`
- `userAddPlusFlat`
- `userCheckValidate`
- `userCheckValidateFlat`
- `userCircleSingle`
- `userCircleSingleFlat`
- `userIdentifierCard`
- `userIdentifierCardFlat`
- `userMultipleCircle`
- `userMultipleCircleFlat`
- `userMultipleGroup`
- `userMultipleGroupFlat`
- `userProfileFocus`
- `userProfileFocusFlat`
- `userProtection2`
- `userProtection2Flat`
- `userRemoveSubtract`
- `userRemoveSubtractFlat`
- `userSingleNeutralMale`
- `userSingleNeutralMaleFlat`
- `userSyncOnlineInPerson`
- `userSyncOnlineInPersonFlat`
- `verticalSliderSquare`
- `verticalSliderSquareFlat`
- `videoSwapCamera`
- `videoSwapCameraFlat`
- `virtualReality`
- `virtualRealityFlat`
- `virusAntivirus`
- `virusAntivirusFlat`
- `visible`
- `visibleFlat`
- `voiceMail`
- `voiceMailFlat`
- `voiceMailOff`
- `voiceMailOffFlat`
- `voiceScan2`
- `voiceScan2Flat`
- `volcano`
- `volcanoFlat`
- `volumeDown`
- `volumeDownFlat`
- `volumeLevelHigh`
- `volumeLevelHighFlat`
- `volumeLevelLow`
- `volumeLevelLowFlat`
- `volumeLevelOff`
- `volumeLevelOffFlat`
- `volumeMute`
- `volumeMuteFlat`
- `volumeOff`
- `volumeOffFlat`
- `vpnConnection`
- `vpnConnectionFlat`
- `vrHeadset1`
- `vrHeadset1Flat`
- `vrHeadset2`
- `vrHeadset2Flat`
- `waitingAppointmentsCalendar`
- `waitingAppointmentsCalendarFlat`
- `wallet`
- `walletFlat`
- `walletPurse`
- `walletPurseFlat`
- `waningCresentMoon`
- `waningCresentMoonFlat`
- `warehouse1`
- `warehouse1Flat`
- `warningOctagon`
- `warningOctagonFlat`
- `warningTriangle`
- `warningTriangleFlat`
- `watch1`
- `watch1Flat`
- `watch2`
- `watch2Flat`
- `watchCircleCharging`
- `watchCircleChargingFlat`
- `watchCircleHeartbeatMonitor1`
- `watchCircleHeartbeatMonitor1Flat`
- `watchCircleHeartbeatMonitor2`
- `watchCircleHeartbeatMonitor2Flat`
- `watchCircleMenu`
- `watchCircleMenuFlat`
- `watchCircleTime`
- `watchCircleTimeFlat`
- `waterGlass`
- `waterGlassFlat`
- `waveSignal`
- `waveSignalFlat`
- `waveSignalSquare`
- `waveSignalSquareFlat`
- `wavingHand`
- `wavingHandFlat`
- `web`
- `webFlat`
- `webcam`
- `webcamFlat`
- `webcamVideo`
- `webcamVideoCircle`
- `webcamVideoCircleFlat`
- `webcamVideoFlat`
- `webcamVideoOff`
- `webcamVideoOffFlat`
- `whatsapp`
- `whatsappFlat`
- `wheelchair`
- `wheelchair1`
- `wheelchair1Flat`
- `wheelchairFlat`
- `widget`
- `widgetFlat`
- `wifi`
- `wifiAntenna`
- `wifiAntennaFlat`
- `wifiDisabled`
- `wifiDisabledFlat`
- `wifiFlat`
- `wifiHorizontal`
- `wifiHorizontalFlat`
- `wifiRouter`
- `wifiRouterFlat`
- `windFlow1`
- `windFlow1Flat`
- `windFlow2`
- `windFlow2Flat`
- `windmill`
- `windmillFlat`
- `windows`
- `windowsFlat`
- `wine`
- `wineFlat`
- `womanSymbol`
- `womanSymbolFlat`
- `workspaceDesk`
- `workspaceDeskFlat`
- `wrench`
- `wrenchFlat`
- `xbox`
- `xboxFlat`
- `xrpCircle`
- `xrpCircleFlat`
- `yinYangSymbol`
- `yinYangSymbolFlat`
- `yuan`
- `yuanCircle`
- `yuanCircleFlat`
- `yuanFlat`
- `zeroHunger`
- `zeroHungerFlat`
- `zodiac1`
- `zodiac1Flat`
- `zodiac10`
- `zodiac10Flat`
- `zodiac11`
- `zodiac11Flat`
- `zodiac12`
- `zodiac12Flat`
- `zodiac2`
- `zodiac2Flat`
- `zodiac3`
- `zodiac3Flat`
- `zodiac4`
- `zodiac4Flat`
- `zodiac5`
- `zodiac5Flat`
- `zodiac6`
- `zodiac6Flat`
- `zodiac7`
- `zodiac7Flat`
- `zodiac8`
- `zodiac8Flat`
- `zodiac9`
- `zodiac9Flat`

## Usage Examples

### Navigation Menu

```html
@js
  import { Add1Icon, Add1FlatIcon, AddBellNotificationIcon, AddBellNotificationFlatIcon } from '@stacksjs/iconify-streamline-color'

  global.navIcons = {
    home: Add1Icon({ size: 20, class: 'nav-icon' }),
    about: Add1FlatIcon({ size: 20, class: 'nav-icon' }),
    contact: AddBellNotificationIcon({ size: 20, class: 'nav-icon' }),
    settings: AddBellNotificationFlatIcon({ size: 20, class: 'nav-icon' })
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
import { Add1Icon } from '@stacksjs/iconify-streamline-color'

const icon = Add1Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { Add1Icon, Add1FlatIcon, AddBellNotificationIcon } from '@stacksjs/iconify-streamline-color'

const successIcon = Add1Icon({ size: 16, color: '#22c55e' })
const warningIcon = Add1FlatIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddBellNotificationIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { Add1Icon, Add1FlatIcon } from '@stacksjs/iconify-streamline-color'
   const icon = Add1Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { add1, add1Flat } from '@stacksjs/iconify-streamline-color'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(add1, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { Add1Icon, Add1FlatIcon } from '@stacksjs/iconify-streamline-color'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-streamline-color'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { Add1Icon } from '@stacksjs/iconify-streamline-color'
     global.icon = Add1Icon({ size: 24 })
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
   const icon = Add1Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { add1 } from '@stacksjs/iconify-streamline-color'

// Icons are typed as IconData
const myIcon: IconData = add1
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
