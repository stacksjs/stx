# Firefox OS Emoji

> Firefox OS Emoji icons for stx from Iconify

## Overview

This package provides access to 1034 icons from the Firefox OS Emoji collection through the stx iconify integration.

**Collection ID:** `fxemoji`
**Total Icons:** 1034
**Author:** Mozilla ([Website](https://github.com/mozilla/fxemoji))
**License:** Apache 2.0 ([Details](https://mozilla.github.io/fxemoji/LICENSE.md))
**Category:** Emoji
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-fxemoji
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<2heartsIcon height="1em" />
<2heartsIcon width="1em" height="1em" />
<2heartsIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<2heartsIcon size="24" />
<2heartsIcon size="1em" />

<!-- Using width and height -->
<2heartsIcon width="24" height="32" />

<!-- With color -->
<2heartsIcon size="24" color="red" />
<2heartsIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<2heartsIcon size="24" class="icon-primary" />

<!-- With all properties -->
<2heartsIcon
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
    <2heartsIcon size="24" />
    <AcornIcon size="24" color="#4a90e2" />
    <AdmissionticketsIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 2hearts, acorn, admissiontickets } from '@stacksjs/iconify-fxemoji'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(2hearts, { size: 24 })
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
<2heartsIcon size="24" color="red" />
<2heartsIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<2heartsIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<2heartsIcon size="24" class="text-primary" />
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
<2heartsIcon height="1em" />
<2heartsIcon width="1em" height="1em" />
<2heartsIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<2heartsIcon size="24" />
<2heartsIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fxemoji-icon {
  width: 1em;
  height: 1em;
}
```

```html
<2heartsIcon class="fxemoji-icon" />
```

## Available Icons

This package contains **1034** icons:

- `2hearts`
- `acorn`
- `admissiontickets`
- `aerialtramway`
- `airplane`
- `alarmclock`
- `alien`
- `alienmonster`
- `ambulance`
- `americanfootball`
- `americasglobe`
- `anchor`
- `anger`
- `angry`
- `anguish`
- `ant`
- `antennawithbars`
- `anticlockwiseupwardsanddownwardsarrows`
- `aok`
- `aquarius`
- `aries`
- `arrowrightwardsdownwards`
- `arrowrightwardsupwards`
- `articulatedlorry`
- `artistpalette`
- `asiaaustraliaglobe`
- `astonished`
- `aubergine`
- `automatedtellermachine`
- `automobile`
- `baby`
- `babyangel`
- `babybottle`
- `babychick`
- `babysymbol`
- `backofenvelope`
- `backwithleftwardsarrow`
- `bactriancamel`
- `baggageclaim`
- `balloon`
- `ballotboldscriptx`
- `ballotboxboldcheck`
- `ballotboxwithboldscriptx`
- `ballotboxwithcheck`
- `ballottboxwithballott`
- `ballottboxwithscriptx`
- `ballottscriptx`
- `banana`
- `bank`
- `banknotedollar`
- `banknoteeuro`
- `banknotepound`
- `banknoteyen`
- `barberpole`
- `barchart`
- `baseball`
- `basketballandhoop`
- `bath`
- `bathtub`
- `battery`
- `beachumbrella`
- `bear`
- `beatingHeart`
- `beermug`
- `bell`
- `bellcancellation`
- `bentobox`
- `bicycle`
- `bicyclist`
- `bikini`
- `billiards`
- `bird`
- `birthdaycake`
- `blackclubsuit`
- `blackdiamondsuit`
- `blackdownpointingbackhand`
- `blackdownpointingdoublearrow`
- `blackdroplet`
- `blackfolder`
- `blackhardshellfloppy`
- `blackheartsuit`
- `blacklargesquare`
- `blackleftpointingarrow`
- `blackleftpointingbackhand`
- `blackleftpointingdoublearrow`
- `blackmediumsmallsquare`
- `blackmediumsquare`
- `blackmissingsmiley`
- `blacknib`
- `blackpennant`
- `blackpushpin`
- `blackquestionmark`
- `blackrightpointingarrow`
- `blackrightpointingbackhand`
- `blackrightpointingdoublearrow`
- `blackrightwardsarrow`
- `blackrosette`
- `blackscissors`
- `blackskullcrossbones`
- `blacksmallsquare`
- `blackspadesuit`
- `blacksquarebutton`
- `blacktelephone`
- `blacktouchtonetelephone`
- `blackuniversalrecyclingsymbol`
- `blackuppointingbackhand`
- `blackuppointingdoublearrow`
- `blackwaving`
- `blonde`
- `blossom`
- `blowfish`
- `bluebook`
- `boar`
- `bolt`
- `bomb`
- `bookmark`
- `bookmarktab`
- `books`
- `boot`
- `bouquet`
- `bouquetofflowers`
- `bow`
- `bowing`
- `bowling`
- `boy`
- `bread`
- `bride`
- `bridgeatnight`
- `briefcase`
- `brokenheart`
- `bug`
- `bullhorn`
- `bullhornwithsoundwaves`
- `bunny`
- `bunnyEars`
- `bunnyside`
- `bus`
- `busstop`
- `cactus`
- `calendar`
- `camera`
- `camerawithflash`
- `camping`
- `cancellationx`
- `cancer`
- `candle`
- `candy`
- `capricorn`
- `cardfilebox`
- `cardindex`
- `cardindexdividers`
- `carouselhorse`
- `carpstreamer`
- `cat`
- `catside`
- `cellphone`
- `celticcross`
- `chartdownwardstrend`
- `chartupwardstrend`
- `chartupwardstrendyen`
- `cherries`
- `cherryblossom`
- `chicken`
- `childrencrossing`
- `chilipepper`
- `chineseflag`
- `chipmunk`
- `chocolatebar`
- `christmastree`
- `church`
- `cinema`
- `circledideographaccept`
- `circledideographadvantage`
- `circledideographcongratulation`
- `circledideographsecret`
- `circledlatincapitalletterm`
- `circustent`
- `cityscape`
- `cityscapeatdusk`
- `cjkunifiedideographA`
- `cjkunifiedideographB`
- `cjkunifiedideographC`
- `cjkunifiedideographD`
- `cjkunifiedideographE`
- `cjkunifiedideographF`
- `cjkunifiedideographG`
- `cjkunifiedideographH`
- `cjkunifiedideographI`
- `cjkunifiedideographJ`
- `cjkunifiedideographK`
- `clamshellmobile`
- `clap`
- `clapperboard`
- `classicalbuilding`
- `clinkingbeermugs`
- `clipboard`
- `clock12oclock`
- `clock12thirty`
- `clock1oclock`
- `clock1thirty`
- `clock2oclock`
- `clock2thirty`
- `clock3oclock`
- `clock3thirty`
- `clock4oclock`
- `clock4thirty`
- `clock5thirty`
- `clock6oclock`
- `clock6thirty`
- `clock7oclock`
- `clockwisedownupcircledarrows`
- `clockwiseleftrightarrows`
- `clockwiserightwardsleftwardscirclearrows`
- `clockwiserightwardsleftwardscirclearrowsone`
- `closedbook`
- `closedmailboxlowered`
- `closedmailboxraised`
- `cloud`
- `cocktailglass`
- `coldsweat`
- `collision`
- `compression`
- `confetti`
- `confounded`
- `confused`
- `construct`
- `construction`
- `constructionsign`
- `contact`
- `contact2`
- `controlknob`
- `conveniencestore`
- `cookedrice`
- `cookie`
- `cooking`
- `cop`
- `couple`
- `couplekiss`
- `cow`
- `cowface`
- `creditcard`
- `crescentmoon`
- `crocodile`
- `crossedflags`
- `crossmark`
- `crown`
- `crying`
- `crystalball`
- `curlyloop`
- `currencyexchange`
- `curryandrice`
- `custard`
- `customs`
- `cyclone`
- `daggerknife`
- `dancer`
- `dango`
- `darksunglasses`
- `dash`
- `deciduoustree`
- `decreasefontsize`
- `deliverytruck`
- `departmentstore`
- `desert`
- `desertisland`
- `desktopcomputer`
- `devilhorns`
- `diamondshapewithdotinside`
- `directhit`
- `disappointed`
- `dissapointedrelief`
- `dizzy`
- `dizzyface`
- `document`
- `documenttextpicture`
- `documentwithpicture`
- `documentwithtext`
- `dog`
- `dogside`
- `dolphin`
- `donotlittersymbol`
- `door`
- `doublecurlyloop`
- `doubleexclaimationmark`
- `doughnut`
- `doveofpeace`
- `down`
- `downpointingredtriangle`
- `downpointingsmallredtrisngle`
- `dragonhead`
- `dragonside`
- `dress`
- `dromedarycamel`
- `droplet`
- `dvd`
- `ear`
- `earofmaize`
- `earofrice`
- `eightpointedblackstar`
- `eightspokedasterix`
- `electricplug`
- `electrictorch`
- `elephant`
- `email`
- `emptydocument`
- `emptynote`
- `emptynotepad`
- `emptynotepage`
- `emptypage`
- `emptypages`
- `endwithleftwardsarrow`
- `envelope`
- `envelopedownarrowabove`
- `envelopewithlightning`
- `europeafricaglobe`
- `europeancastle`
- `europeanpostoffice`
- `evergreen`
- `exclaimationquestionmark`
- `expressionless`
- `eye`
- `eyes`
- `factory`
- `fallingleaf`
- `family`
- `fatherchristmas`
- `faxicon`
- `faxmachine`
- `fearful`
- `ferriswheel`
- `filecabinet`
- `filefolder`
- `filmframes`
- `filmprojector`
- `fire`
- `fireengine`
- `fireworks`
- `fireworksparkler`
- `firstquartermoon`
- `firstquartermoonface`
- `fish`
- `fishcakeswirl`
- `fishingpoleandfish`
- `fistedhand`
- `flaginhole`
- `flexbicep`
- `floppydisk2`
- `flowerplayingcards`
- `flushed`
- `flyingenvelope`
- `fog`
- `foggy`
- `folder`
- `footprints`
- `forkandknife`
- `forkknife`
- `fountain`
- `fourleafclover`
- `foxcrying`
- `foxgrin`
- `foxheart`
- `foxkissing`
- `foxpouting`
- `foxsmiling`
- `foxtearofjoy`
- `foxweary`
- `foxwry`
- `framewithpicture`
- `framewithtiles`
- `framewithx`
- `franceflag`
- `frenchfries`
- `friedshrimp`
- `frog`
- `frontfacingchick`
- `frown`
- `frownmouth`
- `fuelpump`
- `fullmoon`
- `fullmoonwithface`
- `gamedie`
- `gem`
- `gemini`
- `ghost`
- `girl`
- `girlgirl`
- `girlguy`
- `glasses`
- `gma`
- `goat`
- `golfer`
- `gpa`
- `graduationcap`
- `grapes`
- `greatbritainflag`
- `greenapple`
- `greenbook`
- `grimacing`
- `grin`
- `grineyes`
- `grinsquint`
- `grinsweat`
- `grintears`
- `grinwide`
- `grinwideeyes`
- `growingheart`
- `guapimao`
- `guardsman`
- `guitar`
- `guyguy`
- `haircut`
- `halo`
- `hamburger`
- `hammer`
- `hampster`
- `hand`
- `handbag`
- `handheldvideocamera`
- `hands`
- `handup`
- `harddisk`
- `hatchingchick`
- `headmassage`
- `headphone`
- `heartarrow`
- `heartblue`
- `heartdecoration`
- `hearteyes`
- `heartgreen`
- `heartlefttip`
- `heartpurple`
- `heartribbon`
- `heartyellow`
- `heavycheckmark`
- `heavydivisionsign`
- `heavydollarsign`
- `heavyexclaimationmarksymbol`
- `heavylargecircle`
- `heavylatincross`
- `heavyminussign`
- `heavymultiplicationsymbol`
- `heavyplussign`
- `heels`
- `helicopter`
- `herb`
- `hibiscus`
- `high5`
- `highbrightness`
- `highspeedtrain`
- `highspeedtrainbulletnose`
- `hocho`
- `hole`
- `honeybee`
- `honeypot`
- `horizontaltrafficlight`
- `horse`
- `horseface`
- `horseracing`
- `hospital`
- `hotbeverage`
- `hotel`
- `hotsprings`
- `hourglass`
- `hourglassflowingsand`
- `housebuilding`
- `housebuildings`
- `housewithgarden`
- `hundredpointssymbol`
- `hushed`
- `icecream`
- `imp`
- `inboxtray`
- `incomingenvelope`
- `increasefontsize`
- `index`
- `informationsource`
- `inputsymbolforlatincapitalletters`
- `inputsymbolforlatinletters`
- `inputsymbolforlatinsmallletters`
- `inputsymbolfornumbers`
- `inputsymbolforsymbols`
- `italianflag`
- `izakayalantern`
- `jackolantern`
- `japaneseangrymask`
- `japanesecastle`
- `japanesedolls`
- `japanesepostoffice`
- `japanesesymbolforbeginner`
- `japanflag`
- `jeans`
- `key`
- `keyboard`
- `keyboardandmouse`
- `kimono`
- `kiss`
- `kissclosedeyes`
- `kisseyes`
- `kissing`
- `kissmark`
- `koala`
- `koreaflag`
- `label`
- `ladybeetle`
- `largebluecircle`
- `largebluediamond`
- `largeorangediamond`
- `largeredcircle`
- `lastquartermoon`
- `lastquartermoonface`
- `leaffluttering`
- `ledger`
- `left`
- `leftangerbubble`
- `lefthandphone`
- `leftluggage`
- `leftmagnifyingglass`
- `leftrightarrow`
- `leftspeechbubble`
- `leftthoughtbubble`
- `leftwardsarrowwithhook`
- `leftwardsblackarrow`
- `leftwritinghand`
- `lemon`
- `leo`
- `leopardside`
- `levelslider`
- `libra`
- `lightbulb`
- `lightningmood`
- `lightningmoodbubble`
- `lightrail`
- `linkedpaperclips`
- `linksymbol`
- `lips`
- `lipstick`
- `lock`
- `lockandkey`
- `lockwithinkpen`
- `lollipop`
- `loudlycrying`
- `loudspeaker`
- `lovehotel`
- `loveletter`
- `lowbrightness`
- `lowerleftcrayon`
- `lowerleftfountainpen`
- `lowerleftpaintbrush`
- `lowerleftpen`
- `lowerleftpencil`
- `lowerrightwhitecircle`
- `mahjong`
- `makeupbag`
- `man`
- `maninbusinesssuitlevitating`
- `manltepiececlock`
- `mansshirt`
- `mapleleaf`
- `markschaptersymbol`
- `maximize`
- `meatonbone`
- `medicalmask`
- `mediumblackcircle`
- `mediumwhitecircle`
- `megaphone`
- `melon`
- `memo`
- `mensrunner`
- `mensshoe`
- `menssymbol`
- `meridianglobe`
- `metro`
- `microphone`
- `microscope`
- `militarymedal`
- `milkyway`
- `minibus`
- `minidisc`
- `minimize`
- `mobilephoneoff`
- `moneybag`
- `moneywithwings`
- `monkey`
- `monkeyface`
- `monkeyhear`
- `monkeysee`
- `monkeyspeak`
- `monorail`
- `moodbubble`
- `moonviewingceremony`
- `motorcycle`
- `mountaincableway`
- `mountainrailway`
- `mountfuji`
- `mouse`
- `mouseside`
- `mouth`
- `moviecamera`
- `moyai`
- `multiplemusicalnotes`
- `mushroom`
- `musicalkeyboard`
- `musicalnote`
- `musicalscore`
- `musicascend`
- `musicdescend`
- `nailpolish`
- `namebadge`
- `nationalpark`
- `negativesquaredab`
- `negativesquaredcrossmark`
- `negativesquaredlatincapitalletterp`
- `negativesquaredlatincaptiala`
- `negativesquaredlatincaptialb`
- `negativesquaredlatincaptialo`
- `neutral`
- `newmoon`
- `newmoonwithface`
- `newspaper`
- `nightwithstars`
- `nobicycles`
- `noentry`
- `noentrysign`
- `nogesture`
- `nomobilephones`
- `nomouth`
- `nonpotablewatersymbol`
- `nooneunder18symbol`
- `nopedestrians`
- `nopiracy`
- `northeastarrow`
- `northwestarrow`
- `nose`
- `nosmokingsymbol`
- `notchedrightsemi3dot`
- `note`
- `notebook`
- `notebookdecorativecover`
- `notepad`
- `notepage`
- `nutandbolt`
- `octopus`
- `oden`
- `officebuilding`
- `ogre`
- `okgesture`
- `oldkey`
- `oldpersonalcomputer`
- `omsymbol`
- `onarrowleftright`
- `oncomingautomobile`
- `oncomingbus`
- `oncomingpolicecar`
- `oncomingtaxi`
- `onebuttonmouse`
- `openbook`
- `openfilefolder`
- `openfolder`
- `openlock`
- `openmailboxlowered`
- `openmailboxraised`
- `openmouth`
- `ophiuchus`
- `opticaldisc`
- `opticaldiscicon`
- `orangebook`
- `outbox`
- `overlap`
- `ox`
- `package`
- `page`
- `pagefacingup`
- `pager`
- `pages`
- `pagewithcircledtext`
- `pagewithcurl`
- `palmtree`
- `pandaface`
- `paperclip`
- `partalternationmark`
- `partypopper`
- `passportcontrol`
- `pawprints`
- `peach`
- `pear`
- `pencil`
- `penguin`
- `penoverstampedenvelope`
- `pensive`
- `performingarts`
- `perservere`
- `personalcomputer`
- `phonerightarrowleft`
- `phonewithpage`
- `pig`
- `pigside`
- `pigsnout`
- `pill`
- `pineapple`
- `pinedecoration`
- `pinkwallet`
- `pisces`
- `pistol`
- `playingcardblackjoker`
- `policecar`
- `policecarsrevolvinglight`
- `poo`
- `poodle`
- `portablestereo`
- `postalhorn`
- `postbox`
- `potablewatersystem`
- `potoffood`
- `poultryleg`
- `pout`
- `pouting`
- `pray`
- `present`
- `princess`
- `printer`
- `printericon`
- `pushpin`
- `putlitterinitsplacesymbol`
- `racecar`
- `radio`
- `radiobutton`
- `railwaycar`
- `rainbow`
- `raincloud`
- `raisedfist`
- `raisedhandpartfingers`
- `raisedhandsfingerssplayed`
- `ram`
- `rat`
- `recreationalvehicle`
- `redapple`
- `redheart`
- `regionalindicatorb`
- `regionalindicatorc`
- `regionalindicatore`
- `regionalindicatorf`
- `regionalindicatorg`
- `regionalindicatori`
- `regionalindicatorj`
- `regionalindicatork`
- `regionalindicatorn`
- `regionalindicatorp`
- `regionalindicatorr`
- `regionalindicators`
- `regionalindicatort`
- `regionalindicatoru`
- `relieved`
- `reminder`
- `restroom`
- `reversehandmiddlefinger`
- `reverseraisedhandsfingerssplayed`
- `reversethumbsdown`
- `reversethumbsup`
- `reversevictoryhand`
- `revolvinghearts`
- `riceball`
- `ricecracker`
- `right`
- `rightangerbubble`
- `righthandphone`
- `rightmagnifyingglass`
- `rightspeaker`
- `rightspeaker3soundwaves`
- `rightspeechbubble`
- `rightthoughtbubble`
- `rightwardsarrowwithhook`
- `ring`
- `ringingbell`
- `roastedsweetpotato`
- `rocket`
- `rolledupnewspaper`
- `rollercoaster`
- `rooster`
- `rose`
- `rosette`
- `roundpushpin`
- `rowboat`
- `rugbyfootball`
- `running`
- `runningshirt`
- `russianflag`
- `saggitarius`
- `sailboat`
- `sakebottleandcup`
- `sandals`
- `satelliteantenna`
- `saxophone`
- `school`
- `schoolsatchel`
- `scorpius`
- `screamfear`
- `screen`
- `scroll`
- `seat`
- `seedling`
- `shavedice`
- `sheep`
- `ship`
- `shootingstar`
- `shortcake`
- `shower`
- `sidewaysblackdownpointingindex`
- `sidewaysblackleftpointingindex`
- `sidewaysblackrightpointingindex`
- `sidewaysblackuppointingindex`
- `sidewaysdownpointingindex`
- `sidewaysleftpointingindex`
- `sidewaysrightpointingindex`
- `sidewaysuppointingindex`
- `silhouetteohjapan`
- `sixpointedstarwithdot`
- `skiandskiboot`
- `skull`
- `sleeping`
- `sleepy`
- `sleuthspy`
- `sliceofpizza`
- `slotmachine`
- `smallbluediamond`
- `smallfrown`
- `smallorangediamond`
- `smallsmile`
- `smileeyes`
- `smiletongue`
- `smirk`
- `smokingsymbol`
- `snail`
- `snake`
- `snowboarder`
- `snowcloud`
- `snowflake`
- `snowmanwithoutsnow`
- `snowmountains`
- `soccerball`
- `softicecream`
- `softshellfloppy`
- `soonwithrightarrow`
- `southeastarrow`
- `spaghetti`
- `spanishflag`
- `sparkle`
- `sparkles`
- `sparklingheart`
- `speaker`
- `speaker3soundwaves`
- `speakercancellation`
- `speakeronesoundwave`
- `speakerwith1soundwave`
- `speakingheadinsilhouette`
- `speechbubble`
- `speedboat`
- `spider`
- `spiderweb`
- `spiralcalendarpad`
- `spiralnotepad`
- `spiralshell`
- `sportsmedal`
- `spurtingwhale`
- `squaredcl`
- `squaredcool`
- `squaredfree`
- `squaredid`
- `squaredkatakanakoko`
- `squaredkatakanasa`
- `squarednew`
- `squaredng`
- `squaredok`
- `squaredsos`
- `squaredup`
- `squaredvs`
- `stadium`
- `stampedenvelope`
- `star`
- `station`
- `statueofliberty`
- `steamingbowl`
- `steamlocomotive`
- `stockchart`
- `stormcloud`
- `straightruler`
- `strawberry`
- `studiomic`
- `sunbehindcloud`
- `sunflower`
- `sunglasses`
- `sunraincloud`
- `sunrays`
- `sunrise`
- `sunriseovermountains`
- `sunsetoverbuildings`
- `sunwithface`
- `surfer`
- `sushi`
- `suspensionrailway`
- `sweat`
- `sweatsplash`
- `swimming`
- `syringe`
- `tanabatatree`
- `tangerine`
- `tapecartridge`
- `taurus`
- `taxi`
- `teacupwithouthandle`
- `tearoffcalendar`
- `telephoneonmodem`
- `telephonereceiver2`
- `telescope`
- `television`
- `ten`
- `tennisball`
- `tent`
- `thermometer`
- `thoughtbaloon`
- `threebuttonmouse`
- `threenetworkedcomputers`
- `threeraysabove`
- `threeraysbelow`
- `threeraysleft`
- `threeraysright`
- `threespeechbubbles`
- `thumbsdown`
- `thumbsup`
- `ticket`
- `tie`
- `tiger`
- `tigerside`
- `tired`
- `toilet`
- `tomato`
- `tongue`
- `tongueout`
- `tongueoutwink`
- `tongueoutwink2`
- `tophat`
- `topwithupwardsarrow`
- `tornado`
- `toykotower`
- `trackball`
- `tractor`
- `train`
- `tram`
- `tramcar`
- `triangularflagonpost`
- `triangularruler`
- `tridentemblem`
- `triumph`
- `trolleybus`
- `trophy`
- `tropicaldrink`
- `tropicalfish`
- `trumpet`
- `tulip`
- `turban`
- `turnedokhand`
- `turtle`
- `twistedrightwardsarrows`
- `twobuttonmouse`
- `twospeechbubbles`
- `umbrella`
- `umbrellawithraindrops`
- `unamused`
- `up`
- `updownarrow`
- `upperrightwhitecircle`
- `uppointingredtriangle`
- `uppointingsmallredtrisngle`
- `verticaltrafficlight`
- `vibrationmode`
- `victoryhand`
- `videocasette`
- `videogame`
- `violin`
- `virgo`
- `volcano`
- `waitress`
- `walking`
- `waningbibbousmoon`
- `waningcrescentmoon`
- `warningsign`
- `wastebasket`
- `watch`
- `waterbuffalo`
- `watercloset`
- `watermelon`
- `wave`
- `waving`
- `wavydash`
- `waxingcrescentmoon`
- `waxinggibbousmoon`
- `weary`
- `wedding`
- `weightlifter`
- `whale`
- `wheelchairsymbol`
- `whitedownpointinglefthand`
- `whiteexclaimationmark`
- `whiteflower`
- `whitehardshellfloppy`
- `whiteheavycheckmark`
- `whitelargesquare`
- `whitelatincross`
- `whitemediumsmallsquare`
- `whitemediumsquare`
- `whitemediumstar`
- `whitepennant`
- `whitequestionmark`
- `whitesmallsquare`
- `whitesmilingface`
- `whitesquarebutton`
- `whitestar`
- `whitesun`
- `whitesunbehindcloud`
- `whitesunsmallcloud`
- `whitetouchtonephone`
- `windchime`
- `window`
- `wineglass`
- `winking`
- `wiredkeyboard`
- `wolfface`
- `woman`
- `womanshat`
- `womansshirt`
- `womenssymbol`
- `worldmap`
- `worried`
- `wrench`
- `zzz`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><2heartsIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AcornIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdmissionticketsIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AerialtramwayIcon size="20" class="nav-icon" /> Settings</a>
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
<2heartsIcon
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
    <2heartsIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AcornIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdmissionticketsIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <2heartsIcon size="24" />
   <AcornIcon size="24" color="#4a90e2" />
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
   <2heartsIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <2heartsIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <2heartsIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 2hearts } from '@stacksjs/iconify-fxemoji'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(2hearts, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 2hearts } from '@stacksjs/iconify-fxemoji'

// Icons are typed as IconData
const myIcon: IconData = 2hearts
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://mozilla.github.io/fxemoji/LICENSE.md) for more information.

## Credits

- **Icons**: Mozilla ([Website](https://github.com/mozilla/fxemoji))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fxemoji/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fxemoji/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
