# Material Design Iconic Font

> Material Design Iconic Font icons for stx from Iconify

## Overview

This package provides access to 777 icons from the Material Design Iconic Font collection through the stx iconify integration.

**Collection ID:** `zmdi`
**Total Icons:** 777
**Author:** MDI Community ([Website](https://github.com/zavoloklom/material-design-iconic-font))
**License:** Open Font License

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-zmdi
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dRotationIcon height="1em" />
<3dRotationIcon width="1em" height="1em" />
<3dRotationIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dRotationIcon size="24" />
<3dRotationIcon size="1em" />

<!-- Using width and height -->
<3dRotationIcon width="24" height="32" />

<!-- With color -->
<3dRotationIcon size="24" color="red" />
<3dRotationIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dRotationIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dRotationIcon
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
    <3dRotationIcon size="24" />
    <500pxIcon size="24" color="#4a90e2" />
    <8tracksIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3dRotation, 500px, 8tracks } from '@stacksjs/iconify-zmdi'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3dRotation, { size: 24 })
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
<3dRotationIcon size="24" color="red" />
<3dRotationIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dRotationIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dRotationIcon size="24" class="text-primary" />
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
<3dRotationIcon height="1em" />
<3dRotationIcon width="1em" height="1em" />
<3dRotationIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dRotationIcon size="24" />
<3dRotationIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.zmdi-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dRotationIcon class="zmdi-icon" />
```

## Available Icons

This package contains **777** icons:

- `3dRotation`
- `500px`
- `8tracks`
- `account`
- `accountAdd`
- `accountBox`
- `accountBoxMail`
- `accountBoxO`
- `accountBoxPhone`
- `accountCalendar`
- `accountCircle`
- `accountO`
- `accounts`
- `accountsAdd`
- `accountsAlt`
- `accountsList`
- `accountsListAlt`
- `accountsOutline`
- `airlineSeatFlat`
- `airlineSeatFlatAngled`
- `airlineSeatIndividualSuite`
- `airlineSeatLegroomExtra`
- `airlineSeatLegroomNormal`
- `airlineSeatLegroomReduced`
- `airlineSeatReclineExtra`
- `airlineSeatReclineNormal`
- `airplane`
- `airplaneOff`
- `airplay`
- `alarm`
- `alarmCheck`
- `alarmOff`
- `alarmPlus`
- `alarmSnooze`
- `album`
- `alertCircle`
- `alertCircleO`
- `alertOctagon`
- `alertPolygon`
- `alertTriangle`
- `amazon`
- `android`
- `androidAlt`
- `apple`
- `apps`
- `archive`
- `arrowLeft`
- `arrowLeftBottom`
- `arrowMerge`
- `arrowMissed`
- `arrowRight`
- `arrowRightTop`
- `arrowSplit`
- `arrows`
- `aspectRatio`
- `aspectRatioAlt`
- `assignment`
- `assignmentAccount`
- `assignmentAlert`
- `assignmentCheck`
- `assignmentO`
- `assignmentReturn`
- `assignmentReturned`
- `attachment`
- `attachmentAlt`
- `audio`
- `badgeCheck`
- `balance`
- `balanceWallet`
- `battery`
- `batteryAlert`
- `batteryFlash`
- `batteryUnknown`
- `behance`
- `bike`
- `block`
- `blockAlt`
- `blogger`
- `bluetooth`
- `bluetoothConnected`
- `bluetoothOff`
- `bluetoothSearch`
- `bluetoothSetting`
- `blur`
- `blurCircular`
- `blurLinear`
- `blurOff`
- `boat`
- `book`
- `bookImage`
- `bookmark`
- `bookmarkOutline`
- `borderAll`
- `borderBottom`
- `borderClear`
- `borderColor`
- `borderHorizontal`
- `borderInner`
- `borderLeft`
- `borderOuter`
- `borderRight`
- `borderStyle`
- `borderTop`
- `borderVertical`
- `brightness2`
- `brightness3`
- `brightness4`
- `brightness5`
- `brightness6`
- `brightness7`
- `brightnessAuto`
- `brightnessSetting`
- `brokenImage`
- `brush`
- `bug`
- `bus`
- `cake`
- `calendar`
- `calendarAlt`
- `calendarCheck`
- `calendarClose`
- `calendarNote`
- `camera`
- `cameraAdd`
- `cameraAlt`
- `cameraBw`
- `cameraFront`
- `cameraMic`
- `cameraPartyMode`
- `cameraRear`
- `cameraRoll`
- `cameraSwitch`
- `car`
- `carTaxi`
- `carWash`
- `card`
- `cardAlert`
- `cardGiftcard`
- `cardMembership`
- `cardOff`
- `cardSd`
- `cardSim`
- `cardTravel`
- `caretDown`
- `caretDownCircle`
- `caretLeft`
- `caretLeftCircle`
- `caretRight`
- `caretRightCircle`
- `caretUp`
- `caretUpCircle`
- `case`
- `caseCheck`
- `caseDownload`
- `casePlay`
- `cast`
- `castConnected`
- `centerFocusStrong`
- `centerFocusWeak`
- `chart`
- `chartDonut`
- `check`
- `checkAll`
- `checkCircle`
- `checkCircleU`
- `checkSquare`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `circle`
- `circleO`
- `city`
- `cityAlt`
- `close`
- `closeCircle`
- `closeCircleO`
- `closedCaption`
- `cloud`
- `cloudBox`
- `cloudCircle`
- `cloudDone`
- `cloudDownload`
- `cloudOff`
- `cloudOutline`
- `cloudOutlineAlt`
- `cloudUpload`
- `cocktail`
- `code`
- `codeSetting`
- `codeSmartphone`
- `codepen`
- `coffee`
- `collectionBookmark`
- `collectionCasePlay`
- `collectionFolderImage`
- `collectionImage`
- `collectionImageO`
- `collectionItem`
- `collectionItem1`
- `collectionItem2`
- `collectionItem3`
- `collectionItem4`
- `collectionItem5`
- `collectionItem6`
- `collectionItem7`
- `collectionItem8`
- `collectionItem9`
- `collectionItem9Plus`
- `collectionMusic`
- `collectionPdf`
- `collectionPlus`
- `collectionSpeaker`
- `collectionText`
- `collectionVideo`
- `comment`
- `commentAlert`
- `commentAlt`
- `commentAltText`
- `commentEdit`
- `commentImage`
- `commentList`
- `commentMore`
- `commentOutline`
- `commentText`
- `commentTextAlt`
- `commentVideo`
- `comments`
- `compare`
- `compass`
- `confirmationNumber`
- `copy`
- `crop`
- `crop169`
- `crop32`
- `crop54`
- `crop75`
- `cropDin`
- `cropFree`
- `cropLandscape`
- `cropPortrait`
- `cropSquare`
- `cutlery`
- `delete`
- `delicious`
- `desktopMac`
- `desktopWindows`
- `developerBoard`
- `deviceHub`
- `devices`
- `devicesOff`
- `dialpad`
- `discFull`
- `disqus`
- `dns`
- `dock`
- `dotCircle`
- `dotCircleAlt`
- `download`
- `dribbble`
- `drink`
- `dropbox`
- `edit`
- `eject`
- `ejectAlt`
- `email`
- `emailOpen`
- `equalizer`
- `evernote`
- `explicit`
- `exposure`
- `exposureAlt`
- `eye`
- `eyeOff`
- `eyedropper`
- `face`
- `facebook`
- `facebookBox`
- `fastForward`
- `fastRewind`
- `favorite`
- `favoriteOutline`
- `female`
- `file`
- `filePlus`
- `fileText`
- `filterBAndW`
- `filterCenterFocus`
- `filterFrames`
- `filterList`
- `filterTiltShift`
- `fire`
- `flag`
- `flare`
- `flash`
- `flashAuto`
- `flashOff`
- `flattr`
- `flickr`
- `flightLand`
- `flightTakeoff`
- `flip`
- `flipToBack`
- `flipToFront`
- `floppy`
- `flower`
- `flowerAlt`
- `folder`
- `folderOutline`
- `folderPerson`
- `folderStar`
- `folderStarAlt`
- `font`
- `formatAlignCenter`
- `formatAlignJustify`
- `formatAlignLeft`
- `formatAlignRight`
- `formatBold`
- `formatClear`
- `formatClearAll`
- `formatColorFill`
- `formatColorReset`
- `formatColorText`
- `formatIndentDecrease`
- `formatIndentIncrease`
- `formatItalic`
- `formatLineSpacing`
- `formatListBulleted`
- `formatListNumbered`
- `formatLtr`
- `formatRtl`
- `formatSize`
- `formatStrikethrough`
- `formatStrikethroughS`
- `formatSubject`
- `formatUnderlined`
- `formatValignBottom`
- `formatValignCenter`
- `formatValignTop`
- `forward`
- `forward10`
- `forward30`
- `forward5`
- `fullscreen`
- `fullscreenAlt`
- `fullscreenExit`
- `functions`
- `gamepad`
- `gasStation`
- `gesture`
- `gif`
- `github`
- `githubAlt`
- `githubBox`
- `globe`
- `globeAlt`
- `globeLock`
- `google`
- `googleDrive`
- `googleEarth`
- `googleGlass`
- `googleMaps`
- `googleOld`
- `googlePages`
- `googlePlay`
- `googlePlus`
- `googlePlusBox`
- `gps`
- `gpsDot`
- `gpsOff`
- `gradient`
- `graduationCap`
- `grain`
- `graphicEq`
- `grid`
- `gridOff`
- `group`
- `groupWork`
- `hd`
- `hdr`
- `hdrOff`
- `hdrStrong`
- `hdrWeak`
- `headset`
- `headsetMic`
- `hearing`
- `help`
- `helpOutline`
- `home`
- `hospital`
- `hospitalAlt`
- `hotel`
- `hourglass`
- `hourglassAlt`
- `hourglassOutline`
- `hq`
- `http`
- `image`
- `imageAlt`
- `imageO`
- `inbox`
- `info`
- `infoOutline`
- `inputAntenna`
- `inputComposite`
- `inputHdmi`
- `inputPower`
- `inputSvideo`
- `instagram`
- `invertColors`
- `invertColorsOff`
- `iridescent`
- `key`
- `keyboard`
- `keyboardHide`
- `label`
- `labelAlt`
- `labelAltOutline`
- `labelHeart`
- `labels`
- `lamp`
- `landscape`
- `languageCss3`
- `languageHtml5`
- `languageJavascript`
- `languagePython`
- `languagePythonAlt`
- `laptop`
- `laptopChromebook`
- `laptopMac`
- `lastfm`
- `layers`
- `layersOff`
- `leak`
- `leakOff`
- `library`
- `link`
- `linkedin`
- `linkedinBox`
- `lock`
- `lockOpen`
- `lockOutline`
- `longArrowDown`
- `longArrowLeft`
- `longArrowReturn`
- `longArrowRight`
- `longArrowTab`
- `longArrowUp`
- `looks`
- `loupe`
- `mailReply`
- `mailReplyAll`
- `mailSend`
- `male`
- `maleAlt`
- `maleFemale`
- `mall`
- `map`
- `markunreadMailbox`
- `memory`
- `menu`
- `mic`
- `micOff`
- `micOutline`
- `micSetting`
- `minus`
- `minusCircle`
- `minusCircleOutline`
- `minusSquare`
- `money`
- `moneyBox`
- `moneyOff`
- `mood`
- `moodBad`
- `more`
- `moreVert`
- `mouse`
- `movie`
- `movieAlt`
- `n1Square`
- `n2Square`
- `n3Square`
- `n4Square`
- `n5Square`
- `n6Square`
- `nature`
- `naturePeople`
- `navigation`
- `neg1`
- `neg2`
- `network`
- `networkAlert`
- `networkLocked`
- `networkOff`
- `networkOutline`
- `networkSetting`
- `nfc`
- `notifications`
- `notificationsActive`
- `notificationsAdd`
- `notificationsNone`
- `notificationsOff`
- `notificationsPaused`
- `odnoklassniki`
- `openInBrowser`
- `openInNew`
- `outlook`
- `palette`
- `panoramaHorizontal`
- `panoramaVertical`
- `panoramaWideAngle`
- `parking`
- `pause`
- `pauseCircle`
- `pauseCircleOutline`
- `paypal`
- `paypalAlt`
- `phone`
- `phoneBluetooth`
- `phoneEnd`
- `phoneForwarded`
- `phoneInTalk`
- `phoneLocked`
- `phoneMissed`
- `phoneMsg`
- `phonePaused`
- `phoneRing`
- `phoneSetting`
- `phoneSip`
- `photoSizeSelectLarge`
- `photoSizeSelectSmall`
- `pictureInPicture`
- `pin`
- `pinAccount`
- `pinAssistant`
- `pinDrop`
- `pinHelp`
- `pinOff`
- `pinterest`
- `pinterestBox`
- `pizza`
- `plaster`
- `play`
- `playCircle`
- `playCircleOutline`
- `playForWork`
- `playlistAudio`
- `playlistPlus`
- `playstation`
- `plus`
- `plus1`
- `plus2`
- `plusCircle`
- `plusCircleO`
- `plusCircleODuplicate`
- `plusSquare`
- `pocket`
- `polymer`
- `portableWifi`
- `portableWifiChanges`
- `portableWifiOff`
- `power`
- `powerInput`
- `powerSetting`
- `presentToAll`
- `print`
- `puzzlePiece`
- `quote`
- `radio`
- `railway`
- `reader`
- `receipt`
- `reddit`
- `redo`
- `refresh`
- `refreshAlt`
- `refreshSync`
- `refreshSyncAlert`
- `refreshSyncOff`
- `remoteControl`
- `remoteControlAlt`
- `repeat`
- `repeatOne`
- `replay`
- `replay10`
- `replay30`
- `replay5`
- `roller`
- `rotateCcw`
- `rotateCw`
- `rotateLeft`
- `rotateRight`
- `router`
- `rss`
- `ruler`
- `run`
- `satellite`
- `scanner`
- `scissors`
- `screenRotation`
- `screenRotationLock`
- `search`
- `searchFor`
- `searchInFile`
- `searchInPage`
- `searchReplace`
- `seat`
- `sec10`
- `sec3`
- `selectAll`
- `settings`
- `settingsSquare`
- `shape`
- `share`
- `shieldCheck`
- `shieldSecurity`
- `shoppingBasket`
- `shoppingCart`
- `shoppingCartPlus`
- `shuffle`
- `signIn`
- `skipNext`
- `skipPrevious`
- `skype`
- `slideshare`
- `slideshow`
- `smartphone`
- `smartphoneAndroid`
- `smartphoneDownload`
- `smartphoneErase`
- `smartphoneInfo`
- `smartphoneIphone`
- `smartphoneLandscape`
- `smartphoneLandscapeLock`
- `smartphoneLock`
- `smartphonePortraitLock`
- `smartphoneRing`
- `smartphoneSetting`
- `smartphoneSetup`
- `sortAmountAsc`
- `sortAmountDesc`
- `sortAsc`
- `sortDesc`
- `soundcloud`
- `spaceBar`
- `speaker`
- `spellcheck`
- `spinner`
- `squareDown`
- `squareO`
- `squareRight`
- `stackoverflow`
- `star`
- `starCircle`
- `starHalf`
- `starOutline`
- `steam`
- `steamSquare`
- `stop`
- `storage`
- `store`
- `store24`
- `subway`
- `sun`
- `surroundSound`
- `swap`
- `swapAlt`
- `swapVertical`
- `swapVerticalCircle`
- `tab`
- `tabUnselected`
- `tablet`
- `tabletAndroid`
- `tabletMac`
- `tag`
- `tagClose`
- `tagMore`
- `tapAndPlay`
- `textFormat`
- `texture`
- `thumbDown`
- `thumbUp`
- `thumbUpDown`
- `ticketStar`
- `time`
- `timeCountdown`
- `timeInterval`
- `timeRestore`
- `timeRestoreSetting`
- `timer`
- `timerOff`
- `toll`
- `tonality`
- `toys`
- `traffic`
- `transform`
- `translate`
- `trendingDown`
- `trendingFlat`
- `trendingUp`
- `triangleDown`
- `triangleUp`
- `truck`
- `tumblr`
- `tune`
- `turningSign`
- `tv`
- `tvAltPlay`
- `tvList`
- `tvPlay`
- `twitch`
- `twitter`
- `twitterBox`
- `undo`
- `unfoldLess`
- `unfoldMore`
- `ungroup`
- `upload`
- `usb`
- `vibration`
- `videocam`
- `videocamOff`
- `videocamSwitch`
- `viewAgenda`
- `viewArray`
- `viewCarousel`
- `viewColumn`
- `viewComfy`
- `viewCompact`
- `viewDashboard`
- `viewDay`
- `viewHeadline`
- `viewList`
- `viewListAlt`
- `viewModule`
- `viewQuilt`
- `viewStream`
- `viewSubtitles`
- `viewToc`
- `viewWeb`
- `viewWeek`
- `vignette`
- `vimeo`
- `vk`
- `voicemail`
- `volumeDown`
- `volumeMute`
- `volumeOff`
- `volumeUp`
- `walk`
- `wallpaper`
- `washingMachine`
- `watch`
- `wbAuto`
- `whatsapp`
- `widgets`
- `wifi`
- `wifiAlt`
- `wifiAlt2`
- `wifiInfo`
- `wifiLock`
- `wifiOff`
- `wifiOutline`
- `wikipedia`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`
- `windows`
- `wrapText`
- `wrench`
- `xbox`
- `yahoo`
- `youtube`
- `youtubePlay`
- `zero`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dRotationIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><500pxIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><8tracksIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccountIcon size="20" class="nav-icon" /> Settings</a>
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
<3dRotationIcon
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
    <3dRotationIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <500pxIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <8tracksIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dRotationIcon size="24" />
   <500pxIcon size="24" color="#4a90e2" />
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
   <3dRotationIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dRotationIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dRotationIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3dRotation } from '@stacksjs/iconify-zmdi'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dRotation, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dRotation } from '@stacksjs/iconify-zmdi'

// Icons are typed as IconData
const myIcon: IconData = 3dRotation
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Open Font License



## Credits

- **Icons**: MDI Community ([Website](https://github.com/zavoloklom/material-design-iconic-font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/zmdi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/zmdi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
