# Pixelarticons

> Pixelarticons icons for stx from Iconify

## Overview

This package provides access to 486 icons from the Pixelarticons collection through the stx iconify integration.

**Collection ID:** `pixelarticons`
**Total Icons:** 486
**Author:** Gerrit Halfmann ([Website](https://github.com/halfmage/pixelarticons))
**License:** MIT ([Details](https://github.com/halfmage/pixelarticons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pixelarticons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 4gIcon, 4kIcon, 4kBoxIcon } from '@stacksjs/iconify-pixelarticons'

// Basic usage
const icon = 4gIcon()

// With size
const sizedIcon = 4gIcon({ size: 24 })

// With color
const coloredIcon = 4kIcon({ color: 'red' })

// With multiple props
const customIcon = 4kBoxIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 4gIcon, 4kIcon, 4kBoxIcon } from '@stacksjs/iconify-pixelarticons'

  global.icons = {
    home: 4gIcon({ size: 24 }),
    user: 4kIcon({ size: 24, color: '#4a90e2' }),
    settings: 4kBoxIcon({ size: 32 })
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
import { 4g, 4k, 4kBox } from '@stacksjs/iconify-pixelarticons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(4g, { size: 24 })
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
const redIcon = 4gIcon({ color: 'red' })
const blueIcon = 4gIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 4gIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 4gIcon({ class: 'text-primary' })
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
const icon24 = 4gIcon({ size: 24 })
const icon1em = 4gIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 4gIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 4gIcon({ height: '1em' })
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
const smallIcon = 4gIcon({ class: 'icon-small' })
const largeIcon = 4gIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **486** icons:

- `4g`
- `4k`
- `4kBox`
- `5g`
- `abTesting`
- `ac`
- `addBox`
- `addBoxMultiple`
- `addCol`
- `addGrid`
- `addRow`
- `alert`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `analytics`
- `anchor`
- `android`
- `animation`
- `archive`
- `arrowBarDown`
- `arrowBarLeft`
- `arrowBarRight`
- `arrowBarUp`
- `arrowDown`
- `arrowDownBox`
- `arrowLeft`
- `arrowLeftBox`
- `arrowRight`
- `arrowRightBox`
- `arrowUp`
- `arrowUpBox`
- `arrowsHorizontal`
- `arrowsVertical`
- `artText`
- `article`
- `articleMultiple`
- `aspectRatio`
- `at`
- `attachment`
- `audioDevice`
- `avatar`
- `backburger`
- `battery`
- `battery1`
- `battery2`
- `batteryCharging`
- `batteryFull`
- `bed`
- `bitcoin`
- `bluetooth`
- `book`
- `bookOpen`
- `bookmark`
- `bookmarks`
- `briefcase`
- `briefcaseAccount`
- `briefcaseCheck`
- `briefcaseDelete`
- `briefcaseDownload`
- `briefcaseMinus`
- `briefcasePlus`
- `briefcaseSearch`
- `briefcaseSearch1`
- `briefcaseUpload`
- `bug`
- `building`
- `buildingCommunity`
- `buildingSkyscraper`
- `buildings`
- `bulletlist`
- `bullseye`
- `bullseyeArrow`
- `bus`
- `cake`
- `calculator`
- `calendar`
- `calendarAlert`
- `calendarArrowLeft`
- `calendarArrowRight`
- `calendarCheck`
- `calendarExport`
- `calendarGrid`
- `calendarImport`
- `calendarMinus`
- `calendarMonth`
- `calendarMultiple`
- `calendarMultipleCheck`
- `calendarPlus`
- `calendarRange`
- `calendarRemove`
- `calendarSearch`
- `calendarSortAscending`
- `calendarSortDescending`
- `calendarText`
- `calendarToday`
- `calendarTomorrow`
- `calendarWeek`
- `calendarWeekBegin`
- `calendarWeekend`
- `camera`
- `cameraAdd`
- `cameraAlt`
- `cameraFace`
- `car`
- `card`
- `cardId`
- `cardPlus`
- `cardStack`
- `cardText`
- `cart`
- `cast`
- `cellularSignal0`
- `cellularSignal1`
- `cellularSignal2`
- `cellularSignal3`
- `cellularSignalOff`
- `chart`
- `chartAdd`
- `chartBar`
- `chartDelete`
- `chartMinus`
- `chartMultiple`
- `chat`
- `check`
- `checkDouble`
- `checkbox`
- `checkboxOn`
- `checklist`
- `chess`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chevronsHorizontal`
- `chevronsVertical`
- `circle`
- `clipboard`
- `clock`
- `close`
- `closeBox`
- `cloud`
- `cloudDone`
- `cloudDownload`
- `cloudMoon`
- `cloudSun`
- `cloudUpload`
- `cocktail`
- `code`
- `coffee`
- `coffeeAlt`
- `coin`
- `collapse`
- `colorsSwatch`
- `command`
- `comment`
- `contact`
- `contactDelete`
- `contactMultiple`
- `contactPlus`
- `copy`
- `cornerDownLeft`
- `cornerDownRight`
- `cornerLeftDown`
- `cornerLeftUp`
- `cornerRightDown`
- `cornerRightUp`
- `cornerUpLeft`
- `cornerUpRight`
- `creditCard`
- `creditCardDelete`
- `creditCardMinus`
- `creditCardMultiple`
- `creditCardPlus`
- `creditCardSettings`
- `creditCardWireless`
- `crop`
- `cut`
- `dashboard`
- `debug`
- `debugCheck`
- `debugOff`
- `debugPause`
- `debugPlay`
- `debugStop`
- `delete`
- `deskphone`
- `deviceLaptop`
- `devicePhone`
- `deviceTablet`
- `deviceTv`
- `deviceTvSmart`
- `deviceVibrate`
- `deviceWatch`
- `devices`
- `dice`
- `dollar`
- `downasaur`
- `download`
- `draft`
- `dragAndDrop`
- `drop`
- `dropArea`
- `dropFull`
- `dropHalf`
- `duplicate`
- `duplicateAlt`
- `edit`
- `editBox`
- `euro`
- `expand`
- `externalLink`
- `eye`
- `eyeClosed`
- `file`
- `fileAlt`
- `fileDelete`
- `fileFlash`
- `fileMinus`
- `fileMultiple`
- `fileOff`
- `filePlus`
- `fill`
- `fillHalf`
- `flag`
- `flatten`
- `flipToBack`
- `flipToFront`
- `floatCenter`
- `floatLeft`
- `floatRight`
- `folder`
- `folderMinus`
- `folderPlus`
- `folderX`
- `forward`
- `forwardburger`
- `frame`
- `frameAdd`
- `frameCheck`
- `frameDelete`
- `frameMinus`
- `gamepad`
- `gif`
- `gift`
- `gitBranch`
- `gitCommit`
- `gitMerge`
- `gitPullRequest`
- `github`
- `github2`
- `gps`
- `grid`
- `group`
- `hd`
- `headphone`
- `headset`
- `heart`
- `hidden`
- `home`
- `hourglass`
- `hq`
- `human`
- `humanHandsdown`
- `humanHandsup`
- `humanHeight`
- `humanHeightAlt`
- `humanRun`
- `image`
- `imageArrowRight`
- `imageBroken`
- `imageDelete`
- `imageFlash`
- `imageFrame`
- `imageGallery`
- `imageMultiple`
- `imageNew`
- `imagePlus`
- `inbox`
- `inboxAll`
- `inboxFull`
- `infoBox`
- `invert`
- `iso`
- `kanban`
- `keyboard`
- `label`
- `labelAlt`
- `labelAltMultiple`
- `labelSharp`
- `layout`
- `layoutAlignBottom`
- `layoutAlignLeft`
- `layoutAlignRight`
- `layoutAlignTop`
- `layoutColumns`
- `layoutDistributeHorizontal`
- `layoutDistributeVertical`
- `layoutFooter`
- `layoutHeader`
- `layoutRows`
- `layoutSidebarLeft`
- `layoutSidebarRight`
- `lightbulb`
- `lightbulb2`
- `lightbulbOn`
- `link`
- `list`
- `listBox`
- `loader`
- `lock`
- `lockOpen`
- `login`
- `logout`
- `luggage`
- `mail`
- `mailArrowRight`
- `mailCheck`
- `mailDelete`
- `mailFlash`
- `mailMultiple`
- `mailOff`
- `mailUnread`
- `map`
- `mastodon`
- `membercard`
- `menu`
- `message`
- `messageArrowLeft`
- `messageArrowRight`
- `messageBookmark`
- `messageClock`
- `messageDelete`
- `messageFlash`
- `messageImage`
- `messageMinus`
- `messagePlus`
- `messageProcessing`
- `messageReply`
- `messageText`
- `minus`
- `missedCall`
- `modem`
- `money`
- `monitor`
- `moodHappy`
- `moodNeutral`
- `moodSad`
- `moon`
- `moonStar`
- `moonStars`
- `moreHorizontal`
- `moreVertical`
- `mouse`
- `move`
- `movie`
- `music`
- `next`
- `note`
- `noteDelete`
- `noteMultiple`
- `notePlus`
- `notes`
- `notesDelete`
- `notesMultiple`
- `notesPlus`
- `notification`
- `notificationOff`
- `open`
- `paintBucket`
- `paperclip`
- `pause`
- `percent`
- `pictureInPicture`
- `pictureInPictureAlt`
- `pin`
- `pixelarticons`
- `play`
- `playlist`
- `plus`
- `power`
- `prev`
- `print`
- `radioHandheld`
- `radioOn`
- `radioSignal`
- `radioTower`
- `reciept`
- `recieptAlt`
- `redo`
- `reload`
- `removeBox`
- `removeBoxMultiple`
- `repeat`
- `reply`
- `replyAll`
- `roundedCorner`
- `save`
- `scale`
- `script`
- `scriptText`
- `scrollHorizontal`
- `scrollVertical`
- `sd`
- `search`
- `section`
- `sectionCopy`
- `sectionMinus`
- `sectionPlus`
- `sectionX`
- `server`
- `sharpCorner`
- `shield`
- `shieldOff`
- `ship`
- `shoppingBag`
- `shuffle`
- `sliders`
- `sliders2`
- `sort`
- `sortAlphabetic`
- `sortNumeric`
- `speaker`
- `speedFast`
- `speedMedium`
- `speedSlow`
- `spotlight`
- `store`
- `subscriptions`
- `subtitles`
- `suitcase`
- `sun`
- `sunAlt`
- `switch`
- `sync`
- `tab`
- `table`
- `tea`
- `teach`
- `textAdd`
- `textColums`
- `textSearch`
- `textWrap`
- `timeline`
- `toggleLeft`
- `toggleRight`
- `tournament`
- `trackChanges`
- `trash`
- `trashAlt`
- `trending`
- `trendingDown`
- `trendingUp`
- `trophy`
- `truck`
- `undo`
- `ungroup`
- `unlink`
- `upload`
- `user`
- `userMinus`
- `userPlus`
- `userX`
- `users`
- `video`
- `videoOff`
- `viewCol`
- `viewList`
- `viewportNarrow`
- `viewportWide`
- `visible`
- `volume`
- `volume1`
- `volume2`
- `volume3`
- `volumeMinus`
- `volumePlus`
- `volumeVibrate`
- `volumeX`
- `wallet`
- `warningBox`
- `wind`
- `zap`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { 4gIcon, 4kIcon, 4kBoxIcon, 5gIcon } from '@stacksjs/iconify-pixelarticons'

  global.navIcons = {
    home: 4gIcon({ size: 20, class: 'nav-icon' }),
    about: 4kIcon({ size: 20, class: 'nav-icon' }),
    contact: 4kBoxIcon({ size: 20, class: 'nav-icon' }),
    settings: 5gIcon({ size: 20, class: 'nav-icon' })
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
import { 4gIcon } from '@stacksjs/iconify-pixelarticons'

const icon = 4gIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 4gIcon, 4kIcon, 4kBoxIcon } from '@stacksjs/iconify-pixelarticons'

const successIcon = 4gIcon({ size: 16, color: '#22c55e' })
const warningIcon = 4kIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 4kBoxIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 4gIcon, 4kIcon } from '@stacksjs/iconify-pixelarticons'
   const icon = 4gIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 4g, 4k } from '@stacksjs/iconify-pixelarticons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(4g, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 4gIcon, 4kIcon } from '@stacksjs/iconify-pixelarticons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-pixelarticons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 4gIcon } from '@stacksjs/iconify-pixelarticons'
     global.icon = 4gIcon({ size: 24 })
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
   const icon = 4gIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 4g } from '@stacksjs/iconify-pixelarticons'

// Icons are typed as IconData
const myIcon: IconData = 4g
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/halfmage/pixelarticons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Gerrit Halfmann ([Website](https://github.com/halfmage/pixelarticons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pixelarticons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pixelarticons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
