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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 2fSwipeDownIcon, 2fSwipeRightIcon, AddImageIcon } from '@stacksjs/iconify-wpf'

// Basic usage
const icon = 2fSwipeDownIcon()

// With size
const sizedIcon = 2fSwipeDownIcon({ size: 24 })

// With color
const coloredIcon = 2fSwipeRightIcon({ color: 'red' })

// With multiple props
const customIcon = AddImageIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 2fSwipeDownIcon, 2fSwipeRightIcon, AddImageIcon } from '@stacksjs/iconify-wpf'

  global.icons = {
    home: 2fSwipeDownIcon({ size: 24 }),
    user: 2fSwipeRightIcon({ size: 24, color: '#4a90e2' }),
    settings: AddImageIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = 2fSwipeDownIcon({ color: 'red' })
const blueIcon = 2fSwipeDownIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 2fSwipeDownIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 2fSwipeDownIcon({ class: 'text-primary' })
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
const icon24 = 2fSwipeDownIcon({ size: 24 })
const icon1em = 2fSwipeDownIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 2fSwipeDownIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 2fSwipeDownIcon({ height: '1em' })
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
const smallIcon = 2fSwipeDownIcon({ class: 'icon-small' })
const largeIcon = 2fSwipeDownIcon({ class: 'icon-large' })
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
@js
  import { 2fSwipeDownIcon, 2fSwipeRightIcon, AddImageIcon, AddUserIcon } from '@stacksjs/iconify-wpf'

  global.navIcons = {
    home: 2fSwipeDownIcon({ size: 20, class: 'nav-icon' }),
    about: 2fSwipeRightIcon({ size: 20, class: 'nav-icon' }),
    contact: AddImageIcon({ size: 20, class: 'nav-icon' }),
    settings: AddUserIcon({ size: 20, class: 'nav-icon' })
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
import { 2fSwipeDownIcon } from '@stacksjs/iconify-wpf'

const icon = 2fSwipeDownIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 2fSwipeDownIcon, 2fSwipeRightIcon, AddImageIcon } from '@stacksjs/iconify-wpf'

const successIcon = 2fSwipeDownIcon({ size: 16, color: '#22c55e' })
const warningIcon = 2fSwipeRightIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddImageIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 2fSwipeDownIcon, 2fSwipeRightIcon } from '@stacksjs/iconify-wpf'
   const icon = 2fSwipeDownIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 2fSwipeDown, 2fSwipeRight } from '@stacksjs/iconify-wpf'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(2fSwipeDown, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 2fSwipeDownIcon, 2fSwipeRightIcon } from '@stacksjs/iconify-wpf'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-wpf'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 2fSwipeDownIcon } from '@stacksjs/iconify-wpf'
     global.icon = 2fSwipeDownIcon({ size: 24 })
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
   const icon = 2fSwipeDownIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
