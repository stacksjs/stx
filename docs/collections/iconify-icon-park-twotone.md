# IconPark TwoTone

> IconPark TwoTone icons for stx from Iconify

## Overview

This package provides access to 1947 icons from the IconPark TwoTone collection through the stx iconify integration.

**Collection ID:** `icon-park-twotone`
**Total Icons:** 1947
**Author:** ByteDance ([Website](https://github.com/bytedance/IconPark))
**License:** Apache 2.0 ([Details](https://github.com/bytedance/IconPark/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-icon-park-twotone
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbnormalIcon, AccelerationIcon, ActivitySourceIcon } from '@stacksjs/iconify-icon-park-twotone'

// Basic usage
const icon = AbnormalIcon()

// With size
const sizedIcon = AbnormalIcon({ size: 24 })

// With color
const coloredIcon = AccelerationIcon({ color: 'red' })

// With multiple props
const customIcon = ActivitySourceIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbnormalIcon, AccelerationIcon, ActivitySourceIcon } from '@stacksjs/iconify-icon-park-twotone'

  global.icons = {
    home: AbnormalIcon({ size: 24 }),
    user: AccelerationIcon({ size: 24, color: '#4a90e2' }),
    settings: ActivitySourceIcon({ size: 32 })
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
import { abnormal, acceleration, activitySource } from '@stacksjs/iconify-icon-park-twotone'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abnormal, { size: 24 })
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
const redIcon = AbnormalIcon({ color: 'red' })
const blueIcon = AbnormalIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbnormalIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbnormalIcon({ class: 'text-primary' })
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
const icon24 = AbnormalIcon({ size: 24 })
const icon1em = AbnormalIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbnormalIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbnormalIcon({ height: '1em' })
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
const smallIcon = AbnormalIcon({ class: 'icon-small' })
const largeIcon = AbnormalIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1947** icons:

- `abnormal`
- `acceleration`
- `activitySource`
- `ad`
- `add`
- `addItem`
- `addMode`
- `addMusic`
- `addOne`
- `addPic`
- `addPrint`
- `addSubset`
- `addSubtract`
- `addTextTwo`
- `addUser`
- `addWeb`
- `addressBook`
- `adjacentItem`
- `adjustment`
- `adobeIllustrate`
- `adobeIndesign`
- `adobeLightroom`
- `adobePhotoshop`
- `afroPick`
- `agreement`
- `aiming`
- `airBike`
- `airConditioning`
- `airplane`
- `airplaneWindow`
- `airplaneWindowOne`
- `airplay`
- `airpods`
- `alarm`
- `alarmClock`
- `alignBottom`
- `alignBottomTwo`
- `alignHorizontalCenterTwo`
- `alignHorizontally`
- `alignLeft`
- `alignLeftOne`
- `alignLeftTwo`
- `alignRight`
- `alignRightOne`
- `alignRightTwo`
- `alignTextBothOne`
- `alignTextBottomOne`
- `alignTextCenterOne`
- `alignTextLeftOne`
- `alignTextMiddleOne`
- `alignTextRightOne`
- `alignTextTopOne`
- `alignTop`
- `alignTopTwo`
- `alignVerticalCenterTwo`
- `alignVertically`
- `alignmentBottomCenter`
- `alignmentBottomLeft`
- `alignmentBottomRight`
- `alignmentHorizontalBottom`
- `alignmentHorizontalCenter`
- `alignmentHorizontalTop`
- `alignmentLeftBottom`
- `alignmentLeftCenter`
- `alignmentLeftTop`
- `alignmentRightBottom`
- `alignmentRightCenter`
- `alignmentRightTop`
- `alignmentTopCenter`
- `alignmentTopLeft`
- `alignmentTopRight`
- `alignmentVerticalCenter`
- `alignmentVerticalLeft`
- `alignmentVerticalRight`
- `allApplication`
- `ambulance`
- `analysis`
- `anchor`
- `anchorOne`
- `anchorRound`
- `anchorSqure`
- `anchorTwo`
- `android`
- `angryFace`
- `anguishedFace`
- `announcement`
- `antiCorrosion`
- `aperturePriority`
- `api`
- `appStore`
- `appSwitch`
- `apple`
- `appleOne`
- `appletClosed`
- `application`
- `applicationOne`
- `applicationTwo`
- `appointment`
- `arcDeTriomphe`
- `archery`
- `areaMap`
- `arena`
- `arithmeticButtons`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowKeys`
- `assemblyLine`
- `asterisk`
- `asteriskKey`
- `astonishedFace`
- `atSign`
- `attention`
- `audioFile`
- `audit`
- `autoFocus`
- `avatar`
- `aviation`
- `avocado`
- `avocadoOne`
- `baby`
- `babyApp`
- `babyCarSeat`
- `babyFeet`
- `babyMeal`
- `babyMobile`
- `babyOne`
- `babyPants`
- `babySling`
- `babyTaste`
- `bachelorCap`
- `bachelorCapOne`
- `bachelorCapTwo`
- `back`
- `backpack`
- `bad`
- `badOne`
- `badTwo`
- `badge`
- `badgeTwo`
- `badminton`
- `baggageDelay`
- `balance`
- `balanceOne`
- `balanceTwo`
- `banana`
- `bankCard`
- `bankCardOne`
- `bankCardTwo`
- `bankTransfer`
- `baokemeng`
- `barbecue`
- `barberBrush`
- `barberClippers`
- `baseballBat`
- `baseballCap`
- `basketballClothes`
- `basketballOne`
- `bat`
- `batteryEmpty`
- `batteryFailure`
- `batteryFull`
- `batteryStorage`
- `batteryTips`
- `batteryWorking`
- `batteryWorkingOne`
- `beachUmbrella`
- `bear`
- `beauty`
- `beautyInstrument`
- `bedside`
- `bedsideTwo`
- `bee`
- `beer`
- `beerMug`
- `behance`
- `bellRing`
- `benz`
- `bezierCurve`
- `bib`
- `bigClock`
- `bigX`
- `bike`
- `bill`
- `bird`
- `birthdayCake`
- `bitcoin`
- `blackEight`
- `blackboard`
- `blade`
- `blockEight`
- `blockFive`
- `blockFour`
- `blockNine`
- `blockOne`
- `blockSeven`
- `blockSix`
- `blockTen`
- `blockThree`
- `blockTwo`
- `blockchain`
- `blocksAndArrows`
- `bloom`
- `blossom`
- `boiler`
- `boltOne`
- `book`
- `bookOne`
- `bookOpen`
- `bookmark`
- `bookmarkOne`
- `bookmarkThree`
- `bookshelf`
- `boosterCarSeat`
- `booth`
- `bottle`
- `bottleOne`
- `bottleThree`
- `bottleTwo`
- `bottomBar`
- `bottomBarOne`
- `bow`
- `bowl`
- `bowlOne`
- `box`
- `boxing`
- `boy`
- `boyOne`
- `boyStroller`
- `boyTwo`
- `brain`
- `brakePads`
- `branch`
- `branchOne`
- `branchTwo`
- `bread`
- `breadMachine`
- `breadOne`
- `breastPump`
- `bridgeOne`
- `briefcase`
- `brightness`
- `bringForward`
- `bringToFront`
- `bringToFrontOne`
- `broadcast`
- `broadcastOne`
- `broadcastRadio`
- `browser`
- `browserSafari`
- `bubbleChart`
- `bug`
- `buildingFour`
- `buildingOne`
- `buildingThree`
- `buildingTwo`
- `bus`
- `busOne`
- `busTwo`
- `butterfly`
- `buy`
- `bydesign`
- `bytedance`
- `bytedanceMiniApp`
- `cableCar`
- `cactus`
- `cake`
- `cakeFive`
- `cakeFour`
- `cakeOne`
- `cakeThree`
- `calculator`
- `calculatorOne`
- `calendar`
- `calendarDot`
- `calendarThirty`
- `calendarThirtyTwo`
- `calendarThree`
- `camera`
- `cameraFive`
- `cameraFour`
- `cameraOne`
- `cameraThree`
- `cameraTwo`
- `camp`
- `cancer`
- `candy`
- `cannedFruit`
- `capricornus`
- `car`
- `carBattery`
- `cardTwo`
- `carousel`
- `carouselVideo`
- `castle`
- `categoryManagement`
- `cattle`
- `caution`
- `cd`
- `cell`
- `certificate`
- `chafingDish`
- `chafingDishOne`
- `chair`
- `chairOne`
- `changeDateSort`
- `chargingTreasure`
- `chartGraph`
- `chartHistogramTwo`
- `chartLineArea`
- `chartPie`
- `chartPieOne`
- `chartProportion`
- `chartRing`
- `chartStock`
- `checkOne`
- `checkbox`
- `checkerboard`
- `checklist`
- `cheese`
- `chefHat`
- `chefHatOne`
- `cherry`
- `chessOne`
- `chicken`
- `chickenLeg`
- `childrenCap`
- `childrenPyramid`
- `chili`
- `chimney`
- `chinese`
- `chineseOne`
- `chinesePavilion`
- `chip`
- `choppingBoard`
- `christmasTree`
- `christmasTreeOne`
- `churchOne`
- `churchTwo`
- `circleDoubleDown`
- `circleDoubleLeft`
- `circleDoubleRight`
- `circleDoubleUp`
- `circleFiveLine`
- `circleFour`
- `circleFourLine`
- `circleHouse`
- `circleLeftDown`
- `circleLeftUp`
- `circleRightDown`
- `circleRightUp`
- `circleThree`
- `circleTwoLine`
- `circlesAndTriangles`
- `circlesSeven`
- `circularConnection`
- `circus`
- `city`
- `cityGate`
- `cityOne`
- `classroom`
- `clear`
- `clearFormat`
- `click`
- `clipboard`
- `clockTower`
- `closeOne`
- `clothesBriefs`
- `clothesGloves`
- `clothesGlovesTwo`
- `clothesHoodie`
- `clothesPantsShort`
- `clothesPantsSweat`
- `clothesSkates`
- `clothesTurtleneck`
- `clothesWindbreaker`
- `cloudStorage`
- `cloudy`
- `cloudyNight`
- `clue`
- `coatHanger`
- `coconutTree`
- `codeLaptop`
- `coffeeMachine`
- `cola`
- `collectComputer`
- `collectLaptop`
- `collectPicture`
- `collectionFiles`
- `collectionRecords`
- `colorCard`
- `colorFilter`
- `come`
- `command`
- `comment`
- `commentOne`
- `comments`
- `commodity`
- `communication`
- `commuterBag`
- `compass`
- `compassOne`
- `components`
- `composition`
- `compression`
- `computer`
- `conceptSharing`
- `concern`
- `conditioner`
- `cones`
- `config`
- `confoundedFace`
- `confusedFace`
- `connect`
- `connectAddressOne`
- `connectAddressTwo`
- `connection`
- `connectionBox`
- `connectionPoint`
- `connectionPointTwo`
- `consignment`
- `consume`
- `contrast`
- `contrastView`
- `contrastViewCircle`
- `control`
- `convergingGateway`
- `cook`
- `cooking`
- `cookingPot`
- `cool`
- `coordinateSystem`
- `copy`
- `copyLink`
- `copyOne`
- `copyright`
- `coronavirus`
- `correct`
- `cosmeticBrush`
- `coupon`
- `cpu`
- `crab`
- `creative`
- `crossRing`
- `crossSociety`
- `crown`
- `crownThree`
- `crownTwo`
- `cruise`
- `cryingBaby`
- `cubeFour`
- `cup`
- `cupOne`
- `curling`
- `curveAdjustment`
- `cuttingOne`
- `cuvette`
- `cycleOne`
- `cylinder`
- `damageMap`
- `darkMode`
- `dashboardCar`
- `dashboardOne`
- `data`
- `dataAll`
- `dataArrival`
- `dataDisplay`
- `dataFile`
- `dataFour`
- `dataLock`
- `dataOne`
- `dataScreen`
- `dataServer`
- `dataSheet`
- `dataSwitching`
- `dataThree`
- `dataTwo`
- `dataUser`
- `databaseAlert`
- `databaseCode`
- `databaseConfig`
- `databaseDownload`
- `databaseEnter`
- `databaseFail`
- `databaseFirst`
- `databaseForbid`
- `databaseLock`
- `databaseNetwork`
- `databaseNetworkPoint`
- `databasePoint`
- `databasePosition`
- `databasePower`
- `databaseProportion`
- `databaseSearch`
- `databaseSetting`
- `databaseSuccess`
- `databaseSync`
- `databaseTime`
- `deathStar`
- `deer`
- `degreeHat`
- `delete`
- `deleteFive`
- `deleteFour`
- `deleteKey`
- `deleteMode`
- `deleteOne`
- `deleteThemes`
- `deleteThree`
- `deleteTwo`
- `delivery`
- `descend`
- `deskLamp`
- `deskLampOne`
- `devices`
- `diamondNecklace`
- `diamondOne`
- `diamondRing`
- `diamondThree`
- `diamondTwo`
- `diamonds`
- `differenceSet`
- `digitalWatches`
- `direction`
- `directionAdjustmentTwo`
- `disabaledWeb`
- `disabledLaptop`
- `disappointedFace`
- `discoveryIndex`
- `disk`
- `diskOne`
- `diskTwo`
- `dislikeTwo`
- `display`
- `distraughtFace`
- `distributeHorizontalSpacing`
- `distributeHorizontally`
- `distributeVerticalSpacing`
- `distributeVertically`
- `diving`
- `divingBottle`
- `divingSuit`
- `division`
- `dizzyFace`
- `docAdd`
- `docDetail`
- `docFail`
- `docSearch`
- `docSearchTwo`
- `docSuccess`
- `documentFolder`
- `dog`
- `dolphin`
- `domeLight`
- `doorHandle`
- `doubleBed`
- `doughnut`
- `downC`
- `downOne`
- `downSquare`
- `downTwo`
- `downloadFour`
- `downloadLaptop`
- `downloadThree`
- `downloadWeb`
- `dribble`
- `drink`
- `drone`
- `droneOne`
- `dropShadowDown`
- `dropShadowLeft`
- `dropShadowRight`
- `dropShadowUp`
- `dropbox`
- `drumstick`
- `duck`
- `dvi`
- `eagle`
- `easy`
- `edit`
- `editMovie`
- `editName`
- `editTwo`
- `editing`
- `effects`
- `egg`
- `eggOne`
- `eggplant`
- `eightKey`
- `electricDrill`
- `electricIron`
- `electricWave`
- `electrocardiogram`
- `electronicDoorLock`
- `electronicLocksClose`
- `electronicLocksOpen`
- `electronicPen`
- `elevator`
- `emailBlock`
- `emailDelect`
- `emailLock`
- `emailSearch`
- `emailSecurity`
- `emotionHappy`
- `emotionUnhappy`
- `endocrine`
- `endpointDisplacement`
- `energySocket`
- `engineeringBrand`
- `engineeringVehicle`
- `english`
- `englishMustache`
- `enquire`
- `enterKey`
- `enterKeyOne`
- `enterTheKeyboard`
- `entertainment`
- `equalRatio`
- `equalizer`
- `erase`
- `error`
- `escalators`
- `ethernetOff`
- `ethernetOn`
- `everyUser`
- `excel`
- `excelOne`
- `exchangeFour`
- `exchangeOne`
- `exchangeThree`
- `exchangeTwo`
- `exclusiveGateway`
- `expandDown`
- `expandLeft`
- `expandRight`
- `expandUp`
- `experiment`
- `experimentOne`
- `expressDelivery`
- `expressionlessFace`
- `extend`
- `eyebrow`
- `eyes`
- `fEightKey`
- `fFiveKey`
- `fFourKey`
- `fNKey`
- `fNineKey`
- `fOneKey`
- `fSevenKey`
- `fSixKey`
- `fThreeKey`
- `fTwoKey`
- `fZeroKey`
- `facePowder`
- `faceWithSmilingOpenEyes`
- `faceWithoutMouth`
- `facebook`
- `facetime`
- `faceu`
- `facialCleanser`
- `facialMask`
- `factoryBuilding`
- `family`
- `feelgood`
- `feelgoodOne`
- `female`
- `ferrisWheel`
- `figma`
- `figmaComponent`
- `figmaMask`
- `fileAddition`
- `fileCabinet`
- `fileCode`
- `fileCollection`
- `fileCollectionOne`
- `fileConversion`
- `fileDate`
- `fileDateOne`
- `fileDisplay`
- `fileDisplayOne`
- `fileEditing`
- `fileEditingOne`
- `fileExcel`
- `fileFailed`
- `fileFocus`
- `fileFocusOne`
- `fileGif`
- `fileHash`
- `fileHiding`
- `fileJpg`
- `fileLock`
- `fileLockOne`
- `fileMusic`
- `fileMusicOne`
- `filePdf`
- `fileProtection`
- `fileProtectionOne`
- `fileQuality`
- `fileQualityOne`
- `fileQuestion`
- `fileRemoval`
- `fileSearch`
- `fileSearchOne`
- `fileSearchTwo`
- `fileSettings`
- `fileSettingsOne`
- `fileStaff`
- `fileStaffOne`
- `fileSuccess`
- `fileText`
- `fileTips`
- `fileTxt`
- `fileWithdrawal`
- `fileWord`
- `fill`
- `filter`
- `finance`
- `financing`
- `financingOne`
- `financingTwo`
- `find`
- `fingernail`
- `fire`
- `fireExtinguisher`
- `fireExtinguisherOne`
- `fireworks`
- `firstAidKit`
- `fish`
- `fishOne`
- `fist`
- `five`
- `fiveFive`
- `fiveKey`
- `fiveStarBadge`
- `flag`
- `flashPayment`
- `flashlamp`
- `flashlight`
- `flask`
- `flightAirflow`
- `flightSafety`
- `flipCamera`
- `flipHorizontally`
- `flipVertically`
- `float`
- `fm`
- `focus`
- `focusOne`
- `folder`
- `folderBlock`
- `folderBlockOne`
- `folderClose`
- `folderCode`
- `folderConversion`
- `folderDownload`
- `folderFailed`
- `folderFocus`
- `folderFocusOne`
- `folderLock`
- `folderLockOne`
- `folderMinus`
- `folderMusic`
- `folderMusicOne`
- `folderOne`
- `folderOpen`
- `folderPlus`
- `folderProtection`
- `folderProtectionOne`
- `folderQuality`
- `folderQualityOne`
- `folderSearch`
- `folderSearchOne`
- `folderSettings`
- `folderSettingsOne`
- `folderSuccess`
- `folderUpload`
- `folderWithdrawal`
- `fontSearch`
- `forbid`
- `fork`
- `forkSpoon`
- `form`
- `format`
- `formatBrush`
- `foundationMakeup`
- `four`
- `fourArrows`
- `fourFour`
- `fourKey`
- `fourPointConnection`
- `fourRoundPointConnection`
- `foursquare`
- `frenchFries`
- `friendsCircle`
- `frigate`
- `frog`
- `frowningFaceWhitOpenMouth`
- `fruiter`
- `fullDressLonguette`
- `fullScreenPlay`
- `fullSelection`
- `game`
- `gameConsole`
- `gameConsoleOne`
- `gameEmoji`
- `gameHandle`
- `gamePs`
- `gameThree`
- `gameTwo`
- `gamepad`
- `gas`
- `gate`
- `gateMachine`
- `gauze`
- `gavel`
- `generalBranch`
- `germs`
- `ghost`
- `gift`
- `giftBag`
- `giftBox`
- `girl`
- `girlOne`
- `girlTwo`
- `gitlab`
- `glasses`
- `glassesOne`
- `glassesThree`
- `globe`
- `glove`
- `goblet`
- `gobletCracking`
- `gobletFull`
- `goldMedal`
- `goldMedalTwo`
- `golfCourse`
- `gongfu`
- `good`
- `goodOne`
- `goodTwo`
- `google`
- `googleAds`
- `gopro`
- `gps`
- `graphicDesign`
- `graphicDesignTwo`
- `graphicStitchingFour`
- `graphicStitchingThree`
- `greenHouse`
- `greenNewEnergy`
- `grimacingFace`
- `grinningFace`
- `grinningFaceWithOpenMouth`
- `grinningFaceWithSquintingEyes`
- `grinningFaceWithTightlyClosedEyes`
- `grinningFaceWithTightlyClosedEyesOpenMouth`
- `group`
- `guideBoard`
- `gymnastics`
- `gymnasticsOne`
- `hairDryer`
- `hairDryerOne`
- `halo`
- `hamburger`
- `hamburgerOne`
- `hammerAndAnvil`
- `handCream`
- `handDown`
- `handLeft`
- `handPaintedPlate`
- `handRight`
- `handUp`
- `handbag`
- `handheld`
- `handleA`
- `handleB`
- `handleC`
- `handleDown`
- `handleLeft`
- `handleRight`
- `handleRound`
- `handleSquare`
- `handleTriangle`
- `handleUp`
- `handleX`
- `handleY`
- `handleZ`
- `hands`
- `handwashing`
- `handwashingFluid`
- `hanger`
- `hangerTwo`
- `hardDisk`
- `hardDiskOne`
- `harm`
- `hashtagKey`
- `hat`
- `hdd`
- `hdmiCable`
- `hdmiConnector`
- `headphoneSound`
- `headset`
- `headsetOne`
- `headsetTwo`
- `headwear`
- `health`
- `healthProducts`
- `healthyRecognition`
- `heartBallon`
- `heaterResistor`
- `helmet`
- `helmetOne`
- `help`
- `helpcenter`
- `hexagonOne`
- `hexagonStrip`
- `hi`
- `highHeeledShoes`
- `highLight`
- `highSpeedRail`
- `hippo`
- `historyQuery`
- `hockey`
- `holdInterface`
- `holdSeeds`
- `holySword`
- `home`
- `homeTwo`
- `homestay`
- `honey`
- `honeyOne`
- `horizontalTidyUp`
- `horizontallyCentered`
- `hospital`
- `hospitalFour`
- `hospitalThree`
- `hospitalTwo`
- `hotAirBalloon`
- `hotPot`
- `hotPotOne`
- `hotel`
- `hotelDoNotClean`
- `hotelPleaseClean`
- `hourglassFull`
- `hourglassNull`
- `htmlFive`
- `huntingGear`
- `iMac`
- `icecream`
- `icecreamFive`
- `icecreamFour`
- `icecreamTwo`
- `idCard`
- `idCardH`
- `idCardV`
- `imageFiles`
- `imbalance`
- `inFlight`
- `inbox`
- `inboxDownloadR`
- `inboxIn`
- `inboxOut`
- `inboxR`
- `inboxSuccess`
- `inboxSuccessR`
- `inboxUploadR`
- `inclusiveGateway`
- `incoming`
- `inductionLock`
- `industrialScales`
- `info`
- `infusion`
- `injection`
- `innerShadowBottomLeft`
- `innerShadowBottomRight`
- `innerShadowDown`
- `innerShadowLeft`
- `innerShadowRight`
- `innerShadowTopLeft`
- `innerShadowTopRight`
- `innerShadowUp`
- `insertCard`
- `inspection`
- `instagram`
- `instagramOne`
- `install`
- `instruction`
- `intercom`
- `intermediateMode`
- `internalExpansion`
- `internalReduction`
- `intersection`
- `invalidFiles`
- `invertCamera`
- `ipad`
- `ipadOne`
- `iphone`
- `ipo`
- `iron`
- `ironDisable`
- `ironThree`
- `ironTwo`
- `iwatch`
- `iwatchOne`
- `iwatchTwo`
- `jewelry`
- `joystick`
- `juice`
- `jump`
- `kettle`
- `kettleOne`
- `key`
- `keyOne`
- `keyTwo`
- `keyboard`
- `keyhole`
- `keyline`
- `kitchenKnife`
- `knifeFork`
- `koalaBear`
- `kungfu`
- `label`
- `lamp`
- `landSurveying`
- `landing`
- `laptop`
- `laptopComputer`
- `laptopOne`
- `layers`
- `layoutFive`
- `layoutFour`
- `layoutOne`
- `layoutThree`
- `layoutTwo`
- `leavesOne`
- `leavesTwo`
- `ledDiode`
- `leftBar`
- `leftC`
- `leftExpand`
- `leftOne`
- `leftSquare`
- `leftTwo`
- `lemon`
- `lensAlignment`
- `leo`
- `level`
- `lightHouse`
- `lightMember`
- `lightning`
- `like`
- `lincoln`
- `lipGloss`
- `lipTattoo`
- `lipstick`
- `lipstickOne`
- `liqueur`
- `listAlphabet`
- `listBottom`
- `listCheckbox`
- `listFail`
- `listMiddle`
- `listOne`
- `listSuccess`
- `listTop`
- `listTwo`
- `loadingThree`
- `local`
- `localPin`
- `localTwo`
- `lock`
- `lockOne`
- `lockingComputer`
- `lockingLaptop`
- `lockingPicture`
- `lockingWeb`
- `log`
- `lotion`
- `lotus`
- `loudlyCryingFace`
- `loudlyCryingFaceWhitOpenMouth`
- `loveAndHelp`
- `luggage`
- `macFinder`
- `macadamiaNut`
- `magnet`
- `mail`
- `mailDownload`
- `mailEdit`
- `mailOpen`
- `mailReview`
- `mailUnpacking`
- `maillOne`
- `makeups`
- `male`
- `mallBag`
- `manualGear`
- `manyToMany`
- `mapDistance`
- `mapDraw`
- `mapRoad`
- `mapRoadTwo`
- `mapTwo`
- `margin`
- `marginOne`
- `mark`
- `marketAnalysis`
- `mascara`
- `mask`
- `maskOne`
- `maslowPyramids`
- `massageChair`
- `massageChairOne`
- `massageTable`
- `master`
- `material`
- `materialTwo`
- `me`
- `measuringCup`
- `medalOne`
- `medicalBox`
- `medicalFiles`
- `medicalMark`
- `medicationTime`
- `medicineBottle`
- `medicineBottleOne`
- `medicineChest`
- `memoryCard`
- `memoryCardOne`
- `memoryOne`
- `menuFoldOne`
- `menuUnfoldOne`
- `message`
- `messageEmoji`
- `messageOne`
- `messagePrivacy`
- `messageSearch`
- `messageSecurity`
- `messageSent`
- `messages`
- `messagesOne`
- `microSd`
- `microSlrCamera`
- `microphoneOne`
- `microscope`
- `microscopeOne`
- `microwaveOven`
- `milk`
- `milkOne`
- `mindMapping`
- `miniSdCard`
- `minusTheBottom`
- `minusTheTop`
- `mirror`
- `mirrorOne`
- `mirrorTwo`
- `mitsubishi`
- `modify`
- `modifyTwo`
- `monitor`
- `monitorCamera`
- `monitorOne`
- `monkey`
- `monumentOne`
- `monumentTwo`
- `moon`
- `moreApp`
- `moreFour`
- `moreThree`
- `moreTwo`
- `mountain`
- `mounted`
- `mouse`
- `mouseOne`
- `move`
- `moveInOne`
- `moveOne`
- `movie`
- `movieBoard`
- `multiCircular`
- `multiFunctionKnife`
- `multiPictureCarousel`
- `multiRectangle`
- `multiTriangularTwo`
- `multicast`
- `muscle`
- `museumOne`
- `museumTwo`
- `music`
- `musicCd`
- `musicList`
- `musicOne`
- `mute`
- `nailPolish`
- `nailPolishOne`
- `naturalMode`
- `navigation`
- `necktie`
- `needle`
- `nestedArrows`
- `nests`
- `networkDrive`
- `networkTree`
- `neural`
- `neutralFace`
- `newComputer`
- `newDianziqian`
- `newPicture`
- `newlybuild`
- `newspaperFolding`
- `next`
- `nineKey`
- `ninePointsConnected`
- `nintendoSwitch`
- `nmr`
- `noShooting`
- `noodles`
- `notebook`
- `notebookAndPen`
- `notebookOne`
- `notepad`
- `notes`
- `nuclearPlant`
- `nurseCap`
- `nut`
- `nutrition`
- `octagon`
- `oilIndustry`
- `one`
- `oneKey`
- `oneOne`
- `oneThirdRotation`
- `oneToMany`
- `oneToOne`
- `onesies`
- `onlineMeeting`
- `openAnAccount`
- `openDoor`
- `openOne`
- `optimize`
- `optional`
- `orange`
- `orangeOne`
- `order`
- `orthopedic`
- `oscillator`
- `other`
- `outbound`
- `outdoor`
- `outgoing`
- `ovalOne`
- `oven`
- `overallReduction`
- `owl`
- `pacifier`
- `pad`
- `pageTemplate`
- `pagoda`
- `paint`
- `paintedEggshell`
- `paintedScreen`
- `palace`
- `palm`
- `panda`
- `panoramaHorizontal`
- `paperMoney`
- `paperShip`
- `parachute`
- `paragraphAlphabet`
- `paragraphRectangle`
- `paragraphRound`
- `paragraphTriangle`
- `parallelGateway`
- `parallelogram`
- `parentingBook`
- `parking`
- `partyBalloon`
- `passport`
- `passportOne`
- `pauseOne`
- `payCode`
- `payCodeOne`
- `peach`
- `pear`
- `pearlOfTheOrient`
- `peas`
- `pennant`
- `pentagonOne`
- `people`
- `peopleBottom`
- `peopleBottomCard`
- `peopleDelete`
- `peopleDeleteOne`
- `peopleDownload`
- `peopleLeft`
- `peopleMinus`
- `peopleMinusOne`
- `peoplePlus`
- `peoplePlusOne`
- `peopleRight`
- `peopleSafe`
- `peopleSafeOne`
- `peopleSearch`
- `peopleSearchOne`
- `peopleSpeak`
- `peopleTop`
- `peopleTopCard`
- `peopleUnknown`
- `peopleUpload`
- `peoples`
- `peoplesTwo`
- `percentage`
- `performance`
- `perfume`
- `perfumerBottle`
- `permissions`
- `personalCollection`
- `personalPrivacy`
- `pesticide`
- `petrol`
- `phone`
- `phoneBooth`
- `phoneCall`
- `phoneIncoming`
- `phoneIncomingOne`
- `phoneMissed`
- `phoneOne`
- `phoneOutgoing`
- `phoneOutgoingOne`
- `phoneTelephone`
- `phoneTwo`
- `phoneVideoCall`
- `phonograph`
- `piano`
- `pic`
- `picOne`
- `picture`
- `pictureAlbum`
- `pictureOne`
- `pie`
- `pieFive`
- `pieFour`
- `pieOne`
- `pieSeven`
- `pieSix`
- `pieThree`
- `pieTwo`
- `pig`
- `pigeon`
- `pill`
- `pills`
- `pin`
- `pinwheel`
- `pivotTable`
- `plan`
- `planet`
- `platte`
- `play`
- `playBasketball`
- `playOne`
- `playTwo`
- `playVolleyball`
- `playWrong`
- `playbackProgress`
- `plug`
- `plugOne`
- `plusCross`
- `point`
- `pointOut`
- `pokeballOne`
- `poker`
- `popcorn`
- `popcornOne`
- `pot`
- `potentiometer`
- `poutingFace`
- `powder`
- `powerSupply`
- `powerSupplyOne`
- `powerpoint`
- `ppt`
- `preschool`
- `prescription`
- `press`
- `previewOpen`
- `printer`
- `printerTwo`
- `prison`
- `projector`
- `projectorOne`
- `projectorThree`
- `projectorTwo`
- `protect`
- `protection`
- `publicToilet`
- `pullDoor`
- `pullRequests`
- `pumpkin`
- `pureNatural`
- `pushDoor`
- `pushpin`
- `puzzle`
- `pyramidOne`
- `quadrilateral`
- `rabbit`
- `radarChart`
- `radarTwo`
- `radiation`
- `radio`
- `radioNanny`
- `radioOne`
- `radioTwo`
- `radish`
- `radishOne`
- `railway`
- `rankingList`
- `rattle`
- `rattleOne`
- `razor`
- `readBook`
- `receive`
- `receiver`
- `recentViewsSort`
- `record`
- `recordDisc`
- `recordPlayer`
- `rectangle`
- `rectangleOne`
- `rectangleSmall`
- `rectangleTear`
- `rectangleX`
- `rectangularCircularConnection`
- `rectangularCircularSeparation`
- `redCross`
- `redEnvelope`
- `redEnvelopes`
- `reduce`
- `reduceOne`
- `reduceTwo`
- `reduceUser`
- `reel`
- `refraction`
- `refreshOne`
- `refrigerator`
- `relationalGraph`
- `relievedFace`
- `reload`
- `remind`
- `remindDisable`
- `remoteControl`
- `remoteControlOne`
- `renault`
- `repair`
- `replayMusic`
- `report`
- `repositioning`
- `resistor`
- `resting`
- `retroBag`
- `reverseLens`
- `reverseLensOne`
- `reverseOperationIn`
- `reverseOperationOut`
- `rice`
- `riding`
- `rightAngle`
- `rightBar`
- `rightC`
- `rightExpand`
- `rightOne`
- `rightRun`
- `rightSquare`
- `rightTwo`
- `rightUser`
- `ring`
- `ringOne`
- `rings`
- `roadCone`
- `roadSign`
- `roadSignBoth`
- `robot`
- `robotOne`
- `robotTwo`
- `rockGesture`
- `rocket`
- `rocketOne`
- `rockingHorse`
- `rollerskates`
- `romper`
- `ropeSkipping`
- `rotate`
- `rotateOne`
- `rotationOne`
- `round`
- `roundCaliper`
- `roundMask`
- `roundSocket`
- `roundTrip`
- `router`
- `routerOne`
- `rowing`
- `rsMale`
- `rss`
- `rulerOne`
- `runLeft`
- `sTurnDown`
- `sTurnLeft`
- `sTurnRight`
- `sTurnUp`
- `safeRetrieval`
- `sailboat`
- `sailboatOne`
- `sailing`
- `salesReport`
- `sandwich`
- `sandwichOne`
- `sapling`
- `save`
- `saveOne`
- `scaleOne`
- `scallion`
- `scanSetting`
- `schedule`
- `school`
- `scissors`
- `scoreboard`
- `screenRotation`
- `screenshot`
- `screenshotOne`
- `screenshotTwo`
- `screwdriver`
- `sd`
- `sdCard`
- `seal`
- `search`
- `seat`
- `securityStall`
- `seedling`
- `selected`
- `selectedFocus`
- `selfie`
- `sendBackward`
- `sendToBack`
- `seo`
- `seoFolder`
- `server`
- `setOff`
- `setting`
- `settingComputer`
- `settingLaptop`
- `settingOne`
- `settingThree`
- `settingTwo`
- `settingWeb`
- `sevenKey`
- `shade`
- `shake`
- `shareOne`
- `shareTwo`
- `shaver`
- `shaverOne`
- `shaving`
- `shield`
- `shieldAdd`
- `ship`
- `shop`
- `shopping`
- `shoppingBag`
- `shoppingBagOne`
- `shoppingCart`
- `shoppingCartAdd`
- `shoppingCartDel`
- `shoppingCartTwo`
- `shoppingMall`
- `shortSkirt`
- `shorts`
- `shoulderBag`
- `shovel`
- `shovelOne`
- `showerHead`
- `shrimp`
- `shutterPriority`
- `sickbed`
- `signalStrength`
- `signalTower`
- `sim`
- `simCard`
- `singleBed`
- `sippyCup`
- `six`
- `sixCircularConnection`
- `sixKey`
- `sixPoints`
- `skate`
- `skates`
- `skating`
- `sketch`
- `skiingNordic`
- `skull`
- `slave`
- `sleep`
- `sleepTwo`
- `slide`
- `slideTwo`
- `slidingHorizontal`
- `slidingVertical`
- `slightlyFrowningFaceWhitOpenMouth`
- `slightlySmilingFace`
- `slippers`
- `slippersOne`
- `slyFaceWhitSmile`
- `smilingFace`
- `smilingFaceWithSquintingEyes`
- `snacks`
- `snowman`
- `soapBubble`
- `soccer`
- `soccerOne`
- `sofa`
- `sofaTwo`
- `solarEnergyOne`
- `solidStateDisk`
- `sorcererHat`
- `sort`
- `sound`
- `soundOne`
- `sourceCode`
- `soybeanMilkMaker`
- `spaCandle`
- `spanner`
- `speaker`
- `speakerOne`
- `speed`
- `speedOne`
- `sperm`
- `spikedshoes`
- `spinningTop`
- `split`
- `splitBranch`
- `splitTurnDownLeft`
- `splitTurnDownRight`
- `spoon`
- `sport`
- `sporting`
- `square`
- `squareSmall`
- `ssd`
- `stackLight`
- `stamp`
- `standUp`
- `stapler`
- `star`
- `steeringWheel`
- `steoller`
- `stereoOne`
- `stethoscope`
- `stickers`
- `stockMarket`
- `stopwatch`
- `stopwatchStart`
- `storageCardOne`
- `storageCardTwo`
- `straightRazor`
- `stretchingOne`
- `strongbox`
- `subway`
- `success`
- `sum`
- `sun`
- `sunHat`
- `sunOne`
- `sunset`
- `surprisedFaceWithOpenBigMouth`
- `surprisedFaceWithOpenMouth`
- `surveillanceCameras`
- `surveillanceCamerasOne`
- `surveillanceCamerasTwo`
- `swallow`
- `sweater`
- `swimmingRing`
- `swimsuit`
- `swing`
- `switchButton`
- `switchNintendo`
- `switchOne`
- `switchThemes`
- `system`
- `tShirt`
- `table`
- `tableFile`
- `tableLamp`
- `tableReport`
- `tabletennis`
- `tag`
- `tagOne`
- `tajMahal`
- `takeOffOne`
- `tape`
- `tapeMeasure`
- `targetOne`
- `taurus`
- `taxi`
- `tea`
- `teaDrink`
- `teapot`
- `teeth`
- `telescope`
- `tent`
- `tentBanner`
- `terminal`
- `terminationFile`
- `testTube`
- `text`
- `textMessage`
- `textureTwo`
- `theSingleShoulderBag`
- `theater`
- `theme`
- `thermometer`
- `thermometerOne`
- `thermosCup`
- `thin`
- `thinkingProblem`
- `three`
- `threeDGlasses`
- `threeHexagons`
- `threeKey`
- `threeSlashes`
- `threeThree`
- `threeTriangles`
- `thumbsDown`
- `thumbsUp`
- `thunderbolt`
- `thunderstormOne`
- `ticket`
- `ticketOne`
- `ticketsOne`
- `ticketsTwo`
- `tiktok`
- `time`
- `timedMail`
- `timeline`
- `timer`
- `tips`
- `tipsOne`
- `tireSwing`
- `toilet`
- `tomato`
- `tool`
- `toolkit`
- `topBar`
- `topbuzz`
- `topic`
- `topicDiscussion`
- `torch`
- `tourBus`
- `towel`
- `tower`
- `towerOfBabel`
- `toxins`
- `trace`
- `trademark`
- `traditionalChineseMedicine`
- `train`
- `transaction`
- `transactionOrder`
- `transfer`
- `transform`
- `transport`
- `transporter`
- `trapezoid`
- `tray`
- `treadmill`
- `treadmillOne`
- `treadmillTwo`
- `treasureChest`
- `treeDiagram`
- `treeList`
- `treeOne`
- `trend`
- `trendTwo`
- `triangle`
- `triangleRoundRectangle`
- `triangleRuler`
- `trophy`
- `trousersBellBottoms`
- `trumpet`
- `trunk`
- `tub`
- `tuchong`
- `tumblr`
- `turkey`
- `turnAround`
- `turnOn`
- `tvOne`
- `twitter`
- `two`
- `twoDimensionalCode`
- `twoDimensionalCodeOne`
- `twoDimensionalCodeTwo`
- `twoKey`
- `twoSemicircles`
- `twoTriangles`
- `twoTwo`
- `typeDrive`
- `uDisk`
- `uTurnDown`
- `uTurnLeft`
- `uTurnRight`
- `uTurnUp`
- `ulikecam`
- `umbrella`
- `umbrellaOne`
- `umbrellaTwo`
- `ungroup`
- `unicast`
- `universal`
- `unlock`
- `unlockOne`
- `upAndDown`
- `upC`
- `upOne`
- `upSquare`
- `upTwo`
- `updateRotation`
- `uploadLaptop`
- `uploadThree`
- `uploadWeb`
- `upsideDownFace`
- `usb`
- `usbMemoryStick`
- `usbMicroOne`
- `usbMicroTwo`
- `usbOne`
- `usbTypeC`
- `user`
- `userBusiness`
- `userPositioning`
- `userToUserTransmission`
- `uterus`
- `vacation`
- `vacuumCleaner`
- `vegetableBasket`
- `vegetables`
- `verticalTidyUp`
- `verticalTimeline`
- `verticallyCentered`
- `vest`
- `vial`
- `viciaFaba`
- `video`
- `videoConference`
- `videoFile`
- `videoOne`
- `videoTwo`
- `videocamera`
- `videocameraOne`
- `viewGridCard`
- `viewGridDetail`
- `viewGridList`
- `viewList`
- `viewfinder`
- `vigo`
- `vip`
- `vipOne`
- `virtualRealityGlasses`
- `voice`
- `voiceInput`
- `voiceMessage`
- `voiceOne`
- `voicemail`
- `volkswagen`
- `volumeDown`
- `volumeMute`
- `volumeNotice`
- `volumeSmall`
- `volumeUp`
- `vrGlasses`
- `wallet`
- `walletOne`
- `walletThree`
- `walletTwo`
- `warehousing`
- `washingMachine`
- `washingMachineOne`
- `watch`
- `watchOne`
- `water`
- `waterLevel`
- `waterNo`
- `waterRate`
- `waterRateTwo`
- `waterfallsH`
- `waterfallsV`
- `watermelon`
- `watermelonOne`
- `waterpoloOne`
- `wearyFace`
- `webPage`
- `webcam`
- `wechat`
- `weibo`
- `weight`
- `weightlifting`
- `weixinCardsOffers`
- `weixinMarket`
- `weixinMiniApp`
- `weixinPeopleNearby`
- `weixinScan`
- `weixinShake`
- `weixinTopStories`
- `whale`
- `wheelchair`
- `whirlwind`
- `wholeSiteAccelerator`
- `windTurbine`
- `windmill`
- `windmillTwo`
- `windows`
- `wingsuitFlying`
- `winkingFace`
- `winkingFaceWithOpenEyes`
- `women`
- `woolenHat`
- `word`
- `workbench`
- `worker`
- `worriedFace`
- `write`
- `writingFluently`
- `wrongUser`
- `xiaodu`
- `xiaoduHome`
- `xigua`
- `xingfuli`
- `yep`
- `youtobe`
- `youtube`
- `zeroKey`
- `zijinyunying`
- `zip`
- `zoom`
- `zoomIn`
- `zoomInternal`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AbnormalIcon, AccelerationIcon, ActivitySourceIcon, AdIcon } from '@stacksjs/iconify-icon-park-twotone'

  global.navIcons = {
    home: AbnormalIcon({ size: 20, class: 'nav-icon' }),
    about: AccelerationIcon({ size: 20, class: 'nav-icon' }),
    contact: ActivitySourceIcon({ size: 20, class: 'nav-icon' }),
    settings: AdIcon({ size: 20, class: 'nav-icon' })
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
import { AbnormalIcon } from '@stacksjs/iconify-icon-park-twotone'

const icon = AbnormalIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbnormalIcon, AccelerationIcon, ActivitySourceIcon } from '@stacksjs/iconify-icon-park-twotone'

const successIcon = AbnormalIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccelerationIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ActivitySourceIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbnormalIcon, AccelerationIcon } from '@stacksjs/iconify-icon-park-twotone'
   const icon = AbnormalIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abnormal, acceleration } from '@stacksjs/iconify-icon-park-twotone'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abnormal, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbnormalIcon, AccelerationIcon } from '@stacksjs/iconify-icon-park-twotone'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-icon-park-twotone'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbnormalIcon } from '@stacksjs/iconify-icon-park-twotone'
     global.icon = AbnormalIcon({ size: 24 })
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
   const icon = AbnormalIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abnormal } from '@stacksjs/iconify-icon-park-twotone'

// Icons are typed as IconData
const myIcon: IconData = abnormal
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/bytedance/IconPark/blob/master/LICENSE) for more information.

## Credits

- **Icons**: ByteDance ([Website](https://github.com/bytedance/IconPark))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/icon-park-twotone/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/icon-park-twotone/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
