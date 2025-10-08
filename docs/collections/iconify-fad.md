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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdrIcon height="1em" />
<AdrIcon width="1em" height="1em" />
<AdrIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdrIcon size="24" />
<AdrIcon size="1em" />

<!-- Using width and height -->
<AdrIcon width="24" height="32" />

<!-- With color -->
<AdrIcon size="24" color="red" />
<AdrIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdrIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdrIcon
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
    <AdrIcon size="24" />
    <AdsrIcon size="24" color="#4a90e2" />
    <AhdsrIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AdrIcon size="24" color="red" />
<AdrIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdrIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdrIcon size="24" class="text-primary" />
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
<AdrIcon height="1em" />
<AdrIcon width="1em" height="1em" />
<AdrIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdrIcon size="24" />
<AdrIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fad-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdrIcon class="fad-icon" />
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
<nav>
  <a href="/"><AdrIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdsrIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AhdsrIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArIcon size="20" class="nav-icon" /> Settings</a>
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
<AdrIcon
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
    <AdrIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdsrIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AhdsrIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdrIcon size="24" />
   <AdsrIcon size="24" color="#4a90e2" />
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
   <AdrIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdrIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdrIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { adr } from '@stacksjs/iconify-fad'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(adr, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
