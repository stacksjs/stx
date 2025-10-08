# Simple line icons

> Simple line icons icons for stx from Iconify

## Overview

This package provides access to 194 icons from the Simple line icons collection through the stx iconify integration.

**Collection ID:** `simple-line-icons`
**Total Icons:** 194
**Author:** Sabbir Ahmed ([Website](https://github.com/thesabbir/simple-line-icons))
**License:** MIT ([Details](https://github.com/thesabbir/simple-line-icons/blob/master/LICENSE.md))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-simple-line-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ActionRedoIcon, ActionUndoIcon, AnchorIcon } from '@stacksjs/iconify-simple-line-icons'

// Basic usage
const icon = ActionRedoIcon()

// With size
const sizedIcon = ActionRedoIcon({ size: 24 })

// With color
const coloredIcon = ActionUndoIcon({ color: 'red' })

// With multiple props
const customIcon = AnchorIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ActionRedoIcon, ActionUndoIcon, AnchorIcon } from '@stacksjs/iconify-simple-line-icons'

  global.icons = {
    home: ActionRedoIcon({ size: 24 }),
    user: ActionUndoIcon({ size: 24, color: '#4a90e2' }),
    settings: AnchorIcon({ size: 32 })
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
import { actionRedo, actionUndo, anchor } from '@stacksjs/iconify-simple-line-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(actionRedo, { size: 24 })
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
const redIcon = ActionRedoIcon({ color: 'red' })
const blueIcon = ActionRedoIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ActionRedoIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ActionRedoIcon({ class: 'text-primary' })
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
const icon24 = ActionRedoIcon({ size: 24 })
const icon1em = ActionRedoIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ActionRedoIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ActionRedoIcon({ height: '1em' })
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
const smallIcon = ActionRedoIcon({ class: 'icon-small' })
const largeIcon = ActionRedoIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **194** icons:

- `actionRedo`
- `actionUndo`
- `anchor`
- `arrowDown`
- `arrowDownCircle`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowRight`
- `arrowRightCircle`
- `arrowUp`
- `arrowUpCircle`
- `badge`
- `bag`
- `ban`
- `basket`
- `basketLoaded`
- `bell`
- `bookOpen`
- `briefcase`
- `bubble`
- `bubbles`
- `bulb`
- `calculator`
- `calendar`
- `calender`
- `callEnd`
- `callIn`
- `callOut`
- `camera`
- `camrecorder`
- `chart`
- `check`
- `chemistry`
- `clock`
- `close`
- `cloudDownload`
- `cloudUpload`
- `compass`
- `controlEnd`
- `controlForward`
- `controlPause`
- `controlPlay`
- `controlRewind`
- `controlStart`
- `creditCard`
- `crop`
- `cup`
- `cursor`
- `cursorMove`
- `diamond`
- `direction`
- `directions`
- `disc`
- `dislike`
- `doc`
- `docs`
- `drawer`
- `drop`
- `earphones`
- `earphonesAlt`
- `emotsmile`
- `energy`
- `envelope`
- `envelopeLetter`
- `envelopeOpen`
- `envolope`
- `envolopeLetter`
- `equalizer`
- `event`
- `exclamation`
- `eye`
- `eyeglass`
- `feed`
- `film`
- `fire`
- `flag`
- `folder`
- `folderAlt`
- `frame`
- `gameController`
- `ghost`
- `globe`
- `globeAlt`
- `graduation`
- `graph`
- `grid`
- `handbag`
- `heart`
- `home`
- `hourglass`
- `info`
- `key`
- `layers`
- `like`
- `link`
- `list`
- `locationPin`
- `lock`
- `lockOpen`
- `login`
- `logout`
- `loop`
- `magicWand`
- `magnet`
- `magnifier`
- `magnifierAdd`
- `magnifierRemove`
- `map`
- `menu`
- `microphone`
- `minus`
- `mouse`
- `musicTone`
- `musicToneAlt`
- `mustache`
- `note`
- `notebook`
- `options`
- `optionsVertical`
- `organization`
- `paperClip`
- `paperPlane`
- `paypal`
- `pencil`
- `people`
- `phone`
- `picture`
- `pieChart`
- `pin`
- `plane`
- `playlist`
- `plus`
- `power`
- `present`
- `printer`
- `puzzle`
- `question`
- `refresh`
- `reload`
- `rocket`
- `screenDesktop`
- `screenSmartphone`
- `screenTablet`
- `settings`
- `share`
- `shareAlt`
- `shield`
- `shuffle`
- `sizeActual`
- `sizeFullscreen`
- `socialBehance`
- `socialDribbble`
- `socialDropbox`
- `socialFacebook`
- `socialFoursqare`
- `socialGithub`
- `socialGoogle`
- `socialInstagram`
- `socialLinkedin`
- `socialPintarest`
- `socialPinterest`
- `socialReddit`
- `socialSkype`
- `socialSoundcloud`
- `socialSpotify`
- `socialSteam`
- `socialStumbleupon`
- `socialTumblr`
- `socialTwitter`
- `socialVkontakte`
- `socialYoutube`
- `speech`
- `speedometer`
- `star`
- `support`
- `symbleFemale`
- `symbolFemale`
- `symbolMale`
- `tag`
- `target`
- `trash`
- `trophy`
- `umbrella`
- `user`
- `userFemale`
- `userFollow`
- `userFollowing`
- `userUnfollow`
- `vector`
- `volume1`
- `volume2`
- `volumeOff`
- `wallet`
- `wrench`

## Usage Examples

### Navigation Menu

```html
@js
  import { ActionRedoIcon, ActionUndoIcon, AnchorIcon, ArrowDownIcon } from '@stacksjs/iconify-simple-line-icons'

  global.navIcons = {
    home: ActionRedoIcon({ size: 20, class: 'nav-icon' }),
    about: ActionUndoIcon({ size: 20, class: 'nav-icon' }),
    contact: AnchorIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowDownIcon({ size: 20, class: 'nav-icon' })
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
import { ActionRedoIcon } from '@stacksjs/iconify-simple-line-icons'

const icon = ActionRedoIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ActionRedoIcon, ActionUndoIcon, AnchorIcon } from '@stacksjs/iconify-simple-line-icons'

const successIcon = ActionRedoIcon({ size: 16, color: '#22c55e' })
const warningIcon = ActionUndoIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AnchorIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ActionRedoIcon, ActionUndoIcon } from '@stacksjs/iconify-simple-line-icons'
   const icon = ActionRedoIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { actionRedo, actionUndo } from '@stacksjs/iconify-simple-line-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(actionRedo, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ActionRedoIcon, ActionUndoIcon } from '@stacksjs/iconify-simple-line-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-simple-line-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ActionRedoIcon } from '@stacksjs/iconify-simple-line-icons'
     global.icon = ActionRedoIcon({ size: 24 })
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
   const icon = ActionRedoIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { actionRedo } from '@stacksjs/iconify-simple-line-icons'

// Icons are typed as IconData
const myIcon: IconData = actionRedo
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/thesabbir/simple-line-icons/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: Sabbir Ahmed ([Website](https://github.com/thesabbir/simple-line-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/simple-line-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/simple-line-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
