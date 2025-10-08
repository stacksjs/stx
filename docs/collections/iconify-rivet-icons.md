# Rivet Icons

> Rivet Icons icons for stx from Iconify

## Overview

This package provides access to 210 icons from the Rivet Icons collection through the stx iconify integration.

**Collection ID:** `rivet-icons`
**Total Icons:** 210
**Author:** Indiana University ([Website](https://github.com/indiana-university/rivet-icons))
**License:** BSD 3-Clause ([Details](https://github.com/indiana-university/rivet-icons/blob/develop/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-rivet-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AlarmIcon, AlarmSolidIcon, ArrowAnchorDownLeftIcon } from '@stacksjs/iconify-rivet-icons'

// Basic usage
const icon = AlarmIcon()

// With size
const sizedIcon = AlarmIcon({ size: 24 })

// With color
const coloredIcon = AlarmSolidIcon({ color: 'red' })

// With multiple props
const customIcon = ArrowAnchorDownLeftIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AlarmIcon, AlarmSolidIcon, ArrowAnchorDownLeftIcon } from '@stacksjs/iconify-rivet-icons'

  global.icons = {
    home: AlarmIcon({ size: 24 }),
    user: AlarmSolidIcon({ size: 24, color: '#4a90e2' }),
    settings: ArrowAnchorDownLeftIcon({ size: 32 })
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
import { alarm, alarmSolid, arrowAnchorDownLeft } from '@stacksjs/iconify-rivet-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(alarm, { size: 24 })
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
const redIcon = AlarmIcon({ color: 'red' })
const blueIcon = AlarmIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AlarmIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AlarmIcon({ class: 'text-primary' })
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
const icon24 = AlarmIcon({ size: 24 })
const icon1em = AlarmIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AlarmIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AlarmIcon({ height: '1em' })
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
const smallIcon = AlarmIcon({ class: 'icon-small' })
const largeIcon = AlarmIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **210** icons:

- `alarm`
- `alarmSolid`
- `arrowAnchorDownLeft`
- `arrowAnchorDownRight`
- `arrowAnchorUpLeft`
- `arrowAnchorUpRight`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpRight`
- `audio`
- `audioOff`
- `audioOffSolid`
- `audioSolid`
- `ban`
- `banSolid`
- `bell`
- `bellSolid`
- `bookmark`
- `bookmarkSolid`
- `browserWindow`
- `browserWindowSolid`
- `building`
- `buildingSolid`
- `bus`
- `calendar`
- `calendarSolid`
- `caution`
- `cautionSolid`
- `chat`
- `chatSolid`
- `check`
- `checkAll`
- `checkCircle`
- `checkCircleBreakout`
- `checkCircleSolid`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chevronsLeft`
- `chevronsRight`
- `circle`
- `circleSolid`
- `clipboard`
- `clipboardSolid`
- `clock`
- `clockSolid`
- `close`
- `closeCircle`
- `closeCircleSolid`
- `code`
- `collapse`
- `copy`
- `copySolid`
- `creditCard`
- `creditCardSolid`
- `css`
- `data`
- `dataSolid`
- `device`
- `deviceSolid`
- `download`
- `ellipsis`
- `ellipsisVertical`
- `envelope`
- `envelopeSolid`
- `exclamationMark`
- `exclamationMarkCircle`
- `exclamationMarkCircleSolid`
- `expand`
- `eye`
- `eyeOff`
- `eyeOffSolid`
- `eyeSolid`
- `file`
- `fileSolid`
- `filter`
- `filterSolid`
- `flag`
- `flagSolid`
- `gear`
- `gearSolid`
- `gears`
- `globe`
- `globeSolid`
- `grid`
- `gridHorizontal`
- `gridSolid`
- `gridVertical`
- `happy`
- `happySolid`
- `headphones`
- `headphonesSolid`
- `heart`
- `heartSolid`
- `home`
- `homeSolid`
- `image`
- `imageSolid`
- `inbox`
- `inboxComplete`
- `inboxCompleteSolid`
- `inboxSolid`
- `infoCircle`
- `infoCircleSolid`
- `laptop`
- `laptopSolid`
- `lightning`
- `lightningBox`
- `lightningBoxSolid`
- `link`
- `linkExternal`
- `list`
- `lockClosed`
- `lockClosedSolid`
- `lockOpen`
- `lockOpenSolid`
- `magnifyingGlass`
- `mapPin`
- `mapPinSolid`
- `megaphone`
- `megaphoneSolid`
- `menu`
- `microphone`
- `microphoneOff`
- `microphoneOffSolid`
- `microphoneSolid`
- `minus`
- `minusCircle`
- `minusCircleSolid`
- `money`
- `neutral`
- `neutralSolid`
- `newspaper`
- `newspaperSolid`
- `note`
- `noteSolid`
- `orderedList`
- `pageBottom`
- `pageTop`
- `parking`
- `parkingSolid`
- `pause`
- `pencil`
- `pencilSolid`
- `phone`
- `phoneMobile`
- `phoneMobileSolid`
- `pin`
- `pinSolid`
- `plane`
- `planeSolid`
- `play`
- `playSolid`
- `plus`
- `plusCircle`
- `plusCircleSolid`
- `printer`
- `printerSolid`
- `questionMark`
- `questionMarkSolid`
- `redo`
- `rss`
- `sad`
- `sadSolid`
- `save`
- `saveSolid`
- `settings`
- `share`
- `shareSolid`
- `shirt`
- `shirtSolid`
- `shoppingBag`
- `shoppingBagSolid`
- `shoppingCart`
- `shoppingCartSolid`
- `sidebyside`
- `sidebysideSolid`
- `star`
- `starSolid`
- `sync`
- `thumbsDown`
- `thumbsDownSolid`
- `thumbsUp`
- `thumbsUpSolid`
- `transfer`
- `transferAlt`
- `trash`
- `trashSolid`
- `undo`
- `upload`
- `user`
- `userAdd`
- `userAddSolid`
- `userGroup`
- `userGroupSolid`
- `userRemove`
- `userRemoveSolid`
- `userSolid`
- `utensils`
- `utensilsSolid`
- `video`
- `videoOff`
- `videoOffSolid`
- `videoSolid`

## Usage Examples

### Navigation Menu

```html
@js
  import { AlarmIcon, AlarmSolidIcon, ArrowAnchorDownLeftIcon, ArrowAnchorDownRightIcon } from '@stacksjs/iconify-rivet-icons'

  global.navIcons = {
    home: AlarmIcon({ size: 20, class: 'nav-icon' }),
    about: AlarmSolidIcon({ size: 20, class: 'nav-icon' }),
    contact: ArrowAnchorDownLeftIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowAnchorDownRightIcon({ size: 20, class: 'nav-icon' })
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
import { AlarmIcon } from '@stacksjs/iconify-rivet-icons'

const icon = AlarmIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AlarmIcon, AlarmSolidIcon, ArrowAnchorDownLeftIcon } from '@stacksjs/iconify-rivet-icons'

const successIcon = AlarmIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlarmSolidIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArrowAnchorDownLeftIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AlarmIcon, AlarmSolidIcon } from '@stacksjs/iconify-rivet-icons'
   const icon = AlarmIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { alarm, alarmSolid } from '@stacksjs/iconify-rivet-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(alarm, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AlarmIcon, AlarmSolidIcon } from '@stacksjs/iconify-rivet-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-rivet-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AlarmIcon } from '@stacksjs/iconify-rivet-icons'
     global.icon = AlarmIcon({ size: 24 })
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
   const icon = AlarmIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { alarm } from '@stacksjs/iconify-rivet-icons'

// Icons are typed as IconData
const myIcon: IconData = alarm
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

BSD 3-Clause

See [license details](https://github.com/indiana-university/rivet-icons/blob/develop/LICENSE) for more information.

## Credits

- **Icons**: Indiana University ([Website](https://github.com/indiana-university/rivet-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/rivet-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/rivet-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
