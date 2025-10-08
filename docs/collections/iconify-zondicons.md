# Zondicons

> Zondicons icons for stx from Iconify

## Overview

This package provides access to 297 icons from the Zondicons collection through the stx iconify integration.

**Collection ID:** `zondicons`
**Total Icons:** 297
**Author:** Steve Schoger ([Website](https://github.com/dukestreetstudio/zondicons))
**License:** MIT ([Details](https://github.com/dukestreetstudio/zondicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-zondicons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddOutlineIcon height="1em" />
<AddOutlineIcon width="1em" height="1em" />
<AddOutlineIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddOutlineIcon size="24" />
<AddOutlineIcon size="1em" />

<!-- Using width and height -->
<AddOutlineIcon width="24" height="32" />

<!-- With color -->
<AddOutlineIcon size="24" color="red" />
<AddOutlineIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddOutlineIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddOutlineIcon
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
    <AddOutlineIcon size="24" />
    <AddSolidIcon size="24" color="#4a90e2" />
    <AdjustIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addOutline, addSolid, adjust } from '@stacksjs/iconify-zondicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addOutline, { size: 24 })
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
<AddOutlineIcon size="24" color="red" />
<AddOutlineIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddOutlineIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddOutlineIcon size="24" class="text-primary" />
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
<AddOutlineIcon height="1em" />
<AddOutlineIcon width="1em" height="1em" />
<AddOutlineIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddOutlineIcon size="24" />
<AddOutlineIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.zondicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddOutlineIcon class="zondicons-icon" />
```

## Available Icons

This package contains **297** icons:

- `addOutline`
- `addSolid`
- `adjust`
- `airplane`
- `album`
- `alignCenter`
- `alignJustified`
- `alignLeft`
- `alignRight`
- `anchor`
- `announcement`
- `apparel`
- `arrowDown`
- `arrowLeft`
- `arrowOutlineDown`
- `arrowOutlineLeft`
- `arrowOutlineRight`
- `arrowOutlineUp`
- `arrowRight`
- `arrowThickDown`
- `arrowThickLeft`
- `arrowThickRight`
- `arrowThickUp`
- `arrowThinDown`
- `arrowThinLeft`
- `arrowThinRight`
- `arrowThinUp`
- `arrowUp`
- `artist`
- `atSymbol`
- `attachment`
- `backspace`
- `backward`
- `backwardStep`
- `badge`
- `batteryFull`
- `batteryHalf`
- `batteryLow`
- `beverage`
- `block`
- `bluetooth`
- `bolt`
- `bookReference`
- `bookmark`
- `bookmarkCopy2`
- `bookmarkCopy3`
- `bookmarkOutline`
- `bookmarkOutlineAdd`
- `borderAll`
- `borderBottom`
- `borderHorizontal`
- `borderInner`
- `borderLeft`
- `borderNone`
- `borderOuter`
- `borderRight`
- `borderTop`
- `borderVertical`
- `box`
- `brightnessDown`
- `brightnessUp`
- `browserWindow`
- `browserWindowNew`
- `browserWindowOpen`
- `bug`
- `buoy`
- `calculator`
- `calendar`
- `camera`
- `chart`
- `chartBar`
- `chartPie`
- `chatBubbleDots`
- `checkmark`
- `checkmarkOutline`
- `cheveronDown`
- `cheveronLeft`
- `cheveronOutlineDown`
- `cheveronOutlineLeft`
- `cheveronOutlineRight`
- `cheveronOutlineUp`
- `cheveronRight`
- `cheveronUp`
- `clipboard`
- `close`
- `closeOutline`
- `closeSolid`
- `cloud`
- `cloudUpload`
- `code`
- `coffee`
- `cog`
- `colorPalette`
- `compose`
- `computerDesktop`
- `computerLaptop`
- `conversation`
- `copy`
- `creditCard`
- `currencyDollar`
- `dashboard`
- `dateAdd`
- `dialPad`
- `directions`
- `document`
- `documentAdd`
- `dotsHorizontalDouble`
- `dotsHorizontalTriple`
- `download`
- `duplicate`
- `editCopy`
- `editCrop`
- `editCut`
- `editPencil`
- `education`
- `envelope`
- `exclamationOutline`
- `exclamationSolid`
- `explore`
- `factory`
- `fastForward`
- `fastRewind`
- `film`
- `filter`
- `flag`
- `flashlight`
- `folder`
- `folderOutline`
- `folderOutlineAdd`
- `formatBold`
- `formatFontSize`
- `formatItalic`
- `formatTextSize`
- `formatUnderline`
- `forward`
- `forwardStep`
- `gift`
- `globe`
- `handStop`
- `hardDrive`
- `headphones`
- `heart`
- `home`
- `hot`
- `hourGlass`
- `inbox`
- `inboxCheck`
- `inboxDownload`
- `inboxFull`
- `indentDecrease`
- `indentIncrease`
- `informationOutline`
- `informationSolid`
- `key`
- `keyboard`
- `layers`
- `library`
- `lightBulb`
- `link`
- `list`
- `listAdd`
- `listBullet`
- `loadBalancer`
- `location`
- `locationCurrent`
- `locationFood`
- `locationGasStation`
- `locationHotel`
- `locationMarina`
- `locationPark`
- `locationRestroom`
- `locationShopping`
- `lockClosed`
- `lockOpen`
- `map`
- `menu`
- `mic`
- `minusOutline`
- `minusSolid`
- `mobileDevices`
- `moodHappyOutline`
- `moodHappySolid`
- `moodNeutralOutline`
- `moodNeutralSolid`
- `moodSadOutline`
- `moodSadSolid`
- `mouse`
- `musicAlbum`
- `musicArtist`
- `musicNotes`
- `musicPlaylist`
- `navigationMore`
- `network`
- `newsPaper`
- `notification`
- `notifications`
- `notificationsOutline`
- `paste`
- `pause`
- `pauseOutline`
- `pauseSolid`
- `penTool`
- `phone`
- `photo`
- `phpElephant`
- `pin`
- `play`
- `playOutline`
- `playlist`
- `plugin`
- `portfolio`
- `printer`
- `pylon`
- `question`
- `queue`
- `radar`
- `radarCopy2`
- `radio`
- `refresh`
- `reload`
- `reply`
- `replyAll`
- `repost`
- `saveDisk`
- `screenFull`
- `search`
- `send`
- `servers`
- `share`
- `share01`
- `shareAlt`
- `shield`
- `shoppingCart`
- `showSidebar`
- `shuffle`
- `standBy`
- `starFull`
- `station`
- `stepBackward`
- `stepForward`
- `stethoscope`
- `storeFront`
- `strokeWidth`
- `subdirectoryLeft`
- `subdirectoryRight`
- `swap`
- `tablet`
- `tag`
- `target`
- `textBox`
- `textDecoration`
- `thermometer`
- `thumbsDown`
- `thumbsUp`
- `ticket`
- `time`
- `timer`
- `toolsCopy`
- `translate`
- `trash`
- `travel`
- `travelBus`
- `travelCar`
- `travelCase`
- `travelTaxiCab`
- `travelTrain`
- `travelWalk`
- `trophy`
- `tuning`
- `upload`
- `usb`
- `user`
- `userAdd`
- `userGroup`
- `userSolidCircle`
- `userSolidSquare`
- `vector`
- `videoCamera`
- `viewCarousel`
- `viewColumn`
- `viewHide`
- `viewList`
- `viewShow`
- `viewTile`
- `volumeDown`
- `volumeMute`
- `volumeOff`
- `volumeUp`
- `wallet`
- `watch`
- `window`
- `windowNew`
- `windowOpen`
- `wrench`
- `yinYang`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddOutlineIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddSolidIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdjustIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AirplaneIcon size="20" class="nav-icon" /> Settings</a>
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
<AddOutlineIcon
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
    <AddOutlineIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddSolidIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdjustIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddOutlineIcon size="24" />
   <AddSolidIcon size="24" color="#4a90e2" />
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
   <AddOutlineIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddOutlineIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddOutlineIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addOutline } from '@stacksjs/iconify-zondicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addOutline, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addOutline } from '@stacksjs/iconify-zondicons'

// Icons are typed as IconData
const myIcon: IconData = addOutline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/dukestreetstudio/zondicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Steve Schoger ([Website](https://github.com/dukestreetstudio/zondicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/zondicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/zondicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
