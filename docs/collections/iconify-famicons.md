# Famicons

> Famicons icons for stx from Iconify

## Overview

This package provides access to 1342 icons from the Famicons collection through the stx iconify integration.

**Collection ID:** `famicons`
**Total Icons:** 1342
**Author:** Family ([Website](https://github.com/familyjs/famicons))
**License:** MIT ([Details](https://github.com/familyjs/famicons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-famicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccessibilityIcon, AccessibilityOutlineIcon, AccessibilitySharpIcon } from '@stacksjs/iconify-famicons'

// Basic usage
const icon = AccessibilityIcon()

// With size
const sizedIcon = AccessibilityIcon({ size: 24 })

// With color
const coloredIcon = AccessibilityOutlineIcon({ color: 'red' })

// With multiple props
const customIcon = AccessibilitySharpIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccessibilityIcon, AccessibilityOutlineIcon, AccessibilitySharpIcon } from '@stacksjs/iconify-famicons'

  global.icons = {
    home: AccessibilityIcon({ size: 24 }),
    user: AccessibilityOutlineIcon({ size: 24, color: '#4a90e2' }),
    settings: AccessibilitySharpIcon({ size: 32 })
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
import { accessibility, accessibilityOutline, accessibilitySharp } from '@stacksjs/iconify-famicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility, { size: 24 })
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
const redIcon = AccessibilityIcon({ color: 'red' })
const blueIcon = AccessibilityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccessibilityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccessibilityIcon({ class: 'text-primary' })
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
const icon24 = AccessibilityIcon({ size: 24 })
const icon1em = AccessibilityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccessibilityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccessibilityIcon({ height: '1em' })
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
const smallIcon = AccessibilityIcon({ class: 'icon-small' })
const largeIcon = AccessibilityIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1342** icons:

- `accessibility`
- `accessibilityOutline`
- `accessibilitySharp`
- `add`
- `addCircle`
- `addCircleOutline`
- `addCircleSharp`
- `addOutline`
- `addSharp`
- `airplane`
- `airplaneOutline`
- `airplaneSharp`
- `alarm`
- `alarmOutline`
- `alarmSharp`
- `albums`
- `albumsOutline`
- `albumsSharp`
- `alert`
- `alertCircle`
- `alertCircleOutline`
- `alertCircleSharp`
- `alertOutline`
- `alertSharp`
- `americanFootball`
- `americanFootballOutline`
- `americanFootballSharp`
- `analytics`
- `analyticsOutline`
- `analyticsSharp`
- `aperture`
- `apertureOutline`
- `apertureSharp`
- `apps`
- `appsOutline`
- `appsSharp`
- `archive`
- `archiveOutline`
- `archiveSharp`
- `arrowBack`
- `arrowBackCircle`
- `arrowBackCircleOutline`
- `arrowBackCircleSharp`
- `arrowBackOutline`
- `arrowBackSharp`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownCircleOutline`
- `arrowDownCircleSharp`
- `arrowDownOutline`
- `arrowDownSharp`
- `arrowForward`
- `arrowForwardCircle`
- `arrowForwardCircleOutline`
- `arrowForwardCircleSharp`
- `arrowForwardOutline`
- `arrowForwardSharp`
- `arrowRedo`
- `arrowRedoCircle`
- `arrowRedoCircleOutline`
- `arrowRedoCircleSharp`
- `arrowRedoOutline`
- `arrowRedoSharp`
- `arrowUndo`
- `arrowUndoCircle`
- `arrowUndoCircleOutline`
- `arrowUndoCircleSharp`
- `arrowUndoOutline`
- `arrowUndoSharp`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpCircleOutline`
- `arrowUpCircleSharp`
- `arrowUpOutline`
- `arrowUpSharp`
- `at`
- `atCircle`
- `atCircleOutline`
- `atCircleSharp`
- `atOutline`
- `atSharp`
- `attach`
- `attachOutline`
- `attachSharp`
- `backspace`
- `backspaceOutline`
- `backspaceSharp`
- `bag`
- `bagAdd`
- `bagAddOutline`
- `bagAddSharp`
- `bagCheck`
- `bagCheckOutline`
- `bagCheckSharp`
- `bagHandle`
- `bagHandleOutline`
- `bagHandleSharp`
- `bagOutline`
- `bagRemove`
- `bagRemoveOutline`
- `bagRemoveSharp`
- `bagSharp`
- `balloon`
- `balloonOutline`
- `balloonSharp`
- `ban`
- `banOutline`
- `banSharp`
- `bandage`
- `bandageOutline`
- `bandageSharp`
- `barChart`
- `barChartOutline`
- `barChartSharp`
- `barbell`
- `barbellOutline`
- `barbellSharp`
- `barcode`
- `barcodeOutline`
- `barcodeSharp`
- `baseball`
- `baseballOutline`
- `baseballSharp`
- `basket`
- `basketOutline`
- `basketSharp`
- `basketball`
- `basketballOutline`
- `basketballSharp`
- `batteryCharging`
- `batteryChargingOutline`
- `batteryChargingSharp`
- `batteryDead`
- `batteryDeadOutline`
- `batteryDeadSharp`
- `batteryFull`
- `batteryFullOutline`
- `batteryFullSharp`
- `batteryHalf`
- `batteryHalfOutline`
- `batteryHalfSharp`
- `beaker`
- `beakerOutline`
- `beakerSharp`
- `bed`
- `bedOutline`
- `bedSharp`
- `beer`
- `beerOutline`
- `beerSharp`
- `bicycle`
- `bicycleOutline`
- `bicycleSharp`
- `bluetooth`
- `bluetoothOutline`
- `bluetoothSharp`
- `boat`
- `boatOutline`
- `boatSharp`
- `body`
- `bodyOutline`
- `bodySharp`
- `bonfire`
- `bonfireOutline`
- `bonfireSharp`
- `book`
- `bookOutline`
- `bookSharp`
- `bookmark`
- `bookmarkOutline`
- `bookmarkSharp`
- `bookmarks`
- `bookmarksOutline`
- `bookmarksSharp`
- `bowlingBall`
- `bowlingBallOutline`
- `bowlingBallSharp`
- `briefcase`
- `briefcaseOutline`
- `briefcaseSharp`
- `browsers`
- `browsersOutline`
- `browsersSharp`
- `brush`
- `brushOutline`
- `brushSharp`
- `bug`
- `bugOutline`
- `bugSharp`
- `build`
- `buildOutline`
- `buildSharp`
- `bulb`
- `bulbOutline`
- `bulbSharp`
- `bus`
- `busOutline`
- `busSharp`
- `business`
- `businessOutline`
- `businessSharp`
- `cafe`
- `cafeOutline`
- `cafeSharp`
- `calculator`
- `calculatorOutline`
- `calculatorSharp`
- `calendar`
- `calendarClear`
- `calendarClearOutline`
- `calendarClearSharp`
- `calendarNumber`
- `calendarNumberOutline`
- `calendarNumberSharp`
- `calendarOutline`
- `calendarSharp`
- `call`
- `callOutline`
- `callSharp`
- `camera`
- `cameraOutline`
- `cameraReverse`
- `cameraReverseOutline`
- `cameraReverseSharp`
- `cameraSharp`
- `car`
- `carOutline`
- `carSharp`
- `carSport`
- `carSportOutline`
- `carSportSharp`
- `card`
- `cardOutline`
- `cardSharp`
- `caretBack`
- `caretBackCircle`
- `caretBackCircleOutline`
- `caretBackCircleSharp`
- `caretBackOutline`
- `caretBackSharp`
- `caretDown`
- `caretDownCircle`
- `caretDownCircleOutline`
- `caretDownCircleSharp`
- `caretDownOutline`
- `caretDownSharp`
- `caretForward`
- `caretForwardCircle`
- `caretForwardCircleOutline`
- `caretForwardCircleSharp`
- `caretForwardOutline`
- `caretForwardSharp`
- `caretUp`
- `caretUpCircle`
- `caretUpCircleOutline`
- `caretUpCircleSharp`
- `caretUpOutline`
- `caretUpSharp`
- `cart`
- `cartOutline`
- `cartSharp`
- `cash`
- `cashOutline`
- `cashSharp`
- `cellular`
- `cellularOutline`
- `cellularSharp`
- `chatbox`
- `chatboxEllipses`
- `chatboxEllipsesOutline`
- `chatboxEllipsesSharp`
- `chatboxOutline`
- `chatboxSharp`
- `chatbubble`
- `chatbubbleEllipses`
- `chatbubbleEllipsesOutline`
- `chatbubbleEllipsesSharp`
- `chatbubbleOutline`
- `chatbubbleSharp`
- `chatbubbles`
- `chatbubblesOutline`
- `chatbubblesSharp`
- `checkbox`
- `checkboxOutline`
- `checkboxSharp`
- `checkmark`
- `checkmarkCircle`
- `checkmarkCircleOutline`
- `checkmarkCircleSharp`
- `checkmarkDone`
- `checkmarkDoneCircle`
- `checkmarkDoneCircleOutline`
- `checkmarkDoneCircleSharp`
- `checkmarkDoneOutline`
- `checkmarkDoneSharp`
- `checkmarkOutline`
- `checkmarkSharp`
- `chevronBack`
- `chevronBackCircle`
- `chevronBackCircleOutline`
- `chevronBackCircleSharp`
- `chevronBackOutline`
- `chevronBackSharp`
- `chevronCollapse`
- `chevronCollapseOutline`
- `chevronCollapseSharp`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownCircleOutline`
- `chevronDownCircleSharp`
- `chevronDownOutline`
- `chevronDownSharp`
- `chevronExpand`
- `chevronExpandOutline`
- `chevronExpandSharp`
- `chevronForward`
- `chevronForwardCircle`
- `chevronForwardCircleOutline`
- `chevronForwardCircleSharp`
- `chevronForwardOutline`
- `chevronForwardSharp`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpCircleOutline`
- `chevronUpCircleSharp`
- `chevronUpOutline`
- `chevronUpSharp`
- `clipboard`
- `clipboardOutline`
- `clipboardSharp`
- `close`
- `closeCircle`
- `closeCircleOutline`
- `closeCircleSharp`
- `closeOutline`
- `closeSharp`
- `cloud`
- `cloudCircle`
- `cloudCircleOutline`
- `cloudCircleSharp`
- `cloudDone`
- `cloudDoneOutline`
- `cloudDoneSharp`
- `cloudDownload`
- `cloudDownloadOutline`
- `cloudDownloadSharp`
- `cloudOffline`
- `cloudOfflineOutline`
- `cloudOfflineSharp`
- `cloudOutline`
- `cloudSharp`
- `cloudUpload`
- `cloudUploadOutline`
- `cloudUploadSharp`
- `cloudy`
- `cloudyNight`
- `cloudyNightOutline`
- `cloudyNightSharp`
- `cloudyOutline`
- `cloudySharp`
- `code`
- `codeDownload`
- `codeDownloadOutline`
- `codeDownloadSharp`
- `codeOutline`
- `codeSharp`
- `codeSlash`
- `codeSlashOutline`
- `codeSlashSharp`
- `codeWorking`
- `codeWorkingOutline`
- `codeWorkingSharp`
- `cog`
- `cogOutline`
- `cogSharp`
- `colorFill`
- `colorFillOutline`
- `colorFillSharp`
- `colorFilter`
- `colorFilterOutline`
- `colorFilterSharp`
- `colorPalette`
- `colorPaletteOutline`
- `colorPaletteSharp`
- `colorWand`
- `colorWandOutline`
- `colorWandSharp`
- `compass`
- `compassOutline`
- `compassSharp`
- `construct`
- `constructOutline`
- `constructSharp`
- `contract`
- `contractOutline`
- `contractSharp`
- `contrast`
- `contrastOutline`
- `contrastSharp`
- `copy`
- `copyOutline`
- `copySharp`
- `create`
- `createOutline`
- `createSharp`
- `crop`
- `cropOutline`
- `cropSharp`
- `cube`
- `cubeOutline`
- `cubeSharp`
- `cut`
- `cutOutline`
- `cutSharp`
- `desktop`
- `desktopOutline`
- `desktopSharp`
- `diamond`
- `diamondOutline`
- `diamondSharp`
- `dice`
- `diceOutline`
- `diceSharp`
- `disc`
- `discOutline`
- `discSharp`
- `document`
- `documentAttach`
- `documentAttachOutline`
- `documentAttachSharp`
- `documentLock`
- `documentLockOutline`
- `documentLockSharp`
- `documentOutline`
- `documentSharp`
- `documentText`
- `documentTextOutline`
- `documentTextSharp`
- `documents`
- `documentsOutline`
- `documentsSharp`
- `download`
- `downloadOutline`
- `downloadSharp`
- `duplicate`
- `duplicateOutline`
- `duplicateSharp`
- `ear`
- `earOutline`
- `earSharp`
- `earth`
- `earthOutline`
- `earthSharp`
- `easel`
- `easelOutline`
- `easelSharp`
- `egg`
- `eggOutline`
- `eggSharp`
- `ellipse`
- `ellipseOutline`
- `ellipseSharp`
- `ellipsisHorizontal`
- `ellipsisHorizontalCircle`
- `ellipsisHorizontalCircleOutline`
- `ellipsisHorizontalCircleSharp`
- `ellipsisHorizontalOutline`
- `ellipsisHorizontalSharp`
- `ellipsisVertical`
- `ellipsisVerticalCircle`
- `ellipsisVerticalCircleOutline`
- `ellipsisVerticalCircleSharp`
- `ellipsisVerticalOutline`
- `ellipsisVerticalSharp`
- `enter`
- `enterOutline`
- `enterSharp`
- `exit`
- `exitOutline`
- `exitSharp`
- `expand`
- `expandOutline`
- `expandSharp`
- `extensionPuzzle`
- `extensionPuzzleOutline`
- `extensionPuzzleSharp`
- `eye`
- `eyeOff`
- `eyeOffOutline`
- `eyeOffSharp`
- `eyeOutline`
- `eyeSharp`
- `eyedrop`
- `eyedropOutline`
- `eyedropSharp`
- `fastFood`
- `fastFoodOutline`
- `fastFoodSharp`
- `female`
- `femaleOutline`
- `femaleSharp`
- `fileTray`
- `fileTrayFull`
- `fileTrayFullOutline`
- `fileTrayFullSharp`
- `fileTrayOutline`
- `fileTraySharp`
- `fileTrayStacked`
- `fileTrayStackedOutline`
- `fileTrayStackedSharp`
- `film`
- `filmOutline`
- `filmSharp`
- `filter`
- `filterCircle`
- `filterCircleOutline`
- `filterCircleSharp`
- `filterOutline`
- `filterSharp`
- `fingerPrint`
- `fingerPrintOutline`
- `fingerPrintSharp`
- `fish`
- `fishOutline`
- `fishSharp`
- `fitness`
- `fitnessOutline`
- `fitnessSharp`
- `flag`
- `flagOutline`
- `flagSharp`
- `flame`
- `flameOutline`
- `flameSharp`
- `flash`
- `flashOff`
- `flashOffOutline`
- `flashOffSharp`
- `flashOutline`
- `flashSharp`
- `flashlight`
- `flashlightOutline`
- `flashlightSharp`
- `flask`
- `flaskOutline`
- `flaskSharp`
- `flower`
- `flowerOutline`
- `flowerSharp`
- `folder`
- `folderOpen`
- `folderOpenOutline`
- `folderOpenSharp`
- `folderOutline`
- `folderSharp`
- `football`
- `footballOutline`
- `footballSharp`
- `footsteps`
- `footstepsOutline`
- `footstepsSharp`
- `funnel`
- `funnelOutline`
- `funnelSharp`
- `gameController`
- `gameControllerOutline`
- `gameControllerSharp`
- `gift`
- `giftOutline`
- `giftSharp`
- `gitBranch`
- `gitBranchOutline`
- `gitBranchSharp`
- `gitCommit`
- `gitCommitOutline`
- `gitCommitSharp`
- `gitCompare`
- `gitCompareOutline`
- `gitCompareSharp`
- `gitMerge`
- `gitMergeOutline`
- `gitMergeSharp`
- `gitNetwork`
- `gitNetworkOutline`
- `gitNetworkSharp`
- `gitPullRequest`
- `gitPullRequestOutline`
- `gitPullRequestSharp`
- `glasses`
- `glassesOutline`
- `glassesSharp`
- `globe`
- `globeOutline`
- `globeSharp`
- `golf`
- `golfOutline`
- `golfSharp`
- `grid`
- `gridOutline`
- `gridSharp`
- `hammer`
- `hammerOutline`
- `hammerSharp`
- `handLeft`
- `handLeftOutline`
- `handLeftSharp`
- `handRight`
- `handRightOutline`
- `handRightSharp`
- `happy`
- `happyOutline`
- `happySharp`
- `hardwareChip`
- `hardwareChipOutline`
- `hardwareChipSharp`
- `headset`
- `headsetOutline`
- `headsetSharp`
- `heart`
- `heartCircle`
- `heartCircleOutline`
- `heartCircleSharp`
- `heartDislike`
- `heartDislikeCircle`
- `heartDislikeCircleOutline`
- `heartDislikeCircleSharp`
- `heartDislikeOutline`
- `heartDislikeSharp`
- `heartHalf`
- `heartHalfOutline`
- `heartHalfSharp`
- `heartOutline`
- `heartSharp`
- `help`
- `helpBuoy`
- `helpBuoyOutline`
- `helpBuoySharp`
- `helpCircle`
- `helpCircleOutline`
- `helpCircleSharp`
- `helpOutline`
- `helpSharp`
- `home`
- `homeOutline`
- `homeSharp`
- `hourglass`
- `hourglassOutline`
- `hourglassSharp`
- `iceCream`
- `iceCreamOutline`
- `iceCreamSharp`
- `idCard`
- `idCardOutline`
- `idCardSharp`
- `image`
- `imageOutline`
- `imageSharp`
- `images`
- `imagesOutline`
- `imagesSharp`
- `infinite`
- `infiniteOutline`
- `infiniteSharp`
- `information`
- `informationCircle`
- `informationCircleOutline`
- `informationCircleSharp`
- `informationOutline`
- `informationSharp`
- `invertMode`
- `invertModeOutline`
- `invertModeSharp`
- `journal`
- `journalOutline`
- `journalSharp`
- `key`
- `keyOutline`
- `keySharp`
- `keypad`
- `keypadOutline`
- `keypadSharp`
- `language`
- `languageOutline`
- `languageSharp`
- `laptop`
- `laptopOutline`
- `laptopSharp`
- `layers`
- `layersOutline`
- `layersSharp`
- `leaf`
- `leafOutline`
- `leafSharp`
- `library`
- `libraryOutline`
- `librarySharp`
- `link`
- `linkOutline`
- `linkSharp`
- `list`
- `listCircle`
- `listCircleOutline`
- `listCircleSharp`
- `listOutline`
- `listSharp`
- `locate`
- `locateOutline`
- `locateSharp`
- `location`
- `locationOutline`
- `locationSharp`
- `lockClosed`
- `lockClosedOutline`
- `lockClosedSharp`
- `lockOpen`
- `lockOpenOutline`
- `lockOpenSharp`
- `logIn`
- `logInOutline`
- `logInSharp`
- `logOut`
- `logOutOutline`
- `logOutSharp`
- `logoAlipay`
- `logoAmazon`
- `logoAmplify`
- `logoAndroid`
- `logoAngular`
- `logoApple`
- `logoAppleAppstore`
- `logoAppleAr`
- `logoBehance`
- `logoBitbucket`
- `logoBitcoin`
- `logoBuffer`
- `logoCapacitor`
- `logoChrome`
- `logoClosedCaptioning`
- `logoCodepen`
- `logoCss3`
- `logoDesignernews`
- `logoDeviantart`
- `logoDiscord`
- `logoDocker`
- `logoDribbble`
- `logoDropbox`
- `logoEdge`
- `logoElectron`
- `logoEuro`
- `logoFacebook`
- `logoFamibot`
- `logoFamily`
- `logoFigma`
- `logoFirebase`
- `logoFirefox`
- `logoFlickr`
- `logoFoursquare`
- `logoGithub`
- `logoGitlab`
- `logoGoogle`
- `logoGooglePlaystore`
- `logoHackernews`
- `logoHtml5`
- `logoInstagram`
- `logoIonic`
- `logoJavascript`
- `logoJigra`
- `logoKdu`
- `logoLaravel`
- `logoLinkedin`
- `logoMarkdown`
- `logoMastodon`
- `logoMedium`
- `logoMicrosoft`
- `logoNoSmoking`
- `logoNodejs`
- `logoNpm`
- `logoOctocat`
- `logoPaypal`
- `logoPinterest`
- `logoPlaystation`
- `logoPwa`
- `logoPython`
- `logoReact`
- `logoReddit`
- `logoRindo`
- `logoRss`
- `logoSass`
- `logoSkype`
- `logoSlack`
- `logoSnapchat`
- `logoSoundcloud`
- `logoStackoverflow`
- `logoSteam`
- `logoStencil`
- `logoTableau`
- `logoTiktok`
- `logoTumblr`
- `logoTux`
- `logoTwitch`
- `logoTwitter`
- `logoUsd`
- `logoVenmo`
- `logoVercel`
- `logoVimeo`
- `logoVk`
- `logoVue`
- `logoWebComponent`
- `logoWechat`
- `logoWhatsapp`
- `logoWindows`
- `logoWordpress`
- `logoXbox`
- `logoXing`
- `logoYahoo`
- `logoYen`
- `logoYoutube`
- `magnet`
- `magnetOutline`
- `magnetSharp`
- `mail`
- `mailOpen`
- `mailOpenOutline`
- `mailOpenSharp`
- `mailOutline`
- `mailSharp`
- `mailUnread`
- `mailUnreadOutline`
- `mailUnreadSharp`
- `male`
- `maleFemale`
- `maleFemaleOutline`
- `maleFemaleSharp`
- `maleOutline`
- `maleSharp`
- `man`
- `manOutline`
- `manSharp`
- `map`
- `mapOutline`
- `mapSharp`
- `medal`
- `medalOutline`
- `medalSharp`
- `medical`
- `medicalOutline`
- `medicalSharp`
- `medkit`
- `medkitOutline`
- `medkitSharp`
- `megaphone`
- `megaphoneOutline`
- `megaphoneSharp`
- `menu`
- `menuOutline`
- `menuSharp`
- `mic`
- `micCircle`
- `micCircleOutline`
- `micCircleSharp`
- `micOff`
- `micOffCircle`
- `micOffCircleOutline`
- `micOffCircleSharp`
- `micOffOutline`
- `micOffSharp`
- `micOutline`
- `micSharp`
- `moon`
- `moonOutline`
- `moonSharp`
- `move`
- `moveOutline`
- `moveSharp`
- `musicalNote`
- `musicalNoteOutline`
- `musicalNoteSharp`
- `musicalNotes`
- `musicalNotesOutline`
- `musicalNotesSharp`
- `navigate`
- `navigateCircle`
- `navigateCircleOutline`
- `navigateCircleSharp`
- `navigateOutline`
- `navigateSharp`
- `newspaper`
- `newspaperOutline`
- `newspaperSharp`
- `notifications`
- `notificationsCircle`
- `notificationsCircleOutline`
- `notificationsCircleSharp`
- `notificationsOff`
- `notificationsOffCircle`
- `notificationsOffCircleOutline`
- `notificationsOffCircleSharp`
- `notificationsOffOutline`
- `notificationsOffSharp`
- `notificationsOutline`
- `notificationsSharp`
- `nuclear`
- `nuclearOutline`
- `nuclearSharp`
- `nutrition`
- `nutritionOutline`
- `nutritionSharp`
- `open`
- `openOutline`
- `openSharp`
- `options`
- `optionsOutline`
- `optionsSharp`
- `paperPlane`
- `paperPlaneOutline`
- `paperPlaneSharp`
- `partlySunny`
- `partlySunnyOutline`
- `partlySunnySharp`
- `pause`
- `pauseCircle`
- `pauseCircleOutline`
- `pauseCircleSharp`
- `pauseOutline`
- `pauseSharp`
- `paw`
- `pawOutline`
- `pawSharp`
- `pencil`
- `pencilOutline`
- `pencilSharp`
- `people`
- `peopleCircle`
- `peopleCircleOutline`
- `peopleCircleSharp`
- `peopleOutline`
- `peopleSharp`
- `person`
- `personAdd`
- `personAddOutline`
- `personAddSharp`
- `personCircle`
- `personCircleOutline`
- `personCircleSharp`
- `personOutline`
- `personRemove`
- `personRemoveOutline`
- `personRemoveSharp`
- `personSharp`
- `phoneLandscape`
- `phoneLandscapeOutline`
- `phoneLandscapeSharp`
- `phonePortrait`
- `phonePortraitOutline`
- `phonePortraitSharp`
- `pieChart`
- `pieChartOutline`
- `pieChartSharp`
- `pin`
- `pinOutline`
- `pinSharp`
- `pint`
- `pintOutline`
- `pintSharp`
- `pizza`
- `pizzaOutline`
- `pizzaSharp`
- `planet`
- `planetOutline`
- `planetSharp`
- `play`
- `playBack`
- `playBackCircle`
- `playBackCircleOutline`
- `playBackCircleSharp`
- `playBackOutline`
- `playBackSharp`
- `playCircle`
- `playCircleOutline`
- `playCircleSharp`
- `playForward`
- `playForwardCircle`
- `playForwardCircleOutline`
- `playForwardCircleSharp`
- `playForwardOutline`
- `playForwardSharp`
- `playOutline`
- `playSharp`
- `playSkipBack`
- `playSkipBackCircle`
- `playSkipBackCircleOutline`
- `playSkipBackCircleSharp`
- `playSkipBackOutline`
- `playSkipBackSharp`
- `playSkipForward`
- `playSkipForwardCircle`
- `playSkipForwardCircleOutline`
- `playSkipForwardCircleSharp`
- `playSkipForwardOutline`
- `playSkipForwardSharp`
- `podium`
- `podiumOutline`
- `podiumSharp`
- `power`
- `powerOutline`
- `powerSharp`
- `pricetag`
- `pricetagOutline`
- `pricetagSharp`
- `pricetags`
- `pricetagsOutline`
- `pricetagsSharp`
- `print`
- `printOutline`
- `printSharp`
- `prism`
- `prismOutline`
- `prismSharp`
- `pulse`
- `pulseOutline`
- `pulseSharp`
- `push`
- `pushOutline`
- `pushSharp`
- `qrCode`
- `qrCodeOutline`
- `qrCodeSharp`
- `radio`
- `radioButtonOff`
- `radioButtonOffOutline`
- `radioButtonOffSharp`
- `radioButtonOn`
- `radioButtonOnOutline`
- `radioButtonOnSharp`
- `radioOutline`
- `radioSharp`
- `rainy`
- `rainyOutline`
- `rainySharp`
- `reader`
- `readerOutline`
- `readerSharp`
- `receipt`
- `receiptOutline`
- `receiptSharp`
- `recording`
- `recordingOutline`
- `recordingSharp`
- `refresh`
- `refreshCircle`
- `refreshCircleOutline`
- `refreshCircleSharp`
- `refreshOutline`
- `refreshSharp`
- `reload`
- `reloadCircle`
- `reloadCircleOutline`
- `reloadCircleSharp`
- `reloadOutline`
- `reloadSharp`
- `remove`
- `removeCircle`
- `removeCircleOutline`
- `removeCircleSharp`
- `removeOutline`
- `removeSharp`
- `reorderFour`
- `reorderFourOutline`
- `reorderFourSharp`
- `reorderThree`
- `reorderThreeOutline`
- `reorderThreeSharp`
- `reorderTwo`
- `reorderTwoOutline`
- `reorderTwoSharp`
- `repeat`
- `repeatOutline`
- `repeatSharp`
- `resize`
- `resizeOutline`
- `resizeSharp`
- `restaurant`
- `restaurantOutline`
- `restaurantSharp`
- `returnDownBack`
- `returnDownBackOutline`
- `returnDownBackSharp`
- `returnDownForward`
- `returnDownForwardOutline`
- `returnDownForwardSharp`
- `returnUpBack`
- `returnUpBackOutline`
- `returnUpBackSharp`
- `returnUpForward`
- `returnUpForwardOutline`
- `returnUpForwardSharp`
- `ribbon`
- `ribbonOutline`
- `ribbonSharp`
- `rocket`
- `rocketOutline`
- `rocketSharp`
- `rose`
- `roseOutline`
- `roseSharp`
- `sad`
- `sadOutline`
- `sadSharp`
- `save`
- `saveOutline`
- `saveSharp`
- `scale`
- `scaleOutline`
- `scaleSharp`
- `scan`
- `scanCircle`
- `scanCircleOutline`
- `scanCircleSharp`
- `scanOutline`
- `scanSharp`
- `school`
- `schoolOutline`
- `schoolSharp`
- `search`
- `searchCircle`
- `searchCircleOutline`
- `searchCircleSharp`
- `searchOutline`
- `searchSharp`
- `send`
- `sendOutline`
- `sendSharp`
- `server`
- `serverOutline`
- `serverSharp`
- `settings`
- `settingsOutline`
- `settingsSharp`
- `shapes`
- `shapesOutline`
- `shapesSharp`
- `share`
- `shareOutline`
- `shareSharp`
- `shareSocial`
- `shareSocialOutline`
- `shareSocialSharp`
- `shield`
- `shieldCheckmark`
- `shieldCheckmarkOutline`
- `shieldCheckmarkSharp`
- `shieldHalf`
- `shieldHalfOutline`
- `shieldHalfSharp`
- `shieldOutline`
- `shieldSharp`
- `shirt`
- `shirtOutline`
- `shirtSharp`
- `shuffle`
- `shuffleOutline`
- `shuffleSharp`
- `skull`
- `skullOutline`
- `skullSharp`
- `snow`
- `snowOutline`
- `snowSharp`
- `sparkles`
- `sparklesOutline`
- `sparklesSharp`
- `speedometer`
- `speedometerOutline`
- `speedometerSharp`
- `square`
- `squareOutline`
- `squareSharp`
- `star`
- `starHalf`
- `starHalfOutline`
- `starHalfSharp`
- `starOutline`
- `starSharp`
- `statsChart`
- `statsChartOutline`
- `statsChartSharp`
- `stop`
- `stopCircle`
- `stopCircleOutline`
- `stopCircleSharp`
- `stopOutline`
- `stopSharp`
- `stopwatch`
- `stopwatchOutline`
- `stopwatchSharp`
- `storefront`
- `storefrontOutline`
- `storefrontSharp`
- `subway`
- `subwayOutline`
- `subwaySharp`
- `sunny`
- `sunnyOutline`
- `sunnySharp`
- `swapHorizontal`
- `swapHorizontalOutline`
- `swapHorizontalSharp`
- `swapVertical`
- `swapVerticalOutline`
- `swapVerticalSharp`
- `sync`
- `syncCircle`
- `syncCircleOutline`
- `syncCircleSharp`
- `syncOutline`
- `syncSharp`
- `tabletLandscape`
- `tabletLandscapeOutline`
- `tabletLandscapeSharp`
- `tabletPortrait`
- `tabletPortraitOutline`
- `tabletPortraitSharp`
- `telescope`
- `telescopeOutline`
- `telescopeSharp`
- `tennisball`
- `tennisballOutline`
- `tennisballSharp`
- `terminal`
- `terminalOutline`
- `terminalSharp`
- `text`
- `textOutline`
- `textSharp`
- `thermometer`
- `thermometerOutline`
- `thermometerSharp`
- `thumbsDown`
- `thumbsDownOutline`
- `thumbsDownSharp`
- `thumbsUp`
- `thumbsUpOutline`
- `thumbsUpSharp`
- `thunderstorm`
- `thunderstormOutline`
- `thunderstormSharp`
- `ticket`
- `ticketOutline`
- `ticketSharp`
- `time`
- `timeOutline`
- `timeSharp`
- `timer`
- `timerOutline`
- `timerSharp`
- `today`
- `todayOutline`
- `todaySharp`
- `toggle`
- `toggleOutline`
- `toggleSharp`
- `trailSign`
- `trailSignOutline`
- `trailSignSharp`
- `train`
- `trainOutline`
- `trainSharp`
- `transgender`
- `transgenderOutline`
- `transgenderSharp`
- `trash`
- `trashBin`
- `trashBinOutline`
- `trashBinSharp`
- `trashOutline`
- `trashSharp`
- `trendingDown`
- `trendingDownOutline`
- `trendingDownSharp`
- `trendingUp`
- `trendingUpOutline`
- `trendingUpSharp`
- `triangle`
- `triangleOutline`
- `triangleSharp`
- `trophy`
- `trophyOutline`
- `trophySharp`
- `tv`
- `tvOutline`
- `tvSharp`
- `umbrella`
- `umbrellaOutline`
- `umbrellaSharp`
- `unlink`
- `unlinkOutline`
- `unlinkSharp`
- `videocam`
- `videocamOff`
- `videocamOffOutline`
- `videocamOffSharp`
- `videocamOutline`
- `videocamSharp`
- `volumeHigh`
- `volumeHighOutline`
- `volumeHighSharp`
- `volumeLow`
- `volumeLowOutline`
- `volumeLowSharp`
- `volumeMedium`
- `volumeMediumOutline`
- `volumeMediumSharp`
- `volumeMute`
- `volumeMuteOutline`
- `volumeMuteSharp`
- `volumeOff`
- `volumeOffOutline`
- `volumeOffSharp`
- `walk`
- `walkOutline`
- `walkSharp`
- `wallet`
- `walletOutline`
- `walletSharp`
- `warning`
- `warningOutline`
- `warningSharp`
- `watch`
- `watchOutline`
- `watchSharp`
- `water`
- `waterOutline`
- `waterSharp`
- `wifi`
- `wifiOutline`
- `wifiSharp`
- `wine`
- `wineOutline`
- `wineSharp`
- `woman`
- `womanOutline`
- `womanSharp`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccessibilityIcon, AccessibilityOutlineIcon, AccessibilitySharpIcon, AddIcon } from '@stacksjs/iconify-famicons'

  global.navIcons = {
    home: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    about: AccessibilityOutlineIcon({ size: 20, class: 'nav-icon' }),
    contact: AccessibilitySharpIcon({ size: 20, class: 'nav-icon' }),
    settings: AddIcon({ size: 20, class: 'nav-icon' })
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
import { AccessibilityIcon } from '@stacksjs/iconify-famicons'

const icon = AccessibilityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccessibilityIcon, AccessibilityOutlineIcon, AccessibilitySharpIcon } from '@stacksjs/iconify-famicons'

const successIcon = AccessibilityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccessibilityOutlineIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccessibilitySharpIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccessibilityIcon, AccessibilityOutlineIcon } from '@stacksjs/iconify-famicons'
   const icon = AccessibilityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility, accessibilityOutline } from '@stacksjs/iconify-famicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccessibilityIcon, AccessibilityOutlineIcon } from '@stacksjs/iconify-famicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-famicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccessibilityIcon } from '@stacksjs/iconify-famicons'
     global.icon = AccessibilityIcon({ size: 24 })
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
   const icon = AccessibilityIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility } from '@stacksjs/iconify-famicons'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/familyjs/famicons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Family ([Website](https://github.com/familyjs/famicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/famicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/famicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
