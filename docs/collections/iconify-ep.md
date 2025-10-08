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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddLocationIcon height="1em" />
<AddLocationIcon width="1em" height="1em" />
<AddLocationIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddLocationIcon size="24" />
<AddLocationIcon size="1em" />

<!-- Using width and height -->
<AddLocationIcon width="24" height="32" />

<!-- With color -->
<AddLocationIcon size="24" color="red" />
<AddLocationIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddLocationIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddLocationIcon
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
    <AddLocationIcon size="24" />
    <AimIcon size="24" color="#4a90e2" />
    <AlarmClockIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AddLocationIcon size="24" color="red" />
<AddLocationIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddLocationIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddLocationIcon size="24" class="text-primary" />
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
<AddLocationIcon height="1em" />
<AddLocationIcon width="1em" height="1em" />
<AddLocationIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddLocationIcon size="24" />
<AddLocationIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.ep-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddLocationIcon class="ep-icon" />
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
<nav>
  <a href="/"><AddLocationIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AimIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmClockIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AppleIcon size="20" class="nav-icon" /> Settings</a>
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
<AddLocationIcon
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
    <AddLocationIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AimIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmClockIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddLocationIcon size="24" />
   <AimIcon size="24" color="#4a90e2" />
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
   <AddLocationIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddLocationIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddLocationIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addLocation } from '@stacksjs/iconify-ep'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addLocation, { size: 24 })
   @endjs

   {!! customIcon !!}
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
