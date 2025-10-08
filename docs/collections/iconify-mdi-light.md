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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccountIcon, AccountAlertIcon, AlarmIcon } from '@stacksjs/iconify-mdi-light'

// Basic usage
const icon = AccountIcon()

// With size
const sizedIcon = AccountIcon({ size: 24 })

// With color
const coloredIcon = AccountAlertIcon({ color: 'red' })

// With multiple props
const customIcon = AlarmIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccountIcon, AccountAlertIcon, AlarmIcon } from '@stacksjs/iconify-mdi-light'

  global.icons = {
    home: AccountIcon({ size: 24 }),
    user: AccountAlertIcon({ size: 24, color: '#4a90e2' }),
    settings: AlarmIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AccountIcon({ color: 'red' })
const blueIcon = AccountIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccountIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccountIcon({ class: 'text-primary' })
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
const icon24 = AccountIcon({ size: 24 })
const icon1em = AccountIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccountIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccountIcon({ height: '1em' })
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
const smallIcon = AccountIcon({ class: 'icon-small' })
const largeIcon = AccountIcon({ class: 'icon-large' })
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
@js
  import { AccountIcon, AccountAlertIcon, AlarmIcon, AlarmPanelIcon } from '@stacksjs/iconify-mdi-light'

  global.navIcons = {
    home: AccountIcon({ size: 20, class: 'nav-icon' }),
    about: AccountAlertIcon({ size: 20, class: 'nav-icon' }),
    contact: AlarmIcon({ size: 20, class: 'nav-icon' }),
    settings: AlarmPanelIcon({ size: 20, class: 'nav-icon' })
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
import { AccountIcon } from '@stacksjs/iconify-mdi-light'

const icon = AccountIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccountIcon, AccountAlertIcon, AlarmIcon } from '@stacksjs/iconify-mdi-light'

const successIcon = AccountIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccountAlertIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlarmIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccountIcon, AccountAlertIcon } from '@stacksjs/iconify-mdi-light'
   const icon = AccountIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { account, accountAlert } from '@stacksjs/iconify-mdi-light'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(account, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccountIcon, AccountAlertIcon } from '@stacksjs/iconify-mdi-light'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-mdi-light'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccountIcon } from '@stacksjs/iconify-mdi-light'
     global.icon = AccountIcon({ size: 24 })
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
   const icon = AccountIcon({ class: 'icon' })
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
