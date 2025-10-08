# Font Awesome 5 Solid

> Font Awesome 5 Solid icons for stx from Iconify

## Overview

This package provides access to 1023 icons from the Font Awesome 5 Solid collection through the stx iconify integration.

**Collection ID:** `fa-solid`
**Total Icons:** 1023
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa-solid
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbacusIcon, AdIcon, AddressBookIcon } from '@stacksjs/iconify-fa-solid'

// Basic usage
const icon = AbacusIcon()

// With size
const sizedIcon = AbacusIcon({ size: 24 })

// With color
const coloredIcon = AdIcon({ color: 'red' })

// With multiple props
const customIcon = AddressBookIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbacusIcon, AdIcon, AddressBookIcon } from '@stacksjs/iconify-fa-solid'

  global.icons = {
    home: AbacusIcon({ size: 24 }),
    user: AdIcon({ size: 24, color: '#4a90e2' }),
    settings: AddressBookIcon({ size: 32 })
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
import { abacus, ad, addressBook } from '@stacksjs/iconify-fa-solid'
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

```typescript
// Via color property
const redIcon = AbacusIcon({ color: 'red' })
const blueIcon = AbacusIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbacusIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbacusIcon({ class: 'text-primary' })
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
const icon24 = AbacusIcon({ size: 24 })
const icon1em = AbacusIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbacusIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbacusIcon({ height: '1em' })
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
const smallIcon = AbacusIcon({ class: 'icon-small' })
const largeIcon = AbacusIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1023** icons:

- `abacus`
- `ad`
- `addressBook`
- `addressCard`
- `adjust`
- `airFreshener`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `allergies`
- `ambulance`
- `americanSignLanguageInterpreting`
- `anchor`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `angry`
- `ankh`
- `appleAlt`
- `archive`
- `archway`
- `arrowAltCircleDown`
- `arrowAltCircleLeft`
- `arrowAltCircleRight`
- `arrowAltCircleUp`
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
- `assistiveListeningSystems`
- `asterisk`
- `at`
- `atlas`
- `atom`
- `audioDescription`
- `award`
- `baby`
- `babyCarriage`
- `backspace`
- `backward`
- `bacon`
- `bacteria`
- `bacterium`
- `bahai`
- `balanceScale`
- `balanceScaleLeft`
- `balanceScaleRight`
- `ban`
- `bandAid`
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
- `bed`
- `beer`
- `bell`
- `bellSlash`
- `bezierCurve`
- `bible`
- `bicycle`
- `biking`
- `binoculars`
- `biohazard`
- `birthdayCake`
- `blender`
- `blenderPhone`
- `blind`
- `blog`
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
- `borderAll`
- `borderNone`
- `borderStyle`
- `bowlingBall`
- `box`
- `boxOpen`
- `boxTissue`
- `boxes`
- `braille`
- `brain`
- `breadSlice`
- `briefcase`
- `briefcaseMedical`
- `broadcastTower`
- `broom`
- `brush`
- `bug`
- `building`
- `bullhorn`
- `bullseye`
- `burn`
- `bus`
- `busAlt`
- `businessTime`
- `calculator`
- `calculatorAlt`
- `calendar`
- `calendarAlt`
- `calendarCheck`
- `calendarDay`
- `calendarMinus`
- `calendarPlus`
- `calendarTimes`
- `calendarWeek`
- `camera`
- `cameraRetro`
- `campground`
- `candyCane`
- `cannabis`
- `capsules`
- `car`
- `carAlt`
- `carBattery`
- `carCrash`
- `carSide`
- `caravan`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretSquareDown`
- `caretSquareLeft`
- `caretSquareRight`
- `caretSquareUp`
- `caretUp`
- `carrot`
- `cartArrowDown`
- `cartPlus`
- `cashRegister`
- `cat`
- `certificate`
- `chair`
- `chalkboard`
- `chalkboardTeacher`
- `chargingStation`
- `chartArea`
- `chartBar`
- `chartLine`
- `chartPie`
- `check`
- `checkCircle`
- `checkDouble`
- `checkSquare`
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
- `church`
- `circle`
- `circleNotch`
- `city`
- `clinicMedical`
- `clipboard`
- `clipboardCheck`
- `clipboardList`
- `clock`
- `clone`
- `closedCaptioning`
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
- `cocktail`
- `code`
- `codeBranch`
- `coffee`
- `cog`
- `cogs`
- `coins`
- `columns`
- `comment`
- `commentAlt`
- `commentDollar`
- `commentDots`
- `commentMedical`
- `commentSlash`
- `comments`
- `commentsDollar`
- `compactDisc`
- `compass`
- `compress`
- `compressAlt`
- `compressArrowsAlt`
- `conciergeBell`
- `cookie`
- `cookieBite`
- `copy`
- `copyright`
- `couch`
- `creditCard`
- `crop`
- `cropAlt`
- `cross`
- `crosshairs`
- `crow`
- `crown`
- `crutch`
- `cube`
- `cubes`
- `cut`
- `database`
- `deaf`
- `democrat`
- `desktop`
- `dharmachakra`
- `diagnoses`
- `dice`
- `diceD20`
- `diceD6`
- `diceFive`
- `diceFour`
- `diceOne`
- `diceSix`
- `diceThree`
- `diceTwo`
- `digitalTachograph`
- `directions`
- `disease`
- `divide`
- `dizzy`
- `dna`
- `dog`
- `dollarSign`
- `dolly`
- `dollyFlatbed`
- `donate`
- `doorClosed`
- `doorOpen`
- `dotCircle`
- `dove`
- `download`
- `draftingCompass`
- `dragon`
- `drawPolygon`
- `drum`
- `drumSteelpan`
- `drumstickBite`
- `dumbbell`
- `dumpster`
- `dumpsterFire`
- `dungeon`
- `edit`
- `egg`
- `eject`
- `ellipsisH`
- `ellipsisV`
- `emptySet`
- `envelope`
- `envelopeOpen`
- `envelopeOpenText`
- `envelopeSquare`
- `equals`
- `eraser`
- `ethernet`
- `euroSign`
- `exchangeAlt`
- `exclamation`
- `exclamationCircle`
- `exclamationTriangle`
- `expand`
- `expandAlt`
- `expandArrowsAlt`
- `externalLinkAlt`
- `externalLinkSquareAlt`
- `eye`
- `eyeDropper`
- `eyeSlash`
- `fan`
- `fastBackward`
- `fastForward`
- `faucet`
- `fax`
- `feather`
- `featherAlt`
- `female`
- `fighterJet`
- `file`
- `fileAlt`
- `fileArchive`
- `fileAudio`
- `fileCode`
- `fileContract`
- `fileCsv`
- `fileDownload`
- `fileExcel`
- `fileExport`
- `fileImage`
- `fileImport`
- `fileInvoice`
- `fileInvoiceDollar`
- `fileMedical`
- `fileMedicalAlt`
- `filePdf`
- `filePowerpoint`
- `filePrescription`
- `fileSignature`
- `fileUpload`
- `fileVideo`
- `fileWord`
- `fill`
- `fillDrip`
- `film`
- `filter`
- `fingerprint`
- `fire`
- `fireAlt`
- `fireExtinguisher`
- `firstAid`
- `fish`
- `fistRaised`
- `flag`
- `flagCheckered`
- `flagUsa`
- `flask`
- `flushed`
- `folder`
- `folderMinus`
- `folderOpen`
- `folderPlus`
- `font`
- `footballBall`
- `forward`
- `frog`
- `frown`
- `frownOpen`
- `function`
- `funnelDollar`
- `futbol`
- `gamepad`
- `gasPump`
- `gavel`
- `gem`
- `genderless`
- `ghost`
- `gift`
- `gifts`
- `glassCheers`
- `glassMartini`
- `glassMartiniAlt`
- `glassWhiskey`
- `glasses`
- `globe`
- `globeAfrica`
- `globeAmericas`
- `globeAsia`
- `globeEurope`
- `golfBall`
- `gopuram`
- `graduationCap`
- `greaterThan`
- `greaterThanEqual`
- `grimace`
- `grin`
- `grinAlt`
- `grinBeam`
- `grinBeamSweat`
- `grinHearts`
- `grinSquint`
- `grinSquintTears`
- `grinStars`
- `grinTears`
- `grinTongue`
- `grinTongueSquint`
- `grinTongueWink`
- `grinWink`
- `gripHorizontal`
- `gripLines`
- `gripLinesVertical`
- `gripVertical`
- `guitar`
- `hSquare`
- `hamburger`
- `hammer`
- `hamsa`
- `handHolding`
- `handHoldingHeart`
- `handHoldingMedical`
- `handHoldingUsd`
- `handHoldingWater`
- `handLizard`
- `handMiddleFinger`
- `handPaper`
- `handPeace`
- `handPointDown`
- `handPointLeft`
- `handPointRight`
- `handPointUp`
- `handPointer`
- `handRock`
- `handScissors`
- `handSparkles`
- `handSpock`
- `hands`
- `handsHelping`
- `handsWash`
- `handshake`
- `handshakeAltSlash`
- `handshakeSlash`
- `hanukiah`
- `hardHat`
- `hashtag`
- `hatCowboy`
- `hatCowboySide`
- `hatWizard`
- `hdd`
- `headSideCough`
- `headSideCoughSlash`
- `headSideMask`
- `headSideVirus`
- `heading`
- `headphones`
- `headphonesAlt`
- `headset`
- `heart`
- `heartBroken`
- `heartbeat`
- `helicopter`
- `highlighter`
- `hiking`
- `hippo`
- `history`
- `hockeyPuck`
- `hollyBerry`
- `home`
- `horse`
- `horseHead`
- `hospital`
- `hospitalAlt`
- `hospitalSymbol`
- `hospitalUser`
- `hotTub`
- `hotdog`
- `hotel`
- `hourglass`
- `hourglassEnd`
- `hourglassHalf`
- `hourglassStart`
- `houseDamage`
- `houseUser`
- `hryvnia`
- `iCursor`
- `iceCream`
- `icicles`
- `icons`
- `idBadge`
- `idCard`
- `idCardAlt`
- `igloo`
- `image`
- `images`
- `inbox`
- `indent`
- `industry`
- `infinity`
- `info`
- `infoCircle`
- `integral`
- `intersection`
- `italic`
- `jedi`
- `joint`
- `journalWhills`
- `kaaba`
- `key`
- `keyboard`
- `khanda`
- `kiss`
- `kissBeam`
- `kissWinkHeart`
- `kiwiBird`
- `lambda`
- `landmark`
- `language`
- `laptop`
- `laptopCode`
- `laptopHouse`
- `laptopMedical`
- `laugh`
- `laughBeam`
- `laughSquint`
- `laughWink`
- `layerGroup`
- `leaf`
- `lemon`
- `lessThan`
- `lessThanEqual`
- `levelDownAlt`
- `levelUpAlt`
- `lifeRing`
- `lightbulb`
- `link`
- `liraSign`
- `list`
- `listAlt`
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
- `lungs`
- `lungsVirus`
- `magic`
- `magnet`
- `mailBulk`
- `male`
- `map`
- `mapMarked`
- `mapMarkedAlt`
- `mapMarker`
- `mapMarkerAlt`
- `mapPin`
- `mapSigns`
- `marker`
- `mars`
- `marsDouble`
- `marsStroke`
- `marsStrokeH`
- `marsStrokeV`
- `mask`
- `medal`
- `medkit`
- `meh`
- `mehBlank`
- `mehRollingEyes`
- `memory`
- `menorah`
- `mercury`
- `meteor`
- `microchip`
- `microphone`
- `microphoneAlt`
- `microphoneAltSlash`
- `microphoneSlash`
- `microscope`
- `minus`
- `minusCircle`
- `minusSquare`
- `mitten`
- `mobile`
- `mobileAlt`
- `moneyBill`
- `moneyBillAlt`
- `moneyBillWave`
- `moneyBillWaveAlt`
- `moneyCheck`
- `moneyCheckAlt`
- `monument`
- `moon`
- `mortarPestle`
- `mosque`
- `motorcycle`
- `mountain`
- `mouse`
- `mousePointer`
- `mugHot`
- `music`
- `networkWired`
- `neuter`
- `newspaper`
- `notEqual`
- `notesMedical`
- `objectGroup`
- `objectUngroup`
- `oilCan`
- `om`
- `omega`
- `otter`
- `outdent`
- `pager`
- `paintBrush`
- `paintRoller`
- `palette`
- `pallet`
- `paperPlane`
- `paperclip`
- `parachuteBox`
- `paragraph`
- `parking`
- `passport`
- `pastafarianism`
- `paste`
- `pause`
- `pauseCircle`
- `paw`
- `peace`
- `pen`
- `penAlt`
- `penFancy`
- `penNib`
- `penSquare`
- `pencilAlt`
- `pencilRuler`
- `peopleArrows`
- `peopleCarry`
- `pepperHot`
- `percent`
- `percentage`
- `personBooth`
- `phone`
- `phoneAlt`
- `phoneSlash`
- `phoneSquare`
- `phoneSquareAlt`
- `phoneVolume`
- `photoVideo`
- `pi`
- `piggyBank`
- `pills`
- `pizzaSlice`
- `placeOfWorship`
- `plane`
- `planeArrival`
- `planeDeparture`
- `planeSlash`
- `play`
- `playCircle`
- `plug`
- `plus`
- `plusCircle`
- `plusSquare`
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
- `projectDiagram`
- `pumpMedical`
- `pumpSoap`
- `puzzlePiece`
- `qrcode`
- `question`
- `questionCircle`
- `quidditch`
- `quoteLeft`
- `quoteRight`
- `quran`
- `radiation`
- `radiationAlt`
- `rainbow`
- `random`
- `receipt`
- `recordVinyl`
- `recycle`
- `redo`
- `redoAlt`
- `registered`
- `removeFormat`
- `reply`
- `replyAll`
- `republican`
- `restroom`
- `retweet`
- `ribbon`
- `ring`
- `road`
- `robot`
- `rocket`
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
- `sadTear`
- `satellite`
- `satelliteDish`
- `save`
- `school`
- `screwdriver`
- `scroll`
- `sdCard`
- `search`
- `searchDollar`
- `searchLocation`
- `searchMinus`
- `searchPlus`
- `seedling`
- `server`
- `shapes`
- `share`
- `shareAlt`
- `shareAltSquare`
- `shareSquare`
- `shekelSign`
- `shieldAlt`
- `shieldVirus`
- `ship`
- `shippingFast`
- `shoePrints`
- `shoppingBag`
- `shoppingBasket`
- `shoppingCart`
- `shower`
- `shuttleVan`
- `sigma`
- `sign`
- `signInAlt`
- `signLanguage`
- `signOutAlt`
- `signal`
- `signalAlt`
- `signalAltSlash`
- `signalSlash`
- `signature`
- `simCard`
- `sink`
- `sitemap`
- `skating`
- `skiing`
- `skiingNordic`
- `skull`
- `skullCrossbones`
- `slash`
- `sleigh`
- `slidersH`
- `smile`
- `smileBeam`
- `smileWink`
- `smog`
- `smoking`
- `smokingBan`
- `sms`
- `snowboarding`
- `snowflake`
- `snowman`
- `snowplow`
- `soap`
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
- `spa`
- `spaceShuttle`
- `spellCheck`
- `spider`
- `spinner`
- `splotch`
- `sprayCan`
- `square`
- `squareFull`
- `squareRoot`
- `squareRootAlt`
- `stamp`
- `star`
- `starAndCrescent`
- `starHalf`
- `starHalfAlt`
- `starOfDavid`
- `starOfLife`
- `stepBackward`
- `stepForward`
- `stethoscope`
- `stickyNote`
- `stop`
- `stopCircle`
- `stopwatch`
- `stopwatch20`
- `store`
- `storeAlt`
- `storeAltSlash`
- `storeSlash`
- `stream`
- `streetView`
- `strikethrough`
- `stroopwafel`
- `subscript`
- `subway`
- `suitcase`
- `suitcaseRolling`
- `sun`
- `superscript`
- `surprise`
- `swatchbook`
- `swimmer`
- `swimmingPool`
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
- `tally`
- `tape`
- `tasks`
- `taxi`
- `teeth`
- `teethOpen`
- `temperatureHigh`
- `temperatureLow`
- `tenge`
- `terminal`
- `textHeight`
- `textWidth`
- `th`
- `thLarge`
- `thList`
- `theaterMasks`
- `thermometer`
- `thermometerEmpty`
- `thermometerFull`
- `thermometerHalf`
- `thermometerQuarter`
- `thermometerThreeQuarters`
- `theta`
- `thumbsDown`
- `thumbsUp`
- `thumbtack`
- `ticketAlt`
- `tilde`
- `times`
- `timesCircle`
- `tint`
- `tintSlash`
- `tired`
- `toggleOff`
- `toggleOn`
- `toilet`
- `toiletPaper`
- `toiletPaperSlash`
- `toolbox`
- `tools`
- `tooth`
- `torah`
- `toriiGate`
- `tractor`
- `trademark`
- `trafficLight`
- `trailer`
- `train`
- `tram`
- `transgender`
- `transgenderAlt`
- `trash`
- `trashAlt`
- `trashRestore`
- `trashRestoreAlt`
- `tree`
- `trophy`
- `truck`
- `truckLoading`
- `truckMonster`
- `truckMoving`
- `truckPickup`
- `tshirt`
- `tty`
- `tv`
- `umbrella`
- `umbrellaBeach`
- `underline`
- `undo`
- `undoAlt`
- `union`
- `universalAccess`
- `university`
- `unlink`
- `unlock`
- `unlockAlt`
- `upload`
- `user`
- `userAlt`
- `userAltSlash`
- `userAstronaut`
- `userCheck`
- `userCircle`
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
- `userTag`
- `userTie`
- `userTimes`
- `users`
- `usersCog`
- `usersSlash`
- `utensilSpoon`
- `utensils`
- `valueAbsolute`
- `vectorSquare`
- `venus`
- `venusDouble`
- `venusMars`
- `vest`
- `vestPatches`
- `vial`
- `vials`
- `video`
- `videoSlash`
- `vihara`
- `virus`
- `virusSlash`
- `viruses`
- `voicemail`
- `volleyballBall`
- `volume`
- `volumeDown`
- `volumeMute`
- `volumeOff`
- `volumeSlash`
- `volumeUp`
- `voteYea`
- `vrCardboard`
- `walking`
- `wallet`
- `warehouse`
- `water`
- `waveSquare`
- `weight`
- `weightHanging`
- `wheelchair`
- `wifi`
- `wifiSlash`
- `wind`
- `windowClose`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`
- `wineBottle`
- `wineGlass`
- `wineGlassAlt`
- `wonSign`
- `wrench`
- `xRay`
- `yenSign`
- `yinYang`

## Usage Examples

### Navigation Menu

```html
@js
  import { AbacusIcon, AdIcon, AddressBookIcon, AddressCardIcon } from '@stacksjs/iconify-fa-solid'

  global.navIcons = {
    home: AbacusIcon({ size: 20, class: 'nav-icon' }),
    about: AdIcon({ size: 20, class: 'nav-icon' }),
    contact: AddressBookIcon({ size: 20, class: 'nav-icon' }),
    settings: AddressCardIcon({ size: 20, class: 'nav-icon' })
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
import { AbacusIcon } from '@stacksjs/iconify-fa-solid'

const icon = AbacusIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbacusIcon, AdIcon, AddressBookIcon } from '@stacksjs/iconify-fa-solid'

const successIcon = AbacusIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddressBookIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbacusIcon, AdIcon } from '@stacksjs/iconify-fa-solid'
   const icon = AbacusIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abacus, ad } from '@stacksjs/iconify-fa-solid'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abacus, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbacusIcon, AdIcon } from '@stacksjs/iconify-fa-solid'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fa-solid'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbacusIcon } from '@stacksjs/iconify-fa-solid'
     global.icon = AbacusIcon({ size: 24 })
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
   const icon = AbacusIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abacus } from '@stacksjs/iconify-fa-solid'

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

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa-solid/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa-solid/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
