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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<ActivityIcon height="1em" />
<ActivityIcon width="1em" height="1em" />
<ActivityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<ActivityIcon size="24" />
<ActivityIcon size="1em" />

<!-- Using width and height -->
<ActivityIcon width="24" height="32" />

<!-- With color -->
<ActivityIcon size="24" color="red" />
<ActivityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<ActivityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<ActivityIcon
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
    <ActivityIcon size="24" />
    <AirplayIcon size="24" color="#4a90e2" />
    <AlertCircleIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<ActivityIcon size="24" color="red" />
<ActivityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<ActivityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<ActivityIcon size="24" class="text-primary" />
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
<ActivityIcon height="1em" />
<ActivityIcon width="1em" height="1em" />
<ActivityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<ActivityIcon size="24" />
<ActivityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.feather-icon {
  width: 1em;
  height: 1em;
}
```

```html
<ActivityIcon class="feather-icon" />
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
<nav>
  <a href="/"><ActivityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AirplayIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlertCircleIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlertOctagonIcon size="20" class="nav-icon" /> Settings</a>
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
<ActivityIcon
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
    <ActivityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AirplayIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlertCircleIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <ActivityIcon size="24" />
   <AirplayIcon size="24" color="#4a90e2" />
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
   <ActivityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <ActivityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <ActivityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { activity } from '@stacksjs/iconify-feather'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(activity, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
