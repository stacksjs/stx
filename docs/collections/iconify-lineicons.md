# Lineicons

> Lineicons icons for stx from Iconify

## Overview

This package provides access to 962 icons from the Lineicons collection through the stx iconify integration.

**Collection ID:** `lineicons`
**Total Icons:** 962
**Author:** Lineicons ([Website](https://github.com/LineiconsHQ/Lineicons))
**License:** MIT ([Details](https://github.com/LineiconsHQ/Lineicons/blob/main/LICENSE.md))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lineicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, AddFilesIcon, AdobeIcon } from '@stacksjs/iconify-lineicons'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = AddFilesIcon({ color: 'red' })

// With multiple props
const customIcon = AdobeIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, AddFilesIcon, AdobeIcon } from '@stacksjs/iconify-lineicons'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: AddFilesIcon({ size: 24, color: '#4a90e2' }),
    settings: AdobeIcon({ size: 32 })
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
import { 500px, addFiles, adobe } from '@stacksjs/iconify-lineicons'
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

This package contains **962** icons:

- `500px`
- `addFiles`
- `adobe`
- `adonis`
- `aeroplane1`
- `agenda`
- `airbnb`
- `airtable`
- `alarm`
- `alarm1`
- `alarmClock`
- `alignTextCenter`
- `alignTextLeft`
- `alignTextRight`
- `alpinejs`
- `amazon`
- `amazonOriginal`
- `amazonPay`
- `ambulance`
- `ambulance1`
- `amd`
- `amex`
- `anchor`
- `android`
- `androidOld`
- `androidOriginal`
- `angellist`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angular`
- `apartment`
- `appStore`
- `appleBrand`
- `appleMusic`
- `appleMusicAlt`
- `applePay`
- `arcBrowser`
- `archive`
- `arrowAllDirection`
- `arrowAngularTopLeft`
- `arrowAngularTopRight`
- `arrowBothDirectionHorizontal1`
- `arrowBothDirectionVertical1`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownward`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowRight`
- `arrowRightCircle`
- `arrowTopLeft`
- `arrowTopRight`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpward`
- `arrowsHorizontal`
- `arrowsVertical`
- `asana`
- `astro`
- `atlassian`
- `audi`
- `audiAlt`
- `aws`
- `azure`
- `backward`
- `badgeDecagramPercent`
- `balloons`
- `baloon`
- `ban`
- `ban2`
- `barChart`
- `barChart4`
- `barChartDollar`
- `basketShopping3`
- `basketball`
- `beat`
- `behance`
- `behanceOriginal`
- `bell1`
- `biCycle`
- `bike`
- `bing`
- `bitbucket`
- `bitcoin`
- `bittorrent`
- `blackboard`
- `blogger`
- `bloggerAlt`
- `bluetooth`
- `bluetoothLogo`
- `bluetoothOriginal`
- `bmw`
- `boardWriting3`
- `bold`
- `bolt`
- `bolt2`
- `bolt3`
- `boltAlt`
- `book`
- `book1`
- `bookmark`
- `bookmark1`
- `bookmarkAlt`
- `bookmarkCircle`
- `books2`
- `bootstrap`
- `bootstrap5`
- `bootstrap5Square`
- `boxArchive1`
- `boxClosed`
- `boxGift1`
- `brave`
- `bricks`
- `bridge`
- `bridge3`
- `briefcase`
- `briefcase1`
- `briefcase2`
- `briefcaseAlt`
- `briefcasePlus1`
- `brush`
- `brush1Rotated`
- `brush2`
- `brushAlt`
- `btc`
- `bubble`
- `bug`
- `bug1`
- `buildings1`
- `bulb`
- `bulb2`
- `bulb4`
- `bullhorn`
- `burger`
- `burger1`
- `burgerDrink`
- `bus`
- `bus1`
- `busketBall`
- `cake`
- `cake1`
- `calculator`
- `calculator1`
- `calculator2`
- `calculatorAlt`
- `calendar`
- `calendarDays`
- `camera`
- `camera1`
- `cameraMovie1`
- `candy`
- `candyCane`
- `candyCane2`
- `candyRound1`
- `canva`
- `capsule`
- `capsule1`
- `car`
- `car2`
- `car4`
- `car6`
- `carAlt`
- `caravan`
- `caravan1`
- `cart`
- `cart1`
- `cart2`
- `cartFull`
- `cashApp`
- `certificate`
- `certificateBadge1`
- `chatBubble2`
- `check`
- `checkBox`
- `checkCircle1`
- `checkSquare2`
- `checkmark`
- `checkmarkCircle`
- `chefHat`
- `chevronDown`
- `chevronDownCircle`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronRight`
- `chevronRightCircle`
- `chevronUp`
- `chevronUpCircle`
- `chrome`
- `chromecast`
- `circleMinus`
- `circlePlus`
- `cisco`
- `claude`
- `clickup`
- `clipboard`
- `close`
- `cloud`
- `cloud2`
- `cloudBolt1`
- `cloudBolt2`
- `cloudCheck`
- `cloudCheckCircle`
- `cloudDownload`
- `cloudIot2`
- `cloudNetwork`
- `cloudRain`
- `cloudRefreshClockwise`
- `cloudSun`
- `cloudSync`
- `cloudUpload`
- `cloudflare`
- `cloudySun`
- `code`
- `code1`
- `codeAlt`
- `codeS`
- `codepen`
- `coffeeCup`
- `coffeeCup2`
- `cog`
- `cogs`
- `coin`
- `coinbase`
- `colourPalette3`
- `comment1`
- `comment1Share`
- `comment1Text`
- `comments`
- `commentsAlt2`
- `commentsReply`
- `compass`
- `compassDrafting2`
- `connectdevelop`
- `construction`
- `constructionHammer`
- `consulting`
- `controlPanel`
- `cool`
- `copilot`
- `coral`
- `cpanel`
- `crane4`
- `creativeCommons`
- `creditCardMultiple`
- `creditCards`
- `crop`
- `crop2`
- `crossCircle`
- `crown`
- `crown3`
- `css3`
- `cup`
- `customer`
- `cut`
- `dashboard`
- `dashboardSquare1`
- `database`
- `database2`
- `delivery`
- `deno`
- `dev`
- `dialogflow`
- `diamondAlt`
- `diamondShape`
- `diamonds1`
- `diamonds2`
- `digitalocean`
- `dinersClub`
- `dinner`
- `direction`
- `directionAlt`
- `directionLtr`
- `directionRtl`
- `discord`
- `discordAlt`
- `discordChat`
- `discover`
- `display`
- `displayAlt`
- `docker`
- `dollar`
- `dollarCircle`
- `domain`
- `doubleQuotesEnd1`
- `download`
- `download1`
- `downloadCircle1`
- `dribbble`
- `dribbbleSymbol`
- `drizzle`
- `drop`
- `dropbox`
- `dropboxOriginal`
- `drupal`
- `drupalOriginal`
- `dumbbell`
- `dumbbell1`
- `edge`
- `emojiExpressionless`
- `emojiExpressionlessFlatEyes`
- `emojiGrin`
- `emojiSad`
- `emojiSmile`
- `emojiSmileSide`
- `emojiSmileSunglass`
- `emojiSmileTongue`
- `emptyFile`
- `enter`
- `enterDown`
- `envato`
- `envelope`
- `envelope1`
- `eraser`
- `eraser1`
- `ethereum`
- `ethereumLogo`
- `euro`
- `exit`
- `exitDown`
- `exitUp`
- `expandArrow1`
- `expandSquare4`
- `expressjs`
- `eye`
- `facebook`
- `facebookFill`
- `facebookLine`
- `facebookMessenger`
- `facebookOriginal`
- `facebookOval`
- `facebookRounded`
- `facebookSquare`
- `facetime`
- `figma`
- `fileFormatZip`
- `fileMultiple`
- `filePencil`
- `filePlusCircle`
- `fileQuestion`
- `fileXmark`
- `files`
- `firebase`
- `firefox`
- `firefoxOriginal`
- `fireworkRocket4`
- `fireworks`
- `firstAid`
- `fitbit`
- `flag`
- `flag1`
- `flag2`
- `flagAlt`
- `flagsAlt1`
- `flickr`
- `floppyDisk1`
- `flower`
- `flower2`
- `flutter`
- `folder`
- `folder1`
- `ford`
- `forward`
- `frameExpand`
- `framer`
- `freshJuice`
- `friendly`
- `fullScreen`
- `funnel`
- `funnel1`
- `gallery`
- `game`
- `gamePadModern1`
- `gatsby`
- `gauge1`
- `gear1`
- `gears3`
- `gemini`
- `gift`
- `git`
- `github`
- `githubOriginal`
- `glassJuice1`
- `globe1`
- `globeStand`
- `go`
- `goodreads`
- `google`
- `googleCloud`
- `googleDrive`
- `googleMeet`
- `googlePay`
- `googleWallet`
- `graduation`
- `graduationCap1`
- `grammarly`
- `graph`
- `grid`
- `gridAlt`
- `grow`
- `hackerNews`
- `hammer`
- `hammer1`
- `hammer2`
- `hand`
- `handMic`
- `handShake`
- `handStop`
- `handTakingDollar`
- `handTakingLeaf1`
- `handTakingUser`
- `handshake`
- `happy`
- `harddrive`
- `hashnode`
- `hatChef3`
- `headphone`
- `headphone1`
- `heart`
- `heartFill`
- `heartMonitor`
- `helicopter`
- `helicopter2`
- `helmet`
- `helmetSafety1`
- `help`
- `hierarchy1`
- `highlight`
- `highlightAlt`
- `highlighter1`
- `highlighter2`
- `home`
- `home2`
- `hospital`
- `hospital2`
- `hourglass`
- `html5`
- `ibm`
- `idCard`
- `image`
- `imdb`
- `inbox`
- `indent`
- `indentDecrease`
- `indentIncrease`
- `infinite`
- `info`
- `information`
- `injection1`
- `instagram`
- `instagramFill`
- `instagramLogotype`
- `instagramOriginal`
- `intel`
- `invention`
- `investMonitor`
- `investment`
- `ios`
- `island`
- `island2`
- `italic`
- `jaguar`
- `jamstack`
- `java`
- `javascript`
- `jcb`
- `joomla`
- `joomlaOriginal`
- `jsfiddle`
- `juice`
- `key`
- `key1`
- `keyboard`
- `keywordResearch`
- `knifeFork1`
- `kubernetes`
- `labelDollar2`
- `laptop`
- `laptop2`
- `laptopPhone`
- `laravel`
- `layers`
- `layers1`
- `layout`
- `layout26`
- `layout9`
- `leaf`
- `leaf1`
- `leaf6`
- `lemonSqueezy`
- `library`
- `license`
- `lifeGuardTube1`
- `lifering`
- `line`
- `lineDashed`
- `lineDotted`
- `lineDouble`
- `lineHeight`
- `lineSpacing`
- `lineicons`
- `lineiconsAlt`
- `lineiconsSymbol`
- `lineiconsSymbolAlt`
- `lineiconsSymbolAlt2`
- `link`
- `link2AngularRight`
- `linkedin`
- `linkedinOriginal`
- `list`
- `locationArrowRight`
- `lock`
- `lockAlt`
- `locked1`
- `locked2`
- `loom`
- `magento`
- `magnet`
- `magnifier`
- `mailchimp`
- `map`
- `mapMarker`
- `mapMarker1`
- `mapMarker5`
- `mapPin5`
- `markdown`
- `mashroom`
- `mastercard`
- `medium`
- `mediumAlt`
- `megaphone1`
- `menu`
- `menuCheesburger`
- `menuHamburger1`
- `menuMeatballs1`
- `menuMeatballs2`
- `mercedes`
- `message2`
- `message2Question`
- `message3Text`
- `meta`
- `meta1`
- `meta2`
- `metaAlt`
- `mic`
- `microphone`
- `microphone1`
- `microscope`
- `microsoft`
- `microsoftEdge`
- `microsoftTeams`
- `minus`
- `minusCircle`
- `mobile`
- `moneyLocation`
- `moneyProtection`
- `mongodb`
- `monitor`
- `monitorCode`
- `monitorMac`
- `moonHalfRight5`
- `more`
- `moreAlt`
- `mountains2`
- `mouse`
- `mouse2`
- `move`
- `mushroom`
- `mushroom1`
- `mushroom5`
- `music`
- `mysql`
- `nasa`
- `netflix`
- `netlify`
- `network`
- `nextStep2`
- `nextjs`
- `night`
- `nike`
- `nissan`
- `nodejs`
- `nodejsAlt`
- `notebook1`
- `notepad`
- `notion`
- `npm`
- `nuxt`
- `nvidia`
- `oculus`
- `offer`
- `openAi`
- `opera`
- `operaMini`
- `oracle`
- `outdent`
- `package`
- `paddle`
- `pageBreak`
- `pageBreak1`
- `pagination`
- `paintBucket`
- `paintBucketAlt`
- `paintRoller`
- `paintRoller1`
- `pallet`
- `paperclip`
- `paperclip1`
- `partyFlags`
- `partySpray`
- `patreon`
- `pause`
- `payoneer`
- `paypal`
- `paypalOriginal`
- `penToSquare`
- `pencil`
- `pencil1`
- `pencilAlt`
- `pepsi`
- `phone`
- `phoneSet`
- `photos`
- `php`
- `pieChart`
- `pieChart2`
- `pilcrow`
- `pimjoLogo`
- `pimjoSymbol`
- `pin`
- `pinterest`
- `pizza`
- `pizza2`
- `placeholderDollar`
- `plane`
- `plantscale`
- `play`
- `playStore`
- `playStoreAlt`
- `playStoreFill`
- `playstation`
- `plug`
- `plug1`
- `plus`
- `plusCircle`
- `pnpm`
- `pointer`
- `pointerDown`
- `pointerLeft`
- `pointerRight`
- `pointerTop`
- `popup`
- `postcard`
- `postgresql`
- `postman`
- `pound`
- `powerButton`
- `powerSwitch`
- `previousStep2`
- `printer`
- `prisma`
- `producthunt`
- `protection`
- `protonMailLogo`
- `protonMailSymbol`
- `pulse`
- `pyramids`
- `python`
- `questionCircle`
- `questionMark`
- `questionMarkCircle`
- `quora`
- `quotation`
- `radioButton`
- `radis`
- `rain`
- `react`
- `reddit`
- `refreshCircle1Clockwise`
- `refreshDollar1`
- `refreshUser1`
- `reload`
- `remixJs`
- `removeFile`
- `reply`
- `restaurant`
- `revenue`
- `road`
- `road1`
- `rocket`
- `rocket5`
- `route1`
- `rssFeed`
- `rssRight`
- `ruler`
- `ruler1`
- `rulerAlt`
- `rulerPen`
- `rulerPencil`
- `rupee`
- `sad`
- `safari`
- `sanity`
- `save`
- `schoolBench`
- `schoolBench1`
- `schoolBench2`
- `schoolBenchAlt`
- `scissors1Vertical`
- `scooter`
- `scoter`
- `scrollDown`
- `scrollDown2`
- `search`
- `search1`
- `search2`
- `searchAlt`
- `searchMinus`
- `searchPlus`
- `searchText`
- `selectCursor`
- `selectCursor1`
- `seo`
- `seoMonitor`
- `service`
- `serviceBell1`
- `share`
- `share1`
- `share1Circle`
- `share2`
- `shareAlt`
- `shield`
- `shield2`
- `shield2Check`
- `shieldDollar`
- `shiftLeft`
- `shiftRight`
- `ship`
- `ship1`
- `shirt1`
- `shopify`
- `shoppingBasket`
- `shortcode`
- `shovel`
- `shuffle`
- `signPostLeft`
- `signal`
- `signalApp`
- `signsPost2`
- `sketch`
- `skippingRope`
- `skype`
- `slack`
- `slackLine`
- `slice`
- `slice2`
- `slidersHorizontalSquare2`
- `slideshare`
- `slim`
- `smile`
- `snapchat`
- `sortAlphaAsc`
- `sortAlphabetical`
- `sortAmountAsc`
- `sortAmountDsc`
- `sortHighToLow`
- `soundcloud`
- `soundcloudOriginal`
- `spacex`
- `speechless`
- `spellcheck`
- `spinner`
- `spinner2Sacle`
- `spinner3`
- `spinnerArrow`
- `spinnerSolid`
- `sports`
- `spotify`
- `spotifyAlt`
- `spotifyOriginal`
- `spray`
- `sprout`
- `squarespace`
- `stackoverflow`
- `stamp`
- `starEmpty`
- `starFat`
- `starFatHalf2`
- `starFill`
- `starHalf`
- `starSharpDisabled`
- `statista`
- `statsDown`
- `statsUp`
- `steam`
- `stethoscope1`
- `sthethoscope`
- `stop`
- `stopwatch`
- `storageHdd2`
- `strikethrough`
- `strikethrough1`
- `stripe`
- `stumbleupon`
- `sun`
- `sun1`
- `supabase`
- `support`
- `surfBoard`
- `surfboard2`
- `suspect`
- `svelte`
- `swift`
- `syringe`
- `tShirt`
- `tab`
- `tag`
- `tailwindcss`
- `target`
- `targetCustomer`
- `targetRevenue`
- `targetUser`
- `taxi`
- `teabag`
- `telegram`
- `telegramOriginal`
- `telephone1`
- `telephone3`
- `tesla`
- `textAlignCenter`
- `textAlignJustify`
- `textAlignLeft`
- `textAlignRight`
- `textFormat`
- `textFormatRemove`
- `textParagraph`
- `thought`
- `thumbsDown`
- `thumbsDown3`
- `thumbsUp`
- `thumbsUp3`
- `thunder`
- `thunderAlt`
- `ticket`
- `ticket1`
- `ticketAlt`
- `tickets3`
- `tiktok`
- `tiktokAlt`
- `timer`
- `tounge`
- `towerBroadcast1`
- `toyota`
- `train`
- `train1`
- `train3`
- `trainAlt`
- `trash3`
- `trashCan`
- `travel`
- `tree`
- `tree2`
- `trees`
- `trees3`
- `trello`
- `trendDown1`
- `trendUp1`
- `trophy1`
- `trowel`
- `trowel1`
- `truckDelivery1`
- `tumblr`
- `turborepo`
- `twitch`
- `twitter`
- `twitterFill`
- `twitterOld`
- `twitterOriginal`
- `typescript`
- `uber`
- `uberSymbol`
- `ubuntu`
- `underline`
- `unlink`
- `unlink2AngularEft`
- `unlock`
- `unlocked2`
- `unsplash`
- `upload`
- `upload1`
- `uploadCircle1`
- `user`
- `user4`
- `userMultiple4`
- `users`
- `ux`
- `vector`
- `vectorNodes6`
- `vectorNodes7`
- `vercel`
- `video`
- `vimeo`
- `visa`
- `vite`
- `vk`
- `vmware`
- `volkswagen`
- `volume`
- `volume1`
- `volumeHigh`
- `volumeLow`
- `volumeMedium`
- `volumeMute`
- `volumeOff`
- `vsCode`
- `vuejs`
- `wallet`
- `wallet1`
- `warning`
- `watchBeat1`
- `waterDrop1`
- `webflow`
- `webhooks`
- `website`
- `websiteAlt`
- `wechat`
- `weight`
- `weightMachine1`
- `whatsapp`
- `wheelbarrow`
- `wheelbarrowEmpty`
- `wheelchair`
- `wheelchair1`
- `windows`
- `wise`
- `wordpress`
- `wordpressFill`
- `world`
- `worldAlt`
- `write`
- `www`
- `wwwCursor`
- `x`
- `xampp`
- `xbox`
- `xmark`
- `xmarkCircle`
- `xrp`
- `yahoo`
- `yarn`
- `ycombinator`
- `yen`
- `youtube`
- `youtubeKids`
- `youtubeMusic`
- `zapier`
- `zeroSize`
- `zip`
- `zoom`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, AddFilesIcon, AdobeIcon, AdonisIcon } from '@stacksjs/iconify-lineicons'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: AddFilesIcon({ size: 20, class: 'nav-icon' }),
    contact: AdobeIcon({ size: 20, class: 'nav-icon' }),
    settings: AdonisIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-lineicons'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, AddFilesIcon, AdobeIcon } from '@stacksjs/iconify-lineicons'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddFilesIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdobeIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, AddFilesIcon } from '@stacksjs/iconify-lineicons'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, addFiles } from '@stacksjs/iconify-lineicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, AddFilesIcon } from '@stacksjs/iconify-lineicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-lineicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-lineicons'
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
import { 500px } from '@stacksjs/iconify-lineicons'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/LineiconsHQ/Lineicons/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: Lineicons ([Website](https://github.com/LineiconsHQ/Lineicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lineicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lineicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
