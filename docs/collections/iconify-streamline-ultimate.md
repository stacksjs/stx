# Ultimate free icons

> Ultimate free icons icons for stx from Iconify

## Overview

This package provides access to 1999 icons from the Ultimate free icons collection through the stx iconify integration.

**Collection ID:** `streamline-ultimate`
**Total Icons:** 1999
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-ultimate
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<A11yAccessibilityDisabilityIcon height="1em" />
<A11yAccessibilityDisabilityIcon width="1em" height="1em" />
<A11yAccessibilityDisabilityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<A11yAccessibilityDisabilityIcon size="24" />
<A11yAccessibilityDisabilityIcon size="1em" />

<!-- Using width and height -->
<A11yAccessibilityDisabilityIcon width="24" height="32" />

<!-- With color -->
<A11yAccessibilityDisabilityIcon size="24" color="red" />
<A11yAccessibilityDisabilityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<A11yAccessibilityDisabilityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<A11yAccessibilityDisabilityIcon
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
    <A11yAccessibilityDisabilityIcon size="24" />
    <A11yAccessibilityDisabilityBoldIcon size="24" color="#4a90e2" />
    <AbTestingMonitorsIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { a11yAccessibilityDisability, a11yAccessibilityDisabilityBold, abTestingMonitors } from '@stacksjs/iconify-streamline-ultimate'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(a11yAccessibilityDisability, { size: 24 })
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
<A11yAccessibilityDisabilityIcon size="24" color="red" />
<A11yAccessibilityDisabilityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<A11yAccessibilityDisabilityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<A11yAccessibilityDisabilityIcon size="24" class="text-primary" />
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
<A11yAccessibilityDisabilityIcon height="1em" />
<A11yAccessibilityDisabilityIcon width="1em" height="1em" />
<A11yAccessibilityDisabilityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<A11yAccessibilityDisabilityIcon size="24" />
<A11yAccessibilityDisabilityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineUltimate-icon {
  width: 1em;
  height: 1em;
}
```

```html
<A11yAccessibilityDisabilityIcon class="streamlineUltimate-icon" />
```

## Available Icons

This package contains **1999** icons:

- `a11yAccessibilityDisability`
- `a11yAccessibilityDisabilityBold`
- `abTestingMonitors`
- `abTestingMonitorsBold`
- `accountingBillStack1`
- `accountingBillStack1Bold`
- `accountingCalculator1`
- `accountingCalculator1Bold`
- `accountingCoins`
- `accountingCoinsBold`
- `acupunctureBack`
- `acupunctureBackBold`
- `addCircleBold`
- `addCircleBoldBold`
- `adguardLogo`
- `adguardLogoBold`
- `adobeAfterEffectsLogo`
- `adobeAfterEffectsLogoBold`
- `adobeCloudLogo`
- `adobeCloudLogoBold`
- `adobeXdLogo`
- `adobeXdLogoBold`
- `adventureCarTruck1`
- `adventureCarTruck1Bold`
- `aerialYogabasicInversionPose`
- `aerialYogabasicInversionPoseBold`
- `airConditionerRear1`
- `airConditionerRear1Bold`
- `aircraftChopper2`
- `aircraftChopper2Bold`
- `aircraftHotAirBalloon2`
- `aircraftHotAirBalloon2Bold`
- `airplaneMode`
- `airplaneModeBold`
- `airtableLogo`
- `airtableLogoBold`
- `alarmBellRing`
- `alarmBellRingBold`
- `alertBellNotification2`
- `alertBellNotification2Bold`
- `alertOctagon1`
- `alertOctagon1Bold`
- `alignCenter`
- `alignCenterBold`
- `alignMiddle`
- `alignMiddleBold`
- `alignStrokeToCenter`
- `alignStrokeToCenterBold`
- `alipayLogo`
- `alipayLogoBold`
- `allowancesNoPhotos`
- `allowancesNoPhotosBold`
- `allowancesNoTalking`
- `allowancesNoTalkingBold`
- `allowancesSmoking`
- `allowancesSmokingBold`
- `americanFootballHelmet`
- `americanFootballHelmetBold`
- `ampersand`
- `ampersandBold`
- `amusementParkBalloon`
- `amusementParkBalloonBold`
- `amusementParkCastle`
- `amusementParkCastleBold`
- `amusementParkElectricCars`
- `amusementParkElectricCarsBold`
- `amusementParkFerrisWheel`
- `amusementParkFerrisWheelBold`
- `analyticsBars3D`
- `analyticsBars3DBold`
- `analyticsBoardGraphLine`
- `analyticsBoardGraphLineBold`
- `analyticsGraphLines2`
- `analyticsGraphLines2Bold`
- `analyticsMountain`
- `analyticsMountainBold`
- `analyticsNet`
- `analyticsNetBold`
- `analyticsPie3`
- `analyticsPie3Bold`
- `android1`
- `android1Bold`
- `animalProductsEgg`
- `animalProductsEggBold`
- `antenna`
- `antennaBold`
- `apk1`
- `apk1Bold`
- `appWindowBookmark`
- `appWindowBookmarkBold`
- `appWindowClock`
- `appWindowClockBold`
- `appWindowMultiple`
- `appWindowMultipleBold`
- `appWindowPieChart`
- `appWindowPieChartBold`
- `appWindowText1`
- `appWindowText1Bold`
- `archiveBooks`
- `archiveBooksBold`
- `archiveLocker`
- `archiveLockerBold`
- `arrangeLetter`
- `arrangeLetterBold`
- `arrangeListDescending`
- `arrangeListDescending1Bold`
- `arrangeNumberDescending`
- `arrangeNumberDescendingBold`
- `arrowButtonCircleLeft`
- `arrowButtonCircleLeftBold`
- `arrowButtonRight1`
- `arrowButtonRight1Bold`
- `arrowButtonUp`
- `arrowButtonUpBold`
- `arrowDotCornerLeft1`
- `arrowDotCornerLeft1Bold`
- `arrowDoubleDown1`
- `arrowDoubleDown1Bold`
- `arrowDoubleUp`
- `arrowDoubleUpBold`
- `arrowDown2`
- `arrowDown2Bold`
- `arrowRectangleDown2`
- `arrowRectangleDown2Bold`
- `arrowRight`
- `arrowRightBold`
- `arrowThickCircleLeft2`
- `arrowThickCircleLeft2Bold`
- `arrowThickLeft3`
- `arrowThickLeft3Bold`
- `arrowThickRightBottomCorner3`
- `arrowThickRightBottomCorner3Bold`
- `arrowThickUp4`
- `arrowThickUp4Bold`
- `astronomyPlanetSaturn1`
- `astronomyPlanetSaturn1Bold`
- `athleticsJavelinThrowing`
- `athleticsJavelinThrowingBold`
- `athleticsRunning1`
- `athleticsRunning1Bold`
- `atiLogo`
- `atiLogoBold`
- `attachment`
- `attachmentBold`
- `audioFile`
- `audioFileBold`
- `audioFileMp3`
- `audioFileMp3Bold`
- `audioFileSync`
- `audioFileSyncBold`
- `autopilotCar1`
- `autopilotCar1Bold`
- `awardBadgeStar`
- `awardBadgeStarBold`
- `awardMedal4`
- `awardMedal4Bold`
- `awardRibbonStar1`
- `awardRibbonStar1Bold`
- `awardTrophy1`
- `awardTrophy1Bold`
- `bandageLeg`
- `bandageLegBold`
- `barbecueGrill`
- `barbecueGrillBold`
- `barcode`
- `barcodeBold`
- `baseballBatBall`
- `baseballBatBallBold`
- `beerGlass`
- `beerGlassBold`
- `beerOpener`
- `beerOpenerBold`
- `beggingHandCoin2`
- `beggingHandCoin2Bold`
- `behanceLogo`
- `behanceLogoBold`
- `bicycle`
- `bicycleBold`
- `bilibiliLogo`
- `bilibiliLogoBold`
- `billCross`
- `billCrossBold`
- `bin1`
- `bin1Bold`
- `bingLogoBold`
- `bingSearchLogo`
- `binocular`
- `binocularBold`
- `blackberryLogo`
- `blackberryLogoBold`
- `blizzards1NaturalDisastersBlizzardsSnow`
- `blizzards1NaturalDisastersBlizzardsSnowBold`
- `blogBloggerLogo`
- `bloggerLogoBold`
- `bloodBagCross`
- `bloodBagCrossBold`
- `bloodDrop`
- `bloodDropBold`
- `bloodTypes1`
- `bloodTypes1Bold`
- `blueprintHelmet1`
- `blueprintHelmet1Bold`
- `bluetoothTransfer`
- `bluetoothTransferBold`
- `boardGameDice2`
- `boardGameDice2Bold`
- `boardGameJenga`
- `boardGameJengaBold`
- `bodyCareCream`
- `bodyCareCreamBold`
- `bookBookPages`
- `bookBookPagesBold`
- `bookCloseBookmark1`
- `bookCloseBookmark1Bold`
- `bookCog2`
- `bookCog2Bold`
- `bookOpenBookmark`
- `bookOpenBookmarkBold`
- `bookSearch`
- `bookSearchBold`
- `bookStar1`
- `bookStarBold`
- `bookmarkCancelDelete`
- `bookmarkCancelDeleteBold`
- `bookmarksDocument`
- `bookmarksDocumentAlternateBold`
- `bowlingSet`
- `bowlingSetBold`
- `boxingBagHanging`
- `boxingBagHangingBold`
- `branchLine5`
- `branchLine5Bold`
- `breadLoaf`
- `breadLoafBold`
- `brightness`
- `brightnessBold`
- `browserCom`
- `browserComBold`
- `browserPageLayout`
- `browserPageLayoutBold`
- `bus1`
- `bus1Bold`
- `businessBigSmallFish`
- `businessBigSmallFishBold`
- `businessCard1`
- `businessCard1Bold`
- `businessCardHand2`
- `businessCardHand2Bold`
- `businessContractGive`
- `businessContractGiveBold`
- `businessDealCash2`
- `businessDealCash2Bold`
- `businessLuckyCat`
- `businessLuckyCatBold`
- `businessPearl`
- `businessPearlBold`
- `businessRabbitHat`
- `businessRabbitHatBold`
- `buttonFastForward1`
- `buttonFastForward1Bold`
- `buttonLoop`
- `buttonLoopBold`
- `buttonPlay`
- `buttonPlayBold`
- `buttonStop`
- `buttonStopBold`
- `buttonZigzag1`
- `buttonZigzag1Bold`
- `calendar3`
- `calendar3Bold`
- `calendarEdit1`
- `calendarEdit1Bold`
- `callForwardingOutgoing1`
- `callForwardingOutgoing1Bold`
- `cameraDisplay`
- `cameraDisplayBold`
- `cameraSmall`
- `cameraSmallBold`
- `cameraTripod`
- `cameraTripodBold`
- `car3`
- `car3Bold`
- `carActionsCheck1`
- `carActionsCheck1Bold`
- `carDashboardLights`
- `carDashboardLightsBold`
- `carDashboardWarning`
- `carDashboardWarningBold`
- `carEngine11`
- `carEngine11Bold`
- `carRepairEngine`
- `carRepairEngineBold`
- `carToolJumperCables`
- `carToolJumperCablesBold`
- `cardAdd1`
- `cardAdd1Bold`
- `cardGameHeart`
- `cardGameHeartBold`
- `carnivalShop`
- `carnivalShopBold`
- `cashBriefcase`
- `cashBriefcaseBold`
- `cashNetwork`
- `cashNetworkBold`
- `cashPaymentBill`
- `cashPaymentBillBold`
- `cashPaymentBills`
- `cashPaymentBillsBold`
- `cashPaymentSign2`
- `cashPaymentSign2Bold`
- `cashSearch`
- `cashSearchBold`
- `cashlessPaymentOnlineStatementMonitor`
- `cashlessPaymentOnlineStatementMonitorBold`
- `cashlessPaymentQrCodeBasket`
- `cashlessPaymentQrCodeBasketBold`
- `cashlessPaymentSmartPayBusSmartphoneQr`
- `cashlessPaymentSmartPayBusSmartphoneQrBold`
- `casinoChip5`
- `casinoChip5Bold`
- `casinoLucky7`
- `casinoLucky7Bold`
- `cdBroken`
- `cdBrokenBold`
- `cdPlaying`
- `cdPlayingBold`
- `cellBorderFrame`
- `cellBorderFrameBold`
- `cellularNetworkLte`
- `cellularNetworkLteBold`
- `cellularNetworkWifi3G`
- `cellularNetworkWifi3GBold`
- `certifiedDiploma`
- `certifiedDiplomaBold`
- `champagneCooler`
- `champagneCoolerBold`
- `charger1`
- `charger1Bold`
- `chargingBatteryEmpty`
- `chargingBatteryEmptyBold`
- `chargingBatteryMedium1`
- `chargingBatteryMedium1Bold`
- `chargingFlashWifi`
- `chargingFlashWifiBold`
- `checkBadge`
- `checkBadgeBold`
- `checkBold`
- `checkDouble`
- `checkSquare`
- `checkSquareBold`
- `checklist`
- `checklistBold`
- `checkupChart`
- `checkupChartBold`
- `checkupDiagnostic`
- `checkupDiagnosticBold`
- `chefGearGloves`
- `chefGearGlovesBold`
- `chemicalHexagon1`
- `chemicalHexagon1Bold`
- `chessKnight`
- `chessKnightBold`
- `chromeLogo`
- `chromeLogoBold`
- `chromium`
- `chromiumBold`
- `circusElephant`
- `circusElephantBold`
- `circusTent`
- `circusTentBold`
- `cloudAdd`
- `cloudAddBold`
- `cloudDataTransfer`
- `cloudDataTransferBold`
- `cloudFile`
- `cloudFileBold`
- `cloudLoading`
- `cloudLoadingBold`
- `cloudMist2`
- `cloudMist2Bold`
- `cloudWarning`
- `cloudWarningBold`
- `coWorkingSpaceLaptop`
- `coWorkingSpaceLaptopBold`
- `cocktailGlass1`
- `cocktailGlass1Bold`
- `codingAppsWebsiteAppsAddWidget`
- `codingAppsWebsiteAppsAddWidgetBold`
- `codingAppsWebsiteAppsBrowser`
- `codingAppsWebsiteAppsBrowserBold`
- `codingAppsWebsiteBigDataDatabaseGlobalityVelocity`
- `codingAppsWebsiteBigDataDatabaseGlobalityVelocityBold`
- `codingAppsWebsiteBrowserImage`
- `codingAppsWebsiteBrowserImageBold`
- `codingAppsWebsiteDataConversionDocuments1`
- `codingAppsWebsiteDataConversionDocuments1Bold`
- `codingAppsWebsiteDataConversionDocuments2`
- `codingAppsWebsiteDataConversionDocuments2Bold`
- `codingAppsWebsiteDetectVirusMonitorSearch`
- `codingAppsWebsiteDetectVirusMonitorSearchBold`
- `codingAppsWebsiteGdprShield`
- `codingAppsWebsiteGdprShieldBold`
- `codingAppsWebsiteNetworkGlobe`
- `codingAppsWebsiteNetworkGlobeBold`
- `codingAppsWebsiteSmartphoneProtection`
- `codingAppsWebsiteSmartphoneProtectionBold`
- `codingAppsWebsiteVirusFilesAlert1`
- `codingAppsWebsiteVirusFilesAlert1Bold`
- `codingAppsWebsiteWebDevApiCloud`
- `codingAppsWebsiteWebDevApiCloudBold`
- `codingAppsWebsiteWebFormDropDownMenu1`
- `codingAppsWebsiteWebFormDropDownMenu1Bold`
- `codingAppsWebsiteWebFormDropDownMenuForm3`
- `codingAppsWebsiteWebFormDropDownMenuForm3Bold`
- `codingAppsWebsiteWebFormTextArea1`
- `codingAppsWebsiteWebFormTextArea1Bold`
- `coffeeCold`
- `coffeeColdBold`
- `coffeeEspressoMachine`
- `coffeeEspressoMachineBold`
- `cog`
- `cogBold`
- `cogHandGive1`
- `cogHandGive1Bold`
- `cogSearch1`
- `cogSearch1Bold`
- `coinPurse1`
- `coinPurse1Bold`
- `colorBlind`
- `colorBlindBold`
- `colorBucketBrush`
- `colorBucketBrushBold`
- `colorPalette`
- `colorPalette2`
- `colorPalette2Bold`
- `colorPaletteBold`
- `colorPicker2`
- `colorPicker2Bold`
- `commandButtonKeyboard`
- `commandButtonKeyboardBold`
- `commonFileAdd`
- `commonFileAddBold`
- `commonFileEdit`
- `commonFileEditBold`
- `commonFileGiveHand3`
- `commonFileGiveHand3Bold`
- `commonFileHorizontal`
- `commonFileHorizontalBold`
- `commonFileModule1`
- `commonFileModule1Bold`
- `commonFileStack`
- `commonFileStackBold`
- `commonFileTextAdd`
- `commonFileTextAddBold`
- `commonFileTextClock`
- `commonFileTextClockBold`
- `compass1`
- `compass1Bold`
- `compassDirections`
- `compassDirectionsBold`
- `compositionFocusSquare`
- `compositionFocusSquareBold`
- `compositionWindowMan`
- `compositionWindowManBold`
- `computerChip32`
- `computerChip32Bold`
- `computerChipCore`
- `computerChipCoreBold`
- `computerChipFlash`
- `computerChipFlashBold`
- `concertDj`
- `concertDjBold`
- `concertMicrophone`
- `concertMicrophoneBold`
- `concertRock1`
- `concertRock1Bold`
- `connector1`
- `connector1Bold`
- `contactUsFaq`
- `contactUsFaqBold`
- `contentInkPenWrite`
- `contentInkPenWriteBold`
- `contentPaperEdit`
- `contentPaperEditBold`
- `contentPenWrite`
- `contentPenWriteBold`
- `contentTypingMachine`
- `contentTypingMachine1Bold`
- `controlsCameraOff`
- `controlsCameraOffBold`
- `controlsForward`
- `controlsForwardBold`
- `controlsPause`
- `controlsPauseBold`
- `controlsPrevious`
- `controlsPreviousBold`
- `conversationSync`
- `conversationSyncBold`
- `copyrightAndProtecttion1`
- `copyrightAndProtecttion1Bold`
- `corporateSocialMedia`
- `corporateSocialMediaBold`
- `creditCard1`
- `creditCard1Bold`
- `creditCardVisa`
- `creditCardVisaBold`
- `cryptoChatMobilePhone`
- `cryptoChatMobilePhoneBold`
- `cryptoCurrencyBitcoinChip`
- `cryptoCurrencyBitcoinChipBold`
- `cryptoCurrencyBitcoinCode`
- `cryptoCurrencyBitcoinCodeBold`
- `cryptoCurrencyBitcoinDollarExchange`
- `cryptoCurrencyBitcoinDollarExchangeBold`
- `cryptoCurrencyBitcoinLaptop`
- `cryptoCurrencyBitcoinLaptopBold`
- `cryptoCurrencyBitcoinMonitorMining`
- `cryptoCurrencyBitcoinMonitorMiningBold`
- `cryptoEncryptionKey`
- `cryptoEncryptionKeyBold`
- `css1`
- `css1Bold`
- `curlyBrackets`
- `curlyBracketsBold`
- `currencyEuroCircle`
- `currencyEuroCircleBold`
- `currencyPoundInternational`
- `currencyPoundInternationalBold`
- `currencySignFranc`
- `currencySignFrancBold`
- `currencySignKipsIncrease`
- `currencySignKipsIncreaseBold`
- `currencySignRupeeDecrease`
- `currencySignRupeeDecreaseBold`
- `currencySignWonCoupon`
- `currencySignWonCouponBold`
- `currencyYuanBubble`
- `currencyYuanBubbleBold`
- `cursor`
- `cursorBold`
- `cursorHand2`
- `cursorHand2Bold`
- `cursorSpeed2`
- `cursorSpeed2Bold`
- `cursorTarget1`
- `cursorTarget1Bold`
- `customerRelationshipManagementLeadManagement1`
- `customerRelationshipManagementLeadManagement1Bold`
- `dataFileBarsAdd`
- `dataFileBarsAddBold`
- `dataFileBarsEdit`
- `dataFileBarsEditBold`
- `dataFileGraph`
- `dataFileGraphBold`
- `dataFileSearch`
- `dataFileSearchBold`
- `dataLake1`
- `dataLake1Bold`
- `dataTransferCircle`
- `dataTransferCircleBold`
- `dataTransferDiagonal1`
- `dataTransferDiagonalBold`
- `database1`
- `database1Bold`
- `database2`
- `database2Bold`
- `databaseDisable`
- `databaseDisableBold`
- `databaseShare1`
- `databaseShare1Bold`
- `daySunrise1`
- `daySunrise1Bold`
- `delete`
- `delete2`
- `delete2Bold`
- `deleteBold`
- `deliveryDrone`
- `deliveryDroneBold`
- `deliveryPackagePerson`
- `deliveryPackagePersonBold`
- `deliveryTruckClock`
- `deliveryTruckClockBold`
- `dentalCrown1`
- `dentalCrown1Bold`
- `dentistryToothChipped1`
- `dentistryToothChippedBold`
- `dentistryToothJaws`
- `dentistryToothJawsBold`
- `dentistryToothShield`
- `dentistryToothShieldBold`
- `designDrawingBoard`
- `designDrawingBoardBold`
- `designFileAi1`
- `designFileAiBold`
- `designFileTextImage`
- `designFileTextImageBold`
- `designToolCompass`
- `designToolCompassBold`
- `designToolFibonacci`
- `designToolFibonacciBold`
- `designToolInk`
- `designToolInkBold`
- `designToolMagicWand`
- `designToolMagicWand1Bold`
- `designToolPencilRuler`
- `designToolPencilRulerBold`
- `desktopComputer1`
- `desktopComputer1Bold`
- `desktopMonitorSmiley`
- `desktopMonitorSmileyBold`
- `diagnosticDesktop`
- `diagnosticDesktopBold`
- `diagramArrowDown1`
- `diagramArrowDown1Bold`
- `diagramCurveRiseDash`
- `diagramCurveRiseDashBold`
- `diagramDashCircleLargeHead`
- `diagramDashCircleLargeHeadBold`
- `diagramDashUpThenDown`
- `diagramDashUpThenDownLargeHeadBold`
- `diagramSplitHorizontal`
- `diagramSplitHorizontalBold`
- `diagramUpDouble`
- `diagramUpDoubleBold`
- `dialFinger1`
- `dialFinger1Bold`
- `dialPad`
- `dialPadBold`
- `diamondShine`
- `diamondShineBold`
- `dice`
- `diceBold`
- `directionButton2`
- `directionButton2Bold`
- `directionButton3`
- `directionButton3Bold`
- `disabilityParking`
- `disabilityParkingBold`
- `discount`
- `discountBold`
- `divisionMathSymbolCircle`
- `divisionMathSymbolCircleBold`
- `doctorHomeVisit1`
- `doctorHomeVisit1Bold`
- `documentScanningModeCamera`
- `documentScanningModeCameraBold`
- `downloadBottom`
- `downloadBottomBold`
- `downloadBrackets`
- `drawerEnvelope`
- `drawerEnvelopeBold`
- `drawerSend`
- `drawerSendBold`
- `drawerUpload`
- `drawerUploadBold`
- `dribbbleLogo`
- `dribbbleLogoBold`
- `drugsCannabis`
- `drugsCannabisBold`
- `dualSimSignal4`
- `dualSimSignal4Bold`
- `duplicate`
- `duplicateBold`
- `eCommerceApparel`
- `eCommerceApparelBold`
- `eCommerceShoppingBag`
- `eCommerceShoppingBagBold`
- `eCommerceTouchBuy`
- `eCommerceTouchBuyBold`
- `earpodsEar`
- `earpodsEarBold`
- `earthCash`
- `earthCashBold`
- `earthPin2`
- `earthPin2Bold`
- `earthRefresh`
- `earthRefreshBold`
- `earthSetting`
- `earthSettingBold`
- `earthquakeGlobalSeismicWave`
- `earthquakeGlobalSeismicWaveBold`
- `electronicsCapacitor`
- `electronicsCapacitorBold`
- `electronicsFuse`
- `electronicsFuseBold`
- `electronicsLedLight`
- `electronicsLedLightBold`
- `emailActionAdd`
- `emailActionAddBold`
- `emailActionSearch1`
- `emailActionSearch1Bold`
- `emailActionSubtract`
- `emailActionSubtractBold`
- `emailActionWarning`
- `emailActionWarningBold`
- `emergencyCall`
- `emergencyCallBold`
- `emojiAngryFaceHornsDemon`
- `emojiAngryFaceHornsDemonBold`
- `endPointCircle`
- `endPointCircleBold`
- `engineTemperatureWarning`
- `engineTemperatureWarningBold`
- `engineerProjectSuperviser1`
- `engineerProjectSuperviser1Bold`
- `envelopeLetter`
- `envelopeLetterBold`
- `envelopeSealed`
- `envelopeSealedBold`
- `equalMathSymbolCircle`
- `equalMathSymbolCircleBold`
- `escalatorDescend`
- `escalatorDescendBold`
- `ethernetPort`
- `ethernetPortBold`
- `expand2`
- `expand2Bold`
- `expandFull`
- `expandFullBold`
- `exportFile`
- `exportFileBold`
- `facbookMessengerLogo`
- `faceId1`
- `faceId1Bold`
- `facebookMessengerLogoBold`
- `factoryBuilding1`
- `factoryBuilding1Bold`
- `factoryIndustrialRobotArm1`
- `factoryIndustrialRobotArm1Bold`
- `familyChildPlayBallWarning`
- `familyChildPlayBallWarningBold`
- `fastFoodFrenchFries`
- `fastFoodFrenchFriesBold`
- `favoriteMedical`
- `favoriteMedicalBold`
- `fiberAccess1`
- `fiberAccess1Bold`
- `fieldCornerKick`
- `fieldCornerKickBold`
- `fileCPlusPlus`
- `fileCPlusPlusBold`
- `fileCode`
- `fileCodeBold`
- `fileCodeCheck`
- `fileCodeCheckBold`
- `fileCodeEdit1`
- `fileCodeEdit1Bold`
- `fileHtml`
- `fileHtmlBold`
- `filter1`
- `filter1Bold`
- `filter21Bold`
- `filterSortLinesDescending`
- `filterSortLinesDescendingBold`
- `firework2`
- `firework2Bold`
- `fitbitLogo`
- `fitbitLogoBold`
- `fitnessBicycle1`
- `fitnessBicycle1Bold`
- `fitnessJumpingRope`
- `fitnessJumpingRopeBold`
- `fitnessShaker`
- `fitnessShakerBold`
- `flag`
- `flagBold`
- `flagPlain`
- `flagPlainBold`
- `flashDrive`
- `flashDriveBold`
- `flashOff`
- `flashOffBold`
- `flipVerticalDown`
- `flipVerticalDownBold`
- `floppyDisk1`
- `floppyDisk1Bold`
- `flow1`
- `flow1Bold`
- `flowChartHierachy`
- `flowChartHierachyBold`
- `focusAuto1`
- `focusAuto1Bold`
- `focusM`
- `focusMBold`
- `folderAdd`
- `folderAddBold`
- `folderHold`
- `folderHoldBold`
- `folderShare`
- `folderShareBold`
- `following1`
- `following1Bold`
- `fontSize`
- `fontSizeBold`
- `forbiddenPhoneOff`
- `forbiddenPhoneOffBold`
- `fruitApricot`
- `fruitApricotBold`
- `fruitBanana`
- `fruitBananaBold`
- `fruitWatermelon`
- `fruitWatermelonBold`
- `funnyMask`
- `funnyMaskBold`
- `gamingRibbonFirst`
- `gamingRibbonFirstBold`
- `garbageBin`
- `garbageBinBold`
- `gasF`
- `gasFBold`
- `gateway`
- `gatewayBold`
- `gaugeDashboard`
- `gaugeDashboardBold`
- `genderFemale`
- `genderFemaleBold`
- `genderHetero`
- `genderHeteroBold`
- `gestureDoubleTap`
- `gestureDoubleTapBold`
- `giftBox1`
- `giftBox1Bold`
- `globalBusinessManUser`
- `globalBusinessManUserBold`
- `goBackward30Control`
- `goBackward30ControlBold`
- `goPro`
- `goProBold`
- `goldBars`
- `goldBarsBold`
- `golfBall`
- `golfBallBold`
- `golfHole`
- `golfHoleBold`
- `googleAnalyticsLogo`
- `googleAnalyticsLogoBold`
- `googleAssistantLogo`
- `googleAssistantLogoBold`
- `googleHome2`
- `googleHome2Bold`
- `googleKeepLogo2`
- `googleKeepLogo2Bold`
- `googlePhotosLogo`
- `googlePhotosLogoBold`
- `gradient2`
- `gradient2Bold`
- `graphStatsCircle`
- `graphStatsCircleBold`
- `graphStatsDescend`
- `graphStatsDescendBold`
- `groupRunning`
- `groupRunningBold`
- `gymnasticsRibbonPerson2`
- `gymnasticsRibbonPerson2Bold`
- `hairDressBarber`
- `hairDressBarberBold`
- `hairDressRoundBrush1`
- `hairDressRoundBrush1Bold`
- `hairSkin`
- `hairSkinBold`
- `halloweenCandy`
- `halloweenCandyBold`
- `handDrag`
- `handDragBold`
- `hardDrive1`
- `hardDrive1Bold`
- `harddriveDownload2`
- `harddriveDownload2Bold`
- `hboLogo`
- `hboLogoBold`
- `headphones1`
- `headphones1Bold`
- `headphonesCustomerSupportQuestion`
- `headphonesCustomerSupportQuestionBold`
- `hearingDisability`
- `hearingDisabilityBold`
- `helpQuestionNetwork`
- `helpQuestionNetworkBold`
- `hierarchy5Organize`
- `hierarchy5OrganizeBold`
- `hospitalBuildingPin`
- `hospitalBuildingPinBold`
- `hospitalSign`
- `hospitalSignBold`
- `house1`
- `house4Bold`
- `houseChimney`
- `houseChimneyBold`
- `humanResourcesBusinessman`
- `humanResourcesBusinessmanBold`
- `humanResourcesBusinessmanClock`
- `humanResourcesBusinessmanClockBold`
- `humanResourcesHierarchy1`
- `humanResourcesHierarchy1Bold`
- `humanResourcesNetwork`
- `humanResourcesNetworkBold`
- `humanResourcesRatingWoman`
- `humanResourcesRatingWomanBold`
- `humanResourcesSearchEmployeesBold`
- `humanResourcesSearchMen`
- `humanResourcesWorkflow`
- `humanResourcesWorkflowBold`
- `hydrogen`
- `hydrogenBold`
- `iceCreamCone`
- `iceCreamConeBold`
- `iceWater`
- `iceWaterBold`
- `ideaStrategy`
- `ideaStrategyBold`
- `imageFileEps`
- `imageFileEpsBold`
- `imageFileJpg`
- `imageFileJpgBold`
- `imageFileStar`
- `imageFileStarBold`
- `incognito`
- `incognitoBold`
- `informationCircle`
- `informationCircleBold`
- `informationDeskCustomer`
- `informationDeskCustomerBold`
- `instagramLogo`
- `instagramLogoBold`
- `instrumentClassicalPiano`
- `instrumentClassicalPianoBold`
- `instrumentPanFlute`
- `instrumentPanFluteBold`
- `instrumentTambourine`
- `instrumentTambourineBold`
- `insuranceHand`
- `insuranceHandBold`
- `insuranceHead`
- `insuranceHeadBold`
- `irisScan1`
- `irisScan1Bold`
- `java`
- `javaBold`
- `jobResponsibilityBagHand`
- `jobResponsibilityBagHandBold`
- `jobSearchMan`
- `jobSearchManBold`
- `keyboard`
- `keyboardAsterisk1`
- `keyboardAsterisk1Bold`
- `keyboardBold`
- `keyboardEject`
- `keyboardEjectBold`
- `keyboardOption`
- `keyboardOptionBold`
- `keyboardWireless`
- `keyboardWirelessBold`
- `keyholeSquare`
- `keyholeSquareBold`
- `kickstarterLogo`
- `kickstarterLogoBold`
- `kindleHold`
- `kindleHoldBold`
- `kitchenwareSpatula1`
- `kitchenwareSpatula1Bold`
- `knivesSet`
- `knivesSetBold`
- `labTube`
- `labTubeBold`
- `labTubeExperiment`
- `labTubeExperimentBold`
- `laborHandsAction`
- `laborHandsActionBold`
- `laboratoryDrugFile`
- `laboratoryDrugFileBold`
- `laboratoryTestStool`
- `laboratoryTestStoolBold`
- `laptop`
- `laptopBold`
- `laptopClock`
- `laptopClockBold`
- `laptopDownload`
- `laptopDownloadBold`
- `laptopHelpMessage`
- `laptopHelpMessageBold`
- `laptopSmiley1`
- `laptopSmiley1Bold`
- `laptopWarning`
- `laptopWarningBold`
- `launchGo`
- `launchGoBold`
- `laundryHandWash`
- `laundryHandWashBold`
- `layersStacked`
- `layersStackedBold`
- `layout`
- `layout11`
- `layout11Bold`
- `layoutBold`
- `layoutContent`
- `layoutContentBold`
- `layoutDashboard1`
- `layoutDashboardBold`
- `lensShade`
- `lensShadeBold`
- `lift1`
- `lift1Bold`
- `lightModeBrightDark`
- `lightModeBrightDarkBold`
- `lightModeHdr`
- `lightModeHdrBold`
- `like`
- `likeBold`
- `likeChat`
- `likeChatBold`
- `linkDisconnected`
- `linkDisconnectedBold`
- `listNumbers`
- `listNumbersBold`
- `loading`
- `loadingBold`
- `loadingCircle`
- `loadingCircleBold`
- `locationOffTarget`
- `locationOffTargetBold`
- `lock5`
- `lock5Bold`
- `lockHierarchy`
- `lockHierarchyBold`
- `lockShield`
- `lockShieldBold`
- `lockUnlock4`
- `lockUnlock4Bold`
- `lockerRoomSuitcaseKey`
- `lockerRoomSuitcaseKeyBold`
- `login1`
- `login1Bold`
- `loginKey`
- `loginKeyBold`
- `loveItBreak`
- `loveItBreakBold`
- `loveItFlag`
- `loveItFlagBold`
- `mailboxPost`
- `mailboxPostBold`
- `makeUpLipstick`
- `makeUpLipstick1`
- `makeUpLipstick1Bold`
- `makeUpLipstickBold`
- `makeUpMirror1`
- `makeUpMirror1Bold`
- `maps`
- `mapsBold`
- `martialArtsHelmet`
- `martialArtsHelmetBold`
- `martialArtsSwords`
- `martialArtsSwordsBold`
- `mazeStrategy`
- `mazeStrategyBold`
- `mcafeeLogo`
- `mcafeeLogoBold`
- `medicalAppLaptop1`
- `medicalAppLaptop1Bold`
- `medicalConditionFlu`
- `medicalConditionFluBold`
- `medicalHospital1`
- `medicalHospital1Bold`
- `medicalInstrumentAmbulanceBed`
- `medicalInstrumentAmbulanceBedBold`
- `medicalInstrumentScalpel`
- `medicalInstrumentScalpelBold`
- `medicalInstrumentWalkingAid`
- `medicalInstrumentWalkingAidBold`
- `medicalSpecialtyFeet`
- `medicalSpecialtyFeetBold`
- `medicalSpecialtyKnee1`
- `medicalSpecialtyKnee1Bold`
- `medicalSpecialtyNose`
- `medicalSpecialtyNoseBold`
- `medicalSpecialtyPregnancy`
- `medicalSpecialtyPregnancyBold`
- `medicineSearch4`
- `medicineSearch4Bold`
- `meetingRemote`
- `meetingRemoteBold`
- `megaphone`
- `megaphoneBold`
- `messagesBubbleDisable`
- `messagesBubbleDisableBold`
- `messagesBubbleSquareQuestion`
- `messagesBubbleSquareQuestionBold`
- `messagesBubbleSquareSubtract`
- `messagesBubbleSquareSubtractBold`
- `messagesBubbleSquareTyping`
- `messagesBubbleSquareTypingBold`
- `messagesBubbleText`
- `messagesBubbleTextBold`
- `messagesPeoplePersonBubbleCircle1`
- `messagesPeoplePersonBubbleCircle1Bold`
- `messagesPeopleUserBubbleCircle`
- `messagesPeopleUserBubbleCircleBold`
- `messagesPeopleUserCheck`
- `messagesPeopleUserCheckBold`
- `metaLogo`
- `metaLogoBold`
- `microchipBoard`
- `microchipBoardBold`
- `microphone1`
- `microphone1Bold`
- `microsoftExcelLogo`
- `microsoftExcelLogoBold`
- `microsoftOnedriveLogo2`
- `microsoftOnedriveLogo2Bold`
- `mistSun`
- `mistSunBold`
- `mobilePhoneBlackberry2`
- `mobilePhoneBlackberry2Bold`
- `mobileShoppingCartExchange`
- `mobileShoppingCartExchangeBold`
- `modernMusicDj`
- `modernMusicDjBold`
- `modernMusicElectricGuitar`
- `modernMusicElectricGuitarBold`
- `modernTv4K`
- `modernTv4KBold`
- `modernTvCurvyEdge`
- `modernTvCurvyEdgeBold`
- `modernTvRemoteSmart`
- `modernTvRemoteSmartBold`
- `moduleHandsPuzzle`
- `moduleHandsPuzzleBold`
- `modulePuzzle2`
- `modulePuzzle2Bold`
- `moduleThree`
- `moduleThreeBold`
- `monetizationBillMagnet`
- `monetizationBillMagnetBold`
- `monetizationTablet`
- `monetizationTabletBold`
- `monetizationTouchCoin`
- `monetizationTouchCoinBold`
- `moneyBagDollar`
- `moneyBagDollarBold`
- `moneyWalletOpen`
- `moneyWalletOpenBold`
- `monitor`
- `monitorBold`
- `monitorDownload`
- `monitorDownloadBold`
- `monitorFlash`
- `monitorFlashBold`
- `monitorSync`
- `monitorSyncBold`
- `monitorTransfer1`
- `monitorTransfer1Bold`
- `monitorWarning`
- `monitorWarningBold`
- `mouseSmart`
- `mouseSmartBold`
- `moveDown1`
- `moveDown1Bold`
- `moveExpandVertical`
- `moveExpandVerticalBold`
- `moveToBottom`
- `moveToBottomBold`
- `movieCinemaWatch`
- `movieCinemaWatchBold`
- `moviesReel`
- `moviesReelBold`
- `moviesSitDrink`
- `moviesSitDrinkBold`
- `multipleActionsChat`
- `multipleActionsChatBold`
- `multipleNeutral2`
- `multipleNeutral2Bold`
- `multipleUsers1`
- `multipleUsers1Bold`
- `multipleUsersNetwork`
- `musicOnOff1`
- `musicOnOff1Bold`
- `naturalDisasterFlood`
- `naturalDisasterFloodBold`
- `naturalDisasterHurricane`
- `naturalDisasterHurricaneBold`
- `naturalDisasterVolcanoBold`
- `naturalDisasterVolcanoSmoke`
- `navigationArrowsLeft1`
- `navigationArrowsLeft1Bold`
- `navigationDirectionLeftForward`
- `navigationDirectionLeftForwardBold`
- `navigationMenu1`
- `navigationMenuBold`
- `navigationMenuHorizontal1`
- `navigationMenuHorizontal1Bold`
- `ncContentSign`
- `ncContentSignBold`
- `networkBrowser`
- `networkBrowserBold`
- `networkPin`
- `networkPinBold`
- `networkSearch`
- `networkSearchBold`
- `networkSignal`
- `networkSignalBold`
- `networkUsers`
- `networkUsersBold`
- `networkWarning`
- `networkWarningBold`
- `newspaperFold`
- `newspaperFoldBold`
- `nightClubDiscoBall`
- `nightClubDiscoBallBold`
- `nightMoonBegin`
- `nightMoonBeginBold`
- `nightMoonHalf1`
- `nightMoonHalf1Bold`
- `noGasStation`
- `noGasStationBold`
- `nodesjLogo`
- `nodesjLogoBold`
- `notesBook`
- `notesBookBold`
- `notesBookText`
- `notesBookTextBold`
- `notesChecklistFlip`
- `notesChecklistFlipBold`
- `notesPaperText`
- `notesPaperTextBold`
- `notesTasks`
- `notesTasksBold`
- `notesUpload`
- `notesUploadBold`
- `numberFiveSquare`
- `numberFiveSquareBold`
- `numberNine`
- `numberNineBold`
- `numberSevenCircle`
- `numberSevenCircleBold`
- `numberThree`
- `numberThreeBold`
- `officeBuildingDouble`
- `officeBuildingDoubleBold`
- `officeBuildingTall2`
- `officeBuildingTall2Bold`
- `officeChair`
- `officeChairBold`
- `officeClipper`
- `officeClipperBold`
- `officeDesk2`
- `officeDesk2Bold`
- `officeDrawer`
- `officeDrawerBold`
- `officeEmployee`
- `officeEmployeeBold`
- `officeFileAdobe`
- `officeFileAdobeBold`
- `officeFileGraph`
- `officeFileGraphBold`
- `officeFileText`
- `officeFileTextBold`
- `officeFileXls`
- `officeFileXlsBold`
- `officeShelf1`
- `officeShelf1Bold`
- `officeShredder1`
- `officeShredder1Bold`
- `officeStampDocument`
- `officeStampDocumentBold`
- `optimizationGraph`
- `optimizationGraphBold`
- `optimizationGraphLine`
- `optimizationGraphLineBold`
- `originLogo`
- `originLogoBold`
- `packageDimension`
- `packageDimensionBold`
- `paginateFilter2`
- `panoramic`
- `panoramicBold`
- `paperSizesA3`
- `paperSizesA3Bold`
- `paperWrite`
- `paperWriteBold`
- `paragraphCenterAlign`
- `paragraphCenterAlignBold`
- `paralympicsFootball`
- `paralympicsFootballBold`
- `partyBalloon`
- `partyBalloonBold`
- `partyDecoration`
- `partyDecorationBold`
- `partyMask`
- `partyMaskBold`
- `pastaBowlWarm`
- `pastaBowlWarmBold`
- `pathfinderMinusBack`
- `pathfinderMinusBackBold`
- `pathfinderUnite`
- `pathfinderUniteBold`
- `pcoketLogo`
- `penDraw1`
- `penDraw1Bold`
- `penWrite`
- `penWriteBold`
- `pencil1`
- `pencil1Bold`
- `pencilSketch`
- `pencilSketchBold`
- `performanceIncrease`
- `performanceIncreaseBold`
- `performanceMoneyDecrease`
- `performanceMoneyDecreaseBold`
- `performanceTabletIncrease`
- `performanceTabletIncreaseBold`
- `perspectiveGrid`
- `perspectiveGridBold`
- `petriDish2`
- `petriDish2Bold`
- `phoneActionDataTransfer`
- `phoneActionDataTransfer1Bold`
- `phoneActionLocation`
- `phoneActionLocation1Bold`
- `phoneActionsMerge`
- `phoneActionsMergeBold`
- `phoneActionsRefresh`
- `phoneActionsRefreshBold`
- `phoneCircle`
- `phoneCircleBold`
- `phoneFlashLight`
- `phoneFlashLightBold`
- `phoneMobileDeviceIphoneX2`
- `phoneMobileDeviceIphoneX2Bold`
- `phoneRetro1`
- `phoneRetro1Bold`
- `phoneType`
- `phoneTypeBold`
- `phoneVibrate`
- `phoneVibrateBold`
- `photoChangedFilter`
- `photoChangedFilterBold`
- `photoFrame`
- `photoFrameBold`
- `photographyEquipmentFlashLight`
- `photographyEquipmentFlashLightBold`
- `pictureDoubleLandscape`
- `pictureDoubleLandscapeBold`
- `pictureStackLandscape`
- `pictureStackLandscapeBold`
- `pin2`
- `pin2Alt`
- `pin2AltBold`
- `pin2Bold`
- `pinXMark`
- `pinXMark3Bold`
- `playerPhoneStation1`
- `playerPhoneStation1Bold`
- `playlistDownload`
- `playlistDownloadBold`
- `playlistSongs`
- `playlistSongsBold`
- `plusOneIncrement`
- `plusOneIncrementBold`
- `pocketLogoBold`
- `polygonLasso`
- `polygonLassoBold`
- `powerButton`
- `powerButtonBold`
- `powerOutletTypeB`
- `powerOutletTypeBBold`
- `powerOutletTypeF`
- `powerOutletTypeFBold`
- `powerOutletTypeJ`
- `powerOutletTypeJBold`
- `powerPlugDisconnected`
- `powerPlugDisconnectedBold`
- `pregnancyPregnant`
- `pregnancyPregnantBold`
- `pregnancySperm1`
- `pregnancySperm1Bold`
- `pregnancyVagina`
- `pregnancyVaginaBold`
- `presentationAudience`
- `presentationAudienceBold`
- `presentationBoardGraph`
- `presentationBoardGraphBold`
- `presentationMicrophone`
- `presentationMicrophone1Bold`
- `presentationProjector1`
- `presentationProjector1Bold`
- `presentationProjectorScreenBudgetAnalytics`
- `presentationProjectorScreenBudgetAnalyticsBold`
- `printText`
- `printTextBold`
- `productsGifts`
- `productsGiftsBold`
- `professionsManAstronautBold`
- `profileManCashMessage`
- `profileManCashMessageBold`
- `programmingBook`
- `programmingBookBold`
- `programmingBrowser1`
- `programmingBrowser1Bold`
- `programmingHoldCode2`
- `programmingHoldCode2Bold`
- `programmingLanguageHtml5`
- `programmingLanguageHtml5Bold`
- `programmingLanguageMonitorCss`
- `programmingLanguageMonitorCssBold`
- `programmingUserChat`
- `programmingUserChatBold`
- `publicServiceFirefighterTruck1`
- `publicServiceFirefighterTruck1Bold`
- `radioRetro`
- `radioRetroBold`
- `radioactiveCircle`
- `radioactiveCircleBold`
- `radiologyScanDoctor`
- `radiologyScanDoctorBold`
- `radiologyScanner`
- `radiologyScannerBold`
- `railroadMetro`
- `railroadMetroBold`
- `rainUmbrella1`
- `rainUmbrella1Bold`
- `rainUmbrellaSun`
- `rainUmbrellaSunBold`
- `rankingPeopleFirst`
- `rankingPeopleFirstBold`
- `rankingRibbon1`
- `rankingStarsRibbonBold`
- `ratingStarRibbon`
- `ratingStarRibbonBold`
- `readEmailAt1`
- `readEmailAt1Bold`
- `readEmailMonitor`
- `readEmailMonitorBold`
- `receipt`
- `receiptBold`
- `receiptDollar`
- `receiptDollarBold`
- `reflectDown`
- `reflectDownBold`
- `reflectLeft`
- `reflectLeftBold`
- `remoteAccess`
- `remoteAccessBold`
- `removeBold`
- `removeBoldBold`
- `responsiveDesign`
- `responsiveDesignBold`
- `responsiveDesignHand`
- `responsiveDesignHandBold`
- `rewardStars2`
- `rewardStars2Bold`
- `rewardStars4`
- `rewardStars4Bold`
- `rightClickMouse`
- `rightClickMouseBold`
- `roadSignHairpinTurnLeft`
- `roadSignHairpinTurnLeftBold`
- `roadSignStop`
- `roadSignStopBold`
- `roadSignTurnLeft`
- `roadSignTurnLeftBold`
- `roadStraight`
- `roadStraightBold`
- `roadTunnel`
- `roadTunnelBold`
- `routerSignal`
- `routerSignalBold`
- `rssFeed`
- `rssFeedBold`
- `safety911`
- `safety911Bold`
- `safetyDrownHand`
- `safetyDrownHandBold`
- `safetyFlameRight`
- `safetyFlameRightBold`
- `safetyFloat`
- `safetyFloatBold`
- `safetyWarningRadioactive`
- `safetyWarningRadioactiveBold`
- `satellite`
- `satelliteBold`
- `savingBank1`
- `savingBank1Bold`
- `savingBankInternational`
- `savingBankInternationalBold`
- `savingDogGuardDecrease`
- `savingDogGuardDecreaseBold`
- `savingMoneyFlower`
- `savingMoneyFlowerBold`
- `scanner`
- `scannerBold`
- `scienceMolecule`
- `scienceMoleculeBold`
- `scienceMoleculeStrucutre`
- `scienceMoleculeStrucutreBold`
- `scissors2`
- `scissors2Bold`
- `scooter3`
- `scooter3Bold`
- `scooterFast`
- `scooterFastBold`
- `screen`
- `screenBold`
- `screenCurved`
- `screenCurvedBold`
- `scrollVertical`
- `scrollVerticalBold`
- `sdCardDownload`
- `sdCardDownloadBold`
- `sdCardSync`
- `sdCardSyncBold`
- `seafoodSquid`
- `seafoodSquidBold`
- `seafoodSushi`
- `seafoodSushiBold`
- `sealShape`
- `sealShapeBold`
- `searchCircle`
- `searchCircleAlternateBold`
- `seasoningFood`
- `seasoningFoodBold`
- `selfPaymentTouchEuro`
- `selfPaymentTouchEuroBold`
- `sendEmailEnvelope`
- `sendEmailEnvelopeBold`
- `sendEmailFly`
- `sendEmailFlyBold`
- `seoSearchGraph`
- `seoSearchGraphBold`
- `serverAdd`
- `serverAddBold`
- `serverRefresh1`
- `serverRefresh1Bold`
- `serverShare`
- `serverShareBold`
- `serverStar1`
- `serverStar1Bold`
- `settingsSliderDesktopHorizontal`
- `settingsSliderDesktopHorizontalBold`
- `shapeCube`
- `shapeCubeBold`
- `shapes`
- `shapesBold`
- `share`
- `share2`
- `share2Bold`
- `shareBold`
- `shareLocationHand1`
- `shareLocationHandBold`
- `shieldCheck1`
- `shieldCheck1Bold`
- `shipment`
- `shipmentBarcode`
- `shipmentBarcodeBold`
- `shipmentBold`
- `shipmentCargoBoat`
- `shipmentCargoBoatBold`
- `shipmentClock`
- `shipmentClockBold`
- `shipmentCrack`
- `shipmentCrackBold`
- `shipmentOnlineMonitor1`
- `shipmentOnlineMonitor1Bold`
- `shipmentSearch`
- `shipmentSearchBold`
- `shipmentStar`
- `shipmentStarBold`
- `shipmentTouch`
- `shipmentTouchBold`
- `shipmentUploadInformation`
- `shipmentUploadInformationBold`
- `shippingLogisticDamagedPackage`
- `shippingLogisticDamagedPackageBold`
- `shippingLogisticFreeShippingDeliveryTruck`
- `shippingLogisticFreeShippingDeliveryTruckBold`
- `shippingTruckStyle2`
- `shippingTruckStyle2Bold`
- `shootingRiflePersonAim`
- `shootingRiflePersonAimBold`
- `shopLike`
- `shopLikeBold`
- `shopSale1`
- `shopSale1Bold`
- `shopSignBag`
- `shopSignBagBold`
- `shopSignOpen`
- `shopSignOpenBold`
- `shoppingAdvertisingAudienceTargerUser`
- `shoppingAdvertisingAudienceTargerUserBold`
- `shoppingBagCheck`
- `shoppingBagCheckBold`
- `shoppingBagDutyFree`
- `shoppingBagDutyFreeBold`
- `shoppingBasket1`
- `shoppingBasket1Bold`
- `shoppingBasketStar`
- `shoppingBasketStarBold`
- `shoppingBroadcastAdvertisingMonitorMegaphone`
- `shoppingBroadcastAdvertisingMonitorMegaphoneBold`
- `shoppingCartDownload`
- `shoppingCartFull`
- `shoppingCartFullBold`
- `shoppingCartUploadBold`
- `showTheaterMaskHappy`
- `showTheaterMaskHappyBold`
- `showTheaterMasks`
- `showTheaterMasksBold`
- `shrink`
- `shrinkBold`
- `sidebarLineLeft`
- `sidebarLineLeftBold`
- `signBadgeBadge1`
- `signBadgeBadge1Bold`
- `singleManFocus`
- `singleManFocusBold`
- `singleManVintageTv`
- `singleManVintageTvBold`
- `singleNeutralActionsCheck1Bold`
- `singleNeutralActionsCheck2`
- `singleNeutralActionsEdit1`
- `singleNeutralActionsEdit2Bold`
- `singleNeutralActionsRemove`
- `singleNeutralActionsRemoveBold`
- `singleNeutralCircle`
- `singleNeutralCircleBold`
- `singleNeutralFolderBox`
- `singleNeutralFolderBoxBold`
- `singleNeutralMonitor`
- `singleNeutralMonitorBold`
- `singleWoman`
- `singleWomanBold`
- `singleWomanBook`
- `singleWomanBookBold`
- `singleWomanHome`
- `singleWomanHomeBold`
- `skateboardPerson`
- `skateboardPersonBold`
- `skating1`
- `skating1Bold`
- `skiingSnowScooterPerson`
- `skiingSnowScooterPersonBold`
- `skull1`
- `skull1Bold`
- `skypeLogo`
- `skypeLogoBold`
- `sleepZzz`
- `sleepZzzBold`
- `smallOfficeBriefcase`
- `smallOfficeBriefcaseBold`
- `smartToilet`
- `smartToiletBold`
- `smartTvAndPhone`
- `smartTvAndPhoneBold`
- `smartWatchCircle`
- `smartWatchCirleBold`
- `smartWatchSquareDownload`
- `smartWatchSquareDownloadBold`
- `smartWatchSquareHeart`
- `smartWatchSquareHeartBold`
- `smartWatchSquareLocation`
- `smartWatchSquareLocationBold`
- `smartWatchSquarePower`
- `smartWatchSquarePowerBold`
- `smileyBad`
- `smileyBadBold`
- `smileyCheerful`
- `smileyCheerfulBold`
- `smileyDevastated1`
- `smileyDevastated1Bold`
- `smileyHappy`
- `smileyHappyBold`
- `smileyLolSideways`
- `smileyLolSidewaysBold`
- `smileySad1`
- `smileySad1Bold`
- `smileySmile1`
- `smileySmile1Bold`
- `smileyUnhappy`
- `smileyUnhappyBold`
- `smileyWrong`
- `smileyWrongBold`
- `snapchatLogo`
- `snapchatLogoBold`
- `soccerField`
- `soccerFieldBold`
- `softDrinksBottle1`
- `softDrinksBottle1Bold`
- `sosSign`
- `sosSignBold`
- `soundcloudLogo`
- `soundcloudLogoBold`
- `spaceAstronautAlternate`
- `spaceRocketEarth`
- `spaceRocketEarthBold`
- `spaceship`
- `spaceshipBold`
- `speaker1`
- `speaker1Bold`
- `spiralShape`
- `spiralShapeBold`
- `stairsDescend`
- `stairsDescendBold`
- `stampsImage`
- `stampsImageBold`
- `startupProductRocketBox`
- `startupProductRocketBoxBold`
- `stopwatch`
- `stopwatchBold`
- `stoveInductionPot`
- `stoveInductionPotBold`
- `styleOnePinCheck`
- `styleOnePinCheckBold`
- `styleOnePinPlane`
- `styleOnePinPlaneBold`
- `styleOnePinStar`
- `styleOnePinStarBold`
- `styleThreePinBaseball`
- `styleThreePinBaseballBold`
- `styleThreePinGear`
- `styleThreePinPoliceBadgeBold`
- `styleTwoPinHome`
- `styleTwoPinHomeBold`
- `subtitles`
- `subtitlesBold`
- `subtractCircle`
- `subtractCircleBold`
- `sudoku`
- `sudokuBold`
- `swapCamera`
- `swapCameraBold`
- `swimmingDiving`
- `swimmingDivingBold`
- `swimmingPoolStairs`
- `swimmingPoolStairsBold`
- `switchAccount1`
- `switchAccount1Bold`
- `synchronizeArrowsLock`
- `synchronizeArrowsLockBold`
- `synchronizeArrowsThree`
- `synchronizeArrowsThreeBold`
- `synchronizeRefreshArrow`
- `synchronizeRefreshArrowBold`
- `tablet`
- `tabletBold`
- `tagDollar`
- `tagDollarBold`
- `tags1`
- `tags1Bold`
- `tagsFavorite`
- `tagsFavoriteBold`
- `tagsRefresh`
- `tagsRefreshBold`
- `takingPicturesCameras`
- `takingPicturesCamerasBold`
- `targetCenterMonitor`
- `targetCenterMonitorBold`
- `taskFingerShow`
- `taskFingerShowBold`
- `taskListApprove`
- `taskListApproveBold`
- `taskListCheck`
- `taskListPin`
- `taskListPinBold`
- `taskListToDoBold`
- `taxi`
- `taxiBold`
- `teaPot`
- `teaPotBold`
- `teamMeeting`
- `teamMeetingBold`
- `technologyDeviceWearableSmartWatch1`
- `technologyDeviceWearableSmartWatch1Bold`
- `technologyDeviceWearableSmartWatchCircleApp1`
- `technologyDeviceWearableSmartWatchCircleApp1Bold`
- `technologyDeviceWearableSmartWatchCircleApp2`
- `technologyDeviceWearableSmartWatchCircleApp2Bold`
- `technologyDeviceWearableSmartWatchSquare2`
- `technologyDeviceWearableSmartWatchSquare2Bold`
- `tedLogo`
- `tedLogoBold`
- `temperatureCelsius`
- `temperatureCelsiusBold`
- `temperatureThermometerHigh`
- `temperatureThermometerHighBold`
- `temperatureThermometerMedium`
- `temperatureThermometerMediumBold`
- `temperatureThermometerUp`
- `temperatureThermometerUpBold`
- `textFormatDotttedUnderline`
- `textFormatDotttedUnderlineBold`
- `textImageLeft`
- `textImageLeftBold`
- `textUnderline`
- `textUnderlineBold`
- `ticket1`
- `ticket1Bold`
- `ticketAdd`
- `ticketAddBold`
- `timeClockCircle`
- `timeClockCircleBold`
- `timeClockFire`
- `timeClockFireBold`
- `timeClockHand1`
- `timeClockHand1Bold`
- `timeDaily1`
- `timeDaily1Bold`
- `timer10`
- `timer10Bold`
- `toggleSettingOn`
- `toggleSettingOnBold`
- `toolBox`
- `toolBoxBold`
- `toolsKitchenScale`
- `toolsKitchenScaleBold`
- `touchId`
- `touchIdBold`
- `touchUp1`
- `touchUp1Bold`
- `tracking`
- `trackingBold`
- `tradingPatternUp`
- `tradingPatternUpBold`
- `treasureChest`
- `treasureChestBold`
- `trendsTorch`
- `trendsTorchBold`
- `tripPinMultiple`
- `tripPinMultipleBold`
- `tripRoad`
- `tripRoadBold`
- `tripadvisorLogo`
- `tripadvisorLogoBold`
- `truck2`
- `truck2Bold`
- `truckEmpty1`
- `truckEmpty1Bold`
- `tukTuk`
- `tukTukBold`
- `ubuntuLogo`
- `ubuntuLogoBold`
- `unprotect`
- `unprotectBold`
- `unsplashLogo`
- `unsplashLogoBold`
- `uploadBracketsBold`
- `uploadCircle`
- `uploadCircleBold`
- `uploadSquare`
- `uploadSquare1Bold`
- `usbCable`
- `usbCableBold`
- `usbPort1`
- `usbPort1Bold`
- `userCashScale`
- `userCashScaleBold`
- `userMultipleMaleFemale`
- `userMultipleMaleFemaleBold`
- `userNetwork`
- `userNetworkBold`
- `userQuestion`
- `userQuestionBold`
- `userSignal1`
- `userSignal1Bold`
- `vectorsAnchorRectangle`
- `vectorsAnchorRectangleBold`
- `vectorsPenAdd1`
- `vectorsPenAdd1Bold`
- `vegetableOnion`
- `vegetableOnionBold`
- `videoCall`
- `videoCallBold`
- `videoEditCut`
- `videoEditCutBold`
- `videoEditMagicWand`
- `videoEditMagicWandBold`
- `videoFileDownload`
- `videoFileDownloadBold`
- `videoFileM4V`
- `videoFileM4VBold`
- `videoFileStar`
- `videoFileStarBold`
- `videoPlayerAlbum`
- `videoPlayerAlbumBold`
- `videoPlayerLaptop`
- `videoPlayerLaptopBold`
- `videoPlayerMovie`
- `videoPlayerMovieBold`
- `videoPlayerSlider`
- `videoPlayerSliderBold`
- `viewSquare`
- `viewSquareBold`
- `vintageTv1`
- `vintageTv4Bold`
- `vinylRecordPlayer`
- `vinylRecordPlayerBold`
- `vipCrownQueen1`
- `vipCrownQueen1Bold`
- `virtualCoinCryptoDigibyte`
- `virtualCoinCryptoDigibyteBold`
- `virtualCoinCryptoEthereum`
- `virtualCoinCryptoEthereumBold`
- `virtualCoinCryptoNamecoin`
- `virtualCoinCryptoNamecoinBold`
- `virtualCoinCryptoStellar`
- `virtualCoinCryptoStellarBold`
- `vlcLogo`
- `vlcLogoBold`
- `voiceId`
- `voiceIdApproved`
- `voiceIdApprovedBold`
- `voiceIdBold`
- `volleyballBall`
- `volleyballBallBold`
- `volleyballNet`
- `volleyballNetBold`
- `volumeControlMute1`
- `volumeControlRemove1Bold`
- `volumeControlUp1`
- `volumeControlUp3Bold`
- `volumeControlWarning`
- `volumeControlWarningBold`
- `vpnOnCircle`
- `vpnOnCircleBold`
- `vpnShield`
- `vpnShieldBold`
- `walking1`
- `walking1Bold`
- `walkmanHeadphones`
- `walkmanHeadphonesBold`
- `warehouseCartPackageRibbon`
- `warehouseCartPackageRibbonBold`
- `warehouseCartPackages2`
- `warehouseCartPackages2Bold`
- `warehouseStorage2`
- `warehouseStorage2Bold`
- `warpRise`
- `warpRiseBold`
- `washingHand`
- `washingHandBold`
- `waterBottle1`
- `waterBottleGlassBold`
- `waterFountainJet`
- `waterFountainJetBold`
- `waterStraw`
- `waterStrawBold`
- `weatherCloudSnowThunder`
- `weatherCloudSnowThunderBold`
- `weatherSun`
- `weatherSunBold`
- `weatherWindFlow6`
- `weatherWindFlow6Bold`
- `webHook`
- `webHookBold`
- `webcam2`
- `webcam2Bold`
- `wechatPayLogo`
- `wechatPayLogoBold`
- `wifiAlertAttention`
- `wifiAlertAttentionBold`
- `wifiLaptop1`
- `wifiLaptopBold`
- `wifiOff`
- `wifiOffBold`
- `wifiSignal2`
- `wifiSignal2Bold`
- `wifiSignal4`
- `wifiSignal4Bold`
- `windVelocityMeasure`
- `windVelocityMeasureBold`
- `wineBarrel1`
- `wineBarrel1Bold`
- `wordpressLogo1`
- `wordpressLogo1Bold`
- `workFromHomeLaptopMeeting`
- `workFromHomeLaptopMeetingBold`
- `workFromHomeUserPetCat`
- `workFromHomeUserPetCatBold`
- `workFromHomeUserSofa`
- `workFromHomeUserSofaBold`
- `workflowExitDoor`
- `workflowExitDoorBold`
- `workflowTeamworkFistbump2`
- `workflowTeamworkFistbump2Bold`
- `workflowTeamworkUserHighFive`
- `workflowTeamworkUserHighFiveBold`
- `worldCross`
- `worldCrossBold`
- `wrestlingMask1`
- `wrestlingMask1Bold`
- `yogaBackStretch1`
- `yogaBackStretch1Bold`
- `yogaBridgePose2`
- `yogaBridgePose2Bold`
- `yogaHalfMoonPose1`
- `yogaHalfMoonPose1Bold`
- `zipFileCheck`
- `zipFileCheckBold`
- `zipFileCompress`
- `zipFileCompressBold`
- `zoomInPage`
- `zoomInPageBold`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><A11yAccessibilityDisabilityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><A11yAccessibilityDisabilityBoldIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AbTestingMonitorsIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AbTestingMonitorsBoldIcon size="20" class="nav-icon" /> Settings</a>
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
<A11yAccessibilityDisabilityIcon
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
    <A11yAccessibilityDisabilityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <A11yAccessibilityDisabilityBoldIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AbTestingMonitorsIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <A11yAccessibilityDisabilityIcon size="24" />
   <A11yAccessibilityDisabilityBoldIcon size="24" color="#4a90e2" />
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
   <A11yAccessibilityDisabilityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <A11yAccessibilityDisabilityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <A11yAccessibilityDisabilityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { a11yAccessibilityDisability } from '@stacksjs/iconify-streamline-ultimate'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(a11yAccessibilityDisability, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { a11yAccessibilityDisability } from '@stacksjs/iconify-streamline-ultimate'

// Icons are typed as IconData
const myIcon: IconData = a11yAccessibilityDisability
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-ultimate/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-ultimate/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
