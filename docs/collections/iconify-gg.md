# css.gg

> css.gg icons for stx from Iconify

## Overview

This package provides access to 704 icons from the css.gg collection through the stx iconify integration.

**Collection ID:** `gg`
**Total Icons:** 704
**Author:** Astrit ([Website](https://github.com/astrit/css.gg))
**License:** MIT ([Details](https://github.com/astrit/css.gg/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gg
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbstractIcon, AddIcon, AddRIcon } from '@stacksjs/iconify-gg'

// Basic usage
const icon = AbstractIcon()

// With size
const sizedIcon = AbstractIcon({ size: 24 })

// With color
const coloredIcon = AddIcon({ color: 'red' })

// With multiple props
const customIcon = AddRIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbstractIcon, AddIcon, AddRIcon } from '@stacksjs/iconify-gg'

  global.icons = {
    home: AbstractIcon({ size: 24 }),
    user: AddIcon({ size: 24, color: '#4a90e2' }),
    settings: AddRIcon({ size: 32 })
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
import { abstract, add, addR } from '@stacksjs/iconify-gg'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abstract, { size: 24 })
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
const redIcon = AbstractIcon({ color: 'red' })
const blueIcon = AbstractIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbstractIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbstractIcon({ class: 'text-primary' })
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
const icon24 = AbstractIcon({ size: 24 })
const icon1em = AbstractIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbstractIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbstractIcon({ height: '1em' })
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
const smallIcon = AbstractIcon({ class: 'icon-small' })
const largeIcon = AbstractIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **704** icons:

- `abstract`
- `add`
- `addR`
- `adidas`
- `airplane`
- `alarm`
- `album`
- `alignBottom`
- `alignCenter`
- `alignLeft`
- `alignMiddle`
- `alignRight`
- `alignTop`
- `anchor`
- `appleWatch`
- `arrangeBack`
- `arrangeFront`
- `arrowAlignH`
- `arrowAlignV`
- `arrowBottomLeft`
- `arrowBottomLeftO`
- `arrowBottomLeftR`
- `arrowBottomRight`
- `arrowBottomRightO`
- `arrowBottomRightR`
- `arrowDown`
- `arrowDownO`
- `arrowDownR`
- `arrowLeft`
- `arrowLeftO`
- `arrowLeftR`
- `arrowLongDown`
- `arrowLongDownC`
- `arrowLongDownE`
- `arrowLongDownL`
- `arrowLongDownR`
- `arrowLongLeft`
- `arrowLongLeftC`
- `arrowLongLeftE`
- `arrowLongLeftL`
- `arrowLongLeftR`
- `arrowLongRight`
- `arrowLongRightC`
- `arrowLongRightE`
- `arrowLongRightL`
- `arrowLongRightR`
- `arrowLongUp`
- `arrowLongUpC`
- `arrowLongUpE`
- `arrowLongUpL`
- `arrowLongUpR`
- `arrowRight`
- `arrowRightO`
- `arrowRightR`
- `arrowTopLeft`
- `arrowTopLeftO`
- `arrowTopLeftR`
- `arrowTopRight`
- `arrowTopRightO`
- `arrowTopRightR`
- `arrowUp`
- `arrowUpO`
- `arrowUpR`
- `arrowsBreakeH`
- `arrowsBreakeV`
- `arrowsExchange`
- `arrowsExchangeAlt`
- `arrowsExchangeAltV`
- `arrowsExchangeV`
- `arrowsExpandDownLeft`
- `arrowsExpandDownRight`
- `arrowsExpandLeft`
- `arrowsExpandLeftAlt`
- `arrowsExpandRight`
- `arrowsExpandRightAlt`
- `arrowsExpandUpLeft`
- `arrowsExpandUpRight`
- `arrowsH`
- `arrowsHAlt`
- `arrowsMergeAltH`
- `arrowsMergeAltV`
- `arrowsScrollH`
- `arrowsScrollV`
- `arrowsShrinkH`
- `arrowsShrinkV`
- `arrowsV`
- `arrowsVAlt`
- `assign`
- `asterisk`
- `atlasian`
- `attachment`
- `attribution`
- `awards`
- `backspace`
- `bandAid`
- `battery`
- `batteryEmpty`
- `batteryFull`
- `bee`
- `bell`
- `bitbucket`
- `block`
- `bmw`
- `board`
- `bolt`
- `bookmark`
- `borderAll`
- `borderBottom`
- `borderLeft`
- `borderRight`
- `borderStyleDashed`
- `borderStyleDotted`
- `borderStyleSolid`
- `borderTop`
- `bot`
- `bowl`
- `box`
- `boy`
- `brackets`
- `briefcase`
- `browse`
- `browser`
- `brush`
- `bulb`
- `cPlusPlus`
- `calculator`
- `calendar`
- `calendarDates`
- `calendarDue`
- `calendarNext`
- `calendarToday`
- `calendarTwo`
- `calibrate`
- `camera`
- `cap`
- `captions`
- `cardClubs`
- `cardDiamonds`
- `cardHearts`
- `cardSpades`
- `carousel`
- `cast`
- `chanel`
- `chart`
- `check`
- `checkO`
- `checkR`
- `chevronDoubleDown`
- `chevronDoubleDownO`
- `chevronDoubleDownR`
- `chevronDoubleLeft`
- `chevronDoubleLeftO`
- `chevronDoubleLeftR`
- `chevronDoubleRight`
- `chevronDoubleRightO`
- `chevronDoubleRightR`
- `chevronDoubleUp`
- `chevronDoubleUpO`
- `chevronDoubleUpR`
- `chevronDown`
- `chevronDownO`
- `chevronDownR`
- `chevronLeft`
- `chevronLeftO`
- `chevronLeftR`
- `chevronRight`
- `chevronRightO`
- `chevronRightR`
- `chevronUp`
- `chevronUpO`
- `chevronUpR`
- `circleci`
- `clapperBoard`
- `clipboard`
- `close`
- `closeO`
- `closeR`
- `cloud`
- `code`
- `codeClimate`
- `codeSlash`
- `coffee`
- `collage`
- `colorBucket`
- `colorPicker`
- `comedyCentral`
- `comment`
- `community`
- `components`
- `compress`
- `compressLeft`
- `compressRight`
- `compressV`
- `controller`
- `copy`
- `copyright`
- `cornerDoubleDownLeft`
- `cornerDoubleDownRight`
- `cornerDoubleLeftDown`
- `cornerDoubleLeftUp`
- `cornerDoubleRightDown`
- `cornerDoubleRightUp`
- `cornerDoubleUpLeft`
- `cornerDoubleUpRight`
- `cornerDownLeft`
- `cornerDownRight`
- `cornerLeftDown`
- `cornerLeftUp`
- `cornerRightDown`
- `cornerRightUp`
- `cornerUpLeft`
- `cornerUpRight`
- `creditCard`
- `crop`
- `cross`
- `crowdfire`
- `crown`
- `danger`
- `darkMode`
- `data`
- `database`
- `debug`
- `designmodo`
- `desktop`
- `detailsLess`
- `detailsMore`
- `dialpad`
- `dice1`
- `dice2`
- `dice3`
- `dice4`
- `dice5`
- `dice6`
- `digitalocean`
- `disc`
- `displayFlex`
- `displayFullwidth`
- `displayGrid`
- `displaySpacing`
- `distributeHorizontal`
- `distributeVertical`
- `dockBottom`
- `dockLeft`
- `dockRight`
- `dockWindow`
- `dolby`
- `dollar`
- `dribbble`
- `drive`
- `drop`
- `dropInvert`
- `dropOpacity`
- `duplicate`
- `editBlackPoint`
- `editContrast`
- `editExposure`
- `editFade`
- `editFlipH`
- `editFlipV`
- `editHighlight`
- `editMarkup`
- `editMask`
- `editNoise`
- `editShadows`
- `editStraight`
- `editUnmask`
- `eject`
- `enter`
- `erase`
- `ereader`
- `ericsson`
- `ethernet`
- `euro`
- `eventbrite`
- `expand`
- `export`
- `extension`
- `extensionAdd`
- `extensionAlt`
- `extensionRemove`
- `external`
- `eye`
- `eyeAlt`
- `facebook`
- `feed`
- `figma`
- `file`
- `fileAdd`
- `fileDocument`
- `fileRemove`
- `film`
- `filters`
- `flag`
- `flagAlt`
- `folder`
- `folderAdd`
- `folderRemove`
- `fontHeight`
- `fontSpacing`
- `formatBold`
- `formatCenter`
- `formatColor`
- `formatHeading`
- `formatIndentDecrease`
- `formatIndentIncrease`
- `formatItalic`
- `formatJustify`
- `formatLeft`
- `formatLineHeight`
- `formatRight`
- `formatSeparator`
- `formatSlash`
- `formatStrike`
- `formatText`
- `formatUnderline`
- `formatUppercase`
- `framer`
- `games`
- `genderFemale`
- `genderMale`
- `ghost`
- `ghostCharacter`
- `gift`
- `girl`
- `gitBranch`
- `gitCommit`
- `gitFork`
- `gitPull`
- `gitter`
- `glass`
- `glassAlt`
- `globe`
- `globeAlt`
- `google`
- `googleTasks`
- `gym`
- `hashtag`
- `headset`
- `heart`
- `hello`
- `home`
- `homeAlt`
- `homeScreen`
- `icecream`
- `ifDesign`
- `image`
- `import`
- `inbox`
- `indieHackers`
- `infinity`
- `info`
- `inpicture`
- `insertAfter`
- `insertAfterO`
- `insertAfterR`
- `insertBefore`
- `insertBeforeO`
- `insertBeforeR`
- `insights`
- `instagram`
- `internal`
- `key`
- `keyboard`
- `keyhole`
- `laptop`
- `lastpass`
- `layoutGrid`
- `layoutGridSmall`
- `layoutList`
- `layoutPin`
- `linear`
- `link`
- `list`
- `listTree`
- `livePhoto`
- `loadbar`
- `loadbarAlt`
- `loadbarDoc`
- `loadbarSound`
- `lock`
- `lockUnlock`
- `logIn`
- `logOff`
- `logOut`
- `loupe`
- `magnet`
- `mail`
- `mailForward`
- `mailOpen`
- `mailReply`
- `mathDivide`
- `mathEqual`
- `mathMinus`
- `mathPercent`
- `mathPlus`
- `maximize`
- `maximizeAlt`
- `maze`
- `mediaLive`
- `mediaPodcast`
- `menu`
- `menuBoxed`
- `menuCake`
- `menuCheese`
- `menuGridO`
- `menuGridR`
- `menuHotdog`
- `menuLeft`
- `menuLeftAlt`
- `menuMotion`
- `menuOreos`
- `menuRight`
- `menuRightAlt`
- `menuRound`
- `mergeHorizontal`
- `mergeVertical`
- `mic`
- `microbit`
- `microsoft`
- `miniPlayer`
- `minimize`
- `minimizeAlt`
- `modem`
- `monday`
- `moon`
- `more`
- `moreAlt`
- `moreO`
- `moreR`
- `moreVertical`
- `moreVerticalAlt`
- `moreVerticalO`
- `moreVerticalR`
- `mouse`
- `moveDown`
- `moveLeft`
- `moveRight`
- `moveTask`
- `moveUp`
- `music`
- `musicNote`
- `musicSpeaker`
- `nametag`
- `notes`
- `notifications`
- `npm`
- `oculus`
- `openCollective`
- `options`
- `organisation`
- `overflow`
- `pacman`
- `password`
- `pathBack`
- `pathCrop`
- `pathDivide`
- `pathExclude`
- `pathFront`
- `pathIntersect`
- `pathOutline`
- `pathTrim`
- `pathUnite`
- `patreon`
- `paypal`
- `pen`
- `pentagonBottomLeft`
- `pentagonBottomRight`
- `pentagonDown`
- `pentagonLeft`
- `pentagonRight`
- `pentagonTopLeft`
- `pentagonTopRight`
- `pentagonUp`
- `performance`
- `pexels`
- `phone`
- `photoscan`
- `piano`
- `pill`
- `pin`
- `pinAlt`
- `pinBottom`
- `pinTop`
- `playBackwards`
- `playButton`
- `playButtonO`
- `playButtonR`
- `playForwards`
- `playList`
- `playListAdd`
- `playListCheck`
- `playListRemove`
- `playListSearch`
- `playPause`
- `playPauseO`
- `playPauseR`
- `playStop`
- `playStopO`
- `playStopR`
- `playTrackNext`
- `playTrackNextO`
- `playTrackNextR`
- `playTrackPrev`
- `playTrackPrevO`
- `playTrackPrevR`
- `plug`
- `pocket`
- `pokemon`
- `polaroid`
- `poll`
- `presentation`
- `printer`
- `productHunt`
- `profile`
- `pullClear`
- `pushChevronDown`
- `pushChevronDownO`
- `pushChevronDownR`
- `pushChevronLeft`
- `pushChevronLeftO`
- `pushChevronLeftR`
- `pushChevronRight`
- `pushChevronRightO`
- `pushChevronRightR`
- `pushChevronUp`
- `pushChevronUpO`
- `pushChevronUpR`
- `pushDown`
- `pushLeft`
- `pushRight`
- `pushUp`
- `qr`
- `quote`
- `quoteO`
- `radioCheck`
- `radioChecked`
- `ratio`
- `read`
- `readme`
- `record`
- `redo`
- `remote`
- `remove`
- `removeR`
- `rename`
- `reorder`
- `repeat`
- `ring`
- `rowFirst`
- `rowLast`
- `ruler`
- `sandClock`
- `scan`
- `screen`
- `screenMirror`
- `screenShot`
- `screenWide`
- `scrollH`
- `scrollV`
- `search`
- `searchFound`
- `searchLoading`
- `select`
- `selectO`
- `selectR`
- `server`
- `serverless`
- `shapeCircle`
- `shapeHalfCircle`
- `shapeHexagon`
- `shapeRhombus`
- `shapeSquare`
- `shapeTriangle`
- `shapeZigzag`
- `share`
- `shield`
- `shoppingBag`
- `shoppingCart`
- `shortcut`
- `shutterstock`
- `sidebar`
- `sidebarOpen`
- `sidebarRight`
- `signal`
- `size`
- `sketch`
- `slack`
- `sleep`
- `smartHomeBoiler`
- `smartHomeCooker`
- `smartHomeHeat`
- `smartHomeLight`
- `smartHomeRefrigerator`
- `smartHomeWashMachine`
- `smartphone`
- `smartphoneChip`
- `smartphoneRam`
- `smartphoneShake`
- `smile`
- `smileMouthOpen`
- `smileNeutral`
- `smileNoMouth`
- `smileNone`
- `smileSad`
- `smileUpside`
- `softwareDownload`
- `softwareUpload`
- `sortAz`
- `sortZa`
- `spaceBetween`
- `spaceBetweenV`
- `spectrum`
- `spinner`
- `spinnerAlt`
- `spinnerTwo`
- `spinnerTwoAlt`
- `square`
- `stack`
- `stark`
- `stopwatch`
- `stories`
- `studio`
- `style`
- `sun`
- `support`
- `swap`
- `swapVertical`
- `sweden`
- `swiss`
- `sync`
- `tab`
- `tag`
- `tally`
- `tapDouble`
- `tapSingle`
- `template`
- `tennis`
- `terminal`
- `terrain`
- `thermometer`
- `thermostat`
- `tikcode`
- `time`
- `timelapse`
- `timer`
- `today`
- `toggleOff`
- `toggleOn`
- `toggleSquare`
- `toggleSquareOff`
- `toolbarBottom`
- `toolbarLeft`
- `toolbarRight`
- `toolbarTop`
- `toolbox`
- `touchpad`
- `track`
- `transcript`
- `trash`
- `trashEmpty`
- `tree`
- `trees`
- `trello`
- `trending`
- `trendingDown`
- `trophy`
- `tv`
- `twilio`
- `twitter`
- `uiKit`
- `umbrella`
- `unavailable`
- `unblock`
- `undo`
- `unfold`
- `unsplash`
- `usb`
- `usbC`
- `user`
- `userAdd`
- `userList`
- `userRemove`
- `userlane`
- `vercel`
- `viewCols`
- `viewComfortable`
- `viewDay`
- `viewGrid`
- `viewList`
- `viewMonth`
- `viewSplit`
- `vinyl`
- `voicemail`
- `voicemailO`
- `voicemailR`
- `volume`
- `webcam`
- `website`
- `windows`
- `workAlt`
- `yinyang`
- `youtube`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AbstractIcon, AddIcon, AddRIcon, AdidasIcon } from '@stacksjs/iconify-gg'

  global.navIcons = {
    home: AbstractIcon({ size: 20, class: 'nav-icon' }),
    about: AddIcon({ size: 20, class: 'nav-icon' }),
    contact: AddRIcon({ size: 20, class: 'nav-icon' }),
    settings: AdidasIcon({ size: 20, class: 'nav-icon' })
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
import { AbstractIcon } from '@stacksjs/iconify-gg'

const icon = AbstractIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbstractIcon, AddIcon, AddRIcon } from '@stacksjs/iconify-gg'

const successIcon = AbstractIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddRIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbstractIcon, AddIcon } from '@stacksjs/iconify-gg'
   const icon = AbstractIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abstract, add } from '@stacksjs/iconify-gg'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abstract, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbstractIcon, AddIcon } from '@stacksjs/iconify-gg'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-gg'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbstractIcon } from '@stacksjs/iconify-gg'
     global.icon = AbstractIcon({ size: 24 })
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
   const icon = AbstractIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abstract } from '@stacksjs/iconify-gg'

// Icons are typed as IconData
const myIcon: IconData = abstract
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/astrit/css.gg/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Astrit ([Website](https://github.com/astrit/css.gg))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gg/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gg/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
