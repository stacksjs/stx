# Charm Icons

> Charm Icons icons for stx from Iconify

## Overview

This package provides access to 262 icons from the Charm Icons collection through the stx iconify integration.

**Collection ID:** `charm`
**Total Icons:** 262
**Author:** Jay Newey ([Website](https://github.com/jaynewey/charm-icons))
**License:** MIT ([Details](https://github.com/jaynewey/charm-icons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-charm
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AnchorIcon height="1em" />
<AnchorIcon width="1em" height="1em" />
<AnchorIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AnchorIcon size="24" />
<AnchorIcon size="1em" />

<!-- Using width and height -->
<AnchorIcon width="24" height="32" />

<!-- With color -->
<AnchorIcon size="24" color="red" />
<AnchorIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AnchorIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AnchorIcon
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
    <AnchorIcon size="24" />
    <AppsIcon size="24" color="#4a90e2" />
    <AppsMinusIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { anchor, apps, appsMinus } from '@stacksjs/iconify-charm'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(anchor, { size: 24 })
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
<AnchorIcon size="24" color="red" />
<AnchorIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AnchorIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AnchorIcon size="24" class="text-primary" />
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
<AnchorIcon height="1em" />
<AnchorIcon width="1em" height="1em" />
<AnchorIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AnchorIcon size="24" />
<AnchorIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.charm-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AnchorIcon class="charm-icon" />
```

## Available Icons

This package contains **262** icons:

- `anchor`
- `apps`
- `appsMinus`
- `appsPlus`
- `archive`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpRight`
- `atSign`
- `atom`
- `bell`
- `bellSlash`
- `bin`
- `binary`
- `block`
- `bluetooth`
- `bluetoothConnected`
- `bluetoothSearching`
- `bluetoothSlash`
- `book`
- `bookOpen`
- `bookmark`
- `briefcase`
- `bug`
- `calendar`
- `camera`
- `cameraVideo`
- `cameraVideoSlash`
- `candy`
- `cards`
- `cast`
- `certificate`
- `chartBar`
- `chartLine`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chevronsDown`
- `chevronsLeft`
- `chevronsRight`
- `chevronsUp`
- `chevronsUpDown`
- `chip`
- `circle`
- `circleCross`
- `circleMinus`
- `circleTick`
- `circleWarning`
- `clipboard`
- `clipboardTick`
- `clock`
- `clockAlarm`
- `cloud`
- `clover`
- `code`
- `coffee`
- `cog`
- `compass`
- `conicalFlask`
- `container`
- `copy`
- `copyleft`
- `copyright`
- `creditCard`
- `crop`
- `cross`
- `crosshair`
- `cube`
- `cursor`
- `database`
- `diamond`
- `diff`
- `disc`
- `download`
- `droplet`
- `eraser`
- `extensions`
- `eye`
- `eyeSlash`
- `faceFrown`
- `faceNeutral`
- `faceSmile`
- `file`
- `fileBinary`
- `fileCode`
- `fileSymlink`
- `files`
- `filter`
- `flag`
- `flame`
- `floppyDisk`
- `folder`
- `folderSymlink`
- `folders`
- `forward`
- `gamepad`
- `gem`
- `gift`
- `gitBranch`
- `gitCherryPick`
- `gitCommit`
- `gitCompare`
- `gitFork`
- `gitMerge`
- `gitRequest`
- `gitRequestCross`
- `gitRequestDraft`
- `github`
- `gitlab`
- `glasses`
- `globe`
- `grabHorizontal`
- `grabVertical`
- `graduateCap`
- `hash`
- `headphones`
- `heart`
- `help`
- `hexagon`
- `home`
- `hourglass`
- `id`
- `image`
- `inbox`
- `infinity`
- `info`
- `key`
- `laptop`
- `layoutColumns`
- `layoutDashboard`
- `layoutGrid`
- `layoutList`
- `layoutRows`
- `layoutSidebar`
- `layoutStackH`
- `layoutStackV`
- `lightbulb`
- `lightningBolt`
- `link`
- `linkExternal`
- `linkSlash`
- `mail`
- `map`
- `mapPin`
- `mediaBack`
- `mediaEject`
- `mediaFastForward`
- `mediaPause`
- `mediaPlay`
- `mediaRewind`
- `mediaSkip`
- `menuHamburger`
- `menuKebab`
- `menuMeatball`
- `message`
- `messages`
- `microphone`
- `minus`
- `mobile`
- `monitor`
- `monitorArrow`
- `monitorCross`
- `moon`
- `move`
- `music`
- `newspaper`
- `northStar`
- `notes`
- `notesCross`
- `notesTick`
- `nut`
- `octagon`
- `octagonWarning`
- `organisation`
- `package`
- `padlock`
- `paperPlane`
- `paperclip`
- `pencil`
- `people`
- `person`
- `phone`
- `phoneCall`
- `phoneCross`
- `phoneForward`
- `phoneIncoming`
- `phoneOutgoing`
- `pin`
- `plantPot`
- `plus`
- `power`
- `printer`
- `pulse`
- `quote`
- `refresh`
- `reply`
- `robot`
- `rocket`
- `rotateAntiClockwise`
- `rotateClockwise`
- `scales`
- `screenMaximise`
- `screenMinimise`
- `search`
- `server`
- `share`
- `shield`
- `shieldCross`
- `shieldKeyhole`
- `shieldTick`
- `shieldWarning`
- `shoppingBag`
- `signIn`
- `signOut`
- `signpost`
- `skull`
- `snowflake`
- `soundDown`
- `soundMute`
- `soundUp`
- `speaker`
- `square`
- `squareCross`
- `squareTick`
- `stack`
- `stackPop`
- `stackPush`
- `star`
- `stickyNote`
- `sun`
- `swapHorizontal`
- `swapVertical`
- `sword`
- `swords`
- `tablet`
- `tag`
- `telescope`
- `tent`
- `terminal`
- `thumbDown`
- `thumbUp`
- `tick`
- `tickDouble`
- `ticket`
- `treeFir`
- `triangle`
- `trophy`
- `umbrella`
- `upload`
- `wifi`
- `wifiFair`
- `wifiPoor`
- `wifiSlash`
- `wifiWarning`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AnchorIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AppsIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AppsMinusIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AppsPlusIcon size="20" class="nav-icon" /> Settings</a>
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
<AnchorIcon
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
    <AnchorIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AppsIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AppsMinusIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AnchorIcon size="24" />
   <AppsIcon size="24" color="#4a90e2" />
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
   <AnchorIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AnchorIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AnchorIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { anchor } from '@stacksjs/iconify-charm'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(anchor, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { anchor } from '@stacksjs/iconify-charm'

// Icons are typed as IconData
const myIcon: IconData = anchor
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/jaynewey/charm-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Jay Newey ([Website](https://github.com/jaynewey/charm-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/charm/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/charm/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
