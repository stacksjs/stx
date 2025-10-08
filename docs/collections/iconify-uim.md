# Unicons Monochrome

> Unicons Monochrome icons for stx from Iconify

## Overview

This package provides access to 298 icons from the Unicons Monochrome collection through the stx iconify integration.

**Collection ID:** `uim`
**Total Icons:** 298
**Author:** Iconscout ([Website](https://github.com/Iconscout/unicons))
**License:** Apache 2.0 ([Details](https://github.com/Iconscout/unicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-uim
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, AdobeIcon, AdobeAltIcon } from '@stacksjs/iconify-uim'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = AdobeIcon({ color: 'red' })

// With multiple props
const customIcon = AdobeAltIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, AdobeIcon, AdobeAltIcon } from '@stacksjs/iconify-uim'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: AdobeIcon({ size: 24, color: '#4a90e2' }),
    settings: AdobeAltIcon({ size: 32 })
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
import { 500px, adobe, adobeAlt } from '@stacksjs/iconify-uim'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(500px, { size: 24 })
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
const redIcon = 500pxIcon({ color: 'red' })
const blueIcon = 500pxIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 500pxIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 500pxIcon({ class: 'text-primary' })
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
const icon24 = 500pxIcon({ size: 24 })
const icon1em = 500pxIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 500pxIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 500pxIcon({ height: '1em' })
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
const smallIcon = 500pxIcon({ class: 'icon-small' })
const largeIcon = 500pxIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **298** icons:

- `500px`
- `adobe`
- `adobeAlt`
- `airplay`
- `align`
- `alignAlt`
- `alignCenter`
- `alignCenterJustify`
- `alignJustify`
- `alignLeft`
- `alignLeftJustify`
- `alignLetterRight`
- `alignRight`
- `alignRightJustify`
- `amazon`
- `analysis`
- `analytics`
- `anchor`
- `android`
- `androidAlt`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleRightB`
- `angleUp`
- `apple`
- `appleAlt`
- `apps`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowUpLeft`
- `arrowUpRight`
- `at`
- `bag`
- `bars`
- `batteryBolt`
- `batteryEmpty`
- `behance`
- `behanceAlt`
- `bing`
- `bitcoin`
- `bitcoinAlt`
- `blackberry`
- `blogger`
- `bloggerAlt`
- `bookmark`
- `borderAlt`
- `borderBottom`
- `borderClear`
- `borderHorizontal`
- `borderInner`
- `borderLeft`
- `borderOut`
- `borderRight`
- `borderTop`
- `borderVertical`
- `box`
- `briefcase`
- `calendar`
- `calender`
- `chart`
- `chartPie`
- `check`
- `checkCircle`
- `checkSquare`
- `circle`
- `circleLayer`
- `clinicMedical`
- `clock`
- `clockEight`
- `clockFive`
- `clockNine`
- `clockSeven`
- `clockTen`
- `clockThree`
- `clockTwo`
- `columns`
- `comment`
- `commentAlt`
- `commentAltDots`
- `commentAltMessage`
- `commentAltPlus`
- `commentDots`
- `commentMessage`
- `commentPlus`
- `compress`
- `cornerDownLeft`
- `cornerDownRight`
- `cornerLeftDown`
- `cornerRightDown`
- `cornerUpLeft`
- `cornerUpRight`
- `coronavirus`
- `css3`
- `css3Simple`
- `cube`
- `dialpad`
- `dialpadAlt`
- `direction`
- `discord`
- `docker`
- `documentLayoutCenter`
- `documentLayoutLeft`
- `documentLayoutRight`
- `downloadAlt`
- `dribbble`
- `dropbox`
- `ellipsisH`
- `ellipsisV`
- `entry`
- `exclamationCircle`
- `exclamationOctagon`
- `exclamationTriangle`
- `exit`
- `facebook`
- `facebookF`
- `facebookMessenger`
- `facebookMessengerAlt`
- `favorite`
- `flipH`
- `flipHAlt`
- `flipV`
- `flipVAlt`
- `github`
- `githubAlt`
- `gitlab`
- `gitlabAlt`
- `google`
- `googleDrive`
- `googleDriveAlt`
- `googleHangouts`
- `googleHangoutsAlt`
- `googlePlay`
- `graphBar`
- `grid`
- `grids`
- `gripHorizontalLine`
- `headSide`
- `headSideCough`
- `headSideMask`
- `hipchat`
- `history`
- `historyAlt`
- `horizontalAlignLeft`
- `hospital`
- `hospitalSquareSign`
- `hospitalSymbol`
- `houseUser`
- `html3`
- `html3Alt`
- `html5`
- `html5Alt`
- `imageV`
- `instagram`
- `instagramAlt`
- `intercom`
- `intercomAlt`
- `javaScript`
- `keySkeleton`
- `keySkeletonAlt`
- `keyholeCircle`
- `keyholeSquare`
- `keyholeSquareFull`
- `layerGroup`
- `layersAlt`
- `leftIndent`
- `leftIndentAlt`
- `line`
- `lineSpacing`
- `linkH`
- `linkedin`
- `linkedinAlt`
- `linux`
- `listUiAlt`
- `listUl`
- `lock`
- `lockAccess`
- `lockAlt`
- `lockOpenAlt`
- `lottiefiles`
- `masterCard`
- `mediumM`
- `microscope`
- `microsoft`
- `minusSquareFull`
- `multiply`
- `objectGroup`
- `objectUngroup`
- `okta`
- `opera`
- `operaAlt`
- `padlock`
- `pagelines`
- `pagerduty`
- `paperclip`
- `paragraph`
- `paypal`
- `pentagon`
- `plusSquare`
- `polygon`
- `previous`
- `process`
- `react`
- `recordAudio`
- `redditAlienAlt`
- `redo`
- `refresh`
- `repeat`
- `rightIndentAlt`
- `rocket`
- `ruler`
- `rulerCombined`
- `sanitizer`
- `sanitizerAlt`
- `scenery`
- `schedule`
- `shieldPlus`
- `signIn`
- `signInAlt`
- `signOut`
- `signOutAlt`
- `signalAlt`
- `signalAlt3`
- `signin`
- `signout`
- `skype`
- `skypeAlt`
- `slack`
- `slackAlt`
- `snapchatAlt`
- `snapchatGhost`
- `snapchatSquare`
- `socialDistancing`
- `sorting`
- `spaceKey`
- `square`
- `squareFull`
- `squareShape`
- `squreShape`
- `star`
- `starHalfAlt`
- `stepForward`
- `stethoscope`
- `stethoscopeAlt`
- `storeSlash`
- `subject`
- `swiggy`
- `syncExclamation`
- `syncSlash`
- `table`
- `telegram`
- `telegramAlt`
- `thLarge`
- `timesCircle`
- `toggleOff`
- `toggleOn`
- `toiletPaper`
- `triangle`
- `tumblr`
- `tumblrAlt`
- `tumblrSquare`
- `twitter`
- `twitterAlt`
- `unlock`
- `unlockAlt`
- `uploadAlt`
- `userArrows`
- `userMd`
- `userNurse`
- `vectorSquare`
- `vectorSquareAlt`
- `virusSlash`
- `visualStudio`
- `vk`
- `vkAlt`
- `vuejs`
- `vuejsAlt`
- `webGrid`
- `webGridAlt`
- `webSection`
- `webSectionAlt`
- `whatsapp`
- `windowGrid`
- `windowMaximize`
- `windowSection`
- `windows`
- `wordpress`
- `wordpressSimple`
- `wrapText`
- `youtube`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, AdobeIcon, AdobeAltIcon, AirplayIcon } from '@stacksjs/iconify-uim'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: AdobeIcon({ size: 20, class: 'nav-icon' }),
    contact: AdobeAltIcon({ size: 20, class: 'nav-icon' }),
    settings: AirplayIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-uim'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, AdobeIcon, AdobeAltIcon } from '@stacksjs/iconify-uim'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdobeIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdobeAltIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, AdobeIcon } from '@stacksjs/iconify-uim'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, adobe } from '@stacksjs/iconify-uim'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, AdobeIcon } from '@stacksjs/iconify-uim'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-uim'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-uim'
     global.icon = 500pxIcon({ size: 24 })
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
   const icon = 500pxIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 500px } from '@stacksjs/iconify-uim'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Iconscout/unicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Iconscout ([Website](https://github.com/Iconscout/unicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/uim/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/uim/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
