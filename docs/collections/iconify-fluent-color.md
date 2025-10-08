# Fluent UI System Color Icons

> Fluent UI System Color Icons icons for stx from Iconify

## Overview

This package provides access to 889 icons from the Fluent UI System Color Icons collection through the stx iconify integration.

**Collection ID:** `fluent-color`
**Total Icons:** 889
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-system-icons))
**License:** MIT ([Details](https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-fluent-color
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddCircle16Icon height="1em" />
<AddCircle16Icon width="1em" height="1em" />
<AddCircle16Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddCircle16Icon size="24" />
<AddCircle16Icon size="1em" />

<!-- Using width and height -->
<AddCircle16Icon width="24" height="32" />

<!-- With color -->
<AddCircle16Icon size="24" color="red" />
<AddCircle16Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddCircle16Icon size="24" class="icon-primary" />

<!-- With all properties -->
<AddCircle16Icon
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
    <AddCircle16Icon size="24" />
    <AddCircle20Icon size="24" color="#4a90e2" />
    <AddCircle24Icon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addCircle16, addCircle20, addCircle24 } from '@stacksjs/iconify-fluent-color'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addCircle16, { size: 24 })
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
<AddCircle16Icon size="24" color="red" />
<AddCircle16Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddCircle16Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddCircle16Icon size="24" class="text-primary" />
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
<AddCircle16Icon height="1em" />
<AddCircle16Icon width="1em" height="1em" />
<AddCircle16Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddCircle16Icon size="24" />
<AddCircle16Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fluentColor-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddCircle16Icon class="fluentColor-icon" />
```

## Available Icons

This package contains **889** icons:

- `addCircle16`
- `addCircle20`
- `addCircle24`
- `addCircle28`
- `addCircle32`
- `addStarburst16`
- `addStarburst20`
- `addStarburst24`
- `addStarburst28`
- `addStarburst32`
- `addStarburst48`
- `agents16`
- `agents20`
- `agents24`
- `agents28`
- `agents32`
- `agents48`
- `alert16`
- `alert20`
- `alert24`
- `alert28`
- `alert32`
- `alert48`
- `alertBadge16`
- `alertBadge20`
- `alertBadge24`
- `alertBadge32`
- `alertUrgent16`
- `alertUrgent20`
- `alertUrgent24`
- `animalPawPrint16`
- `animalPawPrint20`
- `animalPawPrint24`
- `animalPawPrint28`
- `animalPawPrint32`
- `animalPawPrint48`
- `approvalsApp16`
- `approvalsApp20`
- `approvalsApp24`
- `approvalsApp28`
- `approvalsApp32`
- `apps16`
- `apps20`
- `apps24`
- `apps28`
- `apps32`
- `apps48`
- `appsList20`
- `appsList24`
- `appsList32`
- `appsListDetail20`
- `appsListDetail24`
- `appsListDetail32`
- `arrowClockwiseDashes16`
- `arrowClockwiseDashes20`
- `arrowClockwiseDashes24`
- `arrowClockwiseDashes32`
- `arrowClockwiseDashesSettings16`
- `arrowClockwiseDashesSettings20`
- `arrowClockwiseDashesSettings24`
- `arrowClockwiseDashesSettings28`
- `arrowClockwiseDashesSettings32`
- `arrowClockwiseDashesSettings48`
- `arrowSquare20`
- `arrowSquare24`
- `arrowSquare32`
- `arrowSquareDown20`
- `arrowSquareDown24`
- `arrowSquareDown32`
- `arrowSync16`
- `arrowSync20`
- `arrowSync24`
- `arrowTrendingLines20`
- `arrowTrendingLines24`
- `beach16`
- `beach20`
- `beach24`
- `beach28`
- `beach32`
- `beach48`
- `board16`
- `board20`
- `board24`
- `board28`
- `book16`
- `book20`
- `book24`
- `book28`
- `book32`
- `book48`
- `bookContacts16`
- `bookContacts20`
- `bookContacts24`
- `bookContacts28`
- `bookContacts32`
- `bookContacts48`
- `bookDatabase16`
- `bookDatabase20`
- `bookDatabase24`
- `bookDatabase32`
- `bookOpen16`
- `bookOpen20`
- `bookOpen24`
- `bookOpen28`
- `bookOpen32`
- `bookOpen48`
- `bookOpenLightbulb20`
- `bookOpenLightbulb24`
- `bookOpenLightbulb32`
- `bookStar20`
- `bookStar24`
- `bookmark16`
- `bookmark20`
- `bookmark24`
- `bookmark28`
- `bookmark32`
- `bot16`
- `bot20`
- `bot24`
- `botSparkle16`
- `botSparkle20`
- `botSparkle24`
- `briefcase16`
- `briefcase20`
- `briefcase24`
- `briefcase28`
- `briefcase32`
- `briefcase48`
- `building16`
- `building20`
- `building24`
- `building32`
- `building48`
- `buildingGovernment16`
- `buildingGovernment20`
- `buildingGovernment24`
- `buildingGovernment32`
- `buildingGovernmentSearch16`
- `buildingGovernmentSearch20`
- `buildingGovernmentSearch24`
- `buildingGovernmentSearch32`
- `buildingHome16`
- `buildingHome20`
- `buildingHome24`
- `buildingHome32`
- `buildingMultiple20`
- `buildingMultiple24`
- `buildingPeople16`
- `buildingPeople20`
- `buildingPeople24`
- `buildingStore16`
- `buildingStore20`
- `buildingStore24`
- `calendar16`
- `calendar20`
- `calendar24`
- `calendar28`
- `calendar32`
- `calendar48`
- `calendarCancel16`
- `calendarCancel20`
- `calendarCancel24`
- `calendarCheckmark16`
- `calendarCheckmark20`
- `calendarCheckmark24`
- `calendarClock16`
- `calendarClock20`
- `calendarClock24`
- `calendarDataBar16`
- `calendarDataBar20`
- `calendarDataBar24`
- `calendarDataBar28`
- `calendarEdit16`
- `calendarEdit20`
- `calendarEdit24`
- `calendarEdit32`
- `calendarPeople20`
- `calendarSync16`
- `calendarSync20`
- `calendarSync24`
- `camera16`
- `camera20`
- `camera24`
- `certificate16`
- `certificate20`
- `certificate24`
- `certificate32`
- `chartMultiple16`
- `chartMultiple20`
- `chartMultiple24`
- `chartMultiple32`
- `chat16`
- `chat20`
- `chat24`
- `chat28`
- `chat32`
- `chat48`
- `chatAdd16`
- `chatAdd20`
- `chatAdd24`
- `chatAdd28`
- `chatAdd32`
- `chatAdd48`
- `chatBubblesQuestion16`
- `chatBubblesQuestion20`
- `chatBubblesQuestion24`
- `chatMore16`
- `chatMore20`
- `chatMore24`
- `chatMultiple16`
- `chatMultiple20`
- `chatMultiple24`
- `checkbox16`
- `checkbox20`
- `checkbox24`
- `checkboxPerson16`
- `checkboxPerson20`
- `checkboxPerson24`
- `checkmarkCircle16`
- `checkmarkCircle20`
- `checkmarkCircle24`
- `checkmarkCircle32`
- `checkmarkCircle48`
- `circleMultipleHintCheckmark16`
- `circleMultipleHintCheckmark24`
- `circleMultipleHintCheckmark28`
- `circleMultipleHintCheckmark32`
- `circleMultipleHintCheckmark48`
- `clipboard16`
- `clipboard20`
- `clipboard24`
- `clipboard28`
- `clipboard32`
- `clipboard48`
- `clipboardTask16`
- `clipboardTask20`
- `clipboardTask24`
- `clipboardTextEdit20`
- `clipboardTextEdit24`
- `clipboardTextEdit32`
- `clock16`
- `clock20`
- `clock24`
- `clock28`
- `clock32`
- `clock48`
- `clockAlarm16`
- `clockAlarm20`
- `clockAlarm24`
- `clockAlarm32`
- `clockAlarm48`
- `cloud16`
- `cloud20`
- `cloud24`
- `cloud28`
- `cloud32`
- `cloud48`
- `cloudDismiss16`
- `cloudDismiss20`
- `cloudDismiss24`
- `cloudDismiss28`
- `cloudDismiss32`
- `cloudDismiss48`
- `cloudWords16`
- `cloudWords20`
- `cloudWords24`
- `cloudWords28`
- `cloudWords32`
- `cloudWords48`
- `code16`
- `code20`
- `code24`
- `codeBlock16`
- `codeBlock20`
- `codeBlock24`
- `codeBlock28`
- `codeBlock32`
- `codeBlock48`
- `coinMultiple16`
- `coinMultiple20`
- `coinMultiple24`
- `coinMultiple28`
- `coinMultiple32`
- `coinMultiple48`
- `comment16`
- `comment20`
- `comment24`
- `comment28`
- `comment32`
- `comment48`
- `commentMultiple16`
- `commentMultiple20`
- `commentMultiple24`
- `commentMultiple28`
- `commentMultiple32`
- `contactCard16`
- `contactCard20`
- `contactCard24`
- `contactCard28`
- `contactCard32`
- `contactCard48`
- `contentView16`
- `contentView20`
- `contentView24`
- `contentView28`
- `contentView32`
- `dataArea20`
- `dataArea24`
- `dataArea32`
- `dataBarVerticalAscending16`
- `dataBarVerticalAscending20`
- `dataBarVerticalAscending24`
- `dataLine16`
- `dataLine20`
- `dataLine24`
- `dataLine32`
- `dataPie20`
- `dataPie24`
- `dataPie32`
- `dataScatter20`
- `dataScatter24`
- `dataScatter32`
- `dataTrending16`
- `dataTrending20`
- `dataTrending24`
- `dataTrending28`
- `dataTrending32`
- `dataTrending48`
- `database16`
- `database20`
- `database24`
- `database32`
- `database48`
- `designIdeas16`
- `designIdeas20`
- `designIdeas24`
- `designIdeas28`
- `designIdeas32`
- `designIdeas48`
- `dismissCircle16`
- `dismissCircle20`
- `dismissCircle24`
- `dismissCircle28`
- `dismissCircle32`
- `dismissCircle48`
- `diversity16`
- `diversity20`
- `diversity24`
- `diversity28`
- `diversity48`
- `document16`
- `document20`
- `document24`
- `document28`
- `document32`
- `document48`
- `documentAdd16`
- `documentAdd20`
- `documentAdd24`
- `documentAdd28`
- `documentAdd48`
- `documentEdit16`
- `documentEdit20`
- `documentEdit24`
- `documentFolder16`
- `documentFolder20`
- `documentFolder24`
- `documentLock16`
- `documentLock20`
- `documentLock24`
- `documentLock28`
- `documentLock32`
- `documentLock48`
- `documentText16`
- `documentText20`
- `documentText24`
- `documentText28`
- `documentText32`
- `documentText48`
- `drafts16`
- `drafts20`
- `drafts24`
- `edit16`
- `edit20`
- `edit24`
- `edit32`
- `errorCircle16`
- `errorCircle20`
- `errorCircle24`
- `errorCircle48`
- `fastForwardCircle24`
- `flag16`
- `flag20`
- `flag24`
- `flag28`
- `flag32`
- `flag48`
- `food16`
- `food20`
- `food24`
- `food28`
- `food32`
- `food48`
- `form20`
- `form24`
- `form28`
- `form48`
- `gameChat20`
- `gauge20`
- `gauge24`
- `gauge32`
- `gift16`
- `gift20`
- `gift24`
- `giftCard16`
- `giftCard20`
- `giftCard24`
- `globe20`
- `globe24`
- `globeShield20`
- `globeShield24`
- `globeShield48`
- `guest16`
- `guest20`
- `guest24`
- `guest28`
- `guest32`
- `guest48`
- `headphones20`
- `headphones24`
- `headphones28`
- `headphones32`
- `headphones48`
- `headset16`
- `headset20`
- `headset24`
- `headset28`
- `headset32`
- `headset48`
- `heart16`
- `heart20`
- `heart24`
- `heart28`
- `heart32`
- `heart48`
- `history16`
- `history20`
- `history24`
- `history28`
- `history32`
- `history48`
- `home16`
- `home20`
- `home24`
- `home28`
- `home32`
- `home48`
- `image16`
- `image20`
- `image24`
- `image28`
- `image32`
- `image48`
- `imageOff20`
- `imageOff24`
- `imageOff28`
- `imageOff32`
- `imageOff48`
- `laptop16`
- `laptop20`
- `laptop24`
- `laptop28`
- `laptop32`
- `laptop48`
- `layerDiagonalPerson16`
- `layerDiagonalPerson20`
- `layerDiagonalPerson24`
- `library16`
- `library20`
- `library24`
- `library28`
- `library32`
- `lightbulb16`
- `lightbulb20`
- `lightbulb24`
- `lightbulb28`
- `lightbulb32`
- `lightbulb48`
- `lightbulbCheckmark20`
- `lightbulbCheckmark24`
- `lightbulbCheckmark32`
- `lightbulbFilament16`
- `lightbulbFilament20`
- `lightbulbFilament24`
- `lightbulbFilament28`
- `lightbulbFilament32`
- `lightbulbFilament48`
- `link20`
- `link24`
- `link28`
- `link32`
- `linkMultiple16`
- `linkMultiple20`
- `linkMultiple24`
- `listBar16`
- `listBar20`
- `listBar24`
- `listBar32`
- `locationRipple16`
- `locationRipple20`
- `locationRipple24`
- `lockClosed16`
- `lockClosed20`
- `lockClosed24`
- `lockClosed28`
- `lockClosed32`
- `lockClosed48`
- `lockShield16`
- `lockShield20`
- `lockShield24`
- `lockShield28`
- `lockShield32`
- `lockShield48`
- `mail16`
- `mail20`
- `mail24`
- `mail28`
- `mail32`
- `mail48`
- `mailAlert16`
- `mailAlert20`
- `mailAlert24`
- `mailAlert28`
- `mailAlert32`
- `mailClock16`
- `mailClock20`
- `mailClock24`
- `mailClock32`
- `mailMultiple16`
- `mailMultiple20`
- `mailMultiple24`
- `mailMultiple28`
- `mailMultiple32`
- `megaphoneLoud16`
- `megaphoneLoud20`
- `megaphoneLoud24`
- `megaphoneLoud28`
- `megaphoneLoud32`
- `mic16`
- `mic20`
- `mic24`
- `mic28`
- `mic32`
- `mic48`
- `molecule16`
- `molecule20`
- `molecule24`
- `molecule28`
- `molecule32`
- `molecule48`
- `news16`
- `news20`
- `news24`
- `news28`
- `notebook16`
- `notebook20`
- `notebook24`
- `notebook32`
- `notebookQuestionMark20`
- `notebookQuestionMark24`
- `numberSymbolSquare20`
- `numberSymbolSquare24`
- `numberSymbolSquare32`
- `options16`
- `options20`
- `options24`
- `options28`
- `options32`
- `options48`
- `org16`
- `org20`
- `org24`
- `org28`
- `org32`
- `org48`
- `paintBrush16`
- `paintBrush20`
- `paintBrush24`
- `paintBrush28`
- `paintBrush32`
- `patient20`
- `patient24`
- `patient32`
- `paw16`
- `paw20`
- `paw24`
- `paw28`
- `paw32`
- `paw48`
- `people16`
- `people20`
- `people24`
- `people28`
- `people32`
- `people48`
- `peopleAdd20`
- `peopleAdd24`
- `peopleAdd28`
- `peopleAdd32`
- `peopleChat20`
- `peopleChat24`
- `peopleChat28`
- `peopleChat32`
- `peopleChat48`
- `peopleCommunity16`
- `peopleCommunity20`
- `peopleCommunity24`
- `peopleCommunity28`
- `peopleCommunity32`
- `peopleCommunity48`
- `peopleHome16`
- `peopleHome20`
- `peopleHome24`
- `peopleHome28`
- `peopleHome32`
- `peopleHome48`
- `peopleInterwoven16`
- `peopleInterwoven20`
- `peopleInterwoven24`
- `peopleInterwoven28`
- `peopleInterwoven32`
- `peopleInterwoven48`
- `peopleList16`
- `peopleList20`
- `peopleList24`
- `peopleList28`
- `peopleList32`
- `peopleSync16`
- `peopleSync20`
- `peopleSync24`
- `peopleSync28`
- `peopleSync32`
- `peopleTeam16`
- `peopleTeam20`
- `peopleTeam24`
- `peopleTeam28`
- `peopleTeam32`
- `peopleTeam48`
- `person16`
- `person20`
- `person24`
- `person28`
- `person32`
- `person48`
- `personAdd20`
- `personAdd24`
- `personAdd28`
- `personAdd32`
- `personAdd48`
- `personAvailable16`
- `personAvailable20`
- `personAvailable24`
- `personEdit32`
- `personFeedback16`
- `personFeedback20`
- `personFeedback24`
- `personFeedback28`
- `personFeedback32`
- `personFeedback48`
- `personHeart20`
- `personHeart24`
- `personHeart28`
- `personHeart32`
- `personHeart48`
- `personKey20`
- `personKey24`
- `personKey32`
- `personStarburst16`
- `personStarburst20`
- `personStarburst24`
- `personStarburst28`
- `personStarburst32`
- `personStarburst48`
- `personTentative16`
- `personTentative20`
- `personTentative24`
- `personTentative32`
- `personWarning16`
- `personWarning20`
- `personWarning24`
- `personWarning28`
- `personWarning32`
- `personWarning48`
- `phone16`
- `phone20`
- `phone24`
- `phone28`
- `phone32`
- `phone48`
- `phoneLaptop16`
- `phoneLaptop20`
- `phoneLaptop24`
- `phoneLaptop32`
- `pin16`
- `pin20`
- `pin24`
- `pin28`
- `pin32`
- `pin48`
- `planet16`
- `planet20`
- `planet24`
- `planet32`
- `poll16`
- `poll20`
- `poll24`
- `poll32`
- `premium16`
- `premium20`
- `premium24`
- `premium28`
- `premium32`
- `puzzlePiece16`
- `puzzlePiece20`
- `puzzlePiece24`
- `puzzlePiece28`
- `puzzlePiece32`
- `puzzlePiece48`
- `questionCircle16`
- `questionCircle20`
- `questionCircle24`
- `questionCircle28`
- `questionCircle32`
- `questionCircle48`
- `receipt16`
- `receipt20`
- `receipt24`
- `receipt28`
- `receipt32`
- `reward16`
- `reward20`
- `reward24`
- `ribbon16`
- `ribbon20`
- `ribbon24`
- `ribbon32`
- `ribbonStar20`
- `ribbonStar24`
- `ribbonStar32`
- `savings16`
- `savings20`
- `savings24`
- `savings32`
- `scanPerson16`
- `scanPerson20`
- `scanPerson24`
- `scanPerson28`
- `scanPerson48`
- `scanType20`
- `scanType24`
- `searchSparkle16`
- `searchSparkle20`
- `searchSparkle24`
- `searchSparkle28`
- `searchSparkle32`
- `searchSparkle48`
- `searchVisual16`
- `searchVisual20`
- `searchVisual24`
- `send16`
- `send20`
- `send24`
- `send28`
- `send32`
- `send48`
- `sendClock20`
- `sendClock24`
- `sendClock32`
- `settings16`
- `settings20`
- `settings24`
- `settings28`
- `settings32`
- `settings48`
- `shareAndroid16`
- `shareAndroid20`
- `shareAndroid24`
- `shareAndroid32`
- `shareIos20`
- `shareIos24`
- `shareIos28`
- `shareIos32`
- `shareIos48`
- `shield16`
- `shield20`
- `shield24`
- `shield28`
- `shield32`
- `shield48`
- `shieldCheckmark16`
- `shieldCheckmark20`
- `shieldCheckmark24`
- `shieldCheckmark28`
- `shieldCheckmark48`
- `shifts16`
- `shifts20`
- `shifts24`
- `shifts28`
- `shifts32`
- `slideTextSparkle16`
- `slideTextSparkle20`
- `slideTextSparkle24`
- `slideTextSparkle28`
- `slideTextSparkle32`
- `slideTextSparkle48`
- `sport16`
- `sport20`
- `sport24`
- `star16`
- `star20`
- `star24`
- `star28`
- `star32`
- `star48`
- `starSettings20`
- `starSettings24`
- `starSettings32`
- `table16`
- `table20`
- `table24`
- `table28`
- `table32`
- `table48`
- `textBulletListSquare16`
- `textBulletListSquare20`
- `textBulletListSquare24`
- `textBulletListSquare28`
- `textBulletListSquare32`
- `textBulletListSquare48`
- `textBulletListSquareSparkle16`
- `textBulletListSquareSparkle20`
- `textBulletListSquareSparkle24`
- `textBulletListSquareSparkle32`
- `textEditStyle16`
- `textEditStyle20`
- `textEditStyle24`
- `toolbox16`
- `toolbox20`
- `toolbox24`
- `toolbox28`
- `toolbox32`
- `trophy16`
- `trophy20`
- `trophy24`
- `trophy28`
- `trophy32`
- `trophy48`
- `vault16`
- `vault20`
- `vault24`
- `video16`
- `video20`
- `video24`
- `video28`
- `video32`
- `video48`
- `warning16`
- `warning20`
- `warning24`
- `warning28`
- `warning32`
- `warning48`
- `weatherSnowflake20`
- `weatherSnowflake24`
- `weatherSnowflake32`
- `weatherSnowflake48`
- `weatherSunnyLow20`
- `weatherSunnyLow24`
- `weatherSunnyLow48`
- `wifi20`
- `wifi24`
- `wifiWarning20`
- `wifiWarning24`
- `wrench16`
- `wrench20`
- `wrench24`
- `wrenchScrewdriver20`
- `wrenchScrewdriver24`
- `wrenchScrewdriver32`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddCircle16Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddCircle20Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddCircle24Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddCircle28Icon size="20" class="nav-icon" /> Settings</a>
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
<AddCircle16Icon
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
    <AddCircle16Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddCircle20Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddCircle24Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddCircle16Icon size="24" />
   <AddCircle20Icon size="24" color="#4a90e2" />
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
   <AddCircle16Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddCircle16Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddCircle16Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addCircle16 } from '@stacksjs/iconify-fluent-color'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addCircle16, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addCircle16 } from '@stacksjs/iconify-fluent-color'

// Icons are typed as IconData
const myIcon: IconData = addCircle16
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-system-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fluent-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fluent-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
