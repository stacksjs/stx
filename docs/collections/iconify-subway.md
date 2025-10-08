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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddIcon height="1em" />
<AddIcon width="1em" height="1em" />
<AddIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddIcon size="24" />
<AddIcon size="1em" />

<!-- Using width and height -->
<AddIcon width="24" height="32" />

<!-- With color -->
<AddIcon size="24" color="red" />
<AddIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddIcon
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
    <AddIcon size="24" />
    <Add1Icon size="24" color="#4a90e2" />
    <AddPlaylistIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AddIcon size="24" color="red" />
<AddIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddIcon size="24" class="text-primary" />
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
<AddIcon height="1em" />
<AddIcon width="1em" height="1em" />
<AddIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddIcon size="24" />
<AddIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.subway-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddIcon class="subway-icon" />
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
<nav>
  <a href="/"><AddIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><Add1Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddPlaylistIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdminIcon size="20" class="nav-icon" /> Settings</a>
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
<AddIcon
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
    <AddIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <Add1Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddPlaylistIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddIcon size="24" />
   <Add1Icon size="24" color="#4a90e2" />
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
   <AddIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { add } from '@stacksjs/iconify-subway'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(add, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
