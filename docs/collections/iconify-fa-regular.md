# Font Awesome 5 Regular

> Font Awesome 5 Regular icons for stx from Iconify

## Overview

This package provides access to 151 icons from the Font Awesome 5 Regular collection through the stx iconify integration.

**Collection ID:** `fa-regular`
**Total Icons:** 151
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa-regular
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddressBookIcon height="1em" />
<AddressBookIcon width="1em" height="1em" />
<AddressBookIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddressBookIcon size="24" />
<AddressBookIcon size="1em" />

<!-- Using width and height -->
<AddressBookIcon width="24" height="32" />

<!-- With color -->
<AddressBookIcon size="24" color="red" />
<AddressBookIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddressBookIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddressBookIcon
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
    <AddressBookIcon size="24" />
    <AddressCardIcon size="24" color="#4a90e2" />
    <AngryIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addressBook, addressCard, angry } from '@stacksjs/iconify-fa-regular'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addressBook, { size: 24 })
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
<AddressBookIcon size="24" color="red" />
<AddressBookIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddressBookIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddressBookIcon size="24" class="text-primary" />
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
<AddressBookIcon height="1em" />
<AddressBookIcon width="1em" height="1em" />
<AddressBookIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddressBookIcon size="24" />
<AddressBookIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.faRegular-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddressBookIcon class="faRegular-icon" />
```

## Available Icons

This package contains **151** icons:

- `addressBook`
- `addressCard`
- `angry`
- `arrowAltCircleDown`
- `arrowAltCircleLeft`
- `arrowAltCircleRight`
- `arrowAltCircleUp`
- `bell`
- `bellSlash`
- `bookmark`
- `building`
- `calendar`
- `calendarAlt`
- `calendarCheck`
- `calendarMinus`
- `calendarPlus`
- `calendarTimes`
- `caretSquareDown`
- `caretSquareLeft`
- `caretSquareRight`
- `caretSquareUp`
- `chartBar`
- `checkCircle`
- `checkSquare`
- `circle`
- `clipboard`
- `clock`
- `clone`
- `closedCaptioning`
- `comment`
- `commentAlt`
- `commentDots`
- `comments`
- `compass`
- `copy`
- `copyright`
- `creditCard`
- `dizzy`
- `dotCircle`
- `edit`
- `envelope`
- `envelopeOpen`
- `eye`
- `eyeSlash`
- `file`
- `fileAlt`
- `fileArchive`
- `fileAudio`
- `fileCode`
- `fileExcel`
- `fileImage`
- `filePdf`
- `filePowerpoint`
- `fileVideo`
- `fileWord`
- `flag`
- `flushed`
- `folder`
- `folderOpen`
- `frown`
- `frownOpen`
- `futbol`
- `gem`
- `grimace`
- `grin`
- `grinAlt`
- `grinBeam`
- `grinBeamSweat`
- `grinHearts`
- `grinSquint`
- `grinSquintTears`
- `grinStars`
- `grinTears`
- `grinTongue`
- `grinTongueSquint`
- `grinTongueWink`
- `grinWink`
- `handLizard`
- `handPaper`
- `handPeace`
- `handPointDown`
- `handPointLeft`
- `handPointRight`
- `handPointUp`
- `handPointer`
- `handRock`
- `handScissors`
- `handSpock`
- `handshake`
- `hdd`
- `heart`
- `hospital`
- `hourglass`
- `idBadge`
- `idCard`
- `image`
- `images`
- `keyboard`
- `kiss`
- `kissBeam`
- `kissWinkHeart`
- `laugh`
- `laughBeam`
- `laughSquint`
- `laughWink`
- `lemon`
- `lifeRing`
- `lightbulb`
- `listAlt`
- `map`
- `meh`
- `mehBlank`
- `mehRollingEyes`
- `minusSquare`
- `moneyBillAlt`
- `moon`
- `newspaper`
- `objectGroup`
- `objectUngroup`
- `paperPlane`
- `pauseCircle`
- `playCircle`
- `plusSquare`
- `questionCircle`
- `registered`
- `sadCry`
- `sadTear`
- `save`
- `shareSquare`
- `smile`
- `smileBeam`
- `smileWink`
- `snowflake`
- `square`
- `star`
- `starHalf`
- `stickyNote`
- `stopCircle`
- `sun`
- `surprise`
- `thumbsDown`
- `thumbsUp`
- `timesCircle`
- `tired`
- `trashAlt`
- `user`
- `userCircle`
- `windowClose`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddressBookIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddressCardIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AngryIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrowAltCircleDownIcon size="20" class="nav-icon" /> Settings</a>
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
<AddressBookIcon
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
    <AddressBookIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddressCardIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AngryIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddressBookIcon size="24" />
   <AddressCardIcon size="24" color="#4a90e2" />
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
   <AddressBookIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddressBookIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddressBookIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addressBook } from '@stacksjs/iconify-fa-regular'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addressBook, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addressBook } from '@stacksjs/iconify-fa-regular'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa-regular/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa-regular/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
