# Unicons

> Unicons icons for stx from Iconify

## Overview

This package provides access to 1216 icons from the Unicons collection through the stx iconify integration.

**Collection ID:** `uil`
**Total Icons:** 1216
**Author:** Iconscout ([Website](https://github.com/Iconscout/unicons))
**License:** Apache 2.0 ([Details](https://github.com/Iconscout/unicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-uil
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 0PlusIcon, 10PlusIcon, 12PlusIcon } from '@stacksjs/iconify-uil'

// Basic usage
const icon = 0PlusIcon()

// With size
const sizedIcon = 0PlusIcon({ size: 24 })

// With color
const coloredIcon = 10PlusIcon({ color: 'red' })

// With multiple props
const customIcon = 12PlusIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 0PlusIcon, 10PlusIcon, 12PlusIcon } from '@stacksjs/iconify-uil'

  global.icons = {
    home: 0PlusIcon({ size: 24 }),
    user: 10PlusIcon({ size: 24, color: '#4a90e2' }),
    settings: 12PlusIcon({ size: 32 })
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
import { 0Plus, 10Plus, 12Plus } from '@stacksjs/iconify-uil'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(0Plus, { size: 24 })
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
const redIcon = 0PlusIcon({ color: 'red' })
const blueIcon = 0PlusIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 0PlusIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 0PlusIcon({ class: 'text-primary' })
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
const icon24 = 0PlusIcon({ size: 24 })
const icon1em = 0PlusIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 0PlusIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 0PlusIcon({ height: '1em' })
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
const smallIcon = 0PlusIcon({ class: 'icon-small' })
const largeIcon = 0PlusIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1216** icons:

- `0Plus`
- `10Plus`
- `12Plus`
- `13Plus`
- `16Plus`
- `17Plus`
- `18Plus`
- `21Plus`
- `3Plus`
- `500px`
- `6Plus`
- `abacus`
- `accessibleIconAlt`
- `adjust`
- `adjustAlt`
- `adjustCircle`
- `adjustHalf`
- `adobe`
- `adobeAlt`
- `airplay`
- `align`
- `alignAlt`
- `alignCenter`
- `alignCenterAlt`
- `alignCenterH`
- `alignCenterJustify`
- `alignCenterV`
- `alignJustify`
- `alignLeft`
- `alignLeftJustify`
- `alignLetterRight`
- `alignRight`
- `alignRightJustify`
- `amazon`
- `ambulance`
- `analysis`
- `analytics`
- `anchor`
- `android`
- `androidAlt`
- `androidPhoneSlash`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleLeftB`
- `angleRight`
- `angleRightB`
- `angleUp`
- `angry`
- `ankh`
- `annoyed`
- `annoyedAlt`
- `apple`
- `appleAlt`
- `apps`
- `archive`
- `archiveAlt`
- `archway`
- `arrow`
- `arrowBreak`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowCompressH`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowFromRight`
- `arrowFromTop`
- `arrowGrowth`
- `arrowLeft`
- `arrowRandom`
- `arrowResizeDiagonal`
- `arrowRight`
- `arrowToBottom`
- `arrowToRight`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpRight`
- `arrowsH`
- `arrowsHAlt`
- `arrowsLeftDown`
- `arrowsMaximize`
- `arrowsMerge`
- `arrowsResize`
- `arrowsResizeH`
- `arrowsResizeV`
- `arrowsRightDown`
- `arrowsShrinkH`
- `arrowsShrinkV`
- `arrowsUpRight`
- `arrowsV`
- `arrowsVAlt`
- `assistiveListeningSystems`
- `asterisk`
- `at`
- `atom`
- `autoFlash`
- `award`
- `awardAlt`
- `babyCarriage`
- `backpack`
- `backspace`
- `backward`
- `bag`
- `bagAlt`
- `bagSlash`
- `balanceScale`
- `ban`
- `bandAid`
- `bars`
- `baseballBall`
- `basketball`
- `basketballHoop`
- `bath`
- `batteryBolt`
- `batteryEmpty`
- `bed`
- `bedDouble`
- `behance`
- `behanceAlt`
- `bell`
- `bellSchool`
- `bellSlash`
- `bill`
- `bing`
- `bitcoin`
- `bitcoinAlt`
- `bitcoinCircle`
- `bitcoinSign`
- `blackBerry`
- `blogger`
- `bloggerAlt`
- `bluetoothB`
- `bold`
- `bolt`
- `boltAlt`
- `boltSlash`
- `book`
- `bookAlt`
- `bookMedical`
- `bookOpen`
- `bookReader`
- `bookmark`
- `bookmarkFull`
- `books`
- `boombox`
- `borderAlt`
- `borderBottom`
- `borderClear`
- `borderHorizontal`
- `borderInner`
- `borderLeft`
- `borderOut`
- `borderRight`
- `borderTop`
- `borderVertical`
- `bowlingBall`
- `box`
- `bracketsCurly`
- `brain`
- `briefcase`
- `briefcaseAlt`
- `bright`
- `brightness`
- `brightnessEmpty`
- `brightnessHalf`
- `brightnessLow`
- `brightnessMinus`
- `brightnessPlus`
- `bringBottom`
- `bringFront`
- `browser`
- `brushAlt`
- `bug`
- `building`
- `bullseye`
- `bus`
- `busAlt`
- `busSchool`
- `calculator`
- `calculatorAlt`
- `calendar`
- `calendarAlt`
- `calendarSlash`
- `calender`
- `calling`
- `camera`
- `cameraChange`
- `cameraPlus`
- `cameraSlash`
- `cancel`
- `capsule`
- `capture`
- `car`
- `carSideview`
- `carSlash`
- `carWash`
- `cardAtm`
- `caretRight`
- `cell`
- `celsius`
- `channel`
- `channelAdd`
- `chart`
- `chartBar`
- `chartBarAlt`
- `chartDown`
- `chartGrowth`
- `chartGrowthAlt`
- `chartLine`
- `chartPie`
- `chartPieAlt`
- `chat`
- `chatBubbleUser`
- `chatInfo`
- `check`
- `checkCircle`
- `checkSquare`
- `circle`
- `circleLayer`
- `circuit`
- `clapperBoard`
- `clinicMedical`
- `clipboard`
- `clipboardAlt`
- `clipboardBlank`
- `clipboardNotes`
- `clock`
- `clockEight`
- `clockFive`
- `clockNine`
- `clockSeven`
- `clockTen`
- `clockThree`
- `clockTwo`
- `closedCaptioning`
- `closedCaptioningSlash`
- `cloud`
- `cloudBlock`
- `cloudBookmark`
- `cloudCheck`
- `cloudComputing`
- `cloudDataConnection`
- `cloudDatabaseTree`
- `cloudDownload`
- `cloudDrizzle`
- `cloudExclamation`
- `cloudHail`
- `cloudHeart`
- `cloudInfo`
- `cloudLock`
- `cloudMeatball`
- `cloudMoon`
- `cloudMoonHail`
- `cloudMoonMeatball`
- `cloudMoonRain`
- `cloudMoonShowers`
- `cloudMoonTear`
- `cloudQuestion`
- `cloudRain`
- `cloudRainSun`
- `cloudRedo`
- `cloudShare`
- `cloudShield`
- `cloudShowers`
- `cloudShowersAlt`
- `cloudShowersHeavy`
- `cloudSlash`
- `cloudSun`
- `cloudSunHail`
- `cloudSunMeatball`
- `cloudSunRain`
- `cloudSunRainAlt`
- `cloudSunTear`
- `cloudTimes`
- `cloudUnlock`
- `cloudUpload`
- `cloudWifi`
- `cloudWind`
- `clouds`
- `club`
- `codeBranch`
- `coffee`
- `cog`
- `coins`
- `columns`
- `comment`
- `commentAdd`
- `commentAlt`
- `commentAltBlock`
- `commentAltChartLines`
- `commentAltCheck`
- `commentAltDots`
- `commentAltDownload`
- `commentAltEdit`
- `commentAltExclamation`
- `commentAltHeart`
- `commentAltImage`
- `commentAltInfo`
- `commentAltLines`
- `commentAltLock`
- `commentAltMedical`
- `commentAltMessage`
- `commentAltNotes`
- `commentAltPlus`
- `commentAltQuestion`
- `commentAltRedo`
- `commentAltSearch`
- `commentAltShare`
- `commentAltShield`
- `commentAltSlash`
- `commentAltUpload`
- `commentAltVerify`
- `commentBlock`
- `commentChartLine`
- `commentCheck`
- `commentDots`
- `commentDownload`
- `commentEdit`
- `commentExclamation`
- `commentHeart`
- `commentImage`
- `commentInfo`
- `commentInfoAlt`
- `commentLines`
- `commentLock`
- `commentMedical`
- `commentMessage`
- `commentNotes`
- `commentPlus`
- `commentQuestion`
- `commentRedo`
- `commentSearch`
- `commentShare`
- `commentShield`
- `commentSlash`
- `commentUpload`
- `commentVerify`
- `comments`
- `commentsAlt`
- `compactDisc`
- `comparison`
- `compass`
- `compress`
- `compressAlt`
- `compressAltLeft`
- `compressArrows`
- `compressLines`
- `compressPoint`
- `compressV`
- `confused`
- `constructor`
- `copy`
- `copyAlt`
- `copyLandscape`
- `copyright`
- `cornerDownLeft`
- `cornerDownRight`
- `cornerDownRightAlt`
- `cornerLeftDown`
- `cornerRightDown`
- `cornerUpLeft`
- `cornerUpLeftAlt`
- `cornerUpRight`
- `cornerUpRightAlt`
- `coronavirus`
- `createDashboard`
- `creativeCommonsPd`
- `creditCard`
- `creditCardSearch`
- `crockery`
- `cropAlt`
- `cropAltRotateLeft`
- `cropAltRotateRight`
- `crosshair`
- `crosshairAlt`
- `crosshairs`
- `css3Simple`
- `cube`
- `dashboard`
- `dataSharing`
- `database`
- `databaseAlt`
- `desert`
- `desktop`
- `desktopAlt`
- `desktopAltSlash`
- `desktopCloudAlt`
- `desktopSlash`
- `dialpad`
- `dialpadAlt`
- `diamond`
- `diary`
- `diaryAlt`
- `diceFive`
- `diceFour`
- `diceOne`
- `diceSix`
- `diceThree`
- `diceTwo`
- `direction`
- `directions`
- `discord`
- `dizzyMeh`
- `dna`
- `docker`
- `documentInfo`
- `documentLayoutCenter`
- `documentLayoutLeft`
- `documentLayoutRight`
- `dollarAlt`
- `dollarSign`
- `dollarSignAlt`
- `downloadAlt`
- `draggabledots`
- `dribbble`
- `drill`
- `dropbox`
- `dumbbell`
- `ear`
- `edit`
- `editAlt`
- `elipsisDoubleVAlt`
- `ellipsisH`
- `ellipsisV`
- `emoji`
- `englishToChinese`
- `enter`
- `envelope`
- `envelopeAdd`
- `envelopeAlt`
- `envelopeBlock`
- `envelopeBookmark`
- `envelopeCheck`
- `envelopeDownload`
- `envelopeDownloadAlt`
- `envelopeEdit`
- `envelopeExclamation`
- `envelopeHeart`
- `envelopeInfo`
- `envelopeLock`
- `envelopeMinus`
- `envelopeOpen`
- `envelopeQuestion`
- `envelopeReceive`
- `envelopeRedo`
- `envelopeSearch`
- `envelopeSend`
- `envelopeShare`
- `envelopeShield`
- `envelopeStar`
- `envelopeTimes`
- `envelopeUpload`
- `envelopeUploadAlt`
- `envelopes`
- `equalCircle`
- `estate`
- `euro`
- `euroCircle`
- `exchange`
- `exchangeAlt`
- `exclamation`
- `exclamationCircle`
- `exclamationOctagon`
- `exclamationTriangle`
- `exclude`
- `exit`
- `expandAlt`
- `expandArrows`
- `expandArrowsAlt`
- `expandFromCorner`
- `expandLeft`
- `expandRight`
- `export`
- `exposureAlt`
- `exposureIncrease`
- `externalLinkAlt`
- `eye`
- `eyeSlash`
- `facebook`
- `facebookF`
- `facebookMessenger`
- `facebookMessengerAlt`
- `fahrenheit`
- `fastMail`
- `fastMailAlt`
- `favorite`
- `feedback`
- `fidgetSpinner`
- `file`
- `fileAlt`
- `fileBlank`
- `fileBlockAlt`
- `fileBookmarkAlt`
- `fileCheck`
- `fileCheckAlt`
- `fileContract`
- `fileContractDollar`
- `fileCopyAlt`
- `fileDownload`
- `fileDownloadAlt`
- `fileEditAlt`
- `fileExclamation`
- `fileExclamationAlt`
- `fileExport`
- `fileGraph`
- `fileHeart`
- `fileImport`
- `fileInfoAlt`
- `fileLandscape`
- `fileLandscapeAlt`
- `fileLanscapeSlash`
- `fileLockAlt`
- `fileMedical`
- `fileMedicalAlt`
- `fileMinus`
- `fileMinusAlt`
- `fileNetwork`
- `filePlus`
- `filePlusAlt`
- `fileQuestion`
- `fileQuestionAlt`
- `fileRedoAlt`
- `fileSearchAlt`
- `fileShareAlt`
- `fileShieldAlt`
- `fileSlash`
- `fileTimes`
- `fileTimesAlt`
- `fileUpload`
- `fileUploadAlt`
- `filesLandscapes`
- `filesLandscapesAlt`
- `film`
- `filter`
- `filterSlash`
- `fire`
- `flask`
- `flaskPotion`
- `flipH`
- `flipHAlt`
- `flipV`
- `flipVAlt`
- `flower`
- `focus`
- `focusAdd`
- `focusTarget`
- `folder`
- `folderCheck`
- `folderDownload`
- `folderExclamation`
- `folderHeart`
- `folderInfo`
- `folderLock`
- `folderMedical`
- `folderMinus`
- `folderNetwork`
- `folderOpen`
- `folderPlus`
- `folderQuestion`
- `folderSlash`
- `folderTimes`
- `folderUpload`
- `font`
- `football`
- `footballAmerican`
- `footballBall`
- `forecastcloudMoonTear`
- `forwadedCall`
- `forward`
- `frown`
- `gameStructure`
- `gift`
- `github`
- `githubAlt`
- `gitlab`
- `glass`
- `glassMartini`
- `glassMartiniAlt`
- `glassMartiniAltSlash`
- `glassTea`
- `globe`
- `gold`
- `golfBall`
- `google`
- `googleDrive`
- `googleDriveAlt`
- `googleHangouts`
- `googleHangoutsAlt`
- `googlePlay`
- `graduationCap`
- `graphBar`
- `grid`
- `grids`
- `grin`
- `grinTongueWink`
- `grinTongueWinkAlt`
- `gripHorizontalLine`
- `hardHat`
- `hdd`
- `headSide`
- `headSideCough`
- `headSideMask`
- `headphoneSlash`
- `headphones`
- `headphonesAlt`
- `heart`
- `heartAlt`
- `heartBreak`
- `heartMedical`
- `heartRate`
- `heartSign`
- `heartbeat`
- `hindiToChinese`
- `hipchat`
- `history`
- `historyAlt`
- `home`
- `homeAlt`
- `horizontalAlignCenter`
- `horizontalAlignLeft`
- `horizontalAlignRight`
- `horizontalDistributionCenter`
- `horizontalDistributionLeft`
- `horizontalDistributionRight`
- `hospital`
- `hospitalSquareSign`
- `hospitalSymbol`
- `hourglass`
- `houseUser`
- `html3`
- `html3Alt`
- `html5`
- `html5Alt`
- `hunting`
- `icons`
- `illustration`
- `image`
- `imageAltSlash`
- `imageBlock`
- `imageBroken`
- `imageCheck`
- `imageDownload`
- `imageEdit`
- `imageLock`
- `imageMinus`
- `imagePlus`
- `imageQuestion`
- `imageRedo`
- `imageResizeLandscape`
- `imageResizeSquare`
- `imageSearch`
- `imageShare`
- `imageShield`
- `imageSlash`
- `imageTimes`
- `imageUpload`
- `imageV`
- `images`
- `import`
- `inbox`
- `incomingCall`
- `info`
- `infoCircle`
- `instagram`
- `instagramAlt`
- `intercom`
- `intercomAlt`
- `invoice`
- `italic`
- `jackhammer`
- `javaScript`
- `kayak`
- `keySkeleton`
- `keySkeletonAlt`
- `keyboard`
- `keyboardAlt`
- `keyboardHide`
- `keyboardShow`
- `keyholeCircle`
- `keyholeSquare`
- `keyholeSquareFull`
- `kid`
- `label`
- `labelAlt`
- `lamp`
- `language`
- `laptop`
- `laptopCloud`
- `laptopConnection`
- `laughing`
- `layerGroup`
- `layerGroupSlash`
- `layers`
- `layersAlt`
- `layersSlash`
- `left`
- `leftArrowFromLeft`
- `leftArrowToLeft`
- `leftIndent`
- `leftIndentAlt`
- `leftToRightTextDirection`
- `letterChineseA`
- `letterEnglishA`
- `letterHindiA`
- `letterJapaneseA`
- `lifeRing`
- `lightbulb`
- `lightbulbAlt`
- `line`
- `lineAlt`
- `lineSpacing`
- `link`
- `linkAdd`
- `linkAlt`
- `linkBroken`
- `linkH`
- `linkedin`
- `linkedinAlt`
- `linux`
- `liraSign`
- `listOl`
- `listOlAlt`
- `listUiAlt`
- `listUl`
- `locationArrow`
- `locationArrowAlt`
- `locationPinAlt`
- `locationPoint`
- `lock`
- `lockAccess`
- `lockAlt`
- `lockOpenAlt`
- `lockSlash`
- `lottiefiles`
- `lottiefilesAlt`
- `luggageCart`
- `mailbox`
- `mailboxAlt`
- `map`
- `mapMarker`
- `mapMarkerAlt`
- `mapMarkerEdit`
- `mapMarkerInfo`
- `mapMarkerMinus`
- `mapMarkerPlus`
- `mapMarkerQuestion`
- `mapMarkerShield`
- `mapMarkerSlash`
- `mapPin`
- `mapPinAlt`
- `mars`
- `masterCard`
- `maximizeLeft`
- `medal`
- `medicalDrip`
- `medicalSquare`
- `medicalSquareFull`
- `mediumM`
- `medkit`
- `meetingBoard`
- `megaphone`
- `meh`
- `mehAlt`
- `mehClosedEye`
- `message`
- `metro`
- `microphone`
- `microphoneSlash`
- `microscope`
- `microsoft`
- `minus`
- `minusCircle`
- `minusPath`
- `minusSquare`
- `minusSquareFull`
- `missedCall`
- `mobileAndroid`
- `mobileAndroidAlt`
- `mobileVibrate`
- `modem`
- `moneyBill`
- `moneyBillSlash`
- `moneyBillStack`
- `moneyInsert`
- `moneyStack`
- `moneyWithdraw`
- `moneyWithdrawal`
- `moneybag`
- `moneybagAlt`
- `monitor`
- `monitorHeartRate`
- `moon`
- `moonEclipse`
- `moonset`
- `mountains`
- `mountainsSun`
- `mouse`
- `mouseAlt`
- `mouseAlt2`
- `multiply`
- `music`
- `musicNote`
- `musicTuneSlash`
- `nA`
- `navigator`
- `nerd`
- `newspaper`
- `ninja`
- `noEntry`
- `notebooks`
- `notes`
- `objectGroup`
- `objectUngroup`
- `octagon`
- `okta`
- `opera`
- `operaAlt`
- `outgoingCall`
- `outline`
- `package`
- `padlock`
- `pagelines`
- `pagerduty`
- `paintTool`
- `palette`
- `panelAdd`
- `panoramaH`
- `panoramaHAlt`
- `panoramaV`
- `paperclip`
- `paragraph`
- `parcel`
- `parkingCircle`
- `parkingSquare`
- `pathfinder`
- `pathfinderUnite`
- `pause`
- `pauseCircle`
- `paypal`
- `pen`
- `pentagon`
- `percentage`
- `phone`
- `phoneAlt`
- `phonePause`
- `phoneSlash`
- `phoneTimes`
- `phoneVolume`
- `picture`
- `pizzaSlice`
- `plane`
- `planeArrival`
- `planeDeparture`
- `planeFly`
- `play`
- `playCircle`
- `plug`
- `plus`
- `plusCircle`
- `plusSquare`
- `podium`
- `polygon`
- `postStamp`
- `postcard`
- `pound`
- `poundCircle`
- `power`
- `prescriptionBottle`
- `presentation`
- `presentationCheck`
- `presentationEdit`
- `presentationLine`
- `presentationLinesAlt`
- `presentationMinus`
- `presentationPlay`
- `presentationPlus`
- `presentationTimes`
- `previous`
- `pricetagAlt`
- `print`
- `printSlash`
- `process`
- `processor`
- `programmingLanguage`
- `pump`
- `puzzlePiece`
- `qrcodeScan`
- `question`
- `questionCircle`
- `rainbow`
- `raindrops`
- `raindropsAlt`
- `react`
- `receipt`
- `receiptAlt`
- `recordAudio`
- `redditAlienAlt`
- `redo`
- `refresh`
- `registered`
- `repeat`
- `restaurant`
- `rightIndentAlt`
- `rightToLeftTextDirection`
- `robot`
- `rocket`
- `ropeWay`
- `rotate360`
- `rss`
- `rssAlt`
- `rssInterface`
- `ruler`
- `rulerCombined`
- `rupeeSign`
- `sad`
- `sadCry`
- `sadCrying`
- `sadDizzy`
- `sadSquint`
- `sanitizer`
- `sanitizerAlt`
- `save`
- `scalingLeft`
- `scalingRight`
- `scenery`
- `schedule`
- `screw`
- `scroll`
- `scrollH`
- `search`
- `searchAlt`
- `searchMinus`
- `searchPlus`
- `selfie`
- `server`
- `serverAlt`
- `serverConnection`
- `serverNetwork`
- `serverNetworkAlt`
- `servers`
- `servicemark`
- `setting`
- `share`
- `shareAlt`
- `shield`
- `shieldCheck`
- `shieldExclamation`
- `shieldPlus`
- `shieldQuestion`
- `shieldSlash`
- `ship`
- `shop`
- `shoppingBag`
- `shoppingBasket`
- `shoppingCart`
- `shoppingCartAlt`
- `shovel`
- `shrink`
- `shuffle`
- `shutter`
- `shutterAlt`
- `sick`
- `sigma`
- `signAlt`
- `signInAlt`
- `signLeft`
- `signOutAlt`
- `signRight`
- `signal`
- `signalAlt`
- `signalAlt3`
- `signin`
- `signout`
- `silence`
- `silentSquint`
- `simCard`
- `sitemap`
- `skipForward`
- `skipForwardAlt`
- `skipForwardCircle`
- `skype`
- `skypeAlt`
- `slack`
- `slackAlt`
- `sleep`
- `sliderH`
- `sliderHRange`
- `slidersV`
- `slidersVAlt`
- `smile`
- `smileBeam`
- `smileDizzy`
- `smileSquintWink`
- `smileSquintWinkAlt`
- `smileWink`
- `smileWinkAlt`
- `snapchatAlt`
- `snapchatGhost`
- `snapchatSquare`
- `snowFlake`
- `snowflake`
- `snowflakeAlt`
- `socialDistancing`
- `solid`
- `sort`
- `sortAmountDown`
- `sortAmountUp`
- `sorting`
- `spaceKey`
- `spade`
- `sperms`
- `spin`
- `spinner`
- `spinnerAlt`
- `square`
- `squareFull`
- `squareShape`
- `squint`
- `star`
- `starHalfAlt`
- `statistics`
- `stepBackward`
- `stepBackwardAlt`
- `stepBackwardCircle`
- `stepForward`
- `stethoscope`
- `stethoscopeAlt`
- `stopCircle`
- `stopwatch`
- `stopwatchSlash`
- `store`
- `storeAlt`
- `storeSlash`
- `streering`
- `stretcher`
- `stroller`
- `subject`
- `subway`
- `subwayAlt`
- `suitcase`
- `suitcaseAlt`
- `sun`
- `sunset`
- `surprise`
- `swatchbook`
- `swiggy`
- `swimmer`
- `sync`
- `syncExclamation`
- `syncSlash`
- `syringe`
- `table`
- `tableTennis`
- `tablet`
- `tablets`
- `tachometerFast`
- `tachometerFastAlt`
- `tag`
- `tagAlt`
- `tape`
- `taxi`
- `tear`
- `telegram`
- `telegramAlt`
- `telescope`
- `temperature`
- `temperatureEmpty`
- `temperatureHalf`
- `temperatureMinus`
- `temperaturePlus`
- `temperatureQuarter`
- `temperatureThreeQuarter`
- `tennisBall`
- `text`
- `textFields`
- `textSize`
- `textStrikeThrough`
- `th`
- `thLarge`
- `thSlash`
- `thermometer`
- `thumbsDown`
- `thumbsUp`
- `thunderstorm`
- `thunderstormMoon`
- `thunderstormSun`
- `ticket`
- `times`
- `timesCircle`
- `timesSquare`
- `toggleOff`
- `toggleOn`
- `toiletPaper`
- `topArrowFromTop`
- `topArrowToTop`
- `tornado`
- `trademark`
- `trademarkCircle`
- `trafficBarrier`
- `trafficLight`
- `transaction`
- `trash`
- `trashAlt`
- `trees`
- `triangle`
- `trophy`
- `trowel`
- `truck`
- `truckLoading`
- `tumblr`
- `tumblrAlt`
- `tumblrSquare`
- `tvRetro`
- `tvRetroSlash`
- `twitter`
- `twitterAlt`
- `umbrella`
- `unamused`
- `underline`
- `university`
- `unlock`
- `unlockAlt`
- `upload`
- `uploadAlt`
- `usdCircle`
- `usdSquare`
- `user`
- `userArrows`
- `userCheck`
- `userCircle`
- `userExclamation`
- `userLocation`
- `userMd`
- `userMinus`
- `userNurse`
- `userPlus`
- `userSquare`
- `userTimes`
- `usersAlt`
- `utensils`
- `utensilsAlt`
- `vectorSquare`
- `vectorSquareAlt`
- `venus`
- `verticalAlignBottom`
- `verticalAlignCenter`
- `verticalAlignTop`
- `verticalDistributeBottom`
- `verticalDistributionCenter`
- `verticalDistributionTop`
- `video`
- `videoQuestion`
- `videoSlash`
- `virusSlash`
- `visualStudio`
- `vk`
- `vkAlt`
- `voicemail`
- `voicemailRectangle`
- `volleyball`
- `volume`
- `volumeDown`
- `volumeMute`
- `volumeOff`
- `volumeUp`
- `vuejs`
- `vuejsAlt`
- `wall`
- `wallet`
- `watch`
- `watchAlt`
- `water`
- `waterDropSlash`
- `waterGlass`
- `webGrid`
- `webGridAlt`
- `webSection`
- `webSectionAlt`
- `webcam`
- `weight`
- `whatsapp`
- `whatsappAlt`
- `wheelBarrow`
- `wheelchair`
- `wheelchairAlt`
- `wifi`
- `wifiRouter`
- `wifiSlash`
- `wind`
- `windMoon`
- `windSun`
- `window`
- `windowGrid`
- `windowMaximize`
- `windowRestore`
- `windowSection`
- `windows`
- `windsock`
- `windy`
- `wordpress`
- `wordpressSimple`
- `wrapText`
- `wrench`
- `x`
- `xAdd`
- `yen`
- `yenCircle`
- `yinYang`
- `youtube`
- `youtubeAlt`

## Usage Examples

### Navigation Menu

```html
@js
  import { 0PlusIcon, 10PlusIcon, 12PlusIcon, 13PlusIcon } from '@stacksjs/iconify-uil'

  global.navIcons = {
    home: 0PlusIcon({ size: 20, class: 'nav-icon' }),
    about: 10PlusIcon({ size: 20, class: 'nav-icon' }),
    contact: 12PlusIcon({ size: 20, class: 'nav-icon' }),
    settings: 13PlusIcon({ size: 20, class: 'nav-icon' })
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
import { 0PlusIcon } from '@stacksjs/iconify-uil'

const icon = 0PlusIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 0PlusIcon, 10PlusIcon, 12PlusIcon } from '@stacksjs/iconify-uil'

const successIcon = 0PlusIcon({ size: 16, color: '#22c55e' })
const warningIcon = 10PlusIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 12PlusIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 0PlusIcon, 10PlusIcon } from '@stacksjs/iconify-uil'
   const icon = 0PlusIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 0Plus, 10Plus } from '@stacksjs/iconify-uil'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(0Plus, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 0PlusIcon, 10PlusIcon } from '@stacksjs/iconify-uil'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-uil'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0PlusIcon } from '@stacksjs/iconify-uil'
     global.icon = 0PlusIcon({ size: 24 })
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
   const icon = 0PlusIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0Plus } from '@stacksjs/iconify-uil'

// Icons are typed as IconData
const myIcon: IconData = 0Plus
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Iconscout/unicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Iconscout ([Website](https://github.com/Iconscout/unicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/uil/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/uil/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
