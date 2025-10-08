# Circum Icons

> Circum Icons icons for stx from Iconify

## Overview

This package provides access to 288 icons from the Circum Icons collection through the stx iconify integration.

**Collection ID:** `circum`
**Total Icons:** 288
**Author:** Klarr Agency ([Website](https://github.com/Klarr-Agency/Circum-Icons))
**License:** Mozilla Public License 2.0 ([Details](https://github.com/Klarr-Agency/Circum-Icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-circum
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AirportSign1Icon, AlarmOffIcon, AlarmOnIcon } from '@stacksjs/iconify-circum'

// Basic usage
const icon = AirportSign1Icon()

// With size
const sizedIcon = AirportSign1Icon({ size: 24 })

// With color
const coloredIcon = AlarmOffIcon({ color: 'red' })

// With multiple props
const customIcon = AlarmOnIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AirportSign1Icon, AlarmOffIcon, AlarmOnIcon } from '@stacksjs/iconify-circum'

  global.icons = {
    home: AirportSign1Icon({ size: 24 }),
    user: AlarmOffIcon({ size: 24, color: '#4a90e2' }),
    settings: AlarmOnIcon({ size: 32 })
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
import { airportSign1, alarmOff, alarmOn } from '@stacksjs/iconify-circum'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(airportSign1, { size: 24 })
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
const redIcon = AirportSign1Icon({ color: 'red' })
const blueIcon = AirportSign1Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AirportSign1Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AirportSign1Icon({ class: 'text-primary' })
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
const icon24 = AirportSign1Icon({ size: 24 })
const icon1em = AirportSign1Icon({ size: '1em' })

// Set individual dimensions
const customIcon = AirportSign1Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AirportSign1Icon({ height: '1em' })
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
const smallIcon = AirportSign1Icon({ class: 'icon-small' })
const largeIcon = AirportSign1Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **288** icons:

- `airportSign1`
- `alarmOff`
- `alarmOn`
- `alignBottom`
- `alignCenterH`
- `alignCenterV`
- `alignLeft`
- `alignRight`
- `alignTop`
- `apple`
- `at`
- `avocado`
- `bacon`
- `badgeDollar`
- `bag1`
- `bandage`
- `bank`
- `barcode`
- `baseball`
- `basketball`
- `batteryCharging`
- `batteryEmpty`
- `batteryFull`
- `beaker1`
- `beerMugFull`
- `bellOff`
- `bellOn`
- `bezier`
- `bitcoin`
- `bluetooth`
- `bookmark`
- `bookmarkCheck`
- `bookmarkMinus`
- `bookmarkPlus`
- `bookmarkRemove`
- `bowlNoodles`
- `boxList`
- `boxes`
- `brightnessDown`
- `brightnessUp`
- `bullhorn`
- `burger`
- `calculator1`
- `calculator2`
- `calendar`
- `calendarDate`
- `camera`
- `chat1`
- `chat2`
- `circleAlert`
- `circleCheck`
- `circleChevDown`
- `circleChevLeft`
- `circleChevRight`
- `circleChevUp`
- `circleInfo`
- `circleList`
- `circleMinus`
- `circleMore`
- `circlePlus`
- `circleQuestion`
- `circleRemove`
- `clock1`
- `clock2`
- `cloud`
- `cloudDrizzle`
- `cloudMoon`
- `cloudOff`
- `cloudOn`
- `cloudRainbow`
- `cloudSun`
- `coffeeBean`
- `coffeeCup`
- `coinInsert`
- `coins1`
- `compass1`
- `creditCard1`
- `creditCard2`
- `creditCardOff`
- `crop`
- `dark`
- `database`
- `deliveryTruck`
- `desktop`
- `desktopMouse1`
- `desktopMouse2`
- `discount1`
- `dollar`
- `droplet`
- `dumbbell`
- `edit`
- `eraser`
- `export`
- `faceFrown`
- `faceMeh`
- `faceSmile`
- `facebook`
- `fileOff`
- `fileOn`
- `filter`
- `flag1`
- `floppyDisk`
- `folderOff`
- `folderOn`
- `football`
- `forkKnife`
- `fries`
- `gift`
- `glass`
- `globe`
- `gps`
- `grid2H`
- `grid2V`
- `grid31`
- `grid32`
- `grid41`
- `grid42`
- `hardDrive`
- `hashtag`
- `headphones`
- `heart`
- `home`
- `hospital1`
- `hotdog`
- `iceCream`
- `imageOff`
- `imageOn`
- `import`
- `inboxIn`
- `inboxOut`
- `indent`
- `instagram`
- `keyboard`
- `laptop`
- `lemon`
- `light`
- `lineHeight`
- `link`
- `linkedin`
- `locationArrow1`
- `locationOff`
- `locationOn`
- `lock`
- `login`
- `logout`
- `lollipop`
- `mail`
- `map`
- `mapPin`
- `maximize1`
- `maximize2`
- `medal`
- `medicalCase`
- `medicalClipboard`
- `medicalCross`
- `medicalMask`
- `memoPad`
- `menuBurger`
- `menuFries`
- `menuKebab`
- `microchip`
- `microphoneOff`
- `microphoneOn`
- `minimize1`
- `minimize2`
- `mobile1`
- `mobile2`
- `mobile3`
- `mobile4`
- `moneyBill`
- `moneyCheck1`
- `monitor`
- `mountain1`
- `mug1`
- `musicNote1`
- `noWaitingSign`
- `palette`
- `paperplane`
- `parking1`
- `passport1`
- `pause1`
- `pen`
- `penpot`
- `percent`
- `phone`
- `pickerEmpty`
- `pickerHalf`
- `pill`
- `pillsBottle1`
- `pizza`
- `plane`
- `play1`
- `plug1`
- `power`
- `rainbow`
- `read`
- `receipt`
- `redo`
- `repeat`
- `rollingSuitcase`
- `route`
- `router`
- `ruler`
- `satellite1`
- `saveDown1`
- `saveDown2`
- `saveUp1`
- `saveUp2`
- `search`
- `server`
- `settings`
- `share1`
- `share2`
- `shirt`
- `shop`
- `shoppingBasket`
- `shoppingCart`
- `shoppingTag`
- `shuffle`
- `signpostDuo1`
- `signpostL1`
- `signpostR1`
- `sliderHorizontal`
- `sliderVertical`
- `speaker`
- `squareAlert`
- `squareCheck`
- `squareChevDown`
- `squareChevLeft`
- `squareChevRight`
- `squareChevUp`
- `squareInfo`
- `squareMinus`
- `squareMore`
- `squarePlus`
- `squareQuestion`
- `squareRemove`
- `star`
- `stethoscope`
- `stickyNote`
- `stop1`
- `stopSign1`
- `stopwatch`
- `streamOff`
- `streamOn`
- `sun`
- `tablets1`
- `tempHigh`
- `text`
- `textAlignCenter`
- `textAlignJustify`
- `textAlignLeft`
- `textAlignRight`
- `timer`
- `trash`
- `trophy`
- `turnL1`
- `turnR1`
- `twitter`
- `umbrella`
- `undo`
- `unlock`
- `unread`
- `usb`
- `user`
- `vault`
- `vial`
- `videoOff`
- `videoOn`
- `viewBoard`
- `viewColumn`
- `viewList`
- `viewTable`
- `viewTimeline`
- `virus`
- `voicemail`
- `volume`
- `volumeHigh`
- `volumeMute`
- `wallet`
- `warning`
- `wavePulse1`
- `wheat`
- `wifiOff`
- `wifiOn`
- `youtube`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AirportSign1Icon, AlarmOffIcon, AlarmOnIcon, AlignBottomIcon } from '@stacksjs/iconify-circum'

  global.navIcons = {
    home: AirportSign1Icon({ size: 20, class: 'nav-icon' }),
    about: AlarmOffIcon({ size: 20, class: 'nav-icon' }),
    contact: AlarmOnIcon({ size: 20, class: 'nav-icon' }),
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
import { AirportSign1Icon } from '@stacksjs/iconify-circum'

const icon = AirportSign1Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AirportSign1Icon, AlarmOffIcon, AlarmOnIcon } from '@stacksjs/iconify-circum'

const successIcon = AirportSign1Icon({ size: 16, color: '#22c55e' })
const warningIcon = AlarmOffIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlarmOnIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AirportSign1Icon, AlarmOffIcon } from '@stacksjs/iconify-circum'
   const icon = AirportSign1Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { airportSign1, alarmOff } from '@stacksjs/iconify-circum'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(airportSign1, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AirportSign1Icon, AlarmOffIcon } from '@stacksjs/iconify-circum'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-circum'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AirportSign1Icon } from '@stacksjs/iconify-circum'
     global.icon = AirportSign1Icon({ size: 24 })
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
   const icon = AirportSign1Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { airportSign1 } from '@stacksjs/iconify-circum'

// Icons are typed as IconData
const myIcon: IconData = airportSign1
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Mozilla Public License 2.0

See [license details](https://github.com/Klarr-Agency/Circum-Icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Klarr Agency ([Website](https://github.com/Klarr-Agency/Circum-Icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/circum/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/circum/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
