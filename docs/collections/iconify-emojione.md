# Emoji One (Colored)

> Emoji One (Colored) icons for stx from Iconify

## Overview

This package provides access to 1834 icons from the Emoji One (Colored) collection through the stx iconify integration.

**Collection ID:** `emojione`
**Total Icons:** 1834
**Author:** Emoji One ([Website](https://github.com/EmojiTwo/emojitwo))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Emoji
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-emojione
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
import { 1stPlaceMedal, 2ndPlaceMedal, 3rdPlaceMedal } from '@stacksjs/iconify-emojione'
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
.emojione-icon {
  width: 1em;
  height: 1em;
}
```

```html
<1stPlaceMedalIcon class="emojione-icon" />
```

## Available Icons

This package contains **1834** icons:

- `1stPlaceMedal`
- `2ndPlaceMedal`
- `3rdPlaceMedal`
- `aButton`
- `abButton`
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
- `bButton`
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
- `ballotBoxWithCheck`
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
- `biohazard`
- `bird`
- `birthdayCake`
- `blackCircle`
- `blackHeart`
- `blackLargeSquare`
- `blackMediumSmallSquare`
- `blackMediumSquare`
- `blackNib`
- `blackSmallSquare`
- `blackSquareButton`
- `blondHairedPerson`
- `blondHairedPersonDarkSkinTone`
- `blondHairedPersonLightSkinTone`
- `blondHairedPersonMediumDarkSkinTone`
- `blondHairedPersonMediumLightSkinTone`
- `blondHairedPersonMediumSkinTone`
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
- `brideWithVeil`
- `brideWithVeilDarkSkinTone`
- `brideWithVeilLightSkinTone`
- `brideWithVeilMediumDarkSkinTone`
- `brideWithVeilMediumLightSkinTone`
- `brideWithVeilMediumSkinTone`
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
- `catFaceWithTearsOfJoy`
- `catFaceWithWrySmile`
- `chains`
- `chartDecreasing`
- `chartIncreasing`
- `chartIncreasingWithYen`
- `cheeseWedge`
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
- `coupleWithHeart`
- `coupleWithHeartManMan`
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
- `crossedSwords`
- `crown`
- `cryingCatFace`
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
- `flagEngland`
- `flagForAfghanistan`
- `flagForAlandIslands`
- `flagForAlbania`
- `flagForAlgeria`
- `flagForAmericanSamoa`
- `flagForAndorra`
- `flagForAngola`
- `flagForAnguilla`
- `flagForAntarctica`
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
- `flagForBouvetIsland`
- `flagForBrazil`
- `flagForBritishIndianOceanTerritory`
- `flagForBritishVirginIslands`
- `flagForBrunei`
- `flagForBulgaria`
- `flagForBurkinaFaso`
- `flagForBurundi`
- `flagForCambodia`
- `flagForCameroon`
- `flagForCanada`
- `flagForCanaryIslands`
- `flagForCapeVerde`
- `flagForCaribbeanNetherlands`
- `flagForCaymanIslands`
- `flagForCentralAfricanRepublic`
- `flagForCeutaAndMelilla`
- `flagForChad`
- `flagForChequeredFlag`
- `flagForChile`
- `flagForChina`
- `flagForChristmasIsland`
- `flagForClippertonIsland`
- `flagForCocosIslands`
- `flagForColombia`
- `flagForComoros`
- `flagForCongoBrazzaville`
- `flagForCongoKinshasa`
- `flagForCookIslands`
- `flagForCostaRica`
- `flagForCoteDivoire`
- `flagForCroatia`
- `flagForCrossedFlags`
- `flagForCuba`
- `flagForCuracao`
- `flagForCyprus`
- `flagForCzechia`
- `flagForDenmark`
- `flagForDiegoGarcia`
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
- `flagForEuropeanUnion`
- `flagForFalklandIslands`
- `flagForFaroeIslands`
- `flagForFiji`
- `flagForFinland`
- `flagForFrance`
- `flagForFrenchGuiana`
- `flagForFrenchPolynesia`
- `flagForFrenchSouthernTerritories`
- `flagForGabon`
- `flagForGambia`
- `flagForGeorgia`
- `flagForGermany`
- `flagForGhana`
- `flagForGibraltar`
- `flagForGreece`
- `flagForGreenland`
- `flagForGrenada`
- `flagForGuadeloupe`
- `flagForGuam`
- `flagForGuatemala`
- `flagForGuernsey`
- `flagForGuinea`
- `flagForGuineaBissau`
- `flagForGuyana`
- `flagForHaiti`
- `flagForHeardAndMcdonaldIslands`
- `flagForHonduras`
- `flagForHongKongSarChina`
- `flagForHungary`
- `flagForIceland`
- `flagForIndia`
- `flagForIndonesia`
- `flagForIran`
- `flagForIraq`
- `flagForIreland`
- `flagForIsleOfMan`
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
- `flagForMartinique`
- `flagForMauritania`
- `flagForMauritius`
- `flagForMayotte`
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
- `flagForNorfolkIsland`
- `flagForNorthKorea`
- `flagForNorthernMarianaIslands`
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
- `flagForPitcairnIslands`
- `flagForPoland`
- `flagForPortugal`
- `flagForPuertoRico`
- `flagForQatar`
- `flagForRainbowFlag`
- `flagForReunion`
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
- `flagForSintMaarten`
- `flagForSlovakia`
- `flagForSlovenia`
- `flagForSolomonIslands`
- `flagForSomalia`
- `flagForSouthAfrica`
- `flagForSouthGeorgiaAndSouthSandwichIslands`
- `flagForSouthKorea`
- `flagForSouthSudan`
- `flagForSpain`
- `flagForSriLanka`
- `flagForStBarthelemy`
- `flagForStHelena`
- `flagForStKittsAndNevis`
- `flagForStLucia`
- `flagForStMartin`
- `flagForStPierreAndMiquelon`
- `flagForStVincentAndGrenadines`
- `flagForSudan`
- `flagForSuriname`
- `flagForSvalbardAndJanMayen`
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
- `flagForTokelau`
- `flagForTonga`
- `flagForTriangularFlag`
- `flagForTrinidadAndTobago`
- `flagForTristanDaCunha`
- `flagForTunisia`
- `flagForTurkey`
- `flagForTurkmenistan`
- `flagForTurksAndCaicosIslands`
- `flagForTuvalu`
- `flagForUganda`
- `flagForUkraine`
- `flagForUnitedArabEmirates`
- `flagForUnitedKingdom`
- `flagForUnitedStates`
- `flagForUruguay`
- `flagForUsOutlyingIslands`
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
- `flagScotland`
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
- `frogFace`
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
- `grinningCatFace`
- `grinningCatFaceWithSmilingEyes`
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
- `hamsterFace`
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
- `heartSuit`
- `heartWithArrow`
- `heartWithRibbon`
- `heavyCheckMark`
- `heavyDivisionSign`
- `heavyDollarSign`
- `heavyHeartExclamation`
- `heavyLargeCircle`
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
- `horseRacingDarkSkinTone`
- `horseRacingLightSkinTone`
- `horseRacingMediumDarkSkinTone`
- `horseRacingMediumLightSkinTone`
- `horseRacingMediumSkinTone`
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
- `kiss`
- `kissManMan`
- `kissMark`
- `kissWomanWoman`
- `kissingCatFace`
- `kissingFace`
- `kissingFaceWithClosedEyes`
- `kissingFaceWithSmilingEyes`
- `kitchenKnife`
- `kiwiFruit`
- `koala`
- `label`
- `ladyBeetle`
- `laptopComputer`
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
- `lionFace`
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
- `man`
- `manAndWomanHoldingHands`
- `manDancing`
- `manDancingDarkSkinTone`
- `manDancingLightSkinTone`
- `manDancingMediumDarkSkinTone`
- `manDancingMediumLightSkinTone`
- `manDancingMediumSkinTone`
- `manDarkSkinTone`
- `manInSuitLevitating`
- `manInTuxedo`
- `manInTuxedoDarkSkinTone`
- `manInTuxedoLightSkinTone`
- `manInTuxedoMediumDarkSkinTone`
- `manInTuxedoMediumLightSkinTone`
- `manInTuxedoMediumSkinTone`
- `manLightSkinTone`
- `manMediumDarkSkinTone`
- `manMediumLightSkinTone`
- `manMediumSkinTone`
- `manWithChineseCap`
- `manWithChineseCapDarkSkinTone`
- `manWithChineseCapLightSkinTone`
- `manWithChineseCapMediumDarkSkinTone`
- `manWithChineseCapMediumLightSkinTone`
- `manWithChineseCapMediumSkinTone`
- `mansShoe`
- `mantelpieceClock`
- `mapOfJapan`
- `mapleLeaf`
- `martialArtsUniform`
- `meatOnBone`
- `mediumDarkSkinTone`
- `mediumLightSkinTone`
- `mediumSkinTone`
- `megaphone`
- `melon`
- `memo`
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
- `oButton`
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
- `onArrow`
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
- `pandaFace`
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
- `poutingCatFace`
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
- `robotFace`
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
- `twoMenHoldingHands`
- `twoOclock`
- `twoThirty`
- `twoWomenHoldingHands`
- `umbrella`
- `umbrellaOnGround`
- `umbrellaWithRainDrops`
- `unamusedFace`
- `unicornFace`
- `unlocked`
- `upArrow`
- `upDownArrow`
- `upLeftArrow`
- `upRightArrow`
- `upTextButton`
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
- `wearyCatFace`
- `wearyFace`
- `wedding`
- `whale`
- `wheelOfDharma`
- `wheelchairSymbol`
- `whiteCircle`
- `whiteExclamationMark`
- `whiteFlower`
- `whiteHeavyCheckMark`
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
- `womanDancing`
- `womanDancingDarkSkinTone`
- `womanDancingLightSkinTone`
- `womanDancingMediumDarkSkinTone`
- `womanDancingMediumLightSkinTone`
- `womanDancingMediumSkinTone`
- `womanDarkSkinTone`
- `womanLightSkinTone`
- `womanMediumDarkSkinTone`
- `womanMediumLightSkinTone`
- `womanMediumSkinTone`
- `womansBoot`
- `womansClothes`
- `womansHat`
- `womansSandal`
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
  <a href="/settings"><AButtonIcon size="20" class="nav-icon" /> Settings</a>
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
     import { 1stPlaceMedal } from '@stacksjs/iconify-emojione'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(1stPlaceMedal, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 1stPlaceMedal } from '@stacksjs/iconify-emojione'

// Icons are typed as IconData
const myIcon: IconData = 1stPlaceMedal
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Emoji One ([Website](https://github.com/EmojiTwo/emojitwo))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/emojione/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/emojione/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
