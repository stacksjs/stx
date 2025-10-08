# WebHostingHub Glyphs

> WebHostingHub Glyphs icons for stx from Iconify

## Overview

This package provides access to 2125 icons from the WebHostingHub Glyphs collection through the stx iconify integration.

**Collection ID:** `whh`
**Total Icons:** 2125
**Author:** WebHostingHub
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-whh
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 0Icon, 1Icon, 2Icon } from '@stacksjs/iconify-whh'

// Basic usage
const icon = 0Icon()

// With size
const sizedIcon = 0Icon({ size: 24 })

// With color
const coloredIcon = 1Icon({ color: 'red' })

// With multiple props
const customIcon = 2Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 0Icon, 1Icon, 2Icon } from '@stacksjs/iconify-whh'

  global.icons = {
    home: 0Icon({ size: 24 }),
    user: 1Icon({ size: 24, color: '#4a90e2' }),
    settings: 2Icon({ size: 32 })
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
import { 0, 1, 2 } from '@stacksjs/iconify-whh'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(0, { size: 24 })
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
const redIcon = 0Icon({ color: 'red' })
const blueIcon = 0Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 0Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 0Icon({ class: 'text-primary' })
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
const icon24 = 0Icon({ size: 24 })
const icon1em = 0Icon({ size: '1em' })

// Set individual dimensions
const customIcon = 0Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 0Icon({ height: '1em' })
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
const smallIcon = 0Icon({ class: 'icon-small' })
const largeIcon = 0Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **2125** icons:

- `0`
- `1`
- `2`
- `3`
- `4`
- `5`
- `6`
- `7`
- `8`
- `9`
- `a`
- `aUpperCase`
- `aaabattery`
- `abacus`
- `accountfilter`
- `acorn`
- `acsource`
- `addalarm`
- `addcomment`
- `addfolderalt`
- `addfriend`
- `address`
- `addshape`
- `addtags`
- `addtocart`
- `addtolist`
- `adduseralt`
- `adjust`
- `adobe`
- `ads`
- `aef`
- `affiliate`
- `ajax`
- `alarm`
- `alarmalt`
- `alarmclock`
- `album`
- `alertalt`
- `alertpay`
- `algorhythm`
- `alienship`
- `alienware`
- `alignbottomedge`
- `aligncenter`
- `alignhorizontalcenter`
- `alignjustify`
- `alignleft`
- `alignleftedge`
- `alignright`
- `alignrightedge`
- `aligntopedge`
- `alignverticalcenter`
- `amazon`
- `amd`
- `analogdown`
- `analogleft`
- `analogright`
- `analogup`
- `analytics`
- `analyticsalt`
- `anchor`
- `android`
- `angle`
- `angrybirds`
- `antenna`
- `antivirus`
- `antivirusalt`
- `apache`
- `aperture`
- `apple`
- `appointment`
- `arch`
- `archive`
- `archlinux`
- `arrowdown`
- `arrowleft`
- `arrowright`
- `arrowup`
- `asterisk`
- `asteroid`
- `astronaut`
- `at`
- `atari`
- `atom`
- `atoz`
- `authentication`
- `autoflash`
- `automobile`
- `autorespond`
- `avatar`
- `avataralt`
- `avengers`
- `avocado`
- `awstats`
- `axe`
- `b`
- `bUpperCase`
- `baby`
- `backup`
- `backupalt`
- `backupwizard`
- `backward`
- `bacon`
- `bag`
- `bait`
- `baloon`
- `bamboo`
- `banana`
- `bancircle`
- `bandwidth`
- `bank`
- `banuser`
- `banuseralt`
- `barchart`
- `barchartalt`
- `barchartasc`
- `barchartdesc`
- `barcode`
- `barrel`
- `basecamp`
- `basketball`
- `bat`
- `bathtub`
- `batman`
- `batteryaltcharging`
- `batteryaltfull`
- `batteryaltsixty`
- `batteryaltthird`
- `batterycharged`
- `batterycharging`
- `batteryeighty`
- `batteryempty`
- `batteryforty`
- `batteryfull`
- `batterysixty`
- `batterytwenty`
- `bbpress`
- `beaker`
- `beakeralt`
- `bed`
- `beer`
- `beeralt`
- `behance`
- `bell`
- `bellalt`
- `belt`
- `bigace`
- `bigger`
- `bill`
- `binary`
- `bing`
- `binoculars`
- `biohazard`
- `birdhouse`
- `birthday`
- `bishop`
- `bitcoin`
- `bitcoinalt`
- `bitcoinsquare`
- `blackberry`
- `blankstare`
- `blogger`
- `bluetooth`
- `bluetoothconnected`
- `boardgame`
- `boat`
- `bold`
- `bomb`
- `bone`
- `book`
- `bookalt`
- `bookmark`
- `bookmarkalt`
- `bookmarkfour`
- `bookmarkthree`
- `bookthree`
- `boombox`
- `bottle`
- `bottomborder`
- `bow`
- `bowl`
- `bowling`
- `bowlingpins`
- `bowtie`
- `box`
- `boxbilling`
- `boxing`
- `boxtrapper`
- `braces`
- `braillea`
- `brailleb`
- `braillec`
- `brailled`
- `braillee`
- `brailleeight`
- `braillef`
- `braillefive`
- `braillefour`
- `brailleg`
- `brailleh`
- `braillei`
- `braillej`
- `braillek`
- `braillel`
- `braillem`
- `braillen`
- `braillenine`
- `brailleo`
- `brailleone`
- `braillep`
- `brailleq`
- `brailler`
- `brailles`
- `brailleseven`
- `braillesix`
- `braillespace`
- `braillet`
- `braillethree`
- `brailletwo`
- `brailleu`
- `braillev`
- `braillew`
- `braillex`
- `brailley`
- `braillez`
- `braillezero`
- `brain`
- `branch`
- `bread`
- `breakable`
- `briefcase`
- `briefcasethree`
- `briefcasetwo`
- `brightness`
- `brightnessalt`
- `brightnessaltauto`
- `brightnessaltfull`
- `brightnessalthalf`
- `brightnessfull`
- `brightnesshalf`
- `bringforward`
- `bringtofront`
- `brokenheart`
- `brokenlink`
- `broom`
- `browser`
- `brush`
- `btwoevolution`
- `bucket`
- `bug`
- `building`
- `bullet`
- `bullhorn`
- `burstmode`
- `bus`
- `busalt`
- `business`
- `businesscard`
- `businesscardalt`
- `butterfly`
- `butterflyalt`
- `buttona`
- `buttonb`
- `buttonx`
- `buttony`
- `c`
- `cUpperCase`
- `cactus`
- `calcdivide`
- `calcequals`
- `calcminus`
- `calcmultiply`
- `calcplus`
- `calculator`
- `calculatoralt`
- `calendar`
- `calendaralt`
- `calendarthree`
- `caligraphy`
- `call`
- `callalt`
- `camcorder`
- `camel`
- `camera`
- `cameraflash`
- `campfire`
- `camping`
- `candle`
- `candy`
- `candycane`
- `canister`
- `cannon`
- `canvas`
- `canvasrulers`
- `capacitator`
- `capslock`
- `captainamerica`
- `carbattery`
- `carrot`
- `cartalt`
- `cash`
- `cashregister`
- `cassette`
- `cassettealt`
- `cat`
- `catface`
- `cctv`
- `cd`
- `ceilinglight`
- `cell`
- `certificate`
- `certificatealt`
- `certificatethree`
- `cgi`
- `cgicenter`
- `chair`
- `chandelier`
- `charliechaplin`
- `chat`
- `checkbox`
- `checkboxalt`
- `checkin`
- `checkinalt`
- `checkmark`
- `chef`
- `cherry`
- `cherryalt`
- `chevrondown`
- `chevronleft`
- `chevronright`
- `chevrons`
- `chevronup`
- `chicken`
- `chickenalt`
- `chocolate`
- `christiancross`
- `christmasstree`
- `chrome`
- `church`
- `chyrp`
- `cigar`
- `cigarette`
- `circlea`
- `circleadd`
- `circlearrowdown`
- `circlearrowleft`
- `circlearrowright`
- `circlearrowup`
- `circleb`
- `circlebackward`
- `circlebackwardempty`
- `circlec`
- `circlecallincoming`
- `circlecallmissed`
- `circlecalloutgoing`
- `circled`
- `circledelete`
- `circledown`
- `circledownload`
- `circledribbble`
- `circlee`
- `circleeight`
- `circlef`
- `circlefacebook`
- `circlefive`
- `circlefork`
- `circleforward`
- `circleforwardempty`
- `circlefour`
- `circleg`
- `circlegithub`
- `circlegoogleplus`
- `circleh`
- `circlehammer`
- `circlei`
- `circleinstagram`
- `circlej`
- `circlek`
- `circleknife`
- `circlel`
- `circleleft`
- `circleloaderempty`
- `circleloaderfive`
- `circleloaderfour`
- `circleloaderfull`
- `circleloaderone`
- `circleloaderseven`
- `circleloadersix`
- `circleloaderthree`
- `circleloadertwo`
- `circlem`
- `circlen`
- `circlenext`
- `circlenextempty`
- `circlenine`
- `circleo`
- `circleone`
- `circlep`
- `circlepath`
- `circlepause`
- `circlepauseempty`
- `circlepencil`
- `circleplay`
- `circleplayempty`
- `circleprevious`
- `circlepreviousempty`
- `circleq`
- `circlequora`
- `circler`
- `circlerecord`
- `circlerecordempty`
- `circleright`
- `circles`
- `circlescrewdriver`
- `circleselect`
- `circleselection`
- `circleseven`
- `circlesix`
- `circlespoon`
- `circlestop`
- `circlestopempty`
- `circlet`
- `circlethree`
- `circletwitter`
- `circletwo`
- `circleu`
- `circleup`
- `circleupload`
- `circlev`
- `circlevimeo`
- `circlevine`
- `circlew`
- `circlex`
- `circleyahoo`
- `circlez`
- `circlezero`
- `circlezerply`
- `city`
- `clearformatting`
- `clipboard`
- `clipboardalt`
- `clock`
- `clockalt`
- `closetab`
- `closewindow`
- `cloud`
- `cloudalt`
- `cloudaltdownload`
- `cloudaltprivate`
- `cloudaltsync`
- `cloudaltupload`
- `clouddownload`
- `clouderror`
- `cloudhosting`
- `cloudsync`
- `cloudupload`
- `clover`
- `cloveralt`
- `clubs`
- `cmd`
- `cms`
- `cmsmadesimple`
- `cocktail`
- `code`
- `codeigniter`
- `coffee`
- `coffeealt`
- `coffeebean`
- `coffeecupalt`
- `cog`
- `coins`
- `coinsalt`
- `collabtive`
- `colocation`
- `colocationalt`
- `colors`
- `comedy`
- `comment`
- `commentlove`
- `commentout`
- `commentround`
- `commentroundempty`
- `commentroundtyping`
- `commentroundtypingempty`
- `commentsmiley`
- `commenttyping`
- `commit`
- `community`
- `communitysmall`
- `compass`
- `compile`
- `compress`
- `concretefive`
- `cone`
- `connected`
- `connectedpc`
- `constellation`
- `construction`
- `contao`
- `controllernes`
- `controllerps`
- `controllersnes`
- `controlpanel`
- `controlpanelalt`
- `cooling`
- `coppermine`
- `copy`
- `copyapp`
- `copyright`
- `counter`
- `counteralt`
- `coupon`
- `cow`
- `cpanel`
- `cplusplus`
- `cpu`
- `cpualt`
- `cputhree`
- `crackedegg`
- `crayon`
- `createfile`
- `createfolder`
- `creativecommons`
- `creditcard`
- `creeper`
- `cricket`
- `croisant`
- `crop`
- `crown`
- `csharp`
- `cssthree`
- `cube`
- `cuckooclock`
- `cupcake`
- `curling`
- `currency`
- `currents`
- `cursor`
- `cut`
- `cuthere`
- `d`
- `dUpperCase`
- `dagger`
- `danger`
- `dart`
- `darthvader`
- `database`
- `databaseadd`
- `databasedelete`
- `davidstar`
- `day`
- `dcsource`
- `deathstar`
- `deathstarbuilding`
- `debug`
- `dedicatedserver`
- `defragment`
- `delete`
- `deletealarm`
- `deletecomment`
- `deletefile`
- `deletefolder`
- `deletefolderalt`
- `delicious`
- `design`
- `designcontest`
- `desklamp`
- `details`
- `detailsalt`
- `deviantart`
- `dialpad`
- `diamond`
- `diamonds`
- `dice`
- `diefive`
- `diefour`
- `dieone`
- `diesix`
- `diethree`
- `dietwo`
- `digg`
- `diode`
- `directions`
- `director`
- `diskspace`
- `distributehorizontalcenters`
- `distributeverticalcenters`
- `divide`
- `dna`
- `dnszone`
- `document`
- `dog`
- `doghouse`
- `dollar`
- `dollaralt`
- `dollarsquare`
- `dolphin`
- `dolphinsoftware`
- `domain`
- `domainaddon`
- `domino`
- `dominoeight`
- `dominofive`
- `dominofour`
- `dominonine`
- `dominoone`
- `dominoseven`
- `dominosix`
- `dominothree`
- `dominotwo`
- `donotdisturb`
- `donut`
- `dotclear`
- `dotlist`
- `dotproject`
- `doubletap`
- `downleft`
- `download`
- `downloadalt`
- `downright`
- `draft`
- `drawer`
- `dreamweaver`
- `dribbble`
- `dribbblealt`
- `drill`
- `drmanhattan`
- `dropbox`
- `dropmenu`
- `drupal`
- `drwho`
- `ducky`
- `e`
- `eUpperCase`
- `earbuds`
- `earbudsalt`
- `edit`
- `editalt`
- `egg`
- `eggplant`
- `egyptpyramid`
- `eightball`
- `eject`
- `elementaryos`
- `elevator`
- `elgg`
- `elipse`
- `emailalt`
- `emailexport`
- `emailforward`
- `emailforwarders`
- `emailimport`
- `emailrefresh`
- `emailtrace`
- `emergency`
- `emojiangry`
- `emojiconfused`
- `emojicry`
- `emojidead`
- `emojidevil`
- `emojigrin`
- `emojigrinalt`
- `emojisleep`
- `emojismile`
- `emojisorry`
- `emojisurprise`
- `emojiwink`
- `emptycart`
- `emptystar`
- `enter`
- `enteralt`
- `envelope`
- `equalizer`
- `equalizeralt`
- `equalizerthree`
- `equals`
- `eraser`
- `erroralt`
- `escalator`
- `etano`
- `euro`
- `euroalt`
- `eurosquare`
- `event`
- `eventum`
- `evernote`
- `exclamationsign`
- `excludeshape`
- `exit`
- `exitalt`
- `explorerwindow`
- `export`
- `exportfile`
- `exposure`
- `extinguisher`
- `extjs`
- `eye`
- `eyeclose`
- `eyedropper`
- `eyeopen`
- `eyeos`
- `f`
- `fUpperCase`
- `facebook`
- `facebookalt`
- `facetimevideo`
- `factory`
- `fallingstar`
- `fan`
- `fantastico`
- `faq`
- `fastbackward`
- `fastdown`
- `fastforward`
- `fastleft`
- `fastright`
- `fastup`
- `fatarrowdown`
- `fatarrowleft`
- `fatarrowright`
- `fatarrowup`
- `fatredo`
- `fatundo`
- `favorite`
- `favoritealt`
- `favoritefile`
- `favoritefolder`
- `fbdislike`
- `fblike`
- `featheralt`
- `fedora`
- `feedly`
- `feedlyalt`
- `female`
- `fence`
- `fengoffice`
- `file`
- `filemanager`
- `film`
- `filmstrip`
- `filter`
- `finance`
- `finder`
- `findfriends`
- `firefox`
- `fireplace`
- `firewall`
- `firewire`
- `firstaid`
- `fish`
- `fishbone`
- `flag`
- `flagalt`
- `flagtriangle`
- `flame`
- `flash`
- `flashlight`
- `flashlightalt`
- `flashplayer`
- `flask`
- `flaskfull`
- `flickr`
- `flickralt`
- `flickrthree`
- `flipboard`
- `fliphorizontal`
- `flipvertical`
- `floppy`
- `flowdown`
- `flower`
- `flowernew`
- `flowerpot`
- `flowup`
- `fluxbb`
- `folderalt`
- `folderopen`
- `foldertree`
- `font`
- `fontcaligraphy`
- `fontcase`
- `fontcomic`
- `fontgothic`
- `fonthandwriting`
- `fontrounded`
- `fontsansserif`
- `fontserif`
- `fontstencil`
- `fonttypewriter`
- `foodtray`
- `football`
- `forbidden`
- `forest`
- `forestalt`
- `fork`
- `forkcms`
- `forklift`
- `form`
- `forrst`
- `fort`
- `forumsalt`
- `forward`
- `fountain`
- `fourg`
- `fourimages`
- `fourohfour`
- `foursquare`
- `foursquarealt`
- `freeway`
- `fridge`
- `friends`
- `fries`
- `ftp`
- `ftpaccounts`
- `ftpsession`
- `fuelphp`
- `fullborders`
- `fullscreen`
- `fullstar`
- `fx`
- `g`
- `gUpperCase`
- `galaxy`
- `galaxyalt`
- `gallery`
- `gameboy`
- `gamecursor`
- `garage`
- `gasstation`
- `gavel`
- `gearalt`
- `gearfour`
- `gears`
- `gearsalt`
- `gender`
- `ghost`
- `gift`
- `github`
- `glass`
- `glasses`
- `glassesalt`
- `globe`
- `globealt`
- `glue`
- `gmail`
- `golf`
- `google`
- `googledrive`
- `googleglass`
- `googleplus`
- `googleplusold`
- `googlewallet`
- `gpsalt`
- `gpsoff`
- `gpson`
- `gradient`
- `grails`
- `gramophone`
- `grapes`
- `graphicscard`
- `grave`
- `gravefour`
- `gravethree`
- `gravetwo`
- `greekcolumn`
- `greenhosting`
- `greenlantern`
- `greenlightbulb`
- `grid`
- `grooveshark`
- `guitar`
- `gun`
- `h`
- `hUpperCase`
- `halflife`
- `halfstar`
- `halo`
- `hamburger`
- `hammer`
- `hammeralt`
- `handcuffs`
- `handdown`
- `handdrag`
- `handexpand`
- `handleft`
- `handpinch`
- `handright`
- `handswipe`
- `handtwofingers`
- `handup`
- `hanger`
- `hangout`
- `hangouts`
- `happy`
- `harddisk`
- `harddrivealt`
- `harrypotter`
- `hashtag`
- `hate`
- `hdtv`
- `hdvideo`
- `headphones`
- `headphonesalt`
- `headphonesthree`
- `heart`
- `heartarrow`
- `heartempty`
- `hearts`
- `heartsparkle`
- `heavymetal`
- `helicopter`
- `hexagon`
- `history`
- `hockey`
- `home`
- `homealt`
- `honeycomb`
- `horizontalborder`
- `horizontalcontract`
- `horizontalexpand`
- `hospital`
- `hot`
- `hotdog`
- `hotlinkprotection`
- `hourglass`
- `hourglassalt`
- `house`
- `hryvnia`
- `hryvniaalt`
- `hryvniasquare`
- `html`
- `htmlfile`
- `htmlfive`
- `hydrant`
- `i`
- `iUpperCase`
- `icecream`
- `icecreamalt`
- `icecreamthree`
- `idea`
- `illustrator`
- `imac`
- `image`
- `import`
- `importcontacts`
- `importfile`
- `impresscms`
- `impresspages`
- `inbox`
- `inboxalt`
- `incomingcall`
- `incomingcallalt`
- `indentleft`
- `indentleftalt`
- `indentright`
- `indentrightalt`
- `indexmanager`
- `infinity`
- `infinityalt`
- `infographic`
- `infosign`
- `ingress`
- `ink`
- `inkpen`
- `innerborders`
- `insertbarchart`
- `insertpicture`
- `insertpicturecenter`
- `insertpictureleft`
- `insertpictureright`
- `insertpiechart`
- `instagram`
- `instagramfour`
- `instagramthree`
- `instagramtwo`
- `install`
- `intel`
- `intersection`
- `intersectshape`
- `invert`
- `invoice`
- `ipcontrol`
- `iphone`
- `ipod`
- `ironman`
- `islam`
- `island`
- `issue`
- `issueclosed`
- `issuereopened`
- `italic`
- `j`
- `jUpperCase`
- `jar`
- `jason`
- `java`
- `jcore`
- `jcow`
- `jersey`
- `joomla`
- `joystickarcade`
- `joystickatari`
- `jquery`
- `jqueryui`
- `k`
- `kUpperCase`
- `kerning`
- `key`
- `keyboard`
- `keyboardalt`
- `keyboarddelete`
- `keyhole`
- `kidney`
- `kimai`
- `king`
- `kiss`
- `kiwi`
- `kiwifruit`
- `knife`
- `knight`
- `knob`
- `koala`
- `kohana`
- `l`
- `lUpperCase`
- `lamp`
- `lampalt`
- `lan`
- `language`
- `laptop`
- `lasso`
- `lastfm`
- `laugh`
- `launch`
- `law`
- `layerorder`
- `layerorderdown`
- `layerorderup`
- `layers`
- `layersalt`
- `layersthree`
- `leather`
- `leechprotect`
- `leftborder`
- `legacyfilemanager`
- `lego`
- `lemon`
- `lens`
- `lifeempty`
- `lifefull`
- `lifehacker`
- `lifehalf`
- `lifepreserver`
- `lighthouse`
- `lightning`
- `lightningalt`
- `lightoff`
- `lighton`
- `like`
- `limesurvey`
- `line`
- `lineheight`
- `link`
- `linkalt`
- `linkedin`
- `linux`
- `lips`
- `lipstick`
- `list`
- `listalt`
- `livejournal`
- `livejournalalt`
- `liver`
- `loadingalt`
- `loadingeight`
- `loadingfive`
- `loadingflowccw`
- `loadingflowcw`
- `loadingfour`
- `loadingone`
- `loadingseven`
- `loadingsix`
- `loadingthree`
- `loadingtwo`
- `lock`
- `logprograms`
- `lollypop`
- `lungs`
- `m`
- `mUpperCase`
- `macpro`
- `macro`
- `magazine`
- `magento`
- `magnet`
- `magnifier`
- `mahara`
- `mailbox`
- `mailinglists`
- `male`
- `mambo`
- `managedhosting`
- `manalt`
- `manillaenvelope`
- `mantisbugtracker`
- `manualshift`
- `map`
- `mapmarker`
- `marker`
- `markerdown`
- `markerleft`
- `markerright`
- `markerup`
- `marvin`
- `mastercard`
- `maximize`
- `mayanpyramid`
- `medal`
- `medalbronze`
- `medalgold`
- `medalsilver`
- `mediarepeat`
- `mega`
- `men`
- `menu`
- `merge`
- `mergecells`
- `mergeshapes`
- `mergethree`
- `meteor`
- `meteorite`
- `metro`
- `metronome`
- `mibew`
- `mickeymouse`
- `microphone`
- `microphonealt`
- `microphonethree`
- `microscope`
- `microsd`
- `microsoftoffice`
- `microwave`
- `middlefinger`
- `milk`
- `mimetype`
- `minecraft`
- `minecraftalt`
- `miniangry`
- `minibb`
- `miniconfused`
- `minigrin`
- `minilaugh`
- `minimize`
- `minisad`
- `minismile`
- `minitongue`
- `minitonguealt`
- `minitonguewink`
- `miniwink`
- `minus`
- `minussign`
- `mirror`
- `missedcall`
- `missedcallalt`
- `miui`
- `mobile`
- `modx`
- `modxalt`
- `molecule`
- `moleskine`
- `moneyalt`
- `moneybag`
- `mongodb`
- `monitor`
- `monstersinc`
- `monstra`
- `moon`
- `moonfirstquarter`
- `moonfull`
- `moonnew`
- `moonorbit`
- `moonthirdquarter`
- `moonwaningcrescent`
- `moonwaninggibbous`
- `moonwaxingcrescent`
- `moonwaxinggibbous`
- `mootools`
- `mootoolsthree`
- `mootoolstwo`
- `mosque`
- `mountains`
- `mouse`
- `mousealt`
- `moustache`
- `move`
- `movieclapper`
- `moviereel`
- `moviereelalt`
- `muffin`
- `mug`
- `multiply`
- `mushroom`
- `mushroomcloud`
- `music`
- `musicalt`
- `musicsheet`
- `musicthree`
- `mute`
- `mutealt`
- `mutemic`
- `mxentry`
- `mybb`
- `mymusic`
- `mypictures`
- `myspace`
- `mysqlthree`
- `mysqltwo`
- `myvideos`
- `n`
- `nUpperCase`
- `nail`
- `navigation`
- `neofourj`
- `network`
- `networksignal`
- `networksignalalt`
- `news`
- `newtab`
- `newwindow`
- `next`
- `nexus`
- `nfc`
- `ninegag`
- `nintendods`
- `noborders`
- `nodejs`
- `noflash`
- `nosql`
- `notebook`
- `notes`
- `notesdate`
- `notesdatealt`
- `noteslist`
- `noteslistalt`
- `noteslocation`
- `noteslocationalt`
- `notestasks`
- `notestasksalt`
- `notification`
- `notificationbottom`
- `notificationtop`
- `nuclearplant`
- `nucleus`
- `numberlist`
- `nut`
- `o`
- `oUpperCase`
- `observatory`
- `octoloaderempty`
- `octoloaderfive`
- `octoloaderfour`
- `octoloaderfull`
- `octoloaderone`
- `octoloaderseven`
- `octoloadersix`
- `octoloaderthree`
- `octoloadertwo`
- `off`
- `officechair`
- `okcircle`
- `oksign`
- `oneohseven`
- `oneup`
- `oneupalt`
- `onion`
- `opencart`
- `openclassifieds`
- `openfolderalt`
- `openid`
- `opennewwindow`
- `openshare`
- `opensource`
- `openx`
- `orange`
- `orangehrm`
- `origami`
- `osclass`
- `oscommerce`
- `outbox`
- `outerborders`
- `outgoingcall`
- `outgoingcallalt`
- `oxwall`
- `p`
- `pUpperCase`
- `pacifier`
- `packarchive`
- `pacman`
- `pageback`
- `pagebreak`
- `pagecookery`
- `pageforward`
- `pagesetup`
- `paintbrush`
- `painting`
- `paintroll`
- `paintrollalt`
- `panda`
- `panorama`
- `panoramaalt`
- `panoramio`
- `panties`
- `paperboat`
- `paperclip`
- `paperclipalt`
- `paperclipvertical`
- `papercutter`
- `paperplane`
- `parentheses`
- `parkeddomain`
- `parkingmeter`
- `parthenon`
- `password`
- `passwordalt`
- `pasta`
- `pastealt`
- `patch`
- `path`
- `pattern`
- `pause`
- `paw`
- `pawn`
- `paypal`
- `peace`
- `pear`
- `pebble`
- `pen`
- `pencil`
- `pepperoni`
- `percent`
- `perfume`
- `perlalt`
- `pgsql`
- `phonealt`
- `phonebook`
- `phonebookalt`
- `phonemic`
- `phoneold`
- `phonescreensize`
- `phorum`
- `photobucket`
- `photonineframes`
- `photoshop`
- `photosphere`
- `php`
- `phpbb`
- `phpbbalt`
- `phplist`
- `phpmyfaq`
- `phpnuke`
- `phppear`
- `piano`
- `picasa`
- `pickaxe`
- `pictureframe`
- `piggybank`
- `pigpena`
- `pigpenb`
- `pigpenc`
- `pigpend`
- `pigpene`
- `pigpenf`
- `pigpeng`
- `pigpenh`
- `pigpeni`
- `pigpenj`
- `pigpenk`
- `pigpenl`
- `pigpenm`
- `pigpenn`
- `pigpeno`
- `pigpenp`
- `pigpenq`
- `pigpenr`
- `pigpens`
- `pigpent`
- `pigpenu`
- `pigpenv`
- `pigpenw`
- `pigpenx`
- `pigpeny`
- `pigpenz`
- `pilcrow`
- `pimcore`
- `pin`
- `pingpong`
- `pinterest`
- `pipe`
- `pivotx`
- `piwigo`
- `pixelarrow`
- `pixelaxe`
- `pixelbastardsword`
- `pixelbattleaxe`
- `pixelbow`
- `pixelbroadsword`
- `pixelchest`
- `pixeldagger`
- `pixelelixir`
- `pixelheart`
- `pixellance`
- `pixelpickaxe`
- `pixelpotion`
- `pixelpotionalt`
- `pixelshield`
- `pixelshovel`
- `pixelsphere`
- `pixelsword`
- `pixelwand`
- `pixie`
- `pizza`
- `placeadd`
- `placealt`
- `placealtadd`
- `placealtdelete`
- `placedelete`
- `placeios`
- `plane`
- `planealt`
- `planet`
- `plantalt`
- `plaque`
- `play`
- `playcircle`
- `playstation`
- `playstore`
- `playvideo`
- `pligg`
- `plogger`
- `plug`
- `plugin`
- `pluginalt`
- `plumbing`
- `plus`
- `pluscircles`
- `plusgames`
- `pluspages`
- `plussign`
- `pocket`
- `podcast`
- `podium`
- `pokemon`
- `polaroid`
- `police`
- `polygonlasso`
- `pommo`
- `poop`
- `poopalt`
- `popcorn`
- `portrait`
- `post`
- `postalt`
- `pound`
- `poundalt`
- `poundsquare`
- `powerjack`
- `powerplug`
- `powerplugeu`
- `powerplugus`
- `precisecursor`
- `presentation`
- `prestashop`
- `pretzel`
- `preview`
- `previous`
- `price`
- `pricealt`
- `print`
- `profile`
- `programclose`
- `programok`
- `projectcompare`
- `projectfork`
- `projectforkdelete`
- `projectforkprivate`
- `projectmerge`
- `projector`
- `projectpier`
- `projectsend`
- `protecteddirectory`
- `pscircle`
- `pscursor`
- `psdown`
- `psleft`
- `pslone`
- `psltwo`
- `psright`
- `psrone`
- `psrtwo`
- `pssquare`
- `pstriangle`
- `psup`
- `psx`
- `pull`
- `pullalt`
- `pullrequest`
- `pumpjack`
- `punbb`
- `punisher`
- `purse`
- `push`
- `pushalt`
- `pushbullet`
- `pyrocms`
- `python`
- `q`
- `qUpperCase`
- `qrcode`
- `quake`
- `queen`
- `query`
- `questionsign`
- `quora`
- `quote`
- `quotedown`
- `quoteup`
- `r`
- `rUpperCase`
- `rabbit`
- `raceflag`
- `racquet`
- `radar`
- `radio`
- `radioactive`
- `radiobutton`
- `railroad`
- `railtunnel`
- `rain`
- `ram`
- `random`
- `raphael`
- `rar`
- `raspberry`
- `raspberrypi`
- `rawaccesslogs`
- `razor`
- `rdio`
- `reademail`
- `reademailalt`
- `record`
- `rectangle`
- `rectangleselection`
- `recycle`
- `redaxscript`
- `reddit`
- `redirect`
- `refresh`
- `refreshalt`
- `reliability`
- `remote`
- `remotemysql`
- `removecircle`
- `removefolderalt`
- `removefriend`
- `removesign`
- `removetags`
- `removeuseralt`
- `repeat`
- `repeatone`
- `report`
- `resellerhosting`
- `residentevil`
- `resistor`
- `resize`
- `resizedownleft`
- `resizedownright`
- `resizefull`
- `resizehorizontal`
- `resizehorizontalalt`
- `resizesmall`
- `resizeupleft`
- `resizeupright`
- `resizevertical`
- `resizeverticalalt`
- `restart`
- `restaurantmenu`
- `restore`
- `restricted`
- `retweet`
- `rightborder`
- `rim`
- `ring`
- `road`
- `roadsignleft`
- `roadsignright`
- `roadtunnel`
- `robocop`
- `rook`
- `root`
- `rorschach`
- `rotateclockwise`
- `rotatecounterclockwise`
- `rouble`
- `roublealt`
- `roublesquare`
- `roundcube`
- `roundrectangle`
- `route`
- `router`
- `routeralt`
- `rss`
- `rubberstamp`
- `ruby`
- `rubyalt`
- `rudder`
- `ruler`
- `s`
- `sUpperCase`
- `sad`
- `safetygoggles`
- `safetypin`
- `sale`
- `salealt`
- `satellite`
- `saurus`
- `savetodrive`
- `scales`
- `scissorsalt`
- `scope`
- `scopealt`
- `screenshot`
- `screw`
- `screwdriver`
- `screwdriveralt`
- `script`
- `scriptalt`
- `sd`
- `sdvideo`
- `sea`
- `seaalt`
- `searchdocument`
- `searchfolder`
- `security`
- `securityalt`
- `selectionadd`
- `selectionintersect`
- `selectionremove`
- `selectionsymbol`
- `sendbackward`
- `sendtoback`
- `seo`
- `server`
- `servers`
- `settingsandroid`
- `sextant`
- `shapes`
- `share`
- `sharealt`
- `sharedfile`
- `sharedhosting`
- `sharethree`
- `sharetronix`
- `sharetwo`
- `sheep`
- `shell`
- `sheriff`
- `shipping`
- `shirtbutton`
- `shirtbuttonalt`
- `shirtbuttonthree`
- `shoebox`
- `shopping`
- `shoppingbag`
- `shoppingcart`
- `shoppingcartalt`
- `shortcut`
- `shovel`
- `shredder`
- `shutdown`
- `shuttle`
- `sidebar`
- `sidu`
- `signal`
- `silverstripe`
- `sim`
- `simalt`
- `simcardthree`
- `simplepie`
- `sixteentonine`
- `sizzle`
- `skitch`
- `skrill`
- `skull`
- `skype`
- `skypeaway`
- `skypebusy`
- `skypeoffline`
- `skypeonline`
- `sleep`
- `sliderasc`
- `slideronefull`
- `slidersdesc`
- `slidersfull`
- `slidersmiddle`
- `slidersoff`
- `sliderthreefull`
- `slidertwofull`
- `smaller`
- `smarty`
- `smf`
- `smile`
- `snaptodot`
- `snaptogrid`
- `snews`
- `snooze`
- `snow`
- `snowman`
- `socialnetwork`
- `sodacup`
- `software`
- `solarpanel`
- `solarsystem`
- `sortbynameascending`
- `sortbysizeascending`
- `sortbysizedescending`
- `soundcloud`
- `soundleft`
- `soundright`
- `soundwave`
- `soup`
- `spaceinvaders`
- `spades`
- `spam`
- `spamalt`
- `spawn`
- `speaker`
- `speakeralt`
- `speed`
- `speedalt`
- `sphere`
- `spider`
- `spiderman`
- `spiderweb`
- `split`
- `splitalt`
- `splitthree`
- `spock`
- `spoon`
- `spotify`
- `spray`
- `spreadsheet`
- `sputnik`
- `squarea`
- `squareapp`
- `squareb`
- `squareback`
- `squarebookmark`
- `squarebrackets`
- `squarec`
- `squarecomment`
- `squared`
- `squaredribbble`
- `squaree`
- `squareeight`
- `squaref`
- `squarefive`
- `squareforward`
- `squarefour`
- `squareg`
- `squaregithub`
- `squareh`
- `squareheart`
- `squarei`
- `squarej`
- `squarek`
- `squarel`
- `squarelike`
- `squarem`
- `squaren`
- `squarenext`
- `squarenine`
- `squareo`
- `squareone`
- `squarep`
- `squarepause`
- `squareplay`
- `squareprevious`
- `squareq`
- `squarequora`
- `squarer`
- `squarerecord`
- `squares`
- `squaresearch`
- `squaresettings`
- `squareseven`
- `squaresix`
- `squarestar`
- `squarestop`
- `squaret`
- `squarethree`
- `squaretwitter`
- `squaretwo`
- `squareu`
- `squarev`
- `squareviber`
- `squarevimeo`
- `squarevoice`
- `squarew`
- `squarex`
- `squarey`
- `squarez`
- `squarezero`
- `squarezerply`
- `ssh`
- `sslmanager`
- `stacks`
- `stadium`
- `stairsdown`
- `stairsup`
- `stamp`
- `stampalt`
- `statistics`
- `steak`
- `steam`
- `stepbackward`
- `stepforward`
- `sticker`
- `stickynote`
- `stickynotealt`
- `stiletto`
- `stockdown`
- `stocks`
- `stockup`
- `stomach`
- `stop`
- `stopwatch`
- `store`
- `storm`
- `stove`
- `strawberry`
- `strikethrough`
- `stroller`
- `student`
- `stumbleupon`
- `style`
- `subdomain`
- `submarine`
- `subrion`
- `subscript`
- `subtitles`
- `subtitlesoff`
- `subtractshape`
- `sum`
- `sunglasses`
- `sunnysideup`
- `sunrise`
- `sunset`
- `superman`
- `superscript`
- `support`
- `supportalt`
- `survey`
- `swipedown`
- `swipeup`
- `switch`
- `switchoff`
- `switchoffalt`
- `switchon`
- `switchonalt`
- `sword`
- `symphony`
- `sync`
- `syncalt`
- `synckeeplocal`
- `synckeepserver`
- `systemfolder`
- `t`
- `tUpperCase`
- `tablet`
- `tabletscreensize`
- `taco`
- `tagged`
- `tags`
- `tagvertical`
- `tallglass`
- `tampermonkey`
- `tank`
- `target`
- `taskfreak`
- `tasks`
- `taxi`
- `tea`
- `teamviewer`
- `teapot`
- `technorati`
- `tectile`
- `teddybear`
- `telescope`
- `temperature`
- `temple`
- `tennis`
- `terminal`
- `terminalalt`
- `tethering`
- `tetrisone`
- `tetristhree`
- `tetristwo`
- `textcursor`
- `textfield`
- `textheight`
- `textlayer`
- `texture`
- `textwidth`
- `theather`
- `thermometeralt`
- `theverge`
- `thinking`
- `thissideup`
- `thlarge`
- `thlist`
- `threecolumns`
- `threed`
- `threeg`
- `threetofour`
- `ticket`
- `tictactoe`
- `tidefall`
- `tiderise`
- `tikiwiki`
- `timeline`
- `timer`
- `tint`
- `toast`
- `toiletbrush`
- `tomatocart`
- `tools`
- `tooth`
- `toothbrush`
- `topborder`
- `tophat`
- `torch`
- `torigate`
- `tornado`
- `touchpad`
- `trafficlight`
- `tragedy`
- `trailor`
- `train`
- `transform`
- `traq`
- `trashempty`
- `trashfull`
- `travel`
- `treediagram`
- `treeornament`
- `treethree`
- `triangle`
- `trojan`
- `trolleyempty`
- `trolleyfull`
- `trolleyload`
- `trolleyunload`
- `tron`
- `trophy`
- `truck`
- `trumpet`
- `tshirt`
- `tumblr`
- `tunein`
- `tuneinalt`
- `turnip`
- `turnleft`
- `turnoffalarm`
- `turnright`
- `tv`
- `twitter`
- `twocolumnsleft`
- `twocolumnsleftalt`
- `twocolumnsright`
- `twocolumnsrightalt`
- `twofingerswipedown`
- `twofingerswipeup`
- `twog`
- `typothree`
- `u`
- `uUpperCase`
- `ubuntu`
- `umbrella`
- `underline`
- `undo`
- `unlock`
- `unpackarchive`
- `upleft`
- `upload`
- `uploadalt`
- `upright`
- `uptime`
- `usb`
- `usbalt`
- `usbflash`
- `usbplug`
- `useralt`
- `userfilter`
- `usfootball`
- `v`
- `vUpperCase`
- `vanillacms`
- `vaultthree`
- `vector`
- `vectoralt`
- `vendetta`
- `versions`
- `verticalborder`
- `vial`
- `viber`
- `video`
- `videocamerathree`
- `viking`
- `vimeo`
- `vineapp`
- `vineappalt`
- `vinyl`
- `violin`
- `virus`
- `visa`
- `visitor`
- `vk`
- `voice`
- `voltage`
- `volumedown`
- `volumeup`
- `vps`
- `vtiger`
- `w`
- `wUpperCase`
- `wacom`
- `walle`
- `wallet`
- `walletalt`
- `warcraft`
- `warmedal`
- `warmedalalt`
- `warningsign`
- `washer`
- `watch`
- `watermelon`
- `webcam`
- `webcamalt`
- `webhostinghub`
- `webinsta`
- `webmail`
- `webpage`
- `webplatform`
- `website`
- `websitebuilder`
- `weight`
- `weightscale`
- `westernunion`
- `wetfloor`
- `whatsapp`
- `whatsappalt`
- `wheel`
- `wheelchair`
- `whistle`
- `whmcs`
- `wifi`
- `wind`
- `windleft`
- `windmill`
- `windmillalt`
- `windows`
- `windowseight`
- `windright`
- `wine`
- `wineglass`
- `wizard`
- `wizardalt`
- `wizardhat`
- `womanalt`
- `women`
- `wordpress`
- `workshirt`
- `world`
- `wrench`
- `wrenchalt`
- `wwf`
- `x`
- `xUpperCase`
- `xbox`
- `xmen`
- `xoops`
- `y`
- `yUpperCase`
- `yahoo`
- `yelp`
- `yen`
- `yenalt`
- `yensquare`
- `yiiframework`
- `yinyang`
- `youtube`
- `yui`
- `z`
- `zUpperCase`
- `zelda`
- `zencart`
- `zendframework`
- `zenphoto`
- `zerply`
- `zikula`
- `zip`
- `zodiacaquarius`
- `zodiacaries`
- `zodiaccancer`
- `zodiaccapricorn`
- `zodiacgemini`
- `zodiacleo`
- `zodiaclibra`
- `zodiacpisces`
- `zodiacsagitarius`
- `zodiacscorpio`
- `zodiactaurus`
- `zodiacvirgo`
- `zoomin`
- `zoomout`
- `zurmo`

## Usage Examples

### Navigation Menu

```html
@js
  import { 0Icon, 1Icon, 2Icon, 3Icon } from '@stacksjs/iconify-whh'

  global.navIcons = {
    home: 0Icon({ size: 20, class: 'nav-icon' }),
    about: 1Icon({ size: 20, class: 'nav-icon' }),
    contact: 2Icon({ size: 20, class: 'nav-icon' }),
    settings: 3Icon({ size: 20, class: 'nav-icon' })
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
import { 0Icon } from '@stacksjs/iconify-whh'

const icon = 0Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 0Icon, 1Icon, 2Icon } from '@stacksjs/iconify-whh'

const successIcon = 0Icon({ size: 16, color: '#22c55e' })
const warningIcon = 1Icon({ size: 16, color: '#f59e0b' })
const errorIcon = 2Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 0Icon, 1Icon } from '@stacksjs/iconify-whh'
   const icon = 0Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { 0, 1 } from '@stacksjs/iconify-whh'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(0, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 0Icon, 1Icon } from '@stacksjs/iconify-whh'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-whh'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0Icon } from '@stacksjs/iconify-whh'
     global.icon = 0Icon({ size: 24 })
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
   const icon = 0Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0 } from '@stacksjs/iconify-whh'

// Icons are typed as IconData
const myIcon: IconData = 0
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: WebHostingHub
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/whh/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/whh/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
