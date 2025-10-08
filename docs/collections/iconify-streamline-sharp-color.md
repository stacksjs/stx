# Sharp color icons

> Sharp color icons icons for stx from Iconify

## Overview

This package provides access to 1000 icons from the Sharp color icons collection through the stx iconify integration.

**Collection ID:** `streamline-sharp-color`
**Total Icons:** 1000
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-sharp-color
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dMoveIcon height="1em" />
<3dMoveIcon width="1em" height="1em" />
<3dMoveIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dMoveIcon size="24" />
<3dMoveIcon size="1em" />

<!-- Using width and height -->
<3dMoveIcon width="24" height="32" />

<!-- With color -->
<3dMoveIcon size="24" color="red" />
<3dMoveIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dMoveIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dMoveIcon
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
    <3dMoveIcon size="24" />
    <3dMoveFlatIcon size="24" color="#4a90e2" />
    <3dRotateYAxisIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3dMove, 3dMoveFlat, 3dRotateYAxis } from '@stacksjs/iconify-streamline-sharp-color'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3dMove, { size: 24 })
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
<3dMoveIcon size="24" color="red" />
<3dMoveIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dMoveIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dMoveIcon size="24" class="text-primary" />
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
<3dMoveIcon height="1em" />
<3dMoveIcon width="1em" height="1em" />
<3dMoveIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dMoveIcon size="24" />
<3dMoveIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineSharpColor-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dMoveIcon class="streamlineSharpColor-icon" />
```

## Available Icons

This package contains **1000** icons:

- `3dMove`
- `3dMoveFlat`
- `3dRotateYAxis`
- `3dRotateYAxisFlat`
- `3dScale`
- `3dScaleFlat`
- `addPdf`
- `addPdfFlat`
- `aiEditRobot`
- `aiEditRobotFlat`
- `aiFolderRobot`
- `aiFolderRobotFlat`
- `aiGamingRobot`
- `aiGamingRobotFlat`
- `aiGenerateVoiceSpark2`
- `aiGenerateVoiceSpark2Flat`
- `aiScienceSpark`
- `aiScienceSparkFlat`
- `aiUpscaleSpark`
- `aiUpscaleSparkFlat`
- `aiVehicleRobot1`
- `aiVehicleRobot1Flat`
- `airplaneDisabled`
- `airplaneDisabledFlat`
- `alien`
- `alienFlat`
- `alignBack2`
- `alignBack2Flat`
- `alignLeft1`
- `alignLeft1Flat`
- `alignObjectBottom`
- `alignObjectBottomFlat`
- `alignTextCenter`
- `alignTextCenterFlat`
- `allergensFish`
- `allergensFishFlat`
- `allergensPeanut`
- `allergensPeanutFlat`
- `apple`
- `appleFlat`
- `applicationAdd`
- `applicationAddFlat`
- `archiveBox`
- `archiveBoxFlat`
- `arrowCursor1`
- `arrowCursor1Flat`
- `arrowCursorMove`
- `arrowCursorMoveFlat`
- `arrowDiagonal2`
- `arrowDiagonal2Flat`
- `arrowExpand`
- `arrowExpandFlat`
- `arrowReloadHorizontal2`
- `arrowReloadHorizontal2Flat`
- `arrowTransferHorizontalLarge1`
- `arrowTransferHorizontalLarge1Flat`
- `arrowTriangleLoop`
- `arrowTriangleLoopFlat`
- `arrowTurnDownLarge`
- `arrowTurnDownLargeFlat`
- `arrowUpDashedSquare`
- `arrowUpDashedSquareFlat`
- `arrowUpLarge2`
- `arrowUpLarge2Flat`
- `artificialIntelligenceBrainChip`
- `artificialIntelligenceBrainChipFlat`
- `asteriskSquare`
- `asteriskSquareFlat`
- `attribution`
- `attributionFlat`
- `bagDollar`
- `bagDollarFlat`
- `bagSuitcaseAddPlus`
- `bagSuitcaseAddPlusFlat`
- `baggage`
- `baggageFlat`
- `ball`
- `ballFlat`
- `batteryEmpty2`
- `batteryEmpty2Flat`
- `batteryMedium3`
- `batteryMedium3Flat`
- `bellNotification`
- `bellNotificationFlat`
- `bellSetTimer`
- `bellSetTimerFlat`
- `bill4`
- `bill4Flat`
- `billDollar1`
- `billDollar1Flat`
- `bloodBagDonation`
- `bloodBagDonationFlat`
- `bluetooth`
- `bluetoothFlat`
- `board`
- `boardFlat`
- `borderBottom`
- `borderBottomFlat`
- `boxWaterproof`
- `boxWaterproofFlat`
- `brightness1`
- `brightness1Flat`
- `browserBuild`
- `browserBuildFlat`
- `browserCode2`
- `browserCode2Flat`
- `browserError`
- `browserError404`
- `browserError404Flat`
- `browserErrorFlat`
- `browserKey`
- `browserKeyFlat`
- `bug`
- `bugFlat`
- `bugVirusBrowser`
- `bugVirusBrowserFlat`
- `bulletList`
- `bulletListFlat`
- `businessIdeaMoney`
- `businessIdeaMoneyFlat`
- `buttonFastForward2`
- `buttonFastForward2Flat`
- `buttonPowerCircle1`
- `buttonPowerCircle1Flat`
- `buttonsAll`
- `buttonsAllFlat`
- `cake`
- `cakeFlat`
- `calendarAdd`
- `calendarAddFlat`
- `calendarMark`
- `calendarMarkFlat`
- `calendarWarning`
- `calendarWarningFlat`
- `cameraFlip1`
- `cameraFlip1Flat`
- `cameraSettingPin`
- `cameraSettingPinFlat`
- `cameraVideo`
- `cameraVideoFlat`
- `candle`
- `candleFlat`
- `car2`
- `car2Flat`
- `cardGameDiamond`
- `cardGameDiamondFlat`
- `cashierMachine2`
- `cashierMachine2Flat`
- `cellularNetwork5g`
- `cellularNetwork5gFlat`
- `chair2`
- `chair2Flat`
- `chatBubbleCrackSquare`
- `chatBubbleCrackSquareFlat`
- `chatBubbleDisableOval`
- `chatBubbleDisableOvalFlat`
- `chatBubbleSquareBlock`
- `chatBubbleSquareBlockFlat`
- `chatBubbleSquareWrite`
- `chatBubbleSquareWriteFlat`
- `chatBubbleTypingOval`
- `chatBubbleTypingOvalFlat`
- `chatTwoBubblesOval`
- `chatTwoBubblesOvalFlat`
- `check`
- `checkFlat`
- `chefToqueHat`
- `chefToqueHatFlat`
- `chessKnight`
- `chessKnightFlat`
- `chickenGrilledStream`
- `chickenGrilledStreamFlat`
- `circusTent`
- `circusTentFlat`
- `cleanBroomWipe`
- `cleanBroomWipeFlat`
- `cleaningRoomWoman`
- `cleaningRoomWomanFlat`
- `closedUmbrella`
- `closedUmbrellaFlat`
- `cloudDataTransfer`
- `cloudDataTransferFlat`
- `cloudOff`
- `cloudOffFlat`
- `cloudWifi`
- `cloudWifiFlat`
- `cog`
- `cogFlat`
- `colorSwatches`
- `colorSwatchesFlat`
- `computerChip1`
- `computerChip1Flat`
- `consellation`
- `consellationFlat`
- `contactBook`
- `contactBookFlat`
- `controllerWireless`
- `controllerWirelessFlat`
- `copyLink`
- `copyLinkFlat`
- `creditCard2`
- `creditCard2Flat`
- `creditCardDisable`
- `creditCardDisableFlat`
- `criticalThinking2`
- `criticalThinking2Flat`
- `crutch`
- `crutchFlat`
- `cupcake`
- `cupcakeFlat`
- `cursorClick`
- `cursorClickFlat`
- `curvesLevelsGraph`
- `curvesLevelsGraphFlat`
- `customFeedsLikeFavorite`
- `customFeedsLikeFavoriteFlat`
- `customerSupport1`
- `customerSupport1Flat`
- `customerSupportSetting`
- `customerSupportSettingFlat`
- `cut`
- `cutFlat`
- `cutter`
- `cutterFlat`
- `cyborg`
- `cyborgFlat`
- `darkDisplayMode`
- `darkDisplayModeFlat`
- `dashboard1`
- `dashboard1Flat`
- `dashboardCircle`
- `dashboardCircleFlat`
- `dashboardGauge2`
- `dashboardGauge2Flat`
- `database`
- `databaseFlat`
- `databaseServer2`
- `databaseServer2Flat`
- `decentWorkAndEconomicGrowth`
- `decentWorkAndEconomicGrowthFlat`
- `deepfakeTechnology2`
- `deepfakeTechnology2Flat`
- `definitionSearchBook`
- `definitionSearchBookFlat`
- `delete2`
- `delete2Flat`
- `deleteBookmark`
- `deleteBookmarkFlat`
- `deletePdf`
- `deletePdfFlat`
- `deleteTag`
- `deleteTagFlat`
- `desktopChat`
- `desktopChatFlat`
- `desktopScreensaverSleep`
- `desktopScreensaverSleepFlat`
- `deviceDatabaseEncryption1`
- `deviceDatabaseEncryption1Flat`
- `diagonalScroll1`
- `diagonalScroll1Flat`
- `dialPadFinger2`
- `dialPadFinger2Flat`
- `discountPercentFire`
- `discountPercentFireFlat`
- `divisionCircle`
- `divisionCircleFlat`
- `dna`
- `dnaFlat`
- `dollarIncrease`
- `dollarIncreaseFlat`
- `doubleBookmark`
- `doubleBookmarkFlat`
- `doubleHeart`
- `doubleHeartFlat`
- `downloadBox1`
- `downloadBox1Flat`
- `downloadSquare`
- `downloadSquareFlat`
- `downloadStack`
- `downloadStackFlat`
- `drawingCompass`
- `drawingCompassFlat`
- `drone`
- `droneFlat`
- `dropDownMenu`
- `dropDownMenuFlat`
- `drumStick`
- `drumStickFlat`
- `earth2`
- `earth2Flat`
- `ecoHouse`
- `ecoHouseFlat`
- `editPdf`
- `editPdfFlat`
- `ejectSquare`
- `ejectSquareFlat`
- `electricCord3`
- `electricCord3Flat`
- `elipseFrame`
- `elipseFrameFlat`
- `emailAttachmentImage`
- `emailAttachmentImageFlat`
- `emergencyCall`
- `emergencyCallFlat`
- `emptyClipboard`
- `emptyClipboardFlat`
- `emptyRecycleBin1`
- `emptyRecycleBin1Flat`
- `endPointArrow`
- `endPointArrowFlat`
- `facebook1`
- `facebook1Flat`
- `featherPen`
- `featherPenFlat`
- `fileBookmark`
- `fileBookmarkFlat`
- `filter2`
- `filter2Flat`
- `fingerprint2`
- `fingerprint2Flat`
- `fireAlarm1`
- `fireAlarm1Flat`
- `fireWall`
- `fireWallFlat`
- `flashTimer`
- `flashTimerFlat`
- `flashlight`
- `flashlightFlat`
- `flipVerticalArrow2`
- `flipVerticalArrow2Flat`
- `flipVerticalSquare1`
- `flipVerticalSquare1Flat`
- `floppyDisk`
- `floppyDiskFlat`
- `fluMask`
- `fluMaskFlat`
- `folderBlock`
- `folderBlockFlat`
- `following`
- `followingFlat`
- `forkPlate`
- `forkPlateFlat`
- `fortuneTellingSphere`
- `fortuneTellingSphereFlat`
- `forwardEmail`
- `forwardEmailFlat`
- `fragile`
- `fragileFlat`
- `gameboy`
- `gameboyFlat`
- `gasStationFuelPetroleum`
- `gasStationFuelPetroleumFlat`
- `genderLesbian2`
- `genderLesbian2Flat`
- `gift2`
- `gift2Flat`
- `giveGift`
- `giveGiftFlat`
- `glasses`
- `glassesFlat`
- `globalLearning`
- `globalLearningFlat`
- `gold`
- `goldFlat`
- `googleDrive`
- `googleDriveFlat`
- `graduationCap`
- `graduationCapFlat`
- `graphArrowUserIncrease`
- `graphArrowUserIncreaseFlat`
- `graphDot`
- `graphDotFlat`
- `graphicTemplateWebsiteUi`
- `graphicTemplateWebsiteUiFlat`
- `handHeldTabletDrawing`
- `handHeldTabletDrawingFlat`
- `handWashing`
- `handWashingFlat`
- `hanger`
- `hangerFlat`
- `happyFace`
- `happyFaceFlat`
- `healthCare2`
- `healthCare2Flat`
- `hearingDeaf1`
- `hearingDeaf1Flat`
- `heartRateClipboard`
- `heartRateClipboardFlat`
- `helpChat2`
- `helpChat2Flat`
- `hideLayer`
- `hideLayerFlat`
- `hierarchy16`
- `hierarchy16Flat`
- `hierarchy2`
- `hierarchy2Flat`
- `hierarchy8`
- `hierarchy8Flat`
- `hierarchyLine1`
- `hierarchyLine1Flat`
- `home1`
- `home1Flat`
- `horizontalMenuSquare`
- `horizontalMenuSquareFlat`
- `horizontalSlider2`
- `horizontalSlider2Flat`
- `horizontalToggleButton`
- `horizontalToggleButtonFlat`
- `hotAirBalloon`
- `hotAirBalloonFlat`
- `hotSpring`
- `hotSpringFlat`
- `hotelBed2`
- `hotelBed2Flat`
- `hotelThreeStar`
- `hotelThreeStarFlat`
- `hourglass`
- `hourglassFlat`
- `iceCream1`
- `iceCream1Flat`
- `imageHighlights`
- `imageHighlightsFlat`
- `inbox`
- `inboxFavorite`
- `inboxFavoriteFlat`
- `inboxFlat`
- `inboxPost`
- `inboxPostFlat`
- `incognitoMode`
- `incognitoModeFlat`
- `informationCircle`
- `informationCircleFlat`
- `inputBox`
- `inputBoxFlat`
- `insertCloudLink`
- `insertCloudLinkFlat`
- `insertRow`
- `insertRowFlat`
- `insertTopLeft`
- `insertTopLeftFlat`
- `insuranceHands`
- `insuranceHandsFlat`
- `investingAndBanking`
- `investingAndBankingFlat`
- `invisible2`
- `invisible2Flat`
- `irisScan`
- `irisScanFlat`
- `justiceScale2`
- `justiceScale2Flat`
- `keyboard`
- `keyboardFlat`
- `labelFolderTag`
- `labelFolderTagFlat`
- `landing`
- `landingFlat`
- `landscape2`
- `landscape2Flat`
- `laptopCamera`
- `laptopCameraFlat`
- `laptopProjectScreen`
- `laptopProjectScreenFlat`
- `lassoTool`
- `lassoToolFlat`
- `layers1`
- `layers1Flat`
- `layoutRightSidebar`
- `layoutRightSidebarFlat`
- `layoutWindow2`
- `layoutWindow2Flat`
- `layoutWindow25`
- `layoutWindow25Flat`
- `leaf`
- `leafFlat`
- `lens`
- `lensFlat`
- `lift`
- `liftFlat`
- `lightDarkMode`
- `lightDarkModeFlat`
- `like1`
- `like1Flat`
- `linkChain`
- `linkChainFlat`
- `linkShare2`
- `linkShare2Flat`
- `locationCompass2`
- `locationCompass2Flat`
- `locationOffice`
- `locationOfficeFlat`
- `locationPin3`
- `locationPin3Flat`
- `locationPinStore`
- `locationPinStoreFlat`
- `login2`
- `login2Flat`
- `logout2`
- `logout2Flat`
- `loop1`
- `loop1Flat`
- `magicWand2`
- `magicWand2Flat`
- `magnifyingGlass`
- `magnifyingGlassFlat`
- `mailLoading`
- `mailLoadingFlat`
- `mailSendEmailMessage`
- `mailSendEmailMessageFlat`
- `mailSendEnvelope`
- `mailSendEnvelopeFlat`
- `mapSearch`
- `mapSearchFlat`
- `medicalFolder`
- `medicalFolderFlat`
- `medicalRibbon1`
- `medicalRibbon1Flat`
- `medicalSearchDiagnosis`
- `medicalSearchDiagnosisFlat`
- `megaphone2`
- `megaphone2Flat`
- `memesCommentReply`
- `memesCommentReplyFlat`
- `microscopeObservationSciene`
- `microscopeObservationScieneFlat`
- `middleClick`
- `middleClickFlat`
- `milk`
- `milkFlat`
- `mineCart2`
- `mineCart2Flat`
- `mirrorHorizontally`
- `mirrorHorizontallyFlat`
- `missedCall`
- `missedCallFlat`
- `module`
- `moduleFlat`
- `modulePuzzle2`
- `modulePuzzle2Flat`
- `moonCloud`
- `moonCloudFlat`
- `moustache`
- `moustacheFlat`
- `moveFile`
- `moveFileFlat`
- `musicNote1`
- `musicNote1Flat`
- `musicNoteTrebbleClef`
- `musicNoteTrebbleClefFlat`
- `necktie`
- `necktieFlat`
- `newFile`
- `newFileFlat`
- `newFolder`
- `newFolderFlat`
- `newStickyNote`
- `newStickyNoteFlat`
- `newsPaper`
- `newsPaperFlat`
- `noPhotoTakingZone`
- `noPhotoTakingZoneFlat`
- `noWordWrap`
- `noWordWrapFlat`
- `nonCommercialDollars`
- `nonCommercialDollarsFlat`
- `noseSmell`
- `noseSmellFlat`
- `notebook`
- `notebookFlat`
- `notificationAlarm2`
- `notificationAlarm2Flat`
- `notificationAlarmSnooze`
- `notificationAlarmSnoozeFlat`
- `octagramShape`
- `octagramShapeFlat`
- `officeBuilding2`
- `officeBuilding2Flat`
- `officeWorker`
- `officeWorkerFlat`
- `oneFingerShortTap`
- `oneFingerShortTapFlat`
- `oneHandedHoldingTabletHandheld`
- `oneHandedHoldingTabletHandheldFlat`
- `padlockShield`
- `padlockShieldFlat`
- `padlockSquare1`
- `padlockSquare1Flat`
- `padlockSquare2`
- `padlockSquare2Flat`
- `pageBreak`
- `pageBreakFlat`
- `pageSetting`
- `pageSettingFlat`
- `panoramicScreen`
- `panoramicScreenFlat`
- `paperclip2`
- `paperclip2Flat`
- `paragraphArticle`
- `paragraphArticleFlat`
- `paragraphRightToLeft`
- `paragraphRightToLeftFlat`
- `partyPopper`
- `partyPopperFlat`
- `passportGlobe`
- `passportGlobeFlat`
- `passwordBlock`
- `passwordBlockFlat`
- `pathfinderOutline`
- `pathfinderOutlineFlat`
- `peaceSymbol`
- `peaceSymbolFlat`
- `pen1`
- `pen1Flat`
- `penDraw`
- `penDrawFlat`
- `penTool`
- `penToolFlat`
- `penTypes`
- `penTypesFlat`
- `pentagon`
- `pentagonFlat`
- `petFriendlyHotel`
- `petFriendlyHotelFlat`
- `petriDishLabEquipment`
- `petriDishLabEquipmentFlat`
- `petsAllowed`
- `petsAllowedFlat`
- `phoneCircleOff`
- `phoneCircleOffFlat`
- `phoneMessage`
- `phoneMessageFlat`
- `phonePen2`
- `phonePen2Flat`
- `phonePersonalHotspot`
- `phonePersonalHotspotFlat`
- `phoneRinging1`
- `phoneRinging1Flat`
- `phoneSetting`
- `phoneSettingFlat`
- `phoneVibrate`
- `phoneVibrateFlat`
- `picturesFolderMemories`
- `picturesFolderMemoriesFlat`
- `pieChart`
- `pieChartFlat`
- `pin1`
- `pin1Flat`
- `pinwheel`
- `pinwheelFlat`
- `planeFlightBoard`
- `planeFlightBoardFlat`
- `playList1`
- `playList1Flat`
- `playList8`
- `playList8Flat`
- `polaroid`
- `polaroidFlat`
- `politicsVote2`
- `politicsVote2Flat`
- `prescriptionPillsDrugsHealthcare`
- `prescriptionPillsDrugsHealthcareFlat`
- `presentation`
- `presentationFlat`
- `projectorScreen`
- `projectorScreenFlat`
- `pyramidShape`
- `pyramidShapeFlat`
- `qrCode`
- `qrCodeFlat`
- `rabbit`
- `rabbitFlat`
- `radio`
- `radioFlat`
- `radioactive1`
- `radioactive1Flat`
- `rateStretchTool`
- `rateStretchToolFlat`
- `receiptAdd`
- `receiptAddFlat`
- `recordPlayer`
- `recordPlayerFlat`
- `recordingTape2`
- `recordingTape2Flat`
- `recycle1`
- `recycle1Flat`
- `recycleBin2`
- `recycleBin2Flat`
- `refrigerator`
- `refrigeratorFlat`
- `removeAlertClock`
- `removeAlertClockFlat`
- `removeFavoriteHighlight`
- `removeFavoriteHighlightFlat`
- `repeatSingle`
- `repeatSingleFlat`
- `resetClock`
- `resetClockFlat`
- `ribbon`
- `ribbonFlat`
- `ring`
- `ringFlat`
- `rockAndRollHand`
- `rockAndRollHandFlat`
- `roller`
- `rollerFlat`
- `rollerPaintbrush`
- `rollerPaintbrushFlat`
- `rotateRight`
- `rotateRightFlat`
- `roundAnchorPoint`
- `roundAnchorPointFlat`
- `routerWifiNetwork`
- `routerWifiNetworkFlat`
- `rssSymbol`
- `rssSymbolFlat`
- `ruler`
- `rulerFlat`
- `safari`
- `safariFlat`
- `safeVault`
- `safeVaultFlat`
- `satelliteDish`
- `satelliteDishFlat`
- `scanner`
- `scannerFlat`
- `schoolBusSide`
- `schoolBusSideFlat`
- `screenTv`
- `screenTvFlat`
- `screwdriverWrench`
- `screwdriverWrenchFlat`
- `script1`
- `script1Flat`
- `searchBar`
- `searchBarFlat`
- `searchHistoryBrowser`
- `searchHistoryBrowserFlat`
- `selectAll`
- `selectAllFlat`
- `selectCircleArea2`
- `selectCircleArea2Flat`
- `shareCode`
- `shareCodeFlat`
- `shareLink`
- `shareLinkFlat`
- `shareTime`
- `shareTimeFlat`
- `sharingData`
- `sharingDataFlat`
- `shield2`
- `shield2Flat`
- `shinto`
- `shintoFlat`
- `ship`
- `shipFlat`
- `shipmentCheck`
- `shipmentCheckFlat`
- `shippingBox1`
- `shippingBox1Flat`
- `shirt`
- `shirtFlat`
- `shoppingBagHandBagPriceTag`
- `shoppingBagHandBagPriceTagFlat`
- `shoppingBasket2`
- `shoppingBasket2Flat`
- `shoppingBasketRemove`
- `shoppingBasketRemoveFlat`
- `shoppingCartAdd`
- `shoppingCartAddFlat`
- `shovelRake`
- `shovelRakeFlat`
- `shredder`
- `shredderFlat`
- `shrinkWindowOsx`
- `shrinkWindowOsxFlat`
- `signHashtag`
- `signHashtagFlat`
- `signage3`
- `signage3Flat`
- `signalFull`
- `signalFullFlat`
- `signature`
- `signatureFlat`
- `sizing`
- `sizingFlat`
- `skull2`
- `skull2Flat`
- `skype`
- `skypeFlat`
- `slideShowPlay`
- `slideShowPlayFlat`
- `smartKey`
- `smartKeyFlat`
- `smileyShocked`
- `smileyShockedFlat`
- `snooze`
- `snoozeClock`
- `snoozeClockFlat`
- `snoozeFlat`
- `snowFlake`
- `snowFlakeFlat`
- `songRecommendation`
- `songRecommendationFlat`
- `soundRecognitionSearch`
- `soundRecognitionSearchFlat`
- `spa`
- `spaFlat`
- `speaker1`
- `speaker1Flat`
- `sphereShape`
- `sphereShapeFlat`
- `spiralShape`
- `spiralShapeFlat`
- `stamp`
- `stampFlat`
- `star2`
- `star2Flat`
- `starBadge`
- `starBadgeFlat`
- `starCircle`
- `starCircleFlat`
- `startup`
- `startupFlat`
- `stepsNumber`
- `stepsNumberFlat`
- `stock`
- `stockFlat`
- `stopwatch`
- `stopwatchFlat`
- `store2`
- `store2Flat`
- `storeFactory`
- `storeFactoryFlat`
- `storyPost`
- `storyPostFlat`
- `strategyTasks`
- `strategyTasksFlat`
- `streetSign`
- `streetSignFlat`
- `summit`
- `summitFlat`
- `sun`
- `sunFlat`
- `surveillanceCamera`
- `surveillanceCameraFlat`
- `swordAttack`
- `swordAttackFlat`
- `symmetryMirror1`
- `symmetryMirror1Flat`
- `synchronizeDisable`
- `synchronizeDisableFlat`
- `syringe`
- `syringeFlat`
- `tableLamp2`
- `tableLamp2Flat`
- `tagFreeCircle`
- `tagFreeCircleFlat`
- `target3`
- `target3Flat`
- `teaCup`
- `teaCupFlat`
- `testTube`
- `testTubeFlat`
- `textBar`
- `textBarFlat`
- `textFlowRows`
- `textFlowRowsFlat`
- `textStyle`
- `textStyleFlat`
- `textTracking`
- `textTrackingFlat`
- `theaterMask`
- `theaterMaskFlat`
- `thermometerPositive`
- `thermometerPositiveFlat`
- `threatUsb`
- `threatUsbFlat`
- `ticketStar`
- `ticketStarFlat`
- `timeLapse`
- `timeLapseFlat`
- `timerZero`
- `timerZeroFlat`
- `toiletPaper`
- `toiletPaperFlat`
- `toolBox`
- `toolBoxFlat`
- `tooth`
- `toothFlat`
- `trafficLight`
- `trafficLightFlat`
- `transferCart`
- `transferCartFlat`
- `transferTruckTime`
- `transferTruckTimeFlat`
- `translateText`
- `translateTextFlat`
- `transparent`
- `transparentFlat`
- `tree3`
- `tree3Flat`
- `triangleFlag`
- `triangleFlagFlat`
- `trophy`
- `trophyFlat`
- `tuneAdjustVolume`
- `tuneAdjustVolumeFlat`
- `twoFingerTap`
- `twoFingerTapFlat`
- `typeArea`
- `typeAreaFlat`
- `typewriter`
- `typewriterFlat`
- `uploadComputer`
- `uploadComputerFlat`
- `uploadSquare`
- `uploadSquareFlat`
- `userAddPlus`
- `userAddPlusFlat`
- `userArrowsAccountSwitch`
- `userArrowsAccountSwitchFlat`
- `userCollaborateGroup`
- `userCollaborateGroupFlat`
- `userFeedbackHeart`
- `userFeedbackHeartFlat`
- `userHeadFocus`
- `userHeadFocusFlat`
- `userIdentifierCard`
- `userIdentifierCardFlat`
- `userMultipleCircle`
- `userMultipleCircleFlat`
- `userProtection1`
- `userProtection1Flat`
- `userSingleNeutralFemale`
- `userSingleNeutralFemaleFlat`
- `userSingleNeutralMale`
- `userSingleNeutralMaleFlat`
- `userStickerSquare`
- `userStickerSquareFlat`
- `userWorkLaptopWifi`
- `userWorkLaptopWifiFlat`
- `verticalSlider2`
- `verticalSlider2Flat`
- `videoSubtitles`
- `videoSubtitlesFlat`
- `viewDocumentFiles`
- `viewDocumentFilesFlat`
- `virtualReality`
- `virtualRealityFlat`
- `virusAntivirus`
- `virusAntivirusFlat`
- `visible`
- `visibleFlat`
- `voiceMail`
- `voiceMailFlat`
- `voiceScan1`
- `voiceScan1Flat`
- `voiceTypingWordConvert`
- `voiceTypingWordConvertFlat`
- `volumeLevelHigh`
- `volumeLevelHighFlat`
- `volumeSleep`
- `volumeSleepFlat`
- `walletPurse`
- `walletPurseFlat`
- `warehouse1`
- `warehouse1Flat`
- `warningShield`
- `warningShieldFlat`
- `warpFish`
- `warpFishFlat`
- `watchCircleBluetooth`
- `watchCircleBluetoothFlat`
- `watchCircleDisable`
- `watchCircleDisableFlat`
- `watchSquareDisable`
- `watchSquareDisableFlat`
- `watchSquareTime`
- `watchSquareTimeFlat`
- `waterDrop`
- `waterDrop1`
- `waterDrop1Flat`
- `waterDropFlat`
- `waveSignal`
- `waveSignalFlat`
- `wavingHand`
- `wavingHandFlat`
- `webcamVideo`
- `webcamVideoFlat`
- `wine`
- `wineFlat`
- `workspaceDesk`
- `workspaceDeskFlat`
- `wrapArch`
- `wrapArchFlat`
- `wrench`
- `wrenchFlat`
- `zipFile`
- `zipFileFlat`
- `zoomDocument`
- `zoomDocumentFlat`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dMoveIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dMoveFlatIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dRotateYAxisIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3dRotateYAxisFlatIcon size="20" class="nav-icon" /> Settings</a>
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
<3dMoveIcon
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
    <3dMoveIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <3dMoveFlatIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dRotateYAxisIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dMoveIcon size="24" />
   <3dMoveFlatIcon size="24" color="#4a90e2" />
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
   <3dMoveIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dMoveIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dMoveIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3dMove } from '@stacksjs/iconify-streamline-sharp-color'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dMove, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dMove } from '@stacksjs/iconify-streamline-sharp-color'

// Icons are typed as IconData
const myIcon: IconData = 3dMove
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-sharp-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-sharp-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
