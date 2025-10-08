# Ultimate color icons

> Ultimate color icons icons for stx from Iconify

## Overview

This package provides access to 998 icons from the Ultimate color icons collection through the stx iconify integration.

**Collection ID:** `streamline-ultimate-color`
**Total Icons:** 998
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-ultimate-color
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AbTestingMonitorsIcon height="1em" />
<AbTestingMonitorsIcon width="1em" height="1em" />
<AbTestingMonitorsIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AbTestingMonitorsIcon size="24" />
<AbTestingMonitorsIcon size="1em" />

<!-- Using width and height -->
<AbTestingMonitorsIcon width="24" height="32" />

<!-- With color -->
<AbTestingMonitorsIcon size="24" color="red" />
<AbTestingMonitorsIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AbTestingMonitorsIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AbTestingMonitorsIcon
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
    <AbTestingMonitorsIcon size="24" />
    <AccountingBillStack1Icon size="24" color="#4a90e2" />
    <AccountingCalculator1Icon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { abTestingMonitors, accountingBillStack1, accountingCalculator1 } from '@stacksjs/iconify-streamline-ultimate-color'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abTestingMonitors, { size: 24 })
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

```html
<!-- Via color property -->
<AbTestingMonitorsIcon size="24" color="red" />
<AbTestingMonitorsIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AbTestingMonitorsIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AbTestingMonitorsIcon size="24" class="text-primary" />
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
<AbTestingMonitorsIcon height="1em" />
<AbTestingMonitorsIcon width="1em" height="1em" />
<AbTestingMonitorsIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AbTestingMonitorsIcon size="24" />
<AbTestingMonitorsIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineUltimateColor-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AbTestingMonitorsIcon class="streamlineUltimateColor-icon" />
```

## Available Icons

This package contains **998** icons:

- `abTestingMonitors`
- `accountingBillStack1`
- `accountingCalculator1`
- `accountingCoins`
- `addCircleBold`
- `adobeLogo`
- `adsWindow`
- `adventureCarTruck1`
- `aircraftChopper1`
- `aircraftHotAirBalloon2`
- `airplaneMode`
- `alarmBellCheck1`
- `alarmBellRing`
- `alarmBellSleep1`
- `alignCenter`
- `alignMiddle`
- `alignTop`
- `allowancesNoPhotos`
- `allowancesNoTalking`
- `allowancesSmoking`
- `amazonLogo1`
- `amazonWebServicesLogo`
- `ambulanceCall`
- `americanFootballHelmet`
- `amusementParkBalloon`
- `amusementParkCastle`
- `amusementParkElectricCars`
- `amusementParkFerrisWheel`
- `analyticsBars3d`
- `analyticsBoardGraphLine`
- `analyticsGraphLines`
- `analyticsMountain`
- `analyticsNet`
- `analyticsPie2`
- `android1`
- `animalProductsEgg`
- `antenna`
- `appWindowBookmark`
- `appWindowClock`
- `appWindowCloud`
- `appWindowCode`
- `appWindowPieChart`
- `appWindowText`
- `appWindowTwo`
- `appleLogo`
- `archiveBooks`
- `archiveLocker`
- `arrangeLetter`
- `arrangeNumber`
- `arrowButtonCircleLeft`
- `arrowButtonRight1`
- `arrowButtonUp`
- `arrowDotCornerLeft1`
- `arrowDoubleDown1`
- `arrowDoubleUp`
- `arrowDown2`
- `arrowRectangleDown2`
- `arrowRight`
- `arrowThickCircleLeft1`
- `arrowThickLeft3`
- `arrowThickRightBottomCorner3`
- `arrowThickUp4`
- `astronomyPlanetRing`
- `athleticsJavelinThrowing`
- `athleticsRunning1`
- `athleticsTeamRunning`
- `atiLogo`
- `attachment`
- `audioFile`
- `audioFileMp3`
- `audioFileSync`
- `awardBadgeStar`
- `awardMedal4`
- `awardRibbonStar1`
- `awardTrophy1`
- `bandageLeg`
- `barbecueGrill`
- `barcode`
- `baseballBatBall`
- `beaconWirelessRemote`
- `beerGlass`
- `beerOpener1`
- `behanceLogo1`
- `bicycle`
- `bin1`
- `bingLogo`
- `binocular`
- `blackberryLogo`
- `bloggerLogo`
- `bloodDrop`
- `bloodDropsPositive`
- `bluetoothTransfer`
- `boardGameDice1`
- `boardGameDice2`
- `boardGameJenga`
- `boardGameLudo`
- `bodyCareCream`
- `bookBookPages`
- `bookCloseBookmark1`
- `bookOpenBookmark`
- `bookSearch`
- `bookStar`
- `bookmarksDocument`
- `bowlingSet`
- `boxingBagHanging`
- `boxingHeadGuard`
- `breadLoaf`
- `brightness`
- `browserCom`
- `browserPageLayout`
- `browserPageMedia`
- `building2`
- `bus1`
- `businessBigSmallFish`
- `businessContractGive`
- `businessDealCash2`
- `businessDealHandshake1`
- `businessLuckyCat`
- `businessPearl`
- `businessRabbitHat1`
- `businessTeamGoal`
- `buttonFastForward1`
- `buttonLoop`
- `buttonPlay1`
- `buttonStop`
- `buttonZigzag1`
- `calendar1`
- `calendarDate`
- `calendarEdit1`
- `cameraDisplay`
- `cameraSettingsFlip1`
- `cameraSmall`
- `cameraTripod`
- `caps`
- `car4`
- `carActionsCheck1`
- `carDashboardLights`
- `carDashboardSpeed`
- `carDashboardWarning`
- `carDashboardWindowRear`
- `carRepairEngine`
- `carRepairFluid1`
- `carRetro`
- `carToolJumperCables`
- `cardGameCards`
- `cardGameHeart`
- `cashBriefcase`
- `cashNetwork`
- `cashPaymentBill`
- `cashPaymentBills1`
- `cashPaymentCoinDollar`
- `cashPaymentSign2`
- `cashSearch`
- `casinoChip5`
- `casinoLucky7`
- `cdBroken`
- `cellBorderFrame`
- `cellularNetworkLte`
- `cellularNetworkWifi3g`
- `certifiedDiploma`
- `champagneCooler`
- `charger1`
- `chargingBatteryEmpty`
- `chargingBatteryMedium1`
- `chargingFlashWifi`
- `check`
- `checkBadge`
- `checkButton`
- `checkSquare`
- `checklist`
- `chefGearGloves`
- `chessKnight`
- `circusClown1`
- `circusElephant`
- `circusTent`
- `cloudAdd`
- `cloudDataTransfer`
- `cloudFile`
- `cloudLoading`
- `cloudWarning`
- `cocktailGlass1`
- `coffeeCold`
- `coffeeEspressoMachine`
- `cog`
- `cogHandGive1`
- `cogSearch1`
- `coinPurse1`
- `colorBucketBrush`
- `colorPalette`
- `colorPalette2`
- `colorPaletteSample1`
- `colorPicker2`
- `commonFileAdd`
- `commonFileEdit`
- `commonFileHorizontal`
- `commonFileShare`
- `commonFileStack`
- `commonFileText`
- `commonFileUpload`
- `compass1`
- `compassDirections`
- `compositionFocusSquare`
- `compositionWindowHuman`
- `computerChip32`
- `computerChipCore`
- `computerChipFlash`
- `concertDj`
- `concertMicrophone`
- `concertRock1`
- `connector1`
- `contactlessPayment`
- `contentInkPenWrite`
- `contentPaperEdit`
- `contentPenWrite2`
- `contentTypingMachine1`
- `controlsCameraOff`
- `controlsForward`
- `controlsPause`
- `controlsPrevious`
- `conversationSync`
- `copyPaste1`
- `creditCard1`
- `creditCardSmartphoneExchange`
- `creditCardVisa`
- `cryptoCurrencyBitcoinBill`
- `cryptoCurrencyBitcoinChip`
- `cryptoCurrencyBitcoinCircle`
- `cryptoCurrencyBitcoinCode`
- `cryptoCurrencyBitcoinDollarExchange`
- `cryptoCurrencyBitcoinLaptop`
- `cryptoCurrencyBitcoinLock`
- `cryptoCurrencyBitcoinMonitorMining`
- `cryptoCurrencyBitcoinSmartphone`
- `cryptoCurrencyLitecoin`
- `cryptoCurrencyNamecoin`
- `cryptoCurrencyRipple`
- `currencyEuroCircle`
- `currencyPound`
- `currencyPoundDecrease`
- `currencyPoundIncrease`
- `currencyPoundInternational`
- `currencyYuanBubble`
- `cursor`
- `cursorDouble`
- `cursorHand2`
- `cursorTarget1`
- `dataFileBarsAdd`
- `dataFileBarsEdit`
- `dataFileGraph`
- `dataFileSearch`
- `dataTransferCircle`
- `dataTransferDiagonal`
- `dataTransferVertical`
- `database1`
- `database2`
- `databaseConnect`
- `databaseDisable`
- `databaseHierarchy`
- `databaseShare1`
- `daySunrise1`
- `daySunrise2`
- `delete`
- `delete2`
- `deliveryDrone`
- `deliveryPackagePerson`
- `deliveryTruck3`
- `deliveryTruckCargo`
- `deliveryTruckClock`
- `dentistryTooth`
- `dentistryToothChipped`
- `dentistryToothJaws`
- `dentistryToothShield`
- `designDrawingBoard`
- `designFileAi`
- `designFilePen`
- `designFileText`
- `designToolCompass`
- `designToolFibonacci`
- `designToolInk`
- `designToolMagicWand`
- `designToolPencilRuler`
- `desktopComputerPc`
- `desktopMonitorSmiley`
- `deviantArtLogo1`
- `diagramArrowDown1`
- `diagramCurveRiseDash`
- `diagramCurveUp`
- `diagramDashCircle`
- `diagramSplitHorizontal`
- `diagramUpDouble`
- `diagramUpThenDown`
- `dialFinger1`
- `dialPad`
- `diamondShine`
- `directionButton2`
- `directionButton3`
- `disabilityWheelchair`
- `discount`
- `discountDollarDash`
- `downloadBottom`
- `drawerEnvelope`
- `drawerSend`
- `drawerUpload`
- `dribbbleLogo`
- `dropboxLogo`
- `drugsCannabis`
- `drugsSheet`
- `eCommerceApparel`
- `eCommerceShoppingBag`
- `eCommerceTouchBuy`
- `eaLogo`
- `earpodsEar`
- `earthCash`
- `earthPin2`
- `earthRefresh`
- `earthSetting`
- `electronicsCapacitor`
- `electronicsFuse`
- `electronicsLedLight`
- `emailActionAdd`
- `emailActionRemove`
- `emailActionSearch1`
- `emailActionSubtract`
- `envelopeBackFront`
- `envelopeLetter`
- `escalatorDescend`
- `ethernetPort`
- `expand`
- `expand2`
- `faceId1`
- `facebookLogo`
- `familyChildPlayBallWarning`
- `farmersMarketKiosk1`
- `fastFoodFrenchFries`
- `fileApk`
- `fileCPlusPlus`
- `fileCode`
- `fileCode1`
- `fileCodeCheck`
- `fileCodeEdit`
- `fileCodeWarning`
- `fileCopyrightEqual`
- `fileCopyrightTm`
- `fileCss`
- `fileHtml`
- `fileJava`
- `filter1`
- `filterText`
- `fireworksStick`
- `fitbitLogo`
- `fitnessBicycle1`
- `fitnessJumpingRope`
- `fitnessShaker`
- `flag`
- `flagPlain`
- `flashDrive`
- `flashOff`
- `flipVerticalDown`
- `floppyDisk2`
- `focusAuto1`
- `focusM`
- `folderAdd`
- `folderShare`
- `folderUpload`
- `fontSize`
- `forbiddenPhoneOff1`
- `fruitBanana`
- `fruitCherry`
- `fruitWatermelon`
- `gamingRibbonFirst`
- `garbageBin`
- `gasE`
- `gasF`
- `gaugeDashboard`
- `genderFemale`
- `genderHetero`
- `gestureDoubleTap`
- `giftBox1`
- `githubLogo1`
- `goPro`
- `goldBars`
- `golfBall`
- `golfHole`
- `googleDriveLogo`
- `googleLogo`
- `graphStatsCircle`
- `graphStatsDescend`
- `graphicTabletDraw`
- `gridGuides`
- `gymnasticsAcrobatic1`
- `gymnasticsRibbonPerson2`
- `hairDressBarber`
- `hairDressRoundBrush`
- `hairSkin`
- `handDrag1`
- `hardDrive1`
- `harddriveDownload2`
- `headphones1`
- `headphonesCustomerSupportQuestion`
- `helpQuestionNetwork`
- `hierarchy`
- `hierarchy3`
- `hierarchy5`
- `hospitalBuilding`
- `hospitalHouse`
- `hospitalSign`
- `house4`
- `houseChimney`
- `houseSignal`
- `humanResourcesBusinessman`
- `humanResourcesBusinessmanClock`
- `humanResourcesHierarchy1`
- `humanResourcesHierarchyMan`
- `humanResourcesRatingWoman`
- `humanResourcesSearchMen`
- `humanResourcesTeamSettings`
- `humanResourcesWorkflow`
- `iceCreamCone`
- `iceWater`
- `ideaStrategy`
- `imageFileCamera`
- `imageFileEps`
- `imageFileJpg`
- `imageFileStar`
- `imdbLogo`
- `indentLeft`
- `informationCircle`
- `informationDeskCustomer`
- `instagramLogo`
- `instrumentClassicalPiano`
- `instrumentPanFlute`
- `instrumentTambourine`
- `insuranceHand`
- `insuranceHead`
- `irisScan1`
- `jobSeachWoman`
- `keyboard`
- `keyboardAsterisk3`
- `keyboardCommand`
- `keyboardEject`
- `keyboardOption`
- `keyboardWireless`
- `keyholeSquare`
- `kindleHold`
- `kitchenwareSpatula1`
- `knivesSet`
- `labFlaskExperiment`
- `labTube`
- `labTubeExperiment`
- `laboratorySperm`
- `laboratoryTestStool`
- `laptop`
- `laptopClock`
- `laptopDownload`
- `laptopHelpMessage`
- `laptopSmiley1`
- `laptopUser`
- `laptopWarning`
- `launchGo`
- `laundryHandWash`
- `layersStacked`
- `layout`
- `layout3`
- `layoutContent`
- `layoutDashboard`
- `layoutLeft`
- `lensShade`
- `lift1`
- `lightModeBrightDark`
- `lightModeHdr`
- `like`
- `likeChat`
- `likePlusOne`
- `lineAppLogo`
- `linkBroken1`
- `linkedinLogo`
- `listNumbers`
- `loading`
- `loadingHalf`
- `locationOffTarget`
- `lockHierarchy`
- `lockShield`
- `lockUnlock4`
- `lockerRoomSuitcaseKey`
- `lockerRoomWashHands`
- `login1`
- `loginKey`
- `loveItBreak`
- `loveItFlag`
- `mailboxPost`
- `makeUpLipstick`
- `makeUpLipstick1`
- `makeUpMirror1`
- `maps`
- `martialArtsHelmet`
- `martialArtsSwords`
- `mazeStrategy`
- `medicalAppLaptop1`
- `medicalAppSmartphoneListen`
- `medicalConditionFlu`
- `medicalFile`
- `medicalHospital`
- `medicalHospital1`
- `medicalInstrumentAmbulanceBed`
- `medicalInstrumentScalpel`
- `medicalInstrumentWalkingAid`
- `medicalNotes`
- `medicalSpecialtyBack`
- `medicalSpecialtyFeet`
- `medicalSpecialtyHearing1`
- `medicalSpecialtyKnee1`
- `medicalSpecialtyNose`
- `medicalSpecialtyPregnancy`
- `mediumNewLogo`
- `meetingRemote`
- `megaphone`
- `messagesBubbleDisable`
- `messagesBubbleSquareQuestion`
- `messagesBubbleSquareSubtract`
- `messagesBubbleSquareTyping1`
- `messagesBubbleText`
- `messagesLogo`
- `messagesPeoplePersonBubbleCircle1`
- `messagesPeopleUserBubbleCircle`
- `messagesPeopleUserCheck`
- `microchipBoard`
- `microphone1`
- `microsoftLogo`
- `mobilePhoneBlackberry2`
- `mobileShoppingCartExchange`
- `modernMusicDj`
- `modernMusicElectricGuitar`
- `modernTv4k`
- `modernTvCurvyEdge`
- `modernTvRemote`
- `modernTvRemoteSmart`
- `module`
- `moduleFour`
- `moduleHandsPuzzle`
- `modulePuzzle`
- `moduleThree`
- `monetizationBillMagnet`
- `monetizationTabletDollar`
- `monetizationTouchCoin`
- `moneyBagDollar`
- `moneyWalletOpen`
- `monitor`
- `monitorBug`
- `monitorDownload`
- `monitorFlash`
- `monitorGraphLine`
- `monitorHeartBeat`
- `monitorHeartBeatSearch`
- `monitorSync`
- `monitorTransfer1`
- `monitorUpload`
- `monitorWarning`
- `mouse`
- `mouseSmart`
- `moveDown1`
- `moveExpandVertical`
- `moveToBottom`
- `movieCinemaWatch`
- `moviesReel`
- `moviesSitDrink`
- `multipleActionsChat`
- `multipleNeutral2`
- `multipleUsers1`
- `multipleUsers2`
- `multipleUsersNetwork`
- `musicNote1`
- `naturalDisasterEarthquake`
- `naturalDisasterFlood`
- `naturalDisasterHurricane`
- `naturalDisasterVolcano`
- `navigationArrowsLeft1`
- `navigationLeft`
- `navigationMenu1`
- `navigationMenuHorizontal1`
- `network`
- `networkBrowser`
- `networkPin`
- `networkSearch`
- `networkSignal`
- `networkUser`
- `networkUserAlt`
- `networkUsers`
- `networkWarning`
- `newspaperFold`
- `nightClubDiscoBall`
- `nightMoonBegin`
- `nightMoonHalf1`
- `notesBook`
- `notesBookText`
- `notesChecklistFlip`
- `notesPaperText`
- `notesUpload`
- `officeBusinessCard`
- `officeChair`
- `officeClipper`
- `officeDesk1`
- `officeDesk2`
- `officeDeskLamp`
- `officeDrawer`
- `officeEmployee`
- `officeFileAdobe`
- `officeFileGraph`
- `officeFileModuleEdit`
- `officeFileStamp`
- `officeFileText`
- `officeFileXls`
- `officeOutdoors`
- `officeShredder1`
- `officeWorkWireless`
- `optimizationGraph`
- `optimizationGraphLine`
- `osxLogo`
- `outdoorsFlashlight2`
- `paginateFilter2`
- `paginateFilter3`
- `paginateFilter5`
- `paginateFilter7`
- `paginateFilter9`
- `paginateFilterText`
- `paperWrite`
- `paragraphCenterAlign`
- `paragraphImageLeft`
- `paralympicsFootball`
- `partyBalloon`
- `partyConfetti`
- `partyDecoration`
- `partyMask`
- `pastaBowlWarm`
- `pathfinderDivide`
- `pathfinderExclude`
- `paypalLogo`
- `penWrite`
- `pencil1`
- `performanceIncrease`
- `performanceMoneyDecrease`
- `performanceTabletIncrease`
- `phoneActionHome`
- `phoneActionShield`
- `phoneActionsCall`
- `phoneActionsMerge`
- `phoneActionsRefresh`
- `phoneCircle`
- `phoneDoubleCamera`
- `phoneRetro1`
- `phoneScroll`
- `phoneType`
- `phoneVibrate`
- `photographyEquipmentFlashLight`
- `pictureDoubleLandscape`
- `pictureStackLandscape`
- `pictureSun`
- `pillLaptop`
- `pin2`
- `pin2Alt`
- `pinXMark`
- `pinterestLogo`
- `playerPhoneStation1`
- `playlistDownload`
- `playlistSongs`
- `powerButton`
- `pregnancySperm`
- `pregnancySperm1`
- `pregnancyUltrasoundBaby`
- `presentationAudience`
- `presentationBoardGraph`
- `presentationMicrophone1`
- `presentationProjector`
- `presentationProjectorScreenBudgetAnalytics`
- `printText`
- `productsGifts`
- `professionsManConstruction2`
- `profileCashMessage`
- `programmingBook`
- `programmingHoldCode2`
- `programmingLanguageHtml5`
- `programmingLanguageMonitorCss`
- `programmingUserChat`
- `projectBlueprintHome`
- `publicServiceFirefighterTruck1`
- `questionHelpMessage`
- `radioRetro`
- `radioactiveCircle`
- `radiologyScanDoctor`
- `radiologyScanner`
- `railroadMetro`
- `rainUmbrella1`
- `rainUmbrellaSun`
- `rankingPeopleFirst`
- `rankingStarsRibbon`
- `ratingStar`
- `ratingStarRibbon`
- `ratingStarThree`
- `ratingStarWinner`
- `readEmailAt1`
- `readEmailMonitor`
- `realEstateDealShakeBuilding`
- `receipt`
- `receiptDollar`
- `redditLogo`
- `reflectDown`
- `reflectLeft`
- `removeBold`
- `removeShield`
- `responsiveDesign1`
- `responsiveDesignHand`
- `retouchFace`
- `roadSignHairpinTurnLeft`
- `roadSignStop`
- `roadSignTurnLeft`
- `roadStraight`
- `roadTunnel`
- `routerSignal`
- `routerSignal1`
- `rssFeed`
- `safety911`
- `safetyDrownHand`
- `safetyFlameRight`
- `safetyFloat`
- `safetyWarningRadioactive`
- `satellite`
- `savingBank1`
- `savingBankInternational`
- `savingDogGuardDecrease`
- `savingMoneyFlower`
- `scaleHorizontal`
- `scanner`
- `scienceFictionAlien1`
- `scienceMolecule`
- `scienceMolecule1`
- `scienceMoleculeStrucutre`
- `sciencePhysicsLaw`
- `scissors2`
- `scooter`
- `scooter3`
- `screen1`
- `screenCurved`
- `scrollVertical`
- `sdCardDownload`
- `sdCardSync`
- `seafoodSquid`
- `seafoodSushi`
- `searchCircle`
- `seasoningFood`
- `selfPaymentTouch`
- `sendEmailEnvelope`
- `sendEmailFly`
- `seoSearchGraph`
- `serverAdd`
- `serverRefresh1`
- `serverServerExchange`
- `serverShare`
- `serverStar1`
- `settingsOn`
- `settingsSliderDesktopHorizontal`
- `shapeCube`
- `shapePegTop`
- `shapeTriangle`
- `shapeTriangleCircle`
- `shapes`
- `share`
- `share2`
- `shareLocationHand2`
- `shelfBooks1`
- `shieldCheck1`
- `shieldGlobe`
- `shieldLock`
- `shieldMonitor`
- `shipmentBarcode`
- `shipmentCargoBoat`
- `shipmentClock`
- `shipmentCrack`
- `shipmentDelivered`
- `shipmentHook`
- `shipmentOnlineMonitor1`
- `shipmentSearch`
- `shipmentStar`
- `shipmentTouch`
- `shipmentTracking`
- `shipmentUploadInformation`
- `shootingRiflePersonAim`
- `shopLike`
- `shopSale1`
- `shopSignBag`
- `shopSignOpen`
- `shoppingBagCarry`
- `shoppingBagCheck`
- `shoppingBagDutyFree`
- `shoppingBasket3`
- `shoppingBasketStar`
- `shoppingCartFull`
- `shoppingCartUpload`
- `showTheaterMaskHappy`
- `showTheaterMasks`
- `shrink`
- `signBadgeBadge1`
- `signalFull`
- `singleManActionsCheck1`
- `singleManActionsVideo`
- `singleManFocus`
- `singleManHome`
- `singleManVintageTv`
- `singleNeutralActionsEdit2`
- `singleNeutralActionsHeart`
- `singleNeutralActionsRefresh`
- `singleNeutralActionsRemove`
- `singleNeutralCircle`
- `singleNeutralFolderBox`
- `singleNeutralMonitor`
- `singleWoman`
- `singleWomanBook`
- `singleWomanHome`
- `skateboardPerson`
- `skating1`
- `skiingSnowScooterPerson`
- `skull`
- `skypeLogo`
- `smartWatchCircle`
- `smartWatchCircleWifi`
- `smartWatchSquare`
- `smartWatchSquareDownload`
- `smartWatchSquareHeart`
- `smartWatchSquareLocation`
- `smartWatchSquarePower`
- `smartWatchSquareWifi`
- `smartWatchWrist`
- `smileyCheerful`
- `smileyDisapointed`
- `smileyHappy`
- `smileyLolSideways`
- `smileyMad`
- `smileyPrank`
- `smileySad1`
- `smileySmile1`
- `smileyUnhappy1`
- `smileyWrong`
- `snapchatLogo`
- `soccerField`
- `soccerKickBall`
- `socketBox`
- `softDrinksBottle1`
- `soundcloudLogo`
- `spaceAstronaut`
- `spaceRocketEarth`
- `speaker1`
- `spotifyLogo2`
- `squarespaceLogo`
- `stackOverflowLogo`
- `stairsDescend`
- `stampsImage`
- `startupLaunch`
- `stopSign`
- `stopwatch`
- `stoveGasPot`
- `strategySplit`
- `studyExamMath`
- `styleOnePinCheck`
- `styleOnePinPlane`
- `styleOnePinStar`
- `styleThreePinBaseball`
- `styleThreePinFactory`
- `styleThreePinHome`
- `styleThreePinPoliceBadge`
- `subtractCircle`
- `swimmingDiving`
- `swimmingPoolStairs`
- `synchronizeArrow`
- `synchronizeArrowsLock`
- `synchronizeArrowsThree`
- `tablet`
- `tagDollar`
- `tags1`
- `tagsFavorite`
- `tagsRefresh`
- `tagsRemove`
- `tagsSettings`
- `takingPicturesCameras`
- `targetCenterMonitor`
- `taskFingerShow`
- `taskListApprove`
- `taskListPin`
- `taskListText1`
- `taskListToDo`
- `taxi`
- `teaPot`
- `teamChat`
- `teamMeeting`
- `temperatureCelsius`
- `temperatureThermometerHigh`
- `temperatureThermometerHighAlt`
- `temperatureThermometerUp`
- `textStrikeThrough1`
- `textUnderline`
- `ticket1`
- `ticketAdd`
- `timeClockCircle`
- `timeClockFile`
- `timeClockFire`
- `timeClockHand1`
- `timer10`
- `toiletSeat`
- `toolBox`
- `toolsKitchenScale`
- `touchId`
- `touchUp`
- `transformRight`
- `transfusionBagHang`
- `treasureChest`
- `trendsTorch`
- `tripPinMultiple`
- `tripRoad1`
- `truck2`
- `truckEmpty1`
- `tukTuk1`
- `typing`
- `undo`
- `uploadBrackets`
- `uploadCircle`
- `uploadSquare1`
- `usbCable`
- `usbPort1`
- `userCashScale`
- `userNetwork`
- `userQuestion`
- `userSignal1`
- `vectorsAnchorRectangle`
- `vectorsPathCorner`
- `vectorsPen`
- `vectorsPenDraw`
- `vegetablesBeet1`
- `videoEditCcTitles`
- `videoEditCut`
- `videoEditMagicWand`
- `videoFileDownload`
- `videoFileM4v`
- `videoFileStar`
- `videoPlayer`
- `videoPlayerAlbum`
- `videoPlayerLaptop`
- `videoPlayerMovie2`
- `videoPlayerSlider`
- `viewOff`
- `viewSquare`
- `vimeoLogo`
- `vintageTv4`
- `vinylRecord`
- `vinylRecordPlayer`
- `vipCrownQueen1`
- `vkLogo`
- `voiceId`
- `voiceIdApproved`
- `volleyballBall`
- `volleyballNet`
- `volumeControlRemove1`
- `volumeControlUp3`
- `volumeControlWarning`
- `walking`
- `walking1`
- `walkmanHeadphones`
- `wallSocket`
- `wallSocket1`
- `warehouseCartPackageRibbon`
- `warehouseCartPackages2`
- `warehouseStorage2`
- `waterBottleGlass`
- `waterDam`
- `waterFountainJet`
- `waterStraw`
- `weatherCloudSnowThunder`
- `weatherCloudWind3`
- `weatherCloudWind4`
- `weatherSun`
- `webcam2`
- `websiteBuild`
- `wechatLogo`
- `wifiLaptop`
- `wifiOff`
- `wifiSignal2`
- `wifiSignal3`
- `wifiTransfer`
- `wifiWarning`
- `wikipediaLogo`
- `windEast`
- `windVelocityMeasure`
- `wineBarrel1`
- `wirelessPaymentCreditCardDollar`
- `yogaDownStretch`
- `yogaLegGrabStretch`
- `yogaMeditate`
- `youtubeClipLogo`
- `zipFileCheck`
- `zipFileCompress`
- `zoomInPage`
- `zoomOutPage`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AbTestingMonitorsIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccountingBillStack1Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccountingCalculator1Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccountingCoinsIcon size="20" class="nav-icon" /> Settings</a>
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
<AbTestingMonitorsIcon
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
    <AbTestingMonitorsIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccountingBillStack1Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccountingCalculator1Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AbTestingMonitorsIcon size="24" />
   <AccountingBillStack1Icon size="24" color="#4a90e2" />
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
   <AbTestingMonitorsIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AbTestingMonitorsIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AbTestingMonitorsIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { abTestingMonitors } from '@stacksjs/iconify-streamline-ultimate-color'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(abTestingMonitors, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abTestingMonitors } from '@stacksjs/iconify-streamline-ultimate-color'

// Icons are typed as IconData
const myIcon: IconData = abTestingMonitors
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-ultimate-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-ultimate-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
