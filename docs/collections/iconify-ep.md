# Element Plus

> Element Plus icons for stx from Iconify

## Overview

This package provides access to 293 icons from the Element Plus collection through the stx iconify integration.

**Collection ID:** `ep`
**Total Icons:** 293
**Author:** Element Plus ([Website](https://github.com/element-plus/element-plus-icons))
**License:** MIT ([Details](https://github.com/element-plus/element-plus-icons/blob/main/packages/svg/package.json))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ep
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddLocationIcon, AimIcon, AlarmClockIcon } from '@stacksjs/iconify-ep'

// Basic usage
const icon = AddLocationIcon()

// With size
const sizedIcon = AddLocationIcon({ size: 24 })

// With color
const coloredIcon = AimIcon({ color: 'red' })

// With multiple props
const customIcon = AlarmClockIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddLocationIcon, AimIcon, AlarmClockIcon } from '@stacksjs/iconify-ep'

  global.icons = {
    home: AddLocationIcon({ size: 24 }),
    user: AimIcon({ size: 24, color: '#4a90e2' }),
    settings: AlarmClockIcon({ size: 32 })
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
import { addLocation, aim, alarmClock } from '@stacksjs/iconify-ep'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addLocation, { size: 24 })
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
const redIcon = AddLocationIcon({ color: 'red' })
const blueIcon = AddLocationIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddLocationIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddLocationIcon({ class: 'text-primary' })
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
const icon24 = AddLocationIcon({ size: 24 })
const icon1em = AddLocationIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddLocationIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddLocationIcon({ height: '1em' })
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
const smallIcon = AddLocationIcon({ class: 'icon-small' })
const largeIcon = AddLocationIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **293** icons:

- `addLocation`
- `aim`
- `alarmClock`
- `apple`
- `arrowDown`
- `arrowDownBold`
- `arrowLeft`
- `arrowLeftBold`
- `arrowRight`
- `arrowRightBold`
- `arrowUp`
- `arrowUpBold`
- `avatar`
- `back`
- `baseball`
- `basketball`
- `bell`
- `bellFilled`
- `bicycle`
- `bottom`
- `bottomLeft`
- `bottomRight`
- `bowl`
- `box`
- `briefcase`
- `brush`
- `brushFilled`
- `burger`
- `calendar`
- `camera`
- `cameraFilled`
- `caretBottom`
- `caretLeft`
- `caretRight`
- `caretTop`
- `cellphone`
- `chatDotRound`
- `chatDotSquare`
- `chatLineRound`
- `chatLineSquare`
- `chatRound`
- `chatSquare`
- `check`
- `checked`
- `cherry`
- `chicken`
- `chromeFilled`
- `circleCheck`
- `circleCheckFilled`
- `circleClose`
- `circleCloseFilled`
- `circlePlus`
- `circlePlusFilled`
- `clock`
- `close`
- `closeBold`
- `cloudy`
- `coffee`
- `coffeeCup`
- `coin`
- `coldDrink`
- `collection`
- `collectionTag`
- `comment`
- `compass`
- `connection`
- `coordinate`
- `copyDocument`
- `cpu`
- `creditCard`
- `crop`
- `dArrowLeft`
- `dArrowRight`
- `dCaret`
- `dataAnalysis`
- `dataBoard`
- `dataLine`
- `delete`
- `deleteFilled`
- `deleteLocation`
- `dessert`
- `discount`
- `dish`
- `dishDot`
- `document`
- `documentAdd`
- `documentChecked`
- `documentCopy`
- `documentDelete`
- `documentRemove`
- `download`
- `drizzling`
- `edit`
- `editPen`
- `eleme`
- `elemeFilled`
- `elementPlus`
- `expand`
- `failed`
- `female`
- `files`
- `film`
- `filter`
- `finished`
- `firstAidKit`
- `flag`
- `fold`
- `folder`
- `folderAdd`
- `folderChecked`
- `folderDelete`
- `folderOpened`
- `folderRemove`
- `food`
- `football`
- `forkSpoon`
- `fries`
- `fullScreen`
- `goblet`
- `gobletFull`
- `gobletSquare`
- `gobletSquareFull`
- `goldMedal`
- `goods`
- `goodsFilled`
- `grape`
- `grid`
- `guide`
- `handbag`
- `headset`
- `help`
- `helpFilled`
- `hide`
- `histogram`
- `homeFilled`
- `hotWater`
- `house`
- `iceCream`
- `iceCreamRound`
- `iceCreamSquare`
- `iceDrink`
- `iceTea`
- `infoFilled`
- `iphone`
- `key`
- `knifeFork`
- `lightning`
- `link`
- `list`
- `loading`
- `location`
- `locationFilled`
- `locationInformation`
- `lock`
- `lollipop`
- `magicStick`
- `magnet`
- `male`
- `management`
- `mapLocation`
- `medal`
- `memo`
- `menu`
- `message`
- `messageBox`
- `mic`
- `microphone`
- `milkTea`
- `minus`
- `money`
- `monitor`
- `moon`
- `moonNight`
- `more`
- `moreFilled`
- `mostlyCloudy`
- `mouse`
- `mug`
- `mute`
- `muteNotification`
- `noSmoking`
- `notebook`
- `notification`
- `odometer`
- `officeBuilding`
- `open`
- `operation`
- `opportunity`
- `orange`
- `paperclip`
- `partlyCloudy`
- `pear`
- `phone`
- `phoneFilled`
- `picture`
- `pictureFilled`
- `pictureRounded`
- `pieChart`
- `place`
- `platform`
- `plus`
- `pointer`
- `position`
- `postcard`
- `pouring`
- `present`
- `priceTag`
- `printer`
- `promotion`
- `quartzWatch`
- `questionFilled`
- `rank`
- `reading`
- `readingLamp`
- `refresh`
- `refreshLeft`
- `refreshRight`
- `refrigerator`
- `remove`
- `removeFilled`
- `right`
- `scaleToOriginal`
- `school`
- `scissor`
- `search`
- `select`
- `sell`
- `semiSelect`
- `service`
- `setUp`
- `setting`
- `share`
- `ship`
- `shop`
- `shoppingBag`
- `shoppingCart`
- `shoppingCartFull`
- `shoppingTrolley`
- `smoking`
- `soccer`
- `soldOut`
- `sort`
- `sortDown`
- `sortUp`
- `stamp`
- `star`
- `starFilled`
- `stopwatch`
- `successFilled`
- `sugar`
- `suitcase`
- `suitcaseLine`
- `sunny`
- `sunrise`
- `sunset`
- `switch`
- `switchButton`
- `switchFilled`
- `takeawayBox`
- `ticket`
- `tickets`
- `timer`
- `toiletPaper`
- `tools`
- `top`
- `topLeft`
- `topRight`
- `trendCharts`
- `trophy`
- `trophyBase`
- `turnOff`
- `umbrella`
- `unlock`
- `upload`
- `uploadFilled`
- `user`
- `userFilled`
- `van`
- `videoCamera`
- `videoCameraFilled`
- `videoPause`
- `videoPlay`
- `view`
- `wallet`
- `walletFilled`
- `warnTriangleFilled`
- `warning`
- `warningFilled`
- `watch`
- `watermelon`
- `windPower`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddLocationIcon, AimIcon, AlarmClockIcon, AppleIcon } from '@stacksjs/iconify-ep'

  global.navIcons = {
    home: AddLocationIcon({ size: 20, class: 'nav-icon' }),
    about: AimIcon({ size: 20, class: 'nav-icon' }),
    contact: AlarmClockIcon({ size: 20, class: 'nav-icon' }),
    settings: AppleIcon({ size: 20, class: 'nav-icon' })
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
import { AddLocationIcon } from '@stacksjs/iconify-ep'

const icon = AddLocationIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddLocationIcon, AimIcon, AlarmClockIcon } from '@stacksjs/iconify-ep'

const successIcon = AddLocationIcon({ size: 16, color: '#22c55e' })
const warningIcon = AimIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlarmClockIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddLocationIcon, AimIcon } from '@stacksjs/iconify-ep'
   const icon = AddLocationIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addLocation, aim } from '@stacksjs/iconify-ep'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addLocation, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddLocationIcon, AimIcon } from '@stacksjs/iconify-ep'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-ep'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddLocationIcon } from '@stacksjs/iconify-ep'
     global.icon = AddLocationIcon({ size: 24 })
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
   const icon = AddLocationIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addLocation } from '@stacksjs/iconify-ep'

// Icons are typed as IconData
const myIcon: IconData = addLocation
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/element-plus/element-plus-icons/blob/main/packages/svg/package.json) for more information.

## Credits

- **Icons**: Element Plus ([Website](https://github.com/element-plus/element-plus-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ep/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ep/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
