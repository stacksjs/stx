# Humbleicons

> Humbleicons icons for stx from Iconify

## Overview

This package provides access to 269 icons from the Humbleicons collection through the stx iconify integration.

**Collection ID:** `humbleicons`
**Total Icons:** 269
**Author:** Jiří Zralý ([Website](https://github.com/zraly/humbleicons))
**License:** MIT ([Details](https://github.com/zraly/humbleicons/blob/master/license))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-humbleicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ActivityIcon, AdjustmentsIcon, AiIcon } from '@stacksjs/iconify-humbleicons'

// Basic usage
const icon = ActivityIcon()

// With size
const sizedIcon = ActivityIcon({ size: 24 })

// With color
const coloredIcon = AdjustmentsIcon({ color: 'red' })

// With multiple props
const customIcon = AiIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ActivityIcon, AdjustmentsIcon, AiIcon } from '@stacksjs/iconify-humbleicons'

  global.icons = {
    home: ActivityIcon({ size: 24 }),
    user: AdjustmentsIcon({ size: 24, color: '#4a90e2' }),
    settings: AiIcon({ size: 32 })
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
import { activity, adjustments, ai } from '@stacksjs/iconify-humbleicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(activity, { size: 24 })
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
const redIcon = ActivityIcon({ color: 'red' })
const blueIcon = ActivityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ActivityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ActivityIcon({ class: 'text-primary' })
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
const icon24 = ActivityIcon({ size: 24 })
const icon1em = ActivityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ActivityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ActivityIcon({ height: '1em' })
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
const smallIcon = ActivityIcon({ class: 'icon-small' })
const largeIcon = ActivityIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **269** icons:

- `activity`
- `adjustments`
- `ai`
- `aid`
- `alignObjectsBottom`
- `alignObjectsCenter`
- `alignObjectsLeft`
- `alignObjectsMiddle`
- `alignObjectsRight`
- `alignObjectsTop`
- `alignTextCenter`
- `alignTextJustify`
- `alignTextLeft`
- `alignTextRight`
- `archive`
- `arrowDown`
- `arrowGoBack`
- `arrowGoForward`
- `arrowJoin`
- `arrowLeft`
- `arrowLeftDown`
- `arrowLeftUp`
- `arrowMainSplitSide`
- `arrowRight`
- `arrowRightDown`
- `arrowRightUp`
- `arrowSideJoinMain`
- `arrowSplit`
- `arrowUp`
- `arrows`
- `arrowsHorizontal`
- `arrowsRightLeft`
- `arrowsUpDown`
- `arrowsVertical`
- `asteriskSimple`
- `atSymbol`
- `ban`
- `bandage`
- `bars`
- `basket`
- `battery`
- `batteryCharging`
- `batteryFull`
- `batteryHalf`
- `bell`
- `bellOff`
- `bike`
- `bold`
- `book`
- `bookOpen`
- `bookmark`
- `box`
- `brandAndroid`
- `brandApple`
- `brandFacebook`
- `brandGithub`
- `brandHomeAssistant`
- `brandInstagram`
- `brandPhp`
- `brandTwitter`
- `brandX`
- `briefcase`
- `brushBig`
- `building`
- `bulb`
- `bulbOff`
- `calendar`
- `camera`
- `cameraOff`
- `cameraVideo`
- `cameraVideoOff`
- `car`
- `cart`
- `certificate`
- `certificateCheck`
- `certificateOff`
- `chart`
- `chat`
- `chats`
- `check`
- `checkCircle`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `circle`
- `clipboard`
- `clock`
- `cloud`
- `cloudSun`
- `club`
- `code`
- `coffee`
- `cog`
- `cog2`
- `coins`
- `columnsOneTwoThirds`
- `columnsThreeThirds`
- `columnsTwoHalfs`
- `cornerDownLeft`
- `cornerDownRight`
- `cornerLeftDown`
- `cornerLeftUp`
- `cornerRightDown`
- `cornerRightUp`
- `cornerTopLeft`
- `cornerUpRight`
- `cpu`
- `creativeCommons`
- `creativeCommonsBy`
- `creativeCommonsNd`
- `creativeCommonsSa`
- `creditCard`
- `crop`
- `crown`
- `currencyDollarCircle`
- `currencyEuroCircle`
- `currencyPoundCircle`
- `cursor`
- `dashboard`
- `database`
- `desktop`
- `document`
- `documentAdd`
- `documentRemove`
- `documents`
- `dotsHorizontal`
- `dotsVertical`
- `download`
- `downloadAlt`
- `droplet`
- `duplicate`
- `exchangeHorizontal`
- `exchangeVertical`
- `exclamation`
- `exclamationTriangle`
- `expand`
- `externalLink`
- `eye`
- `eyeClose`
- `eyeOff`
- `fastForward`
- `fingerprint`
- `flag`
- `flash`
- `flask`
- `folder`
- `folderAdd`
- `folderOpen`
- `folderRemove`
- `forkKnife`
- `funnel`
- `gift`
- `git`
- `globe`
- `heading`
- `heart`
- `home`
- `humbleicon`
- `image`
- `images`
- `incognito`
- `incognito2`
- `info`
- `infoCircle`
- `injection`
- `italic`
- `key`
- `layers`
- `link`
- `location`
- `lock`
- `lockOpen`
- `logout`
- `mail`
- `mailMulti`
- `mailOpen`
- `map`
- `maximize`
- `microphone`
- `microphoneOff`
- `minus`
- `minusCircle`
- `mobile`
- `money`
- `moon`
- `moustache`
- `musicNote`
- `navigation`
- `package`
- `pause`
- `pencil`
- `phone`
- `phoneCall`
- `phoneForward`
- `phoneIncoming`
- `phoneMissed`
- `phoneOff`
- `phoneOutgoing`
- `pieChart`
- `plane`
- `play`
- `plus`
- `plusCircle`
- `power`
- `print`
- `prompt`
- `pulse`
- `radio`
- `rain`
- `refresh`
- `remote`
- `restart`
- `rewind`
- `rocket`
- `rss`
- `save`
- `scissors`
- `search`
- `share`
- `shareAlt`
- `shield`
- `shieldCheck`
- `shieldOff`
- `ship`
- `skipBackward`
- `skipForward`
- `snow`
- `spade`
- `spinnerDots`
- `spinnerEarring`
- `spinnerPlanet`
- `square`
- `star`
- `storm`
- `sun`
- `support`
- `switchOff`
- `switchOn`
- `tag`
- `tags`
- `text`
- `times`
- `timesCircle`
- `trash`
- `trendingDown`
- `trendingUp`
- `triangle`
- `truck`
- `underline`
- `upload`
- `url`
- `user`
- `userAdd`
- `userAsking`
- `userRemove`
- `users`
- `verified`
- `viewGrid`
- `viewList`
- `volume`
- `volume1`
- `volume2`
- `volumeOff`
- `wifi`
- `wifiOff`
- `wind`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { ActivityIcon, AdjustmentsIcon, AiIcon, AidIcon } from '@stacksjs/iconify-humbleicons'

  global.navIcons = {
    home: ActivityIcon({ size: 20, class: 'nav-icon' }),
    about: AdjustmentsIcon({ size: 20, class: 'nav-icon' }),
    contact: AiIcon({ size: 20, class: 'nav-icon' }),
    settings: AidIcon({ size: 20, class: 'nav-icon' })
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
import { ActivityIcon } from '@stacksjs/iconify-humbleicons'

const icon = ActivityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ActivityIcon, AdjustmentsIcon, AiIcon } from '@stacksjs/iconify-humbleicons'

const successIcon = ActivityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdjustmentsIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AiIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ActivityIcon, AdjustmentsIcon } from '@stacksjs/iconify-humbleicons'
   const icon = ActivityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { activity, adjustments } from '@stacksjs/iconify-humbleicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(activity, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ActivityIcon, AdjustmentsIcon } from '@stacksjs/iconify-humbleicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-humbleicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ActivityIcon } from '@stacksjs/iconify-humbleicons'
     global.icon = ActivityIcon({ size: 24 })
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
   const icon = ActivityIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { activity } from '@stacksjs/iconify-humbleicons'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/zraly/humbleicons/blob/master/license) for more information.

## Credits

- **Icons**: Jiří Zralý ([Website](https://github.com/zraly/humbleicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/humbleicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/humbleicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
