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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<500pxIcon size="24" />
<500pxIcon size="1em" />

<!-- Using width and height -->
<500pxIcon width="24" height="32" />

<!-- With color -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<500pxIcon size="24" class="icon-primary" />

<!-- With all properties -->
<500pxIcon
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
    <500pxIcon size="24" />
    <AdobeIcon size="24" color="#4a90e2" />
    <AdobeAltIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<500pxIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<500pxIcon size="24" class="text-primary" />
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
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<500pxIcon size="24" />
<500pxIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.uim-icon {
  width: 1em;
  height: 1em;
}
```

```html
<500pxIcon class="uim-icon" />
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
<nav>
  <a href="/"><500pxIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdobeIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdobeAltIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AirplayIcon size="20" class="nav-icon" /> Settings</a>
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
<500pxIcon
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
    <500pxIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdobeIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdobeAltIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <500pxIcon size="24" />
   <AdobeIcon size="24" color="#4a90e2" />
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
   <500pxIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <500pxIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <500pxIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-uim'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(500px, { size: 24 })
   @endjs

   {!! customIcon !!}
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
