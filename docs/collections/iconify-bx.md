# BoxIcons

> BoxIcons icons for stx from Iconify

## Overview

This package provides access to 1609 icons from the BoxIcons collection through the stx iconify integration.

**Collection ID:** `bx`
**Total Icons:** 1609
**Author:** Atisa ([Website](https://github.com/atisawd/boxicons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bx
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AbacusIcon height="1em" />
<AbacusIcon width="1em" height="1em" />
<AbacusIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AbacusIcon size="24" />
<AbacusIcon size="1em" />

<!-- Using width and height -->
<AbacusIcon width="24" height="32" />

<!-- With color -->
<AbacusIcon size="24" color="red" />
<AbacusIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AbacusIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AbacusIcon
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
    <AbacusIcon size="24" />
    <AccessibilityIcon size="24" color="#4a90e2" />
    <AddToQueueIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { abacus, accessibility, addToQueue } from '@stacksjs/iconify-bx'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abacus, { size: 24 })
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
<AbacusIcon size="24" color="red" />
<AbacusIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AbacusIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AbacusIcon size="24" class="text-primary" />
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
<AbacusIcon height="1em" />
<AbacusIcon width="1em" height="1em" />
<AbacusIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AbacusIcon size="24" />
<AbacusIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.bx-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AbacusIcon class="bx-icon" />
```

## Available Icons

This package contains **1609** icons:

- `abacus`
- `accessibility`
- `addToQueue`
- `adjust`
- `alarm`
- `alarmAdd`
- `alarmExclamation`
- `alarmOff`
- `alarmSnooze`
- `album`
- `alignJustify`
- `alignLeft`
- `alignMiddle`
- `alignRight`
- `analyse`
- `anchor`
- `angry`
- `aperture`
- `arch`
- `archive`
- `archiveIn`
- `archiveOut`
- `area`
- `arrowBack`
- `arrowFromBottom`
- `arrowFromLeft`
- `arrowFromRight`
- `arrowFromTop`
- `arrowToBottom`
- `arrowToLeft`
- `arrowToRight`
- `arrowToTop`
- `at`
- `atom`
- `award`
- `badge`
- `badgeCheck`
- `baguette`
- `ball`
- `bandAid`
- `barChart`
- `barChartAlt`
- `barChartAlt2`
- `barChartSquare`
- `barcode`
- `barcodeReader`
- `baseball`
- `basket`
- `basketball`
- `bath`
- `battery`
- `bed`
- `beenHere`
- `beer`
- `bell`
- `bellMinus`
- `bellOff`
- `bellPlus`
- `bible`
- `bitcoin`
- `blanket`
- `block`
- `bluetooth`
- `body`
- `bold`
- `boltCircle`
- `bomb`
- `bone`
- `bong`
- `book`
- `bookAdd`
- `bookAlt`
- `bookBookmark`
- `bookContent`
- `bookHeart`
- `bookOpen`
- `bookReader`
- `bookmark`
- `bookmarkAlt`
- `bookmarkAltMinus`
- `bookmarkAltPlus`
- `bookmarkHeart`
- `bookmarkMinus`
- `bookmarkPlus`
- `bookmarks`
- `borderAll`
- `borderBottom`
- `borderInner`
- `borderLeft`
- `borderNone`
- `borderOuter`
- `borderRadius`
- `borderRight`
- `borderTop`
- `bot`
- `bowlHot`
- `bowlRice`
- `bowlingBall`
- `box`
- `bracket`
- `braille`
- `brain`
- `briefcase`
- `briefcaseAlt`
- `briefcaseAlt2`
- `brightness`
- `brightnessHalf`
- `broadcast`
- `brush`
- `brushAlt`
- `bug`
- `bugAlt`
- `building`
- `buildingHouse`
- `buildings`
- `bulb`
- `bullseye`
- `buoy`
- `bus`
- `busSchool`
- `bxl500px`
- `bxl99designs`
- `bxlAdobe`
- `bxlAirbnb`
- `bxlAlgolia`
- `bxlAmazon`
- `bxlAndroid`
- `bxlAngular`
- `bxlApple`
- `bxlAudible`
- `bxlAws`
- `bxlBaidu`
- `bxlBehance`
- `bxlBing`
- `bxlBitcoin`
- `bxlBlender`
- `bxlBlogger`
- `bxlBootstrap`
- `bxlCPlusPlus`
- `bxlChrome`
- `bxlCodepen`
- `bxlCreativeCommons`
- `bxlCss3`
- `bxlDailymotion`
- `bxlDevTo`
- `bxlDeviantart`
- `bxlDigg`
- `bxlDigitalocean`
- `bxlDiscord`
- `bxlDiscordAlt`
- `bxlDiscourse`
- `bxlDjango`
- `bxlDocker`
- `bxlDribbble`
- `bxlDropbox`
- `bxlDrupal`
- `bxlEbay`
- `bxlEdge`
- `bxlEtsy`
- `bxlFacebook`
- `bxlFacebookCircle`
- `bxlFacebookSquare`
- `bxlFigma`
- `bxlFirebase`
- `bxlFirefox`
- `bxlFlask`
- `bxlFlickr`
- `bxlFlickrSquare`
- `bxlFlutter`
- `bxlFoursquare`
- `bxlGit`
- `bxlGithub`
- `bxlGitlab`
- `bxlGmail`
- `bxlGoLang`
- `bxlGoogle`
- `bxlGoogleCloud`
- `bxlGooglePlus`
- `bxlGooglePlusCircle`
- `bxlHeroku`
- `bxlHtml5`
- `bxlImdb`
- `bxlInstagram`
- `bxlInstagramAlt`
- `bxlInternetExplorer`
- `bxlInvision`
- `bxlJava`
- `bxlJavascript`
- `bxlJoomla`
- `bxlJquery`
- `bxlJsfiddle`
- `bxlKickstarter`
- `bxlKubernetes`
- `bxlLess`
- `bxlLinkedin`
- `bxlLinkedinSquare`
- `bxlMagento`
- `bxlMailchimp`
- `bxlMarkdown`
- `bxlMastercard`
- `bxlMastodon`
- `bxlMedium`
- `bxlMediumOld`
- `bxlMediumSquare`
- `bxlMessenger`
- `bxlMeta`
- `bxlMicrosoft`
- `bxlMicrosoftTeams`
- `bxlNetlify`
- `bxlNodejs`
- `bxlOkRu`
- `bxlOpera`
- `bxlPatreon`
- `bxlPaypal`
- `bxlPeriscope`
- `bxlPhp`
- `bxlPinterest`
- `bxlPinterestAlt`
- `bxlPlayStore`
- `bxlPocket`
- `bxlProductHunt`
- `bxlPython`
- `bxlQuora`
- `bxlReact`
- `bxlRedbubble`
- `bxlReddit`
- `bxlRedux`
- `bxlSass`
- `bxlShopify`
- `bxlSketch`
- `bxlSkype`
- `bxlSlack`
- `bxlSlackOld`
- `bxlSnapchat`
- `bxlSoundcloud`
- `bxlSpotify`
- `bxlSpringBoot`
- `bxlSquarespace`
- `bxlStackOverflow`
- `bxlSteam`
- `bxlStripe`
- `bxlTailwindCss`
- `bxlTelegram`
- `bxlTiktok`
- `bxlTrello`
- `bxlTripAdvisor`
- `bxlTumblr`
- `bxlTux`
- `bxlTwitch`
- `bxlTwitter`
- `bxlUnity`
- `bxlUnsplash`
- `bxlUpwork`
- `bxlVenmo`
- `bxlVimeo`
- `bxlVisa`
- `bxlVisualStudio`
- `bxlVk`
- `bxlVuejs`
- `bxlWhatsapp`
- `bxlWhatsappSquare`
- `bxlWikipedia`
- `bxlWindows`
- `bxlWix`
- `bxlWordpress`
- `bxlYahoo`
- `bxlYelp`
- `bxlYoutube`
- `bxlZoom`
- `bxsAddToQueue`
- `bxsAdjust`
- `bxsAdjustAlt`
- `bxsAlarm`
- `bxsAlarmAdd`
- `bxsAlarmExclamation`
- `bxsAlarmOff`
- `bxsAlarmSnooze`
- `bxsAlbum`
- `bxsAmbulance`
- `bxsAnalyse`
- `bxsAngry`
- `bxsArch`
- `bxsArchive`
- `bxsArchiveIn`
- `bxsArchiveOut`
- `bxsArea`
- `bxsArrowFromBottom`
- `bxsArrowFromLeft`
- `bxsArrowFromRight`
- `bxsArrowFromTop`
- `bxsArrowToBottom`
- `bxsArrowToLeft`
- `bxsArrowToRight`
- `bxsArrowToTop`
- `bxsAward`
- `bxsBabyCarriage`
- `bxsBackpack`
- `bxsBadge`
- `bxsBadgeCheck`
- `bxsBadgeDollar`
- `bxsBaguette`
- `bxsBall`
- `bxsBandAid`
- `bxsBank`
- `bxsBarChartAlt2`
- `bxsBarChartSquare`
- `bxsBarcode`
- `bxsBaseball`
- `bxsBasket`
- `bxsBasketball`
- `bxsBath`
- `bxsBattery`
- `bxsBatteryCharging`
- `bxsBatteryFull`
- `bxsBatteryLow`
- `bxsBed`
- `bxsBeenHere`
- `bxsBeer`
- `bxsBell`
- `bxsBellMinus`
- `bxsBellOff`
- `bxsBellPlus`
- `bxsBellRing`
- `bxsBible`
- `bxsBinoculars`
- `bxsBlanket`
- `bxsBolt`
- `bxsBoltCircle`
- `bxsBomb`
- `bxsBone`
- `bxsBong`
- `bxsBook`
- `bxsBookAdd`
- `bxsBookAlt`
- `bxsBookBookmark`
- `bxsBookContent`
- `bxsBookHeart`
- `bxsBookOpen`
- `bxsBookReader`
- `bxsBookmark`
- `bxsBookmarkAlt`
- `bxsBookmarkAltMinus`
- `bxsBookmarkAltPlus`
- `bxsBookmarkHeart`
- `bxsBookmarkMinus`
- `bxsBookmarkPlus`
- `bxsBookmarkStar`
- `bxsBookmarks`
- `bxsBot`
- `bxsBowlHot`
- `bxsBowlRice`
- `bxsBowlingBall`
- `bxsBox`
- `bxsBrain`
- `bxsBriefcase`
- `bxsBriefcaseAlt`
- `bxsBriefcaseAlt2`
- `bxsBrightness`
- `bxsBrightnessHalf`
- `bxsBrush`
- `bxsBrushAlt`
- `bxsBug`
- `bxsBugAlt`
- `bxsBuilding`
- `bxsBuildingHouse`
- `bxsBuildings`
- `bxsBulb`
- `bxsBullseye`
- `bxsBuoy`
- `bxsBus`
- `bxsBusSchool`
- `bxsBusiness`
- `bxsCabinet`
- `bxsCableCar`
- `bxsCake`
- `bxsCalculator`
- `bxsCalendar`
- `bxsCalendarAlt`
- `bxsCalendarCheck`
- `bxsCalendarEdit`
- `bxsCalendarEvent`
- `bxsCalendarExclamation`
- `bxsCalendarHeart`
- `bxsCalendarMinus`
- `bxsCalendarPlus`
- `bxsCalendarStar`
- `bxsCalendarWeek`
- `bxsCalendarX`
- `bxsCamera`
- `bxsCameraHome`
- `bxsCameraMovie`
- `bxsCameraOff`
- `bxsCameraPlus`
- `bxsCapsule`
- `bxsCaptions`
- `bxsCar`
- `bxsCarBattery`
- `bxsCarCrash`
- `bxsCarGarage`
- `bxsCarMechanic`
- `bxsCarWash`
- `bxsCard`
- `bxsCaretDownCircle`
- `bxsCaretDownSquare`
- `bxsCaretLeftCircle`
- `bxsCaretLeftSquare`
- `bxsCaretRightCircle`
- `bxsCaretRightSquare`
- `bxsCaretUpCircle`
- `bxsCaretUpSquare`
- `bxsCarousel`
- `bxsCart`
- `bxsCartAdd`
- `bxsCartAlt`
- `bxsCartDownload`
- `bxsCat`
- `bxsCategory`
- `bxsCategoryAlt`
- `bxsCctv`
- `bxsCertification`
- `bxsChalkboard`
- `bxsChart`
- `bxsChat`
- `bxsCheckCircle`
- `bxsCheckShield`
- `bxsCheckSquare`
- `bxsCheckbox`
- `bxsCheckboxChecked`
- `bxsCheckboxMinus`
- `bxsChess`
- `bxsChevronDown`
- `bxsChevronDownCircle`
- `bxsChevronDownSquare`
- `bxsChevronLeft`
- `bxsChevronLeftCircle`
- `bxsChevronLeftSquare`
- `bxsChevronRight`
- `bxsChevronRightCircle`
- `bxsChevronRightSquare`
- `bxsChevronUp`
- `bxsChevronUpCircle`
- `bxsChevronUpSquare`
- `bxsChevronsDown`
- `bxsChevronsLeft`
- `bxsChevronsRight`
- `bxsChevronsUp`
- `bxsChip`
- `bxsChurch`
- `bxsCircle`
- `bxsCircleHalf`
- `bxsCircleQuarter`
- `bxsCircleThreeQuarter`
- `bxsCity`
- `bxsClinic`
- `bxsCloud`
- `bxsCloudDownload`
- `bxsCloudLightning`
- `bxsCloudRain`
- `bxsCloudUpload`
- `bxsCoffee`
- `bxsCoffeeAlt`
- `bxsCoffeeTogo`
- `bxsCog`
- `bxsCoin`
- `bxsCoinStack`
- `bxsCollection`
- `bxsColorFill`
- `bxsComment`
- `bxsCommentAdd`
- `bxsCommentCheck`
- `bxsCommentDetail`
- `bxsCommentDots`
- `bxsCommentEdit`
- `bxsCommentError`
- `bxsCommentMinus`
- `bxsCommentX`
- `bxsCompass`
- `bxsComponent`
- `bxsConfused`
- `bxsContact`
- `bxsConversation`
- `bxsCookie`
- `bxsCool`
- `bxsCopy`
- `bxsCopyAlt`
- `bxsCopyright`
- `bxsCoupon`
- `bxsCreditCard`
- `bxsCreditCardAlt`
- `bxsCreditCardFront`
- `bxsCricketBall`
- `bxsCrop`
- `bxsCrown`
- `bxsCube`
- `bxsCubeAlt`
- `bxsCuboid`
- `bxsCustomize`
- `bxsCylinder`
- `bxsDashboard`
- `bxsData`
- `bxsDetail`
- `bxsDevices`
- `bxsDiamond`
- `bxsDice1`
- `bxsDice2`
- `bxsDice3`
- `bxsDice4`
- `bxsDice5`
- `bxsDice6`
- `bxsDirectionLeft`
- `bxsDirectionRight`
- `bxsDirections`
- `bxsDisc`
- `bxsDiscount`
- `bxsDish`
- `bxsDislike`
- `bxsDizzy`
- `bxsDockBottom`
- `bxsDockLeft`
- `bxsDockRight`
- `bxsDockTop`
- `bxsDog`
- `bxsDollarCircle`
- `bxsDonateBlood`
- `bxsDonateHeart`
- `bxsDoorOpen`
- `bxsDoughnutChart`
- `bxsDownArrow`
- `bxsDownArrowAlt`
- `bxsDownArrowCircle`
- `bxsDownArrowSquare`
- `bxsDownload`
- `bxsDownvote`
- `bxsDrink`
- `bxsDroplet`
- `bxsDropletHalf`
- `bxsDryer`
- `bxsDuplicate`
- `bxsEdit`
- `bxsEditAlt`
- `bxsEditLocation`
- `bxsEject`
- `bxsEnvelope`
- `bxsEnvelopeOpen`
- `bxsEraser`
- `bxsError`
- `bxsErrorAlt`
- `bxsErrorCircle`
- `bxsEvStation`
- `bxsExit`
- `bxsExtension`
- `bxsEyedropper`
- `bxsFace`
- `bxsFaceMask`
- `bxsFactory`
- `bxsFastForwardCircle`
- `bxsFile`
- `bxsFileArchive`
- `bxsFileBlank`
- `bxsFileCss`
- `bxsFileDoc`
- `bxsFileExport`
- `bxsFileFind`
- `bxsFileGif`
- `bxsFileHtml`
- `bxsFileImage`
- `bxsFileImport`
- `bxsFileJpg`
- `bxsFileJs`
- `bxsFileJson`
- `bxsFileMd`
- `bxsFilePdf`
- `bxsFilePlus`
- `bxsFilePng`
- `bxsFileTxt`
- `bxsFilm`
- `bxsFilterAlt`
- `bxsFirstAid`
- `bxsFlag`
- `bxsFlagAlt`
- `bxsFlagCheckered`
- `bxsFlame`
- `bxsFlask`
- `bxsFlorist`
- `bxsFolder`
- `bxsFolderMinus`
- `bxsFolderOpen`
- `bxsFolderPlus`
- `bxsFoodMenu`
- `bxsFridge`
- `bxsGame`
- `bxsGasPump`
- `bxsGhost`
- `bxsGift`
- `bxsGraduation`
- `bxsGrid`
- `bxsGridAlt`
- `bxsGroup`
- `bxsGuitarAmp`
- `bxsHand`
- `bxsHandDown`
- `bxsHandLeft`
- `bxsHandRight`
- `bxsHandUp`
- `bxsHappy`
- `bxsHappyAlt`
- `bxsHappyBeaming`
- `bxsHappyHeartEyes`
- `bxsHdd`
- `bxsHeart`
- `bxsHeartCircle`
- `bxsHeartSquare`
- `bxsHelpCircle`
- `bxsHide`
- `bxsHome`
- `bxsHomeCircle`
- `bxsHomeHeart`
- `bxsHomeSmile`
- `bxsHot`
- `bxsHotel`
- `bxsHourglass`
- `bxsHourglassBottom`
- `bxsHourglassTop`
- `bxsIdCard`
- `bxsImage`
- `bxsImageAdd`
- `bxsImageAlt`
- `bxsInbox`
- `bxsInfoCircle`
- `bxsInfoSquare`
- `bxsInjection`
- `bxsInstitution`
- `bxsInvader`
- `bxsJoystick`
- `bxsJoystickAlt`
- `bxsJoystickButton`
- `bxsKey`
- `bxsKeyboard`
- `bxsLabel`
- `bxsLandmark`
- `bxsLandscape`
- `bxsLaugh`
- `bxsLayer`
- `bxsLayerMinus`
- `bxsLayerPlus`
- `bxsLayout`
- `bxsLeaf`
- `bxsLeftArrow`
- `bxsLeftArrowAlt`
- `bxsLeftArrowCircle`
- `bxsLeftArrowSquare`
- `bxsLeftDownArrowCircle`
- `bxsLeftTopArrowCircle`
- `bxsLemon`
- `bxsLike`
- `bxsLocationPlus`
- `bxsLock`
- `bxsLockAlt`
- `bxsLockOpen`
- `bxsLockOpenAlt`
- `bxsLogIn`
- `bxsLogInCircle`
- `bxsLogOut`
- `bxsLogOutCircle`
- `bxsLowVision`
- `bxsMagicWand`
- `bxsMagnet`
- `bxsMap`
- `bxsMapAlt`
- `bxsMapPin`
- `bxsMask`
- `bxsMedal`
- `bxsMegaphone`
- `bxsMeh`
- `bxsMehAlt`
- `bxsMehBlank`
- `bxsMemoryCard`
- `bxsMessage`
- `bxsMessageAdd`
- `bxsMessageAlt`
- `bxsMessageAltAdd`
- `bxsMessageAltCheck`
- `bxsMessageAltDetail`
- `bxsMessageAltDots`
- `bxsMessageAltEdit`
- `bxsMessageAltError`
- `bxsMessageAltMinus`
- `bxsMessageAltX`
- `bxsMessageCheck`
- `bxsMessageDetail`
- `bxsMessageDots`
- `bxsMessageEdit`
- `bxsMessageError`
- `bxsMessageMinus`
- `bxsMessageRounded`
- `bxsMessageRoundedAdd`
- `bxsMessageRoundedCheck`
- `bxsMessageRoundedDetail`
- `bxsMessageRoundedDots`
- `bxsMessageRoundedEdit`
- `bxsMessageRoundedError`
- `bxsMessageRoundedMinus`
- `bxsMessageRoundedX`
- `bxsMessageSquare`
- `bxsMessageSquareAdd`
- `bxsMessageSquareCheck`
- `bxsMessageSquareDetail`
- `bxsMessageSquareDots`
- `bxsMessageSquareEdit`
- `bxsMessageSquareError`
- `bxsMessageSquareMinus`
- `bxsMessageSquareX`
- `bxsMessageX`
- `bxsMeteor`
- `bxsMicrochip`
- `bxsMicrophone`
- `bxsMicrophoneAlt`
- `bxsMicrophoneOff`
- `bxsMinusCircle`
- `bxsMinusSquare`
- `bxsMobile`
- `bxsMobileVibration`
- `bxsMoon`
- `bxsMouse`
- `bxsMouseAlt`
- `bxsMovie`
- `bxsMoviePlay`
- `bxsMusic`
- `bxsNavigation`
- `bxsNetworkChart`
- `bxsNews`
- `bxsNoEntry`
- `bxsNote`
- `bxsNotepad`
- `bxsNotification`
- `bxsNotificationOff`
- `bxsOffer`
- `bxsPackage`
- `bxsPaint`
- `bxsPaintRoll`
- `bxsPalette`
- `bxsPaperPlane`
- `bxsParking`
- `bxsParty`
- `bxsPaste`
- `bxsPen`
- `bxsPencil`
- `bxsPhone`
- `bxsPhoneCall`
- `bxsPhoneIncoming`
- `bxsPhoneOff`
- `bxsPhoneOutgoing`
- `bxsPhotoAlbum`
- `bxsPiano`
- `bxsPieChart`
- `bxsPieChartAlt`
- `bxsPieChartAlt2`
- `bxsPin`
- `bxsPizza`
- `bxsPlane`
- `bxsPlaneAlt`
- `bxsPlaneLand`
- `bxsPlaneTakeOff`
- `bxsPlanet`
- `bxsPlaylist`
- `bxsPlug`
- `bxsPlusCircle`
- `bxsPlusSquare`
- `bxsPointer`
- `bxsPolygon`
- `bxsPopsicle`
- `bxsPrinter`
- `bxsPurchaseTag`
- `bxsPurchaseTagAlt`
- `bxsPyramid`
- `bxsQuoteAltLeft`
- `bxsQuoteAltRight`
- `bxsQuoteLeft`
- `bxsQuoteRight`
- `bxsQuoteSingleLeft`
- `bxsQuoteSingleRight`
- `bxsRadiation`
- `bxsRadio`
- `bxsReceipt`
- `bxsRectangle`
- `bxsRegistered`
- `bxsRename`
- `bxsReport`
- `bxsRewindCircle`
- `bxsRightArrow`
- `bxsRightArrowAlt`
- `bxsRightArrowCircle`
- `bxsRightArrowSquare`
- `bxsRightDownArrowCircle`
- `bxsRightTopArrowCircle`
- `bxsRocket`
- `bxsRuler`
- `bxsSad`
- `bxsSave`
- `bxsSchool`
- `bxsSearch`
- `bxsSearchAlt2`
- `bxsSelectMultiple`
- `bxsSend`
- `bxsServer`
- `bxsShapes`
- `bxsShare`
- `bxsShareAlt`
- `bxsShield`
- `bxsShieldAlt2`
- `bxsShieldX`
- `bxsShip`
- `bxsShocked`
- `bxsShoppingBag`
- `bxsShoppingBagAlt`
- `bxsShoppingBags`
- `bxsShow`
- `bxsSkipNextCircle`
- `bxsSkipPreviousCircle`
- `bxsSkull`
- `bxsSleepy`
- `bxsSlideshow`
- `bxsSmile`
- `bxsSortAlt`
- `bxsSpa`
- `bxsSpeaker`
- `bxsSprayCan`
- `bxsSpreadsheet`
- `bxsSquare`
- `bxsSquareRounded`
- `bxsStar`
- `bxsStarHalf`
- `bxsSticker`
- `bxsStopwatch`
- `bxsStore`
- `bxsStoreAlt`
- `bxsSun`
- `bxsTShirt`
- `bxsTachometer`
- `bxsTag`
- `bxsTagAlt`
- `bxsTagX`
- `bxsTaxi`
- `bxsTennisBall`
- `bxsTerminal`
- `bxsThermometer`
- `bxsTime`
- `bxsTimeFive`
- `bxsTimer`
- `bxsTired`
- `bxsToTop`
- `bxsToggleLeft`
- `bxsToggleRight`
- `bxsTone`
- `bxsTorch`
- `bxsTraffic`
- `bxsTrafficBarrier`
- `bxsTrafficCone`
- `bxsTrain`
- `bxsTrash`
- `bxsTrashAlt`
- `bxsTree`
- `bxsTreeAlt`
- `bxsTrophy`
- `bxsTruck`
- `bxsTv`
- `bxsUpArrow`
- `bxsUpArrowAlt`
- `bxsUpArrowCircle`
- `bxsUpArrowSquare`
- `bxsUpsideDown`
- `bxsUpvote`
- `bxsUser`
- `bxsUserAccount`
- `bxsUserBadge`
- `bxsUserCheck`
- `bxsUserCircle`
- `bxsUserDetail`
- `bxsUserMinus`
- `bxsUserPin`
- `bxsUserPlus`
- `bxsUserRectangle`
- `bxsUserVoice`
- `bxsUserX`
- `bxsVector`
- `bxsVial`
- `bxsVideo`
- `bxsVideoOff`
- `bxsVideoPlus`
- `bxsVideoRecording`
- `bxsVideos`
- `bxsVirus`
- `bxsVirusBlock`
- `bxsVolume`
- `bxsVolumeFull`
- `bxsVolumeLow`
- `bxsVolumeMute`
- `bxsWallet`
- `bxsWalletAlt`
- `bxsWasher`
- `bxsWatch`
- `bxsWatchAlt`
- `bxsWebcam`
- `bxsWidget`
- `bxsWindowAlt`
- `bxsWine`
- `bxsWinkSmile`
- `bxsWinkTongue`
- `bxsWrench`
- `bxsXCircle`
- `bxsXSquare`
- `bxsYinYang`
- `bxsZap`
- `bxsZoomIn`
- `bxsZoomOut`
- `cabinet`
- `cableCar`
- `cake`
- `calculator`
- `calendar`
- `calendarAlt`
- `calendarCheck`
- `calendarEdit`
- `calendarEvent`
- `calendarExclamation`
- `calendarHeart`
- `calendarMinus`
- `calendarPlus`
- `calendarStar`
- `calendarWeek`
- `calendarX`
- `camera`
- `cameraHome`
- `cameraMovie`
- `cameraOff`
- `candles`
- `capsule`
- `captions`
- `car`
- `card`
- `caretDown`
- `caretDownCircle`
- `caretDownSquare`
- `caretLeft`
- `caretLeftCircle`
- `caretLeftSquare`
- `caretRight`
- `caretRightCircle`
- `caretRightSquare`
- `caretUp`
- `caretUpCircle`
- `caretUpSquare`
- `carousel`
- `cart`
- `cartAdd`
- `cartAlt`
- `cartDownload`
- `cast`
- `category`
- `categoryAlt`
- `cctv`
- `certification`
- `chair`
- `chalkboard`
- `chart`
- `chat`
- `check`
- `checkCircle`
- `checkDouble`
- `checkShield`
- `checkSquare`
- `checkbox`
- `checkboxChecked`
- `checkboxMinus`
- `checkboxSquare`
- `cheese`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownSquare`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronLeftSquare`
- `chevronRight`
- `chevronRightCircle`
- `chevronRightSquare`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpSquare`
- `chevronsDown`
- `chevronsLeft`
- `chevronsRight`
- `chevronsUp`
- `child`
- `chip`
- `church`
- `circle`
- `circleHalf`
- `circleQuarter`
- `circleThreeQuarter`
- `clinic`
- `clipboard`
- `closet`
- `cloud`
- `cloudDownload`
- `cloudDrizzle`
- `cloudLightRain`
- `cloudLightning`
- `cloudRain`
- `cloudSnow`
- `cloudUpload`
- `code`
- `codeAlt`
- `codeBlock`
- `codeCurly`
- `coffee`
- `coffeeTogo`
- `cog`
- `coin`
- `coinStack`
- `collapse`
- `collapseAlt`
- `collapseHorizontal`
- `collapseVertical`
- `collection`
- `color`
- `colorFill`
- `columns`
- `command`
- `comment`
- `commentAdd`
- `commentCheck`
- `commentDetail`
- `commentDots`
- `commentEdit`
- `commentError`
- `commentMinus`
- `commentX`
- `compass`
- `confused`
- `conversation`
- `cookie`
- `cool`
- `copy`
- `copyAlt`
- `copyright`
- `creditCard`
- `creditCardAlt`
- `creditCardFront`
- `cricketBall`
- `crop`
- `cross`
- `crosshair`
- `crown`
- `cube`
- `cubeAlt`
- `cuboid`
- `currentLocation`
- `customize`
- `cut`
- `cycling`
- `cylinder`
- `data`
- `desktop`
- `detail`
- `devices`
- `dialpad`
- `dialpadAlt`
- `diamond`
- `dice1`
- `dice2`
- `dice3`
- `dice4`
- `dice5`
- `dice6`
- `directions`
- `disc`
- `dish`
- `dislike`
- `dizzy`
- `dna`
- `dockBottom`
- `dockLeft`
- `dockRight`
- `dockTop`
- `dollar`
- `dollarCircle`
- `donateBlood`
- `donateHeart`
- `doorOpen`
- `dotsHorizontal`
- `dotsHorizontalRounded`
- `dotsVertical`
- `dotsVerticalRounded`
- `doughnutChart`
- `downArrow`
- `downArrowAlt`
- `downArrowCircle`
- `download`
- `downvote`
- `drink`
- `droplet`
- `dumbbell`
- `duplicate`
- `edit`
- `editAlt`
- `envelope`
- `envelopeOpen`
- `equalizer`
- `eraser`
- `error`
- `errorAlt`
- `errorCircle`
- `euro`
- `exclude`
- `exit`
- `exitFullscreen`
- `expand`
- `expandAlt`
- `expandHorizontal`
- `expandVertical`
- `export`
- `extension`
- `face`
- `fastForward`
- `fastForwardCircle`
- `female`
- `femaleSign`
- `file`
- `fileBlank`
- `fileFind`
- `film`
- `filter`
- `filterAlt`
- `fingerprint`
- `firstAid`
- `firstPage`
- `flag`
- `folder`
- `folderMinus`
- `folderOpen`
- `folderPlus`
- `font`
- `fontColor`
- `fontFamily`
- `fontSize`
- `foodMenu`
- `foodTag`
- `football`
- `fork`
- `fridge`
- `fullscreen`
- `game`
- `gasPump`
- `ghost`
- `gift`
- `gitBranch`
- `gitCommit`
- `gitCompare`
- `gitMerge`
- `gitPullRequest`
- `gitRepoForked`
- `glasses`
- `glassesAlt`
- `globe`
- `globeAlt`
- `grid`
- `gridAlt`
- `gridHorizontal`
- `gridSmall`
- `gridVertical`
- `group`
- `handicap`
- `happy`
- `happyAlt`
- `happyBeaming`
- `happyHeartEyes`
- `hardHat`
- `hash`
- `hdd`
- `heading`
- `headphone`
- `health`
- `heart`
- `heartCircle`
- `heartSquare`
- `helpCircle`
- `hide`
- `highlight`
- `history`
- `hive`
- `home`
- `homeAlt`
- `homeAlt2`
- `homeCircle`
- `homeHeart`
- `homeSmile`
- `horizontalCenter`
- `horizontalLeft`
- `horizontalRight`
- `hotel`
- `hourglass`
- `idCard`
- `image`
- `imageAdd`
- `imageAlt`
- `images`
- `import`
- `infinite`
- `infoCircle`
- `infoSquare`
- `injection`
- `intersect`
- `italic`
- `joystick`
- `joystickAlt`
- `joystickButton`
- `key`
- `knife`
- `label`
- `landscape`
- `laptop`
- `lastPage`
- `laugh`
- `layer`
- `layerMinus`
- `layerPlus`
- `layout`
- `leaf`
- `leftArrow`
- `leftArrowAlt`
- `leftArrowCircle`
- `leftDownArrowCircle`
- `leftIndent`
- `leftTopArrowCircle`
- `lemon`
- `library`
- `like`
- `lineChart`
- `lineChartDown`
- `link`
- `linkAlt`
- `linkExternal`
- `lira`
- `listCheck`
- `listMinus`
- `listOl`
- `listPlus`
- `listUl`
- `loader`
- `loaderAlt`
- `loaderCircle`
- `locationPlus`
- `lock`
- `lockAlt`
- `lockOpen`
- `lockOpenAlt`
- `logIn`
- `logInCircle`
- `logOut`
- `logOutCircle`
- `lowVision`
- `magnet`
- `mailSend`
- `male`
- `maleFemale`
- `maleSign`
- `map`
- `mapAlt`
- `mapPin`
- `mask`
- `math`
- `medal`
- `meh`
- `mehAlt`
- `mehBlank`
- `memoryCard`
- `menu`
- `menuAltLeft`
- `menuAltRight`
- `merge`
- `message`
- `messageAdd`
- `messageAlt`
- `messageAltAdd`
- `messageAltCheck`
- `messageAltDetail`
- `messageAltDots`
- `messageAltEdit`
- `messageAltError`
- `messageAltMinus`
- `messageAltX`
- `messageCheck`
- `messageDetail`
- `messageDots`
- `messageEdit`
- `messageError`
- `messageMinus`
- `messageRounded`
- `messageRoundedAdd`
- `messageRoundedCheck`
- `messageRoundedDetail`
- `messageRoundedDots`
- `messageRoundedEdit`
- `messageRoundedError`
- `messageRoundedMinus`
- `messageRoundedX`
- `messageSquare`
- `messageSquareAdd`
- `messageSquareCheck`
- `messageSquareDetail`
- `messageSquareDots`
- `messageSquareEdit`
- `messageSquareError`
- `messageSquareMinus`
- `messageSquareX`
- `messageX`
- `meteor`
- `microchip`
- `microphone`
- `microphoneOff`
- `minus`
- `minusBack`
- `minusCircle`
- `minusFront`
- `mobile`
- `mobileAlt`
- `mobileLandscape`
- `mobileVibration`
- `money`
- `moneyWithdraw`
- `moon`
- `mouse`
- `mouseAlt`
- `move`
- `moveHorizontal`
- `moveVertical`
- `movie`
- `moviePlay`
- `music`
- `navigation`
- `networkChart`
- `news`
- `noEntry`
- `noSignal`
- `note`
- `notepad`
- `notification`
- `notificationOff`
- `objectsHorizontalCenter`
- `objectsHorizontalLeft`
- `objectsHorizontalRight`
- `objectsVerticalBottom`
- `objectsVerticalCenter`
- `objectsVerticalTop`
- `outline`
- `package`
- `paint`
- `paintRoll`
- `palette`
- `paperPlane`
- `paperclip`
- `paragraph`
- `party`
- `paste`
- `pause`
- `pauseCircle`
- `pen`
- `pencil`
- `phone`
- `phoneCall`
- `phoneIncoming`
- `phoneOff`
- `phoneOutgoing`
- `photoAlbum`
- `pieChart`
- `pieChartAlt`
- `pieChartAlt2`
- `pin`
- `planet`
- `play`
- `playCircle`
- `plug`
- `plus`
- `plusCircle`
- `plusMedical`
- `podcast`
- `pointer`
- `poll`
- `polygon`
- `popsicle`
- `pound`
- `powerOff`
- `printer`
- `pulse`
- `purchaseTag`
- `purchaseTagAlt`
- `pyramid`
- `qr`
- `qrScan`
- `questionMark`
- `radar`
- `radio`
- `radioCircle`
- `radioCircleMarked`
- `receipt`
- `rectangle`
- `recycle`
- `redo`
- `reflectHorizontal`
- `reflectVertical`
- `refresh`
- `registered`
- `rename`
- `repeat`
- `reply`
- `replyAll`
- `repost`
- `reset`
- `restaurant`
- `revision`
- `rewind`
- `rewindCircle`
- `rfid`
- `rightArrow`
- `rightArrowAlt`
- `rightArrowCircle`
- `rightDownArrowCircle`
- `rightIndent`
- `rightTopArrowCircle`
- `rocket`
- `rotateLeft`
- `rotateRight`
- `rss`
- `ruble`
- `ruler`
- `run`
- `rupee`
- `sad`
- `save`
- `scan`
- `scatterChart`
- `screenshot`
- `search`
- `searchAlt`
- `searchAlt2`
- `selectMultiple`
- `selection`
- `send`
- `server`
- `shapeCircle`
- `shapePolygon`
- `shapeSquare`
- `shapeTriangle`
- `share`
- `shareAlt`
- `shekel`
- `shield`
- `shieldAlt`
- `shieldAlt2`
- `shieldMinus`
- `shieldPlus`
- `shieldQuarter`
- `shieldX`
- `shocked`
- `shoppingBag`
- `show`
- `showAlt`
- `shower`
- `shuffle`
- `sidebar`
- `signal1`
- `signal2`
- `signal3`
- `signal4`
- `signal5`
- `sitemap`
- `skipNext`
- `skipNextCircle`
- `skipPrevious`
- `skipPreviousCircle`
- `sleepy`
- `slider`
- `sliderAlt`
- `slideshow`
- `smile`
- `sort`
- `sortAZ`
- `sortAlt2`
- `sortDown`
- `sortUp`
- `sortZA`
- `spa`
- `spaceBar`
- `speaker`
- `sprayCan`
- `spreadsheet`
- `square`
- `squareRounded`
- `star`
- `station`
- `stats`
- `sticker`
- `stop`
- `stopCircle`
- `stopwatch`
- `store`
- `storeAlt`
- `streetView`
- `strikethrough`
- `subdirectoryLeft`
- `subdirectoryRight`
- `sun`
- `support`
- `sushi`
- `swim`
- `sync`
- `tab`
- `table`
- `tachometer`
- `tag`
- `tagAlt`
- `targetLock`
- `task`
- `taskX`
- `taxi`
- `tennisBall`
- `terminal`
- `testTube`
- `text`
- `time`
- `timeFive`
- `timer`
- `tired`
- `toggleLeft`
- `toggleRight`
- `tone`
- `trafficCone`
- `train`
- `transfer`
- `transferAlt`
- `trash`
- `trashAlt`
- `trendingDown`
- `trendingUp`
- `trim`
- `trip`
- `trophy`
- `tv`
- `underline`
- `undo`
- `unite`
- `universalAccess`
- `unlink`
- `upArrow`
- `upArrowAlt`
- `upArrowCircle`
- `upload`
- `upsideDown`
- `upvote`
- `usb`
- `user`
- `userCheck`
- `userCircle`
- `userMinus`
- `userPin`
- `userPlus`
- `userVoice`
- `userX`
- `vector`
- `verticalBottom`
- `verticalCenter`
- `verticalTop`
- `vial`
- `video`
- `videoOff`
- `videoPlus`
- `videoRecording`
- `voicemail`
- `volume`
- `volumeFull`
- `volumeLow`
- `volumeMute`
- `walk`
- `wallet`
- `walletAlt`
- `water`
- `webcam`
- `wifi`
- `wifi0`
- `wifi1`
- `wifi2`
- `wifiOff`
- `wind`
- `window`
- `windowAlt`
- `windowClose`
- `windowOpen`
- `windows`
- `wine`
- `winkSmile`
- `winkTongue`
- `won`
- `world`
- `wrench`
- `x`
- `xCircle`
- `yen`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AbacusIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccessibilityIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddToQueueIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdjustIcon size="20" class="nav-icon" /> Settings</a>
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
<AbacusIcon
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
    <AbacusIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccessibilityIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddToQueueIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AbacusIcon size="24" />
   <AccessibilityIcon size="24" color="#4a90e2" />
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
   <AbacusIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AbacusIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AbacusIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { abacus } from '@stacksjs/iconify-bx'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(abacus, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abacus } from '@stacksjs/iconify-bx'

// Icons are typed as IconData
const myIcon: IconData = abacus
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Atisa ([Website](https://github.com/atisawd/boxicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bx/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bx/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
