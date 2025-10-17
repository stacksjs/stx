# Emoji One (v1)

> Emoji One (v1) icons for stx from Iconify

## Overview

This package provides access to 1262 icons from the Emoji One (v1) collection through the stx iconify integration.

**Collection ID:** `emojione-v1`
**Total Icons:** 1262
**Author:** Emoji One ([Website](https://github.com/joypixels/emojione-legacy))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** Emoji
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-emojione-v1
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AButtonIcon height="1em" />
<AButtonIcon width="1em" height="1em" />
<AButtonIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AButtonIcon size="24" />
<AButtonIcon size="1em" />

<!-- Using width and height -->
<AButtonIcon width="24" height="32" />

<!-- With color -->
<AButtonIcon size="24" color="red" />
<AButtonIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AButtonIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AButtonIcon
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
    <AButtonIcon size="24" />
    <AbButtonIcon size="24" color="#4a90e2" />
    <AdmissionTicketsIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { aButton, abButton, admissionTickets } from '@stacksjs/iconify-emojione-v1'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(aButton, { size: 24 })
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
<AButtonIcon size="24" color="red" />
<AButtonIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AButtonIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AButtonIcon size="24" class="text-primary" />
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
<AButtonIcon height="1em" />
<AButtonIcon width="1em" height="1em" />
<AButtonIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AButtonIcon size="24" />
<AButtonIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.emojioneV1-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AButtonIcon class="emojioneV1-icon" />
```

## Available Icons

This package contains **1262** icons:

- `aButton`
- `abButton`
- `admissionTickets`
- `aerialTramway`
- `airplane`
- `airplaneArrival`
- `airplaneDeparture`
- `alarmClock`
- `alien`
- `alienMonster`
- `ambulance`
- `americanFootball`
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
- `astonishedFace`
- `atmSign`
- `automobile`
- `bButton`
- `baby`
- `babyAngel`
- `babyBottle`
- `babyChick`
- `babySymbol`
- `backArrow`
- `backOfEnvelope`
- `backhandIndexPointingDown`
- `backhandIndexPointingLeft`
- `backhandIndexPointingRight`
- `backhandIndexPointingUp`
- `backpack`
- `baggageClaim`
- `balloon`
- `ballotBoxBoldCheck`
- `ballotBoxWithBallot`
- `ballotBoxWithCheck`
- `ballotBoxWithScriptX`
- `ballotScriptX`
- `banana`
- `bank`
- `barChart`
- `barberPole`
- `baseball`
- `basketball`
- `bathtub`
- `battery`
- `beachWithUmbrella`
- `beamingFaceWithSmilingEyes`
- `bearFace`
- `beatingHeart`
- `bed`
- `beerMug`
- `bell`
- `bellWithSlash`
- `bellhopBell`
- `bentoBox`
- `bicycle`
- `bikini`
- `bird`
- `birthdayCake`
- `blackCircle`
- `blackHardShellFloppy`
- `blackLargeSquare`
- `blackMediumSmallSquare`
- `blackMediumSquare`
- `blackNib`
- `blackPennant`
- `blackPushPin`
- `blackRosette`
- `blackSkullCrossBones`
- `blackSmallSquare`
- `blackSquareButton`
- `blackTouchToneTelephone`
- `blondHairedPerson`
- `blossom`
- `blowfish`
- `blueBook`
- `blueCircle`
- `blueHeart`
- `boar`
- `bomb`
- `book2`
- `bookmark`
- `bookmarkTabs`
- `books`
- `bouquet`
- `bouquetOfFlowers`
- `bowling`
- `boy`
- `boysSymbol`
- `bread`
- `brideWithVeil`
- `bridgeAtNight`
- `briefcase`
- `brightButton`
- `brokenHeart`
- `bug`
- `buildingConstruction`
- `bullHorn`
- `bullHornWithSoundWaves`
- `bulletTrain`
- `bus`
- `busStop`
- `bustInSilhouette`
- `bustsInSilhouette`
- `cactus`
- `calendar`
- `camel`
- `camera`
- `cameraWithFlash`
- `camping`
- `cancellationX`
- `cancer`
- `candle`
- `candy`
- `capricorn`
- `cardFileBox`
- `cardIndex`
- `cardIndexDividers`
- `carouselHorse`
- `carpStreamer`
- `castle`
- `cat`
- `catFace`
- `catFaceWithTearsOfJoy`
- `catFaceWithWrySmile`
- `celticCross`
- `chartDecreasing`
- `chartIncreasing`
- `chartIncreasingWithYen`
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
- `circledInformationSource`
- `circledM`
- `circusTent`
- `cityscape`
- `cityscapeAtDusk`
- `clButton`
- `clamShellMobile`
- `clamp`
- `clapperBoard`
- `clappingHands`
- `classicalBuilding`
- `clinkingBeerMugs`
- `clipboard`
- `clockwiseLeftRightArrows`
- `clockwiseVerticalArrows`
- `closedBook`
- `closedMailboxWithLoweredFlag`
- `closedMailboxWithRaisedFlag`
- `closedUmbrella`
- `cloud`
- `cloudWithLightning`
- `cloudWithRain`
- `cloudWithSnow`
- `clubSuit`
- `clutchBag`
- `cocktailGlass`
- `collision`
- `computerDisk`
- `confettiBall`
- `confoundedFace`
- `confusedFace`
- `construction`
- `constructionWorker`
- `controlKnobs`
- `convenienceStore`
- `cookedRice`
- `cookie`
- `cooking`
- `coolButton`
- `copyright`
- `couchAndLamp`
- `counterclockwiseArrowsButton`
- `coupleWithHeart`
- `coupleWithHeartManMan`
- `coupleWithHeartWomanWoman`
- `cow`
- `cowFace`
- `crayon`
- `creditCard`
- `crescentMoon`
- `crocodile`
- `crossMark`
- `crossMarkButton`
- `crown`
- `cryingCatFace`
- `cryingFace`
- `crystalBall`
- `curlyLoop`
- `currencyExchange`
- `curryRice`
- `custard`
- `customs`
- `cyclone`
- `dagger`
- `dango`
- `dashingAway`
- `deciduousTree`
- `deliveryTruck`
- `departmentStore`
- `derelictHouse`
- `desert`
- `desertIsland`
- `desktopComputer`
- `detective`
- `diamondSuit`
- `diamondWithADot`
- `dieselLocomotive`
- `dimButton`
- `directHit`
- `disappointedFace`
- `dizzy`
- `dizzyFace`
- `document`
- `documentWithText`
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
- `droplet`
- `dvd`
- `eMail`
- `ear`
- `earOfCorn`
- `eggplant`
- `eightOclock`
- `eightPointedStar`
- `eightSpokedAsterisk`
- `eightThirty`
- `electricPlug`
- `elephant`
- `elevenOclock`
- `elevenThirty`
- `emptyNotePad`
- `emptyNotePage`
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
- `eyes`
- `faceBlowingAKiss`
- `faceSavoringFood`
- `faceScreamingInFear`
- `faceWithMedicalMask`
- `faceWithOpenMouth`
- `faceWithSteamFromNose`
- `faceWithTearsOfJoy`
- `faceWithTongue`
- `faceWithoutMouth`
- `factory`
- `fallenLeaf`
- `family`
- `familyManManBoy`
- `familyManManBoyBoy`
- `familyManManGirl`
- `familyManManGirlBoy`
- `familyManManGirlGirl`
- `familyManWomanBoyBoy`
- `familyManWomanGirl`
- `familyManWomanGirlBoy`
- `familyManWomanGirlGirl`
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
- `ferrisWheel`
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
- `flagForAfghanistan`
- `flagForAlbania`
- `flagForAlgeria`
- `flagForAndorra`
- `flagForAngola`
- `flagForAnguilla`
- `flagForAntiguaAndBarbuda`
- `flagForArgentina`
- `flagForArmenia`
- `flagForAruba`
- `flagForAscensionIsland`
- `flagForAustralia`
- `flagForAustria`
- `flagForAzerbaijan`
- `flagForBahamas`
- `flagForBahrain`
- `flagForBangladesh`
- `flagForBarbados`
- `flagForBelarus`
- `flagForBelgium`
- `flagForBelize`
- `flagForBenin`
- `flagForBermuda`
- `flagForBhutan`
- `flagForBlackFlag`
- `flagForBolivia`
- `flagForBosniaAndHerzegovina`
- `flagForBotswana`
- `flagForBrazil`
- `flagForBrunei`
- `flagForBulgaria`
- `flagForBurkinaFaso`
- `flagForBurundi`
- `flagForCambodia`
- `flagForCameroon`
- `flagForCanada`
- `flagForCapeVerde`
- `flagForCaymanIslands`
- `flagForCentralAfricanRepublic`
- `flagForChad`
- `flagForChequeredFlag`
- `flagForChile`
- `flagForChina`
- `flagForColombia`
- `flagForComoros`
- `flagForCongoBrazzaville`
- `flagForCongoKinshasa`
- `flagForCostaRica`
- `flagForCoteDivoire`
- `flagForCroatia`
- `flagForCrossedFlags`
- `flagForCuba`
- `flagForCyprus`
- `flagForCzechia`
- `flagForDenmark`
- `flagForDjibouti`
- `flagForDominica`
- `flagForDominicanRepublic`
- `flagForEcuador`
- `flagForEgypt`
- `flagForElSalvador`
- `flagForEquatorialGuinea`
- `flagForEritrea`
- `flagForEstonia`
- `flagForEthiopia`
- `flagForFalklandIslands`
- `flagForFaroeIslands`
- `flagForFiji`
- `flagForFinland`
- `flagForFrance`
- `flagForFrenchPolynesia`
- `flagForGabon`
- `flagForGambia`
- `flagForGeorgia`
- `flagForGermany`
- `flagForGhana`
- `flagForGibraltar`
- `flagForGreece`
- `flagForGreenland`
- `flagForGrenada`
- `flagForGuam`
- `flagForGuatemala`
- `flagForGuinea`
- `flagForGuineaBissau`
- `flagForGuyana`
- `flagForHaiti`
- `flagForHonduras`
- `flagForHongKongSarChina`
- `flagForHungary`
- `flagForIceland`
- `flagForIndia`
- `flagForIndonesia`
- `flagForIran`
- `flagForIraq`
- `flagForIreland`
- `flagForIsrael`
- `flagForItaly`
- `flagForJamaica`
- `flagForJapan`
- `flagForJersey`
- `flagForJordan`
- `flagForKazakhstan`
- `flagForKenya`
- `flagForKiribati`
- `flagForKosovo`
- `flagForKuwait`
- `flagForKyrgyzstan`
- `flagForLaos`
- `flagForLatvia`
- `flagForLebanon`
- `flagForLesotho`
- `flagForLiberia`
- `flagForLibya`
- `flagForLiechtenstein`
- `flagForLithuania`
- `flagForLuxembourg`
- `flagForMacauSarChina`
- `flagForMacedonia`
- `flagForMadagascar`
- `flagForMalawi`
- `flagForMalaysia`
- `flagForMaldives`
- `flagForMali`
- `flagForMalta`
- `flagForMarshallIslands`
- `flagForMauritania`
- `flagForMauritius`
- `flagForMexico`
- `flagForMicronesia`
- `flagForMoldova`
- `flagForMonaco`
- `flagForMongolia`
- `flagForMontenegro`
- `flagForMontserrat`
- `flagForMorocco`
- `flagForMozambique`
- `flagForMyanmar`
- `flagForNamibia`
- `flagForNauru`
- `flagForNepal`
- `flagForNetherlands`
- `flagForNewCaledonia`
- `flagForNewZealand`
- `flagForNicaragua`
- `flagForNiger`
- `flagForNigeria`
- `flagForNiue`
- `flagForNorthKorea`
- `flagForNorway`
- `flagForOman`
- `flagForPakistan`
- `flagForPalau`
- `flagForPalestinianTerritories`
- `flagForPanama`
- `flagForPapuaNewGuinea`
- `flagForParaguay`
- `flagForPeru`
- `flagForPhilippines`
- `flagForPoland`
- `flagForPortugal`
- `flagForPuertoRico`
- `flagForQatar`
- `flagForRomania`
- `flagForRussia`
- `flagForRwanda`
- `flagForSamoa`
- `flagForSanMarino`
- `flagForSaoTomeAndPrincipe`
- `flagForSaudiArabia`
- `flagForSenegal`
- `flagForSerbia`
- `flagForSeychelles`
- `flagForSierraLeone`
- `flagForSingapore`
- `flagForSlovakia`
- `flagForSlovenia`
- `flagForSolomonIslands`
- `flagForSomalia`
- `flagForSouthAfrica`
- `flagForSouthKorea`
- `flagForSpain`
- `flagForSriLanka`
- `flagForStHelena`
- `flagForStKittsAndNevis`
- `flagForStLucia`
- `flagForStVincentAndGrenadines`
- `flagForSudan`
- `flagForSuriname`
- `flagForSwaziland`
- `flagForSweden`
- `flagForSwitzerland`
- `flagForSyria`
- `flagForTaiwan`
- `flagForTajikistan`
- `flagForTanzania`
- `flagForThailand`
- `flagForTimorLeste`
- `flagForTogo`
- `flagForTonga`
- `flagForTriangularFlag`
- `flagForTrinidadAndTobago`
- `flagForTunisia`
- `flagForTurkey`
- `flagForTurkmenistan`
- `flagForTuvalu`
- `flagForUganda`
- `flagForUkraine`
- `flagForUnitedArabEmirates`
- `flagForUnitedKingdom`
- `flagForUnitedStates`
- `flagForUruguay`
- `flagForUsVirginIslands`
- `flagForUzbekistan`
- `flagForVanuatu`
- `flagForVaticanCity`
- `flagForVenezuela`
- `flagForVietnam`
- `flagForWallisAndFutuna`
- `flagForWesternSahara`
- `flagForWhiteFlag`
- `flagForYemen`
- `flagForZambia`
- `flagForZimbabwe`
- `flagInHole`
- `flashlight`
- `flexedBiceps`
- `floppyDisk`
- `flowerPlayingCards`
- `flushedFace`
- `flyingEnvelope`
- `fog`
- `foggy`
- `foldedHands`
- `folder`
- `footprints`
- `forkAndKnife`
- `forkAndKnifeWithPlate`
- `fountain`
- `fountainPen`
- `fourLeafClover`
- `fourOclock`
- `fourThirty`
- `frameWithTiles`
- `frameWithX`
- `framedPicture`
- `freeButton`
- `frenchFries`
- `friedShrimp`
- `frogFace`
- `frontFacingBabyChick`
- `frowningFaceWithOpenMouth`
- `fuelPump`
- `fullMoon`
- `fullMoonFace`
- `gameDie`
- `gemStone`
- `gemini`
- `ghost`
- `girl`
- `girlsSymbol`
- `glasses`
- `globeShowingAmericas`
- `globeShowingAsiaAustralia`
- `globeShowingEuropeAfrica`
- `globeWithMeridians`
- `glowingStar`
- `goat`
- `goblin`
- `graduationCap`
- `grapes`
- `greenApple`
- `greenBook`
- `greenHeart`
- `grimacingFace`
- `grinningCatFace`
- `grinningCatFaceWithSmilingEyes`
- `grinningFace`
- `grinningFaceWithBigEyes`
- `grinningFaceWithSmilingEyes`
- `grinningFaceWithSweat`
- `grinningSquintingFace`
- `growingHeart`
- `guard`
- `guitar`
- `hamburger`
- `hammer`
- `hammerAndWrench`
- `hamsterFace`
- `handWithFingersSplayed`
- `handbag`
- `hardDisk`
- `hatchingChick`
- `headphone`
- `hearNoEvilMonkey`
- `heartDecoration`
- `heartLeftTip`
- `heartSuit`
- `heartWithArrow`
- `heartWithRibbon`
- `heavyCheckMark`
- `heavyDivisionSign`
- `heavyDollarSign`
- `heavyLargeCircle`
- `heavyLatinCross`
- `heavyMinusSign`
- `heavyMultiplicationX`
- `heavyPlusSign`
- `helicopter`
- `herb`
- `hibiscus`
- `highHeeledShoe`
- `highSpeedTrain`
- `highVoltage`
- `hole`
- `honeyPot`
- `honeybee`
- `horizontalTrafficLight`
- `horse`
- `horseFace`
- `horseRacing`
- `hospital`
- `hotBeverage`
- `hotPepper`
- `hotSprings`
- `hotel`
- `hourglassDone`
- `hourglassNotDone`
- `house`
- `houseWithGarden`
- `houses`
- `hundredPoints`
- `hushedFace`
- `iceCream`
- `idButton`
- `inboxTray`
- `incomingEnvelope`
- `indexPointingUp`
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
- `key`
- `keyboard`
- `keyboardAndMouse`
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
- `keycapPound`
- `kimono`
- `kiss`
- `kissManMan`
- `kissMark`
- `kissWomanWoman`
- `kissingCatFace`
- `kissingFace`
- `kissingFaceWithClosedEyes`
- `kissingFaceWithSmilingEyes`
- `kitchenKnife`
- `koala`
- `label`
- `ladyBeetle`
- `laptopComputer`
- `largeBlueDiamond`
- `largeOrangeDiamond`
- `lastQuarterMoon`
- `lastQuarterMoonFace`
- `leafFlutteringInWind`
- `ledger`
- `leftAngerBubble`
- `leftArrow`
- `leftArrowCurvingRight`
- `leftCheckMark`
- `leftHandPhone`
- `leftLuggage`
- `leftRightArrow`
- `leftSpeechBubble`
- `leftThoughtBubble`
- `leftWritingHand`
- `lemon`
- `leo`
- `leopard`
- `levelSlider`
- `libra`
- `lightBulb`
- `lightRail`
- `lightningMood`
- `lightningMoodBubble`
- `link`
- `linkedPaperclips`
- `lips2`
- `lipstick`
- `litterInBinSign`
- `locked`
- `lockedWithKey`
- `lockedWithPen`
- `locomotive`
- `lollipop`
- `loudlyCryingFace`
- `loudspeaker`
- `loveHotel`
- `loveLetter`
- `lowerLeftPencil`
- `magnifyingGlassTiltedLeft`
- `magnifyingGlassTiltedRight`
- `mahjongRedDragon`
- `man`
- `manAndWomanHoldingHands`
- `manInSuitLevitating`
- `manWithChineseCap`
- `mansShoe`
- `mantelpieceClock`
- `mapOfJapan`
- `mapleLeaf`
- `meatOnBone`
- `megaphone`
- `melon`
- `memo`
- `mensRoom`
- `metro`
- `microphone`
- `microscope`
- `middleFinger`
- `militaryMedal`
- `milkyWay`
- `minibus`
- `moai`
- `mobilePhone`
- `mobilePhoneOff`
- `mobilePhoneWithArrow`
- `moneyBag`
- `moneyWithWings`
- `monkey`
- `monkeyFace`
- `monorail`
- `moodBubble`
- `moonViewingCeremony`
- `motorBoat`
- `motorcycle`
- `motorway`
- `mountFuji`
- `mountainCableway`
- `mountainRailway`
- `mouse`
- `mouseFace`
- `mouth`
- `movieCamera`
- `mushroom`
- `musicAscend`
- `musicDescend`
- `musicalKeyboard`
- `musicalNote`
- `musicalNotes`
- `musicalScore`
- `mutedSpeaker`
- `nailPolish`
- `nameBadge`
- `nationalPark`
- `necktie`
- `neutralFace`
- `newButton`
- `newMoon`
- `newMoonFace`
- `newspaper`
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
- `noPiracy`
- `noSmoking`
- `nonPotableWater`
- `northeastPointingAirplane`
- `nose`
- `notePad`
- `notePage`
- `notebook`
- `notebookWithDecorativeCover`
- `nutAndBolt`
- `oButton`
- `octopus`
- `oden`
- `officeBuilding`
- `ogre`
- `oilDrum`
- `okButton`
- `okHand`
- `oldKey`
- `oldMan`
- `oldPersonalComputer`
- `oldWoman`
- `om`
- `onArrow`
- `oncomingAutomobile`
- `oncomingBus`
- `oncomingFireEngine`
- `oncomingFist`
- `oncomingPoliceCar`
- `oncomingTaxi`
- `oneButtonMouse`
- `oneOclock`
- `oneThirty`
- `openBook`
- `openFileFolder`
- `openFolder`
- `openHands`
- `openMailboxWithLoweredFlag`
- `openMailboxWithRaisedFlag`
- `ophiuchus`
- `opticalDiscIcon`
- `opticalDisk`
- `orangeBook`
- `outboxTray`
- `ox`
- `pButton`
- `package`
- `page`
- `pageFacingUp`
- `pageWithCurl`
- `pager`
- `pages`
- `paintbrush`
- `palmTree`
- `pandaFace`
- `paperclip`
- `partAlternationMark`
- `partyPopper`
- `passengerShip`
- `passportControl`
- `pawPrints`
- `peach`
- `pear`
- `pen`
- `penOverStampedEnvelope`
- `pencil`
- `penguin`
- `pensiveFace`
- `peopleWithBunnyEars`
- `performingArts`
- `perseveringFace`
- `personBiking`
- `personBowing`
- `personFrowning`
- `personGesturingNo`
- `personGesturingOk`
- `personGettingHaircut`
- `personGettingMassage`
- `personGolfing`
- `personInBed`
- `personLiftingWeights`
- `personMountainBiking`
- `personPouting`
- `personRaisingHand`
- `personRowingBoat`
- `personRunning`
- `personSurfing`
- `personSwimming`
- `personTakingBath`
- `personTippingHand`
- `personWalking`
- `personWearingTurban`
- `pig`
- `pigFace`
- `pigNose`
- `pileOfPoo`
- `pill`
- `pineDecoration`
- `pineapple`
- `pisces`
- `pistol`
- `pizza`
- `playButton`
- `pocketCalculator`
- `policeCar`
- `policeCarLight`
- `policeOfficer`
- `poodle`
- `pool8Ball`
- `portableStereo`
- `postOffice`
- `postalHorn`
- `postbox`
- `potOfFood`
- `potableWater`
- `poultryLeg`
- `poundBanknote`
- `poutingCatFace`
- `poutingFace`
- `princess`
- `printer`
- `prohibited`
- `prohibitedSign`
- `purpleHeart`
- `purse`
- `pushpin`
- `questionMark`
- `rabbit`
- `rabbitFace`
- `racingCar`
- `radio`
- `radioButton`
- `railwayCar`
- `railwayTrack`
- `rainbow`
- `raisedFist`
- `raisedHand`
- `raisingHands`
- `ram`
- `rat`
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
- `restroom`
- `reverseButton`
- `reverseRaisedHandsFingersSplayed`
- `reverseThumbsDown`
- `reverseThumbsUp`
- `reverseVictoryHand`
- `revolvingHearts`
- `ribbon`
- `riceBall`
- `riceCracker`
- `rightAngerBubble`
- `rightArrow`
- `rightArrowCurvingDown`
- `rightArrowCurvingLeft`
- `rightArrowCurvingUp`
- `rightSpeaker`
- `rightSpeaker3SoundWaves`
- `rightSpeechBubble`
- `rightThoughtBubble`
- `ring`
- `ringingBell`
- `roastedSweetPotato`
- `rocket`
- `rolledUpNewspaper`
- `rollerCoaster`
- `rooster`
- `rose`
- `rosette`
- `roundPushpin`
- `roundedCorners`
- `rugbyFootball`
- `runningShirt`
- `runningShoe`
- `sadButRelievedFace`
- `sagittarius`
- `sailboat`
- `sake`
- `santaClaus`
- `satellite`
- `satelliteAntenna`
- `saxophone`
- `school`
- `scissors`
- `scorpio`
- `scroll`
- `seat`
- `seeNoEvilMonkey`
- `seedling`
- `sevenOclock`
- `sevenThirty`
- `shavedIce`
- `sheafOfRice`
- `shield`
- `ship`
- `shootingStar`
- `shoppingBags`
- `shortcake`
- `shower`
- `shuffleTracksButton`
- `sidewaysDownPointingIndex`
- `sidewaysLeftPointingIndex`
- `sidewaysRightPointingIndex`
- `sidewaysUpPointingIndex`
- `sixOclock`
- `sixThirty`
- `skis`
- `skull`
- `sleepingFace`
- `sleepyFace`
- `slightlyFrowningFace`
- `slightlySmilingFace`
- `slotMachine`
- `smallAirplane`
- `smallBlueDiamond`
- `smallOrangeDiamond`
- `smilingCatFaceWithHeartEyes`
- `smilingFace`
- `smilingFaceWithHalo`
- `smilingFaceWithHeartEyes`
- `smilingFaceWithHorns`
- `smilingFaceWithSmilingEyes`
- `smilingFaceWithSunglasses`
- `smirkingFace`
- `snail`
- `snake`
- `snowCappedMountain`
- `snowboarder`
- `snowflake`
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
- `speakerWith1SoundWave`
- `speakingHead`
- `speechBalloon`
- `speedboat`
- `spider`
- `spiderWeb`
- `spiralCalendar`
- `spiralNotepad`
- `spiralShell`
- `sportUtilityVehicle`
- `sportsMedal`
- `spoutingWhale`
- `squintingFaceWithTongue`
- `stadium`
- `stampedEnvelope`
- `star`
- `station`
- `statueOfLiberty`
- `steamingBowl`
- `stockChart`
- `straightRuler`
- `strawberry`
- `studioMicrophone`
- `sun`
- `sunBehindCloud`
- `sunWithFace`
- `sunflower`
- `sunglasses`
- `sunrise`
- `sunriseOverMountains`
- `sunset`
- `sushi`
- `suspensionRailway`
- `sweatDroplets`
- `syringe`
- `tShirt`
- `tanabataTree`
- `tangerine`
- `tapeCartridge`
- `taurus`
- `taxi`
- `teacupWithoutHandle`
- `tearOffCalendar`
- `telephone`
- `telephoneReceiver`
- `telescope`
- `television`
- `tenOclock`
- `tenThirty`
- `tennis`
- `tent`
- `thermometer`
- `thoughtBalloon`
- `threeNetworkedComputers`
- `threeOclock`
- `threeSpeechBubbles`
- `threeThirty`
- `thumbsDown`
- `thumbsUp`
- `ticket`
- `tiger`
- `tigerFace`
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
- `triangularRuler`
- `tridentEmblem`
- `trolleybus`
- `trophy`
- `tropicalDrink`
- `tropicalFish`
- `trumpet`
- `tulip`
- `turnedOkHand`
- `turtle`
- `twelveOclock`
- `twelveThirty`
- `twoHearts`
- `twoHumpCamel`
- `twoMenHoldingHands`
- `twoOclock`
- `twoSpeechBubbles`
- `twoThirty`
- `twoWomenHoldingHands`
- `umbrellaWithRainDrops`
- `unamusedFace`
- `unlocked`
- `upArrow`
- `upDownArrow`
- `upLeftArrow`
- `upPointingAirplane`
- `upPointingMilitaryAirplane`
- `upPointingSmallAirplane`
- `upRightArrow`
- `upTextButton`
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
- `vsButton`
- `vulcanSalute`
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
- `wavyDash`
- `waxingCrescentMoon`
- `waxingGibbousMoon`
- `wearyCatFace`
- `wearyFace`
- `wedding`
- `whale`
- `wheelchairSymbol`
- `whiteCircle`
- `whiteDownPointingLeftHand`
- `whiteExclamationMark`
- `whiteFlower`
- `whiteHardShellFloppy`
- `whiteHeavyCheckMark`
- `whiteLargeSquare`
- `whiteLatinCross`
- `whiteMediumSmallSquare`
- `whiteMediumSquare`
- `whitePennant`
- `whiteQuestionMark`
- `whiteSmallSquare`
- `whiteSquareButton`
- `whiteTouchTonePhone`
- `windChime`
- `windFace`
- `window`
- `wineGlass`
- `winkingFace`
- `winkingFaceWithTongue`
- `wiredKeyboard`
- `wolf`
- `woman`
- `womanDancing`
- `womansBoot`
- `womansClothes`
- `womansHat`
- `womansSandal`
- `womensRoom`
- `worldMap`
- `worriedFace`
- `wrappedGift`
- `wrench`
- `yellowHeart`
- `yenBanknote`
- `zzz`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AButtonIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AbButtonIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdmissionTicketsIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AerialTramwayIcon size="20" class="nav-icon" /> Settings</a>
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
<AButtonIcon
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
    <AButtonIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AbButtonIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdmissionTicketsIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AButtonIcon size="24" />
   <AbButtonIcon size="24" color="#4a90e2" />
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
   <AButtonIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AButtonIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AButtonIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { aButton } from '@stacksjs/iconify-emojione-v1'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(aButton, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { aButton } from '@stacksjs/iconify-emojione-v1'

// Icons are typed as IconData
const myIcon: IconData = aButton
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Emoji One ([Website](https://github.com/joypixels/emojione-legacy))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/emojione-v1/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/emojione-v1/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
