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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />

<!-- Using width and height -->
<AccessibilityIcon width="24" height="32" />

<!-- With color -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccessibilityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccessibilityIcon
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
    <AccessibilityIcon size="24" />
    <ActivityLogIcon size="24" color="#4a90e2" />
    <AlignBaselineIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccessibilityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccessibilityIcon size="24" class="text-primary" />
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
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.radixIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccessibilityIcon class="radixIcons-icon" />
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
<nav>
  <a href="/"><AccessibilityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><ActivityLogIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignBaselineIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignBottomIcon size="20" class="nav-icon" /> Settings</a>
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
<AccessibilityIcon
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
    <AccessibilityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <ActivityLogIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignBaselineIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccessibilityIcon size="24" />
   <ActivityLogIcon size="24" color="#4a90e2" />
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
   <AccessibilityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccessibilityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccessibilityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-radix-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessibility, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
