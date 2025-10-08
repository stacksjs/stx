# Material Design Light

> Material Design Light icons for stx from Iconify

## Overview

This package provides access to 304 icons from the Material Design Light collection through the stx iconify integration.

**Collection ID:** `mdi-light`
**Total Icons:** 304
**Author:** Pictogrammers ([Website](https://github.com/Templarian/MaterialDesignLight))
**License:** Open Font License ([Details](https://github.com/Templarian/MaterialDesignLight/blob/master/LICENSE.md))
**Category:** Material
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-mdi-light
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccountIcon height="1em" />
<AccountIcon width="1em" height="1em" />
<AccountIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccountIcon size="24" />
<AccountIcon size="1em" />

<!-- Using width and height -->
<AccountIcon width="24" height="32" />

<!-- With color -->
<AccountIcon size="24" color="red" />
<AccountIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccountIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccountIcon
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
    <AccountIcon size="24" />
    <AccountAlertIcon size="24" color="#4a90e2" />
    <AlarmIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { account, accountAlert, alarm } from '@stacksjs/iconify-mdi-light'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(account, { size: 24 })
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
<AccountIcon size="24" color="red" />
<AccountIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccountIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccountIcon size="24" class="text-primary" />
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
<AccountIcon height="1em" />
<AccountIcon width="1em" height="1em" />
<AccountIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccountIcon size="24" />
<AccountIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.mdiLight-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccountIcon class="mdiLight-icon" />
```

## Available Icons

This package contains **304** icons:

- `account`
- `accountAlert`
- `alarm`
- `alarmPanel`
- `alarmPlus`
- `alert`
- `alertCircle`
- `alertOctagon`
- `arrangeBringForward`
- `arrangeBringToFront`
- `arrangeSendBackward`
- `arrangeSendToBack`
- `arrowDown`
- `arrowDownCircle`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowRight`
- `arrowRightCircle`
- `arrowUp`
- `arrowUpCircle`
- `bank`
- `baseballDiamond`
- `bell`
- `bellOff`
- `bellPlus`
- `bluetooth`
- `book`
- `bookMultiple`
- `bookPlus`
- `bookmark`
- `borderAll`
- `borderBottom`
- `borderHorizontal`
- `borderInside`
- `borderLeft`
- `borderNone`
- `borderOutside`
- `borderRight`
- `borderTop`
- `borderVertical`
- `briefcase`
- `bullhorn`
- `calendar`
- `camcorder`
- `camera`
- `cancel`
- `cart`
- `chartAreaspline`
- `chartBar`
- `chartHistogram`
- `chartLine`
- `chartPie`
- `check`
- `checkBold`
- `checkCircle`
- `chevronDoubleDown`
- `chevronDoubleLeft`
- `chevronDoubleRight`
- `chevronDoubleUp`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `circle`
- `clipboard`
- `clipboardCheck`
- `clipboardPlus`
- `clipboardText`
- `clock`
- `closedCaption`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `cog`
- `comment`
- `commentAlert`
- `commentText`
- `console`
- `contentCut`
- `contentDuplicate`
- `contentPaste`
- `contentSave`
- `contentSaveAll`
- `creditCard`
- `creditCardScan`
- `crop`
- `cropFree`
- `currencyEur`
- `currencyGbp`
- `currencyRub`
- `currencyUsd`
- `delete`
- `diamond`
- `diamondStone`
- `dotsHorizontal`
- `dotsVertical`
- `download`
- `eject`
- `email`
- `emailOpen`
- `equalizer`
- `ereader`
- `eye`
- `eyeOff`
- `faceMask`
- `factory`
- `fastForward`
- `file`
- `fileAlert`
- `fileMultiple`
- `filePlus`
- `filmstrip`
- `flag`
- `flash`
- `flask`
- `flaskEmpty`
- `folder`
- `folderMultiple`
- `folderPlus`
- `formatAlignBottom`
- `formatAlignCenter`
- `formatAlignJustify`
- `formatAlignLeft`
- `formatAlignMiddle`
- `formatAlignRight`
- `formatAlignTop`
- `formatBold`
- `formatClear`
- `formatFloatCenter`
- `formatFloatLeft`
- `formatFloatNone`
- `formatFloatRight`
- `formatIndentDecrease`
- `formatIndentIncrease`
- `formatItalic`
- `formatLineSpacing`
- `formatListBulleted`
- `formatListChecks`
- `formatListNumbered`
- `formatListNumbers`
- `formatQuoteClose`
- `formatQuoteOpen`
- `formatUnderline`
- `formatWrapInline`
- `formatWrapSquare`
- `formatWrapTight`
- `formatWrapTopBottom`
- `forum`
- `fullscreen`
- `fullscreenClose`
- `fullscreenExit`
- `genderFemale`
- `genderMale`
- `genderMaleFemale`
- `genderTransgender`
- `gift`
- `grid`
- `gridLarge`
- `gridOff`
- `group`
- `hamburger`
- `heart`
- `heartHalf`
- `heartOff`
- `help`
- `helpCircle`
- `hexagon`
- `home`
- `image`
- `inbox`
- `information`
- `label`
- `layers`
- `lightbulb`
- `lightbulbOn`
- `link`
- `linkVariant`
- `loading`
- `lock`
- `lockOpen`
- `lockUnlocked`
- `login`
- `logout`
- `magnify`
- `magnifyMinus`
- `magnifyPlus`
- `mapMarker`
- `memory`
- `menu`
- `message`
- `messageAlert`
- `messageImage`
- `messagePhoto`
- `messageProcessing`
- `messageReply`
- `messageText`
- `messageVideo`
- `microphone`
- `microphoneOff`
- `minus`
- `minusBox`
- `minusCircle`
- `monitor`
- `monitorMultiple`
- `music`
- `musicOff`
- `nfc`
- `nfcVariant`
- `note`
- `noteMultiple`
- `notePlus`
- `noteText`
- `octagon`
- `paperclip`
- `pause`
- `pencil`
- `phone`
- `picture`
- `pin`
- `pinOff`
- `play`
- `plus`
- `plusBox`
- `plusCircle`
- `power`
- `presentation`
- `presentationPlay`
- `printer`
- `redoVariant`
- `refresh`
- `repeat`
- `repeatOff`
- `repeatOnce`
- `rewind`
- `rhombus`
- `rss`
- `script`
- `seekNext`
- `seekPrevious`
- `settings`
- `shapeCircle`
- `shapeHexagon`
- `shapeOctagon`
- `shapeRhombus`
- `shapeSquare`
- `shapeTriangle`
- `share`
- `shareVariant`
- `shield`
- `shuffle`
- `signal`
- `sim`
- `simAlert`
- `simOff`
- `sitemap`
- `skipNext`
- `skipPrevious`
- `sleep`
- `sleepOff`
- `spellcheck`
- `square`
- `star`
- `starHalf`
- `stop`
- `tab`
- `tabPlus`
- `table`
- `taco`
- `tag`
- `television`
- `thumbDown`
- `thumbUp`
- `thumbsUpDown`
- `tooltip`
- `tooltipText`
- `triangle`
- `trophy`
- `truck`
- `undoVariant`
- `unfoldLessHorizontal`
- `unfoldLessVertical`
- `unfoldMoreHorizontal`
- `unfoldMoreVertical`
- `ungroup`
- `upload`
- `vectorArrangeAbove`
- `vectorArrangeBelow`
- `vectorCombine`
- `vectorDifference`
- `vectorDifferenceAb`
- `vectorDifferenceBa`
- `vectorIntersection`
- `vectorUnion`
- `viewDashboard`
- `viewModule`
- `volume`
- `volumeHigh`
- `volumeMinus`
- `volumeMute`
- `volumeOff`
- `volumePlus`
- `wallet`
- `wifi`
- `xml`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccountIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccountAlertIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlarmPanelIcon size="20" class="nav-icon" /> Settings</a>
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
<AccountIcon
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
    <AccountIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccountAlertIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccountIcon size="24" />
   <AccountAlertIcon size="24" color="#4a90e2" />
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
   <AccountIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccountIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccountIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { account } from '@stacksjs/iconify-mdi-light'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(account, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { account } from '@stacksjs/iconify-mdi-light'

// Icons are typed as IconData
const myIcon: IconData = account
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://github.com/Templarian/MaterialDesignLight/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: Pictogrammers ([Website](https://github.com/Templarian/MaterialDesignLight))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/mdi-light/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/mdi-light/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
