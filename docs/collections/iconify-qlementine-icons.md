# Qlementine Icons

> Qlementine Icons icons for stx from Iconify

## Overview

This package provides access to 757 icons from the Qlementine Icons collection through the stx iconify integration.

**Collection ID:** `qlementine-icons`
**Total Icons:** 757
**Author:** Olivier Cléro ([Website](https://github.com/oclero/qlementine-icons))
**License:** MIT ([Details](https://github.com/oclero/qlementine-icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-qlementine-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { Accessibility16Icon, Accordion16Icon, AddFile16Icon } from '@stacksjs/iconify-qlementine-icons'

// Basic usage
const icon = Accessibility16Icon()

// With size
const sizedIcon = Accessibility16Icon({ size: 24 })

// With color
const coloredIcon = Accordion16Icon({ color: 'red' })

// With multiple props
const customIcon = AddFile16Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { Accessibility16Icon, Accordion16Icon, AddFile16Icon } from '@stacksjs/iconify-qlementine-icons'

  global.icons = {
    home: Accessibility16Icon({ size: 24 }),
    user: Accordion16Icon({ size: 24, color: '#4a90e2' }),
    settings: AddFile16Icon({ size: 32 })
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
import { accessibility16, accordion16, addFile16 } from '@stacksjs/iconify-qlementine-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility16, { size: 24 })
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
const redIcon = Accessibility16Icon({ color: 'red' })
const blueIcon = Accessibility16Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = Accessibility16Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = Accessibility16Icon({ class: 'text-primary' })
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
const icon24 = Accessibility16Icon({ size: 24 })
const icon1em = Accessibility16Icon({ size: '1em' })

// Set individual dimensions
const customIcon = Accessibility16Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = Accessibility16Icon({ height: '1em' })
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
const smallIcon = Accessibility16Icon({ class: 'icon-small' })
const largeIcon = Accessibility16Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **757** icons:

- `accessibility16`
- `accordion16`
- `addFile16`
- `addFolder16`
- `addToCart16`
- `addressBook16`
- `addressBookAdd16`
- `addressBookRemove16`
- `aiff16`
- `airplaneMode16`
- `alignBottom216`
- `alignCenterHorizontal216`
- `alignCenterVertical216`
- `alignLeft16`
- `alignLeft216`
- `alignRight16`
- `alignRight216`
- `alignTop216`
- `alternate16`
- `amp16`
- `amp24`
- `anchorBottomLeft16`
- `anchorBottomMiddle16`
- `anchorBottomRight16`
- `anchorCenterLeft16`
- `anchorCenterMiddle16`
- `anchorCenterRight16`
- `anchorTopLeft16`
- `anchorTopMiddle16`
- `anchorTopRight16`
- `android16`
- `android24`
- `androidFill16`
- `androidFill24`
- `archive16`
- `arrowDown16`
- `arrowDown24`
- `arrowDownLeft16`
- `arrowDownLeft24`
- `arrowDownRight16`
- `arrowDownRight24`
- `arrowLeft16`
- `arrowLeft24`
- `arrowRight16`
- `arrowRight24`
- `arrowUp16`
- `arrowUp24`
- `arrowUpLeft16`
- `arrowUpLeft24`
- `arrowUpRight16`
- `arrowUpRight24`
- `arrowsLeftRight12`
- `arrowsUpDown12`
- `asio16`
- `asterisk16`
- `attachement16`
- `audioInterface16`
- `award16`
- `banjo16`
- `banjo24`
- `bass16`
- `bass24`
- `battery016`
- `battery10016`
- `battery2016`
- `battery4016`
- `battery6016`
- `battery8016`
- `bell16`
- `blocks16`
- `bluetooth16`
- `bongos16`
- `bongos24`
- `book16`
- `bookOpen16`
- `bookmark16`
- `booleanExclude16`
- `booleanIntersect16`
- `booleanSubstract16`
- `booleanUnion16`
- `borders16`
- `bringToBack16`
- `bringToFront16`
- `build16`
- `burger16`
- `calculator16`
- `calendar16`
- `camera16`
- `cashierTicket16`
- `cello16`
- `cello24`
- `center16`
- `certificate16`
- `certified16`
- `certifiedFilled16`
- `characterMap16`
- `checkTick12`
- `checkTick16`
- `checkTick24`
- `checkTickSmall16`
- `checkTickSmall24`
- `chevronDoubleDown16`
- `chevronDoubleLeft16`
- `chevronDoubleRight16`
- `chevronDoubleUp16`
- `chevronDown12`
- `chevronDown16`
- `chevronDown24`
- `chevronLeft12`
- `chevronLeft16`
- `chevronLeft24`
- `chevronRight12`
- `chevronRight16`
- `chevronRight24`
- `chevronSmoothLeft16`
- `chevronSmoothRight16`
- `chevronUp12`
- `chevronUp16`
- `chevronUp24`
- `circle16`
- `circleFilled16`
- `circleFilled32`
- `clap16`
- `clap24`
- `clear16`
- `clear24`
- `clock16`
- `close12`
- `close16`
- `closeAll16`
- `closeSingle16`
- `closeSmall16`
- `cloud16`
- `cloudCrossedOut16`
- `cloudDown16`
- `cloudUp16`
- `cloudUpDown16`
- `colorSwatch16`
- `colorSwatch24`
- `comboboxIndicator16`
- `commandLine16`
- `comment16`
- `computer16`
- `copy16`
- `copy24`
- `cowbell16`
- `cowbell24`
- `cpu16`
- `crane16`
- `craneHook16`
- `creditCard16`
- `creditCardCrossed16`
- `cube16`
- `cut16`
- `cut24`
- `cymbal16`
- `cymbal24`
- `database16`
- `debug16`
- `decrease16`
- `decrease24`
- `desktop16`
- `dialog16`
- `dictionary16`
- `discord16`
- `discord24`
- `discordFill16`
- `discordFill24`
- `disk16`
- `distributeHorizontal16`
- `distributeVertical16`
- `download16`
- `drag16`
- `drive16`
- `drumkit16`
- `drumkit24`
- `drumsticks16`
- `drumsticks24`
- `education16`
- `education24`
- `eject16`
- `emptySlot16`
- `emptySlot24`
- `erase16`
- `erase24`
- `eraser16`
- `ethernet16`
- `executable16`
- `export16`
- `export24`
- `externalLink16`
- `eye16`
- `eye24`
- `eyeCrossed16`
- `eyeCrossed24`
- `eyedropper16`
- `facebook16`
- `facebook24`
- `facebookFill16`
- `facebookFill24`
- `faq16`
- `file16`
- `fileHtml16`
- `fileManager16`
- `fileMarkdown16`
- `filePdf24`
- `fileScript16`
- `fileText16`
- `fill16`
- `filmRoll16`
- `filter16`
- `filterCrossed16`
- `filterInverted16`
- `flac16`
- `flag16`
- `flatten16`
- `flipHorizontal16`
- `flipVertical16`
- `folder16`
- `folder24`
- `folderFilled16`
- `folderFilled24`
- `folderOpen16`
- `folderOpen24`
- `folderOpen32`
- `font16`
- `forbidden16`
- `formatBold16`
- `formatItalic16`
- `formatStrikethrough16`
- `formatUnderline16`
- `forward16`
- `frenchFries16`
- `fullscreen16`
- `fullscreenExit16`
- `functionAngle16`
- `functionCurve16`
- `functionLinear16`
- `funnel16`
- `funnelCrossed16`
- `fx16`
- `gamepad16`
- `gamepadButtonBottom16`
- `gamepadButtonLeft16`
- `gamepadButtonRight16`
- `gamepadButtonTop16`
- `gamepadButtons16`
- `gamepadDpad16`
- `gamepadJoystickLeft16`
- `gamepadJoystickRight16`
- `gamepadShoulderLeft16`
- `gamepadShoulderRight16`
- `gamepadStart16`
- `gather16`
- `gaugeHigh16`
- `gaugeLow16`
- `gaugeMiddle16`
- `gift16`
- `gift24`
- `github16`
- `github24`
- `githubFill16`
- `githubFill24`
- `gitlab16`
- `gitlab24`
- `gitlabFill16`
- `gitlabFill24`
- `glasses16`
- `globe16`
- `goBottom16`
- `goFirst16`
- `goLast16`
- `goTop16`
- `gpu16`
- `grid16`
- `group16`
- `guitar12Strings16`
- `guitar12Strings24`
- `guitar16`
- `guitar24`
- `guitarClassical16`
- `guitarClassical24`
- `guitarFolk16`
- `guitarFolk24`
- `guitarJackson16`
- `guitarMachineHead16`
- `guitarMachineHead24`
- `guitarStrat16`
- `guitarStrat24`
- `guitarTele16`
- `guitarTele24`
- `hammer16`
- `hand16`
- `harmonica16`
- `harp16`
- `hdd16`
- `hdd24`
- `hdmi16`
- `headphones16`
- `headset16`
- `heart16`
- `heart24`
- `heartCrossed16`
- `heartFilled16`
- `heartFilled24`
- `help16`
- `hiHat16`
- `hiHat24`
- `home16`
- `home24`
- `hourglass16`
- `hourglass24`
- `idCard16`
- `idiophone16`
- `idiophone24`
- `inbox16`
- `increase16`
- `increase24`
- `indentLess16`
- `indentMore16`
- `info12`
- `info16`
- `info24`
- `info32`
- `ink16`
- `instagram16`
- `instagram24`
- `instagramFill16`
- `instagramFill24`
- `itemsGrid16`
- `itemsGrid24`
- `itemsGridSmall16`
- `itemsGridSmall24`
- `itemsList16`
- `itemsList24`
- `itemsTree16`
- `itemsTree24`
- `jack16`
- `jump16`
- `jumpOver16`
- `justifyCenter16`
- `justifyFill16`
- `justifyLeft16`
- `justifyRight16`
- `keyCmd16`
- `keyCtrl16`
- `keyOpt16`
- `keyReturn16`
- `keyReturnNoframe16`
- `keyShift16`
- `keyTab16`
- `keyboard16`
- `kick16`
- `kick24`
- `layer116`
- `layer216`
- `layer316`
- `layers116`
- `layers216`
- `layers316`
- `layers416`
- `layersMore16`
- `layoutPagesHorizontal16`
- `layoutPagesVertical16`
- `layoutPagesWrap16`
- `layoutParchment16`
- `layoutScreenHorizontal16`
- `layoutScreenVertical16`
- `leftToRight16`
- `library16`
- `location16`
- `lock16`
- `lock24`
- `lockScreen16`
- `logIn16`
- `logOut16`
- `loop16`
- `loop24`
- `losange16`
- `losangeFilled16`
- `mac16`
- `mac24`
- `macFill16`
- `macaron16`
- `macaronFilled16`
- `magnet16`
- `magnetCrossedOut16`
- `mail16`
- `mandolin16`
- `mandolin24`
- `map16`
- `markup16`
- `mastering16`
- `mastering24`
- `mastodon16`
- `mastodon24`
- `mastodonFill16`
- `mastodonFill24`
- `matchCase16`
- `matchRegexp16`
- `matchWholeWord16`
- `medal16`
- `medalOne16`
- `media16`
- `megaphone16`
- `memory16`
- `menuBurger16`
- `menuDots16`
- `menuDots24`
- `menuDotsCircle16`
- `menuDotsCircle24`
- `meterHigh16`
- `meterLow16`
- `meterMiddle16`
- `microphone16`
- `microphone24`
- `microphoneOld16`
- `midi16`
- `midi216`
- `midi24`
- `minus12`
- `minus16`
- `minusCircle16`
- `minusCircle24`
- `minusSmall16`
- `modem16`
- `modified16`
- `money16`
- `moneyCrossed16`
- `mono16`
- `moon16`
- `mouse16`
- `mouseCursor16`
- `mouseLeftButton16`
- `mouseMiddleButton16`
- `mouseRightButton16`
- `mouseSelection16`
- `move16`
- `movie16`
- `mp316`
- `musicScore16`
- `network16`
- `new16`
- `newspaper16`
- `note16`
- `note8thSimple16`
- `notes16`
- `octogon16`
- `octogonFilled16`
- `octogonFilled32`
- `ogg16`
- `onOff16`
- `open16`
- `openRecent16`
- `openRecent24`
- `page16`
- `pageBreak16`
- `pageLandscape16`
- `pagePortrait16`
- `pageSetup16`
- `pageSetup216`
- `pageText16`
- `paintBrushLarge16`
- `paintBrushThin16`
- `paintBucket16`
- `paintBucketDrop16`
- `paintDrop16`
- `paintPalette16`
- `paintRollBrush16`
- `paragraph16`
- `passThrough16`
- `password16`
- `paste16`
- `paste24`
- `pause16`
- `pause24`
- `pauseMusic16`
- `pda16`
- `pdf16`
- `pedal16`
- `pedal24`
- `pedalOutlines16`
- `pedalOutlines24`
- `pedalboard16`
- `pedalboard24`
- `peertube16`
- `peertube24`
- `peertubeFill16`
- `peertubeFill24`
- `pen12`
- `pen16`
- `pen24`
- `phone16`
- `photoCamera16`
- `piano16`
- `piano24`
- `picture16`
- `pin16`
- `pipe16`
- `pipe24`
- `play16`
- `play24`
- `playSmall16`
- `playStroke16`
- `playlist16`
- `plugin16`
- `plus12`
- `plus16`
- `plusCircle16`
- `plusCircle24`
- `plusSmall16`
- `present16`
- `preset16`
- `preventLineBreak16`
- `preview16`
- `print16`
- `printPreview16`
- `properties16`
- `purcentage16`
- `purcentage24`
- `puzzlePiece16`
- `question12`
- `question16`
- `question24`
- `question32`
- `radio16`
- `radioTick16`
- `record16`
- `record24`
- `redo16`
- `redo24`
- `refresh16`
- `rename16`
- `repeat16`
- `repeatOne16`
- `replace16`
- `reply16`
- `replyAll16`
- `reset16`
- `resizeBigger16`
- `resizeHorizontal16`
- `resizeSmaller16`
- `resizeVertical16`
- `resume16`
- `rightToLeft16`
- `rotateAnticlockwise16`
- `rotateClockwise16`
- `rss16`
- `rss24`
- `run16`
- `runDebug16`
- `save16`
- `save24`
- `saveToDisk16`
- `saxophone16`
- `saxophone24`
- `scanner16`
- `screen16`
- `screenshot16`
- `scrollLock16`
- `scrollUnlock16`
- `search16`
- `search24`
- `seekBackward16`
- `seekBackward24`
- `seekForward16`
- `seekForward24`
- `selectAll16`
- `selectAll24`
- `send16`
- `sendReceive16`
- `separationHorizontal16`
- `separationVertical16`
- `server16`
- `settings16`
- `settings24`
- `shakers16`
- `shakers24`
- `shamisen16`
- `shamisen24`
- `share16`
- `shareExternal16`
- `shoppingBag16`
- `shoppingCart16`
- `shuffle16`
- `sitar16`
- `skipBackward16`
- `skipBackward24`
- `skipForward16`
- `skipForward24`
- `slidersHorizontal16`
- `slidersHorizontal24`
- `slidersVertical16`
- `slidersVertical24`
- `smartphone16`
- `sms16`
- `snapshot16`
- `snare16`
- `snare24`
- `sortAlphaAsc16`
- `sortAlphaAsc24`
- `sortAlphaDesc16`
- `sortAlphaDesc24`
- `sortAsc16`
- `sortAsc24`
- `sortDesc16`
- `sortDesc24`
- `sortRankingAsc16`
- `sortRankingAsc24`
- `sortRankingDesc16`
- `sortRankingDesc24`
- `sortTimeAsc16`
- `sortTimeAsc24`
- `sortTimeDesc16`
- `sortTimeDesc24`
- `sortUserAsc16`
- `sortUserDesc16`
- `spam12`
- `spam16`
- `spam24`
- `spam32`
- `speaker016`
- `speaker116`
- `speaker16`
- `speaker216`
- `speaker24`
- `speakerMute16`
- `spellCheck16`
- `square16`
- `squareFilled16`
- `star16`
- `starFilled16`
- `starHalf16`
- `stars16`
- `startMusic16`
- `stepInto16`
- `stepOut16`
- `stereo16`
- `stereoLeft16`
- `stereoRight16`
- `stop16`
- `stop24`
- `stopMusic16`
- `success12`
- `success16`
- `success32`
- `sun16`
- `swap16`
- `sword16`
- `synthesizer16`
- `synthesizer24`
- `systemMonitor16`
- `tablet16`
- `tag16`
- `tambourine16`
- `tambourine24`
- `tamtam16`
- `tamtam24`
- `tape16`
- `tape24`
- `target16`
- `task16`
- `taskPast16`
- `taskSoon16`
- `template16`
- `test16`
- `text16`
- `textEditor16`
- `theme16`
- `tom16`
- `tom24`
- `tool16`
- `tool24`
- `tracklist16`
- `trash16`
- `trash24`
- `trashFull16`
- `triangle16`
- `triangleFilled16`
- `triangleFilled32`
- `trombone16`
- `trophy16`
- `trumpet16`
- `trumpet24`
- `tuba16`
- `twitter16`
- `twitter24`
- `twitterFill16`
- `twitterFill24`
- `uiPanelBottom16`
- `uiPanelLeft16`
- `uiPanelRight16`
- `uiPanelTop16`
- `ukulele16`
- `ukulele24`
- `unavailable16`
- `undo16`
- `undo24`
- `ungroup16`
- `unknown16`
- `unlock16`
- `update16`
- `update24`
- `usbKey16`
- `user16`
- `user24`
- `users16`
- `vector16`
- `versionControl16`
- `viewPageAll16`
- `viewPageFacing16`
- `viewPageSingle16`
- `violin16`
- `violin24`
- `vst316`
- `vst324`
- `wall16`
- `warning12`
- `warning16`
- `warning24`
- `warning32`
- `wav16`
- `wave16`
- `wave24`
- `webcam16`
- `windows16`
- `windows24`
- `windowsClose16`
- `windowsFill16`
- `windowsMaximize16`
- `windowsMinimize16`
- `windowsUnmaximize16`
- `wireless016`
- `wireless116`
- `wireless216`
- `wirelessDisabled16`
- `wirelessNone16`
- `woodwind16`
- `woodwind24`
- `x16`
- `x24`
- `youtube16`
- `youtube24`
- `youtubeFill16`
- `youtubeFill24`
- `zoom12`
- `zoom16`
- `zoomFit16`
- `zoomFitHeight16`
- `zoomFitPage16`
- `zoomFitScreen16`
- `zoomFitWidth16`
- `zoomHorizontal16`
- `zoomIn16`
- `zoomOriginal16`
- `zoomOut16`
- `zoomVertical16`

## Usage Examples

### Navigation Menu

```html
@js
  import { Accessibility16Icon, Accordion16Icon, AddFile16Icon, AddFolder16Icon } from '@stacksjs/iconify-qlementine-icons'

  global.navIcons = {
    home: Accessibility16Icon({ size: 20, class: 'nav-icon' }),
    about: Accordion16Icon({ size: 20, class: 'nav-icon' }),
    contact: AddFile16Icon({ size: 20, class: 'nav-icon' }),
    settings: AddFolder16Icon({ size: 20, class: 'nav-icon' })
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
import { Accessibility16Icon } from '@stacksjs/iconify-qlementine-icons'

const icon = Accessibility16Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { Accessibility16Icon, Accordion16Icon, AddFile16Icon } from '@stacksjs/iconify-qlementine-icons'

const successIcon = Accessibility16Icon({ size: 16, color: '#22c55e' })
const warningIcon = Accordion16Icon({ size: 16, color: '#f59e0b' })
const errorIcon = AddFile16Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { Accessibility16Icon, Accordion16Icon } from '@stacksjs/iconify-qlementine-icons'
   const icon = Accessibility16Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility16, accordion16 } from '@stacksjs/iconify-qlementine-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility16, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { Accessibility16Icon, Accordion16Icon } from '@stacksjs/iconify-qlementine-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-qlementine-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { Accessibility16Icon } from '@stacksjs/iconify-qlementine-icons'
     global.icon = Accessibility16Icon({ size: 24 })
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
   const icon = Accessibility16Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility16 } from '@stacksjs/iconify-qlementine-icons'

// Icons are typed as IconData
const myIcon: IconData = accessibility16
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/oclero/qlementine-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Olivier Cléro ([Website](https://github.com/oclero/qlementine-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/qlementine-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/qlementine-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
