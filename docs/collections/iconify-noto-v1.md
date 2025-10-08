# Noto Emoji (v1)

> Noto Emoji (v1) icons for stx from Iconify

## Overview

This package provides access to 2162 icons from the Noto Emoji (v1) collection through the stx iconify integration.

**Collection ID:** `noto-v1`
**Total Icons:** 2162
**Author:** Google Inc ([Website](https://github.com/googlefonts/noto-emoji))
**License:** Apache 2.0 ([Details](https://github.com/googlefonts/noto-emoji/blob/main/svg/LICENSE))
**Category:** Emoji
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-noto-v1
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<1stPlaceMedalIcon height="1em" />
<1stPlaceMedalIcon width="1em" height="1em" />
<1stPlaceMedalIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<1stPlaceMedalIcon size="24" />
<1stPlaceMedalIcon size="1em" />

<!-- Using width and height -->
<1stPlaceMedalIcon width="24" height="32" />

<!-- With color -->
<1stPlaceMedalIcon size="24" color="red" />
<1stPlaceMedalIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<1stPlaceMedalIcon size="24" class="icon-primary" />

<!-- With all properties -->
<1stPlaceMedalIcon
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
    <1stPlaceMedalIcon size="24" />
    <2ndPlaceMedalIcon size="24" color="#4a90e2" />
    <3rdPlaceMedalIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 1stPlaceMedal, 2ndPlaceMedal, 3rdPlaceMedal } from '@stacksjs/iconify-noto-v1'
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

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```html
<!-- Via color property -->
<1stPlaceMedalIcon size="24" color="red" />
<1stPlaceMedalIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<1stPlaceMedalIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<1stPlaceMedalIcon size="24" class="text-primary" />
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
<1stPlaceMedalIcon height="1em" />
<1stPlaceMedalIcon width="1em" height="1em" />
<1stPlaceMedalIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<1stPlaceMedalIcon size="24" />
<1stPlaceMedalIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.notoV1-icon {
  width: 1em;
  height: 1em;
}
```

```html
<1stPlaceMedalIcon class="notoV1-icon" />
```

## Available Icons

This package contains **2162** icons:

- `1stPlaceMedal`
- `2ndPlaceMedal`
- `3rdPlaceMedal`
- `aButtonBloodType`
- `abButtonBloodType`
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
- `artistPalette`
- `asterisk`
- `astonishedFace`
- `atmSign`
- `atomSymbol`
- `automobile`
- `avocado`
- `bButtonBloodType`
- `baby`
- `babyAngel`
- `babyAngelDarkSkinTone`
- `babyAngelLightSkinTone`
- `babyAngelMediumDarkSkinTone`
- `babyAngelMediumLightSkinTone`
- `babyAngelMediumSkinTone`
- `babyBottle`
- `babyChick`
- `babyDarkSkinTone`
- `babyLightSkinTone`
- `babyMediumDarkSkinTone`
- `babyMediumLightSkinTone`
- `babyMediumSkinTone`
- `babySymbol`
- `backArrow`
- `backhandIndexPointingDown`
- `backhandIndexPointingDownDarkSkinTone`
- `backhandIndexPointingDownLightSkinTone`
- `backhandIndexPointingDownMediumDarkSkinTone`
- `backhandIndexPointingDownMediumLightSkinTone`
- `backhandIndexPointingDownMediumSkinTone`
- `backhandIndexPointingLeft`
- `backhandIndexPointingLeftDarkSkinTone`
- `backhandIndexPointingLeftLightSkinTone`
- `backhandIndexPointingLeftMediumDarkSkinTone`
- `backhandIndexPointingLeftMediumLightSkinTone`
- `backhandIndexPointingLeftMediumSkinTone`
- `backhandIndexPointingRight`
- `backhandIndexPointingRightDarkSkinTone`
- `backhandIndexPointingRightLightSkinTone`
- `backhandIndexPointingRightMediumDarkSkinTone`
- `backhandIndexPointingRightMediumLightSkinTone`
- `backhandIndexPointingRightMediumSkinTone`
- `backhandIndexPointingUp`
- `backhandIndexPointingUpDarkSkinTone`
- `backhandIndexPointingUpLightSkinTone`
- `backhandIndexPointingUpMediumDarkSkinTone`
- `backhandIndexPointingUpMediumLightSkinTone`
- `backhandIndexPointingUpMediumSkinTone`
- `backpack`
- `bacon`
- `badminton`
- `baggageClaim`
- `baguetteBread`
- `balanceScale`
- `balloon`
- `ballotBoxWithBallot`
- `banana`
- `bank`
- `barChart`
- `barberPole`
- `baseball`
- `basketball`
- `bat`
- `bathtub`
- `battery`
- `beachWithUmbrella`
- `beamingFaceWithSmilingEyes`
- `bear`
- `beatingHeart`
- `bed`
- `beerMug`
- `bell`
- `bellWithSlash`
- `bellhopBell`
- `bentoBox`
- `bicycle`
- `bikini`
- `biohazard`
- `bird`
- `birthdayCake`
- `blackCircle`
- `blackFlag`
- `blackHeart`
- `blackLargeSquare`
- `blackMediumSmallSquare`
- `blackMediumSquare`
- `blackNib`
- `blackSmallSquare`
- `blackSquareButton`
- `blossom`
- `blowfish`
- `blueBook`
- `blueCircle`
- `blueHeart`
- `boar`
- `bomb`
- `bookmark`
- `bookmarkTabs`
- `books`
- `bottleWithPoppingCork`
- `bouquet`
- `bowAndArrow`
- `bowling`
- `boxingGlove`
- `boy`
- `boyDarkSkinTone`
- `boyLightSkinTone`
- `boyMediumDarkSkinTone`
- `boyMediumLightSkinTone`
- `boyMediumSkinTone`
- `bread`
- `bridgeAtNight`
- `briefcase`
- `brightButton`
- `brokenHeart`
- `bug`
- `buildingConstruction`
- `bulletTrain`
- `burrito`
- `bus`
- `busStop`
- `bustInSilhouette`
- `bustsInSilhouette`
- `butterfly`
- `cactus`
- `calendar`
- `callMeHand`
- `callMeHandDarkSkinTone`
- `callMeHandLightSkinTone`
- `callMeHandMediumDarkSkinTone`
- `callMeHandMediumLightSkinTone`
- `callMeHandMediumSkinTone`
- `camel`
- `camera`
- `cameraWithFlash`
- `camping`
- `cancer`
- `candle`
- `candy`
- `canoe`
- `capricorn`
- `cardFileBox`
- `cardIndex`
- `cardIndexDividers`
- `carouselHorse`
- `carpStreamer`
- `carrot`
- `castle`
- `cat`
- `catFace`
- `catWithTearsOfJoy`
- `catWithWrySmile`
- `chains`
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
- `chestnut`
- `chicken`
- `childrenCrossing`
- `chipmunk`
- `chocolateBar`
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
- `clappingHandsDarkSkinTone`
- `clappingHandsLightSkinTone`
- `clappingHandsMediumDarkSkinTone`
- `clappingHandsMediumLightSkinTone`
- `clappingHandsMediumSkinTone`
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
- `cocktailGlass`
- `coffin`
- `collision`
- `comet`
- `computerDisk`
- `computerMouse`
- `confettiBall`
- `confoundedFace`
- `confusedFace`
- `construction`
- `constructionWorker`
- `constructionWorkerDarkSkinTone`
- `constructionWorkerLightSkinTone`
- `constructionWorkerMediumDarkSkinTone`
- `constructionWorkerMediumLightSkinTone`
- `constructionWorkerMediumSkinTone`
- `controlKnobs`
- `convenienceStore`
- `cookedRice`
- `cookie`
- `cooking`
- `coolButton`
- `copyright`
- `couchAndLamp`
- `counterclockwiseArrowsButton`
- `coupleWithHeartManMan`
- `coupleWithHeartWomanMan`
- `coupleWithHeartWomanWoman`
- `cow`
- `cowFace`
- `cowboyHatFace`
- `crab`
- `crayon`
- `creditCard`
- `crescentMoon`
- `cricketGame`
- `crocodile`
- `croissant`
- `crossMark`
- `crossMarkButton`
- `crossedFingers`
- `crossedFingersDarkSkinTone`
- `crossedFingersLightSkinTone`
- `crossedFingersMediumDarkSkinTone`
- `crossedFingersMediumLightSkinTone`
- `crossedFingersMediumSkinTone`
- `crossedFlags`
- `crossedSwords`
- `crown`
- `cryingCat`
- `cryingFace`
- `crystalBall`
- `cucumber`
- `curlyLoop`
- `currencyExchange`
- `curryRice`
- `custard`
- `customs`
- `cyclone`
- `dagger`
- `dango`
- `darkSkinTone`
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
- `detectiveDarkSkinTone`
- `detectiveLightSkinTone`
- `detectiveMediumDarkSkinTone`
- `detectiveMediumLightSkinTone`
- `detectiveMediumSkinTone`
- `diamondSuit`
- `diamondWithADot`
- `digitEight`
- `digitFive`
- `digitFour`
- `digitNine`
- `digitOne`
- `digitSeven`
- `digitSix`
- `digitThree`
- `digitTwo`
- `digitZero`
- `dimButton`
- `directHit`
- `disappointedFace`
- `divide`
- `dizzy`
- `dizzyFace`
- `dog`
- `dogFace`
- `dollarBanknote`
- `dolphin`
- `door`
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
- `droplet`
- `drum`
- `duck`
- `dvd`
- `eMail`
- `eagle`
- `ear`
- `earDarkSkinTone`
- `earLightSkinTone`
- `earMediumDarkSkinTone`
- `earMediumLightSkinTone`
- `earMediumSkinTone`
- `earOfCorn`
- `egg`
- `eggplant`
- `eightOclock`
- `eightPointedStar`
- `eightSpokedAsterisk`
- `eightThirty`
- `ejectButton`
- `electricPlug`
- `elephant`
- `elevenOclock`
- `elevenThirty`
- `endArrow`
- `envelope`
- `envelopeWithArrow`
- `euroBanknote`
- `evergreenTree`
- `ewe`
- `exclamationMark`
- `exclamationQuestionMark`
- `expressionlessFace`
- `eye`
- `eyeInSpeechBubble`
- `eyes`
- `faceBlowingAKiss`
- `faceSavoringFood`
- `faceScreamingInFear`
- `faceWithHeadBandage`
- `faceWithMedicalMask`
- `faceWithOpenMouth`
- `faceWithRollingEyes`
- `faceWithSteamFromNose`
- `faceWithTearsOfJoy`
- `faceWithThermometer`
- `faceWithTongue`
- `faceWithoutMouth`
- `factory`
- `fallenLeaf`
- `family`
- `familyManBoy`
- `familyManBoyBoy`
- `familyManGirl`
- `familyManGirlBoy`
- `familyManGirlGirl`
- `familyManManBoy`
- `familyManManBoyBoy`
- `familyManManGirl`
- `familyManManGirlBoy`
- `familyManManGirlGirl`
- `familyManWomanBoy`
- `familyManWomanBoyBoy`
- `familyManWomanGirl`
- `familyManWomanGirlBoy`
- `familyManWomanGirlGirl`
- `familyWomanBoy`
- `familyWomanBoyBoy`
- `familyWomanGirl`
- `familyWomanGirlBoy`
- `familyWomanGirlGirl`
- `familyWomanWomanBoy`
- `familyWomanWomanBoyBoy`
- `familyWomanWomanGirl`
- `familyWomanWomanGirlBoy`
- `familyWomanWomanGirlGirl`
- `fastDownButton`
- `fastForwardButton`
- `fastReverseButton`
- `fastUpButton`
- `faxMachine`
- `fearfulFace`
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
- `fireworks`
- `firstQuarterMoon`
- `firstQuarterMoonFace`
- `fish`
- `fishCakeWithSwirl`
- `fishingPole`
- `fiveOclock`
- `fiveThirty`
- `flagForFlagChina`
- `flagForFlagFrance`
- `flagForFlagGermany`
- `flagForFlagItaly`
- `flagForFlagJapan`
- `flagForFlagRussia`
- `flagForFlagSouthKorea`
- `flagForFlagSpain`
- `flagForFlagUnitedKingdom`
- `flagForFlagUnitedStates`
- `flagInHole`
- `flashlight`
- `fleurDeLis`
- `flexedBiceps`
- `flexedBicepsDarkSkinTone`
- `flexedBicepsLightSkinTone`
- `flexedBicepsMediumDarkSkinTone`
- `flexedBicepsMediumLightSkinTone`
- `flexedBicepsMediumSkinTone`
- `floppyDisk`
- `flowerPlayingCards`
- `flushedFace`
- `fog`
- `foggy`
- `foldedHands`
- `foldedHandsDarkSkinTone`
- `foldedHandsLightSkinTone`
- `foldedHandsMediumDarkSkinTone`
- `foldedHandsMediumLightSkinTone`
- `foldedHandsMediumSkinTone`
- `footprints`
- `forkAndKnife`
- `forkAndKnifeWithPlate`
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
- `gear`
- `gemStone`
- `gemini`
- `ghost`
- `girl`
- `girlDarkSkinTone`
- `girlLightSkinTone`
- `girlMediumDarkSkinTone`
- `girlMediumLightSkinTone`
- `girlMediumSkinTone`
- `glassOfMilk`
- `glasses`
- `globeShowingAmericas`
- `globeShowingAsiaAustralia`
- `globeShowingEuropeAfrica`
- `globeWithMeridians`
- `glowingStar`
- `goalNet`
- `goat`
- `goblin`
- `gorilla`
- `graduationCap`
- `grapes`
- `greenApple`
- `greenBook`
- `greenHeart`
- `greenSalad`
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
- `guardDarkSkinTone`
- `guardLightSkinTone`
- `guardMediumDarkSkinTone`
- `guardMediumLightSkinTone`
- `guardMediumSkinTone`
- `guitar`
- `hamburger`
- `hammer`
- `hammerAndPick`
- `hammerAndWrench`
- `hamster`
- `handWithFingersSplayed`
- `handWithFingersSplayedDarkSkinTone`
- `handWithFingersSplayedLightSkinTone`
- `handWithFingersSplayedMediumDarkSkinTone`
- `handWithFingersSplayedMediumLightSkinTone`
- `handWithFingersSplayedMediumSkinTone`
- `handbag`
- `handshake`
- `handshakeDarkSkinTone`
- `handshakeLightSkinTone`
- `handshakeMediumDarkSkinTone`
- `handshakeMediumLightSkinTone`
- `handshakeMediumSkinTone`
- `hatchingChick`
- `headphone`
- `hearNoEvilMonkey`
- `heartDecoration`
- `heartExclamation`
- `heartSuit`
- `heartWithArrow`
- `heartWithRibbon`
- `heavyDollarSign`
- `helicopter`
- `herb`
- `hibiscus`
- `highHeeledShoe`
- `highSpeedTrain`
- `highVoltage`
- `hole`
- `hollowRedCircle`
- `honeyPot`
- `honeybee`
- `horizontalTrafficLight`
- `horse`
- `horseFace`
- `horseRacing`
- `hospital`
- `hotBeverage`
- `hotDog`
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
- `iceCream`
- `iceHockey`
- `iceSkate`
- `idButton`
- `inboxTray`
- `incomingEnvelope`
- `indexPointingUp`
- `indexPointingUpDarkSkinTone`
- `indexPointingUpLightSkinTone`
- `indexPointingUpMediumDarkSkinTone`
- `indexPointingUpMediumLightSkinTone`
- `indexPointingUpMediumSkinTone`
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
- `jeans`
- `joker`
- `joystick`
- `kaaba`
- `key`
- `keyboard`
- `keycap`
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
- `keycapPound`
- `kickScooter`
- `kimono`
- `kissManMan`
- `kissMark`
- `kissWomanMan`
- `kissWomanWoman`
- `kissingCat`
- `kissingFace`
- `kissingFaceWithClosedEyes`
- `kissingFaceWithSmilingEyes`
- `kitchenKnife`
- `kiwiFruit`
- `koala`
- `label`
- `ladyBeetle`
- `laptop`
- `largeBlueDiamond`
- `largeOrangeDiamond`
- `lastQuarterMoon`
- `lastQuarterMoonFace`
- `lastTrackButton`
- `latinCross`
- `leafFlutteringInWind`
- `ledger`
- `leftArrow`
- `leftArrowCurvingRight`
- `leftFacingFist`
- `leftFacingFistDarkSkinTone`
- `leftFacingFistLightSkinTone`
- `leftFacingFistMediumDarkSkinTone`
- `leftFacingFistMediumLightSkinTone`
- `leftFacingFistMediumSkinTone`
- `leftLuggage`
- `leftRightArrow`
- `leftSpeechBubble`
- `lemon`
- `leo`
- `leopard`
- `letterA`
- `letterB`
- `letterC`
- `letterD`
- `letterE`
- `letterF`
- `letterG`
- `letterH`
- `letterI`
- `letterJ`
- `letterK`
- `letterL`
- `letterM`
- `letterN`
- `letterO`
- `letterP`
- `letterQ`
- `letterR`
- `letterS`
- `letterT`
- `letterU`
- `letterV`
- `letterW`
- `letterX`
- `letterY`
- `letterZ`
- `levelSlider`
- `libra`
- `lightBulb`
- `lightRail`
- `lightSkinTone`
- `link`
- `linkedPaperclips`
- `lion`
- `lipstick`
- `litterInBinSign`
- `lizard`
- `locked`
- `lockedWithKey`
- `lockedWithPen`
- `locomotive`
- `lollipop`
- `loudlyCryingFace`
- `loudspeaker`
- `loveHotel`
- `loveLetter`
- `lyingFace`
- `magnifyingGlassTiltedLeft`
- `magnifyingGlassTiltedRight`
- `mahjongRedDragon`
- `maleSign`
- `man`
- `manArtist`
- `manArtistDarkSkinTone`
- `manArtistLightSkinTone`
- `manArtistMediumDarkSkinTone`
- `manArtistMediumLightSkinTone`
- `manArtistMediumSkinTone`
- `manAstronaut`
- `manAstronautDarkSkinTone`
- `manAstronautLightSkinTone`
- `manAstronautMediumDarkSkinTone`
- `manAstronautMediumLightSkinTone`
- `manAstronautMediumSkinTone`
- `manBiking`
- `manBikingDarkSkinTone`
- `manBikingLightSkinTone`
- `manBikingMediumDarkSkinTone`
- `manBikingMediumLightSkinTone`
- `manBikingMediumSkinTone`
- `manBlondHair`
- `manBouncingBall`
- `manBouncingBallDarkSkinTone`
- `manBouncingBallLightSkinTone`
- `manBouncingBallMediumDarkSkinTone`
- `manBouncingBallMediumLightSkinTone`
- `manBouncingBallMediumSkinTone`
- `manBowing`
- `manBowingDarkSkinTone`
- `manBowingLightSkinTone`
- `manBowingMediumDarkSkinTone`
- `manBowingMediumLightSkinTone`
- `manBowingMediumSkinTone`
- `manCartwheeling`
- `manCartwheelingDarkSkinTone`
- `manCartwheelingLightSkinTone`
- `manCartwheelingMediumDarkSkinTone`
- `manCartwheelingMediumLightSkinTone`
- `manCartwheelingMediumSkinTone`
- `manConstructionWorker`
- `manConstructionWorkerDarkSkinTone`
- `manConstructionWorkerLightSkinTone`
- `manConstructionWorkerMediumDarkSkinTone`
- `manConstructionWorkerMediumLightSkinTone`
- `manConstructionWorkerMediumSkinTone`
- `manCook`
- `manCookDarkSkinTone`
- `manCookLightSkinTone`
- `manCookMediumDarkSkinTone`
- `manCookMediumLightSkinTone`
- `manCookMediumSkinTone`
- `manDancing`
- `manDancingDarkSkinTone`
- `manDancingLightSkinTone`
- `manDancingMediumDarkSkinTone`
- `manDancingMediumLightSkinTone`
- `manDancingMediumSkinTone`
- `manDarkSkinTone`
- `manDarkSkinToneBlondHair`
- `manDetective`
- `manDetectiveDarkSkinTone`
- `manDetectiveLightSkinTone`
- `manDetectiveMediumDarkSkinTone`
- `manDetectiveMediumLightSkinTone`
- `manDetectiveMediumSkinTone`
- `manFacepalming`
- `manFacepalmingDarkSkinTone`
- `manFacepalmingLightSkinTone`
- `manFacepalmingMediumDarkSkinTone`
- `manFacepalmingMediumLightSkinTone`
- `manFacepalmingMediumSkinTone`
- `manFactoryWorker`
- `manFactoryWorkerDarkSkinTone`
- `manFactoryWorkerLightSkinTone`
- `manFactoryWorkerMediumDarkSkinTone`
- `manFactoryWorkerMediumLightSkinTone`
- `manFactoryWorkerMediumSkinTone`
- `manFarmer`
- `manFarmerDarkSkinTone`
- `manFarmerLightSkinTone`
- `manFarmerMediumDarkSkinTone`
- `manFarmerMediumLightSkinTone`
- `manFarmerMediumSkinTone`
- `manFirefighter`
- `manFirefighterDarkSkinTone`
- `manFirefighterLightSkinTone`
- `manFirefighterMediumDarkSkinTone`
- `manFirefighterMediumLightSkinTone`
- `manFirefighterMediumSkinTone`
- `manFrowning`
- `manFrowningDarkSkinTone`
- `manFrowningLightSkinTone`
- `manFrowningMediumDarkSkinTone`
- `manFrowningMediumLightSkinTone`
- `manFrowningMediumSkinTone`
- `manGesturingNo`
- `manGesturingNoDarkSkinTone`
- `manGesturingNoLightSkinTone`
- `manGesturingNoMediumDarkSkinTone`
- `manGesturingNoMediumLightSkinTone`
- `manGesturingNoMediumSkinTone`
- `manGesturingOk`
- `manGesturingOkDarkSkinTone`
- `manGesturingOkLightSkinTone`
- `manGesturingOkMediumDarkSkinTone`
- `manGesturingOkMediumLightSkinTone`
- `manGesturingOkMediumSkinTone`
- `manGettingHaircut`
- `manGettingHaircutDarkSkinTone`
- `manGettingHaircutLightSkinTone`
- `manGettingHaircutMediumDarkSkinTone`
- `manGettingHaircutMediumLightSkinTone`
- `manGettingHaircutMediumSkinTone`
- `manGettingMassage`
- `manGettingMassageDarkSkinTone`
- `manGettingMassageLightSkinTone`
- `manGettingMassageMediumDarkSkinTone`
- `manGettingMassageMediumLightSkinTone`
- `manGettingMassageMediumSkinTone`
- `manGolfing`
- `manGuard`
- `manGuardDarkSkinTone`
- `manGuardLightSkinTone`
- `manGuardMediumDarkSkinTone`
- `manGuardMediumLightSkinTone`
- `manGuardMediumSkinTone`
- `manHealthWorker`
- `manHealthWorkerDarkSkinTone`
- `manHealthWorkerLightSkinTone`
- `manHealthWorkerMediumDarkSkinTone`
- `manHealthWorkerMediumLightSkinTone`
- `manHealthWorkerMediumSkinTone`
- `manJudge`
- `manJudgeDarkSkinTone`
- `manJudgeLightSkinTone`
- `manJudgeMediumDarkSkinTone`
- `manJudgeMediumLightSkinTone`
- `manJudgeMediumSkinTone`
- `manJuggling`
- `manJugglingDarkSkinTone`
- `manJugglingLightSkinTone`
- `manJugglingMediumDarkSkinTone`
- `manJugglingMediumLightSkinTone`
- `manJugglingMediumSkinTone`
- `manLiftingWeights`
- `manLiftingWeightsDarkSkinTone`
- `manLiftingWeightsLightSkinTone`
- `manLiftingWeightsMediumDarkSkinTone`
- `manLiftingWeightsMediumLightSkinTone`
- `manLiftingWeightsMediumSkinTone`
- `manLightSkinTone`
- `manLightSkinToneBlondHair`
- `manMechanic`
- `manMechanicDarkSkinTone`
- `manMechanicLightSkinTone`
- `manMechanicMediumDarkSkinTone`
- `manMechanicMediumLightSkinTone`
- `manMechanicMediumSkinTone`
- `manMediumDarkSkinTone`
- `manMediumDarkSkinToneBlondHair`
- `manMediumLightSkinTone`
- `manMediumLightSkinToneBlondHair`
- `manMediumSkinTone`
- `manMediumSkinToneBlondHair`
- `manMountainBiking`
- `manMountainBikingDarkSkinTone`
- `manMountainBikingLightSkinTone`
- `manMountainBikingMediumDarkSkinTone`
- `manMountainBikingMediumLightSkinTone`
- `manMountainBikingMediumSkinTone`
- `manOfficeWorker`
- `manOfficeWorkerDarkSkinTone`
- `manOfficeWorkerLightSkinTone`
- `manOfficeWorkerMediumDarkSkinTone`
- `manOfficeWorkerMediumLightSkinTone`
- `manOfficeWorkerMediumSkinTone`
- `manPilot`
- `manPilotDarkSkinTone`
- `manPilotLightSkinTone`
- `manPilotMediumDarkSkinTone`
- `manPilotMediumLightSkinTone`
- `manPilotMediumSkinTone`
- `manPlayingHandball`
- `manPlayingHandballDarkSkinTone`
- `manPlayingHandballLightSkinTone`
- `manPlayingHandballMediumDarkSkinTone`
- `manPlayingHandballMediumLightSkinTone`
- `manPlayingHandballMediumSkinTone`
- `manPlayingWaterPolo`
- `manPlayingWaterPoloDarkSkinTone`
- `manPlayingWaterPoloLightSkinTone`
- `manPlayingWaterPoloMediumDarkSkinTone`
- `manPlayingWaterPoloMediumLightSkinTone`
- `manPlayingWaterPoloMediumSkinTone`
- `manPoliceOfficer`
- `manPoliceOfficerDarkSkinTone`
- `manPoliceOfficerLightSkinTone`
- `manPoliceOfficerMediumDarkSkinTone`
- `manPoliceOfficerMediumLightSkinTone`
- `manPoliceOfficerMediumSkinTone`
- `manPouting`
- `manPoutingDarkSkinTone`
- `manPoutingLightSkinTone`
- `manPoutingMediumDarkSkinTone`
- `manPoutingMediumLightSkinTone`
- `manPoutingMediumSkinTone`
- `manRaisingHand`
- `manRaisingHandDarkSkinTone`
- `manRaisingHandLightSkinTone`
- `manRaisingHandMediumDarkSkinTone`
- `manRaisingHandMediumLightSkinTone`
- `manRaisingHandMediumSkinTone`
- `manRowingBoat`
- `manRowingBoatDarkSkinTone`
- `manRowingBoatLightSkinTone`
- `manRowingBoatMediumDarkSkinTone`
- `manRowingBoatMediumLightSkinTone`
- `manRowingBoatMediumSkinTone`
- `manRunning`
- `manRunningDarkSkinTone`
- `manRunningLightSkinTone`
- `manRunningMediumDarkSkinTone`
- `manRunningMediumLightSkinTone`
- `manRunningMediumSkinTone`
- `manScientist`
- `manScientistDarkSkinTone`
- `manScientistLightSkinTone`
- `manScientistMediumDarkSkinTone`
- `manScientistMediumLightSkinTone`
- `manScientistMediumSkinTone`
- `manShrugging`
- `manShruggingDarkSkinTone`
- `manShruggingLightSkinTone`
- `manShruggingMediumDarkSkinTone`
- `manShruggingMediumLightSkinTone`
- `manShruggingMediumSkinTone`
- `manSinger`
- `manSingerDarkSkinTone`
- `manSingerLightSkinTone`
- `manSingerMediumDarkSkinTone`
- `manSingerMediumLightSkinTone`
- `manSingerMediumSkinTone`
- `manStudent`
- `manStudentDarkSkinTone`
- `manStudentLightSkinTone`
- `manStudentMediumDarkSkinTone`
- `manStudentMediumLightSkinTone`
- `manStudentMediumSkinTone`
- `manSurfing`
- `manSurfingDarkSkinTone`
- `manSurfingLightSkinTone`
- `manSurfingMediumDarkSkinTone`
- `manSurfingMediumLightSkinTone`
- `manSurfingMediumSkinTone`
- `manSwimming`
- `manSwimmingDarkSkinTone`
- `manSwimmingLightSkinTone`
- `manSwimmingMediumDarkSkinTone`
- `manSwimmingMediumLightSkinTone`
- `manSwimmingMediumSkinTone`
- `manTeacher`
- `manTeacherDarkSkinTone`
- `manTeacherLightSkinTone`
- `manTeacherMediumDarkSkinTone`
- `manTeacherMediumLightSkinTone`
- `manTeacherMediumSkinTone`
- `manTechnologist`
- `manTechnologistDarkSkinTone`
- `manTechnologistLightSkinTone`
- `manTechnologistMediumDarkSkinTone`
- `manTechnologistMediumLightSkinTone`
- `manTechnologistMediumSkinTone`
- `manTippingHand`
- `manTippingHandDarkSkinTone`
- `manTippingHandLightSkinTone`
- `manTippingHandMediumDarkSkinTone`
- `manTippingHandMediumLightSkinTone`
- `manTippingHandMediumSkinTone`
- `manWalking`
- `manWalkingDarkSkinTone`
- `manWalkingLightSkinTone`
- `manWalkingMediumDarkSkinTone`
- `manWalkingMediumLightSkinTone`
- `manWalkingMediumSkinTone`
- `manWearingTurban`
- `manWearingTurbanDarkSkinTone`
- `manWearingTurbanLightSkinTone`
- `manWearingTurbanMediumDarkSkinTone`
- `manWearingTurbanMediumLightSkinTone`
- `manWearingTurbanMediumSkinTone`
- `mansShoe`
- `mantelpieceClock`
- `mapOfJapan`
- `mapleLeaf`
- `martialArtsUniform`
- `meatOnBone`
- `medicalSymbol`
- `mediumDarkSkinTone`
- `mediumLightSkinTone`
- `mediumSkinTone`
- `megaphone`
- `melon`
- `memo`
- `menHoldingHands`
- `menWithBunnyEars`
- `menWrestling`
- `menWrestlingDarkSkinTone`
- `menWrestlingLightSkinTone`
- `menWrestlingMediumDarkSkinTone`
- `menWrestlingMediumLightSkinTone`
- `menWrestlingMediumSkinTone`
- `menorah`
- `mensRoom`
- `metro`
- `microphone`
- `microscope`
- `middleFinger`
- `middleFingerDarkSkinTone`
- `middleFingerLightSkinTone`
- `middleFingerMediumDarkSkinTone`
- `middleFingerMediumLightSkinTone`
- `middleFingerMediumSkinTone`
- `militaryMedal`
- `milkyWay`
- `minibus`
- `minus`
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
- `moonViewingCeremony`
- `mosque`
- `motorBoat`
- `motorScooter`
- `motorcycle`
- `motorway`
- `mountFuji`
- `mountain`
- `mountainCableway`
- `mountainRailway`
- `mouse`
- `mouseFace`
- `mouth`
- `movieCamera`
- `mrsClaus`
- `mrsClausDarkSkinTone`
- `mrsClausLightSkinTone`
- `mrsClausMediumDarkSkinTone`
- `mrsClausMediumLightSkinTone`
- `mrsClausMediumSkinTone`
- `multiply`
- `mushroom`
- `musicalKeyboard`
- `musicalNote`
- `musicalNotes`
- `musicalScore`
- `mutedSpeaker`
- `nailPolish`
- `nailPolishDarkSkinTone`
- `nailPolishLightSkinTone`
- `nailPolishMediumDarkSkinTone`
- `nailPolishMediumLightSkinTone`
- `nailPolishMediumSkinTone`
- `nameBadge`
- `nationalPark`
- `nauseatedFace`
- `necktie`
- `nerdFace`
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
- `noBicycles`
- `noEntry`
- `noLittering`
- `noMobilePhones`
- `noOneUnderEighteen`
- `noPedestrians`
- `noSmoking`
- `nonPotableWater`
- `nose`
- `noseDarkSkinTone`
- `noseLightSkinTone`
- `noseMediumDarkSkinTone`
- `noseMediumLightSkinTone`
- `noseMediumSkinTone`
- `notebook`
- `notebookWithDecorativeCover`
- `nutAndBolt`
- `oButtonBloodType`
- `octopus`
- `oden`
- `officeBuilding`
- `ogre`
- `oilDrum`
- `okButton`
- `okHand`
- `okHandDarkSkinTone`
- `okHandLightSkinTone`
- `okHandMediumDarkSkinTone`
- `okHandMediumLightSkinTone`
- `okHandMediumSkinTone`
- `oldKey`
- `oldMan`
- `oldManDarkSkinTone`
- `oldManLightSkinTone`
- `oldManMediumDarkSkinTone`
- `oldManMediumLightSkinTone`
- `oldManMediumSkinTone`
- `oldWoman`
- `oldWomanDarkSkinTone`
- `oldWomanLightSkinTone`
- `oldWomanMediumDarkSkinTone`
- `oldWomanMediumLightSkinTone`
- `oldWomanMediumSkinTone`
- `om`
- `onExclamationArrow`
- `oncomingAutomobile`
- `oncomingBus`
- `oncomingFist`
- `oncomingFistDarkSkinTone`
- `oncomingFistLightSkinTone`
- `oncomingFistMediumDarkSkinTone`
- `oncomingFistMediumLightSkinTone`
- `oncomingFistMediumSkinTone`
- `oncomingPoliceCar`
- `oncomingTaxi`
- `oneOclock`
- `oneThirty`
- `openBook`
- `openFileFolder`
- `openHands`
- `openHandsDarkSkinTone`
- `openHandsLightSkinTone`
- `openHandsMediumDarkSkinTone`
- `openHandsMediumLightSkinTone`
- `openHandsMediumSkinTone`
- `openMailboxWithLoweredFlag`
- `openMailboxWithRaisedFlag`
- `ophiuchus`
- `opticalDisk`
- `orangeBook`
- `orthodoxCross`
- `outboxTray`
- `owl`
- `ox`
- `pButton`
- `package`
- `pageFacingUp`
- `pageWithCurl`
- `pager`
- `paintbrush`
- `palmTree`
- `pancakes`
- `panda`
- `paperclip`
- `partAlternationMark`
- `partyPopper`
- `passengerShip`
- `passportControl`
- `pauseButton`
- `pawPrints`
- `peaceSymbol`
- `peach`
- `peanuts`
- `pear`
- `pen`
- `pencil`
- `penguin`
- `pensiveFace`
- `peopleWithBunnyEars`
- `peopleWrestling`
- `peopleWrestlingDarkSkinTone`
- `peopleWrestlingLightSkinTone`
- `peopleWrestlingMediumDarkSkinTone`
- `peopleWrestlingMediumLightSkinTone`
- `peopleWrestlingMediumSkinTone`
- `performingArts`
- `perseveringFace`
- `personBiking`
- `personBikingDarkSkinTone`
- `personBikingLightSkinTone`
- `personBikingMediumDarkSkinTone`
- `personBikingMediumLightSkinTone`
- `personBikingMediumSkinTone`
- `personBlondHair`
- `personBouncingBall`
- `personBouncingBallDarkSkinTone`
- `personBouncingBallLightSkinTone`
- `personBouncingBallMediumDarkSkinTone`
- `personBouncingBallMediumLightSkinTone`
- `personBouncingBallMediumSkinTone`
- `personBowing`
- `personBowingDarkSkinTone`
- `personBowingLightSkinTone`
- `personBowingMediumDarkSkinTone`
- `personBowingMediumLightSkinTone`
- `personBowingMediumSkinTone`
- `personCartwheeling`
- `personCartwheelingDarkSkinTone`
- `personCartwheelingLightSkinTone`
- `personCartwheelingMediumDarkSkinTone`
- `personCartwheelingMediumLightSkinTone`
- `personCartwheelingMediumSkinTone`
- `personDarkSkinToneBlondHair`
- `personFacepalming`
- `personFacepalmingDarkSkinTone`
- `personFacepalmingLightSkinTone`
- `personFacepalmingMediumDarkSkinTone`
- `personFacepalmingMediumLightSkinTone`
- `personFacepalmingMediumSkinTone`
- `personFencing`
- `personFrowning`
- `personFrowningDarkSkinTone`
- `personFrowningLightSkinTone`
- `personFrowningMediumDarkSkinTone`
- `personFrowningMediumLightSkinTone`
- `personFrowningMediumSkinTone`
- `personGesturingNo`
- `personGesturingNoDarkSkinTone`
- `personGesturingNoLightSkinTone`
- `personGesturingNoMediumDarkSkinTone`
- `personGesturingNoMediumLightSkinTone`
- `personGesturingNoMediumSkinTone`
- `personGesturingOk`
- `personGesturingOkDarkSkinTone`
- `personGesturingOkLightSkinTone`
- `personGesturingOkMediumDarkSkinTone`
- `personGesturingOkMediumLightSkinTone`
- `personGesturingOkMediumSkinTone`
- `personGettingHaircut`
- `personGettingHaircutDarkSkinTone`
- `personGettingHaircutLightSkinTone`
- `personGettingHaircutMediumDarkSkinTone`
- `personGettingHaircutMediumLightSkinTone`
- `personGettingHaircutMediumSkinTone`
- `personGettingMassage`
- `personGettingMassageDarkSkinTone`
- `personGettingMassageLightSkinTone`
- `personGettingMassageMediumDarkSkinTone`
- `personGettingMassageMediumLightSkinTone`
- `personGettingMassageMediumSkinTone`
- `personGolfing`
- `personInBed`
- `personInSuitLevitating`
- `personInTuxedo`
- `personInTuxedoDarkSkinTone`
- `personInTuxedoLightSkinTone`
- `personInTuxedoMediumDarkSkinTone`
- `personInTuxedoMediumLightSkinTone`
- `personInTuxedoMediumSkinTone`
- `personJuggling`
- `personJugglingDarkSkinTone`
- `personJugglingLightSkinTone`
- `personJugglingMediumDarkSkinTone`
- `personJugglingMediumLightSkinTone`
- `personJugglingMediumSkinTone`
- `personLiftingWeights`
- `personLiftingWeightsDarkSkinTone`
- `personLiftingWeightsLightSkinTone`
- `personLiftingWeightsMediumDarkSkinTone`
- `personLiftingWeightsMediumLightSkinTone`
- `personLiftingWeightsMediumSkinTone`
- `personLightSkinToneBlondHair`
- `personMediumDarkSkinToneBlondHair`
- `personMediumLightSkinToneBlondHair`
- `personMediumSkinToneBlondHair`
- `personMountainBiking`
- `personMountainBikingDarkSkinTone`
- `personMountainBikingLightSkinTone`
- `personMountainBikingMediumDarkSkinTone`
- `personMountainBikingMediumLightSkinTone`
- `personMountainBikingMediumSkinTone`
- `personPlayingHandball`
- `personPlayingHandballDarkSkinTone`
- `personPlayingHandballLightSkinTone`
- `personPlayingHandballMediumDarkSkinTone`
- `personPlayingHandballMediumLightSkinTone`
- `personPlayingHandballMediumSkinTone`
- `personPlayingWaterPolo`
- `personPlayingWaterPoloDarkSkinTone`
- `personPlayingWaterPoloLightSkinTone`
- `personPlayingWaterPoloMediumDarkSkinTone`
- `personPlayingWaterPoloMediumLightSkinTone`
- `personPlayingWaterPoloMediumSkinTone`
- `personPouting`
- `personPoutingDarkSkinTone`
- `personPoutingLightSkinTone`
- `personPoutingMediumDarkSkinTone`
- `personPoutingMediumLightSkinTone`
- `personPoutingMediumSkinTone`
- `personRaisingHand`
- `personRaisingHandDarkSkinTone`
- `personRaisingHandLightSkinTone`
- `personRaisingHandMediumDarkSkinTone`
- `personRaisingHandMediumLightSkinTone`
- `personRaisingHandMediumSkinTone`
- `personRowingBoat`
- `personRowingBoatDarkSkinTone`
- `personRowingBoatLightSkinTone`
- `personRowingBoatMediumDarkSkinTone`
- `personRowingBoatMediumLightSkinTone`
- `personRowingBoatMediumSkinTone`
- `personRunning`
- `personRunningDarkSkinTone`
- `personRunningLightSkinTone`
- `personRunningMediumDarkSkinTone`
- `personRunningMediumLightSkinTone`
- `personRunningMediumSkinTone`
- `personShrugging`
- `personShruggingDarkSkinTone`
- `personShruggingLightSkinTone`
- `personShruggingMediumDarkSkinTone`
- `personShruggingMediumLightSkinTone`
- `personShruggingMediumSkinTone`
- `personSurfing`
- `personSurfingDarkSkinTone`
- `personSurfingLightSkinTone`
- `personSurfingMediumDarkSkinTone`
- `personSurfingMediumLightSkinTone`
- `personSurfingMediumSkinTone`
- `personSwimming`
- `personSwimmingDarkSkinTone`
- `personSwimmingLightSkinTone`
- `personSwimmingMediumDarkSkinTone`
- `personSwimmingMediumLightSkinTone`
- `personSwimmingMediumSkinTone`
- `personTakingBath`
- `personTakingBathDarkSkinTone`
- `personTakingBathLightSkinTone`
- `personTakingBathMediumDarkSkinTone`
- `personTakingBathMediumLightSkinTone`
- `personTakingBathMediumSkinTone`
- `personTippingHand`
- `personTippingHandDarkSkinTone`
- `personTippingHandLightSkinTone`
- `personTippingHandMediumDarkSkinTone`
- `personTippingHandMediumLightSkinTone`
- `personTippingHandMediumSkinTone`
- `personWalking`
- `personWalkingDarkSkinTone`
- `personWalkingLightSkinTone`
- `personWalkingMediumDarkSkinTone`
- `personWalkingMediumLightSkinTone`
- `personWalkingMediumSkinTone`
- `personWearingTurban`
- `personWearingTurbanDarkSkinTone`
- `personWearingTurbanLightSkinTone`
- `personWearingTurbanMediumDarkSkinTone`
- `personWearingTurbanMediumLightSkinTone`
- `personWearingTurbanMediumSkinTone`
- `personWithSkullcap`
- `personWithSkullcapDarkSkinTone`
- `personWithSkullcapLightSkinTone`
- `personWithSkullcapMediumDarkSkinTone`
- `personWithSkullcapMediumLightSkinTone`
- `personWithSkullcapMediumSkinTone`
- `personWithVeil`
- `personWithVeilDarkSkinTone`
- `personWithVeilLightSkinTone`
- `personWithVeilMediumDarkSkinTone`
- `personWithVeilMediumLightSkinTone`
- `personWithVeilMediumSkinTone`
- `pick`
- `pig`
- `pigFace`
- `pigNose`
- `pileOfPoo`
- `pill`
- `pineDecoration`
- `pineapple`
- `pingPong`
- `pisces`
- `pistol`
- `pizza`
- `placeOfWorship`
- `playButton`
- `playOrPauseButton`
- `plus`
- `policeCar`
- `policeCarLight`
- `policeOfficer`
- `policeOfficerDarkSkinTone`
- `policeOfficerLightSkinTone`
- `policeOfficerMediumDarkSkinTone`
- `policeOfficerMediumLightSkinTone`
- `policeOfficerMediumSkinTone`
- `poodle`
- `pool8Ball`
- `popcorn`
- `postOffice`
- `postalHorn`
- `postbox`
- `potOfFood`
- `potableWater`
- `potato`
- `poultryLeg`
- `poundBanknote`
- `poundSymbol`
- `poutingCat`
- `poutingFace`
- `prayerBeads`
- `pregnantWoman`
- `pregnantWomanDarkSkinTone`
- `pregnantWomanLightSkinTone`
- `pregnantWomanMediumDarkSkinTone`
- `pregnantWomanMediumLightSkinTone`
- `pregnantWomanMediumSkinTone`
- `prince`
- `princeDarkSkinTone`
- `princeLightSkinTone`
- `princeMediumDarkSkinTone`
- `princeMediumLightSkinTone`
- `princeMediumSkinTone`
- `princess`
- `princessDarkSkinTone`
- `princessLightSkinTone`
- `princessMediumDarkSkinTone`
- `princessMediumLightSkinTone`
- `princessMediumSkinTone`
- `printer`
- `prohibited`
- `purpleHeart`
- `purse`
- `pushpin`
- `questionMark`
- `rabbit`
- `rabbitFace`
- `racingCar`
- `radio`
- `radioButton`
- `radioactive`
- `railwayCar`
- `railwayTrack`
- `rainbow`
- `raisedBackOfHand`
- `raisedBackOfHandDarkSkinTone`
- `raisedBackOfHandLightSkinTone`
- `raisedBackOfHandMediumDarkSkinTone`
- `raisedBackOfHandMediumLightSkinTone`
- `raisedBackOfHandMediumSkinTone`
- `raisedFist`
- `raisedFistDarkSkinTone`
- `raisedFistLightSkinTone`
- `raisedFistMediumDarkSkinTone`
- `raisedFistMediumLightSkinTone`
- `raisedFistMediumSkinTone`
- `raisedHand`
- `raisedHandDarkSkinTone`
- `raisedHandLightSkinTone`
- `raisedHandMediumDarkSkinTone`
- `raisedHandMediumLightSkinTone`
- `raisedHandMediumSkinTone`
- `raisingHands`
- `raisingHandsDarkSkinTone`
- `raisingHandsLightSkinTone`
- `raisingHandsMediumDarkSkinTone`
- `raisingHandsMediumLightSkinTone`
- `raisingHandsMediumSkinTone`
- `ram`
- `rat`
- `recordButton`
- `recyclingSymbol`
- `redApple`
- `redCircle`
- `redHeart`
- `redPaperLantern`
- `redTrianglePointedDown`
- `redTrianglePointedUp`
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
- `rightFacingFistDarkSkinTone`
- `rightFacingFistLightSkinTone`
- `rightFacingFistMediumDarkSkinTone`
- `rightFacingFistMediumLightSkinTone`
- `rightFacingFistMediumSkinTone`
- `ring`
- `roastedSweetPotato`
- `robot`
- `rocket`
- `rolledUpNewspaper`
- `rollerCoaster`
- `rollingOnTheFloorLaughing`
- `rooster`
- `rose`
- `rosette`
- `roundPushpin`
- `rugbyFootball`
- `runningShirt`
- `runningShoe`
- `sadButRelievedFace`
- `sagittarius`
- `sailboat`
- `sake`
- `santaClaus`
- `santaClausDarkSkinTone`
- `santaClausLightSkinTone`
- `santaClausMediumDarkSkinTone`
- `santaClausMediumLightSkinTone`
- `santaClausMediumSkinTone`
- `satellite`
- `satelliteAntenna`
- `saxophone`
- `school`
- `scissors`
- `scorpio`
- `scorpion`
- `scroll`
- `seat`
- `seeNoEvilMonkey`
- `seedling`
- `selfie`
- `selfieDarkSkinTone`
- `selfieLightSkinTone`
- `selfieMediumDarkSkinTone`
- `selfieMediumLightSkinTone`
- `selfieMediumSkinTone`
- `sevenOclock`
- `sevenThirty`
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
- `shower`
- `shrimp`
- `shuffleTracksButton`
- `signOfTheHorns`
- `signOfTheHornsDarkSkinTone`
- `signOfTheHornsLightSkinTone`
- `signOfTheHornsMediumDarkSkinTone`
- `signOfTheHornsMediumLightSkinTone`
- `signOfTheHornsMediumSkinTone`
- `sixOclock`
- `sixThirty`
- `skier`
- `skis`
- `skull`
- `skullAndCrossbones`
- `sleepingFace`
- `sleepyFace`
- `slightlyFrowningFace`
- `slightlySmilingFace`
- `slotMachine`
- `smallAirplane`
- `smallBlueDiamond`
- `smallOrangeDiamond`
- `smilingCatWithHeartEyes`
- `smilingFace`
- `smilingFaceWithHalo`
- `smilingFaceWithHeartEyes`
- `smilingFaceWithHorns`
- `smilingFaceWithSmilingEyes`
- `smilingFaceWithSunglasses`
- `smirkingFace`
- `snail`
- `snake`
- `sneezingFace`
- `snowCappedMountain`
- `snowboarder`
- `snowflake`
- `snowman`
- `snowmanWithoutSnow`
- `soccerBall`
- `softIceCream`
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
- `station`
- `statueOfLiberty`
- `steamingBowl`
- `stopButton`
- `stopSign`
- `stopwatch`
- `straightRuler`
- `strawberry`
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
- `sweatDroplets`
- `synagogue`
- `syringe`
- `tShirt`
- `taco`
- `tanabataTree`
- `tangerine`
- `taurus`
- `taxi`
- `teacupWithoutHandle`
- `telephone`
- `telephoneReceiver`
- `telescope`
- `television`
- `tenOclock`
- `tenThirty`
- `tennis`
- `tent`
- `thermometer`
- `thinkingFace`
- `thoughtBalloon`
- `threeOclock`
- `threeThirty`
- `thumbsDown`
- `thumbsDownDarkSkinTone`
- `thumbsDownLightSkinTone`
- `thumbsDownMediumDarkSkinTone`
- `thumbsDownMediumLightSkinTone`
- `thumbsDownMediumSkinTone`
- `thumbsUp`
- `thumbsUpDarkSkinTone`
- `thumbsUpLightSkinTone`
- `thumbsUpMediumDarkSkinTone`
- `thumbsUpMediumLightSkinTone`
- `thumbsUpMediumSkinTone`
- `ticket`
- `tiger`
- `tigerFace`
- `timerClock`
- `tiredFace`
- `toilet`
- `tokyoTower`
- `tomato`
- `tongue`
- `topArrow`
- `topHat`
- `tornado`
- `trackball`
- `tractor`
- `tradeMark`
- `train`
- `tram`
- `tramCar`
- `triangularFlag`
- `triangularRuler`
- `tridentEmblem`
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
- `unknownFlag`
- `unlocked`
- `upArrow`
- `upDownArrow`
- `upExclamationButton`
- `upLeftArrow`
- `upRightArrow`
- `upsideDownFace`
- `upwardsButton`
- `verticalTrafficLight`
- `vibrationMode`
- `victoryHand`
- `victoryHandDarkSkinTone`
- `victoryHandLightSkinTone`
- `victoryHandMediumDarkSkinTone`
- `victoryHandMediumLightSkinTone`
- `victoryHandMediumSkinTone`
- `videoCamera`
- `videoGame`
- `videocassette`
- `violin`
- `virgo`
- `volcano`
- `volleyball`
- `vsButton`
- `vulcanSalute`
- `vulcanSaluteDarkSkinTone`
- `vulcanSaluteLightSkinTone`
- `vulcanSaluteMediumDarkSkinTone`
- `vulcanSaluteMediumLightSkinTone`
- `vulcanSaluteMediumSkinTone`
- `waningCrescentMoon`
- `waningGibbousMoon`
- `warning`
- `wastebasket`
- `watch`
- `waterBuffalo`
- `waterCloset`
- `waterWave`
- `watermelon`
- `wavingHand`
- `wavingHandDarkSkinTone`
- `wavingHandLightSkinTone`
- `wavingHandMediumDarkSkinTone`
- `wavingHandMediumLightSkinTone`
- `wavingHandMediumSkinTone`
- `wavyDash`
- `waxingCrescentMoon`
- `waxingGibbousMoon`
- `wearyCat`
- `wearyFace`
- `wedding`
- `whale`
- `wheelOfDharma`
- `wheelchairSymbol`
- `whiteCircle`
- `whiteExclamationMark`
- `whiteFlag`
- `whiteFlower`
- `whiteLargeSquare`
- `whiteMediumSmallSquare`
- `whiteMediumSquare`
- `whiteQuestionMark`
- `whiteSmallSquare`
- `whiteSquareButton`
- `wiltedFlower`
- `windChime`
- `windFace`
- `wineGlass`
- `winkingFace`
- `winkingFaceWithTongue`
- `wolf`
- `woman`
- `womanAndManHoldingHands`
- `womanArtist`
- `womanArtistDarkSkinTone`
- `womanArtistLightSkinTone`
- `womanArtistMediumDarkSkinTone`
- `womanArtistMediumLightSkinTone`
- `womanArtistMediumSkinTone`
- `womanAstronaut`
- `womanAstronautDarkSkinTone`
- `womanAstronautLightSkinTone`
- `womanAstronautMediumDarkSkinTone`
- `womanAstronautMediumLightSkinTone`
- `womanAstronautMediumSkinTone`
- `womanBiking`
- `womanBikingDarkSkinTone`
- `womanBikingLightSkinTone`
- `womanBikingMediumDarkSkinTone`
- `womanBikingMediumLightSkinTone`
- `womanBikingMediumSkinTone`
- `womanBlondHair`
- `womanBouncingBall`
- `womanBouncingBallDarkSkinTone`
- `womanBouncingBallLightSkinTone`
- `womanBouncingBallMediumDarkSkinTone`
- `womanBouncingBallMediumLightSkinTone`
- `womanBouncingBallMediumSkinTone`
- `womanBowing`
- `womanBowingDarkSkinTone`
- `womanBowingLightSkinTone`
- `womanBowingMediumDarkSkinTone`
- `womanBowingMediumLightSkinTone`
- `womanBowingMediumSkinTone`
- `womanCartwheeling`
- `womanCartwheelingDarkSkinTone`
- `womanCartwheelingLightSkinTone`
- `womanCartwheelingMediumDarkSkinTone`
- `womanCartwheelingMediumLightSkinTone`
- `womanCartwheelingMediumSkinTone`
- `womanConstructionWorker`
- `womanConstructionWorkerDarkSkinTone`
- `womanConstructionWorkerLightSkinTone`
- `womanConstructionWorkerMediumDarkSkinTone`
- `womanConstructionWorkerMediumLightSkinTone`
- `womanConstructionWorkerMediumSkinTone`
- `womanCook`
- `womanCookDarkSkinTone`
- `womanCookLightSkinTone`
- `womanCookMediumDarkSkinTone`
- `womanCookMediumLightSkinTone`
- `womanCookMediumSkinTone`
- `womanDancing`
- `womanDancingDarkSkinTone`
- `womanDancingLightSkinTone`
- `womanDancingMediumDarkSkinTone`
- `womanDancingMediumLightSkinTone`
- `womanDancingMediumSkinTone`
- `womanDarkSkinTone`
- `womanDarkSkinToneBlondHair`
- `womanDetective`
- `womanDetectiveDarkSkinTone`
- `womanDetectiveLightSkinTone`
- `womanDetectiveMediumDarkSkinTone`
- `womanDetectiveMediumLightSkinTone`
- `womanDetectiveMediumSkinTone`
- `womanFacepalming`
- `womanFacepalmingDarkSkinTone`
- `womanFacepalmingLightSkinTone`
- `womanFacepalmingMediumDarkSkinTone`
- `womanFacepalmingMediumLightSkinTone`
- `womanFacepalmingMediumSkinTone`
- `womanFactoryWorker`
- `womanFactoryWorkerDarkSkinTone`
- `womanFactoryWorkerLightSkinTone`
- `womanFactoryWorkerMediumDarkSkinTone`
- `womanFactoryWorkerMediumLightSkinTone`
- `womanFactoryWorkerMediumSkinTone`
- `womanFarmer`
- `womanFarmerDarkSkinTone`
- `womanFarmerLightSkinTone`
- `womanFarmerMediumDarkSkinTone`
- `womanFarmerMediumLightSkinTone`
- `womanFarmerMediumSkinTone`
- `womanFirefighter`
- `womanFirefighterDarkSkinTone`
- `womanFirefighterLightSkinTone`
- `womanFirefighterMediumDarkSkinTone`
- `womanFirefighterMediumLightSkinTone`
- `womanFirefighterMediumSkinTone`
- `womanFrowning`
- `womanFrowningDarkSkinTone`
- `womanFrowningLightSkinTone`
- `womanFrowningMediumDarkSkinTone`
- `womanFrowningMediumLightSkinTone`
- `womanFrowningMediumSkinTone`
- `womanGesturingNo`
- `womanGesturingNoDarkSkinTone`
- `womanGesturingNoLightSkinTone`
- `womanGesturingNoMediumDarkSkinTone`
- `womanGesturingNoMediumLightSkinTone`
- `womanGesturingNoMediumSkinTone`
- `womanGesturingOk`
- `womanGesturingOkDarkSkinTone`
- `womanGesturingOkLightSkinTone`
- `womanGesturingOkMediumDarkSkinTone`
- `womanGesturingOkMediumLightSkinTone`
- `womanGesturingOkMediumSkinTone`
- `womanGettingHaircut`
- `womanGettingHaircutDarkSkinTone`
- `womanGettingHaircutLightSkinTone`
- `womanGettingHaircutMediumDarkSkinTone`
- `womanGettingHaircutMediumLightSkinTone`
- `womanGettingHaircutMediumSkinTone`
- `womanGettingMassage`
- `womanGettingMassageDarkSkinTone`
- `womanGettingMassageLightSkinTone`
- `womanGettingMassageMediumDarkSkinTone`
- `womanGettingMassageMediumLightSkinTone`
- `womanGettingMassageMediumSkinTone`
- `womanGolfing`
- `womanGuard`
- `womanGuardDarkSkinTone`
- `womanGuardLightSkinTone`
- `womanGuardMediumDarkSkinTone`
- `womanGuardMediumLightSkinTone`
- `womanGuardMediumSkinTone`
- `womanHealthWorker`
- `womanHealthWorkerDarkSkinTone`
- `womanHealthWorkerLightSkinTone`
- `womanHealthWorkerMediumDarkSkinTone`
- `womanHealthWorkerMediumLightSkinTone`
- `womanHealthWorkerMediumSkinTone`
- `womanJudge`
- `womanJudgeDarkSkinTone`
- `womanJudgeLightSkinTone`
- `womanJudgeMediumDarkSkinTone`
- `womanJudgeMediumLightSkinTone`
- `womanJudgeMediumSkinTone`
- `womanJuggling`
- `womanJugglingDarkSkinTone`
- `womanJugglingLightSkinTone`
- `womanJugglingMediumDarkSkinTone`
- `womanJugglingMediumLightSkinTone`
- `womanJugglingMediumSkinTone`
- `womanLiftingWeights`
- `womanLiftingWeightsDarkSkinTone`
- `womanLiftingWeightsLightSkinTone`
- `womanLiftingWeightsMediumDarkSkinTone`
- `womanLiftingWeightsMediumLightSkinTone`
- `womanLiftingWeightsMediumSkinTone`
- `womanLightSkinTone`
- `womanLightSkinToneBlondHair`
- `womanMechanic`
- `womanMechanicDarkSkinTone`
- `womanMechanicLightSkinTone`
- `womanMechanicMediumDarkSkinTone`
- `womanMechanicMediumLightSkinTone`
- `womanMechanicMediumSkinTone`
- `womanMediumDarkSkinTone`
- `womanMediumDarkSkinToneBlondHair`
- `womanMediumLightSkinTone`
- `womanMediumLightSkinToneBlondHair`
- `womanMediumSkinTone`
- `womanMediumSkinToneBlondHair`
- `womanMountainBiking`
- `womanMountainBikingDarkSkinTone`
- `womanMountainBikingLightSkinTone`
- `womanMountainBikingMediumDarkSkinTone`
- `womanMountainBikingMediumLightSkinTone`
- `womanMountainBikingMediumSkinTone`
- `womanOfficeWorker`
- `womanOfficeWorkerDarkSkinTone`
- `womanOfficeWorkerLightSkinTone`
- `womanOfficeWorkerMediumDarkSkinTone`
- `womanOfficeWorkerMediumLightSkinTone`
- `womanOfficeWorkerMediumSkinTone`
- `womanPilot`
- `womanPilotDarkSkinTone`
- `womanPilotLightSkinTone`
- `womanPilotMediumDarkSkinTone`
- `womanPilotMediumLightSkinTone`
- `womanPilotMediumSkinTone`
- `womanPlayingHandball`
- `womanPlayingHandballDarkSkinTone`
- `womanPlayingHandballLightSkinTone`
- `womanPlayingHandballMediumDarkSkinTone`
- `womanPlayingHandballMediumLightSkinTone`
- `womanPlayingHandballMediumSkinTone`
- `womanPlayingWaterPolo`
- `womanPlayingWaterPoloDarkSkinTone`
- `womanPlayingWaterPoloLightSkinTone`
- `womanPlayingWaterPoloMediumDarkSkinTone`
- `womanPlayingWaterPoloMediumLightSkinTone`
- `womanPlayingWaterPoloMediumSkinTone`
- `womanPoliceOfficer`
- `womanPoliceOfficerDarkSkinTone`
- `womanPoliceOfficerLightSkinTone`
- `womanPoliceOfficerMediumDarkSkinTone`
- `womanPoliceOfficerMediumLightSkinTone`
- `womanPoliceOfficerMediumSkinTone`
- `womanPouting`
- `womanPoutingDarkSkinTone`
- `womanPoutingLightSkinTone`
- `womanPoutingMediumDarkSkinTone`
- `womanPoutingMediumLightSkinTone`
- `womanPoutingMediumSkinTone`
- `womanRaisingHand`
- `womanRaisingHandDarkSkinTone`
- `womanRaisingHandLightSkinTone`
- `womanRaisingHandMediumDarkSkinTone`
- `womanRaisingHandMediumLightSkinTone`
- `womanRaisingHandMediumSkinTone`
- `womanRowingBoat`
- `womanRowingBoatDarkSkinTone`
- `womanRowingBoatLightSkinTone`
- `womanRowingBoatMediumDarkSkinTone`
- `womanRowingBoatMediumLightSkinTone`
- `womanRowingBoatMediumSkinTone`
- `womanRunning`
- `womanRunningDarkSkinTone`
- `womanRunningLightSkinTone`
- `womanRunningMediumDarkSkinTone`
- `womanRunningMediumLightSkinTone`
- `womanRunningMediumSkinTone`
- `womanScientist`
- `womanScientistDarkSkinTone`
- `womanScientistLightSkinTone`
- `womanScientistMediumDarkSkinTone`
- `womanScientistMediumLightSkinTone`
- `womanScientistMediumSkinTone`
- `womanShrugging`
- `womanShruggingDarkSkinTone`
- `womanShruggingLightSkinTone`
- `womanShruggingMediumDarkSkinTone`
- `womanShruggingMediumLightSkinTone`
- `womanShruggingMediumSkinTone`
- `womanSinger`
- `womanSingerDarkSkinTone`
- `womanSingerLightSkinTone`
- `womanSingerMediumDarkSkinTone`
- `womanSingerMediumLightSkinTone`
- `womanSingerMediumSkinTone`
- `womanStudent`
- `womanStudentDarkSkinTone`
- `womanStudentLightSkinTone`
- `womanStudentMediumDarkSkinTone`
- `womanStudentMediumLightSkinTone`
- `womanStudentMediumSkinTone`
- `womanSurfing`
- `womanSurfingDarkSkinTone`
- `womanSurfingLightSkinTone`
- `womanSurfingMediumDarkSkinTone`
- `womanSurfingMediumLightSkinTone`
- `womanSurfingMediumSkinTone`
- `womanSwimming`
- `womanSwimmingDarkSkinTone`
- `womanSwimmingLightSkinTone`
- `womanSwimmingMediumDarkSkinTone`
- `womanSwimmingMediumLightSkinTone`
- `womanSwimmingMediumSkinTone`
- `womanTeacher`
- `womanTeacherDarkSkinTone`
- `womanTeacherLightSkinTone`
- `womanTeacherMediumDarkSkinTone`
- `womanTeacherMediumLightSkinTone`
- `womanTeacherMediumSkinTone`
- `womanTechnologist`
- `womanTechnologistDarkSkinTone`
- `womanTechnologistLightSkinTone`
- `womanTechnologistMediumDarkSkinTone`
- `womanTechnologistMediumLightSkinTone`
- `womanTechnologistMediumSkinTone`
- `womanTippingHand`
- `womanTippingHandDarkSkinTone`
- `womanTippingHandLightSkinTone`
- `womanTippingHandMediumDarkSkinTone`
- `womanTippingHandMediumLightSkinTone`
- `womanTippingHandMediumSkinTone`
- `womanWalking`
- `womanWalkingDarkSkinTone`
- `womanWalkingLightSkinTone`
- `womanWalkingMediumDarkSkinTone`
- `womanWalkingMediumLightSkinTone`
- `womanWalkingMediumSkinTone`
- `womanWearingTurban`
- `womanWearingTurbanDarkSkinTone`
- `womanWearingTurbanLightSkinTone`
- `womanWearingTurbanMediumDarkSkinTone`
- `womanWearingTurbanMediumLightSkinTone`
- `womanWearingTurbanMediumSkinTone`
- `womansBoot`
- `womansClothes`
- `womansHat`
- `womansSandal`
- `womenHoldingHands`
- `womenWithBunnyEars`
- `womenWrestling`
- `womenWrestlingDarkSkinTone`
- `womenWrestlingLightSkinTone`
- `womenWrestlingMediumDarkSkinTone`
- `womenWrestlingMediumLightSkinTone`
- `womenWrestlingMediumSkinTone`
- `womensRoom`
- `worldMap`
- `worriedFace`
- `wrappedGift`
- `wrench`
- `writingHand`
- `writingHandDarkSkinTone`
- `writingHandLightSkinTone`
- `writingHandMediumDarkSkinTone`
- `writingHandMediumLightSkinTone`
- `writingHandMediumSkinTone`
- `yellowHeart`
- `yenBanknote`
- `yinYang`
- `zipperMouthFace`
- `zzz`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><1stPlaceMedalIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><2ndPlaceMedalIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3rdPlaceMedalIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AButtonBloodTypeIcon size="20" class="nav-icon" /> Settings</a>
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
<1stPlaceMedalIcon
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
    <1stPlaceMedalIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <2ndPlaceMedalIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3rdPlaceMedalIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <1stPlaceMedalIcon size="24" />
   <2ndPlaceMedalIcon size="24" color="#4a90e2" />
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
   <1stPlaceMedalIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <1stPlaceMedalIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <1stPlaceMedalIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 1stPlaceMedal } from '@stacksjs/iconify-noto-v1'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(1stPlaceMedal, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 1stPlaceMedal } from '@stacksjs/iconify-noto-v1'

// Icons are typed as IconData
const myIcon: IconData = 1stPlaceMedal
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Apache 2.0

See [license details](https://github.com/googlefonts/noto-emoji/blob/main/svg/LICENSE) for more information.

## Credits

- **Icons**: Google Inc ([Website](https://github.com/googlefonts/noto-emoji))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/noto-v1/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/noto-v1/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
