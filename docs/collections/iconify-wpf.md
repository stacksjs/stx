# Icons8 Windows 8 Icons

> Icons8 Windows 8 Icons icons for stx from Iconify

## Overview

This package provides access to 200 icons from the Icons8 Windows 8 Icons collection through the stx iconify integration.

**Collection ID:** `wpf`
**Total Icons:** 200
**Author:** Icons8 ([Website](https://github.com/icons8/WPF-UI-Framework))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-wpf
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<2fSwipeDownIcon height="1em" />
<2fSwipeDownIcon width="1em" height="1em" />
<2fSwipeDownIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<2fSwipeDownIcon size="24" />
<2fSwipeDownIcon size="1em" />

<!-- Using width and height -->
<2fSwipeDownIcon width="24" height="32" />

<!-- With color -->
<2fSwipeDownIcon size="24" color="red" />
<2fSwipeDownIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<2fSwipeDownIcon size="24" class="icon-primary" />

<!-- With all properties -->
<2fSwipeDownIcon
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
    <2fSwipeDownIcon size="24" />
    <2fSwipeRightIcon size="24" color="#4a90e2" />
    <AddImageIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 2fSwipeDown, 2fSwipeRight, addImage } from '@stacksjs/iconify-wpf'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(2fSwipeDown, { size: 24 })
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
<2fSwipeDownIcon size="24" color="red" />
<2fSwipeDownIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<2fSwipeDownIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<2fSwipeDownIcon size="24" class="text-primary" />
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
<2fSwipeDownIcon height="1em" />
<2fSwipeDownIcon width="1em" height="1em" />
<2fSwipeDownIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<2fSwipeDownIcon size="24" />
<2fSwipeDownIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.wpf-icon {
  width: 1em;
  height: 1em;
}
```

```html
<2fSwipeDownIcon class="wpf-icon" />
```

## Available Icons

This package contains **200** icons:

- `2fSwipeDown`
- `2fSwipeRight`
- `addImage`
- `addUser`
- `administrator`
- `airplaneTakeoff`
- `alarmClock`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `android`
- `androidOs`
- `appShield`
- `approval`
- `archive2`
- `askQuestion`
- `assistant`
- `attach`
- `audioWave`
- `autopilot`
- `ballPointPen`
- `bankCards`
- `banknotes`
- `bed`
- `behance`
- `bicycle`
- `birthday`
- `blackberry`
- `bold`
- `books`
- `briefcase`
- `brightMoon`
- `bug`
- `building`
- `businessContact`
- `calendar`
- `callTransfer`
- `camera`
- `carRental`
- `chargeBattery`
- `chat`
- `checkBook`
- `checkFile`
- `checkmark`
- `clapperboard`
- `clipboard`
- `cloakroom`
- `closeUpMode`
- `cloud`
- `coins`
- `collaborator`
- `colorDropper`
- `connected`
- `controller`
- `cornet`
- `createNew`
- `cursor`
- `cut`
- `cutPaper`
- `defineLocation`
- `delete`
- `deleteShield`
- `deskLamp`
- `details`
- `diningRoom`
- `diploma1`
- `disconnected`
- `doctorsBag`
- `edit`
- `editFile`
- `editImage`
- `eject`
- `emptyBattery`
- `emptyFlag`
- `end`
- `facialRecognitionScan`
- `factory`
- `fan`
- `faq`
- `fastForward`
- `filledFlag`
- `fingerprintScan`
- `first`
- `fullBattery`
- `fullTrash`
- `future`
- `geoFence`
- `ghost`
- `globeEarth`
- `gpsReceiving`
- `group`
- `guitar`
- `happy`
- `headset`
- `helicopter`
- `heraldTrumpet`
- `hexagon`
- `highBattery`
- `imageFile`
- `inTransit`
- `inbox`
- `inspection`
- `integratedCircuit`
- `invisible`
- `iphone`
- `keepDry`
- `keySecurity`
- `keyboard`
- `last`
- `like`
- `lol`
- `luggageTrolley`
- `macOs`
- `maestro`
- `maintenance`
- `medicalDoctor`
- `message`
- `messageOutline`
- `microphone`
- `mouse`
- `musicalNotes`
- `mute`
- `myTopic`
- `name`
- `news`
- `next`
- `nfcCheckpoint`
- `note`
- `online`
- `packaging`
- `paid`
- `panorama`
- `paperClamp`
- `paperPlane`
- `partlyCloudyDay`
- `partlyCloudyNight`
- `password1`
- `past`
- `pause`
- `phone`
- `phoneOffice`
- `play`
- `polyline`
- `previous`
- `privacy`
- `qrCode`
- `radio`
- `rain`
- `record`
- `recurringAppointment`
- `refreshShield`
- `removeImage`
- `rename`
- `renewSubscription`
- `repeat`
- `restrictionShield`
- `retroTv`
- `rewind`
- `rfidTag`
- `ruler`
- `search`
- `securityChecked`
- `sent`
- `settings`
- `shoppingBag`
- `shoppingBasket`
- `shoppingCart`
- `shuffle`
- `shutdown`
- `signature`
- `simCardChip`
- `skipToStart`
- `snow`
- `speaker`
- `speechBubble`
- `stack`
- `stackOfPhotos`
- `stanleyKnife`
- `star`
- `statistics`
- `stop`
- `sun`
- `survey`
- `swissArmyKnife`
- `switchCamera`
- `timer`
- `today`
- `todoList`
- `unlock`
- `unlock2`
- `userShield`
- `videoCall`
- `viewFile`
- `voicemail`
- `volumeDown`
- `volumeUp`
- `weddingCake`
- `windRose`
- `worldwideLocation`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><2fSwipeDownIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><2fSwipeRightIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddImageIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddUserIcon size="20" class="nav-icon" /> Settings</a>
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
<2fSwipeDownIcon
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
    <2fSwipeDownIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <2fSwipeRightIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddImageIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <2fSwipeDownIcon size="24" />
   <2fSwipeRightIcon size="24" color="#4a90e2" />
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
   <2fSwipeDownIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <2fSwipeDownIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <2fSwipeDownIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 2fSwipeDown } from '@stacksjs/iconify-wpf'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(2fSwipeDown, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 2fSwipeDown } from '@stacksjs/iconify-wpf'

// Icons are typed as IconData
const myIcon: IconData = 2fSwipeDown
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT



## Credits

- **Icons**: Icons8 ([Website](https://github.com/icons8/WPF-UI-Framework))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/wpf/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/wpf/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
