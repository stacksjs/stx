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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AbstractIcon height="1em" />
<AbstractIcon width="1em" height="1em" />
<AbstractIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AbstractIcon size="24" />
<AbstractIcon size="1em" />

<!-- Using width and height -->
<AbstractIcon width="24" height="32" />

<!-- With color -->
<AbstractIcon size="24" color="red" />
<AbstractIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AbstractIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AbstractIcon
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
    <AbstractIcon size="24" />
    <AddIcon size="24" color="#4a90e2" />
    <AddRIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AbstractIcon size="24" color="red" />
<AbstractIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AbstractIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AbstractIcon size="24" class="text-primary" />
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
<AbstractIcon height="1em" />
<AbstractIcon width="1em" height="1em" />
<AbstractIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AbstractIcon size="24" />
<AbstractIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.gg-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AbstractIcon class="gg-icon" />
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
<nav>
  <a href="/"><AbstractIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddRIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdidasIcon size="20" class="nav-icon" /> Settings</a>
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
<AbstractIcon
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
    <AbstractIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddRIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AbstractIcon size="24" />
   <AddIcon size="24" color="#4a90e2" />
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
   <AbstractIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AbstractIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AbstractIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { abstract } from '@stacksjs/iconify-gg'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(abstract, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
