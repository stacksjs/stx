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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdIcon, AdSolidIcon, AlignCenterIcon } from '@stacksjs/iconify-pixel'

// Basic usage
const icon = AdIcon()

// With size
const sizedIcon = AdIcon({ size: 24 })

// With color
const coloredIcon = AdSolidIcon({ color: 'red' })

// With multiple props
const customIcon = AlignCenterIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdIcon, AdSolidIcon, AlignCenterIcon } from '@stacksjs/iconify-pixel'

  global.icons = {
    home: AdIcon({ size: 24 }),
    user: AdSolidIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignCenterIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AdIcon({ color: 'red' })
const blueIcon = AdIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdIcon({ class: 'text-primary' })
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
const icon24 = AdIcon({ size: 24 })
const icon1em = AdIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdIcon({ height: '1em' })
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
const smallIcon = AdIcon({ class: 'icon-small' })
const largeIcon = AdIcon({ class: 'icon-large' })
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
@js
  import { AdIcon, AdSolidIcon, AlignCenterIcon, AlignCenterSolidIcon } from '@stacksjs/iconify-pixel'

  global.navIcons = {
    home: AdIcon({ size: 20, class: 'nav-icon' }),
    about: AdSolidIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignCenterIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignCenterSolidIcon({ size: 20, class: 'nav-icon' })
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
import { AdIcon } from '@stacksjs/iconify-pixel'

const icon = AdIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdIcon, AdSolidIcon, AlignCenterIcon } from '@stacksjs/iconify-pixel'

const successIcon = AdIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdSolidIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignCenterIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdIcon, AdSolidIcon } from '@stacksjs/iconify-pixel'
   const icon = AdIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { ad, adSolid } from '@stacksjs/iconify-pixel'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(ad, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdIcon, AdSolidIcon } from '@stacksjs/iconify-pixel'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-pixel'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdIcon } from '@stacksjs/iconify-pixel'
     global.icon = AdIcon({ size: 24 })
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
   const icon = AdIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
