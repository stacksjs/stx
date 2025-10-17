# Pixel free icons

> Pixel free icons icons for stx from Iconify

## Overview

This package provides access to 662 icons from the Pixel free icons collection through the stx iconify integration.

**Collection ID:** `streamline-pixel`
**Total Icons:** 662
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-pixel
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<BeautyBarberLightSignIcon height="1em" />
<BeautyBarberLightSignIcon width="1em" height="1em" />
<BeautyBarberLightSignIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<BeautyBarberLightSignIcon size="24" />
<BeautyBarberLightSignIcon size="1em" />

<!-- Using width and height -->
<BeautyBarberLightSignIcon width="24" height="32" />

<!-- With color -->
<BeautyBarberLightSignIcon size="24" color="red" />
<BeautyBarberLightSignIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<BeautyBarberLightSignIcon size="24" class="icon-primary" />

<!-- With all properties -->
<BeautyBarberLightSignIcon
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
    <BeautyBarberLightSignIcon size="24" />
    <BeautyBeardStyleIcon size="24" color="#4a90e2" />
    <BeautyBodyCareSnailIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { beautyBarberLightSign, beautyBeardStyle, beautyBodyCareSnail } from '@stacksjs/iconify-streamline-pixel'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(beautyBarberLightSign, { size: 24 })
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
<BeautyBarberLightSignIcon size="24" color="red" />
<BeautyBarberLightSignIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<BeautyBarberLightSignIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<BeautyBarberLightSignIcon size="24" class="text-primary" />
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
<BeautyBarberLightSignIcon height="1em" />
<BeautyBarberLightSignIcon width="1em" height="1em" />
<BeautyBarberLightSignIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<BeautyBarberLightSignIcon size="24" />
<BeautyBarberLightSignIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlinePixel-icon {
  width: 1em;
  height: 1em;
}
```

```html
<BeautyBarberLightSignIcon class="streamlinePixel-icon" />
```

## Available Icons

This package contains **662** icons:

- `beautyBarberLightSign`
- `beautyBeardStyle`
- `beautyBodyCareSnail`
- `beautyBodyCareSunScreen`
- `beautyCosmaticBrushSet`
- `beautyCosmaticLipStick`
- `beautyHealthyFoodDish`
- `beautyMirror1`
- `beautyMirror2`
- `beautyNailPolish`
- `beautyPerfume1`
- `beautyPerfume2`
- `buildingRealEastateDealDocumant`
- `buildingRealEastateForSale`
- `buildingRealEastateHouse1`
- `buildingRealEastateHouse2`
- `buildingRealEastateHousesLocation`
- `buildingRealEastateLocation`
- `buildingRealEastateProjectBlueprint`
- `buildingRealEastateSignForRent`
- `buildingRealEastateSignHouse1`
- `buildingRealEastateSignHouse2`
- `buildingRealEastateStorage`
- `businessMoneyCoinCurrency`
- `businessProdectDiamond`
- `businessProductCheck`
- `businessProductPiggyBank`
- `businessProductPriceTag`
- `businessProductReportPresentGrahp`
- `businessProductScale`
- `businessProductStartup1`
- `businessProductStartup2`
- `businessProductTarget`
- `businessProductsBag`
- `businessProductsBag1`
- `businessProductsBagMoney`
- `businessProductsBoatSuccess`
- `businessProductsCashSearch`
- `businessProductsCashShield`
- `businessProductsCashUserManMessage`
- `businessProductsClimbTop`
- `businessProductsDataFileBars`
- `businessProductsDealHandshake`
- `businessProductsFactory`
- `businessProductsMagicRabbit`
- `businessProductsMoney`
- `businessProductsNetworkUser`
- `businessProductsPerformanceMoneyDecrease`
- `businessProductsPerformanceMoneyIncrease`
- `businessProductsSafe`
- `businessProductsTreasure`
- `businessProductsWalletMoney`
- `changeCleanEnergy`
- `chatEmail`
- `codingAppWebsiteUi`
- `codingAppsWebsites`
- `codingAppsWebsites404Error`
- `codingAppsWebsitesAndroid`
- `codingAppsWebsitesBrowserBugs2`
- `codingAppsWebsitesConference`
- `codingAppsWebsitesConstuction`
- `codingAppsWebsitesDatabase`
- `codingAppsWebsitesDinosaurError`
- `codingAppsWebsitesFavoriteRate`
- `codingAppsWebsitesFinder`
- `codingAppsWebsitesFirewall`
- `codingAppsWebsitesLiveStatus`
- `codingAppsWebsitesMobile`
- `codingAppsWebsitesModule`
- `codingAppsWebsitesMusicPlayer`
- `codingAppsWebsitesPhoneTablet`
- `codingAppsWebsitesPlugin`
- `codingAppsWebsitesProgrammingBrowser`
- `codingAppsWebsitesProgrammingBrowserBugs1`
- `codingAppsWebsitesProgrammingBug`
- `codingAppsWebsitesProgrammingHoldCode`
- `codingAppsWebsitesSearchBug`
- `codingAppsWebsitesSettingComputer`
- `codingAppsWebsitesShieldLock`
- `codingAppsWebsitesSolves`
- `computerOldElectronics`
- `computerOldElectronicsBug`
- `computersDevicesElectronicsBatteryCharge`
- `computersDevicesElectronicsBoard`
- `computersDevicesElectronicsChipset`
- `computersDevicesElectronicsClickSelectTablet`
- `computersDevicesElectronicsDesktop`
- `computersDevicesElectronicsEarpodSound`
- `computersDevicesElectronicsFlashDrive1`
- `computersDevicesElectronicsFlashDrive2`
- `computersDevicesElectronicsGraphicTablet`
- `computersDevicesElectronicsGraphicTabletDraw`
- `computersDevicesElectronicsHarddisk`
- `computersDevicesElectronicsKeyboard`
- `computersDevicesElectronicsKeyboardButton`
- `computersDevicesElectronicsKeyboardPad`
- `computersDevicesElectronicsKeyboardWireless`
- `computersDevicesElectronicsLaptop`
- `computersDevicesElectronicsMemory`
- `computersDevicesElectronicsMobileQrScan`
- `computersDevicesElectronicsMonitor`
- `computersDevicesElectronicsMouse`
- `computersDevicesElectronicsSmartWatch`
- `computersDevicesElectronicsTablet`
- `computersDevicesElectronicsTapeCassette`
- `computersDevicesElectronicsTelevisionVintage`
- `computersDevicesElectronicsVintageMac`
- `computersDevicesElectronicsWebcam`
- `computersDevicesElectronicscdDisk`
- `computersDevicesElectronicsmicrochipBoard`
- `constructionBuildingRealEastate`
- `contentFilesArchiveBooks1`
- `contentFilesArchiveBooks2`
- `contentFilesArchiveBooks3`
- `contentFilesBook`
- `contentFilesBookLibrary`
- `contentFilesBooks1`
- `contentFilesBooks2`
- `contentFilesCloseBookBookmark`
- `contentFilesDrawContent`
- `contentFilesFavoriteBook`
- `contentFilesFolderOpen`
- `contentFilesNewspaper`
- `contentFilesNote`
- `contentFilesNoteBook`
- `contentFilesNotepad`
- `contentFilesOpenBook`
- `contentFilesOpenBookBookmark`
- `contentFilesPdf`
- `contentFilesPen`
- `contentFilesPencilBrush`
- `contentFilesPencilRuler`
- `contentFilesPhoneBook`
- `contentFilesQuillInk`
- `contentFilesStickyNotepad1`
- `contentFilesStickyNotepad2`
- `contentFilesTypingMachine`
- `contentFilesWriteNote`
- `cursorHand`
- `designArtboardShapes`
- `designColorBrushPaint`
- `designColorBucket`
- `designColorBucketBrush`
- `designColorPaintingPalette`
- `designColorPaletteSample`
- `designColorSpray`
- `designColorTubePastel`
- `designCropEditPicture`
- `designDrawingBoard`
- `designDropper1`
- `designDropper2`
- `designHalfCircleRuler`
- `designHilight`
- `designInkPen`
- `designLayer`
- `designMagicWand`
- `designPencil`
- `designRuler`
- `designStamp`
- `designVectorsPenNewAnchor`
- `ecologyBush`
- `ecologyCactus`
- `ecologyCleanBattery`
- `ecologyCleanCarCableCharge`
- `ecologyGlobalHouse`
- `ecologyGlobalWarmingGlobe`
- `ecologyGlobalWarmingGlobeFire`
- `ecologyGmoFoodFruit`
- `ecologyGrowthPlant`
- `ecologyLeafBug`
- `ecologyNuclearEnergy`
- `ecologyOrganicSunGrowth`
- `ecologyPlantGrowthSoilNature`
- `ecologyRenewableEnergySolarPanel`
- `ecologyRenewableEnergyWindTurbine`
- `ecologySolarCell`
- `ecologyTree`
- `ecologyWindmill1`
- `ecologyWindmill2`
- `ecologyWoodPlantGrow`
- `emailChatThink`
- `emailEmojiSmileSmart`
- `emailEnvelope`
- `emailEnvelopeClose`
- `emailEnvelopeOpen`
- `emailForwardMail`
- `emailMailChat`
- `emailMailOpenAddress`
- `emailMailbox`
- `emailMailboxClose`
- `emailMailboxOpen`
- `emailStampMail`
- `emailTray`
- `entertainmentEventsHobbiesBoardGameDice`
- `entertainmentEventsHobbiesBomb`
- `entertainmentEventsHobbiesCardGameCardClub`
- `entertainmentEventsHobbiesChessKnight`
- `entertainmentEventsHobbiesChessPawn`
- `entertainmentEventsHobbiesChessRook`
- `entertainmentEventsHobbiesFilmCamrea`
- `entertainmentEventsHobbiesFilmPlayer`
- `entertainmentEventsHobbiesFilmRoll`
- `entertainmentEventsHobbiesGameMachinesArcade1`
- `entertainmentEventsHobbiesGameMachinesArcade2`
- `entertainmentEventsHobbiesGamePoolSnookerBall`
- `entertainmentEventsHobbiesGlasses3d`
- `entertainmentEventsHobbiesHorrorGhost`
- `entertainmentEventsHobbiesPopcorn`
- `entertainmentEventsHobbiesRecordPlayer`
- `entertainmentEventsHobbiesRewardWinnerTalent`
- `entertainmentEventsHobbiesTicket`
- `entertainmentEventsHobbiesVideoCameraFilm1`
- `entertainmentEventsHobbiesVideoCameraFilm2`
- `entertainmentEventsHobbiesVideoCameraFilm3`
- `entertainmentEventsHobbiesVideoMovieProducerDirectorChair`
- `foodDrinkBread`
- `foodDrinkCoffee`
- `foodDrinkCoffeeCup`
- `foodDrinkDesertCake`
- `foodDrinkDesertCakePond`
- `foodDrinkDesertCottonCandy`
- `foodDrinkDesertCupcake`
- `foodDrinkDesertDonut`
- `foodDrinkDesertIcecream`
- `foodDrinkEgg`
- `foodDrinkFish`
- `foodDrinkFishBone`
- `foodDrinkFriedChicken`
- `foodDrinkFruitCherry`
- `foodDrinkHamburger`
- `foodDrinkMilk`
- `foodDrinkPizza`
- `foodDrinkRiceBall`
- `foodDrinkSushi`
- `foodDrinkTea`
- `hand`
- `handAwesome`
- `handCrossFingerHeart`
- `handDislike`
- `handFight2Finger`
- `handFiist`
- `handFour`
- `handFuckMiddleFinger`
- `handGestureFingerClick`
- `handLike`
- `handLittleFinger`
- `handLove`
- `handLoveSign`
- `handOk`
- `handPoint`
- `handThreeFinger`
- `handWriting`
- `handZombie`
- `handZoom`
- `healthAmbulanceCall`
- `healthAmbulanceCar`
- `healthAntiVirus`
- `healthBandage`
- `healthBloodDropType`
- `healthBrain1`
- `healthBrain2`
- `healthDentistryTooth`
- `healthDrugMedicine`
- `healthDrugMedicineBagAid1`
- `healthDrugMedicineBagAid2`
- `healthDrugMedicineWater`
- `healthDrugsCannabis`
- `healthDrugsPill`
- `healthHealthDead`
- `healthHospitalBuilding1`
- `healthHospitalBuilding2`
- `healthInjection`
- `healthLaboratory`
- `healthLaboratoryTestBloodSugar`
- `healthLaboratoryTestStoolCup`
- `healthMedicalNotes`
- `healthMonitorHeartBeat`
- `healthStool`
- `healthTransfusionBag`
- `healthVirus`
- `interfaceEssentialAlarmBellOff`
- `interfaceEssentialAlarmBellSleep`
- `interfaceEssentialAlert`
- `interfaceEssentialAlertCaution`
- `interfaceEssentialAlertCircle1`
- `interfaceEssentialAlertCircle2`
- `interfaceEssentialAlertTriangle1`
- `interfaceEssentialAlertTriangle2`
- `interfaceEssentialBattery`
- `interfaceEssentialBin`
- `interfaceEssentialBlutooth`
- `interfaceEssentialBookmark`
- `interfaceEssentialBookmark1`
- `interfaceEssentialCalendarAppointment`
- `interfaceEssentialCalendarDate`
- `interfaceEssentialCallCenterContactHelp`
- `interfaceEssentialClip1`
- `interfaceEssentialClip2`
- `interfaceEssentialClock`
- `interfaceEssentialCloundDownload`
- `interfaceEssentialCogBrowser`
- `interfaceEssentialCogDouble`
- `interfaceEssentialCogHandGive`
- `interfaceEssentialCogSearch`
- `interfaceEssentialCrown`
- `interfaceEssentialCursor`
- `interfaceEssentialCursorClickPoint`
- `interfaceEssentialCursorSelect`
- `interfaceEssentialDialPad1`
- `interfaceEssentialDialPad2`
- `interfaceEssentialDialPadFinger1`
- `interfaceEssentialDialPadFinger2`
- `interfaceEssentialDirectionButton`
- `interfaceEssentialEditFill`
- `interfaceEssentialEraser`
- `interfaceEssentialExpand1`
- `interfaceEssentialExpand2`
- `interfaceEssentialExpand3`
- `interfaceEssentialFaceId`
- `interfaceEssentialFaceId1`
- `interfaceEssentialFileError`
- `interfaceEssentialFilter`
- `interfaceEssentialFindText`
- `interfaceEssentialFingerPrintScan`
- `interfaceEssentialFlag`
- `interfaceEssentialFlash`
- `interfaceEssentialFlipVerticalDown`
- `interfaceEssentialFlipVerticalUp`
- `interfaceEssentialFloppyDisk`
- `interfaceEssentialGlobalPublic`
- `interfaceEssentialHammer1`
- `interfaceEssentialHammer2`
- `interfaceEssentialHeartFavorite`
- `interfaceEssentialHierarchy1`
- `interfaceEssentialHierarchy2`
- `interfaceEssentialHierarchy3`
- `interfaceEssentialHierarchy4`
- `interfaceEssentialHierarchy5`
- `interfaceEssentialHierarchyFiles`
- `interfaceEssentialHome1`
- `interfaceEssentialHome2`
- `interfaceEssentialHyperlink`
- `interfaceEssentialInformationCircle1`
- `interfaceEssentialInformationCircle2`
- `interfaceEssentialIrisScan`
- `interfaceEssentialIrisScanApproved`
- `interfaceEssentialKey`
- `interfaceEssentialKey1`
- `interfaceEssentialKeyLock`
- `interfaceEssentialKeyLogin`
- `interfaceEssentialKeyboardButtonDirection1`
- `interfaceEssentialKeyboardButtonDirection2`
- `interfaceEssentialLightBulb`
- `interfaceEssentialLink`
- `interfaceEssentialLinkBroken1`
- `interfaceEssentialLinkBroken2`
- `interfaceEssentialList`
- `interfaceEssentialLoading0Percent`
- `interfaceEssentialLoading0Percent1`
- `interfaceEssentialLoading100Percent`
- `interfaceEssentialLoading100Percent1`
- `interfaceEssentialLoading20Percent`
- `interfaceEssentialLoading25Percent1`
- `interfaceEssentialLoading50Percent`
- `interfaceEssentialLoading50Percent1`
- `interfaceEssentialLoading75Percent1`
- `interfaceEssentialLoading80Percent`
- `interfaceEssentialLoadingCircle1`
- `interfaceEssentialLoadingCircle2`
- `interfaceEssentialLoadingStatus`
- `interfaceEssentialLock`
- `interfaceEssentialLock1`
- `interfaceEssentialLockDoorOut`
- `interfaceEssentialLockShield`
- `interfaceEssentialMagnet`
- `interfaceEssentialMap`
- `interfaceEssentialMessage`
- `interfaceEssentialMicrophone`
- `interfaceEssentialMove`
- `interfaceEssentialNavigationLeftCircle1`
- `interfaceEssentialNavigationLeftCircle2`
- `interfaceEssentialNavigationMenu1`
- `interfaceEssentialNavigationMenu2`
- `interfaceEssentialNavigationMenu3`
- `interfaceEssentialNavigationRightCircle1`
- `interfaceEssentialNavigationRightCircle2`
- `interfaceEssentialNoteMusic`
- `interfaceEssentialNotificationAlert`
- `interfaceEssentialPacmanLoading`
- `interfaceEssentialPaginateFilterCamera`
- `interfaceEssentialPaginateFilterHeart`
- `interfaceEssentialPaginateFilterMusic`
- `interfaceEssentialPaginateFilterPicture`
- `interfaceEssentialPaginateFilterVideo`
- `interfaceEssentialPasswordType`
- `interfaceEssentialPencilEdit1`
- `interfaceEssentialPencilEdit2`
- `interfaceEssentialPieChartPollReport1`
- `interfaceEssentialPieChartPollReport2`
- `interfaceEssentialPin`
- `interfaceEssentialPoll`
- `interfaceEssentialPrint`
- `interfaceEssentialProfileFemale`
- `interfaceEssentialProfileMale`
- `interfaceEssentialProtectGuard`
- `interfaceEssentialProtectRubberRing`
- `interfaceEssentialQuestionHelpCircle1`
- `interfaceEssentialQuestionHelpCircle2`
- `interfaceEssentialQuestionHelpSquare`
- `interfaceEssentialRecycle`
- `interfaceEssentialReflectDown`
- `interfaceEssentialReflectDownUp`
- `interfaceEssentialRefresh`
- `interfaceEssentialSafariCompass`
- `interfaceEssentialSatellite`
- `interfaceEssentialScisor`
- `interfaceEssentialScrollHorizontal`
- `interfaceEssentialScrollVertical`
- `interfaceEssentialSearch1`
- `interfaceEssentialSearchBinocular`
- `interfaceEssentialSearchCheck`
- `interfaceEssentialSearchRemove`
- `interfaceEssentialSendMail`
- `interfaceEssentialSettingCog`
- `interfaceEssentialSettingSlide`
- `interfaceEssentialSettingsToggleHorizontal`
- `interfaceEssentialShare1`
- `interfaceEssentialShare2`
- `interfaceEssentialShare3`
- `interfaceEssentialShrink1`
- `interfaceEssentialShrink2`
- `interfaceEssentialShrink3`
- `interfaceEssentialShrink4`
- `interfaceEssentialSigninExpand`
- `interfaceEssentialSigninLogin`
- `interfaceEssentialSignoutLogout`
- `interfaceEssentialSkull1`
- `interfaceEssentialSkull2`
- `interfaceEssentialSound`
- `interfaceEssentialSpeakerAnnounce`
- `interfaceEssentialStat`
- `interfaceEssentialStopSign1`
- `interfaceEssentialStopSign2`
- `interfaceEssentialStopwatch`
- `interfaceEssentialSwitchOff`
- `interfaceEssentialSwitchOn`
- `interfaceEssentialSynchronizeArrowsSquare1`
- `interfaceEssentialSynchronizeArrowsSquare2`
- `interfaceEssentialTextFormat1`
- `interfaceEssentialTextFormat2`
- `interfaceEssentialTextInputArea1`
- `interfaceEssentialTextInputArea2`
- `interfaceEssentialTextInputArea3`
- `interfaceEssentialTouchIdLock`
- `interfaceEssentialTouchIdSmartphone`
- `interfaceEssentialTranslate`
- `interfaceEssentialTrophy`
- `interfaceEssentialViewEye`
- `interfaceEssentialVoiceId`
- `interfaceEssentialWaitingHourglassLoading`
- `interfaceEssentialWatchTime`
- `interfaceEssentialWifiFeed`
- `interfaceEssentialWifiSignal`
- `interfaceEssentialWireless`
- `interfaceEssentialWrench1`
- `interfaceEssentialWrench2`
- `interfaceEssentialZoomIn`
- `interfaceEssentialZoomInPage`
- `interfaceEssentialZoomOut`
- `interfaceEssentialZoomOutPage`
- `internetNetworkArrowSync`
- `internetNetworkCloudError`
- `internetNetworkCloudOff`
- `internetNetworkComputerDownload`
- `internetNetworkComputerUpload`
- `internetNetworkDownload`
- `internetNetworkLaptop`
- `internetNetworkUpload`
- `internetNetworkWifiMonitor`
- `internetNetworkWww`
- `logoDiscord`
- `logoLinkedin`
- `logoPinterest`
- `logoSnapchat`
- `logoSocialMediaDropbox`
- `logoSocialMediaFacebookCircle`
- `logoSocialMediaInstagram`
- `logoSocialMediaInstagramCircle`
- `logoSocialMediaOldInstagram`
- `logoSocialMediaTiktok`
- `logoSocialMediaTiktokCircle`
- `logoSocialMediaTwitterCircle`
- `logoSocialMediaYoutube`
- `logoSocialMediaYoutubeCircle`
- `logoSoundcloud1`
- `logoSoundcloud2`
- `logoSpotify`
- `logoTwitch1`
- `logoTwitch2`
- `logoTwitter`
- `logoWhatapp`
- `mapNavigationCompassDirection`
- `mapNavigationLocationFocus`
- `mapNavigationPinLocation1`
- `mapNavigationPinLocation2`
- `mapNavigationPinLocationTrip`
- `mobilePhone`
- `moneyPaymentsAccountingBillMoney1`
- `moneyPaymentsAccountingBillMoney2`
- `moneyPaymentsAccountingCalculator`
- `moneyPaymentsBank`
- `moneyPaymentsCalculatorApp`
- `moneyPaymentsCashPaymentCoin`
- `moneyPaymentsCreditCardMastercard`
- `moneyPaymentsCreditCardVisa`
- `moneyPaymentsCurrencyEuroDollarExchange`
- `moneyPaymentsDiamond`
- `moneyPaymentsSavingTreasure`
- `moneyPaymentsSelfPayment`
- `moneyPaymentsSmartphonePayDollar`
- `multipleUser`
- `musicAlbumCdDiskPlaylist`
- `musicClefSheet`
- `musicDiskCd1`
- `musicDiskCd2`
- `musicHeadphonesHuman`
- `musicMicrophone1`
- `musicMicrophone2`
- `musicMicrophoneOff`
- `musicNotesMusic1`
- `musicNotesMusic2`
- `musicRadioStereo`
- `musicSpeaker`
- `musicVinylRecord`
- `musicWalkmanCassette`
- `nonGmoFertilizer`
- `notificationEmail`
- `petAnimalsBear`
- `petAnimalsBuffalo`
- `petAnimalsCat`
- `petAnimalsDog`
- `petAnimalsFrog`
- `petAnimalsFrogFace`
- `petAnimalsGorilla`
- `petAnimalsOx`
- `petAnimalsPig`
- `petAnimalsRabbit1`
- `petAnimalsRabbit2`
- `petAnimalsTurtle`
- `phoneActionsRemove1`
- `phoneActionsRemove2`
- `phoneIncomingCall`
- `phoneOff1`
- `phoneOff2`
- `phoneScanQrCode1`
- `phoneScanQrCode2`
- `phoneSignalFull`
- `phoneVibrate`
- `photographyCamera1`
- `photographyEquipmentFilmPrint`
- `photographyFilePicture`
- `photographyFocusFlower`
- `photographyFramePicture`
- `photographyLightModeFlashOn`
- `photographyPhotoImage`
- `photographyPicturePolaroid`
- `photographyRetouchWand`
- `photographyRetouchWandStar`
- `photographyTakingPicturesCircleAlternate`
- `realEstateBuilding1`
- `realEstateBuilding2`
- `realEstateBuilding3`
- `realEstateBuilding4`
- `realEstateBuildingAd`
- `realEstateBuildingFactory`
- `realEstateBuildingHouse`
- `realEstateSignBuilding`
- `romanceHeartLock`
- `romanceLoveLetterOpen`
- `schoolScienceBag`
- `schoolScienceDna`
- `schoolScienceGraduationCap`
- `schoolScienceTestFlask`
- `searchCoding`
- `searchUser`
- `sendEmail`
- `shoppingShippingBag1`
- `shoppingShippingBag2`
- `shoppingShippingBarcode`
- `shoppingShippingBasket`
- `shoppingShippingBox`
- `shoppingShippingCart`
- `shoppingShippingCrack1`
- `shoppingShippingCrack2`
- `shoppingShippingDeliveryPersonMotorcycle`
- `shoppingShippingDeliveryTruck`
- `shoppingShippingDiscountCoupon`
- `shoppingShippingLoadingBox`
- `shoppingShippingProductsGift`
- `shoppingShippingReceiptSlip`
- `shoppingShippingShipmentDeliver`
- `shoppingShippingShop`
- `shoppingShippingUploadInformation`
- `shoppingShippingWarehouseTruckDelivery`
- `shoppingShippingWeightKg`
- `singleUserShield`
- `socialRewardsCertifiedDiploma`
- `socialRewardsCertifiedRibbon`
- `socialRewardsFlag`
- `socialRewardsHeartLikeCircle`
- `socialRewardsLikeBubble`
- `socialRewardsLikeCircle`
- `socialRewardsRatingStar1`
- `socialRewardsRatingStar2`
- `socialRewardsRewardGift`
- `socialRewardsTrendsHotFlame`
- `socialRewardsVipCrownKing`
- `technologyDroneCamera`
- `technologyDroneSignal`
- `technologyRobotAi`
- `technologyRobotAiSignal1`
- `technologyRobotAiSignal2`
- `transportationBicycle`
- `transportationHelicopter`
- `transportationMotorcycle`
- `transportationPlane`
- `transportationTrain`
- `transportationTruck`
- `transportationVintageTrain`
- `travelWayfindingBalloon`
- `travelWayfindingBeachCoconutTree`
- `travelWayfindingBeachUmbrella`
- `travelWayfindingPoolLadder`
- `uiDesignWebsite`
- `userGenderFemale`
- `userGenderFemaleMale`
- `userGenderGay`
- `userGenderLesbian`
- `userGenderMale`
- `userManLove`
- `userSingleAim`
- `userSleep`
- `userWomanIncreasingArrow`
- `videoMoviesPlay`
- `videoMoviesPlayer`
- `videoMoviesSetEquipment`
- `videoMoviesSquareOff`
- `videoMoviesVideoSquare`
- `videoMoviesVintageTv1`
- `videoMoviesVintageTv2`
- `videoMoviesVintageTv3`
- `vintagePhone`
- `weatherCloudSunFine`
- `weatherCresentMoonStars`
- `weatherMeteor`
- `weatherMoon`
- `weatherRainbow`
- `weatherSnowman`
- `weatherTemperatureThermometer`
- `weatherUmbrella`
- `weatherUmbrellaSnowing`
- `weatherWindFlag`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><BeautyBarberLightSignIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><BeautyBeardStyleIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><BeautyBodyCareSnailIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><BeautyBodyCareSunScreenIcon size="20" class="nav-icon" /> Settings</a>
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
<BeautyBarberLightSignIcon
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
    <BeautyBarberLightSignIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <BeautyBeardStyleIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <BeautyBodyCareSnailIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <BeautyBarberLightSignIcon size="24" />
   <BeautyBeardStyleIcon size="24" color="#4a90e2" />
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
   <BeautyBarberLightSignIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <BeautyBarberLightSignIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <BeautyBarberLightSignIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { beautyBarberLightSign } from '@stacksjs/iconify-streamline-pixel'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(beautyBarberLightSign, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { beautyBarberLightSign } from '@stacksjs/iconify-streamline-pixel'

// Icons are typed as IconData
const myIcon: IconData = beautyBarberLightSign
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-pixel/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-pixel/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
