# Feather Icons

> Feather Icons icons for stx from Iconify

## Overview

This package provides access to 286 icons from the Feather Icons collection through the stx iconify integration.

**Collection ID:** `feather`
**Total Icons:** 286
**Author:** Cole Bemis ([Website](https://github.com/feathericons/feather))
**License:** MIT ([Details](https://github.com/feathericons/feather/blob/master/LICENSE))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-feather
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ActivityIcon, AirplayIcon, AlertCircleIcon } from '@stacksjs/iconify-feather'

// Basic usage
const icon = ActivityIcon()

// With size
const sizedIcon = ActivityIcon({ size: 24 })

// With color
const coloredIcon = AirplayIcon({ color: 'red' })

// With multiple props
const customIcon = AlertCircleIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ActivityIcon, AirplayIcon, AlertCircleIcon } from '@stacksjs/iconify-feather'

  global.icons = {
    home: ActivityIcon({ size: 24 }),
    user: AirplayIcon({ size: 24, color: '#4a90e2' }),
    settings: AlertCircleIcon({ size: 32 })
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
import { activity, airplay, alertCircle } from '@stacksjs/iconify-feather'
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

This package contains **286** icons:

- `activity`
- `airplay`
- `alertCircle`
- `alertOctagon`
- `alertTriangle`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `anchor`
- `aperture`
- `archive`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowRight`
- `arrowRightCircle`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpLeft`
- `arrowUpRight`
- `atSign`
- `award`
- `barChart`
- `barChart2`
- `battery`
- `batteryCharging`
- `bell`
- `bellOff`
- `bluetooth`
- `bold`
- `book`
- `bookOpen`
- `bookmark`
- `box`
- `briefcase`
- `calendar`
- `camera`
- `cameraOff`
- `cast`
- `check`
- `checkCircle`
- `checkSquare`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chevronsDown`
- `chevronsLeft`
- `chevronsRight`
- `chevronsUp`
- `chrome`
- `circle`
- `clipboard`
- `clock`
- `cloud`
- `cloudDrizzle`
- `cloudLightning`
- `cloudOff`
- `cloudRain`
- `cloudSnow`
- `code`
- `codepen`
- `codesandbox`
- `coffee`
- `columns`
- `command`
- `compass`
- `copy`
- `cornerDownLeft`
- `cornerDownRight`
- `cornerLeftDown`
- `cornerLeftUp`
- `cornerRightDown`
- `cornerRightUp`
- `cornerUpLeft`
- `cornerUpRight`
- `cpu`
- `creditCard`
- `crop`
- `crosshair`
- `database`
- `delete`
- `disc`
- `divide`
- `divideCircle`
- `divideSquare`
- `dollarSign`
- `download`
- `downloadCloud`
- `dribbble`
- `droplet`
- `edit`
- `edit2`
- `edit3`
- `externalLink`
- `eye`
- `eyeOff`
- `facebook`
- `fastForward`
- `feather`
- `figma`
- `file`
- `fileMinus`
- `filePlus`
- `fileText`
- `film`
- `filter`
- `flag`
- `folder`
- `folderMinus`
- `folderPlus`
- `framer`
- `frown`
- `gift`
- `gitBranch`
- `gitCommit`
- `gitMerge`
- `gitPullRequest`
- `github`
- `gitlab`
- `globe`
- `grid`
- `hardDrive`
- `hash`
- `headphones`
- `heart`
- `helpCircle`
- `hexagon`
- `home`
- `image`
- `inbox`
- `info`
- `instagram`
- `italic`
- `key`
- `layers`
- `layout`
- `lifeBuoy`
- `link`
- `link2`
- `linkedin`
- `list`
- `loader`
- `lock`
- `logIn`
- `logOut`
- `mail`
- `map`
- `mapPin`
- `maximize`
- `maximize2`
- `meh`
- `menu`
- `messageCircle`
- `messageSquare`
- `mic`
- `micOff`
- `minimize`
- `minimize2`
- `minus`
- `minusCircle`
- `minusSquare`
- `monitor`
- `moon`
- `moreHorizontal`
- `moreVertical`
- `mousePointer`
- `move`
- `music`
- `navigation`
- `navigation2`
- `octagon`
- `package`
- `paperclip`
- `pause`
- `pauseCircle`
- `penTool`
- `percent`
- `phone`
- `phoneCall`
- `phoneForwarded`
- `phoneIncoming`
- `phoneMissed`
- `phoneOff`
- `phoneOutgoing`
- `pieChart`
- `play`
- `playCircle`
- `plus`
- `plusCircle`
- `plusSquare`
- `pocket`
- `power`
- `printer`
- `radio`
- `refreshCcw`
- `refreshCw`
- `repeat`
- `rewind`
- `rotateCcw`
- `rotateCw`
- `rss`
- `save`
- `scissors`
- `search`
- `send`
- `server`
- `settings`
- `share`
- `share2`
- `shield`
- `shieldOff`
- `shoppingBag`
- `shoppingCart`
- `shuffle`
- `sidebar`
- `skipBack`
- `skipForward`
- `slack`
- `slash`
- `sliders`
- `smartphone`
- `smile`
- `speaker`
- `square`
- `star`
- `stopCircle`
- `sun`
- `sunrise`
- `sunset`
- `tablet`
- `tag`
- `target`
- `terminal`
- `thermometer`
- `thumbsDown`
- `thumbsUp`
- `toggleLeft`
- `toggleRight`
- `tool`
- `trash`
- `trash2`
- `trello`
- `trendingDown`
- `trendingUp`
- `triangle`
- `truck`
- `tv`
- `twitch`
- `twitter`
- `type`
- `umbrella`
- `underline`
- `unlock`
- `upload`
- `uploadCloud`
- `user`
- `userCheck`
- `userMinus`
- `userPlus`
- `userX`
- `users`
- `video`
- `videoOff`
- `voicemail`
- `volume`
- `volume1`
- `volume2`
- `volumeX`
- `watch`
- `wifi`
- `wifiOff`
- `wind`
- `x`
- `xCircle`
- `xOctagon`
- `xSquare`
- `youtube`
- `zap`
- `zapOff`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { ActivityIcon, AirplayIcon, AlertCircleIcon, AlertOctagonIcon } from '@stacksjs/iconify-feather'

  global.navIcons = {
    home: ActivityIcon({ size: 20, class: 'nav-icon' }),
    about: AirplayIcon({ size: 20, class: 'nav-icon' }),
    contact: AlertCircleIcon({ size: 20, class: 'nav-icon' }),
    settings: AlertOctagonIcon({ size: 20, class: 'nav-icon' })
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
import { ActivityIcon } from '@stacksjs/iconify-feather'

const icon = ActivityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ActivityIcon, AirplayIcon, AlertCircleIcon } from '@stacksjs/iconify-feather'

const successIcon = ActivityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AirplayIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlertCircleIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ActivityIcon, AirplayIcon } from '@stacksjs/iconify-feather'
   const icon = ActivityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { activity, airplay } from '@stacksjs/iconify-feather'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(activity, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ActivityIcon, AirplayIcon } from '@stacksjs/iconify-feather'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-feather'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ActivityIcon } from '@stacksjs/iconify-feather'
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
import { activity } from '@stacksjs/iconify-feather'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/feathericons/feather/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Cole Bemis ([Website](https://github.com/feathericons/feather))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/feather/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/feather/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
