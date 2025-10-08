# Open Iconic

> Open Iconic icons for stx from Iconify

## Overview

This package provides access to 223 icons from the Open Iconic collection through the stx iconify integration.

**Collection ID:** `oi`
**Total Icons:** 223
**Author:** Iconic ([Website](https://github.com/iconic/open-iconic))
**License:** MIT ([Details](https://github.com/iconic/open-iconic/blob/master/ICON-LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-oi
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccountLoginIcon, AccountLogoutIcon, ActionRedoIcon } from '@stacksjs/iconify-oi'

// Basic usage
const icon = AccountLoginIcon()

// With size
const sizedIcon = AccountLoginIcon({ size: 24 })

// With color
const coloredIcon = AccountLogoutIcon({ color: 'red' })

// With multiple props
const customIcon = ActionRedoIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccountLoginIcon, AccountLogoutIcon, ActionRedoIcon } from '@stacksjs/iconify-oi'

  global.icons = {
    home: AccountLoginIcon({ size: 24 }),
    user: AccountLogoutIcon({ size: 24, color: '#4a90e2' }),
    settings: ActionRedoIcon({ size: 32 })
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
import { accountLogin, accountLogout, actionRedo } from '@stacksjs/iconify-oi'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accountLogin, { size: 24 })
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
const redIcon = AccountLoginIcon({ color: 'red' })
const blueIcon = AccountLoginIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccountLoginIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccountLoginIcon({ class: 'text-primary' })
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
const icon24 = AccountLoginIcon({ size: 24 })
const icon1em = AccountLoginIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccountLoginIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccountLoginIcon({ height: '1em' })
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
const smallIcon = AccountLoginIcon({ class: 'icon-small' })
const largeIcon = AccountLoginIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **223** icons:

- `accountLogin`
- `accountLogout`
- `actionRedo`
- `actionUndo`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `aperture`
- `arrowBottom`
- `arrowCircleBottom`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleTop`
- `arrowLeft`
- `arrowRight`
- `arrowThickBottom`
- `arrowThickLeft`
- `arrowThickRight`
- `arrowThickTop`
- `arrowTop`
- `audio`
- `audioSpectrum`
- `badge`
- `ban`
- `barChart`
- `basket`
- `batteryEmpty`
- `batteryFull`
- `beaker`
- `bell`
- `bluetooth`
- `bold`
- `bolt`
- `book`
- `bookmark`
- `box`
- `briefcase`
- `britishPound`
- `browser`
- `brush`
- `bug`
- `bullhorn`
- `calculator`
- `calendar`
- `cameraSlr`
- `caretBottom`
- `caretLeft`
- `caretRight`
- `caretTop`
- `cart`
- `chat`
- `check`
- `chevronBottom`
- `chevronLeft`
- `chevronRight`
- `chevronTop`
- `circleCheck`
- `circleX`
- `clipboard`
- `clock`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `cloudy`
- `code`
- `cog`
- `collapseDown`
- `collapseLeft`
- `collapseRight`
- `collapseUp`
- `command`
- `commentSquare`
- `compass`
- `contrast`
- `copywriting`
- `creditCard`
- `crop`
- `dashboard`
- `dataTransferDownload`
- `dataTransferUpload`
- `delete`
- `dial`
- `document`
- `dollar`
- `doubleQuoteSansLeft`
- `doubleQuoteSansRight`
- `doubleQuoteSerifLeft`
- `doubleQuoteSerifRight`
- `droplet`
- `eject`
- `elevator`
- `ellipses`
- `envelopeClosed`
- `envelopeOpen`
- `euro`
- `excerpt`
- `expandDown`
- `expandLeft`
- `expandRight`
- `expandUp`
- `externalLink`
- `eye`
- `eyedropper`
- `file`
- `fire`
- `flag`
- `flash`
- `folder`
- `fork`
- `fullscreenEnter`
- `fullscreenExit`
- `globe`
- `graph`
- `gridFourUp`
- `gridThreeUp`
- `gridTwoUp`
- `hardDrive`
- `header`
- `headphones`
- `heart`
- `home`
- `image`
- `inbox`
- `infinity`
- `info`
- `italic`
- `justifyCenter`
- `justifyLeft`
- `justifyRight`
- `key`
- `laptop`
- `layers`
- `lightbulb`
- `linkBroken`
- `linkIntact`
- `list`
- `listRich`
- `location`
- `lockLocked`
- `lockUnlocked`
- `loop`
- `loopCircular`
- `loopSquare`
- `magnifyingGlass`
- `map`
- `mapMarker`
- `mediaPause`
- `mediaPlay`
- `mediaRecord`
- `mediaSkipBackward`
- `mediaSkipForward`
- `mediaStepBackward`
- `mediaStepForward`
- `mediaStop`
- `medicalCross`
- `menu`
- `microphone`
- `minus`
- `monitor`
- `moon`
- `move`
- `musicalNote`
- `paperclip`
- `pencil`
- `people`
- `person`
- `phone`
- `pieChart`
- `pin`
- `playCircle`
- `plus`
- `powerStandby`
- `print`
- `project`
- `pulse`
- `puzzlePiece`
- `questionMark`
- `rain`
- `random`
- `reload`
- `resizeBoth`
- `resizeHeight`
- `resizeWidth`
- `rss`
- `rssAlt`
- `script`
- `share`
- `shareBoxed`
- `shield`
- `signal`
- `signpost`
- `sortAscending`
- `sortDescending`
- `spreadsheet`
- `star`
- `sun`
- `tablet`
- `tag`
- `tags`
- `target`
- `task`
- `terminal`
- `text`
- `thumbDown`
- `thumbUp`
- `timer`
- `transfer`
- `trash`
- `underline`
- `verticalAlignBottom`
- `verticalAlignCenter`
- `verticalAlignTop`
- `video`
- `volumeHigh`
- `volumeLow`
- `volumeOff`
- `warning`
- `wifi`
- `wrench`
- `x`
- `yen`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccountLoginIcon, AccountLogoutIcon, ActionRedoIcon, ActionUndoIcon } from '@stacksjs/iconify-oi'

  global.navIcons = {
    home: AccountLoginIcon({ size: 20, class: 'nav-icon' }),
    about: AccountLogoutIcon({ size: 20, class: 'nav-icon' }),
    contact: ActionRedoIcon({ size: 20, class: 'nav-icon' }),
    settings: ActionUndoIcon({ size: 20, class: 'nav-icon' })
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
import { AccountLoginIcon } from '@stacksjs/iconify-oi'

const icon = AccountLoginIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccountLoginIcon, AccountLogoutIcon, ActionRedoIcon } from '@stacksjs/iconify-oi'

const successIcon = AccountLoginIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccountLogoutIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ActionRedoIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccountLoginIcon, AccountLogoutIcon } from '@stacksjs/iconify-oi'
   const icon = AccountLoginIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accountLogin, accountLogout } from '@stacksjs/iconify-oi'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accountLogin, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccountLoginIcon, AccountLogoutIcon } from '@stacksjs/iconify-oi'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-oi'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccountLoginIcon } from '@stacksjs/iconify-oi'
     global.icon = AccountLoginIcon({ size: 24 })
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
   const icon = AccountLoginIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accountLogin } from '@stacksjs/iconify-oi'

// Icons are typed as IconData
const myIcon: IconData = accountLogin
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/iconic/open-iconic/blob/master/ICON-LICENSE) for more information.

## Credits

- **Icons**: Iconic ([Website](https://github.com/iconic/open-iconic))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/oi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/oi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
