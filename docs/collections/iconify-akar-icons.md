# Akar Icons

> Akar Icons icons for stx from Iconify

## Overview

This package provides access to 458 icons from the Akar Icons collection through the stx iconify integration.

**Collection ID:** `akar-icons`
**Total Icons:** 458
**Author:** Arturo Wibawa ([Website](https://github.com/artcoholic/akar-icons))
**License:** MIT ([Details](https://github.com/artcoholic/akar-icons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-akar-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AirIcon, AirplayAudioIcon, AirplayVideoIcon } from '@stacksjs/iconify-akar-icons'

// Basic usage
const icon = AirIcon()

// With size
const sizedIcon = AirIcon({ size: 24 })

// With color
const coloredIcon = AirplayAudioIcon({ color: 'red' })

// With multiple props
const customIcon = AirplayVideoIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AirIcon, AirplayAudioIcon, AirplayVideoIcon } from '@stacksjs/iconify-akar-icons'

  global.icons = {
    home: AirIcon({ size: 24 }),
    user: AirplayAudioIcon({ size: 24, color: '#4a90e2' }),
    settings: AirplayVideoIcon({ size: 32 })
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
import { air, airplayAudio, airplayVideo } from '@stacksjs/iconify-akar-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(air, { size: 24 })
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
const redIcon = AirIcon({ color: 'red' })
const blueIcon = AirIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AirIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AirIcon({ class: 'text-primary' })
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
const icon24 = AirIcon({ size: 24 })
const icon1em = AirIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AirIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AirIcon({ height: '1em' })
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
const smallIcon = AirIcon({ class: 'icon-small' })
const largeIcon = AirIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **458** icons:

- `air`
- `airplayAudio`
- `airplayVideo`
- `airpods`
- `alarm`
- `alignBottom`
- `alignHorizontalCenter`
- `alignLeft`
- `alignRight`
- `alignToBottom`
- `alignToMiddle`
- `alignToTop`
- `alignTop`
- `alignVerticalCenter`
- `androidFill`
- `angularFill`
- `arrowBack`
- `arrowBackThick`
- `arrowBackThickFill`
- `arrowClockwise`
- `arrowCounterClockwise`
- `arrowCycle`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowDownThick`
- `arrowForward`
- `arrowForwardThick`
- `arrowForwardThickFill`
- `arrowLeft`
- `arrowLeftThick`
- `arrowRepeat`
- `arrowRight`
- `arrowRightLeft`
- `arrowRightThick`
- `arrowShuffle`
- `arrowUp`
- `arrowUpDown`
- `arrowUpLeft`
- `arrowUpRight`
- `arrowUpThick`
- `ascending`
- `attach`
- `augmentedReality`
- `backspace`
- `backspaceFill`
- `bank`
- `basket`
- `batteryCharging`
- `batteryEmpty`
- `batteryFull`
- `batteryLow`
- `batteryMedium`
- `behanceFill`
- `bell`
- `bicycle`
- `bitcoinFill`
- `block`
- `bluetooth`
- `boat`
- `book`
- `bookClose`
- `bookOpen`
- `bookmark`
- `bootstrapFill`
- `box`
- `briefcase`
- `bug`
- `cake`
- `calculator`
- `calendar`
- `camera`
- `cart`
- `chatAdd`
- `chatApprove`
- `chatBubble`
- `chatDots`
- `chatEdit`
- `chatError`
- `chatQuestion`
- `chatRemove`
- `check`
- `checkBox`
- `checkBoxFill`
- `checkIn`
- `chess`
- `chevronDown`
- `chevronDownSmall`
- `chevronHorizontal`
- `chevronLeft`
- `chevronLeftSmall`
- `chevronRight`
- `chevronRightSmall`
- `chevronUp`
- `chevronUpSmall`
- `chevronVertical`
- `circle`
- `circleAlert`
- `circleAlertFill`
- `circleCheck`
- `circleCheckFill`
- `circleChevronDown`
- `circleChevronDownFill`
- `circleChevronLeft`
- `circleChevronLeftFill`
- `circleChevronRight`
- `circleChevronRightFill`
- `circleChevronUp`
- `circleChevronUpFill`
- `circleFill`
- `circleMinus`
- `circleMinusFill`
- `circlePlus`
- `circlePlusFill`
- `circleTriangleDown`
- `circleTriangleDownFill`
- `circleTriangleLeft`
- `circleTriangleLeftFill`
- `circleTriangleRight`
- `circleTriangleRightFill`
- `circleTriangleUp`
- `circleTriangleUpFill`
- `circleX`
- `circleXFill`
- `clipboard`
- `clock`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `codepenFill`
- `coffee`
- `coin`
- `command`
- `comment`
- `commentAdd`
- `computing`
- `copy`
- `creditCard`
- `creditCardAlt1`
- `cross`
- `crown`
- `cssFill`
- `cursor`
- `cut`
- `dashboard`
- `data`
- `dental`
- `descending`
- `desktopDevice`
- `devices`
- `diamond`
- `dice1`
- `dice2`
- `dice3`
- `dice4`
- `dice5`
- `dice6`
- `discordFill`
- `djangoFill`
- `door`
- `dotGrid`
- `dotGridFill`
- `doubleCheck`
- `doubleSword`
- `download`
- `draft`
- `dragHorizontal`
- `dragHorizontalFill`
- `dragVertical`
- `dragVerticalFill`
- `dribbbleFill`
- `dropboxFill`
- `edit`
- `enlarge`
- `envelope`
- `equal`
- `equalFill`
- `eye`
- `eyeClosed`
- `eyeOpen`
- `eyeSlashed`
- `faceHappy`
- `faceNeutral`
- `faceSad`
- `faceVeryHappy`
- `faceVerySad`
- `faceWink`
- `facebookFill`
- `figmaFill`
- `file`
- `filter`
- `fire`
- `flag`
- `flashlight`
- `folder`
- `folderAdd`
- `forkLeft`
- `forkRight`
- `frame`
- `fullScreen`
- `gameController`
- `gatsbyFill`
- `gear`
- `gift`
- `githubFill`
- `githubOutlineFill`
- `gitlabFill`
- `glasses`
- `globe`
- `googleContainedFill`
- `googleFill`
- `graphqlFill`
- `grid`
- `hammer`
- `hand`
- `hashtag`
- `headphone`
- `health`
- `heart`
- `height`
- `heptagon`
- `heptagonFill`
- `hexagon`
- `hexagonFill`
- `history`
- `home`
- `homeAlt1`
- `htmlFill`
- `image`
- `inbox`
- `infinite`
- `infinity`
- `info`
- `infoFill`
- `instagramFill`
- `jar`
- `javascriptFill`
- `jqueryFill`
- `key`
- `keyCap`
- `language`
- `laptopDevice`
- `leaf`
- `lifesaver`
- `lightBulb`
- `linkChain`
- `linkOff`
- `linkOn`
- `linkOut`
- `linkedinBoxFill`
- `linkedinFill`
- `linkedinV1Fill`
- `linkedinV2Fill`
- `linkedinv1Fill`
- `linkedinv2Fill`
- `location`
- `lockOff`
- `lockOn`
- `map`
- `mastodonFill`
- `mediumFill`
- `mention`
- `microphone`
- `miniplayer`
- `minus`
- `mobileDevice`
- `money`
- `moon`
- `moonFill`
- `moreHorizontal`
- `moreHorizontalFill`
- `moreVertical`
- `moreVerticalFill`
- `music`
- `musicAlbum`
- `musicAlbumFill`
- `musicNote`
- `network`
- `newspaper`
- `nextjsFill`
- `nodeFill`
- `normalScreen`
- `npmFill`
- `octagon`
- `octagonFill`
- `octocatFill`
- `openEnvelope`
- `oval`
- `panelBottom`
- `panelLeft`
- `panelRight`
- `panelSplit`
- `panelSplitColumn`
- `panelSplitRow`
- `panelTop`
- `paper`
- `paperAirplane`
- `parallelogram`
- `pause`
- `pencil`
- `pentagon`
- `pentagonFill`
- `peopleGroup`
- `peopleMultiple`
- `percentage`
- `person`
- `personAdd`
- `personCheck`
- `personCross`
- `phone`
- `phpFill`
- `pin`
- `pinterestFill`
- `plane`
- `planeFill`
- `planet`
- `plant`
- `play`
- `plus`
- `pointerDownFill`
- `pointerHand`
- `pointerLeftFill`
- `pointerRightFill`
- `pointerUpFill`
- `pointingUp`
- `postgresqlFill`
- `priceCut`
- `productHuntFill`
- `pythonFill`
- `question`
- `questionFill`
- `radio`
- `radioFill`
- `radish`
- `reactFill`
- `receipt`
- `reciept`
- `redditFill`
- `reduce`
- `reduxFill`
- `reply`
- `ribbon`
- `rockOn`
- `rss`
- `sassFill`
- `save`
- `schedule`
- `scissor`
- `search`
- `send`
- `settingsHorizontal`
- `settingsVertical`
- `shareArrow`
- `shareBox`
- `shield`
- `shippingBox01`
- `shippingBox02`
- `shippingBoxV1`
- `shippingBoxV2`
- `shoppingBag`
- `sidebarLeft`
- `sidebarRight`
- `signOut`
- `slackFill`
- `slice`
- `snapchatFill`
- `sort`
- `soundDown`
- `soundOff`
- `soundOn`
- `soundUp`
- `soundcloudFill`
- `sparkles`
- `spotifyFill`
- `square`
- `squareFill`
- `stackOverflowFill`
- `star`
- `statisticDown`
- `statisticUp`
- `stop`
- `stopFill`
- `sun`
- `sunFill`
- `sword`
- `tabletDevice`
- `tag`
- `telegramFill`
- `telescope`
- `tetragon`
- `tetragonFill`
- `textAlignCenter`
- `textAlignJustified`
- `textAlignLeft`
- `textAlignRight`
- `threadsFill`
- `threeLineHorizontal`
- `threeLineVertical`
- `thumbsDown`
- `thumbsUp`
- `thunder`
- `ticket`
- `tiktokFill`
- `toggleOff`
- `toggleOffFill`
- `toggleOn`
- `toggleOnFill`
- `togoCup`
- `trash`
- `trashBin`
- `trashCan`
- `triangle`
- `triangleAlert`
- `triangleAlertFill`
- `triangleDown`
- `triangleDownFill`
- `triangleFill`
- `triangleLeft`
- `triangleLeftFill`
- `triangleRight`
- `triangleRightFill`
- `triangleUp`
- `triangleUpFill`
- `trophy`
- `truck`
- `tumblrFill`
- `twitchFill`
- `twitterFill`
- `twoLineHorizontal`
- `twoLineVertical`
- `typescriptFill`
- `umbrella`
- `unsplashFill`
- `utensils`
- `vapeKit`
- `vercelFill`
- `victoryHand`
- `video`
- `vimeoFill`
- `vkFill`
- `vrAr`
- `vscodeFill`
- `vueFill`
- `wallet`
- `watchDevice`
- `water`
- `whatsappFill`
- `width`
- `wifi`
- `wineGlass`
- `xFill`
- `xSmall`
- `yarnFill`
- `yelpFill`
- `youtubeFill`
- `zoomFill`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AirIcon, AirplayAudioIcon, AirplayVideoIcon, AirpodsIcon } from '@stacksjs/iconify-akar-icons'

  global.navIcons = {
    home: AirIcon({ size: 20, class: 'nav-icon' }),
    about: AirplayAudioIcon({ size: 20, class: 'nav-icon' }),
    contact: AirplayVideoIcon({ size: 20, class: 'nav-icon' }),
    settings: AirpodsIcon({ size: 20, class: 'nav-icon' })
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
import { AirIcon } from '@stacksjs/iconify-akar-icons'

const icon = AirIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AirIcon, AirplayAudioIcon, AirplayVideoIcon } from '@stacksjs/iconify-akar-icons'

const successIcon = AirIcon({ size: 16, color: '#22c55e' })
const warningIcon = AirplayAudioIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AirplayVideoIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AirIcon, AirplayAudioIcon } from '@stacksjs/iconify-akar-icons'
   const icon = AirIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { air, airplayAudio } from '@stacksjs/iconify-akar-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(air, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AirIcon, AirplayAudioIcon } from '@stacksjs/iconify-akar-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-akar-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AirIcon } from '@stacksjs/iconify-akar-icons'
     global.icon = AirIcon({ size: 24 })
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
   const icon = AirIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { air } from '@stacksjs/iconify-akar-icons'

// Icons are typed as IconData
const myIcon: IconData = air
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/artcoholic/akar-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Arturo Wibawa ([Website](https://github.com/artcoholic/akar-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/akar-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/akar-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
