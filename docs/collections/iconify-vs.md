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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<0SquareIcon height="1em" />
<0SquareIcon width="1em" height="1em" />
<0SquareIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<0SquareIcon size="24" />
<0SquareIcon size="1em" />

<!-- Using width and height -->
<0SquareIcon width="24" height="32" />

<!-- With color -->
<0SquareIcon size="24" color="red" />
<0SquareIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<0SquareIcon size="24" class="icon-primary" />

<!-- With all properties -->
<0SquareIcon
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
    <0SquareIcon size="24" />
    <1SquareIcon size="24" color="#4a90e2" />
    <2SquareIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<0SquareIcon size="24" color="red" />
<0SquareIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<0SquareIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<0SquareIcon size="24" class="text-primary" />
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
<0SquareIcon height="1em" />
<0SquareIcon width="1em" height="1em" />
<0SquareIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<0SquareIcon size="24" />
<0SquareIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.vs-icon {
  width: 1em;
  height: 1em;
}
```

```html
<0SquareIcon class="vs-icon" />
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
<nav>
  <a href="/"><0SquareIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><1SquareIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><2SquareIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3SquareIcon size="20" class="nav-icon" /> Settings</a>
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
<0SquareIcon
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
    <0SquareIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <1SquareIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <2SquareIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <0SquareIcon size="24" />
   <1SquareIcon size="24" color="#4a90e2" />
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
   <0SquareIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <0SquareIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <0SquareIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 0Square } from '@stacksjs/iconify-vs'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(0Square, { size: 24 })
   @endjs

   {!! customIcon !!}
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
