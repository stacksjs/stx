# Subway Icon Set

> Subway Icon Set icons for stx from Iconify

## Overview

This package provides access to 306 icons from the Subway Icon Set collection through the stx iconify integration.

**Collection ID:** `subway`
**Total Icons:** 306
**Author:** Mariusz Ostrowski ([Website](https://github.com/mariuszostrowski/subway))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-subway
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddIcon, Add1Icon, AddPlaylistIcon } from '@stacksjs/iconify-subway'

// Basic usage
const icon = AddIcon()

// With size
const sizedIcon = AddIcon({ size: 24 })

// With color
const coloredIcon = Add1Icon({ color: 'red' })

// With multiple props
const customIcon = AddPlaylistIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddIcon, Add1Icon, AddPlaylistIcon } from '@stacksjs/iconify-subway'

  global.icons = {
    home: AddIcon({ size: 24 }),
    user: Add1Icon({ size: 24, color: '#4a90e2' }),
    settings: AddPlaylistIcon({ size: 32 })
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
import { add, add1, addPlaylist } from '@stacksjs/iconify-subway'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(add, { size: 24 })
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
const redIcon = AddIcon({ color: 'red' })
const blueIcon = AddIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddIcon({ class: 'text-primary' })
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
const icon24 = AddIcon({ size: 24 })
const icon1em = AddIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddIcon({ height: '1em' })
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
const smallIcon = AddIcon({ class: 'icon-small' })
const largeIcon = AddIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **306** icons:

- `add`
- `add1`
- `addPlaylist`
- `admin`
- `admin1`
- `admin2`
- `airplaneMode`
- `alam`
- `at`
- `backward`
- `backward1`
- `bag`
- `basket`
- `bell`
- `blackWhite`
- `bluetooth`
- `blur`
- `book`
- `book1`
- `box`
- `box1`
- `brightest`
- `brush`
- `c`
- `cain`
- `calendar`
- `calendar1`
- `calendar2`
- `calendar3`
- `calendar4`
- `calendar5`
- `calendar6`
- `call`
- `call1`
- `call2`
- `call3`
- `call4`
- `camera`
- `cercle1`
- `cercle2`
- `cercle3`
- `cercle4`
- `cercle5`
- `cercle6`
- `cercle7`
- `cercle8`
- `circle`
- `close2`
- `closeCornerArrow1`
- `closeCornerArrow2`
- `cloth`
- `cloth1`
- `cloud`
- `cloudDownload`
- `cloudReload`
- `cloudUpload`
- `coin`
- `coin1`
- `compass`
- `compass1`
- `compass2`
- `compose`
- `cover`
- `crop`
- `crpss`
- `dailPad`
- `delete`
- `divide`
- `divide1`
- `document`
- `document1`
- `document2`
- `document3`
- `down`
- `down2`
- `downArrow`
- `downArrow1`
- `download1`
- `download2`
- `download3`
- `download4`
- `dubleCornerArrow1`
- `dubleCornerArrow3`
- `dubleCornerArrow4`
- `dubleCornerArrow5`
- `dubleCornerArrow6`
- `dubleCornerArrowBlod2`
- `equal`
- `equal1`
- `equalizer`
- `equalizer1`
- `equalizer2`
- `error`
- `euro`
- `exit`
- `eye`
- `f`
- `feed`
- `file`
- `file1`
- `file10`
- `file11`
- `file12`
- `file13`
- `file2`
- `file3`
- `file4`
- `file5`
- `file6`
- `file7`
- `file8`
- `file9`
- `folder`
- `folder1`
- `folder2`
- `folder3`
- `fotScreen`
- `fourBox`
- `froward`
- `froward1`
- `fullscreen`
- `glass`
- `home`
- `home1`
- `home2`
- `home3`
- `hulfOfCircle2`
- `hurt`
- `hurt1`
- `hurt3`
- `idCard`
- `idCard1`
- `image`
- `joinCornerArrow1`
- `joinCornerArrow2`
- `joinCornerArrow3`
- `joinCornerArrow4`
- `joinCornerArrow5`
- `joinCornerArrow6`
- `key`
- `leftArrow`
- `leftArrow1`
- `leftDownCornerArrow`
- `leftDownCornerArrow1`
- `leftUpCornerArrow`
- `leftUpCornerArrow1`
- `like`
- `location`
- `location1`
- `location2`
- `location3`
- `lock`
- `lock1`
- `lock2`
- `magic`
- `mailIcon`
- `mailIcon1`
- `mailIcon2`
- `mark`
- `mark1`
- `mark2`
- `mark3`
- `mark4`
- `massage`
- `massage1`
- `media`
- `memoriCard`
- `menu`
- `mic`
- `missing`
- `move`
- `move1`
- `move2`
- `movie`
- `multiply`
- `multiply1`
- `music`
- `musk`
- `mute`
- `netwark`
- `next`
- `next1`
- `paragraph`
- `paragraph2`
- `paragraph3`
- `paragraph4`
- `paragraph5`
- `paragraph6`
- `paragraph7`
- `paragraph8`
- `paragraph9`
- `partOfCircle`
- `partOfCircle1`
- `partOfCircle2`
- `partOfCircle3`
- `partOfCircle4`
- `partOfCircle5`
- `passing`
- `pause`
- `pause1`
- `pencil`
- `pin`
- `pin1`
- `play`
- `play1`
- `pound`
- `power`
- `powerBatton`
- `previous`
- `previous1`
- `print`
- `random`
- `rectangle`
- `rectangle1`
- `rectangle2`
- `rectangle3`
- `rectangle4`
- `rectangular`
- `redo`
- `redo1`
- `redoIcon`
- `refreshTime`
- `removePlaylist`
- `reply`
- `rightArrow`
- `rightArrow1`
- `rightDownCornerArrow`
- `rightDownCornerArrow1`
- `rightUpCornerArrow`
- `rightUpCornerArrow1`
- `roundArrow1`
- `roundArrow2`
- `roundArrow3`
- `roundArrow4`
- `roundArrow5`
- `roundArrow6`
- `save`
- `search`
- `settong`
- `share`
- `share1`
- `sharing`
- `sharing1`
- `shuffile`
- `sms`
- `sms1`
- `sms2`
- `sms3`
- `sms4`
- `sms5`
- `sms6`
- `sms7`
- `sms8`
- `sms9`
- `sound`
- `sound1`
- `sound2`
- `star`
- `star1`
- `step`
- `step1`
- `step2`
- `stop`
- `stop1`
- `subtraction`
- `subtraction1`
- `switch`
- `symbol`
- `symbol1`
- `symbol2`
- `tep`
- `tick`
- `time`
- `time1`
- `time2`
- `time3`
- `time4`
- `time5`
- `title`
- `toolBox`
- `toolBox1`
- `undo`
- `undo1`
- `undoIcon`
- `unlike`
- `unlock`
- `unlock1`
- `up`
- `up2`
- `upArrow`
- `upArrow1`
- `upload1`
- `upload2`
- `upload3`
- `upload4`
- `usd`
- `video`
- `video1`
- `webcam`
- `world`
- `world1`
- `write`
- `write1`
- `zip`
- `zoomMinus`
- `zoomPlus`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddIcon, Add1Icon, AddPlaylistIcon, AdminIcon } from '@stacksjs/iconify-subway'

  global.navIcons = {
    home: AddIcon({ size: 20, class: 'nav-icon' }),
    about: Add1Icon({ size: 20, class: 'nav-icon' }),
    contact: AddPlaylistIcon({ size: 20, class: 'nav-icon' }),
    settings: AdminIcon({ size: 20, class: 'nav-icon' })
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
import { AddIcon } from '@stacksjs/iconify-subway'

const icon = AddIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddIcon, Add1Icon, AddPlaylistIcon } from '@stacksjs/iconify-subway'

const successIcon = AddIcon({ size: 16, color: '#22c55e' })
const warningIcon = Add1Icon({ size: 16, color: '#f59e0b' })
const errorIcon = AddPlaylistIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddIcon, Add1Icon } from '@stacksjs/iconify-subway'
   const icon = AddIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { add, add1 } from '@stacksjs/iconify-subway'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(add, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddIcon, Add1Icon } from '@stacksjs/iconify-subway'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-subway'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddIcon } from '@stacksjs/iconify-subway'
     global.icon = AddIcon({ size: 24 })
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
   const icon = AddIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { add } from '@stacksjs/iconify-subway'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Mariusz Ostrowski ([Website](https://github.com/mariuszostrowski/subway))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/subway/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/subway/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
