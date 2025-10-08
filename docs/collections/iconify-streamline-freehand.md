# Freehand free icons

> Freehand free icons icons for stx from Iconify

## Overview

This package provides access to 1000 icons from the Freehand free icons collection through the stx iconify integration.

**Collection ID:** `streamline-freehand`
**Total Icons:** 1000
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-freehand
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccessoriesRemoteShutterIcon height="1em" />
<AccessoriesRemoteShutterIcon width="1em" height="1em" />
<AccessoriesRemoteShutterIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccessoriesRemoteShutterIcon size="24" />
<AccessoriesRemoteShutterIcon size="1em" />

<!-- Using width and height -->
<AccessoriesRemoteShutterIcon width="24" height="32" />

<!-- With color -->
<AccessoriesRemoteShutterIcon size="24" color="red" />
<AccessoriesRemoteShutterIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccessoriesRemoteShutterIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccessoriesRemoteShutterIcon
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
    <AccessoriesRemoteShutterIcon size="24" />
    <AccessoriesRetroFilm1Icon size="24" color="#4a90e2" />
    <AccountingAbacusIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accessoriesRemoteShutter, accessoriesRetroFilm1, accountingAbacus } from '@stacksjs/iconify-streamline-freehand'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessoriesRemoteShutter, { size: 24 })
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
<AccessoriesRemoteShutterIcon size="24" color="red" />
<AccessoriesRemoteShutterIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccessoriesRemoteShutterIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccessoriesRemoteShutterIcon size="24" class="text-primary" />
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
<AccessoriesRemoteShutterIcon height="1em" />
<AccessoriesRemoteShutterIcon width="1em" height="1em" />
<AccessoriesRemoteShutterIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccessoriesRemoteShutterIcon size="24" />
<AccessoriesRemoteShutterIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineFreehand-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccessoriesRemoteShutterIcon class="streamlineFreehand-icon" />
```

## Available Icons

This package contains **1000** icons:

- `accessoriesRemoteShutter`
- `accessoriesRetroFilm1`
- `accountingAbacus`
- `accountingCalculator`
- `accountingInvoice`
- `accountingInvoiceMail`
- `addSignBold`
- `advertisingAdBrowser`
- `advertisingMoneyIdea`
- `airplaneModeRectangle`
- `alertAlarmBell`
- `alertAlarmClock`
- `alertsRadioactiveCircle`
- `alertsStopSign`
- `alertsWarningTriangle`
- `allowancesNoBicyclesSign`
- `allowancesNoFoodSign`
- `allowancesNoPhotosSign`
- `allowancesNoSmoking`
- `allowancesSilence`
- `allowancesSmoking`
- `amusementParkCastle`
- `amusementParkFerrisWheel`
- `amusementParkStrengthMeter`
- `analyticsBoardGraphLine`
- `analyticsGraphBarHorizontal`
- `analyticsGraphLineTriple`
- `analyticsGraphPie`
- `analyticsGraphStock`
- `androidLogo`
- `androidSettings`
- `answerMachineVoiceMail`
- `appWindowBookmark`
- `appWindowExpand`
- `appWindowGraph`
- `appWindowLayout`
- `appWindowLink`
- `appWindowSearchText`
- `appWindowSourceCode`
- `appWindowTwo`
- `appWindowUser`
- `appWindowWirelessProblem`
- `appsLaptopShield`
- `appsMonitorGraphLine`
- `appsMonitorUser`
- `archiveBox`
- `archiveDrawer1`
- `archiveDrawer2`
- `arduinoPlusMinus1`
- `barcodeViewPrice`
- `beggingGiving`
- `bluetoothLogo`
- `bluetoothTransfer`
- `boardGameChessFigures`
- `boardGameDicePawn`
- `bookBookmark`
- `bookFlipPage`
- `bookLibraryShelf1`
- `bookSoundAudio`
- `bookmarksDocument`
- `brokenSmartphone1`
- `bugAlertMessage`
- `bugBrowserWarning`
- `bugCloudError`
- `bugServiceChat`
- `businessCashEye`
- `businessCashIdea`
- `businessCashScaleBalance`
- `businessCashSearch`
- `businessCoachingBait1`
- `businessCoachingIdeaJigsaw`
- `businessCoachingStrategy1`
- `businessCoachingWhistle`
- `businessDealHandshake`
- `businessDealMenCashConversation`
- `businessManagementAgreement`
- `businessManagementTeamUp`
- `businessManagementTeamworkClap`
- `businessMetaphorBoatSuccess`
- `businessMetaphorBurnMoney`
- `businessMetaphorLuckyCat`
- `businessMetaphorShark`
- `businessProductSupplier1`
- `businessProductSupplier2`
- `businessWorkflowCompare`
- `businessWorkflowMerge1`
- `businessWorkflowMerge2`
- `businessWorkflowProjectManagement`
- `cablesSplit`
- `cablesUsb1`
- `cablesUsbTypeC`
- `calculatorCalculatorApp`
- `calendarDate`
- `calendarGrid`
- `camera`
- `cameraDouble`
- `cameraModePhoto`
- `cameraSettingsFlip`
- `cameraSettingsHandMotion`
- `cameraSettingsWifi`
- `cameraStabilizer`
- `cameraStudio`
- `cameraTripod`
- `cardGameCardSpade`
- `cardGameSymbols`
- `cashPaymentBag1`
- `cashPaymentBill`
- `cashPaymentCoin1`
- `cashPaymentPenSignature`
- `cashPaymentSign2`
- `casino777SlotMachine`
- `cdDisc`
- `cdPlayerDisc`
- `cdRomBurn`
- `cdRomDisc1`
- `cdRomDiscBroken`
- `cellFormatingBorderHorizontalVertical`
- `cellularNetworkLte`
- `cellularNetworkWifi3g`
- `cellularNetworkWifi4g`
- `cellularNetworkWifi5g`
- `chargingBatteryEco`
- `chargingBatteryEmpty`
- `chargingBatteryFlashConnected`
- `chargingBatteryHigh1`
- `chargingBatteryLow2`
- `chargingFlashWave`
- `chargingFlashWireless`
- `checkPaymentSign`
- `circusClown1`
- `circusTent`
- `cleaningMan`
- `cleaningRobotVacuum`
- `cleaningSign`
- `cloudCheck`
- `cloudDataTransfer`
- `cloudDisable`
- `cloudError404`
- `cloudGamingService`
- `cloudLoading`
- `cloudLock1`
- `cloudNetwork1`
- `cloudPhoneExchange`
- `cloudStorageDrive`
- `codeBarcodeScan`
- `codeQr`
- `codingFileExeTag`
- `codingFileIsoTag`
- `codingFilesNetworkFolder`
- `collaborationMeetingTeamFile`
- `collaborationTeamChat`
- `colorBrush1`
- `colorBrush2`
- `colorCrayon`
- `colorDropOff`
- `colorGradient`
- `colorPalette`
- `colorPaletteSample2`
- `colorPickerDrop`
- `colorSpray`
- `colorTriangle`
- `composition16To9`
- `compositionMan`
- `compositionParonamaHorizontal`
- `computerBug1`
- `concertCoupleDuet`
- `connectDeviceCancel`
- `connectDeviceExchange`
- `connectFlash`
- `contentBrowserEdit`
- `contentBrushPen`
- `contentPaperEdit`
- `contentTypewriter`
- `contentWrite`
- `controlsCameraOff`
- `controlsSliderToggleLeft`
- `controlsSliderToggleRight`
- `controlsSlidersVertical`
- `controlsVolumeKnob`
- `conversationChat`
- `conversationQuestionText1`
- `conversationQuestionWarning3`
- `copyPasteClipboard`
- `copyPasteCutScissors`
- `couponCut`
- `couponPercent`
- `creativityIdeaBulb`
- `creativityIdeaStrategy`
- `creditCard1`
- `creditCardAmex`
- `creditCardDollar`
- `creditCardMastercard`
- `creditCardPayment`
- `creditCardPhoneCall`
- `creditCardSmartphone`
- `creditCardVisa`
- `crmLeadDistribution`
- `cropExpand`
- `cropImage`
- `cryptoCloseUpGroupChatUsersConversation`
- `cryptoCurrencyBitcoinChip`
- `cryptoCurrencyBitcoinCode`
- `cryptoCurrencyBitcoinGive`
- `cryptoCurrencyBitcoinGraphIncrease`
- `cryptoCurrencyBitcoinMonitorShield`
- `cryptoCurrencyBitcoinNetworkGlobe`
- `cryptoCurrencyLitecoin`
- `cryptoCurrencyNamecoin`
- `cryptoCurrencyTether`
- `cryptoCurrencyUsdCoin`
- `cryptoMining`
- `currencyBagBath`
- `currencyBathIncrease`
- `currencyDollarBubble`
- `currencyDollarChip`
- `currencyDollarDecrease`
- `currencyDollarEuroChatBubble`
- `currencyEuroBubble`
- `currencyEuroDollarExchange`
- `currencyInternationalCurrency`
- `currencyPoundBubble`
- `currencyYenBubble`
- `cursorHighlightClick1`
- `cursorSpeed1`
- `customerActionComplaint`
- `customerActionProductMessage`
- `dashboardBrowserGauge`
- `dashboardLayout`
- `dataTransferDiagonal`
- `dataTransferDocumentModule`
- `dataTransferEdiReload`
- `dataTransferFtp`
- `dataTransferHorizontal`
- `dataTransferSync`
- `dataTransferVertical`
- `database`
- `databaseCheck`
- `databaseConnection`
- `databaseHand`
- `databaseHierarchy`
- `databaseNetwork1`
- `databaseSettings`
- `databaseShare`
- `deleteBin2`
- `deleteBin5`
- `deleteDisableBlock1`
- `deleteSkull`
- `designProcessDrawPen`
- `designProcessDrawingBoard`
- `designProcessDrawingBoardEducation`
- `designProcessFibonacci`
- `designProcessMousePen`
- `designProcessPenIdea`
- `designToolBrushRuler`
- `designToolLiquidGlue`
- `designToolMagicWand`
- `designToolPenBrushCup`
- `designToolPenPencilBrush`
- `designToolQuill`
- `designToolStamp`
- `deskComputerBaseWorkStandingUser1`
- `desktopActionMonitorAdd`
- `desktopActionMonitorEdit`
- `desktopActionMonitorQuestion`
- `desktopActionMonitorRemove`
- `desktopActionMonitorScreenSleep2`
- `desktopComputerPc`
- `desktopMonitor`
- `digitalPlayerPhoneSpeaker1`
- `disabilityAd`
- `disabilityBlindRead`
- `disabilityBraille`
- `disabilityCane1`
- `disabilityDownSyndromeRibbon`
- `disabilityHandsLanguage`
- `disabilityHearingT`
- `disabilityPartiallyBlind`
- `disabilityQccLine`
- `disabilityServiceDog`
- `disabilitySitPregnancy`
- `disabilityWalkingHelp1`
- `disabilityWheelchair3`
- `disabilityWheelchairWay`
- `discount50Percent`
- `discountCircleDash`
- `discountPercentBubble`
- `discountPercentIncreaseArrow`
- `discountPercentThin`
- `discountPointCoin`
- `discountSaleSign`
- `donationCharityDonateBag2`
- `donationCharityDonateBox`
- `donationCharityDonateHeartFlower`
- `downloadBrackets`
- `downloadHarddrive1`
- `drawerDownload`
- `drawerEnvelope`
- `drawerImage`
- `eCommerceAddBasketCloud`
- `eCommerceBasketMonitor`
- `eCommerceCartLaptop`
- `eCommerceCartVr`
- `eCommerceClickBuy`
- `eCommerceOnlineShop`
- `eCommerceTargetShoppingBag`
- `earpods`
- `earpodsAttention`
- `earpodsCharge`
- `earpodsTrueWireless`
- `editPenWritePaper`
- `editPencil`
- `editQuillFeather1`
- `emailActionDeleteJunk1`
- `emailActionDownload`
- `emailActionImage`
- `emailActionRemove`
- `emailActionReply1`
- `emailActionSearch`
- `emailActionSync1`
- `emailActionWarning`
- `emojiHandCheers`
- `envelopeLetterFront`
- `envelopePaperDocument`
- `envelopePigeon`
- `equalizerBarGraph`
- `equalizerPhoneApplication2`
- `equalizerStereoPlay`
- `equalizerVolumeGraph`
- `escalatorAscendPerson`
- `escalatorDescendPerson`
- `expandSmartphone`
- `faceIdMale1`
- `faceIdSquare`
- `faceIdUser`
- `familyBabyChangeDiaper`
- `familyChildPlayBallSign`
- `famousCharacterPokemon`
- `famousCharacterStarwarsR2d2`
- `faxMachinePaperPrint`
- `fileCode`
- `fileCode2`
- `fileCodeApk`
- `fileCodeCPlusPlus`
- `fileCodeCss`
- `fileCodeHtml`
- `fileCodeJava`
- `fileCodeJsJavascript`
- `fileCodeShare1`
- `fileCodeWarning1`
- `filter`
- `fireworks2`
- `flipReflectUp`
- `flipRight`
- `flipRotateClockwise`
- `flipUp`
- `floppyDisk`
- `focusCameraAuto`
- `focusCross`
- `focusFrameTarget1`
- `focusMotion`
- `formEditionClipboard`
- `formEditionClipboardCheck`
- `formEditionClipboardWrite`
- `formEditionFileAttach`
- `formEditionImageAttach`
- `formEditionNumber1`
- `formEditionText2`
- `formValidationCheckDouble`
- `formValidationCheckSquare1`
- `formValidationCursorChoose`
- `formValidationRemoveSquare`
- `garbageThrow`
- `gestureDoubleTap`
- `gestureSwipeTwoFingersHorizontal`
- `gestureZoomIn`
- `gpsLocationRectangle`
- `graphicTabletDraw1`
- `graphicTabletIntousDraw`
- `gridCornerRuler`
- `gridMonitor`
- `gridRuler`
- `gridSnapMagnet`
- `hardDriveExertnal1`
- `hardDriveWarning`
- `headphones1`
- `headphonesCable`
- `headphonesHuman`
- `helpHeadphonesCustomerSupport`
- `helpHeadphonesCustomerSupportHuman`
- `helpQuestionCircle`
- `hierarchy`
- `hierarchyWeb`
- `home`
- `homeChimney2`
- `homeToCloudSync`
- `humanResourcesBusinessman`
- `humanResourcesEmployeeCrownWoman`
- `humanResourcesHierarchy`
- `humanResourcesRatingMan`
- `imageFileDollar`
- `imageFileEdit`
- `imageFileFavoriteHeart`
- `imageFileSearch`
- `informationDesk`
- `informationDeskQuestionHelp`
- `instrumentAccordian`
- `instrumentElectronicKeyboard`
- `instrumentSaxophone`
- `ipodPlayer`
- `ipodPlayer2`
- `irisScanTarget`
- `jobBriefcaseDocument`
- `jobCandidateTarget1`
- `jobChooseCandidate`
- `jobProfileSearch`
- `jobSeachMan`
- `jobSearchMagnifierBriefcase`
- `keyboard`
- `keyboardArrowReturn`
- `keyboardAsterisk1`
- `keyboardAsterisk2`
- `keyboardCommand`
- `keyboardDeleteButton`
- `keyboardEjectButton`
- `keyboardIdDialFinger`
- `keyboardKeypadPullDown`
- `keyboardWireless`
- `kindleReadDocumentHold`
- `laptopActionFlash`
- `laptopActionLock`
- `laptopActionSearch`
- `laptopActionWarning`
- `laptopComputer1`
- `laptopComputerSmiley`
- `laundryHandWash`
- `laundryWashingMachine`
- `layersBringBackward`
- `layersOff`
- `layersStacked1`
- `layoutsArray1`
- `layoutsContent`
- `layoutsRight`
- `layoutsTopThreeColumns`
- `learningProgrammingBook`
- `learningProgrammingFlag`
- `lensHorizontal`
- `lensShutter1`
- `liftTwoPeopleElevator`
- `lightModeBrightnessHalf`
- `lightModeDarkLight`
- `lightModeFlashAuto`
- `lightModeHdr`
- `lightModeNightArchitecture`
- `lightSpotlight1`
- `lightUmbrellaReflect`
- `linkPaperclip`
- `listsBullets`
- `listsNumbers`
- `loadingBrowserBar`
- `loadingSpinningStar`
- `loadingStar1`
- `lockCancelSlash`
- `lockCircle`
- `lockKey1`
- `lockNetwork`
- `lockerRoomHangerWoman`
- `lockerRoomSuitcaseUmbrella`
- `lockerRoomWashHands`
- `loginLogoutKey`
- `loginRectangle`
- `mailboxFull1`
- `mailboxPost1`
- `maskDiamond`
- `mediaProtectionShield`
- `meetingCoWorking2`
- `meetingPresentation`
- `meetingUserManStress`
- `memoryComputerRam`
- `memoryFlashDrive`
- `memorySdCard`
- `memorySdCardCheck`
- `memorySdCardSearch`
- `memorySdCardSettings`
- `memorySdCardSync`
- `menuNavigation2`
- `menuNavigationHorizontal`
- `messagesBubbleImage`
- `messagesBubbleMenu`
- `messagesBubbleSettings`
- `messagesBubbleSmile`
- `messagesBubbleSmsBlock1`
- `messagesBubbleSquareGraph`
- `messagesBubbleSquareLock`
- `messagesBubbleSquareSearch`
- `messagesBubbleSquareSettings`
- `messagesBubbleSquareText`
- `messagesPeoplePersonBubbleSquare2`
- `messagesPeopleUserBubble`
- `messagesPeopleWomanHeart`
- `microphone`
- `microphoneKaraoke1`
- `microphoneOff`
- `microprocessorComputerChip32Bit`
- `microprocessorComputerChip64Bit`
- `microprocessorComputerChipFlash`
- `microprocessorComputerChipOverheat`
- `microprocessorComputerChipProcessor`
- `microprocessorComputerChipSearch`
- `mobilePhoneBlackberry2`
- `mobilePhoneHandHold`
- `mobilePhoneSmartphone`
- `mobilePhoneWrite`
- `mobileShoppingCart`
- `mobileShoppingShopBasket`
- `mobilephoneActionBlutooth`
- `mobilephoneActionCamera`
- `mobilephoneActionCash`
- `mobilephoneActionLocationLock`
- `mobilephoneActionLock`
- `mobilephoneActionNavigationMap`
- `mobilephoneActionNotificationAllowed`
- `mobilephoneActionOtpMessage`
- `mobilephoneActionSettings`
- `mobilephoneActionVoiceApproved`
- `modernCameraGoPro`
- `modernMusicBassGuitar`
- `modernMusicDj`
- `modernMusicDrums`
- `modernMusicMixTouch`
- `modernPaymentContactless`
- `modernPaymentDesktopTransaction`
- `modernPaymentEWallet`
- `modernPaymentQrBasket`
- `modernPaymentSelfCheckoutTouch`
- `modernPaymentWirelessSmartphone`
- `moduleBuildingBlocks`
- `moduleThreeBoxes`
- `monetizationBillMagnet`
- `monetizationMouse`
- `moneyAtmWithdraw`
- `moneyBag`
- `moneyBagDollar`
- `moneyBagEuro`
- `moneyBillFly`
- `moneyCashBill`
- `moneyCashBillStack`
- `moneyCoinCash`
- `moneyCoinPurse`
- `moneyCoinStack`
- `moneyWallet`
- `mouse`
- `mouseWireless1`
- `moveCrossOver`
- `moveRectangleLeft`
- `moveScrollOmnidirectionButton`
- `moviesClapboard`
- `moviesHotTrending`
- `moviesReelRating`
- `movingWalkwayLuggage1`
- `multimediaControlsButtonNext`
- `multimediaControlsLoopArrow`
- `multimediaControlsLoopArrow1`
- `multimediaControlsSingleTrack`
- `musicBasket`
- `musicClef`
- `musicGenreRomanticCd`
- `musicMetronom`
- `musicNote1`
- `musicNoteCircleBlock1`
- `navigationPageRight`
- `network`
- `networkConnectionLocked`
- `networkConnector`
- `networkLaptop1`
- `networkMonitorHierarchy`
- `networkMonitorTeam1`
- `networkMonitorTransferArrow1`
- `networkRouterSignal1`
- `networkRouterSignalDouble`
- `newspaperFold`
- `newspaperReadMan`
- `nightClubDiscoBall1`
- `notesAdd`
- `notesBook`
- `notesBook1`
- `notesHand`
- `notesPaper`
- `notesQuill`
- `officeBuildingGlassWindow`
- `officeBuildingOutdoors`
- `officeBusinessCard`
- `officeDesk1`
- `officeDeskLamp`
- `officeFileSheet`
- `officeFileText`
- `officeFileTextGraph`
- `officeFolder`
- `officePaperBinder`
- `officePhotocopyMachine2`
- `officeShredder1`
- `officeStampDocument`
- `officeStapler1`
- `officeTape2`
- `officeWaterDispenser`
- `officeWorkWireless`
- `optimizationConfiguration`
- `optimizationGraphSettings`
- `organizationFiles`
- `paginateFilterMail`
- `paginateFilterMusic`
- `paragraphsBullets`
- `paragraphsImageRight`
- `paragraphsIndent`
- `paragraphsIndentLastLine`
- `paragraphsIndentLeft`
- `paragraphsInsertImageTop`
- `paragraphsSymbol`
- `partyAlchoholicDrink`
- `partyBalloon`
- `partyDecorationBanner1`
- `passwordApproved`
- `passwordDesktopLockApproved`
- `passwordType`
- `pathfinderMerge`
- `performanceIncreaseClipboard`
- `performancePresentationGraph`
- `phoneActions24HoursCall`
- `phoneActionsBluetooth`
- `phoneActionsMerge`
- `phoneActionsOff`
- `phoneActionsRinging`
- `phoneActionsWaitHold`
- `phoneBook`
- `phoneBooth`
- `phoneCameraRearQuardruple`
- `phoneDial`
- `phoneOff`
- `phoneRetro1`
- `phoneRing`
- `phoneSelfieFront`
- `photoFrameHang`
- `photoFrameLandscape`
- `pictureDoubleLandscape`
- `picturePolaroidFour`
- `picturePolaroidHide`
- `pictureStackLandscape`
- `playlistAlbum1`
- `playlistCloud`
- `playlistMenu`
- `playlistSquareSync`
- `pluginHandsPuzzle`
- `pluginJigsawPuzzle`
- `podcastMicrophoneInternational1`
- `powerButton`
- `powerSupplyBatteryCharge`
- `powerSupplyPlug`
- `powerSupplyWallSocket1`
- `presentationAnalytics`
- `presentationAudience`
- `presentationBoardGraph`
- `presentationPodiumNotes`
- `presentationProjector`
- `presentationProjectorScreenBars`
- `presentationProjectorScreenBudgetAnalytics`
- `presentationScreen`
- `printText`
- `productLaunchGoSign`
- `productLaunchLaptop`
- `productsPurse`
- `productsPurse2`
- `productsShoppingBags`
- `programmingBrowser`
- `programmingCodeIdea`
- `programmingFlowchart`
- `programmingHoldCode`
- `programmingKeyboardType`
- `programmingLanguageBookmarkJavascript`
- `programmingLanguageBrowserCss`
- `programmingLanguageBrowserHtml`
- `programmingLanguageCss3`
- `programmingLanguageHtml5`
- `programmingLanguageScriptLock`
- `programmingMonitor`
- `programmingSearch`
- `programmingTeamChat`
- `programmingUserCode`
- `programmingUserHeadMatrix`
- `pushNotification2`
- `pushNotificationAlert1`
- `qrCodeScan1`
- `radioAntennaHandle`
- `radioStereo`
- `readEmailAtSymbol`
- `readEmailTarget`
- `receipt`
- `receiptCashRegisterPrint`
- `receiptViewPricing`
- `removeDeleteSignBold`
- `removeSubtractSignBold`
- `reorderUp`
- `resizeArrowExpandVertical1`
- `resizeArrowRetractHorizontal`
- `resizeExpandArrow`
- `resizeShrink1`
- `responsiveDesignExpand`
- `responsiveDesignHand`
- `responsiveDesignMonitorPhone`
- `retouchContrast`
- `retouchCutEdit`
- `retouchFace`
- `retouchMagicWand`
- `retouchSaturation`
- `retouchSticker`
- `retractShrinkArrow`
- `rolePlayingGamesIconWeaponEquipmentCrateChest`
- `rotateLockSmartphone`
- `rotateSmartphone`
- `rulerT`
- `safety911Call`
- `safetyCallFirefighters1`
- `safetyDangerMudslide`
- `safetyDrownHand`
- `safetyExitDoor`
- `safetyExitSign`
- `safetyFireExit`
- `safetyFireExtinguisher`
- `safetySignDangerSlippery`
- `safetySignElectricity`
- `safetyWarningRadioactive`
- `savingBagIncrease`
- `savingBank`
- `savingBankCash`
- `savingBankInternational`
- `savingBearMarket`
- `savingBearMarketGraphBars`
- `savingBullMarket`
- `savingBullMarketGraphBars`
- `savingMoneySeedling`
- `savingPiggyBank`
- `savingSafe`
- `savingWalletInternational`
- `scanner`
- `screenCurved`
- `scrollVerticalSmartphone`
- `searchMagnifier`
- `seatVip`
- `securityComputerShield`
- `securityGdprBrowser`
- `securityItService`
- `securityNetworkChain`
- `securityPhoneProtectionApproved`
- `securityShieldNetwork`
- `securityShieldSettings`
- `securityShieldWall`
- `securityUserLock`
- `selectTargetCrosshair1`
- `sendEmailFly`
- `sendEmailPaperPlane1`
- `sendEmailPopUp`
- `seoEyeNetwork`
- `seoSearchGraph`
- `server2`
- `serverApiCloud`
- `serverEdit`
- `serverError404NotFound`
- `serverHand`
- `serverLock`
- `serverSftpFolder`
- `settingsCog`
- `settingsCogDouble1`
- `settingsHammer`
- `settingsScrewdriver`
- `settingsWrenchDouble`
- `shapeCube`
- `shapePyramid`
- `shareCircles`
- `shareForward`
- `shareMegaphone`
- `shareRadar`
- `shareUserSignal1`
- `shop`
- `shopCart`
- `shopCashier`
- `shopClose`
- `shopLike`
- `shopOpen`
- `shopSign`
- `shopStreetSign`
- `shoppingBagBarcode`
- `shoppingBagBiodegradable1`
- `shoppingBagDutyFree`
- `shoppingBagNoPlastic`
- `shoppingBagSad`
- `shoppingBagSide`
- `shoppingBagTarget`
- `shoppingBasket1`
- `shoppingBasketArrowIn`
- `shoppingBasketArrowOut`
- `shoppingBasketFavoriteStar`
- `shoppingBasketLike`
- `shoppingBasketRating`
- `shoppingBasketSearch`
- `shoppingBasketSmile1`
- `shoppingCartTrolley`
- `shoppingCartTrolleyCheck`
- `shoppingCartTrolleyDownload`
- `shoppingCartTrolleyFull`
- `shoppingCartTrolleyUpload`
- `showHatMagician`
- `showTheaterDrama`
- `signalLow`
- `simCard`
- `smartWatchBand2`
- `smartWatchCircle`
- `smartWatchCircleBluetooth`
- `smartWatchCircleGraphLine`
- `smartWatchCircleLocation`
- `smartWatchSquare`
- `smartWatchSquareBellAlternate`
- `smartWatchSquareGraphAlternate`
- `smartWatchSquareMicrophoneAlternate`
- `smartWatchSquareNavigationAlternate`
- `smartWatchWrist`
- `smartphoneAppWidgetAdd`
- `smartphoneAppWidgetRemove`
- `smartphoneAppWidgetStock`
- `smartphoneAppWidgetTranslator`
- `smileyBlessed`
- `smileyBlush`
- `smileyCheeky`
- `smileyCrazy`
- `smileyCryingRainbow`
- `smileyDizzy`
- `smileyEyesOnly`
- `smileyGrumpy`
- `smileyHappy`
- `smileyInTrouble`
- `smileyKissHeart`
- `smileyLol`
- `smileyPetrified`
- `smileyRich`
- `smileyShineBigEyes`
- `smileySickContageous`
- `smileySmile2`
- `smileyThrilled`
- `smileyThumbsUp`
- `smileyWink`
- `smileyZipped`
- `speaker`
- `speakerStand`
- `stairsAscend`
- `stairsDescend`
- `stampsPortrait`
- `statsLineGraphCircle`
- `strategyBusinessSuccessPeak`
- `strategyTargetCenterPhone`
- `swimmingPoolPerson`
- `synchronizeArrows`
- `synchronizeArrowsWarning`
- `tabletApplication`
- `tagHotPrice`
- `tagNewCircle`
- `tagSalePrice`
- `tagsDouble`
- `takingPicturesCircle`
- `takingPicturesMan`
- `tapeCassette1`
- `taskClipboardCheck`
- `taskListClipboardCheck`
- `taskListClipboardClock`
- `taskListClipboardFavoriteStar`
- `taskListClipboardShare`
- `taskListPen`
- `taskListPin1`
- `terminal`
- `textFormatingAlignBottom`
- `textFormatingArrangeSpacing`
- `textFormatingEraser2`
- `textFormatingFontSize`
- `textFormatingHash`
- `textFormatingInput`
- `textFormatingOpenQuote`
- `textFormatingRotateAngle`
- `textFormatingRotateVertical`
- `textFormatingSquare`
- `textFormatingSubscript`
- `timeClock24Hrs2`
- `timeClockCircle`
- `timeClockNineTwentyFive1`
- `timeClockShare1`
- `timeClockSquare`
- `timeHourglassTriangle`
- `timeStopwatch`
- `timeWristWatch1`
- `timerCountdownTen`
- `toiletHandDryer`
- `toiletNoTrashThrow`
- `toiletPaper`
- `toiletSign`
- `touchIdFingerprintLock1`
- `touchIdFingerprintSquare`
- `tradingGraph`
- `transferPicturesLaptopSmartphone`
- `transferPicturesSent`
- `transferPicturesSmartphone`
- `transformRight`
- `uiBrowserSlider`
- `uiPageScroll`
- `uiPhoneSliderVertical`
- `uiStepIndicator2`
- `uiWebpageBullets`
- `uiWebpageSliderCursor`
- `unlinkBrokenChain1`
- `unlockCircle`
- `uploadBrackets`
- `uploadMenu`
- `vectorsAddAnchor`
- `vectorsAnchorRectangle`
- `vectorsPathFlat`
- `vectorsPenAdd1`
- `vectorsPenDraw`
- `vibrateSmartphone`
- `videDocumentAvi`
- `videDocumentMov`
- `videoEditEffects`
- `videoEditPlay`
- `videoEditSlowMotion`
- `videoEditSplit`
- `videoFileCamera`
- `videoGame360Vr`
- `videoGameBreakout`
- `videoGameControlGear`
- `videoGameController`
- `videoGameControllerTeam`
- `videoGameControllerWifi`
- `videoGameHatchi`
- `videoGameMarioMushroom1`
- `videoGameNintendo`
- `videoGamePacman`
- `videoGameTetris`
- `videoGamesDeviceSwitchJoyController`
- `videoMeetingCameraBrowser`
- `videoMeetingMonitorWebcam`
- `videoMeetingTeamMonitorMan`
- `videoPlayerMovie`
- `videoPlayerSlider`
- `videoPlayerSmartphoneHorizontal`
- `viewBinocular`
- `viewEye1`
- `viewEyeOff`
- `vintageCameraPolaroid`
- `vintageTv1`
- `vinylRecordGramophone`
- `vinylRecordPlayer2`
- `voiceIdApproved`
- `voiceIdSmartphone`
- `voiceIdUser`
- `volumeControlDown1`
- `volumeControlMedium1`
- `volumeControlUp1`
- `waitingRoomClock`
- `walkingSymbol`
- `walkmanPlayer`
- `waterFountainDrink`
- `waterFountainSink`
- `wealthCrystalShine`
- `wealthGoldBars`
- `wealthPearlRing`
- `wealthTimeMoney`
- `wealthTreasureChestOpen`
- `webcam`
- `webcamOff1`
- `websiteDevelopmentBrowserComWeb`
- `websiteDevelopmentBrowserHand`
- `websiteDevelopmentBrowserPageLayout`
- `websiteDevelopmentBrowserSourceCode`
- `websiteDevelopmentBuild`
- `websiteDevelopmentCodeFlowchart1`
- `websiteDevelopmentMonitorWwwWeb`
- `wifiLaptop`
- `wifiMonitor1`
- `wifiOn`
- `wirelessHouseSignal`
- `wirelessSignalRssFeed`
- `wirelessTowerBuilding`
- `wirelessWifiSignalAntenna`
- `wirelessWifiSignalPole`
- `workFromHomeTravelOffice`
- `workFromHomeUserPetCat`
- `workerLayOffFiredUserFinger1`
- `workflowCollaborate`
- `worldwideWebBrowser`
- `worldwideWebDisable`
- `worldwideWebLocationPin`
- `worldwideWebNetworkWww`
- `worldwideWebPhone`
- `worldwideWebSync`
- `worldwideWebUsers`
- `zoomInMagnifier1`
- `zoomOutMagnifier1`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccessoriesRemoteShutterIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccessoriesRetroFilm1Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccountingAbacusIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccountingCalculatorIcon size="20" class="nav-icon" /> Settings</a>
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
<AccessoriesRemoteShutterIcon
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
    <AccessoriesRemoteShutterIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccessoriesRetroFilm1Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccountingAbacusIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccessoriesRemoteShutterIcon size="24" />
   <AccessoriesRetroFilm1Icon size="24" color="#4a90e2" />
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
   <AccessoriesRemoteShutterIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccessoriesRemoteShutterIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccessoriesRemoteShutterIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessoriesRemoteShutter } from '@stacksjs/iconify-streamline-freehand'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessoriesRemoteShutter, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessoriesRemoteShutter } from '@stacksjs/iconify-streamline-freehand'

// Icons are typed as IconData
const myIcon: IconData = accessoriesRemoteShutter
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-freehand/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-freehand/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
