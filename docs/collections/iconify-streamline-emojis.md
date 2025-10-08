# Streamline Emojis

> Streamline Emojis icons for stx from Iconify

## Overview

This package provides access to 787 icons from the Streamline Emojis collection through the stx iconify integration.

**Collection ID:** `streamline-emojis`
**Total Icons:** 787
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Emoji
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-emojis
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 2Icon, AirplaneIcon, AlienIcon } from '@stacksjs/iconify-streamline-emojis'

// Basic usage
const icon = 2Icon()

// With size
const sizedIcon = 2Icon({ size: 24 })

// With color
const coloredIcon = AirplaneIcon({ color: 'red' })

// With multiple props
const customIcon = AlienIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 2Icon, AirplaneIcon, AlienIcon } from '@stacksjs/iconify-streamline-emojis'

  global.icons = {
    home: 2Icon({ size: 24 }),
    user: AirplaneIcon({ size: 24, color: '#4a90e2' }),
    settings: AlienIcon({ size: 32 })
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
import { 2, airplane, alien } from '@stacksjs/iconify-streamline-emojis'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(2, { size: 24 })
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

```typescript
// Via color property
const redIcon = 2Icon({ color: 'red' })
const blueIcon = 2Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 2Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 2Icon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = 2Icon({ size: 24 })
const icon1em = 2Icon({ size: '1em' })

// Set individual dimensions
const customIcon = 2Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 2Icon({ height: '1em' })
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
const smallIcon = 2Icon({ class: 'icon-small' })
const largeIcon = 2Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **787** icons:

- `2`
- `airplane`
- `alien`
- `amazedFace`
- `ambulance`
- `americanFootball`
- `amusingFace`
- `anchor`
- `anguishedFace`
- `ant`
- `anxiousFace`
- `artistPalette`
- `astonishedFace`
- `astronaut1`
- `astronaut2`
- `australia`
- `automobile`
- `baby1`
- `baby2`
- `baby3`
- `babyAngel1`
- `babyAngel2`
- `babyBottle`
- `babyChick`
- `backhandIndexPointingDown1`
- `backhandIndexPointingDown2`
- `backhandIndexPointingLeft1`
- `backhandIndexPointingLeft2`
- `backhandIndexPointingRight1`
- `backhandIndexPointingRight2`
- `backhandIndexPointingUp1`
- `backhandIndexPointingUp2`
- `balloon`
- `ballotBoxWithCheck`
- `barChart`
- `barberPole`
- `baseball`
- `basketball`
- `bathtub`
- `battery`
- `beamingFaceWithSmilingEyes`
- `bearFace`
- `beatingHeart`
- `beerMug`
- `bell`
- `bellWithSlash`
- `bicycle`
- `bikini`
- `bird1`
- `bird2`
- `birthdayCake1`
- `birthdayCake2`
- `birthdayCake3`
- `blossom`
- `blowfish`
- `boar1`
- `boar2`
- `bomb`
- `bottleWithPoppingCork`
- `bouquet`
- `bowling`
- `boy1`
- `boy2`
- `boy3`
- `brazil`
- `bread`
- `brideWithVeil1`
- `brideWithVeil2`
- `briefcase`
- `brokenHeart`
- `bug`
- `bulletTrain`
- `bus`
- `bustInSilhouette`
- `bustsInSilhouette`
- `cactus1`
- `cactus2`
- `calendar`
- `camel`
- `canada`
- `candy`
- `carouselHorse`
- `castle`
- `cat`
- `catFace`
- `catFaceWithTearsOfJoy`
- `catFaceWithWrySmile`
- `champagneGlass1`
- `champagneGlass2`
- `cherries`
- `chestnut`
- `chicken`
- `childrenCrossing`
- `china`
- `chipmunk`
- `christmasTree`
- `cigarette`
- `circusTent`
- `clapperBoard`
- `clappingHands1`
- `clappingHands2`
- `clinkingBeerMugs`
- `clinkingGlasses1`
- `clinkingGlasses2`
- `clinkingGlasses3`
- `clinkingGlasses4`
- `clinkingGlasses5`
- `clipboard`
- `closedUmbrella`
- `cloud1`
- `cloud2`
- `cloudWithRain1`
- `cloudWithRain2`
- `clownFace`
- `clubSuit`
- `cocktailGlass`
- `collision`
- `computerDisk`
- `confettiBall`
- `confoundedFace`
- `confusedFace`
- `construction`
- `constructionWorker`
- `cookedRice`
- `cookie`
- `cooking`
- `coupleWithHeartManMan1`
- `coupleWithHeartManMan2`
- `coupleWithHeartWomanMan1`
- `coupleWithHeartWomanMan2`
- `coupleWithHeartWomanWoman1`
- `coupleWithHeartWomanWoman2`
- `cow`
- `cowFace`
- `cowboyHatFace`
- `crazyFace`
- `creditCard`
- `crescentMoon`
- `crocodile`
- `crossMark`
- `crossedFingers1`
- `crossedFingers2`
- `crossedFlags`
- `crown`
- `cryingCatFace`
- `cryingFace`
- `crystalBall1`
- `crystalBall2`
- `custard`
- `dashingAway`
- `deliveryTruck`
- `detective1`
- `detective2`
- `determinedFace`
- `diamondSuit`
- `directHit`
- `disappointedFace`
- `dizzy`
- `dizzyFace`
- `dog`
- `dogFace`
- `dollarBanknote`
- `dolphin`
- `door`
- `doubleExclamationMark`
- `doughnut1`
- `doughnut2`
- `downcastFaceWithSweat`
- `dress`
- `droolingFace1`
- `droolingFace2`
- `droplet`
- `eMail1`
- `eMail2`
- `ear`
- `egypt`
- `electricPlug`
- `elephant`
- `ewe1`
- `ewe2`
- `exclamationMark`
- `explodingHead`
- `expressionlessFace`
- `eye`
- `eyes`
- `faceBlowingAKiss`
- `faceSavoringFood`
- `faceScreamingInFear`
- `faceVomiting`
- `faceWithHeadBandage`
- `faceWithMedicalMask`
- `faceWithMonocle`
- `faceWithRaisedEyebrow`
- `faceWithRollingEyes`
- `faceWithSteamFromNose`
- `faceWithSymbolsOnMouth`
- `faceWithTearsOfJoy`
- `faceWithThermometer`
- `faceWithTongue`
- `faceWithoutMouth`
- `factory`
- `fallenLeaf`
- `familyManBoy1`
- `familyManBoy2`
- `familyManBoyBoy1`
- `familyManBoyBoy2`
- `familyManGirl1`
- `familyManGirl2`
- `familyManGirlBoy1`
- `familyManGirlBoy2`
- `familyManGirlGirl1`
- `familyManGirlGirl2`
- `familyManManBoy1`
- `familyManManBoy2`
- `familyManManBoyBoy1`
- `familyManManBoyBoy2`
- `familyManManGirl1`
- `familyManManGirl2`
- `familyManManGirlBoy1`
- `familyManManGirlBoy2`
- `familyManManGirlGirl1`
- `familyManManGirlGirl2`
- `familyManWomanBoy1`
- `familyManWomanBoy2`
- `familyManWomanBoyBoy1`
- `familyManWomanBoyBoy2`
- `familyManWomanGirl1`
- `familyManWomanGirl2`
- `familyManWomanGirlBoy1`
- `familyManWomanGirlBoy2`
- `familyManWomanGirlGirl1`
- `familyManWomanGirlGirl2`
- `familyWomanBoy1`
- `familyWomanBoy2`
- `familyWomanBoyBoy1`
- `familyWomanBoyBoy2`
- `familyWomanGirl1`
- `familyWomanGirl2`
- `familyWomanGirlBoy1`
- `familyWomanGirlBoy2`
- `familyWomanGirlGirl1`
- `familyWomanGirlGirl2`
- `familyWomanWomanBoy1`
- `familyWomanWomanBoy2`
- `familyWomanWomanBoyBoy1`
- `familyWomanWomanBoyBoy2`
- `familyWomanWomanGirl1`
- `familyWomanWomanGirl2`
- `familyWomanWomanGirlBoy1`
- `familyWomanWomanGirlBoy2`
- `familyWomanWomanGirlGirl1`
- `familyWomanWomanGirlGirl2`
- `faxMachine`
- `fearfulFace`
- `ferrisWheel`
- `fileFolder`
- `fire`
- `fireEngine`
- `firstQuarterMoon`
- `firstQuarterMoonFace`
- `fishingPole`
- `flagInHole`
- `flashlight`
- `flexedBiceps1`
- `flexedBiceps2`
- `floppyDisk`
- `flushedFace`
- `foldedHands1`
- `foldedHands2`
- `fountain`
- `fountainPen`
- `fourLeafClover`
- `foxFace1`
- `foxFace2`
- `france`
- `frenchFries`
- `friedShrimp`
- `frogFace`
- `frowningFace`
- `fuelPump`
- `fullMoon`
- `fullMoonFace`
- `gameDice`
- `germany`
- `gesturingOk1`
- `ghost`
- `girl1`
- `girl2`
- `girl3`
- `glasses1`
- `glasses2`
- `globeShowingAmericas`
- `globeShowingEuropeAfrica`
- `goat`
- `graduationCap`
- `grapes`
- `greece`
- `greenBook`
- `grimacingFace`
- `grinningCatFace`
- `grinningCatFaceWithSmilingEyes`
- `grinningFace`
- `grinningFaceWithSmilingEyes`
- `grinningFaceWithSweat`
- `grinningSquintingFace`
- `growingHeart`
- `guard1`
- `guard2`
- `guitar`
- `hamburger1`
- `hamburger2`
- `hamburger3`
- `hamsterFace`
- `handWithFingersSplayed1`
- `handWithFingersSplayed2`
- `handbag`
- `hatchingChick1`
- `headphone`
- `hearNoEvilMonkey`
- `heartSuit`
- `heartWithArrow`
- `heartWithRibbon`
- `helicopter`
- `herb`
- `hibiscus`
- `highHeeledShoe`
- `highVoltage`
- `honeyPot`
- `honeybee`
- `horse`
- `horseFace`
- `hospital`
- `hotBeverage1`
- `hotBeverage2`
- `hourglassDone`
- `hourglassNotDone1`
- `hourglassNotDone2`
- `houseWithGarden`
- `hushedFace1`
- `hushedFace2`
- `indexPointingUp1`
- `indexPointingUp2`
- `india`
- `iran`
- `iraq`
- `italy`
- `jackOLantern`
- `japan`
- `japaneseSymbolForBeginner`
- `jeans`
- `joker`
- `kimono`
- `kissManMan1`
- `kissManMan2`
- `kissWomanMan1`
- `kissWomanMan2`
- `kissWomanWoman1`
- `kissWomanWoman2`
- `kissingCatFace`
- `kissingFace`
- `kissingFaceWithClosedEyes`
- `kissingFaceWithSmilingEyes`
- `koala`
- `ladyBeetle`
- `leafFlutteringInWind`
- `lemon`
- `lionFace`
- `lipstick`
- `lockedWithKey`
- `locomotive`
- `loudlyCryingFace`
- `loveHotel`
- `lyingFace`
- `magnifyingGlassTiltedLeft`
- `malaysia`
- `man1`
- `man2`
- `manAndWomanHoldingHands1`
- `manAndWomanHoldingHands2`
- `manArtist1`
- `manArtist2`
- `manAstronaut1`
- `manAstronaut2`
- `manBowing1`
- `manBowing2`
- `manCook1`
- `manCook2`
- `manDancing1`
- `manDancing2`
- `manFacepalming1`
- `manFacepalming2`
- `manFactoryWorker1`
- `manFactoryWorker2`
- `manFarmer1`
- `manFarmer2`
- `manFirefighter1`
- `manFirefighter2`
- `manFrowning1`
- `manFrowning2`
- `manGesturingNo1`
- `manGesturingNo2`
- `manGesturingOk1`
- `manGesturingOk2`
- `manGettingHaircut1`
- `manGettingHaircut2`
- `manGettingMassage1`
- `manGettingMassage2`
- `manHealthWorker1`
- `manHealthWorker2`
- `manInSuitLevitating1`
- `manInSuitLevitating2`
- `manInTuxedo1`
- `manInTuxedo2`
- `manJudge1`
- `manJudge2`
- `manMechanic1`
- `manMechanic2`
- `manOfficeWorker1`
- `manOfficeWorker2`
- `manPilot1`
- `manPilot2`
- `manPoliceOfficer1`
- `manPoliceOfficer2`
- `manPouting1`
- `manPouting2`
- `manRaisingHand1`
- `manRaisingHand2`
- `manRunning1`
- `manRunning2`
- `manScientist1`
- `manScientist2`
- `manShrugging1`
- `manShrugging2`
- `manSinger1`
- `manSinger2`
- `manStudent1`
- `manStudent2`
- `manTechnologist1`
- `manTechnologist2`
- `manTippingHand1`
- `manTippingHand2`
- `manWalking1`
- `manWalking2`
- `manWithChineseCap1`
- `manWithChineseCap2`
- `mansShoe`
- `mapleLeaf`
- `meatOnBone`
- `melon1`
- `melon2`
- `menWithBunnyEars1`
- `menWithBunnyEars2`
- `mexico`
- `microphone`
- `microscope`
- `minibus`
- `moai`
- `moneyBag`
- `moneyMouthFace1`
- `moneyMouthFace2`
- `moneyWithWings`
- `monkey`
- `monkeyFace`
- `mouse`
- `mouseFace`
- `mouth`
- `mushroom`
- `musicalKeyboard`
- `musicalNote`
- `musicalNotes`
- `musicalScore`
- `mutedSpeaker`
- `nailPolish1`
- `nailPolish2`
- `nauseatedFace1`
- `nauseatedFace2`
- `necktie`
- `nepal`
- `nerdFace`
- `neutralFace`
- `newMoon`
- `newspaper`
- `noBicycles`
- `noMobilePhones`
- `noOneUnderEighteen`
- `noSmoking`
- `northKorea`
- `nutAndBolt`
- `octopus`
- `officeBuilding`
- `okHand1`
- `okHand2`
- `oldMan1`
- `oldMan2`
- `oldWoman1`
- `oldWoman2`
- `oncomingFist1`
- `oncomingFist2`
- `oncomingPoliceCar`
- `oncomingTaxi`
- `openBook`
- `openFileFolder`
- `openMailboxWithRaisedFlag`
- `ox`
- `package`
- `pakistan`
- `palmTree`
- `pandaFace`
- `paperclip`
- `pawPrints`
- `peach`
- `pear`
- `penguin1`
- `penguin2`
- `pensiveFace`
- `perseveringFace`
- `personWearingTurban1`
- `personWearingTurban2`
- `pig`
- `pigFace`
- `pigNose`
- `pileOfPoo`
- `pill`
- `pistol`
- `pizza1`
- `pizza2`
- `policeCarLight`
- `poodle`
- `pool8Ball`
- `portugal`
- `postbox`
- `poultryLeg`
- `poundBanknote`
- `poutingCatFace`
- `poutingFace`
- `pregnantWoman1`
- `pregnantWoman2`
- `prince1`
- `prince2`
- `princess1`
- `princess2`
- `purse`
- `rabbit`
- `rabbitFace`
- `radio`
- `railwayCar`
- `rainbow`
- `raisedFist1`
- `raisedFist2`
- `raisedHand1`
- `raisedHand2`
- `raisingHands1`
- `raisingHands2`
- `ram`
- `recyclingSymbol`
- `redApple`
- `redPaperLantern`
- `redWineGlass`
- `relievedFace1`
- `relievedFace2`
- `restroom`
- `revolvingHearts`
- `ribbon`
- `riceBall`
- `rightAngerBubble`
- `ring1`
- `ring2`
- `robotFace1`
- `robotFace2`
- `robotFace3`
- `rocket`
- `rollerCoaster`
- `rollingOnTheFloorLaughing1`
- `rollingOnTheFloorLaughing2`
- `rooster`
- `rose`
- `runningShoe`
- `russia`
- `sadButRelievedFace`
- `sailboat`
- `santaClaus1`
- `santaClaus2`
- `satelliteAntenna`
- `saxophone`
- `schoolBackpack`
- `scroll`
- `seeNoEvilMonkey`
- `seedling`
- `selfie1`
- `selfie2`
- `shavedIce`
- `ship`
- `shortcake1`
- `shortcake2`
- `shower`
- `shushingFace`
- `signOfTheHorns1`
- `signOfTheHorns2`
- `singapore`
- `skis`
- `skull`
- `sleepingFace`
- `sleepyFace`
- `slightlySmilingFace`
- `slotMachine`
- `smilingCatFaceWithHeartEyes`
- `smilingFaceWithHalo`
- `smilingFaceWithHeartEyes`
- `smilingFaceWithHorns`
- `smilingFaceWithSmilingEyes`
- `smilingFaceWithSunglasses`
- `smirkingFace`
- `snail`
- `snake`
- `sneezingFace`
- `snowflake`
- `snowman`
- `softIceCream1`
- `softIceCream2`
- `southAfrica`
- `southKorea`
- `spadeSuit`
- `spaghetti`
- `spain`
- `sparkles`
- `sparklingHeart`
- `speakNoEvilMonkey`
- `speakingHead`
- `speedboat`
- `spiralShell`
- `spoutingWhale`
- `squintingFaceWithTongue`
- `starStruck1`
- `starStruck2`
- `strawberry1`
- `strawberry2`
- `sunBehindCloud`
- `sunWithFace`
- `sunflower1`
- `sunflower2`
- `sunglasses`
- `sushi`
- `sweatDroplets`
- `switzerland`
- `syria`
- `syringe`
- `tShirt`
- `tangerine`
- `taxi`
- `teacupWithoutHandle`
- `telephone`
- `telescope`
- `television`
- `tennis1`
- `tennis2`
- `tent`
- `thailand`
- `thinkingFace`
- `thoughtBalloon`
- `thumbsDown1`
- `thumbsDown2`
- `thumbsUp1`
- `thumbsUp2`
- `tiger`
- `tigerFace`
- `tiredFace`
- `toilet`
- `tomato`
- `tongue`
- `tractor`
- `tropicalDrink`
- `tropicalFish`
- `trumpet`
- `tulip`
- `turkey`
- `turtle`
- `twoMenHoldingHands1`
- `twoMenHoldingHands2`
- `twoWomenHoldingHands1`
- `twoWomenHoldingHands2`
- `umbrella`
- `umbrellaWithRainDrops`
- `unamusedFace`
- `unicornFace`
- `unitedArabEmirates`
- `unitedKingdom`
- `unitedStates`
- `upsideDownFace`
- `verticalTrafficLight`
- `victoryHand1`
- `victoryHand2`
- `videocassette`
- `violin`
- `vulcanSalute1`
- `vulcanSalute2`
- `waningGibbousMoon`
- `watch`
- `waterBuffalo`
- `waterWave`
- `watermelon1`
- `watermelon2`
- `wavingHand1`
- `wavingHand2`
- `waxingCrescentMoon`
- `wearyCatFace`
- `wearyFace1`
- `wearyFace2`
- `wedding`
- `whiteWineGlass`
- `wineGlass`
- `winkingFace`
- `winkingFaceWithTongue`
- `wolfFace`
- `woman1`
- `woman2`
- `womanArtist1`
- `womanArtist2`
- `womanAstronaut1`
- `womanAstronaut2`
- `womanBowing1`
- `womanBowing2`
- `womanCook1`
- `womanCook2`
- `womanDancing1`
- `womanDancing2`
- `womanFacepalming1`
- `womanFacepalming2`
- `womanFactoryWorker1`
- `womanFactoryWorker2`
- `womanFarmer1`
- `womanFarmer2`
- `womanFirefighter1`
- `womanFirefighter2`
- `womanFrowning1`
- `womanFrowning2`
- `womanGesturingNo1`
- `womanGesturingNo2`
- `womanGesturingOk2`
- `womanGettingHaircut1`
- `womanGettingHaircut2`
- `womanGettingMassage1`
- `womanGettingMassage2`
- `womanHealthWorker1`
- `womanHealthWorker2`
- `womanJudge1`
- `womanJudge2`
- `womanMechanic1`
- `womanMechanic2`
- `womanOfficeWorker1`
- `womanOfficeWorker2`
- `womanPilot1`
- `womanPilot2`
- `womanPoliceOfficer1`
- `womanPoliceOfficer2`
- `womanPouting1`
- `womanPouting2`
- `womanRaisingHand1`
- `womanRaisingHand2`
- `womanRunning1`
- `womanRunning2`
- `womanScientist1`
- `womanScientist2`
- `womanShrugging1`
- `womanShrugging2`
- `womanSinger1`
- `womanSinger2`
- `womanStudent1`
- `womanStudent2`
- `womanTechnologist1`
- `womanTechnologist2`
- `womanTippingHand1`
- `womanTippingHand2`
- `womanWalking1`
- `womanWalking2`
- `womansBoot`
- `womansHat`
- `womansSandal`
- `womenWithBunnyEars1`
- `womenWithBunnyEars2`
- `worriedFace`
- `wrappedGift1`
- `wrappedGift2`
- `wrench`
- `writingHand1`
- `writingHand2`
- `zipperMouthFace`
- `zzz`

## Usage Examples

### Navigation Menu

```html
@js
  import { 2Icon, AirplaneIcon, AlienIcon, AmazedFaceIcon } from '@stacksjs/iconify-streamline-emojis'

  global.navIcons = {
    home: 2Icon({ size: 20, class: 'nav-icon' }),
    about: AirplaneIcon({ size: 20, class: 'nav-icon' }),
    contact: AlienIcon({ size: 20, class: 'nav-icon' }),
    settings: AmazedFaceIcon({ size: 20, class: 'nav-icon' })
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
import { 2Icon } from '@stacksjs/iconify-streamline-emojis'

const icon = 2Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 2Icon, AirplaneIcon, AlienIcon } from '@stacksjs/iconify-streamline-emojis'

const successIcon = 2Icon({ size: 16, color: '#22c55e' })
const warningIcon = AirplaneIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlienIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 2Icon, AirplaneIcon } from '@stacksjs/iconify-streamline-emojis'
   const icon = 2Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { 2, airplane } from '@stacksjs/iconify-streamline-emojis'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(2, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 2Icon, AirplaneIcon } from '@stacksjs/iconify-streamline-emojis'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-streamline-emojis'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 2Icon } from '@stacksjs/iconify-streamline-emojis'
     global.icon = 2Icon({ size: 24 })
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
   const icon = 2Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 2 } from '@stacksjs/iconify-streamline-emojis'

// Icons are typed as IconData
const myIcon: IconData = 2
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-emojis/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-emojis/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
