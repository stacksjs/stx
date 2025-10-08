# Jam Icons

> Jam Icons icons for stx from Iconify

## Overview

This package provides access to 940 icons from the Jam Icons collection through the stx iconify integration.

**Collection ID:** `jam`
**Total Icons:** 940
**Author:** Michael Amprimo ([Website](https://github.com/michaelampr))
**License:** MIT ([Details](https://github.com/cyberalien/jam-backup/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-jam
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, AccessibilityIcon, ActivityIcon } from '@stacksjs/iconify-jam'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = AccessibilityIcon({ color: 'red' })

// With multiple props
const customIcon = ActivityIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, AccessibilityIcon, ActivityIcon } from '@stacksjs/iconify-jam'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: AccessibilityIcon({ size: 24, color: '#4a90e2' }),
    settings: ActivityIcon({ size: 32 })
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
import { 500px, accessibility, activity } from '@stacksjs/iconify-jam'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(500px, { size: 24 })
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
const redIcon = 500pxIcon({ color: 'red' })
const blueIcon = 500pxIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 500pxIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 500pxIcon({ class: 'text-primary' })
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
const icon24 = 500pxIcon({ size: 24 })
const icon1em = 500pxIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 500pxIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 500pxIcon({ height: '1em' })
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
const smallIcon = 500pxIcon({ class: 'icon-small' })
const largeIcon = 500pxIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **940** icons:

- `500px`
- `accessibility`
- `activity`
- `airbnb`
- `alarmClock`
- `alarmClockF`
- `alert`
- `alertF`
- `alien`
- `alienF`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `amazon`
- `anchor`
- `android`
- `androidCircle`
- `androidSquare`
- `aperture`
- `apple`
- `appleCircle`
- `appleSquare`
- `archive`
- `archiveF`
- `arrowCircleDown`
- `arrowCircleDownF`
- `arrowCircleDownLeft`
- `arrowCircleDownLeftF`
- `arrowCircleDownRight`
- `arrowCircleDownRightF`
- `arrowCircleLeft`
- `arrowCircleLeftF`
- `arrowCircleRight`
- `arrowCircleRightF`
- `arrowCircleUp`
- `arrowCircleUpF`
- `arrowCircleUpLeft`
- `arrowCircleUpLeftF`
- `arrowCircleUpRight`
- `arrowCircleUpRightF`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowLeft`
- `arrowRight`
- `arrowSquareDown`
- `arrowSquareDownF`
- `arrowSquareDownLeft`
- `arrowSquareDownLeftF`
- `arrowSquareDownRight`
- `arrowSquareDownRightF`
- `arrowSquareLeft`
- `arrowSquareLeftF`
- `arrowSquareRight`
- `arrowSquareRightF`
- `arrowSquareUp`
- `arrowSquareUpF`
- `arrowSquareUpLeft`
- `arrowSquareUpLeftF`
- `arrowSquareUpRight`
- `arrowSquareUpRightF`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpRight`
- `arrowsCorners`
- `arrowsFullscreen`
- `arrowsH`
- `arrowsV`
- `attachment`
- `backgroundColor`
- `backpack`
- `backpackF`
- `backward`
- `backwardCircle`
- `backwardCircleF`
- `backwardSquare`
- `backwardSquareF`
- `baidu`
- `baiduCircle`
- `baiduSquare`
- `bandage`
- `bandageF`
- `barChart`
- `baseball`
- `basketball`
- `bathtub`
- `bathtubF`
- `battery`
- `batteryCharging`
- `batteryChargingF`
- `batteryF`
- `batteryHalf`
- `batteryHalfF`
- `batteryOneQuarter`
- `batteryOneQuarterF`
- `batteryThreeQuarters`
- `batteryThreeQuartersF`
- `beatport`
- `beatportCircle`
- `beatportSquare`
- `beer`
- `beerF`
- `behance`
- `behanceCircle`
- `behanceSquare`
- `bell`
- `bellF`
- `bellOff`
- `bellOffF`
- `bing`
- `bingCircle`
- `bingSquare`
- `birthdayCake`
- `birthdayCakeF`
- `blogger`
- `bloggerCircle`
- `bloggerSquare`
- `bluetooth`
- `bold`
- `book`
- `bookF`
- `bookmark`
- `bookmarkF`
- `bookmarkMinus`
- `bookmarkMinusF`
- `bookmarkPlus`
- `bookmarkPlusF`
- `bookmarkRemove`
- `bookmarkRemoveF`
- `bottle`
- `bottleF`
- `box`
- `boxF`
- `branch`
- `branchF`
- `brightness`
- `brightnessDown`
- `brightnessDownF`
- `brightnessUp`
- `brightnessUpF`
- `browse`
- `brush`
- `brushF`
- `bug`
- `bugF`
- `building`
- `buildingF`
- `bus`
- `busF`
- `cactus`
- `cactusF`
- `calculator`
- `calendar`
- `calendarAlt`
- `calendarAltF`
- `calendarF`
- `camera`
- `cameraAlt`
- `cameraAltF`
- `cameraF`
- `candle`
- `candleF`
- `capsule`
- `capsuleF`
- `car`
- `carF`
- `castle`
- `castleF`
- `character`
- `check`
- `chevronCircleDown`
- `chevronCircleDownF`
- `chevronCircleDownLeft`
- `chevronCircleDownLeftF`
- `chevronCircleDownRight`
- `chevronCircleDownRightF`
- `chevronCircleLeft`
- `chevronCircleLeftF`
- `chevronCircleRight`
- `chevronCircleRightF`
- `chevronCircleUp`
- `chevronCircleUpF`
- `chevronCircleUpLeft`
- `chevronCircleUpLeftF`
- `chevronCircleUpRight`
- `chevronCircleUpRightF`
- `chevronDown`
- `chevronDownLeft`
- `chevronDownRight`
- `chevronLeft`
- `chevronRight`
- `chevronSquareDown`
- `chevronSquareDownF`
- `chevronSquareDownLeft`
- `chevronSquareDownLeftF`
- `chevronSquareDownRight`
- `chevronSquareDownRightF`
- `chevronSquareLeft`
- `chevronSquareLeftF`
- `chevronSquareRight`
- `chevronSquareRightF`
- `chevronSquareUp`
- `chevronSquareUpF`
- `chevronSquareUpLeft`
- `chevronSquareUpLeftF`
- `chevronSquareUpRight`
- `chevronSquareUpRightF`
- `chevronUp`
- `chevronUpLeft`
- `chevronUpRight`
- `chevronsCircleDown`
- `chevronsCircleDownF`
- `chevronsCircleDownLeft`
- `chevronsCircleDownLeftF`
- `chevronsCircleDownRight`
- `chevronsCircleDownRightF`
- `chevronsCircleLeft`
- `chevronsCircleLeftF`
- `chevronsCircleRight`
- `chevronsCircleRightF`
- `chevronsCircleUp`
- `chevronsCircleUpF`
- `chevronsCircleUpLeft`
- `chevronsCircleUpLeftF`
- `chevronsCircleUpRight`
- `chevronsCircleUpRightF`
- `chevronsDown`
- `chevronsDownLeft`
- `chevronsDownRight`
- `chevronsLeft`
- `chevronsRight`
- `chevronsSquareDown`
- `chevronsSquareDownF`
- `chevronsSquareDownLeft`
- `chevronsSquareDownLeftF`
- `chevronsSquareDownRight`
- `chevronsSquareDownRightF`
- `chevronsSquareLeft`
- `chevronsSquareLeftF`
- `chevronsSquareRight`
- `chevronsSquareRightF`
- `chevronsSquareUp`
- `chevronsSquareUpF`
- `chevronsSquareUpLeft`
- `chevronsSquareUpLeftF`
- `chevronsSquareUpRight`
- `chevronsSquareUpRightF`
- `chevronsUp`
- `chevronsUpLeft`
- `chevronsUpRight`
- `chronometer`
- `chronometerF`
- `circle`
- `circleF`
- `clearFormat`
- `clipboard`
- `clipboardF`
- `clock`
- `clockF`
- `close`
- `closeCircle`
- `closeCircleF`
- `closeRectangle`
- `closeRectangleF`
- `cloud`
- `cloudF`
- `cloudRain`
- `cloudRainF`
- `cloudSnow`
- `cloudSnowF`
- `cloudThunder`
- `cloudThunderF`
- `code`
- `codeSample`
- `codepen`
- `codepenCircle`
- `codepenSquare`
- `coffee`
- `coffeeCup`
- `coffeeCupF`
- `cog`
- `cogF`
- `cogs`
- `cogsF`
- `coin`
- `coinF`
- `color`
- `compass`
- `compassF`
- `computer`
- `computerAlt`
- `computerAltF`
- `computerF`
- `creditCard`
- `creditCardF`
- `crop`
- `crown`
- `crownF`
- `cutlery`
- `cutleryF`
- `cutter`
- `cutterF`
- `dashboard`
- `dashboardF`
- `database`
- `databaseF`
- `deezer`
- `deezerCircle`
- `deezerSquare`
- `delete`
- `deleteF`
- `deviantart`
- `deviantartCircle`
- `deviantartSquare`
- `dice`
- `diceF`
- `dices`
- `dicesF`
- `differenciation`
- `digg`
- `direction`
- `directionF`
- `directions`
- `directionsF`
- `disc`
- `discF`
- `discord`
- `disqus`
- `disqusCircle`
- `disqusSquare`
- `dj`
- `djF`
- `dna`
- `document`
- `documentF`
- `door`
- `download`
- `dribbble`
- `drupal`
- `drupalCircle`
- `drupalSquare`
- `ebay`
- `egg`
- `eggF`
- `eggs`
- `eggsF`
- `eject`
- `ejectCircle`
- `ejectCircleF`
- `ejectSquare`
- `ejectSquareF`
- `envelope`
- `envelopeF`
- `envelopeOpen`
- `envelopeOpenF`
- `extinguisher`
- `extinguisherF`
- `eye`
- `eyeClose`
- `eyeCloseF`
- `eyeF`
- `eyedropper`
- `eyedropperF`
- `facebook`
- `facebookCircle`
- `facebookSquare`
- `fastBackward`
- `fastBackwardCircle`
- `fastBackwardCircleF`
- `fastBackwardSquare`
- `fastBackwardSquareF`
- `fastForward`
- `fastForwardCircle`
- `fastForwardCircleF`
- `fastForwardSquare`
- `fastForwardSquareF`
- `feather`
- `featherF`
- `female`
- `file`
- `fileF`
- `files`
- `filesF`
- `filter`
- `filterF`
- `fingerprint`
- `firstAid`
- `firstAidF`
- `fish`
- `fiverr`
- `fiverrCircle`
- `fiverrSquare`
- `flag`
- `flagF`
- `flame`
- `flameF`
- `flashlightOff`
- `flashlightOffF`
- `flashlightOn`
- `flashlightOnF`
- `flask`
- `flickr`
- `flickrCircle`
- `flickrSquare`
- `flower`
- `folder`
- `folderF`
- `folderOpen`
- `folderOpenF`
- `folderZip`
- `folderZipF`
- `football`
- `fork`
- `forkF`
- `forward`
- `forwardCircle`
- `forwardCircleF`
- `forwardSquare`
- `forwardSquareF`
- `foursquare`
- `gamepad`
- `gamepadF`
- `gamepadRetro`
- `gamepadRetroF`
- `gamma`
- `ghost`
- `ghostF`
- `ghostOrg`
- `ghostOrgCircle`
- `ghostOrgSquare`
- `gift`
- `giftF`
- `github`
- `githubCircle`
- `githubSquare`
- `gitlab`
- `gitlabCircle`
- `gitlabSquare`
- `glassEmpty`
- `glassFilled`
- `glassFilledF`
- `glue`
- `glueF`
- `google`
- `googleCircle`
- `googlePlay`
- `googlePlayCircle`
- `googlePlaySquare`
- `googlePlus`
- `googlePlusCircle`
- `googlePlusSquare`
- `googleSquare`
- `gps`
- `gpsF`
- `grid`
- `gridF`
- `hairdryer`
- `hairdryerF`
- `hammer`
- `hammerF`
- `hashtag`
- `header`
- `header1`
- `header2`
- `header3`
- `header4`
- `header5`
- `header6`
- `headset`
- `headsetF`
- `heart`
- `heartF`
- `helmet`
- `helmetF`
- `help`
- `helpF`
- `highlighter`
- `highlighterF`
- `history`
- `home`
- `homeF`
- `hourglass`
- `hourglassF`
- `iceCream`
- `iceCreamF`
- `idCard`
- `idCardF`
- `inbox`
- `inboxF`
- `inboxes`
- `inboxesF`
- `indent`
- `infinite`
- `info`
- `infoF`
- `instagram`
- `instantPicture`
- `instantPictureF`
- `intersection`
- `italic`
- `joystick`
- `joystickF`
- `key`
- `keyF`
- `keyboard`
- `keyboardF`
- `language`
- `layers`
- `layersF`
- `layout`
- `layoutF`
- `leaf`
- `leafF`
- `lifebuoy`
- `lifebuoyF`
- `lightbulb`
- `lightbulbF`
- `line`
- `link`
- `linkedin`
- `linkedinCircle`
- `linkedinSquare`
- `logIn`
- `logOut`
- `ltr`
- `luggage`
- `luggageF`
- `magic`
- `magicF`
- `magnet`
- `magnetF`
- `male`
- `map`
- `mapF`
- `mapMarker`
- `mapMarkerF`
- `mask`
- `maskF`
- `medal`
- `medalF`
- `medical`
- `medium`
- `mediumCircle`
- `mediumSquare`
- `menu`
- `merge`
- `mergeF`
- `message`
- `messageAlt`
- `messageAltF`
- `messageAltWriting`
- `messageAltWritingF`
- `messageF`
- `messageWriting`
- `messageWritingF`
- `messages`
- `messagesAlt`
- `messagesAltF`
- `messagesF`
- `messenger`
- `mic`
- `micAlt`
- `micCircle`
- `micCircleF`
- `micF`
- `micSquare`
- `micSquareF`
- `microchip`
- `microchipF`
- `minus`
- `minusCircle`
- `minusCircleF`
- `minusRectangle`
- `minusRectangleF`
- `moon`
- `moonF`
- `moreHorizontal`
- `moreHorizontalF`
- `moreVertical`
- `moreVerticalF`
- `mountain`
- `mountainF`
- `move`
- `moveAlt`
- `movie`
- `mug`
- `mugF`
- `music`
- `musicF`
- `myspace`
- `myspaceCircle`
- `myspaceSquare`
- `napster`
- `napsterCircle`
- `napsterSquare`
- `newsletter`
- `newsletterF`
- `newspaper`
- `newspaperF`
- `npm`
- `odnoklassniki`
- `odnoklassnikiCircle`
- `odnoklassnikiSquare`
- `opera`
- `operaCircle`
- `operaSquare`
- `orderedList`
- `orientaton`
- `padlock`
- `padlockAlt`
- `padlockAltF`
- `padlockAltOpen`
- `padlockAltOpenF`
- `padlockF`
- `padlockOpen`
- `padlockOpenF`
- `pageBreak`
- `paperPlane`
- `paperPlaneF`
- `paragraph`
- `patreon`
- `patreonCircle`
- `patreonSquare`
- `pause`
- `paypal`
- `paypalCircle`
- `paypalSquare`
- `pen`
- `penF`
- `pencil`
- `pencilF`
- `periscope`
- `periscopeCircle`
- `periscopeSquare`
- `phone`
- `phoneF`
- `picture`
- `pictureEdit`
- `pictureF`
- `pictures`
- `picturesF`
- `pieChart`
- `pieChartAlt`
- `pieChartF`
- `pin`
- `pinAlt`
- `pinAltF`
- `pinF`
- `pinterest`
- `pinterestCircle`
- `pinterestSquare`
- `pizzaSlice`
- `plane`
- `planeF`
- `play`
- `playCircle`
- `playCircleF`
- `playSquare`
- `playSquareF`
- `plug`
- `plugF`
- `plus`
- `plusCircle`
- `plusCircleF`
- `plusRectangle`
- `plusRectangleF`
- `pocketWatch`
- `pocketWatchF`
- `podcast`
- `power`
- `printer`
- `printerF`
- `qrCode`
- `quora`
- `quoraCircle`
- `quoraSquare`
- `quote`
- `rainbow`
- `rec`
- `rectangle`
- `rectangleF`
- `reddit`
- `redo`
- `refresh`
- `refreshReverse`
- `repeat`
- `rocket`
- `rocketF`
- `rssFeed`
- `rtl`
- `rubber`
- `ruler`
- `rulerF`
- `save`
- `saveF`
- `scissors`
- `screen`
- `screenF`
- `screwdriver`
- `screwdriverF`
- `search`
- `searchFolder`
- `searchMinus`
- `searchPlus`
- `selectAll`
- `setBackward`
- `setBackwardCircle`
- `setBackwardCircleF`
- `setBackwardSquare`
- `setBackwardSquareF`
- `setForward`
- `setForwardCircle`
- `setForwardCircleF`
- `setForwardSquare`
- `setForwardSquareF`
- `setSquare`
- `setSquareF`
- `settingsAlt`
- `share`
- `shareAlt`
- `shareAltF`
- `shield`
- `shieldCheck`
- `shieldCheckF`
- `shieldClose`
- `shieldCloseF`
- `shieldF`
- `shieldHalf`
- `shieldMinus`
- `shieldMinusF`
- `shieldPlus`
- `shieldPlusF`
- `shopify`
- `shopifyCircle`
- `shopifySquare`
- `shoppingBag`
- `shoppingBagAlt`
- `shoppingBagAltF`
- `shoppingBagF`
- `shoppingCart`
- `shuffle`
- `signal`
- `sitemap`
- `sitemapF`
- `skull`
- `skullF`
- `skype`
- `skypeCircle`
- `skypeSquare`
- `slack`
- `slackCircle`
- `slackSquare`
- `smiley`
- `smileyF`
- `snapchat`
- `snapchatCircle`
- `snapchatSquare`
- `snowboard`
- `snowboardF`
- `snowflake`
- `soundcloud`
- `speaker`
- `speakerF`
- `spellCheck`
- `spotify`
- `square`
- `squareF`
- `squarespace`
- `squarespaceCircle`
- `squarespaceSquare`
- `stackoverflow`
- `stackoverflowCircle`
- `stackoverflowSquare`
- `stamp`
- `stampF`
- `star`
- `starF`
- `starFull`
- `starHalf`
- `starHalfF`
- `station`
- `stop`
- `stopSign`
- `store`
- `strikethrough`
- `stumbleupon`
- `stumbleuponCircle`
- `stumbleuponSquare`
- `subscript`
- `subtraction`
- `sun`
- `sunF`
- `superscript`
- `switchLeft`
- `switchLeftF`
- `switchRight`
- `switchRightF`
- `sword`
- `swordF`
- `tab`
- `table`
- `tableCell`
- `tableCellMerge`
- `tableColAfter`
- `tableColBefore`
- `tableDelete`
- `tableLeftHeader`
- `tableRightHeader`
- `tableRowAbove`
- `tableRowAfter`
- `tableTopHeader`
- `tablet`
- `tabletF`
- `tag`
- `tagF`
- `tags`
- `tagsF`
- `target`
- `taskList`
- `taskListF`
- `telegram`
- `temperature`
- `template`
- `terminal`
- `text`
- `thunder`
- `thunderF`
- `ticket`
- `ticketF`
- `tools`
- `toolsF`
- `torch`
- `torchF`
- `totem`
- `train`
- `trainF`
- `transgender`
- `trash`
- `trashAlt`
- `trashAltF`
- `trashF`
- `tree`
- `treeAlt`
- `treeAltF`
- `treeF`
- `trello`
- `triangle`
- `triangleDanger`
- `triangleDangerF`
- `triangleF`
- `trophy`
- `trophyF`
- `tube`
- `tumblr`
- `tumblrCircle`
- `tumblrSquare`
- `twitch`
- `twitter`
- `twitterCircle`
- `twitterSquare`
- `umbrella`
- `umbrellaClosed`
- `umbrellaClosedF`
- `umbrellaF`
- `underline`
- `undo`
- `unindent`
- `union`
- `universe`
- `unlink`
- `unorderedList`
- `unsplash`
- `unsplashCircle`
- `unsplashSquare`
- `upload`
- `user`
- `userCircle`
- `userMinus`
- `userPlus`
- `userRemove`
- `userSquare`
- `users`
- `viadeo`
- `viber`
- `viberCircle`
- `viberSquare`
- `videoCamera`
- `videoCameraF`
- `videoCameraVintage`
- `videoCameraVintageF`
- `vimeo`
- `vimeoCircle`
- `vimeoSquare`
- `vine`
- `vineCircle`
- `vineSquare`
- `voicemail`
- `volume`
- `volumeCircle`
- `volumeCircleF`
- `volumeDown`
- `volumeDownCircle`
- `volumeDownCircleF`
- `volumeDownSquare`
- `volumeDownSquareF`
- `volumeMute`
- `volumeMuteCircle`
- `volumeMuteCircleF`
- `volumeMuteSquare`
- `volumeMuteSquareF`
- `volumeSquare`
- `volumeSquareF`
- `volumeUp`
- `volumeUpCircle`
- `volumeUpCircleF`
- `volumeUpSquare`
- `volumeUpSquareF`
- `watch`
- `watchF`
- `waterDrop`
- `waterDropF`
- `whatsapp`
- `wifi`
- `wikipedia`
- `wordpress`
- `world`
- `wrench`
- `wrenchF`
- `write`
- `writeF`
- `yahoo`
- `yahooCircle`
- `yahooSquare`
- `yelp`
- `yelpCircle`
- `yelpSquare`
- `youtube`
- `youtubeCircle`
- `youtubeSquare`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, AccessibilityIcon, ActivityIcon, AirbnbIcon } from '@stacksjs/iconify-jam'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    contact: ActivityIcon({ size: 20, class: 'nav-icon' }),
    settings: AirbnbIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-jam'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, AccessibilityIcon, ActivityIcon } from '@stacksjs/iconify-jam'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccessibilityIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ActivityIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, AccessibilityIcon } from '@stacksjs/iconify-jam'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, accessibility } from '@stacksjs/iconify-jam'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, AccessibilityIcon } from '@stacksjs/iconify-jam'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-jam'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-jam'
     global.icon = 500pxIcon({ size: 24 })
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
   const icon = 500pxIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 500px } from '@stacksjs/iconify-jam'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/cyberalien/jam-backup/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Michael Amprimo ([Website](https://github.com/michaelampr))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/jam/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/jam/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
