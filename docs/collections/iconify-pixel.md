# Pixel Icon

> Pixel Icon icons for stx from Iconify

## Overview

This package provides access to 450 icons from the Pixel Icon collection through the stx iconify integration.

**Collection ID:** `pixel`
**Total Icons:** 450
**Author:** HackerNoon ([Website](https://github.com/hackernoon/pixel-icon-library))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pixel
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdIcon height="1em" />
<AdIcon width="1em" height="1em" />
<AdIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdIcon size="24" />
<AdIcon size="1em" />

<!-- Using width and height -->
<AdIcon width="24" height="32" />

<!-- With color -->
<AdIcon size="24" color="red" />
<AdIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdIcon
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
    <AdIcon size="24" />
    <AdSolidIcon size="24" color="#4a90e2" />
    <AlignCenterIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { ad, adSolid, alignCenter } from '@stacksjs/iconify-pixel'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(ad, { size: 24 })
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
<AdIcon size="24" color="red" />
<AdIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdIcon size="24" class="text-primary" />
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
<AdIcon height="1em" />
<AdIcon width="1em" height="1em" />
<AdIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdIcon size="24" />
<AdIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.pixel-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdIcon class="pixel-icon" />
```

## Available Icons

This package contains **450** icons:

- `ad`
- `adSolid`
- `alignCenter`
- `alignCenterSolid`
- `alignJustify`
- `alignJustifySolid`
- `alignLeft`
- `alignLeftSolid`
- `alignRight`
- `alignRightSolid`
- `analytics`
- `analyticsSolid`
- `android`
- `angellist`
- `angleDown`
- `angleDownSolid`
- `angleLeft`
- `angleLeftSolid`
- `angleRight`
- `angleRightSolid`
- `angleUp`
- `angleUpSolid`
- `apple`
- `arrowAltCircleDown`
- `arrowAltCircleDownSolid`
- `arrowAltCircleLeft`
- `arrowAltCircleLeftSolid`
- `arrowAltCircleRight`
- `arrowAltCircleRightSolid`
- `arrowAltCircleUp`
- `arrowAltCircleUpSolid`
- `arrowCircleDown`
- `arrowCircleDownSolid`
- `arrowCircleLeft`
- `arrowCircleLeftSolid`
- `arrowCircleRight`
- `arrowCircleRightSolid`
- `arrowCircleUp`
- `arrowCircleUpSolid`
- `arrowDown`
- `arrowDownSolid`
- `arrowLeft`
- `arrowLeftSolid`
- `arrowRight`
- `arrowRightSolid`
- `arrowUp`
- `arrowUpSolid`
- `arweave`
- `at`
- `atSolid`
- `badgeCheck`
- `badgeCheckSolid`
- `bank`
- `bankSolid`
- `bars`
- `barsSolid`
- `behance`
- `bell`
- `bellExclaimation`
- `bellExclaimationSolid`
- `bellMute`
- `bellMuteSolid`
- `bellSolid`
- `bloomberg`
- `bluesky`
- `bold`
- `boldSolid`
- `bolt`
- `boltSolid`
- `bookHeart`
- `bookHeartSolid`
- `bookmark`
- `bookmarkSolid`
- `boxUsd`
- `boxUsdSolid`
- `brightnessHigh`
- `brightnessHighSolid`
- `brightnessLow`
- `brightnessLowSolid`
- `bulletList`
- `bulletListSolid`
- `bullhorn`
- `bullhornSolid`
- `business`
- `calender`
- `calenderSolid`
- `cc`
- `ccSolid`
- `chartLine`
- `chartLineSolid`
- `chartNetwork`
- `chartNetworkSolid`
- `check`
- `checkBox`
- `checkBoxSolid`
- `checkCircle`
- `checkCircleSolid`
- `checkList`
- `checkListSolid`
- `checkSolid`
- `chevronDown`
- `chevronDownSolid`
- `chevronUp`
- `chevronUpSolid`
- `circleNotch`
- `circleNotchSolid`
- `clipboard`
- `clipboardSolid`
- `clock`
- `clockSolid`
- `cloud`
- `cloudDownloadAlt`
- `cloudDownloadSolid`
- `cloudUpload`
- `cloudUploadSolid`
- `code`
- `codeBlock`
- `codeBlockSolid`
- `codeSolid`
- `cog`
- `cogSolid`
- `comment`
- `commentDots`
- `commentDotsSolid`
- `commentQuote`
- `commentQuoteSolid`
- `commentSolid`
- `comments`
- `commentsSolid`
- `copy`
- `copySolid`
- `creditCard`
- `creditCardSolid`
- `crown`
- `crownSolid`
- `crunchbase`
- `cybersecurity`
- `dataScience`
- `digg`
- `discord`
- `discourse`
- `divider`
- `dividerSolid`
- `download`
- `downloadAlt`
- `downloadAltSolid`
- `downloadSolid`
- `edit`
- `editSolid`
- `ellipsesHorizontal`
- `ellipsesHorizontalCircle`
- `ellipsesHorizontalCircleSolid`
- `ellipsesHorizontalSolid`
- `ellipsesVertical`
- `ellipsesVerticalCircle`
- `ellipsesVerticalCircleSolid`
- `ellipsesVerticalSolid`
- `envelope`
- `envelopeSolid`
- `exclaimation`
- `exclaimationSolid`
- `exclamationTriangle`
- `exclamationTriangleSolid`
- `expand`
- `expandSolid`
- `externalLink`
- `externalLinkSolid`
- `eye`
- `eyeCross`
- `eyeCrossSolid`
- `eyeSolid`
- `faceThinking`
- `faceThinkingSolid`
- `facebookRound`
- `facebookSquare`
- `figma`
- `fileImport`
- `fileImportSolid`
- `filter`
- `filterAltCircle`
- `filterAltCircleSolid`
- `filterSolid`
- `finance`
- `fire`
- `fireSolid`
- `flag`
- `flagCheckered`
- `flagCheckeredSolid`
- `flagSolid`
- `folder`
- `folderOpen`
- `folderOpenSolid`
- `folderSolid`
- `futurism`
- `gaming`
- `giphy`
- `github`
- `globe`
- `globeAmericas`
- `globeAmericasSolid`
- `globeSolid`
- `golden`
- `google`
- `googleNews`
- `grid`
- `gridSolid`
- `h1`
- `h2`
- `h3`
- `hackernoon`
- `hackernoonPurcat`
- `heading1Solid`
- `heading2Solid`
- `heading3Solid`
- `headphones`
- `headphonesSolid`
- `heart`
- `heartSolid`
- `highlight`
- `highlightSolid`
- `hockeyMask`
- `hockeyMaskSolid`
- `home`
- `homeSolid`
- `huggingface`
- `image`
- `imageSolid`
- `imgur`
- `indent`
- `indentSolid`
- `infoCircle`
- `infoCircleSolid`
- `instagram`
- `ios`
- `italics`
- `italicsSolid`
- `kaggle`
- `lifeHacking`
- `lightbulb`
- `lightbulbSolid`
- `lineHeight`
- `lineHeightSolid`
- `link`
- `linkSolid`
- `linkedin`
- `locationPin`
- `locationPinSolid`
- `lock`
- `lockAlt`
- `lockAltSolid`
- `lockOpen`
- `lockOpenSolid`
- `lockSolid`
- `login`
- `loginSolid`
- `logout`
- `logoutSolid`
- `machineLearning`
- `management`
- `mastodon`
- `media`
- `message`
- `messageDots`
- `messageDotsSolid`
- `messageSolid`
- `minds`
- `minus`
- `minusSolid`
- `moon`
- `moonSolid`
- `music`
- `musicSolid`
- `newsbreak`
- `newspaper`
- `newspaperSolid`
- `npm`
- `numberedList`
- `numberedListSolid`
- `octagonCheck`
- `octagonCheckSolid`
- `octagonTimes`
- `octagonTimesSolid`
- `openAi`
- `outdent`
- `outdentSolid`
- `pageBreak`
- `pageBreakSolid`
- `paperclip`
- `paperclipSolid`
- `paragraph`
- `paragraphSolid`
- `pause`
- `pauseSolid`
- `pen`
- `penNib`
- `penNibSolid`
- `penSolid`
- `pencil`
- `pencilRuler`
- `pencilRulerSolid`
- `pencilSolid`
- `peopleCarry`
- `peopleCarrySolid`
- `phoneRingingHigh`
- `phoneRingingHighSolid`
- `phoneRingingLow`
- `phoneRingingLowSolid`
- `pinterest`
- `plane`
- `planeDeparture`
- `planeDepartureSolid`
- `planeSolid`
- `play`
- `playSolid`
- `playlist`
- `playlistSolid`
- `plus`
- `plusSolid`
- `podcasts`
- `print`
- `printSolid`
- `pro`
- `proSolid`
- `productHunt`
- `productManagement`
- `programming`
- `question`
- `questionSolid`
- `quoteLeft`
- `quoteLeftSolid`
- `quoteRight`
- `quoteRightSolid`
- `receipt`
- `receiptSolid`
- `reddit`
- `refresh`
- `refreshSolid`
- `remote`
- `retroCamera`
- `retroCameraSolid`
- `robot`
- `robotSolid`
- `rss`
- `save`
- `saveSolid`
- `science`
- `search`
- `searchSolid`
- `seedlings`
- `seedlingsSolid`
- `share`
- `shareSolid`
- `shop`
- `shopSolid`
- `shoppingCart`
- `shoppingCartSolid`
- `shuffle`
- `shuffleSolid`
- `sia`
- `society`
- `sort`
- `sortSolid`
- `soundMute`
- `soundMuteSolid`
- `soundOn`
- `soundOnSolid`
- `sparkles`
- `sparklesSolid`
- `spinner`
- `spinnerSolid`
- `spinnerThird`
- `spinnerThirdSolid`
- `star`
- `starCrescent`
- `starCrescentSolid`
- `starSolid`
- `startups`
- `steam`
- `strikeThrough`
- `strikeThroughSolid`
- `sun`
- `sunSolid`
- `table`
- `tableSolid`
- `tag`
- `tagSolid`
- `techCompanies`
- `techStories`
- `technology`
- `textSlash`
- `textSlashSolid`
- `themes`
- `themesSolid`
- `threads`
- `thumbsdown`
- `thumbsdownSolid`
- `thumbsup`
- `thumbsupSolid`
- `thumbtack`
- `thumbtackSolid`
- `tiktok`
- `times`
- `timesCircle`
- `timesCircleSolid`
- `timesSolid`
- `translate`
- `translateSolid`
- `trash`
- `trashAlt`
- `trashAltSolid`
- `trashSolid`
- `trending`
- `trendingSolid`
- `trophy`
- `trophySolid`
- `twitch`
- `twitter`
- `underline`
- `underlineSolid`
- `unlock`
- `unlockAlt`
- `unlockAltSolid`
- `unlockSolid`
- `unsplash`
- `upload`
- `uploadAlt`
- `uploadAltSolid`
- `uploadSolid`
- `user`
- `userCheck`
- `userCheckSolid`
- `userHeadset`
- `userHeadsetSolid`
- `userSolid`
- `users`
- `usersCrown`
- `usersCrownSolid`
- `usersSolid`
- `viewblocks`
- `voteYeah`
- `voteYeahSolid`
- `wallet`
- `walletSolid`
- `web3`
- `wikipedia`
- `windowClose`
- `windowCloseSolid`
- `writing`
- `x`
- `youtube`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AdIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdSolidIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignCenterIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignCenterSolidIcon size="20" class="nav-icon" /> Settings</a>
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
<AdIcon
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
    <AdIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdSolidIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignCenterIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdIcon size="24" />
   <AdSolidIcon size="24" color="#4a90e2" />
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
   <AdIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { ad } from '@stacksjs/iconify-pixel'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(ad, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { ad } from '@stacksjs/iconify-pixel'

// Icons are typed as IconData
const myIcon: IconData = ad
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: HackerNoon ([Website](https://github.com/hackernoon/pixel-icon-library))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pixel/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pixel/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
