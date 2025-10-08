# Vesper Icons

> Vesper Icons icons for stx from Iconify

## Overview

This package provides access to 159 icons from the Vesper Icons collection through the stx iconify integration.

**Collection ID:** `vs`
**Total Icons:** 159
**Author:** TableCheck ([Website](https://github.com/kkvesper/vesper-icons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-vs
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 0SquareIcon, 1SquareIcon, 2SquareIcon } from '@stacksjs/iconify-vs'

// Basic usage
const icon = 0SquareIcon()

// With size
const sizedIcon = 0SquareIcon({ size: 24 })

// With color
const coloredIcon = 1SquareIcon({ color: 'red' })

// With multiple props
const customIcon = 2SquareIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 0SquareIcon, 1SquareIcon, 2SquareIcon } from '@stacksjs/iconify-vs'

  global.icons = {
    home: 0SquareIcon({ size: 24 }),
    user: 1SquareIcon({ size: 24, color: '#4a90e2' }),
    settings: 2SquareIcon({ size: 32 })
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
import { 0Square, 1Square, 2Square } from '@stacksjs/iconify-vs'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(0Square, { size: 24 })
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
const redIcon = 0SquareIcon({ color: 'red' })
const blueIcon = 0SquareIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 0SquareIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 0SquareIcon({ class: 'text-primary' })
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
const icon24 = 0SquareIcon({ size: 24 })
const icon1em = 0SquareIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 0SquareIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 0SquareIcon({ height: '1em' })
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
const smallIcon = 0SquareIcon({ class: 'icon-small' })
const largeIcon = 0SquareIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **159** icons:

- `0Square`
- `1Square`
- `2Square`
- `3Square`
- `4Square`
- `5Square`
- `6Square`
- `7Square`
- `8Square`
- `9Square`
- `aSquare`
- `bSquare`
- `baby`
- `bcCard`
- `butterfly`
- `cSquare`
- `calendar`
- `calendarAlt`
- `calendarAlt2`
- `camel`
- `catFace`
- `ccCard`
- `chair`
- `chairAlt`
- `chicken`
- `clipNote`
- `clipNoteO`
- `clipboard`
- `clock`
- `clockAlt`
- `comment`
- `commentBubble`
- `comments`
- `cow`
- `crown`
- `cutlery`
- `dSquare`
- `doorClosed`
- `doorOpen`
- `drumstick`
- `eSquare`
- `editPage`
- `fSquare`
- `faceAllergy`
- `faceDislike`
- `faceLike`
- `fileDownload`
- `fileDownloadO`
- `fileMoveO`
- `fish`
- `floors`
- `flower`
- `gSquare`
- `gantt`
- `ganttO`
- `globe`
- `grapes`
- `hSquare`
- `highchair`
- `hourglass`
- `iSquare`
- `idBadgeAlt`
- `idCard`
- `idCardAlt`
- `jSquare`
- `kSquare`
- `kakao`
- `kakaoSquare`
- `kakaotalk`
- `kakaotalkSquare`
- `kanjiChu`
- `kanjiUtage`
- `kanjiYubi`
- `keyboard`
- `lSquare`
- `language`
- `line`
- `lineSquare`
- `mSquare`
- `magnetNote`
- `maleFemale`
- `mic`
- `mobile`
- `moon`
- `multiArrow`
- `nSquare`
- `naver`
- `naverSquare`
- `neko`
- `nekoSleep`
- `ninja`
- `noCommentBubble`
- `noSmokingAlt`
- `oSquare`
- `p`
- `pSquare`
- `panther`
- `party`
- `peopleGroup`
- `person`
- `pig`
- `pregnant`
- `profile`
- `qSquare`
- `questionSquare`
- `rSquare`
- `rose`
- `sSquare`
- `senior`
- `sexFemale`
- `sexMale`
- `sheep`
- `shieldCheck`
- `shieldTimes`
- `shop`
- `sleep`
- `sleepSquare`
- `smoking`
- `smokingAlt`
- `sms`
- `sofa`
- `speech`
- `spinner`
- `stickyNote`
- `stroller`
- `sun`
- `sunrise`
- `sunriseO`
- `tSquare`
- `table`
- `tableAlt`
- `tableO`
- `tableQuestion`
- `tables`
- `tablesolution`
- `timeslot`
- `timeslotQuestion`
- `timeslots`
- `uSquare`
- `userBoss`
- `userGroup`
- `userSuit`
- `userSuitFemale`
- `userWaiter`
- `userWaiterFemale`
- `vSquare`
- `volumeOn`
- `volumeTimes`
- `wSquare`
- `walk`
- `weddingCake`
- `whiteboard`
- `window`
- `wine`
- `wineO`
- `xSquare`
- `ySquare`
- `yahooJapan`
- `zSquare`

## Usage Examples

### Navigation Menu

```html
@js
  import { 0SquareIcon, 1SquareIcon, 2SquareIcon, 3SquareIcon } from '@stacksjs/iconify-vs'

  global.navIcons = {
    home: 0SquareIcon({ size: 20, class: 'nav-icon' }),
    about: 1SquareIcon({ size: 20, class: 'nav-icon' }),
    contact: 2SquareIcon({ size: 20, class: 'nav-icon' }),
    settings: 3SquareIcon({ size: 20, class: 'nav-icon' })
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
import { 0SquareIcon } from '@stacksjs/iconify-vs'

const icon = 0SquareIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 0SquareIcon, 1SquareIcon, 2SquareIcon } from '@stacksjs/iconify-vs'

const successIcon = 0SquareIcon({ size: 16, color: '#22c55e' })
const warningIcon = 1SquareIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 2SquareIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 0SquareIcon, 1SquareIcon } from '@stacksjs/iconify-vs'
   const icon = 0SquareIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 0Square, 1Square } from '@stacksjs/iconify-vs'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(0Square, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 0SquareIcon, 1SquareIcon } from '@stacksjs/iconify-vs'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-vs'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0SquareIcon } from '@stacksjs/iconify-vs'
     global.icon = 0SquareIcon({ size: 24 })
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
   const icon = 0SquareIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0Square } from '@stacksjs/iconify-vs'

// Icons are typed as IconData
const myIcon: IconData = 0Square
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: TableCheck ([Website](https://github.com/kkvesper/vesper-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/vs/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/vs/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
