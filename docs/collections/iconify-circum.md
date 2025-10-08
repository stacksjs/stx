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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AirportSign1Icon height="1em" />
<AirportSign1Icon width="1em" height="1em" />
<AirportSign1Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AirportSign1Icon size="24" />
<AirportSign1Icon size="1em" />

<!-- Using width and height -->
<AirportSign1Icon width="24" height="32" />

<!-- With color -->
<AirportSign1Icon size="24" color="red" />
<AirportSign1Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AirportSign1Icon size="24" class="icon-primary" />

<!-- With all properties -->
<AirportSign1Icon
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
    <AirportSign1Icon size="24" />
    <AlarmOffIcon size="24" color="#4a90e2" />
    <AlarmOnIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AirportSign1Icon size="24" color="red" />
<AirportSign1Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AirportSign1Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<AirportSign1Icon size="24" class="text-primary" />
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
<AirportSign1Icon height="1em" />
<AirportSign1Icon width="1em" height="1em" />
<AirportSign1Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AirportSign1Icon size="24" />
<AirportSign1Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.circum-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AirportSign1Icon class="circum-icon" />
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
<nav>
  <a href="/"><AirportSign1Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlarmOffIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmOnIcon size="20" class="nav-icon" /> Contact</a>
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
<AirportSign1Icon
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
    <AirportSign1Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AlarmOffIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmOnIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AirportSign1Icon size="24" />
   <AlarmOffIcon size="24" color="#4a90e2" />
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
   <AirportSign1Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AirportSign1Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AirportSign1Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { airportSign1 } from '@stacksjs/iconify-circum'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(airportSign1, { size: 24 })
   @endjs

   {!! customIcon !!}
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
