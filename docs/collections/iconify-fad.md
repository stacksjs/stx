# FontAudio

> FontAudio icons for stx from Iconify

## Overview

This package provides access to 155 icons from the FontAudio collection through the stx iconify integration.

**Collection ID:** `fad`
**Total Icons:** 155
**Author:** @fefanto ([Website](https://github.com/fefanto/fontaudio))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fad
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdrIcon, AdsrIcon, AhdsrIcon } from '@stacksjs/iconify-fad'

// Basic usage
const icon = AdrIcon()

// With size
const sizedIcon = AdrIcon({ size: 24 })

// With color
const coloredIcon = AdsrIcon({ color: 'red' })

// With multiple props
const customIcon = AhdsrIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdrIcon, AdsrIcon, AhdsrIcon } from '@stacksjs/iconify-fad'

  global.icons = {
    home: AdrIcon({ size: 24 }),
    user: AdsrIcon({ size: 24, color: '#4a90e2' }),
    settings: AhdsrIcon({ size: 32 })
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
import { adr, adsr, ahdsr } from '@stacksjs/iconify-fad'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adr, { size: 24 })
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
const redIcon = AdrIcon({ color: 'red' })
const blueIcon = AdrIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdrIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdrIcon({ class: 'text-primary' })
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
const icon24 = AdrIcon({ size: 24 })
const icon1em = AdrIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdrIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdrIcon({ height: '1em' })
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
const smallIcon = AdrIcon({ class: 'icon-small' })
const largeIcon = AdrIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **155** icons:

- `adr`
- `adsr`
- `ahdsr`
- `ar`
- `armrecording`
- `arpchord`
- `arpdown`
- `arpdownandup`
- `arpdownup`
- `arpplayorder`
- `arprandom`
- `arpup`
- `arpupandown`
- `arpupdown`
- `arrowsHorz`
- `arrowsVert`
- `automation2p`
- `automation3p`
- `automation4p`
- `backward`
- `bluetooth`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `close`
- `copy`
- `cpu`
- `cutter`
- `digitalColon`
- `digitalDot`
- `digital0`
- `digital1`
- `digital2`
- `digital3`
- `digital4`
- `digital5`
- `digital6`
- `digital7`
- `digital8`
- `digital9`
- `diskio`
- `drumpad`
- `duplicate`
- `eraser`
- `ffwd`
- `filterBandpass`
- `filterBell`
- `filterBypass`
- `filterHighpass`
- `filterLowpass`
- `filterNotch`
- `filterRezHighpass`
- `filterRezLowpass`
- `filterShelvingHi`
- `filterShelvingLo`
- `foldback`
- `forward`
- `hExpand`
- `hardclip`
- `hardclipcurve`
- `headphones`
- `keyboard`
- `lock`
- `logoAax`
- `logoAbletonlink`
- `logoAu`
- `logoAudacity`
- `logoAudiobus`
- `logoCubase`
- `logoFl`
- `logoJuce`
- `logoLadspa`
- `logoLive`
- `logoLv2`
- `logoProtools`
- `logoRackext`
- `logoReaper`
- `logoReason`
- `logoRewire`
- `logoStudioone`
- `logoTracktion`
- `logoVst`
- `logoWaveform`
- `loop`
- `metronome`
- `microphone`
- `midiplug`
- `modrandom`
- `modsawdown`
- `modsawup`
- `modsh`
- `modsine`
- `modsquare`
- `modtri`
- `modularplug`
- `mono`
- `mute`
- `next`
- `open`
- `paste`
- `pause`
- `pen`
- `phase`
- `play`
- `pointer`
- `powerswitch`
- `presetA`
- `presetAb`
- `presetB`
- `presetBa`
- `prev`
- `punchIn`
- `punchOut`
- `ram`
- `random1dice`
- `random2dice`
- `record`
- `redo`
- `repeat`
- `repeatOne`
- `rew`
- `roundswitchOff`
- `roundswitchOn`
- `save`
- `saveas`
- `scissors`
- `shuffle`
- `sliderRound1`
- `sliderRound2`
- `sliderRound3`
- `sliderhandle1`
- `sliderhandle2`
- `softclip`
- `softclipcurve`
- `solo`
- `speaker`
- `squareswitchOff`
- `squareswitchOn`
- `stereo`
- `stop`
- `thunderbolt`
- `timeselect`
- `undo`
- `unlock`
- `usb`
- `vExpand`
- `vroundswitchOff`
- `vroundswitchOn`
- `vsquareswitchOff`
- `vsquareswitchOn`
- `waveform`
- `xlrplug`
- `zoomin`
- `zoomout`

## Usage Examples

### Navigation Menu

```html
@js
  import { AdrIcon, AdsrIcon, AhdsrIcon, ArIcon } from '@stacksjs/iconify-fad'

  global.navIcons = {
    home: AdrIcon({ size: 20, class: 'nav-icon' }),
    about: AdsrIcon({ size: 20, class: 'nav-icon' }),
    contact: AhdsrIcon({ size: 20, class: 'nav-icon' }),
    settings: ArIcon({ size: 20, class: 'nav-icon' })
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
import { AdrIcon } from '@stacksjs/iconify-fad'

const icon = AdrIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdrIcon, AdsrIcon, AhdsrIcon } from '@stacksjs/iconify-fad'

const successIcon = AdrIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdsrIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AhdsrIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdrIcon, AdsrIcon } from '@stacksjs/iconify-fad'
   const icon = AdrIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { adr, adsr } from '@stacksjs/iconify-fad'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(adr, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdrIcon, AdsrIcon } from '@stacksjs/iconify-fad'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fad'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdrIcon } from '@stacksjs/iconify-fad'
     global.icon = AdrIcon({ size: 24 })
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
   const icon = AdrIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adr } from '@stacksjs/iconify-fad'

// Icons are typed as IconData
const myIcon: IconData = adr
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: @fefanto ([Website](https://github.com/fefanto/fontaudio))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fad/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fad/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
