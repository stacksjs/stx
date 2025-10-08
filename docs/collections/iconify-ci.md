# coolicons

> coolicons icons for stx from Iconify

## Overview

This package provides access to 715 icons from the coolicons collection through the stx iconify integration.

**Collection ID:** `ci`
**Total Icons:** 715
**Author:** Kryston Schwarze ([Website](https://github.com/krystonschwarze/coolicons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ci
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddColumnIcon, AddMinusSquareIcon, AddPlusIcon } from '@stacksjs/iconify-ci'

// Basic usage
const icon = AddColumnIcon()

// With size
const sizedIcon = AddColumnIcon({ size: 24 })

// With color
const coloredIcon = AddMinusSquareIcon({ color: 'red' })

// With multiple props
const customIcon = AddPlusIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddColumnIcon, AddMinusSquareIcon, AddPlusIcon } from '@stacksjs/iconify-ci'

  global.icons = {
    home: AddColumnIcon({ size: 24 }),
    user: AddMinusSquareIcon({ size: 24, color: '#4a90e2' }),
    settings: AddPlusIcon({ size: 32 })
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
import { addColumn, addMinusSquare, addPlus } from '@stacksjs/iconify-ci'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addColumn, { size: 24 })
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
const redIcon = AddColumnIcon({ color: 'red' })
const blueIcon = AddColumnIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddColumnIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddColumnIcon({ class: 'text-primary' })
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
const icon24 = AddColumnIcon({ size: 24 })
const icon1em = AddColumnIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddColumnIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddColumnIcon({ height: '1em' })
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
const smallIcon = AddColumnIcon({ class: 'icon-small' })
const largeIcon = AddColumnIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **715** icons:

- `addColumn`
- `addMinusSquare`
- `addPlus`
- `addPlusCircle`
- `addPlusSquare`
- `addRow`
- `addToQueue`
- `adobeXd`
- `airplay`
- `alarm`
- `alarmAdd`
- `appStore`
- `apple`
- `archive`
- `arrowCircleDown`
- `arrowCircleDownLeft`
- `arrowCircleDownRight`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowCircleUpLeft`
- `arrowCircleUpRight`
- `arrowDownLeftLg`
- `arrowDownLeftMd`
- `arrowDownLeftSm`
- `arrowDownLg`
- `arrowDownMd`
- `arrowDownRightLg`
- `arrowDownRightMd`
- `arrowDownRightSm`
- `arrowDownSm`
- `arrowDownUp`
- `arrowLeftLg`
- `arrowLeftMd`
- `arrowLeftRight`
- `arrowLeftSm`
- `arrowReload02`
- `arrowRightLg`
- `arrowRightMd`
- `arrowRightSm`
- `arrowSubDownLeft`
- `arrowSubDownRight`
- `arrowSubLeftDown`
- `arrowSubLeftUp`
- `arrowSubRightDown`
- `arrowSubRightUp`
- `arrowSubUpLeft`
- `arrowSubUpRight`
- `arrowUndoDownLeft`
- `arrowUndoDownRight`
- `arrowUndoUpLeft`
- `arrowUndoUpRight`
- `arrowUpLeftLg`
- `arrowUpLeftMd`
- `arrowUpLeftSm`
- `arrowUpLg`
- `arrowUpMd`
- `arrowUpRightLg`
- `arrowUpRightMd`
- `arrowUpRightSm`
- `arrowUpSm`
- `arrowsReload01`
- `barBottom`
- `barChart`
- `barChartAlt`
- `barChartCircle`
- `barChartHorizontal`
- `barChartSquare`
- `barLeft`
- `barRight`
- `barTop`
- `barcode`
- `behance`
- `bell`
- `bellAdd`
- `bellClose`
- `bellNotification`
- `bellOff`
- `bellRemove`
- `bellRing`
- `blackLivesMatter`
- `bold`
- `book`
- `bookOpen`
- `bookmark`
- `building`
- `building01`
- `building02`
- `building03`
- `building04`
- `bulb`
- `calendar`
- `calendarAdd`
- `calendarCalendar`
- `calendarCheck`
- `calendarClose`
- `calendarDays`
- `calendarEdit`
- `calendarEvent`
- `calendarMinus`
- `calendarPlus`
- `calendarRemove`
- `calendarWeek`
- `calendarX`
- `camera`
- `carAuto`
- `caretCircleDown`
- `caretCircleLeft`
- `caretCircleRight`
- `caretCircleUp`
- `caretDown`
- `caretDownMd`
- `caretDownSm`
- `caretLeft`
- `caretLeftSm`
- `caretRight`
- `caretRightSm`
- `caretUp`
- `caretUpMd`
- `caretUpSm`
- `cast`
- `chartBarHorizontal01`
- `chartBarVertical01`
- `chartLine`
- `chartPie`
- `chat`
- `chatAdd`
- `chatAlt`
- `chatCheck`
- `chatCircle`
- `chatCircleAdd`
- `chatCircleCheck`
- `chatCircleClose`
- `chatCircleDots`
- `chatCircleRemove`
- `chatClose`
- `chatConversation`
- `chatConversationCircle`
- `chatDots`
- `chatRemove`
- `check`
- `checkAll`
- `checkAllBig`
- `checkBig`
- `checkBold`
- `checkbox`
- `checkboxCheck`
- `checkboxChecked`
- `checkboxFill`
- `checkboxSquare`
- `checkboxUnchecked`
- `chevronBigDown`
- `chevronBigLeft`
- `chevronBigRight`
- `chevronBigUp`
- `chevronDown`
- `chevronDownDuo`
- `chevronDuoDown`
- `chevronDuoLeft`
- `chevronDuoRight`
- `chevronDuoUp`
- `chevronLeft`
- `chevronLeftDuo`
- `chevronLeftMd`
- `chevronRight`
- `chevronRightDuo`
- `chevronRightMd`
- `chevronUp`
- `chevronUpDuo`
- `chromecast`
- `circle`
- `circleCheck`
- `circleCheckOutline`
- `circleChevronDown`
- `circleChevronLeft`
- `circleChevronRight`
- `circleChevronUp`
- `circleDown`
- `circleHelp`
- `circleLeft`
- `circleRight`
- `circleUp`
- `circleWarning`
- `clock`
- `closeBig`
- `closeCircle`
- `closeLg`
- `closeMd`
- `closeSm`
- `closeSmall`
- `closeSquare`
- `cloud`
- `cloudAdd`
- `cloudCheck`
- `cloudClose`
- `cloudDown`
- `cloudDownload`
- `cloudOff`
- `cloudOutline`
- `cloudRemove`
- `cloudUp`
- `cloudUpload`
- `code`
- `coffeToGo`
- `coffee`
- `coffeeTogo`
- `color`
- `columns`
- `combineCells`
- `command`
- `compass`
- `confused`
- `cookie`
- `coolicons`
- `copy`
- `creditCard`
- `creditCard01`
- `creditCard02`
- `creditCardAlt`
- `crop`
- `css3`
- `cupcake`
- `cylinder`
- `dashboard`
- `dashboard02`
- `data`
- `deleteColumn`
- `deleteRow`
- `desktop`
- `desktopTower`
- `devices`
- `discord`
- `dot01Xs`
- `dot02S`
- `dot03M`
- `dot04L`
- `dot05Xl`
- `doubleQuotesL`
- `doubleQuotesR`
- `doughnutChart`
- `download`
- `downloadDone`
- `downloadPackage`
- `dragHorizontal`
- `dragVertical`
- `dribbble`
- `dropbox`
- `dummyCircle`
- `dummyCircleSmall`
- `dummySquare`
- `dummySquareSmall`
- `edit`
- `editPencil01`
- `editPencil02`
- `editPencilLine01`
- `editPencilLine02`
- `error`
- `errorOutline`
- `exit`
- `expand`
- `externalLink`
- `facebook`
- `fastForward`
- `fastRewind`
- `figma`
- `fileAdd`
- `fileArchive`
- `fileBlank`
- `fileBlankFill`
- `fileBlankOutline`
- `fileCheck`
- `fileClose`
- `fileCode`
- `fileCss`
- `fileDocument`
- `fileDownload`
- `fileEdit`
- `fileFind`
- `fileHtml`
- `fileImage`
- `fileJpg`
- `fileJs`
- `fileMinus`
- `fileNew`
- `filePdf`
- `filePng`
- `fileRemove`
- `fileSearch`
- `fileSvg`
- `fileUpload`
- `files`
- `filter`
- `filterOff`
- `filterOffOutline`
- `filterOutline`
- `firstAid`
- `firstPage`
- `flag`
- `flagFill`
- `flagOutline`
- `folder`
- `folderAdd`
- `folderCheck`
- `folderClose`
- `folderCode`
- `folderDocument`
- `folderDownload`
- `folderEdit`
- `folderMinus`
- `folderOpen`
- `folderPlus`
- `folderRemove`
- `folderSearch`
- `folderUpload`
- `folders`
- `font`
- `forward`
- `gift`
- `github`
- `globe`
- `google`
- `grid`
- `gridBig`
- `gridBigRound`
- `gridHorizontal`
- `gridHorizontalRound`
- `gridRound`
- `gridSmall`
- `gridSmallRound`
- `gridVertical`
- `gridVerticalRound`
- `group`
- `groupAlt`
- `hamburger`
- `hamburgerLg`
- `hamburgerMd`
- `handbag`
- `happy`
- `heading`
- `headingH1`
- `headingH2`
- `headingH3`
- `headingH4`
- `headingH5`
- `headingH6`
- `headphones`
- `heart01`
- `heart02`
- `heartFill`
- `heartOutline`
- `help`
- `helpCircle`
- `helpCircleOutline`
- `helpQuestionmark`
- `hide`
- `homeAltCheck`
- `homeAltFill`
- `homeAltMinus`
- `homeAltOutline`
- `homeAltPlus`
- `homeAltX`
- `homeCheck`
- `homeFill`
- `homeHeart`
- `homeHeart1`
- `homeMinus`
- `homeOutline`
- `homePlus`
- `homeX`
- `house01`
- `house02`
- `house03`
- `houseAdd`
- `houseCheck`
- `houseClose`
- `houseRemove`
- `html5`
- `idCard`
- `image`
- `image01`
- `image02`
- `imageAlt`
- `info`
- `infoCircle`
- `infoCircleOutline`
- `infoSquare`
- `infoSquareOutline`
- `instagram`
- `instance`
- `invision`
- `italic`
- `javascript`
- `keyboard`
- `label`
- `laptop`
- `lastPage`
- `layer`
- `layers`
- `layersAlt`
- `leaf`
- `lineBreak`
- `lineChartDown`
- `lineChartUp`
- `lineL`
- `lineM`
- `lineS`
- `lineSx`
- `lineXl`
- `link`
- `link02`
- `linkBreak`
- `linkHorizontal`
- `linkHorizontalOff`
- `linkVertical`
- `linkedin`
- `linkpath`
- `listAdd`
- `listCheck`
- `listChecklist`
- `listChecklistAlt`
- `listMinus`
- `listOl`
- `listOrdered`
- `listPlus`
- `listRemove`
- `listUl`
- `listUnordered`
- `loading`
- `location`
- `locationOutline`
- `lock`
- `lockOpen`
- `logOut`
- `longBottomDown`
- `longBottomUp`
- `longDown`
- `longLeft`
- `longRight`
- `longUp`
- `longUpLeft`
- `magnifyingGlassMinus`
- `magnifyingGlassPlus`
- `mail`
- `mailOpen`
- `mainComponent`
- `map`
- `mapPin`
- `mention`
- `menuAlt01`
- `menuAlt02`
- `menuAlt03`
- `menuAlt04`
- `menuAlt05`
- `menuDuo`
- `menuDuoLg`
- `menuDuoMd`
- `message`
- `messageCheck`
- `messageCircle`
- `messageClose`
- `messageMinus`
- `messagePlus`
- `messagePlusAlt`
- `messageRound`
- `messageWriting`
- `messenger`
- `minus`
- `minusCircle`
- `minusCircleOutline`
- `minusSquare`
- `mobile`
- `mobileAlt`
- `mobileButton`
- `monitor`
- `monitorPlay`
- `moon`
- `moreGridBig`
- `moreGridSmall`
- `moreHorizontal`
- `moreVertical`
- `mouse`
- `move`
- `moveHorizontal`
- `moveVertical`
- `movingDesk`
- `navigation`
- `note`
- `noteEdit`
- `noteSearch`
- `notebook`
- `notification`
- `notificationActive`
- `notificationDeactivated`
- `notificationDot`
- `notificationMinus`
- `notificationOutline`
- `notificationOutlineDot`
- `notificationOutlineMinus`
- `notificationOutlinePlus`
- `notificationPlus`
- `octagon`
- `octagonCheck`
- `octagonHelp`
- `octagonWarning`
- `offClose`
- `offOutlineClose`
- `option`
- `paperPlane`
- `paperclipAttechmentHorizontal`
- `paperclipAttechmentTilt`
- `paragraph`
- `path`
- `pause`
- `pauseCircle`
- `pauseCircleFilled`
- `pauseCircleOutline`
- `paypal`
- `phone`
- `phoneOutline`
- `pieChart25`
- `pieChart50`
- `pieChart75`
- `pieChartOutline`
- `pieChartOutline25`
- `planet`
- `play`
- `playArrow`
- `playCircle`
- `playCircleFilled`
- `playCircleOutline`
- `playStore`
- `plus`
- `plusCircle`
- `plusCircleOutline`
- `plusSquare`
- `printer`
- `puzzle`
- `qrCode`
- `qrCode1`
- `radio`
- `radioFill`
- `radioFilled`
- `radioUnchecked`
- `rainbow`
- `reddit`
- `redo`
- `refresh`
- `refresh02`
- `removeMinus`
- `removeMinusCircle`
- `repeat`
- `rewind`
- `rows`
- `ruler`
- `sad`
- `save`
- `search`
- `searchMagnifyingGlass`
- `searchSmall`
- `searchSmallMinus`
- `searchSmallPlus`
- `selectMultiple`
- `settings`
- `settingsFilled`
- `settingsFuture`
- `share`
- `shareAndroid`
- `shareIosExport`
- `shareOutline`
- `shield`
- `shieldCheck`
- `shieldWarning`
- `shoppingBag01`
- `shoppingBag02`
- `shoppingCart01`
- `shoppingCart02`
- `shortDown`
- `shortLeft`
- `shortRight`
- `shortUp`
- `show`
- `shrink`
- `shuffle`
- `singleQuotesL`
- `singleQuotesR`
- `sketch`
- `skipBack`
- `skipForward`
- `skipNext`
- `skipPrevious`
- `slack`
- `slider01`
- `slider02`
- `slider03`
- `smallLongDown`
- `smallLongLeft`
- `smallLongRight`
- `smallLongUp`
- `snapchat`
- `sortAscending`
- `sortDescending`
- `spectrum`
- `spotify`
- `square`
- `squareCheck`
- `squareHelp`
- `squareWarning`
- `stackOverflow`
- `star`
- `stop`
- `stopCircle`
- `stopSign`
- `stopwatch`
- `strikethrough`
- `subLeft`
- `subRight`
- `suitcase`
- `sun`
- `swatchesPalette`
- `swichtLeft`
- `swichtRight`
- `table`
- `tableAdd`
- `tableDelete`
- `tableRemove`
- `tablet`
- `tabletButton`
- `tag`
- `tagOutline`
- `tennis`
- `tennisMatch`
- `tennisMatchAlt`
- `terminal`
- `text`
- `textAlignCenter`
- `textAlignJustify`
- `textAlignLeft`
- `textAlignRight`
- `thinBigDown`
- `thinBigLeft`
- `thinBigRight`
- `thinBigUp`
- `thinLong02Down`
- `thinLong02Left`
- `thinLong02Right`
- `thinLong02Up`
- `thinLongDown`
- `thinLongLeft`
- `thinLongRight`
- `thinLongUp`
- `ticketVoucher`
- `timer`
- `timerAdd`
- `timerClose`
- `timerRemove`
- `transfer`
- `trashEmpty`
- `trashFull`
- `trello`
- `trendingDown`
- `trendingUp`
- `triangle`
- `triangleCheck`
- `triangleWarning`
- `twitter`
- `underline`
- `undo`
- `unfoldLess`
- `unfoldMore`
- `unlink`
- `unsplash`
- `user`
- `user01`
- `user02`
- `user03`
- `userAdd`
- `userCardId`
- `userCheck`
- `userCircle`
- `userClose`
- `userHeart`
- `userMinus`
- `userPin`
- `userPlus`
- `userRemove`
- `userSquare`
- `userVoice`
- `users`
- `usersGroup`
- `volumeMax`
- `volumeMin`
- `volumeMinus`
- `volumeOff`
- `volumeOff02`
- `volumePlus`
- `warning`
- `warningOutline`
- `waterDrop`
- `wavy`
- `wavyCheck`
- `wavyHelp`
- `wavyWarning`
- `wifiHigh`
- `wifiLow`
- `wifiMedium`
- `wifiNone`
- `wifiOff`
- `wifiProblem`
- `window`
- `windowCheck`
- `windowClose`
- `windowCodeBlock`
- `windowSidebar`
- `windowTerminal`
- `youtube`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddColumnIcon, AddMinusSquareIcon, AddPlusIcon, AddPlusCircleIcon } from '@stacksjs/iconify-ci'

  global.navIcons = {
    home: AddColumnIcon({ size: 20, class: 'nav-icon' }),
    about: AddMinusSquareIcon({ size: 20, class: 'nav-icon' }),
    contact: AddPlusIcon({ size: 20, class: 'nav-icon' }),
    settings: AddPlusCircleIcon({ size: 20, class: 'nav-icon' })
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
import { AddColumnIcon } from '@stacksjs/iconify-ci'

const icon = AddColumnIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddColumnIcon, AddMinusSquareIcon, AddPlusIcon } from '@stacksjs/iconify-ci'

const successIcon = AddColumnIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddMinusSquareIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddPlusIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddColumnIcon, AddMinusSquareIcon } from '@stacksjs/iconify-ci'
   const icon = AddColumnIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addColumn, addMinusSquare } from '@stacksjs/iconify-ci'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addColumn, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddColumnIcon, AddMinusSquareIcon } from '@stacksjs/iconify-ci'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-ci'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddColumnIcon } from '@stacksjs/iconify-ci'
     global.icon = AddColumnIcon({ size: 24 })
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
   const icon = AddColumnIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addColumn } from '@stacksjs/iconify-ci'

// Icons are typed as IconData
const myIcon: IconData = addColumn
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Kryston Schwarze ([Website](https://github.com/krystonschwarze/coolicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ci/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ci/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
