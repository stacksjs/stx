# Prime Icons

> Prime Icons icons for stx from Iconify

## Overview

This package provides access to 313 icons from the Prime Icons collection through the stx iconify integration.

**Collection ID:** `prime`
**Total Icons:** 313
**Author:** PrimeTek ([Website](https://github.com/primefaces/primeicons))
**License:** MIT ([Details](https://github.com/primefaces/primeicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-prime
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
    <AlignCenterIcon size="24" color="#4a90e2" />
    <AlignJustifyIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addressBook, alignCenter, alignJustify } from '@stacksjs/iconify-prime'
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
.prime-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddressBookIcon class="prime-icon" />
```

## Available Icons

This package contains **313** icons:

- `addressBook`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `android`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `apple`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownLeftAndArrowUpRightToCenter`
- `arrowDownRight`
- `arrowLeft`
- `arrowRight`
- `arrowRightArrowLeft`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpRight`
- `arrowUpRightAndArrowDownLeftFromCenter`
- `arrowsAlt`
- `arrowsH`
- `arrowsV`
- `asteriks`
- `at`
- `backward`
- `ban`
- `barcode`
- `bars`
- `bell`
- `bellSlash`
- `bitcoin`
- `bolt`
- `book`
- `bookmark`
- `bookmarkFill`
- `box`
- `briefcase`
- `building`
- `buildingColumns`
- `bullseye`
- `calculator`
- `calendar`
- `calendarClock`
- `calendarMinus`
- `calendarPlus`
- `calendarTimes`
- `camera`
- `car`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `cartArrowDown`
- `cartMinus`
- `cartPlus`
- `chartBar`
- `chartLine`
- `chartPie`
- `chartScatter`
- `check`
- `checkCircle`
- `checkSquare`
- `chevronCircleDown`
- `chevronCircleLeft`
- `chevronCircleRight`
- `chevronCircleUp`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `circle`
- `circleFill`
- `circleOff`
- `circleOn`
- `clipboard`
- `clock`
- `clone`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `code`
- `cog`
- `comment`
- `comments`
- `compass`
- `copy`
- `creditCard`
- `crown`
- `database`
- `deleteLeft`
- `desktop`
- `directions`
- `directionsAlt`
- `discord`
- `dollar`
- `download`
- `eject`
- `ellipsisH`
- `ellipsisV`
- `envelope`
- `equals`
- `eraser`
- `ethereum`
- `euro`
- `exclamationCircle`
- `exclamationTriangle`
- `expand`
- `externalLink`
- `eye`
- `eyeSlash`
- `faceSmile`
- `facebook`
- `fastBackward`
- `fastForward`
- `file`
- `fileArrowUp`
- `fileCheck`
- `fileEdit`
- `fileExcel`
- `fileExport`
- `fileImport`
- `fileO`
- `filePdf`
- `filePlus`
- `fileWord`
- `filter`
- `filterFill`
- `filterSlash`
- `flag`
- `flagFill`
- `folder`
- `folderOpen`
- `folderPlus`
- `forward`
- `gauge`
- `gift`
- `github`
- `globe`
- `google`
- `graduationCap`
- `hammer`
- `hashtag`
- `headphones`
- `heart`
- `heartFill`
- `history`
- `home`
- `hourglass`
- `idCard`
- `image`
- `images`
- `inbox`
- `indianRupee`
- `info`
- `infoCircle`
- `instagram`
- `key`
- `language`
- `lightbulb`
- `link`
- `linkedin`
- `list`
- `listCheck`
- `lock`
- `lockOpen`
- `map`
- `mapMarker`
- `mars`
- `megaphone`
- `microchip`
- `microchipAi`
- `microphone`
- `microsoft`
- `minus`
- `minusCircle`
- `mobile`
- `moneyBill`
- `moon`
- `objectsColumn`
- `palette`
- `paperclip`
- `pause`
- `pauseCircle`
- `paypal`
- `penToSquare`
- `pencil`
- `percentage`
- `phone`
- `pinterest`
- `play`
- `playCircle`
- `plus`
- `plusCircle`
- `pound`
- `powerOff`
- `prime`
- `print`
- `qrcode`
- `question`
- `questionCircle`
- `receipt`
- `reddit`
- `refresh`
- `replay`
- `reply`
- `save`
- `search`
- `searchMinus`
- `searchPlus`
- `send`
- `server`
- `shareAlt`
- `shield`
- `shop`
- `shoppingBag`
- `shoppingCart`
- `signIn`
- `signOut`
- `sitemap`
- `slack`
- `slidersH`
- `slidersV`
- `sort`
- `sortAlphaAltDown`
- `sortAlphaAltUp`
- `sortAlphaDown`
- `sortAlphaUp`
- `sortAlt`
- `sortAltSlash`
- `sortAmountDown`
- `sortAmountDownAlt`
- `sortAmountUp`
- `sortAmountUpAlt`
- `sortDown`
- `sortDownFill`
- `sortNumericAltDown`
- `sortNumericAltUp`
- `sortNumericDown`
- `sortNumericUp`
- `sortUp`
- `sortUpFill`
- `sparkles`
- `spinner`
- `spinnerDotted`
- `star`
- `starFill`
- `starHalf`
- `starHalfFill`
- `stepBackward`
- `stepBackwardAlt`
- `stepForward`
- `stepForwardAlt`
- `stop`
- `stopCircle`
- `stopwatch`
- `sun`
- `sync`
- `table`
- `tablet`
- `tag`
- `tags`
- `telegram`
- `thLarge`
- `thumbsDown`
- `thumbsDownFill`
- `thumbsUp`
- `thumbsUpFill`
- `thumbtack`
- `ticket`
- `tiktok`
- `times`
- `timesCircle`
- `trash`
- `trophy`
- `truck`
- `turkishLira`
- `twitch`
- `twitter`
- `undo`
- `unlock`
- `upload`
- `user`
- `userEdit`
- `userMinus`
- `userPlus`
- `users`
- `venus`
- `verified`
- `video`
- `vimeo`
- `volumeDown`
- `volumeOff`
- `volumeUp`
- `wallet`
- `warehouse`
- `wavePulse`
- `whatsapp`
- `wifi`
- `windowMaximize`
- `windowMinimize`
- `wrench`
- `youtube`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddressBookIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlignCenterIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignJustifyIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignLeftIcon size="20" class="nav-icon" /> Settings</a>
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
    <AlignCenterIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignJustifyIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddressBookIcon size="24" />
   <AlignCenterIcon size="24" color="#4a90e2" />
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
     import { addressBook } from '@stacksjs/iconify-prime'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addressBook, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addressBook } from '@stacksjs/iconify-prime'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/primefaces/primeicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: PrimeTek ([Website](https://github.com/primefaces/primeicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/prime/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/prime/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
