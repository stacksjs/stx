# Radix Icons

> Radix Icons icons for stx from Iconify

## Overview

This package provides access to 342 icons from the Radix Icons collection through the stx iconify integration.

**Collection ID:** `radix-icons`
**Total Icons:** 342
**Author:** WorkOS ([Website](https://github.com/radix-ui/icons))
**License:** MIT ([Details](https://github.com/radix-ui/icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-radix-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccessibilityIcon, ActivityLogIcon, AlignBaselineIcon } from '@stacksjs/iconify-radix-icons'

// Basic usage
const icon = AccessibilityIcon()

// With size
const sizedIcon = AccessibilityIcon({ size: 24 })

// With color
const coloredIcon = ActivityLogIcon({ color: 'red' })

// With multiple props
const customIcon = AlignBaselineIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccessibilityIcon, ActivityLogIcon, AlignBaselineIcon } from '@stacksjs/iconify-radix-icons'

  global.icons = {
    home: AccessibilityIcon({ size: 24 }),
    user: ActivityLogIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignBaselineIcon({ size: 32 })
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
import { accessibility, activityLog, alignBaseline } from '@stacksjs/iconify-radix-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility, { size: 24 })
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
const redIcon = AccessibilityIcon({ color: 'red' })
const blueIcon = AccessibilityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccessibilityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccessibilityIcon({ class: 'text-primary' })
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
const icon24 = AccessibilityIcon({ size: 24 })
const icon1em = AccessibilityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccessibilityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccessibilityIcon({ height: '1em' })
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
const smallIcon = AccessibilityIcon({ class: 'icon-small' })
const largeIcon = AccessibilityIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **342** icons:

- `accessibility`
- `activityLog`
- `alignBaseline`
- `alignBottom`
- `alignCenter`
- `alignCenterHorizontally`
- `alignCenterVertically`
- `alignEnd`
- `alignHorizontalCenters`
- `alignLeft`
- `alignRight`
- `alignStart`
- `alignStretch`
- `alignTop`
- `alignVerticalCenters`
- `allSides`
- `angle`
- `archive`
- `arrowBottomLeft`
- `arrowBottomRight`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowTopLeft`
- `arrowTopRight`
- `arrowUp`
- `aspectRatio`
- `avatar`
- `backpack`
- `badge`
- `barChart`
- `bell`
- `blendingMode`
- `bookmark`
- `bookmarkFilled`
- `borderAll`
- `borderBottom`
- `borderDashed`
- `borderDotted`
- `borderLeft`
- `borderNone`
- `borderRight`
- `borderSolid`
- `borderSplit`
- `borderStyle`
- `borderTop`
- `borderWidth`
- `box`
- `boxModel`
- `button`
- `calendar`
- `camera`
- `cardStack`
- `cardStackMinus`
- `cardStackPlus`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretSort`
- `caretUp`
- `chatBubble`
- `check`
- `checkCircled`
- `checkbox`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `circle`
- `circleBackslash`
- `clipboard`
- `clipboardCopy`
- `clock`
- `code`
- `codesandboxLogo`
- `colorWheel`
- `columnSpacing`
- `columns`
- `commit`
- `component1`
- `component2`
- `componentBoolean`
- `componentInstance`
- `componentNone`
- `componentPlaceholder`
- `container`
- `cookie`
- `copy`
- `cornerBottomLeft`
- `cornerBottomRight`
- `cornerTopLeft`
- `cornerTopRight`
- `corners`
- `countdownTimer`
- `counterClockwiseClock`
- `crop`
- `cross1`
- `cross2`
- `crossCircled`
- `crosshair1`
- `crosshair2`
- `crumpledPaper`
- `cube`
- `cursorArrow`
- `cursorText`
- `dash`
- `dashboard`
- `database`
- `desktop`
- `dimensions`
- `disc`
- `discordLogo`
- `dividerHorizontal`
- `dividerVertical`
- `dot`
- `dotFilled`
- `dotsHorizontal`
- `dotsVertical`
- `doubleArrowDown`
- `doubleArrowLeft`
- `doubleArrowRight`
- `doubleArrowUp`
- `download`
- `dragHandleDots1`
- `dragHandleDots2`
- `dragHandleHorizontal`
- `dragHandleVertical`
- `drawingPin`
- `drawingPinFilled`
- `dropdownMenu`
- `enter`
- `enterFullScreen`
- `envelopeClosed`
- `envelopeOpen`
- `eraser`
- `exclamationCircled`
- `exclamationMark`
- `exclamationTriangle`
- `exit`
- `exitFullScreen`
- `externalLink`
- `eyeClosed`
- `eyeNone`
- `eyeOpen`
- `face`
- `figmaLogo`
- `file`
- `fileMinus`
- `filePlus`
- `fileText`
- `filter`
- `fontBold`
- `fontFamily`
- `fontItalic`
- `fontRoman`
- `fontSize`
- `fontStyle`
- `frame`
- `framerLogo`
- `gear`
- `githubLogo`
- `globe`
- `globe2`
- `grid`
- `group`
- `half1`
- `half2`
- `hamburgerMenu`
- `hand`
- `heading`
- `heart`
- `heartFilled`
- `height`
- `hobbyKnife`
- `home`
- `iconjarLogo`
- `idCard`
- `image`
- `infoCircled`
- `input`
- `instagramLogo`
- `justifyCenter`
- `justifyEnd`
- `justifyStart`
- `justifyStretch`
- `keyboard`
- `lapTimer`
- `laptop`
- `layers`
- `layout`
- `letterCaseCapitalize`
- `letterCaseLowercase`
- `letterCaseToggle`
- `letterCaseUppercase`
- `letterSpacing`
- `lightningBolt`
- `lineHeight`
- `link1`
- `link2`
- `linkBreak1`
- `linkBreak2`
- `linkNone1`
- `linkNone2`
- `linkedinLogo`
- `listBullet`
- `lockClosed`
- `lockOpen1`
- `lockOpen2`
- `loop`
- `magicWand`
- `magnifyingGlass`
- `margin`
- `maskOff`
- `maskOn`
- `minimize`
- `minus`
- `minusCircled`
- `mix`
- `mixerHorizontal`
- `mixerVertical`
- `mobile`
- `modulzLogo`
- `moon`
- `move`
- `notionLogo`
- `opacity`
- `openInNewWindow`
- `overline`
- `padding`
- `panelBottom`
- `panelBottomMinimized`
- `panelLeft`
- `panelLeftMinimized`
- `panelRight`
- `panelRightMinimized`
- `paperPlane`
- `pause`
- `pencil1`
- `pencil2`
- `people`
- `person`
- `pieChart`
- `pilcrow`
- `pinBottom`
- `pinLeft`
- `pinRight`
- `pinTop`
- `play`
- `plus`
- `plusCircled`
- `questionMark`
- `questionMarkCircled`
- `quote`
- `radiobutton`
- `reader`
- `reload`
- `reset`
- `resume`
- `rocket`
- `rotateCounterClockwise`
- `rowSpacing`
- `rows`
- `rulerHorizontal`
- `rulerSquare`
- `scissors`
- `section`
- `server`
- `sewingPin`
- `sewingPinFilled`
- `shadow`
- `shadowInner`
- `shadowNone`
- `shadowOuter`
- `share1`
- `share2`
- `shuffle`
- `size`
- `sketchLogo`
- `slash`
- `slider`
- `spaceBetweenHorizontally`
- `spaceBetweenVertically`
- `spaceEvenlyHorizontally`
- `spaceEvenlyVertically`
- `speakerLoud`
- `speakerModerate`
- `speakerOff`
- `speakerQuiet`
- `square`
- `stack`
- `star`
- `starFilled`
- `stitchesLogo`
- `stop`
- `stopwatch`
- `stretchHorizontally`
- `stretchVertically`
- `strikethrough`
- `sun`
- `switch`
- `symbol`
- `table`
- `target`
- `text`
- `textAlignBottom`
- `textAlignCenter`
- `textAlignJustify`
- `textAlignLeft`
- `textAlignMiddle`
- `textAlignRight`
- `textAlignTop`
- `textNone`
- `thickArrowDown`
- `thickArrowLeft`
- `thickArrowRight`
- `thickArrowUp`
- `timer`
- `tokens`
- `trackNext`
- `trackPrevious`
- `transform`
- `transparencyGrid`
- `trash`
- `triangleDown`
- `triangleLeft`
- `triangleRight`
- `triangleUp`
- `twitterLogo`
- `underline`
- `update`
- `upload`
- `value`
- `valueNone`
- `vercelLogo`
- `video`
- `viewGrid`
- `viewHorizontal`
- `viewNone`
- `viewVertical`
- `width`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccessibilityIcon, ActivityLogIcon, AlignBaselineIcon, AlignBottomIcon } from '@stacksjs/iconify-radix-icons'

  global.navIcons = {
    home: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    about: ActivityLogIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignBaselineIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignBottomIcon({ size: 20, class: 'nav-icon' })
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
import { AccessibilityIcon } from '@stacksjs/iconify-radix-icons'

const icon = AccessibilityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccessibilityIcon, ActivityLogIcon, AlignBaselineIcon } from '@stacksjs/iconify-radix-icons'

const successIcon = AccessibilityIcon({ size: 16, color: '#22c55e' })
const warningIcon = ActivityLogIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignBaselineIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccessibilityIcon, ActivityLogIcon } from '@stacksjs/iconify-radix-icons'
   const icon = AccessibilityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility, activityLog } from '@stacksjs/iconify-radix-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccessibilityIcon, ActivityLogIcon } from '@stacksjs/iconify-radix-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-radix-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccessibilityIcon } from '@stacksjs/iconify-radix-icons'
     global.icon = AccessibilityIcon({ size: 24 })
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
   const icon = AccessibilityIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility } from '@stacksjs/iconify-radix-icons'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/radix-ui/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: WorkOS ([Website](https://github.com/radix-ui/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/radix-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/radix-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
