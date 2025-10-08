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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AirIcon height="1em" />
<AirIcon width="1em" height="1em" />
<AirIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AirIcon size="24" />
<AirIcon size="1em" />

<!-- Using width and height -->
<AirIcon width="24" height="32" />

<!-- With color -->
<AirIcon size="24" color="red" />
<AirIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AirIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AirIcon
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
    <AirIcon size="24" />
    <AirplayAudioIcon size="24" color="#4a90e2" />
    <AirplayVideoIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AirIcon size="24" color="red" />
<AirIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AirIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AirIcon size="24" class="text-primary" />
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
<AirIcon height="1em" />
<AirIcon width="1em" height="1em" />
<AirIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AirIcon size="24" />
<AirIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.akarIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AirIcon class="akarIcons-icon" />
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
<nav>
  <a href="/"><AirIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AirplayAudioIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AirplayVideoIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AirpodsIcon size="20" class="nav-icon" /> Settings</a>
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
<AirIcon
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
    <AirIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AirplayAudioIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AirplayVideoIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AirIcon size="24" />
   <AirplayAudioIcon size="24" color="#4a90e2" />
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
   <AirIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AirIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AirIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { air } from '@stacksjs/iconify-akar-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(air, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
