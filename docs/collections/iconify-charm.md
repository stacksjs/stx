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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AnchorIcon, AppsIcon, AppsMinusIcon } from '@stacksjs/iconify-charm'

// Basic usage
const icon = AnchorIcon()

// With size
const sizedIcon = AnchorIcon({ size: 24 })

// With color
const coloredIcon = AppsIcon({ color: 'red' })

// With multiple props
const customIcon = AppsMinusIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AnchorIcon, AppsIcon, AppsMinusIcon } from '@stacksjs/iconify-charm'

  global.icons = {
    home: AnchorIcon({ size: 24 }),
    user: AppsIcon({ size: 24, color: '#4a90e2' }),
    settings: AppsMinusIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AnchorIcon({ color: 'red' })
const blueIcon = AnchorIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AnchorIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AnchorIcon({ class: 'text-primary' })
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
const icon24 = AnchorIcon({ size: 24 })
const icon1em = AnchorIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AnchorIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AnchorIcon({ height: '1em' })
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
const smallIcon = AnchorIcon({ class: 'icon-small' })
const largeIcon = AnchorIcon({ class: 'icon-large' })
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
@js
  import { AnchorIcon, AppsIcon, AppsMinusIcon, AppsPlusIcon } from '@stacksjs/iconify-charm'

  global.navIcons = {
    home: AnchorIcon({ size: 20, class: 'nav-icon' }),
    about: AppsIcon({ size: 20, class: 'nav-icon' }),
    contact: AppsMinusIcon({ size: 20, class: 'nav-icon' }),
    settings: AppsPlusIcon({ size: 20, class: 'nav-icon' })
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
import { AnchorIcon } from '@stacksjs/iconify-charm'

const icon = AnchorIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AnchorIcon, AppsIcon, AppsMinusIcon } from '@stacksjs/iconify-charm'

const successIcon = AnchorIcon({ size: 16, color: '#22c55e' })
const warningIcon = AppsIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AppsMinusIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AnchorIcon, AppsIcon } from '@stacksjs/iconify-charm'
   const icon = AnchorIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { anchor, apps } from '@stacksjs/iconify-charm'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(anchor, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AnchorIcon, AppsIcon } from '@stacksjs/iconify-charm'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-charm'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AnchorIcon } from '@stacksjs/iconify-charm'
     global.icon = AnchorIcon({ size: 24 })
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
   const icon = AnchorIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
