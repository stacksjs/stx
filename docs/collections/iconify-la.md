# Line Awesome

> Line Awesome icons for stx from Iconify

## Overview

This package provides access to 1544 icons from the Line Awesome collection through the stx iconify integration.

**Collection ID:** `la`
**Total Icons:** 1544
**Author:** Icons8 ([Website](https://github.com/icons8/line-awesome))
**License:** Apache 2.0 ([Details](https://www.apache.org/licenses/LICENSE-2.0))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-la
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<500pxIcon size="24" />
<500pxIcon size="1em" />

<!-- Using width and height -->
<500pxIcon width="24" height="32" />

<!-- With color -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<500pxIcon size="24" class="icon-primary" />

<!-- With all properties -->
<500pxIcon
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
    <500pxIcon size="24" />
    <AccessibleIconIcon size="24" color="#4a90e2" />
    <AccusoftIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 500px, accessibleIcon, accusoft } from '@stacksjs/iconify-la'
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

```html
<!-- Via color property -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<500pxIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<500pxIcon size="24" class="text-primary" />
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
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<500pxIcon size="24" />
<500pxIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.la-icon {
  width: 1em;
  height: 1em;
}
```

```html
<500pxIcon class="la-icon" />
```

## Available Icons

This package contains **1544** icons:

- `500px`
- `accessibleIcon`
- `accusoft`
- `acquisitionsIncorporated`
- `ad`
- `addressBook`
- `addressBookSolid`
- `addressCard`
- `addressCardSolid`
- `adjust`
- `adn`
- `adobe`
- `adversal`
- `affiliatetheme`
- `airFreshener`
- `airbnb`
- `algolia`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `alipay`
- `allergies`
- `amazon`
- `amazonPay`
- `ambulance`
- `americanSignLanguageInterpreting`
- `amilia`
- `anchor`
- `android`
- `angellist`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `angry`
- `angrySolid`
- `angrycreative`
- `angular`
- `ankh`
- `appStore`
- `appStoreIos`
- `apper`
- `apple`
- `appleAlt`
- `applePay`
- `archive`
- `archway`
- `arrowAltCircleDown`
- `arrowAltCircleDownSolid`
- `arrowAltCircleLeft`
- `arrowAltCircleLeftSolid`
- `arrowAltCircleRight`
- `arrowAltCircleRightSolid`
- `arrowAltCircleUp`
- `arrowAltCircleUpSolid`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `arrowsAlt`
- `arrowsAltH`
- `arrowsAltV`
- `artstation`
- `assistiveListeningSystems`
- `asterisk`
- `asymmetrik`
- `at`
- `atlas`
- `atlassian`
- `atom`
- `audible`
- `audioDescription`
- `autoprefixer`
- `avianex`
- `aviato`
- `award`
- `aws`
- `baby`
- `babyCarriage`
- `backspace`
- `backward`
- `bacon`
- `balanceScale`
- `balanceScaleLeft`
- `balanceScaleRight`
- `ban`
- `bandAid`
- `bandcamp`
- `barcode`
- `bars`
- `baseballBall`
- `basketballBall`
- `bath`
- `batteryEmpty`
- `batteryFull`
- `batteryHalf`
- `batteryQuarter`
- `batteryThreeQuarters`
- `battleNet`
- `bed`
- `beer`
- `behance`
- `behanceSquare`
- `bell`
- `bellSlash`
- `bellSlashSolid`
- `bellSolid`
- `bezierCurve`
- `bible`
- `bicycle`
- `biking`
- `bimobject`
- `binoculars`
- `biohazard`
- `birthdayCake`
- `bitbucket`
- `bitcoin`
- `bity`
- `blackTie`
- `blackberry`
- `blender`
- `blenderPhone`
- `blind`
- `blog`
- `blogger`
- `bloggerB`
- `bluetooth`
- `bluetoothB`
- `bold`
- `bolt`
- `bomb`
- `bone`
- `bong`
- `book`
- `bookDead`
- `bookMedical`
- `bookOpen`
- `bookReader`
- `bookmark`
- `bookmarkSolid`
- `bootstrap`
- `borderAll`
- `borderNone`
- `borderStyle`
- `bowlingBall`
- `box`
- `boxOpen`
- `boxes`
- `braille`
- `brain`
- `breadSlice`
- `briefcase`
- `briefcaseMedical`
- `broadcastTower`
- `broom`
- `brush`
- `btc`
- `buffer`
- `bug`
- `building`
- `buildingSolid`
- `bullhorn`
- `bullseye`
- `burn`
- `buromobelexperte`
- `bus`
- `busAlt`
- `businessTime`
- `buyNLarge`
- `buysellads`
- `calculator`
- `calendar`
- `calendarAlt`
- `calendarAltSolid`
- `calendarCheck`
- `calendarCheckSolid`
- `calendarDay`
- `calendarMinus`
- `calendarMinusSolid`
- `calendarPlus`
- `calendarPlusSolid`
- `calendarSolid`
- `calendarTimes`
- `calendarTimesSolid`
- `calendarWeek`
- `camera`
- `cameraRetro`
- `campground`
- `canadianMapleLeaf`
- `candyCane`
- `cannabis`
- `capsules`
- `car`
- `carAlt`
- `carBattery`
- `carCrash`
- `carSide`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretSquareDown`
- `caretSquareDownSolid`
- `caretSquareLeft`
- `caretSquareLeftSolid`
- `caretSquareRight`
- `caretSquareRightSolid`
- `caretSquareUp`
- `caretSquareUpSolid`
- `caretUp`
- `carrot`
- `cartArrowDown`
- `cartPlus`
- `cashRegister`
- `cat`
- `ccAmazonPay`
- `ccAmex`
- `ccApplePay`
- `ccDinersClub`
- `ccDiscover`
- `ccJcb`
- `ccMastercard`
- `ccPaypal`
- `ccStripe`
- `ccVisa`
- `centercode`
- `centos`
- `certificate`
- `chair`
- `chalkboard`
- `chalkboardTeacher`
- `chargingStation`
- `chartArea`
- `chartBar`
- `chartBarSolid`
- `chartLine`
- `chartPie`
- `check`
- `checkCircle`
- `checkCircleSolid`
- `checkDouble`
- `checkSquare`
- `checkSquareSolid`
- `cheese`
- `chess`
- `chessBishop`
- `chessBoard`
- `chessKing`
- `chessKnight`
- `chessPawn`
- `chessQueen`
- `chessRook`
- `chevronCircleDown`
- `chevronCircleLeft`
- `chevronCircleRight`
- `chevronCircleUp`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `child`
- `chrome`
- `chromecast`
- `church`
- `circle`
- `circleNotch`
- `circleSolid`
- `city`
- `clinicMedical`
- `clipboard`
- `clipboardCheck`
- `clipboardList`
- `clipboardSolid`
- `clock`
- `clockSolid`
- `clone`
- `cloneSolid`
- `closedCaptioning`
- `closedCaptioningSolid`
- `cloud`
- `cloudDownloadAlt`
- `cloudMeatball`
- `cloudMoon`
- `cloudMoonRain`
- `cloudRain`
- `cloudShowersHeavy`
- `cloudSun`
- `cloudSunRain`
- `cloudUploadAlt`
- `cloudscale`
- `cloudsmith`
- `cloudversify`
- `cocktail`
- `code`
- `codeBranch`
- `codepen`
- `codiepie`
- `coffee`
- `cog`
- `cogs`
- `coins`
- `columns`
- `comment`
- `commentAlt`
- `commentAltSolid`
- `commentDollar`
- `commentDots`
- `commentDotsSolid`
- `commentMedical`
- `commentSlash`
- `commentSolid`
- `comments`
- `commentsDollar`
- `commentsSolid`
- `compactDisc`
- `compass`
- `compassSolid`
- `compress`
- `compressArrowsAlt`
- `conciergeBell`
- `confluence`
- `connectdevelop`
- `contao`
- `cookie`
- `cookieBite`
- `copy`
- `copySolid`
- `copyright`
- `copyrightSolid`
- `cottonBureau`
- `couch`
- `cpanel`
- `creativeCommons`
- `creativeCommonsBy`
- `creativeCommonsNc`
- `creativeCommonsNcEu`
- `creativeCommonsNcJp`
- `creativeCommonsNd`
- `creativeCommonsPd`
- `creativeCommonsPdAlt`
- `creativeCommonsRemix`
- `creativeCommonsSa`
- `creativeCommonsSampling`
- `creativeCommonsSamplingPlus`
- `creativeCommonsShare`
- `creativeCommonsZero`
- `creditCard`
- `creditCardSolid`
- `criticalRole`
- `crop`
- `cropAlt`
- `cross`
- `crosshairs`
- `crow`
- `crown`
- `crutch`
- `css3`
- `css3Alt`
- `cube`
- `cubes`
- `cut`
- `cuttlefish`
- `dAndD`
- `dAndDBeyond`
- `dashcube`
- `database`
- `deaf`
- `delicious`
- `democrat`
- `deploydog`
- `deskpro`
- `desktop`
- `dev`
- `deviantart`
- `dharmachakra`
- `dhl`
- `diagnoses`
- `diaspora`
- `dice`
- `diceD20`
- `diceD6`
- `diceFive`
- `diceFour`
- `diceOne`
- `diceSix`
- `diceThree`
- `diceTwo`
- `digg`
- `digitalOcean`
- `digitalTachograph`
- `directions`
- `discord`
- `discourse`
- `divide`
- `dizzy`
- `dizzySolid`
- `dna`
- `dochub`
- `docker`
- `dog`
- `dollarSign`
- `dolly`
- `dollyFlatbed`
- `donate`
- `doorClosed`
- `doorOpen`
- `dotCircle`
- `dotCircleSolid`
- `dove`
- `download`
- `draft2digital`
- `draftingCompass`
- `dragon`
- `drawPolygon`
- `dribbble`
- `dribbbleSquare`
- `dropbox`
- `drum`
- `drumSteelpan`
- `drumstickBite`
- `drupal`
- `dumbbell`
- `dumpster`
- `dumpsterFire`
- `dungeon`
- `dyalog`
- `earlybirds`
- `ebay`
- `edge`
- `edit`
- `editSolid`
- `egg`
- `eject`
- `elementor`
- `ellipsisH`
- `ellipsisV`
- `ello`
- `ember`
- `empire`
- `envelope`
- `envelopeOpen`
- `envelopeOpenSolid`
- `envelopeOpenText`
- `envelopeSolid`
- `envelopeSquare`
- `envira`
- `equals`
- `eraser`
- `erlang`
- `ethereum`
- `ethernet`
- `etsy`
- `euroSign`
- `evernote`
- `exchangeAlt`
- `exclamation`
- `exclamationCircle`
- `exclamationTriangle`
- `expand`
- `expandArrowsAlt`
- `expeditedssl`
- `externalLinkAlt`
- `externalLinkSquareAlt`
- `eye`
- `eyeDropper`
- `eyeSlash`
- `eyeSlashSolid`
- `eyeSolid`
- `facebook`
- `facebookF`
- `facebookMessenger`
- `facebookSquare`
- `fan`
- `fantasyFlightGames`
- `fastBackward`
- `fastForward`
- `fax`
- `feather`
- `featherAlt`
- `fedex`
- `fedora`
- `female`
- `fighterJet`
- `figma`
- `file`
- `fileAlt`
- `fileAltSolid`
- `fileArchive`
- `fileArchiveSolid`
- `fileAudio`
- `fileAudioSolid`
- `fileCode`
- `fileCodeSolid`
- `fileContract`
- `fileCsv`
- `fileDownload`
- `fileExcel`
- `fileExcelSolid`
- `fileExport`
- `fileImage`
- `fileImageSolid`
- `fileImport`
- `fileInvoice`
- `fileInvoiceDollar`
- `fileMedical`
- `fileMedicalAlt`
- `filePdf`
- `filePdfSolid`
- `filePowerpoint`
- `filePowerpointSolid`
- `filePrescription`
- `fileSignature`
- `fileSolid`
- `fileUpload`
- `fileVideo`
- `fileVideoSolid`
- `fileWord`
- `fileWordSolid`
- `fill`
- `fillDrip`
- `film`
- `filter`
- `fingerprint`
- `fire`
- `fireAlt`
- `fireExtinguisher`
- `firefox`
- `firstAid`
- `firstOrder`
- `firstOrderAlt`
- `firstdraft`
- `fish`
- `fistRaised`
- `flag`
- `flagCheckered`
- `flagSolid`
- `flagUsa`
- `flask`
- `flickr`
- `flipboard`
- `flushed`
- `flushedSolid`
- `fly`
- `folder`
- `folderMinus`
- `folderOpen`
- `folderOpenSolid`
- `folderPlus`
- `folderSolid`
- `font`
- `fontAwesome`
- `fontAwesomeAlt`
- `fontAwesomeFlag`
- `fonticons`
- `fonticonsFi`
- `footballBall`
- `fortAwesome`
- `fortAwesomeAlt`
- `forumbee`
- `forward`
- `foursquare`
- `freeCodeCamp`
- `freebsd`
- `frog`
- `frown`
- `frownOpen`
- `frownOpenSolid`
- `frownSolid`
- `fulcrum`
- `funnelDollar`
- `futbol`
- `futbolSolid`
- `galacticRepublic`
- `galacticSenate`
- `gamepad`
- `gasPump`
- `gavel`
- `gem`
- `gemSolid`
- `genderless`
- `getPocket`
- `gg`
- `ggCircle`
- `ghost`
- `gift`
- `gifts`
- `git`
- `gitAlt`
- `gitSquare`
- `github`
- `githubAlt`
- `githubSquare`
- `gitkraken`
- `gitlab`
- `gitter`
- `glassCheers`
- `glassMartini`
- `glassMartiniAlt`
- `glassWhiskey`
- `glasses`
- `glide`
- `glideG`
- `globe`
- `globeAfrica`
- `globeAmericas`
- `globeAsia`
- `globeEurope`
- `gofore`
- `golfBall`
- `goodreads`
- `goodreadsG`
- `google`
- `googleDrive`
- `googlePlay`
- `googlePlus`
- `googlePlusG`
- `googlePlusSquare`
- `googleWallet`
- `gopuram`
- `graduationCap`
- `gratipay`
- `grav`
- `greaterThan`
- `greaterThanEqual`
- `grimace`
- `grimaceSolid`
- `grin`
- `grinAlt`
- `grinAltSolid`
- `grinBeam`
- `grinBeamSolid`
- `grinBeamSweat`
- `grinBeamSweatSolid`
- `grinHearts`
- `grinHeartsSolid`
- `grinSolid`
- `grinSquint`
- `grinSquintSolid`
- `grinSquintTears`
- `grinSquintTearsSolid`
- `grinStars`
- `grinStarsSolid`
- `grinTears`
- `grinTearsSolid`
- `grinTongue`
- `grinTongueSolid`
- `grinTongueSquint`
- `grinTongueSquintSolid`
- `grinTongueWink`
- `grinTongueWinkSolid`
- `grinWink`
- `grinWinkSolid`
- `gripHorizontal`
- `gripLines`
- `gripLinesVertical`
- `gripVertical`
- `gripfire`
- `grunt`
- `guitar`
- `gulp`
- `hSquare`
- `hackerNews`
- `hackerNewsSquare`
- `hackerrank`
- `hamburger`
- `hammer`
- `hamsa`
- `handHolding`
- `handHoldingHeart`
- `handHoldingUsd`
- `handLizard`
- `handLizardSolid`
- `handMiddleFinger`
- `handPaper`
- `handPaperSolid`
- `handPeace`
- `handPeaceSolid`
- `handPointDown`
- `handPointDownSolid`
- `handPointLeft`
- `handPointLeftSolid`
- `handPointRight`
- `handPointRightSolid`
- `handPointUp`
- `handPointUpSolid`
- `handPointer`
- `handPointerSolid`
- `handRock`
- `handRockSolid`
- `handScissors`
- `handScissorsSolid`
- `handSpock`
- `handSpockSolid`
- `hands`
- `handsHelping`
- `handshake`
- `handshakeSolid`
- `hanukiah`
- `hardHat`
- `hashtag`
- `hatCowboy`
- `hatCowboySide`
- `hatWizard`
- `haykal`
- `hdd`
- `hddSolid`
- `heading`
- `headphones`
- `headphonesAlt`
- `headset`
- `heart`
- `heartBroken`
- `heartSolid`
- `heartbeat`
- `helicopter`
- `highlighter`
- `hiking`
- `hippo`
- `hips`
- `hireAHelper`
- `history`
- `hockeyPuck`
- `hollyBerry`
- `home`
- `hooli`
- `hornbill`
- `horse`
- `horseHead`
- `hospital`
- `hospitalAlt`
- `hospitalSolid`
- `hospitalSymbol`
- `hotTub`
- `hotdog`
- `hotel`
- `hotjar`
- `hourglass`
- `hourglassEnd`
- `hourglassHalf`
- `hourglassSolid`
- `hourglassStart`
- `houseDamage`
- `houzz`
- `hryvnia`
- `html5`
- `hubspot`
- `iCursor`
- `iceCream`
- `icicles`
- `icons`
- `idBadge`
- `idBadgeSolid`
- `idCard`
- `idCardAlt`
- `idCardSolid`
- `igloo`
- `image`
- `imageSolid`
- `images`
- `imagesSolid`
- `imdb`
- `inbox`
- `indent`
- `industry`
- `infinity`
- `info`
- `infoCircle`
- `instagram`
- `intercom`
- `internetExplorer`
- `invision`
- `ioxhost`
- `italic`
- `itchIo`
- `itunes`
- `itunesNote`
- `java`
- `jedi`
- `jediOrder`
- `jenkins`
- `jira`
- `joget`
- `joint`
- `joomla`
- `journalWhills`
- `js`
- `jsSquare`
- `jsfiddle`
- `kaaba`
- `kaggle`
- `key`
- `keybase`
- `keyboard`
- `keyboardSolid`
- `keycdn`
- `khanda`
- `kickstarter`
- `kickstarterK`
- `kiss`
- `kissBeam`
- `kissBeamSolid`
- `kissSolid`
- `kissWinkHeart`
- `kissWinkHeartSolid`
- `kiwiBird`
- `korvue`
- `landmark`
- `language`
- `laptop`
- `laptopCode`
- `laptopMedical`
- `laravel`
- `lastfm`
- `lastfmSquare`
- `laugh`
- `laughBeam`
- `laughBeamSolid`
- `laughSolid`
- `laughSquint`
- `laughSquintSolid`
- `laughWink`
- `laughWinkSolid`
- `layerGroup`
- `leaf`
- `leanpub`
- `lemon`
- `lemonSolid`
- `less`
- `lessThan`
- `lessThanEqual`
- `levelDownAlt`
- `levelUpAlt`
- `lifeRing`
- `lifeRingSolid`
- `lightbulb`
- `lightbulbSolid`
- `line`
- `link`
- `linkedin`
- `linkedinIn`
- `linode`
- `linux`
- `liraSign`
- `list`
- `listAlt`
- `listAltSolid`
- `listOl`
- `listUl`
- `locationArrow`
- `lock`
- `lockOpen`
- `longArrowAltDown`
- `longArrowAltLeft`
- `longArrowAltRight`
- `longArrowAltUp`
- `lowVision`
- `luggageCart`
- `lyft`
- `magento`
- `magic`
- `magnet`
- `mailBulk`
- `mailchimp`
- `male`
- `mandalorian`
- `map`
- `mapMarked`
- `mapMarkedAlt`
- `mapMarker`
- `mapMarkerAlt`
- `mapPin`
- `mapSigns`
- `mapSolid`
- `markdown`
- `marker`
- `mars`
- `marsDouble`
- `marsStroke`
- `marsStrokeH`
- `marsStrokeV`
- `mask`
- `mastodon`
- `maxcdn`
- `mdb`
- `medal`
- `medapps`
- `medium`
- `mediumM`
- `medkit`
- `medrt`
- `meetup`
- `megaport`
- `meh`
- `mehBlank`
- `mehBlankSolid`
- `mehRollingEyes`
- `mehRollingEyesSolid`
- `mehSolid`
- `memory`
- `mendeley`
- `menorah`
- `mercury`
- `meteor`
- `microchip`
- `microphone`
- `microphoneAlt`
- `microphoneAltSlash`
- `microphoneSlash`
- `microscope`
- `microsoft`
- `minus`
- `minusCircle`
- `minusSquare`
- `minusSquareSolid`
- `mitten`
- `mix`
- `mixcloud`
- `mizuni`
- `mobile`
- `mobileAlt`
- `modx`
- `monero`
- `moneyBill`
- `moneyBillAlt`
- `moneyBillAltSolid`
- `moneyBillWave`
- `moneyBillWaveAlt`
- `moneyCheck`
- `moneyCheckAlt`
- `monument`
- `moon`
- `moonSolid`
- `mortarPestle`
- `mosque`
- `motorcycle`
- `mountain`
- `mouse`
- `mousePointer`
- `mugHot`
- `music`
- `napster`
- `neos`
- `networkWired`
- `neuter`
- `newspaper`
- `newspaperSolid`
- `nimblr`
- `node`
- `nodeJs`
- `notEqual`
- `notesMedical`
- `npm`
- `ns8`
- `nutritionix`
- `objectGroup`
- `objectGroupSolid`
- `objectUngroup`
- `objectUngroupSolid`
- `odnoklassniki`
- `odnoklassnikiSquare`
- `oilCan`
- `oldRepublic`
- `om`
- `opencart`
- `openid`
- `opera`
- `optinMonster`
- `orcid`
- `osi`
- `otter`
- `outdent`
- `page4`
- `pagelines`
- `pager`
- `paintBrush`
- `paintRoller`
- `palette`
- `palfed`
- `pallet`
- `paperPlane`
- `paperPlaneSolid`
- `paperclip`
- `parachuteBox`
- `paragraph`
- `parking`
- `passport`
- `pastafarianism`
- `paste`
- `patreon`
- `pause`
- `pauseCircle`
- `pauseCircleSolid`
- `paw`
- `paypal`
- `peace`
- `pen`
- `penAlt`
- `penFancy`
- `penNib`
- `penSquare`
- `pencilAlt`
- `pencilRuler`
- `pennyArcade`
- `peopleCarry`
- `pepperHot`
- `percent`
- `percentage`
- `periscope`
- `personBooth`
- `phabricator`
- `phoenixFramework`
- `phoenixSquadron`
- `phone`
- `phoneAlt`
- `phoneSlash`
- `phoneSquare`
- `phoneSquareAlt`
- `phoneVolume`
- `photoVideo`
- `php`
- `piedPiper`
- `piedPiperAlt`
- `piedPiperHat`
- `piedPiperPp`
- `piggyBank`
- `pills`
- `pinterest`
- `pinterestP`
- `pinterestSquare`
- `pizzaSlice`
- `placeOfWorship`
- `plane`
- `planeArrival`
- `planeDeparture`
- `play`
- `playCircle`
- `playCircleSolid`
- `playstation`
- `plug`
- `plus`
- `plusCircle`
- `plusSquare`
- `plusSquareSolid`
- `podcast`
- `poll`
- `pollH`
- `poo`
- `pooStorm`
- `poop`
- `portrait`
- `poundSign`
- `powerOff`
- `pray`
- `prayingHands`
- `prescription`
- `prescriptionBottle`
- `prescriptionBottleAlt`
- `print`
- `procedures`
- `productHunt`
- `projectDiagram`
- `pushed`
- `puzzlePiece`
- `python`
- `qq`
- `qrcode`
- `question`
- `questionCircle`
- `questionCircleSolid`
- `quidditch`
- `quinscape`
- `quora`
- `quoteLeft`
- `quoteRight`
- `quran`
- `rProject`
- `radiation`
- `radiationAlt`
- `rainbow`
- `random`
- `raspberryPi`
- `ravelry`
- `react`
- `reacteurope`
- `readme`
- `rebel`
- `receipt`
- `recordVinyl`
- `recycle`
- `redRiver`
- `reddit`
- `redditAlien`
- `redditSquare`
- `redhat`
- `redo`
- `redoAlt`
- `registered`
- `registeredSolid`
- `removeFormat`
- `renren`
- `reply`
- `replyAll`
- `replyd`
- `republican`
- `researchgate`
- `resolving`
- `restroom`
- `retweet`
- `rev`
- `ribbon`
- `ring`
- `road`
- `robot`
- `rocket`
- `rocketchat`
- `rockrms`
- `route`
- `rss`
- `rssSquare`
- `rubleSign`
- `ruler`
- `rulerCombined`
- `rulerHorizontal`
- `rulerVertical`
- `running`
- `rupeeSign`
- `sadCry`
- `sadCrySolid`
- `sadTear`
- `sadTearSolid`
- `safari`
- `salesforce`
- `sass`
- `satellite`
- `satelliteDish`
- `save`
- `saveSolid`
- `schlix`
- `school`
- `screwdriver`
- `scribd`
- `scroll`
- `sdCard`
- `search`
- `searchDollar`
- `searchLocation`
- `searchMinus`
- `searchPlus`
- `searchengin`
- `seedling`
- `sellcast`
- `sellsy`
- `server`
- `servicestack`
- `shapes`
- `share`
- `shareAlt`
- `shareAltSquare`
- `shareSquare`
- `shareSquareSolid`
- `shekelSign`
- `shieldAlt`
- `ship`
- `shippingFast`
- `shirtsinbulk`
- `shoePrints`
- `shoppingBag`
- `shoppingBasket`
- `shoppingCart`
- `shopware`
- `shower`
- `shuttleVan`
- `sign`
- `signInAlt`
- `signLanguage`
- `signOutAlt`
- `signal`
- `signature`
- `simCard`
- `simplybuilt`
- `sistrix`
- `sitemap`
- `sith`
- `skating`
- `sketch`
- `skiing`
- `skiingNordic`
- `skull`
- `skullCrossbones`
- `skyatlas`
- `skype`
- `slack`
- `slackHash`
- `slash`
- `sleigh`
- `slidersH`
- `slideshare`
- `smile`
- `smileBeam`
- `smileBeamSolid`
- `smileSolid`
- `smileWink`
- `smileWinkSolid`
- `smog`
- `smoking`
- `smokingBan`
- `sms`
- `snapchat`
- `snapchatGhost`
- `snapchatSquare`
- `snowboarding`
- `snowflake`
- `snowflakeSolid`
- `snowman`
- `snowplow`
- `socks`
- `solarPanel`
- `sort`
- `sortAlphaDown`
- `sortAlphaDownAlt`
- `sortAlphaUp`
- `sortAlphaUpAlt`
- `sortAmountDown`
- `sortAmountDownAlt`
- `sortAmountUp`
- `sortAmountUpAlt`
- `sortDown`
- `sortNumericDown`
- `sortNumericDownAlt`
- `sortNumericUp`
- `sortNumericUpAlt`
- `sortUp`
- `soundcloud`
- `sourcetree`
- `spa`
- `spaceShuttle`
- `speakap`
- `speakerDeck`
- `spellCheck`
- `spider`
- `spinner`
- `splotch`
- `spotify`
- `sprayCan`
- `square`
- `squareFull`
- `squareRootAlt`
- `squareSolid`
- `squarespace`
- `stackExchange`
- `stackOverflow`
- `stackpath`
- `stamp`
- `star`
- `starAndCrescent`
- `starHalf`
- `starHalfAlt`
- `starHalfSolid`
- `starOfDavid`
- `starOfLife`
- `starSolid`
- `staylinked`
- `steam`
- `steamSquare`
- `steamSymbol`
- `stepBackward`
- `stepForward`
- `stethoscope`
- `stickerMule`
- `stickyNote`
- `stickyNoteSolid`
- `stop`
- `stopCircle`
- `stopCircleSolid`
- `stopwatch`
- `store`
- `storeAlt`
- `strava`
- `stream`
- `streetView`
- `strikethrough`
- `stripe`
- `stripeS`
- `stroopwafel`
- `studiovinari`
- `stumbleupon`
- `stumbleuponCircle`
- `subscript`
- `subway`
- `suitcase`
- `suitcaseRolling`
- `sun`
- `sunSolid`
- `superpowers`
- `superscript`
- `supple`
- `surprise`
- `surpriseSolid`
- `suse`
- `swatchbook`
- `swift`
- `swimmer`
- `swimmingPool`
- `symfony`
- `synagogue`
- `sync`
- `syncAlt`
- `syringe`
- `table`
- `tableTennis`
- `tablet`
- `tabletAlt`
- `tablets`
- `tachometerAlt`
- `tag`
- `tags`
- `tape`
- `tasks`
- `taxi`
- `teamspeak`
- `teeth`
- `teethOpen`
- `telegram`
- `telegramPlane`
- `temperatureHigh`
- `temperatureLow`
- `tencentWeibo`
- `tenge`
- `terminal`
- `textHeight`
- `textWidth`
- `th`
- `thLarge`
- `thList`
- `theRedYeti`
- `theaterMasks`
- `themeco`
- `themeisle`
- `thermometer`
- `thermometerEmpty`
- `thermometerFull`
- `thermometerHalf`
- `thermometerQuarter`
- `thermometerThreeQuarters`
- `thinkPeaks`
- `thumbsDown`
- `thumbsDownSolid`
- `thumbsUp`
- `thumbsUpSolid`
- `thumbtack`
- `ticketAlt`
- `times`
- `timesCircle`
- `timesCircleSolid`
- `tint`
- `tintSlash`
- `tired`
- `tiredSolid`
- `toggleOff`
- `toggleOn`
- `toilet`
- `toiletPaper`
- `toolbox`
- `tools`
- `tooth`
- `torah`
- `toriiGate`
- `tractor`
- `tradeFederation`
- `trademark`
- `trafficLight`
- `train`
- `tram`
- `transgender`
- `transgenderAlt`
- `trash`
- `trashAlt`
- `trashAltSolid`
- `trashRestore`
- `trashRestoreAlt`
- `tree`
- `trello`
- `tripadvisor`
- `trophy`
- `truck`
- `truckLoading`
- `truckMonster`
- `truckMoving`
- `truckPickup`
- `tshirt`
- `tty`
- `tumblr`
- `tumblrSquare`
- `tv`
- `twitch`
- `twitter`
- `twitterSquare`
- `typo3`
- `uber`
- `ubuntu`
- `uikit`
- `umbraco`
- `umbrella`
- `umbrellaBeach`
- `underline`
- `undo`
- `undoAlt`
- `uniregistry`
- `universalAccess`
- `university`
- `unlink`
- `unlock`
- `unlockAlt`
- `untappd`
- `upload`
- `ups`
- `usb`
- `user`
- `userAlt`
- `userAltSlash`
- `userAstronaut`
- `userCheck`
- `userCircle`
- `userCircleSolid`
- `userClock`
- `userCog`
- `userEdit`
- `userFriends`
- `userGraduate`
- `userInjured`
- `userLock`
- `userMd`
- `userMinus`
- `userNinja`
- `userNurse`
- `userPlus`
- `userSecret`
- `userShield`
- `userSlash`
- `userSolid`
- `userTag`
- `userTie`
- `userTimes`
- `users`
- `usersCog`
- `usps`
- `ussunnah`
- `utensilSpoon`
- `utensils`
- `vaadin`
- `vectorSquare`
- `venus`
- `venusDouble`
- `venusMars`
- `viacoin`
- `viadeo`
- `viadeoSquare`
- `vial`
- `vials`
- `viber`
- `video`
- `videoSlash`
- `vihara`
- `vimeo`
- `vimeoSquare`
- `vimeoV`
- `vine`
- `vk`
- `vnv`
- `voicemail`
- `volleyballBall`
- `volumeDown`
- `volumeMute`
- `volumeOff`
- `volumeUp`
- `voteYea`
- `vrCardboard`
- `vuejs`
- `walking`
- `wallet`
- `warehouse`
- `water`
- `waveSquare`
- `waze`
- `weebly`
- `weibo`
- `weight`
- `weightHanging`
- `weixin`
- `whatsapp`
- `whatsappSquare`
- `wheelchair`
- `whmcs`
- `wifi`
- `wikipediaW`
- `wind`
- `windowClose`
- `windowCloseSolid`
- `windowMaximize`
- `windowMaximizeSolid`
- `windowMinimize`
- `windowMinimizeSolid`
- `windowRestore`
- `windowRestoreSolid`
- `windows`
- `wineBottle`
- `wineGlass`
- `wineGlassAlt`
- `wix`
- `wizardsOfTheCoast`
- `wolfPackBattalion`
- `wonSign`
- `wordpress`
- `wordpressSimple`
- `wpbeginner`
- `wpexplorer`
- `wpforms`
- `wpressr`
- `wrench`
- `xRay`
- `xbox`
- `xing`
- `xingSquare`
- `yCombinator`
- `yahoo`
- `yammer`
- `yandex`
- `yandexInternational`
- `yarn`
- `yelp`
- `yenSign`
- `yinYang`
- `yoast`
- `youtube`
- `youtubeSquare`
- `zhihu`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><500pxIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccessibleIconIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccusoftIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AcquisitionsIncorporatedIcon size="20" class="nav-icon" /> Settings</a>
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
<500pxIcon
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
    <500pxIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccessibleIconIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccusoftIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <500pxIcon size="24" />
   <AccessibleIconIcon size="24" color="#4a90e2" />
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
   <500pxIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <500pxIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <500pxIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-la'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(500px, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 500px } from '@stacksjs/iconify-la'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Apache 2.0

See [license details](https://www.apache.org/licenses/LICENSE-2.0) for more information.

## Credits

- **Icons**: Icons8 ([Website](https://github.com/icons8/line-awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/la/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/la/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
