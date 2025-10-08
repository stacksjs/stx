# Fluent Emoji High Contrast

> Fluent Emoji High Contrast icons for stx from Iconify

## Overview

This package provides access to 1594 icons from the Fluent Emoji High Contrast collection through the stx iconify integration.

**Collection ID:** `fluent-emoji-high-contrast`
**Total Icons:** 1594
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-emoji))
**License:** MIT ([Details](https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE))
**Category:** Emoji
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fluent-emoji-high-contrast
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 1stPlaceMedalIcon, 2ndPlaceMedalIcon, 3rdPlaceMedalIcon } from '@stacksjs/iconify-fluent-emoji-high-contrast'

// Basic usage
const icon = 1stPlaceMedalIcon()

// With size
const sizedIcon = 1stPlaceMedalIcon({ size: 24 })

// With color
const coloredIcon = 2ndPlaceMedalIcon({ color: 'red' })

// With multiple props
const customIcon = 3rdPlaceMedalIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 1stPlaceMedalIcon, 2ndPlaceMedalIcon, 3rdPlaceMedalIcon } from '@stacksjs/iconify-fluent-emoji-high-contrast'

  global.icons = {
    home: 1stPlaceMedalIcon({ size: 24 }),
    user: 2ndPlaceMedalIcon({ size: 24, color: '#4a90e2' }),
    settings: 3rdPlaceMedalIcon({ size: 32 })
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
import { 1stPlaceMedal, 2ndPlaceMedal, 3rdPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(1stPlaceMedal, { size: 24 })
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
const redIcon = 1stPlaceMedalIcon({ color: 'red' })
const blueIcon = 1stPlaceMedalIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 1stPlaceMedalIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 1stPlaceMedalIcon({ class: 'text-primary' })
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
const icon24 = 1stPlaceMedalIcon({ size: 24 })
const icon1em = 1stPlaceMedalIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 1stPlaceMedalIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 1stPlaceMedalIcon({ height: '1em' })
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
const smallIcon = 1stPlaceMedalIcon({ class: 'icon-small' })
const largeIcon = 1stPlaceMedalIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1594** icons:

- `1stPlaceMedal`
- `2ndPlaceMedal`
- `3rdPlaceMedal`
- `aButtonBloodType`
- `abButtonBloodType`
- `abacus`
- `accordion`
- `adhesiveBandage`
- `admissionTickets`
- `aerialTramway`
- `airplane`
- `airplaneArrival`
- `airplaneDeparture`
- `alarmClock`
- `alembic`
- `alien`
- `alienMonster`
- `ambulance`
- `americanFootball`
- `amphora`
- `anatomicalHeart`
- `anchor`
- `angerSymbol`
- `angryFace`
- `angryFaceWithHorns`
- `anguishedFace`
- `ant`
- `antennaBars`
- `anxiousFaceWithSweat`
- `aquarius`
- `aries`
- `articulatedLorry`
- `artist`
- `artistPalette`
- `astonishedFace`
- `astronaut`
- `atmSign`
- `atomSymbol`
- `autoRickshaw`
- `automobile`
- `avocado`
- `axe`
- `bButtonBloodType`
- `baby`
- `babyAngel`
- `babyBottle`
- `babyChick`
- `babySymbol`
- `backArrow`
- `backhandIndexPointingDown`
- `backhandIndexPointingLeft`
- `backhandIndexPointingUp`
- `backpack`
- `bacon`
- `badger`
- `badminton`
- `bagel`
- `baggageClaim`
- `baguetteBread`
- `balanceScale`
- `balletShoes`
- `balloon`
- `ballotBoxWithBallot`
- `banana`
- `banjo`
- `bank`
- `barChart`
- `barberPole`
- `baseball`
- `basket`
- `basketball`
- `bat`
- `bathtub`
- `battery`
- `beachWithUmbrella`
- `beamingFaceWithSmilingEyes`
- `beans`
- `bear`
- `beatingHeart`
- `beaver`
- `bed`
- `beerMug`
- `beetle`
- `bell`
- `bellPepper`
- `bellWithSlash`
- `bellhopBell`
- `bentoBox`
- `beverageBox`
- `bicycle`
- `bikini`
- `billedCap`
- `biohazard`
- `bird`
- `birthdayCake`
- `bison`
- `bitingLip`
- `blackCat`
- `blackCircle`
- `blackFlag`
- `blackHeart`
- `blackLargeSquare`
- `blackMediumSmallSquare`
- `blackMediumSquare`
- `blackNib`
- `blackSmallSquare`
- `blackSquareButton`
- `blackbird`
- `blossom`
- `blowfish`
- `blueBook`
- `blueCircle`
- `blueHeart`
- `blueSquare`
- `blueberries`
- `boar`
- `bomb`
- `bone`
- `bookmark`
- `bookmarkTabs`
- `books`
- `boomerang`
- `bottleWithPoppingCork`
- `bouquet`
- `bowAndArrow`
- `bowlWithSpoon`
- `bowling`
- `boxingGlove`
- `boy`
- `brain`
- `bread`
- `breastFeeding`
- `brick`
- `bridgeAtNight`
- `briefcase`
- `briefs`
- `brightButton`
- `broccoli`
- `brokenChain`
- `brokenHeart`
- `broom`
- `brownCircle`
- `brownHeart`
- `brownMushroom`
- `brownSquare`
- `bubbleTea`
- `bubbles`
- `bucket`
- `bug`
- `buildingConstruction`
- `bulletTrain`
- `bullseye`
- `burrito`
- `bus`
- `busStop`
- `bustInSilhouette`
- `bustsInSilhouette`
- `butter`
- `butterfly`
- `cactus`
- `calendar`
- `callMeHand`
- `camel`
- `camera`
- `cameraWithFlash`
- `camping`
- `cancer`
- `candle`
- `candy`
- `cannedFood`
- `canoe`
- `capricorn`
- `cardFileBox`
- `cardIndex`
- `cardIndexDividers`
- `carouselHorse`
- `carpStreamer`
- `carpentrySaw`
- `carrot`
- `castle`
- `cat`
- `catFace`
- `catWithTearsOfJoy`
- `catWithWrySmile`
- `chains`
- `chair`
- `chartDecreasing`
- `chartIncreasing`
- `chartIncreasingWithYen`
- `checkBoxWithCheck`
- `checkMark`
- `checkMarkButton`
- `cheeseWedge`
- `chequeredFlag`
- `cherries`
- `cherryBlossom`
- `chessPawn`
- `chestnut`
- `chicken`
- `child`
- `childrenCrossing`
- `chipmunk`
- `chocolateBar`
- `chopsticks`
- `christmasTree`
- `church`
- `cigarette`
- `cinema`
- `circledM`
- `circusTent`
- `cityscape`
- `cityscapeAtDusk`
- `clButton`
- `clamp`
- `clapperBoard`
- `clappingHands`
- `classicalBuilding`
- `clinkingBeerMugs`
- `clinkingGlasses`
- `clipboard`
- `clockwiseVerticalArrows`
- `closedBook`
- `closedMailboxWithLoweredFlag`
- `closedMailboxWithRaisedFlag`
- `closedUmbrella`
- `cloud`
- `cloudWithLightning`
- `cloudWithLightningAndRain`
- `cloudWithRain`
- `cloudWithSnow`
- `clownFace`
- `clubSuit`
- `clutchBag`
- `coat`
- `cockroach`
- `cocktailGlass`
- `coconut`
- `coffin`
- `coin`
- `coldFace`
- `collision`
- `comet`
- `compass`
- `computerDisk`
- `computerMouse`
- `confettiBall`
- `confoundedFace`
- `confusedFace`
- `construction`
- `constructionWorker`
- `controlKnobs`
- `convenienceStore`
- `cook`
- `cookedRice`
- `cookie`
- `cooking`
- `coolButton`
- `copyright`
- `coral`
- `couchAndLamp`
- `counterclockwiseArrowsButton`
- `cow`
- `cowFace`
- `cowboyHatFace`
- `crab`
- `crayon`
- `creditCard`
- `crescentMoon`
- `cricket`
- `cricketGame`
- `crocodile`
- `croissant`
- `crossMark`
- `crossMarkButton`
- `crossedFingers`
- `crossedFlags`
- `crossedSwords`
- `crown`
- `crutch`
- `cryingCat`
- `cryingFace`
- `crystalBall`
- `cucumber`
- `cupWithStraw`
- `cupcake`
- `curlingStone`
- `curlyLoop`
- `currencyExchange`
- `curryRice`
- `custard`
- `customs`
- `cutOfMeat`
- `cyclone`
- `dagger`
- `dango`
- `dashingAway`
- `deciduousTree`
- `deer`
- `deliveryTruck`
- `departmentStore`
- `derelictHouse`
- `desert`
- `desertIsland`
- `desktopComputer`
- `detective`
- `diamondSuit`
- `diamondWithADot`
- `dimButton`
- `disappointedFace`
- `disguisedFace`
- `divide`
- `divingMask`
- `diyaLamp`
- `dizzy`
- `dna`
- `dodo`
- `dog`
- `dogFace`
- `dollarBanknote`
- `dolphin`
- `donkey`
- `door`
- `dottedLineFace`
- `dottedSixPointedStar`
- `doubleCurlyLoop`
- `doubleExclamationMark`
- `doughnut`
- `dove`
- `downArrow`
- `downLeftArrow`
- `downRightArrow`
- `downcastFaceWithSweat`
- `downwardsButton`
- `dragon`
- `dragonFace`
- `dress`
- `droolingFace`
- `dropOfBlood`
- `droplet`
- `drum`
- `duck`
- `dumpling`
- `dvd`
- `eMail`
- `eagle`
- `ear`
- `earOfCorn`
- `earWithHearingAid`
- `egg`
- `eggplant`
- `eightOclock`
- `eightPointedStar`
- `eightSpokedAsterisk`
- `eightThirty`
- `ejectButton`
- `electricPlug`
- `elephant`
- `elevator`
- `elevenOclock`
- `elevenThirty`
- `emptyNest`
- `endArrow`
- `envelope`
- `envelopeWithArrow`
- `euroBanknote`
- `evergreenTree`
- `ewe`
- `exclamationQuestionMark`
- `explodingHead`
- `expressionlessFace`
- `eye`
- `eyeInSpeechBubble`
- `eyes`
- `faceBlowingAKiss`
- `faceExhaling`
- `faceHoldingBackTears`
- `faceInClouds`
- `faceSavoringFood`
- `faceScreamingInFear`
- `faceVomiting`
- `faceWithDiagonalMouth`
- `faceWithHandOverMouth`
- `faceWithHeadBandage`
- `faceWithMedicalMask`
- `faceWithMonocle`
- `faceWithOpenEyesAndHandOverMouth`
- `faceWithOpenMouth`
- `faceWithPeekingEye`
- `faceWithRaisedEyebrow`
- `faceWithRollingEyes`
- `faceWithSpiralEyes`
- `faceWithSteamFromNose`
- `faceWithSymbolsOnMouth`
- `faceWithTearsOfJoy`
- `faceWithThermometer`
- `faceWithTongue`
- `faceWithoutMouth`
- `factory`
- `factoryWorker`
- `falafel`
- `fallenLeaf`
- `farmer`
- `fastDownButton`
- `fastForwardButton`
- `fastReverseButton`
- `fastUpButton`
- `faxMachine`
- `fearfulFace`
- `feather`
- `femaleSign`
- `ferrisWheel`
- `ferry`
- `fieldHockey`
- `fileCabinet`
- `fileFolder`
- `filmFrames`
- `filmProjector`
- `fire`
- `fireEngine`
- `fireExtinguisher`
- `firecracker`
- `firefighter`
- `fireworks`
- `firstQuarterMoon`
- `firstQuarterMoonFace`
- `fish`
- `fishCakeWithSwirl`
- `fishingPole`
- `fiveOclock`
- `fiveThirty`
- `flagInHole`
- `flamingo`
- `flashlight`
- `flatShoe`
- `flatbread`
- `fleurDeLis`
- `flexedBiceps`
- `floppyDisk`
- `flowerPlayingCards`
- `flushedFace`
- `flute`
- `fly`
- `flyingDisc`
- `flyingSaucer`
- `fog`
- `foggy`
- `foldedHands`
- `foldingHandFan`
- `fondue`
- `foot`
- `footprints`
- `forkAndKnife`
- `forkAndKnifeWithPlate`
- `fortuneCookie`
- `fountain`
- `fountainPen`
- `fourLeafClover`
- `fourOclock`
- `fourThirty`
- `fox`
- `framedPicture`
- `freeButton`
- `frenchFries`
- `friedShrimp`
- `frog`
- `frontFacingBabyChick`
- `frowningFace`
- `frowningFaceWithOpenMouth`
- `fuelPump`
- `fullMoon`
- `fullMoonFace`
- `funeralUrn`
- `gameDie`
- `garlic`
- `gear`
- `gemStone`
- `gemini`
- `ghost`
- `gingerRoot`
- `giraffe`
- `girl`
- `glassOfMilk`
- `glasses`
- `globeShowingAmericas`
- `globeShowingAsiaAustralia`
- `globeShowingEuropeAfrica`
- `globeWithMeridians`
- `gloves`
- `glowingStar`
- `goalNet`
- `goat`
- `goblin`
- `goggles`
- `goose`
- `gorilla`
- `graduationCap`
- `grapes`
- `greenApple`
- `greenBook`
- `greenCircle`
- `greenHeart`
- `greenSalad`
- `greenSquare`
- `greyHeart`
- `grimacingFace`
- `grinningCat`
- `grinningCatWithSmilingEyes`
- `grinningFace`
- `grinningFaceWithBigEyes`
- `grinningFaceWithSmilingEyes`
- `grinningFaceWithSweat`
- `grinningSquintingFace`
- `growingHeart`
- `guard`
- `guideDog`
- `guitar`
- `hairPick`
- `hamburger`
- `hammer`
- `hammerAndPick`
- `hammerAndWrench`
- `hamsa`
- `hamster`
- `handWithFingersSplayed`
- `handWithIndexFingerAndThumbCrossed`
- `handbag`
- `handshake`
- `hatchingChick`
- `headShakingHorizontally`
- `headShakingVertically`
- `headphone`
- `headstone`
- `healthWorker`
- `hearNoEvilMonkey`
- `heartDecoration`
- `heartExclamation`
- `heartHands`
- `heartOnFire`
- `heartSuit`
- `heartWithArrow`
- `heartWithRibbon`
- `heavyDollarSign`
- `heavyEqualsSign`
- `hedgehog`
- `helicopter`
- `herb`
- `hibiscus`
- `highHeeledShoe`
- `highSpeedTrain`
- `highVoltage`
- `hikingBoot`
- `hinduTemple`
- `hippopotamus`
- `hole`
- `hollowRedCircle`
- `honeyPot`
- `honeybee`
- `hook`
- `horizontalTrafficLight`
- `horse`
- `horseFace`
- `horseRacing`
- `hospital`
- `hotBeverage`
- `hotDog`
- `hotFace`
- `hotPepper`
- `hotSprings`
- `hotel`
- `hourglassDone`
- `hourglassNotDone`
- `house`
- `houseWithGarden`
- `houses`
- `huggingFace`
- `hundredPoints`
- `hushedFace`
- `hut`
- `hyacinth`
- `ice`
- `iceCream`
- `iceHockey`
- `iceSkate`
- `idButton`
- `identificationCard`
- `inboxTray`
- `incomingEnvelope`
- `indexPointingAtTheViewer`
- `indexPointingUp`
- `infinity`
- `information`
- `inputLatinLetters`
- `inputLatinLowercase`
- `inputLatinUppercase`
- `inputNumbers`
- `inputSymbols`
- `jackOLantern`
- `japaneseAcceptableButton`
- `japaneseApplicationButton`
- `japaneseBargainButton`
- `japaneseCastle`
- `japaneseCongratulationsButton`
- `japaneseDiscountButton`
- `japaneseDolls`
- `japaneseFreeOfChargeButton`
- `japaneseHereButton`
- `japaneseMonthlyAmountButton`
- `japaneseNoVacancyButton`
- `japaneseNotFreeOfChargeButton`
- `japaneseOpenForBusinessButton`
- `japanesePassingGradeButton`
- `japanesePostOffice`
- `japaneseProhibitedButton`
- `japaneseReservedButton`
- `japaneseSecretButton`
- `japaneseServiceChargeButton`
- `japaneseSymbolForBeginner`
- `japaneseVacancyButton`
- `jar`
- `jeans`
- `jellyfish`
- `joker`
- `joystick`
- `judge`
- `kaaba`
- `kangaroo`
- `key`
- `keyboard`
- `keycap0`
- `keycap1`
- `keycap10`
- `keycap2`
- `keycap3`
- `keycap4`
- `keycap5`
- `keycap6`
- `keycap7`
- `keycap8`
- `keycap9`
- `keycapAsterisk`
- `keycapHashtag`
- `khanda`
- `kickScooter`
- `kimono`
- `kissMark`
- `kissingCat`
- `kissingFace`
- `kissingFaceWithClosedEyes`
- `kissingFaceWithSmilingEyes`
- `kitchenKnife`
- `kite`
- `kiwiFruit`
- `knockedOutFace`
- `knot`
- `koala`
- `labCoat`
- `label`
- `lacrosse`
- `ladder`
- `ladyBeetle`
- `laptop`
- `largeBlueDiamond`
- `largeOrangeDiamond`
- `lastQuarterMoon`
- `lastQuarterMoonFace`
- `lastTrackButton`
- `latinCross`
- `leafFlutteringInWind`
- `leafyGreen`
- `ledger`
- `leftArrow`
- `leftArrowCurvingRight`
- `leftFacingFist`
- `leftLuggage`
- `leftRightArrow`
- `leftSpeechBubble`
- `leftwardsHand`
- `leftwardsPushingHand`
- `leg`
- `lemon`
- `leo`
- `leopard`
- `levelSlider`
- `libra`
- `lightBlueHeart`
- `lightBulb`
- `lightRail`
- `lime`
- `link`
- `linkedPaperclips`
- `lion`
- `lipstick`
- `litterInBinSign`
- `lizard`
- `llama`
- `lobster`
- `locked`
- `lockedWithKey`
- `lockedWithPen`
- `locomotive`
- `lollipop`
- `longDrum`
- `lotionBottle`
- `lotus`
- `loudlyCryingFace`
- `loudspeaker`
- `loveHotel`
- `loveLetter`
- `loveYouGesture`
- `lowBattery`
- `luggage`
- `lungs`
- `lyingFace`
- `magicWand`
- `magnet`
- `magnifyingGlassTiltedLeft`
- `magnifyingGlassTiltedRight`
- `mahjongRedDragon`
- `maleSign`
- `mammoth`
- `man`
- `manArtist`
- `manAstronaut`
- `manBald`
- `manBeard`
- `manBiking`
- `manBlondeHair`
- `manBouncingBall`
- `manBowing`
- `manCartwheeling`
- `manClimbing`
- `manConstructionWorker`
- `manCook`
- `manCurlyHair`
- `manDancing`
- `manDeaf`
- `manDetective`
- `manElf`
- `manFacepalming`
- `manFactoryWorker`
- `manFairy`
- `manFarmer`
- `manFeedingBaby`
- `manFirefighter`
- `manFrowning`
- `manGenie`
- `manGesturingNo`
- `manGesturingOk`
- `manGettingHaircut`
- `manGettingMassage`
- `manGolfing`
- `manGuard`
- `manHealthWorker`
- `manInLotusPosition`
- `manInManualWheelchair`
- `manInManualWheelchairFacingRight`
- `manInMotorizedWheelchair`
- `manInMotorizedWheelchairFacingRight`
- `manInSteamyRoom`
- `manInTuxedo`
- `manJudge`
- `manJuggling`
- `manKneeling`
- `manKneelingFacingRight`
- `manLiftingWeights`
- `manMage`
- `manMechanic`
- `manMerpeople`
- `manMountainBiking`
- `manOfficeWorker`
- `manPilot`
- `manPlayingHandball`
- `manPlayingWaterPolo`
- `manPoliceOfficer`
- `manPouting`
- `manRaisingHand`
- `manRedHair`
- `manRowingBoat`
- `manRunning`
- `manRunningFacingRight`
- `manScientist`
- `manShrugging`
- `manSinger`
- `manStanding`
- `manStudent`
- `manSuperhero`
- `manSupervillain`
- `manSurfing`
- `manSwimming`
- `manTeacher`
- `manTechnologist`
- `manTippingHand`
- `manVampire`
- `manWalking`
- `manWalkingFacingRight`
- `manWearingTurban`
- `manWhiteHair`
- `manWithBunnyEars`
- `manWithVeil`
- `manWithWhiteCane`
- `manWithWhiteCaneFacingRight`
- `manWrestling`
- `manZombie`
- `mango`
- `mansShoe`
- `mantelpieceClock`
- `manualWheelchair`
- `mapOfJapan`
- `mapleLeaf`
- `maracas`
- `martialArtsUniform`
- `mate`
- `meatOnBone`
- `mechanic`
- `mechanicalArm`
- `mechanicalLeg`
- `medicalSymbol`
- `megaphone`
- `melon`
- `meltingFace`
- `memo`
- `mendingHeart`
- `menorah`
- `mensRoom`
- `metro`
- `microbe`
- `microphone`
- `microscope`
- `middleFinger`
- `militaryHelmet`
- `militaryMedal`
- `milkyWay`
- `minibus`
- `minus`
- `mirror`
- `mirrorBall`
- `moai`
- `mobilePhone`
- `mobilePhoneOff`
- `mobilePhoneWithArrow`
- `moneyBag`
- `moneyMouthFace`
- `moneyWithWings`
- `monkey`
- `monkeyFace`
- `monorail`
- `moonCake`
- `moonViewingCeremony`
- `moose`
- `mosque`
- `mosquito`
- `motorBoat`
- `motorScooter`
- `motorcycle`
- `motorizedWheelchair`
- `motorway`
- `mountFuji`
- `mountain`
- `mountainCableway`
- `mountainRailway`
- `mouse`
- `mouseFace`
- `mouseTrap`
- `mouth`
- `movieCamera`
- `mrsClaus`
- `multiply`
- `mushroom`
- `musicalKeyboard`
- `musicalNote`
- `musicalNotes`
- `musicalScore`
- `mutedSpeaker`
- `mxClaus`
- `nailPolish`
- `nameBadge`
- `nationalPark`
- `nauseatedFace`
- `nazarAmulet`
- `necktie`
- `nerdFace`
- `nestWithEggs`
- `nestingDolls`
- `neutralFace`
- `newButton`
- `newMoon`
- `newMoonFace`
- `newspaper`
- `nextTrackButton`
- `ngButton`
- `nightWithStars`
- `nineOclock`
- `nineThirty`
- `ninja`
- `noBicycles`
- `noEntry`
- `noLittering`
- `noMobilePhones`
- `noOneUnderEighteen`
- `noPedestrians`
- `noSmoking`
- `nonPotableWater`
- `nose`
- `notebook`
- `notebookWithDecorativeCover`
- `nutAndBolt`
- `oButtonBloodType`
- `octopus`
- `oden`
- `officeBuilding`
- `officeWorker`
- `ogre`
- `oilDrum`
- `okButton`
- `okHand`
- `oldKey`
- `oldMan`
- `oldWoman`
- `olderPerson`
- `olive`
- `om`
- `onArrow`
- `oncomingAutomobile`
- `oncomingBus`
- `oncomingFist`
- `oncomingPoliceCar`
- `oncomingTaxi`
- `oneOclock`
- `onePieceSwimsuit`
- `oneThirty`
- `onion`
- `openBook`
- `openFileFolder`
- `openHands`
- `openMailboxWithLoweredFlag`
- `openMailboxWithRaisedFlag`
- `ophiuchus`
- `opticalDisk`
- `orangeBook`
- `orangeCircle`
- `orangeHeart`
- `orangeSquare`
- `orangutan`
- `orthodoxCross`
- `otter`
- `outboxTray`
- `owl`
- `ox`
- `oyster`
- `pButton`
- `package`
- `pageFacingUp`
- `pageWithCurl`
- `pager`
- `paintbrush`
- `palmDownHand`
- `palmTree`
- `palmUpHand`
- `palmsUpTogether`
- `pancakes`
- `panda`
- `paperclip`
- `parachute`
- `parrot`
- `partAlternationMark`
- `partyPopper`
- `partyingFace`
- `passengerShip`
- `passportControl`
- `pauseButton`
- `pawPrints`
- `peaPod`
- `peaceSymbol`
- `peach`
- `peacock`
- `peanuts`
- `pear`
- `pen`
- `pencil`
- `penguin`
- `pensiveFace`
- `peopleHugging`
- `performingArts`
- `perseveringFace`
- `person`
- `personBald`
- `personBeard`
- `personBiking`
- `personBlondeHair`
- `personBouncingBall`
- `personBowing`
- `personCartwheeling`
- `personClimbing`
- `personCurlyHair`
- `personDeaf`
- `personElf`
- `personFacepalming`
- `personFairy`
- `personFeedingBaby`
- `personFencing`
- `personFrowning`
- `personGenie`
- `personGesturingNo`
- `personGesturingOk`
- `personGettingHaircut`
- `personGettingMassage`
- `personGolfing`
- `personInBed`
- `personInLotusPosition`
- `personInManualWheelchair`
- `personInManualWheelchairFacingRight`
- `personInMotorizedWheelchair`
- `personInMotorizedWheelchairFacingRight`
- `personInSteamyRoom`
- `personInSuitLevitating`
- `personInTuxedo`
- `personJuggling`
- `personKneeling`
- `personKneelingFacingRight`
- `personLiftingWeights`
- `personMage`
- `personMerpeople`
- `personMountainBiking`
- `personPlayingHandball`
- `personPlayingWaterPolo`
- `personPouting`
- `personRaisingHand`
- `personRedHair`
- `personRowingBoat`
- `personRunning`
- `personRunningFacingRight`
- `personShrugging`
- `personStanding`
- `personSuperhero`
- `personSupervillain`
- `personSurfing`
- `personSwimming`
- `personTakingBath`
- `personTippingHand`
- `personVampire`
- `personWalking`
- `personWalkingFacingRight`
- `personWearingTurban`
- `personWhiteHair`
- `personWithBunnyEars`
- `personWithCrown`
- `personWithSkullcap`
- `personWithVeil`
- `personWithWhiteCane`
- `personWithWhiteCaneFacingRight`
- `personWrestling`
- `personZombie`
- `petriDish`
- `phoenixBird`
- `piata`
- `pick`
- `pickupTruck`
- `pie`
- `pig`
- `pigFace`
- `pigNose`
- `pileOfPoo`
- `pill`
- `pilot`
- `pinchedFingers`
- `pinchingHand`
- `pineDecoration`
- `pineapple`
- `pingPong`
- `pinkHeart`
- `pirateFlag`
- `pisces`
- `pizza`
- `placard`
- `placeOfWorship`
- `playButton`
- `playOrPauseButton`
- `playgroundSlide`
- `pleadingFace`
- `plunger`
- `plus`
- `polarBear`
- `policeCar`
- `policeCarLight`
- `policeOfficer`
- `poodle`
- `pool8Ball`
- `popcorn`
- `postOffice`
- `postalHorn`
- `postbox`
- `potOfFood`
- `potableWater`
- `potato`
- `pottedPlant`
- `poultryLeg`
- `poundBanknote`
- `pouringLiquid`
- `poutingCat`
- `poutingFace`
- `prayerBeads`
- `pregnantMan`
- `pregnantPerson`
- `pregnantWoman`
- `pretzel`
- `prince`
- `princess`
- `printer`
- `prohibited`
- `purpleCircle`
- `purpleHeart`
- `purpleSquare`
- `purse`
- `pushpin`
- `puzzlePiece`
- `rabbit`
- `rabbitFace`
- `raccoon`
- `racingCar`
- `radio`
- `radioButton`
- `radioactive`
- `railwayCar`
- `railwayTrack`
- `rainbow`
- `rainbowFlag`
- `raisedBackOfHand`
- `raisedFist`
- `raisedHand`
- `raisingHands`
- `ram`
- `rat`
- `razor`
- `receipt`
- `recordButton`
- `recyclingSymbol`
- `redApple`
- `redCircle`
- `redEnvelope`
- `redExclamationMark`
- `redHeart`
- `redPaperLantern`
- `redQuestionMark`
- `redSquare`
- `redTriangle`
- `redTrianglePointedDown`
- `registered`
- `relievedFace`
- `reminderRibbon`
- `repeatButton`
- `repeatSingleButton`
- `rescueWorkersHelmet`
- `restroom`
- `reverseButton`
- `revolvingHearts`
- `rhinoceros`
- `ribbon`
- `riceBall`
- `riceCracker`
- `rightAngerBubble`
- `rightArrow`
- `rightArrowCurvingDown`
- `rightArrowCurvingLeft`
- `rightArrowCurvingUp`
- `rightFacingFist`
- `rightwardsHand`
- `rightwardsPushingHand`
- `ring`
- `ringBuoy`
- `ringedPlanet`
- `roastedSweetPotato`
- `robot`
- `rock`
- `rocket`
- `rollOfPaper`
- `rolledUpNewspaper`
- `rollerCoaster`
- `rollerSkate`
- `rollingOnTheFloorLaughing`
- `rooster`
- `rose`
- `rosette`
- `roundPushpin`
- `rugbyFootball`
- `runningShirt`
- `runningShoe`
- `sadButRelievedFace`
- `safetyPin`
- `safetyVest`
- `sagittarius`
- `sailboat`
- `sake`
- `salt`
- `salutingFace`
- `sandwich`
- `santaClaus`
- `sari`
- `satellite`
- `satelliteAntenna`
- `sauropod`
- `saxophone`
- `scarf`
- `school`
- `scientist`
- `scissors`
- `scorpio`
- `scorpion`
- `screwdriver`
- `scroll`
- `seal`
- `seat`
- `seeNoEvilMonkey`
- `seedling`
- `selfie`
- `serviceDog`
- `sevenOclock`
- `sevenThirty`
- `sewingNeedle`
- `shakingFace`
- `shallowPanOfFood`
- `shamrock`
- `shark`
- `shavedIce`
- `sheafOfRice`
- `shield`
- `shintoShrine`
- `ship`
- `shootingStar`
- `shoppingBags`
- `shoppingCart`
- `shortcake`
- `shorts`
- `shower`
- `shrimp`
- `shuffleTracksButton`
- `shushingFace`
- `signOfTheHorns`
- `singer`
- `sixOclock`
- `sixThirty`
- `skateboard`
- `skier`
- `skis`
- `skull`
- `skullAndCrossbones`
- `skunk`
- `sled`
- `sleepingFace`
- `sleepyFace`
- `slightlyFrowningFace`
- `slightlySmilingFace`
- `slotMachine`
- `sloth`
- `smallAirplane`
- `smallBlueDiamond`
- `smallOrangeDiamond`
- `smilingCatWithHeartEyes`
- `smilingFace`
- `smilingFaceWithHalo`
- `smilingFaceWithHeartEyes`
- `smilingFaceWithHearts`
- `smilingFaceWithHorns`
- `smilingFaceWithSmilingEyes`
- `smilingFaceWithSunglasses`
- `smilingFaceWithTear`
- `smirkingFace`
- `snail`
- `snake`
- `sneezingFace`
- `snowCappedMountain`
- `snowboarder`
- `snowflake`
- `snowman`
- `snowmanWithoutSnow`
- `soap`
- `soccerBall`
- `socks`
- `softIceCream`
- `softball`
- `soonArrow`
- `sosButton`
- `spadeSuit`
- `spaghetti`
- `sparkle`
- `sparkler`
- `sparkles`
- `sparklingHeart`
- `speakNoEvilMonkey`
- `speakerHighVolume`
- `speakerLowVolume`
- `speakerMediumVolume`
- `speakingHead`
- `speechBalloon`
- `speedboat`
- `spider`
- `spiderWeb`
- `spiralCalendar`
- `spiralNotepad`
- `spiralShell`
- `sponge`
- `spoon`
- `sportUtilityVehicle`
- `sportsMedal`
- `spoutingWhale`
- `squid`
- `squintingFaceWithTongue`
- `stadium`
- `star`
- `starAndCrescent`
- `starOfDavid`
- `starStruck`
- `station`
- `statueOfLiberty`
- `steamingBowl`
- `stethoscope`
- `stopButton`
- `stopSign`
- `stopwatch`
- `straightRuler`
- `strawberry`
- `student`
- `studioMicrophone`
- `stuffedFlatbread`
- `sun`
- `sunBehindCloud`
- `sunBehindLargeCloud`
- `sunBehindRainCloud`
- `sunBehindSmallCloud`
- `sunWithFace`
- `sunflower`
- `sunglasses`
- `sunrise`
- `sunriseOverMountains`
- `sunset`
- `sushi`
- `suspensionRailway`
- `swan`
- `sweatDroplets`
- `synagogue`
- `syringe`
- `tRex`
- `tShirt`
- `taco`
- `takeoutBox`
- `tamale`
- `tanabataTree`
- `tangerine`
- `taurus`
- `taxi`
- `teacher`
- `teacupWithoutHandle`
- `teapot`
- `tearOffCalendar`
- `technologist`
- `teddyBear`
- `telephone`
- `telephoneReceiver`
- `telescope`
- `television`
- `tenOclock`
- `tenThirty`
- `tennis`
- `tent`
- `testTube`
- `thermometer`
- `thinkingFace`
- `thongSandal`
- `thoughtBalloon`
- `thread`
- `threeOclock`
- `threeThirty`
- `thumbsDown`
- `thumbsUp`
- `ticket`
- `tiger`
- `tigerFace`
- `timerClock`
- `tiredFace`
- `toilet`
- `tokyoTower`
- `tomato`
- `tongue`
- `toolbox`
- `tooth`
- `toothbrush`
- `topArrow`
- `topHat`
- `tornado`
- `trackball`
- `tractor`
- `tradeMark`
- `train`
- `tram`
- `tramCar`
- `transgenderFlag`
- `transgenderSymbol`
- `triangularFlag`
- `triangularRuler`
- `tridentEmblem`
- `troll`
- `trolleybus`
- `trophy`
- `tropicalDrink`
- `tropicalFish`
- `trumpet`
- `tulip`
- `tumblerGlass`
- `turkey`
- `turtle`
- `twelveOclock`
- `twelveThirty`
- `twoHearts`
- `twoHumpCamel`
- `twoOclock`
- `twoThirty`
- `umbrella`
- `umbrellaOnGround`
- `umbrellaWithRainDrops`
- `unamusedFace`
- `unicorn`
- `unlocked`
- `upArrow`
- `upButton`
- `upDownArrow`
- `upLeftArrow`
- `upRightArrow`
- `upsideDownFace`
- `upwardsButton`
- `verticalTrafficLight`
- `vibrationMode`
- `victoryHand`
- `videoCamera`
- `videoGame`
- `videocassette`
- `violin`
- `virgo`
- `volcano`
- `volleyball`
- `vsButton`
- `vulcanSalute`
- `waffle`
- `waningCrescentMoon`
- `waningGibbousMoon`
- `warning`
- `wastebasket`
- `watch`
- `waterBuffalo`
- `waterCloset`
- `waterPistol`
- `waterWave`
- `watermelon`
- `wavingHand`
- `wavyDash`
- `waxingCrescentMoon`
- `waxingGibbousMoon`
- `wearyCat`
- `wearyFace`
- `wedding`
- `whale`
- `wheel`
- `wheelOfDharma`
- `wheelchairSymbol`
- `whiteCane`
- `whiteCircle`
- `whiteExclamationMark`
- `whiteFlag`
- `whiteFlower`
- `whiteHeart`
- `whiteLargeSquare`
- `whiteMediumSmallSquare`
- `whiteMediumSquare`
- `whiteQuestionMark`
- `whiteSmallSquare`
- `whiteSquareButton`
- `wiltedFlower`
- `windChime`
- `windFace`
- `window`
- `wineGlass`
- `wing`
- `winkingFace`
- `winkingFaceWithTongue`
- `wireless`
- `wolf`
- `woman`
- `womanArtist`
- `womanAstronaut`
- `womanBald`
- `womanBeard`
- `womanBiking`
- `womanBlondeHair`
- `womanBouncingBall`
- `womanBowing`
- `womanCartwheeling`
- `womanClimbing`
- `womanConstructionWorker`
- `womanCook`
- `womanCurlyHair`
- `womanDancing`
- `womanDeaf`
- `womanDetective`
- `womanElf`
- `womanFacepalming`
- `womanFactoryWorker`
- `womanFairy`
- `womanFarmer`
- `womanFeedingBaby`
- `womanFirefighter`
- `womanFrowning`
- `womanGenie`
- `womanGesturingNo`
- `womanGesturingOk`
- `womanGettingHaircut`
- `womanGettingMassage`
- `womanGolfing`
- `womanGuard`
- `womanHealthWorker`
- `womanInLotusPosition`
- `womanInManualWheelchair`
- `womanInManualWheelchairFacingRight`
- `womanInMotorizedWheelchair`
- `womanInMotorizedWheelchairFacingRight`
- `womanInSteamyRoom`
- `womanInTuxedo`
- `womanJudge`
- `womanJuggling`
- `womanKneeling`
- `womanKneelingFacingRight`
- `womanLiftingWeights`
- `womanMage`
- `womanMechanic`
- `womanMerpeople`
- `womanMountainBiking`
- `womanOfficeWorker`
- `womanPilot`
- `womanPlayingHandball`
- `womanPlayingWaterPolo`
- `womanPoliceOfficer`
- `womanPouting`
- `womanRaisingHand`
- `womanRedHair`
- `womanRowingBoat`
- `womanRunning`
- `womanRunningFacingRight`
- `womanScientist`
- `womanShrugging`
- `womanSinger`
- `womanStanding`
- `womanStudent`
- `womanSuperhero`
- `womanSupervillain`
- `womanSurfing`
- `womanSwimming`
- `womanTeacher`
- `womanTechnologist`
- `womanTippingHand`
- `womanVampire`
- `womanWalking`
- `womanWalkingFacingRight`
- `womanWearingTurban`
- `womanWhiteHair`
- `womanWithBunnyEars`
- `womanWithHeadscarf`
- `womanWithVeil`
- `womanWithWhiteCane`
- `womanWithWhiteCaneFacingRight`
- `womanWrestling`
- `womanZombie`
- `womansBoot`
- `womansClothes`
- `womansHat`
- `womansSandal`
- `womensRoom`
- `wood`
- `woozyFace`
- `worldMap`
- `worm`
- `worriedFace`
- `wrappedGift`
- `wrench`
- `writingHand`
- `xRay`
- `yarn`
- `yawningFace`
- `yellowCircle`
- `yellowHeart`
- `yellowSquare`
- `yenBanknote`
- `yinYang`
- `yoYo`
- `zanyFace`
- `zebra`
- `zipperMouthFace`
- `zzz`

## Usage Examples

### Navigation Menu

```html
@js
  import { 1stPlaceMedalIcon, 2ndPlaceMedalIcon, 3rdPlaceMedalIcon, AButtonBloodTypeIcon } from '@stacksjs/iconify-fluent-emoji-high-contrast'

  global.navIcons = {
    home: 1stPlaceMedalIcon({ size: 20, class: 'nav-icon' }),
    about: 2ndPlaceMedalIcon({ size: 20, class: 'nav-icon' }),
    contact: 3rdPlaceMedalIcon({ size: 20, class: 'nav-icon' }),
    settings: AButtonBloodTypeIcon({ size: 20, class: 'nav-icon' })
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
import { 1stPlaceMedalIcon } from '@stacksjs/iconify-fluent-emoji-high-contrast'

const icon = 1stPlaceMedalIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 1stPlaceMedalIcon, 2ndPlaceMedalIcon, 3rdPlaceMedalIcon } from '@stacksjs/iconify-fluent-emoji-high-contrast'

const successIcon = 1stPlaceMedalIcon({ size: 16, color: '#22c55e' })
const warningIcon = 2ndPlaceMedalIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 3rdPlaceMedalIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 1stPlaceMedalIcon, 2ndPlaceMedalIcon } from '@stacksjs/iconify-fluent-emoji-high-contrast'
   const icon = 1stPlaceMedalIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 1stPlaceMedal, 2ndPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(1stPlaceMedal, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 1stPlaceMedalIcon, 2ndPlaceMedalIcon } from '@stacksjs/iconify-fluent-emoji-high-contrast'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fluent-emoji-high-contrast'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 1stPlaceMedalIcon } from '@stacksjs/iconify-fluent-emoji-high-contrast'
     global.icon = 1stPlaceMedalIcon({ size: 24 })
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
   const icon = 1stPlaceMedalIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 1stPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'

// Icons are typed as IconData
const myIcon: IconData = 1stPlaceMedal
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-emoji))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fluent-emoji-high-contrast/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fluent-emoji-high-contrast/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
