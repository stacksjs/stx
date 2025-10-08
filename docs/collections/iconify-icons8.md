# Icons8 Windows 10 Icons

> Icons8 Windows 10 Icons icons for stx from Iconify

## Overview

This package provides access to 234 icons from the Icons8 Windows 10 Icons collection through the stx iconify integration.

**Collection ID:** `icons8`
**Total Icons:** 234
**Author:** Icons8 ([Website](https://github.com/icons8/windows-10-icons))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-icons8
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddShoppingCartIcon height="1em" />
<AddShoppingCartIcon width="1em" height="1em" />
<AddShoppingCartIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddShoppingCartIcon size="24" />
<AddShoppingCartIcon size="1em" />

<!-- Using width and height -->
<AddShoppingCartIcon width="24" height="32" />

<!-- With color -->
<AddShoppingCartIcon size="24" color="red" />
<AddShoppingCartIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddShoppingCartIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddShoppingCartIcon
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
    <AddShoppingCartIcon size="24" />
    <AddUserIcon size="24" color="#4a90e2" />
    <AdventuresIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addShoppingCart, addUser, adventures } from '@stacksjs/iconify-icons8'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addShoppingCart, { size: 24 })
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
<AddShoppingCartIcon size="24" color="red" />
<AddShoppingCartIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddShoppingCartIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddShoppingCartIcon size="24" class="text-primary" />
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
<AddShoppingCartIcon height="1em" />
<AddShoppingCartIcon width="1em" height="1em" />
<AddShoppingCartIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddShoppingCartIcon size="24" />
<AddShoppingCartIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.icons8-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddShoppingCartIcon class="icons8-icon" />
```

## Available Icons

This package contains **234** icons:

- `addShoppingCart`
- `addUser`
- `adventures`
- `advertising`
- `airport`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `alphabeticalSorting`
- `alphabeticalSorting2`
- `amex`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `archive`
- `areaChart`
- `arrowsLongDown`
- `arrowsLongLeft`
- `arrowsLongRight`
- `arrowsLongUp`
- `asterisk`
- `audioFile`
- `babysRoom`
- `bankCard`
- `banknotes`
- `barChart`
- `barcode`
- `bed`
- `binoculars`
- `bitcoin`
- `bold`
- `bookmark`
- `box`
- `briefcase`
- `britishPound`
- `brush`
- `buy`
- `calculator`
- `camera`
- `cancel`
- `cancel2`
- `catFootprint`
- `checked`
- `checked2`
- `checkmark`
- `chevronDown`
- `chevronDownRound`
- `chevronLeft`
- `chevronLeftRound`
- `chevronRight`
- `chevronRightRound`
- `chevronUp`
- `chevronUpRound`
- `circle`
- `circleNotch`
- `circleThin`
- `clipboard`
- `codeFile`
- `colorDropper`
- `columns`
- `comments`
- `compress`
- `controller`
- `copy`
- `copyright`
- `createNew`
- `crop`
- `cut`
- `database`
- `diningRoom`
- `diploma1`
- `doctor`
- `document`
- `doubleLeft`
- `doubleRight`
- `doubleUp`
- `downArrow`
- `downRound`
- `downSquared`
- `download`
- `download2`
- `electrical`
- `electricity`
- `eraser`
- `euro`
- `exclamationMark`
- `export`
- `fantasy`
- `fax`
- `female`
- `file`
- `film`
- `filter`
- `finishFlag`
- `fireExtinguisher`
- `folder`
- `football2`
- `gender`
- `genderNeutralUser`
- `genderqueer`
- `genericSorting`
- `genericSorting2`
- `genericText`
- `gift`
- `googleWallet`
- `gpsDevice`
- `grid`
- `grid2`
- `grid3`
- `group`
- `hdd`
- `header`
- `home`
- `hospital2`
- `idea`
- `imageFile`
- `import`
- `indent`
- `info`
- `insertTable`
- `ipad`
- `iphone`
- `italic`
- `japaneseYen`
- `key`
- `keyboard`
- `lastQuarter`
- `leftArrow`
- `leftRound`
- `leftSquared`
- `levelDown`
- `levelUp`
- `library`
- `list`
- `lock`
- `lock2`
- `male`
- `mastercard`
- `minus`
- `monitor`
- `moon`
- `music`
- `news`
- `notebook`
- `numberedList`
- `numericalSorting12`
- `numericalSorting21`
- `oldTimeCamera`
- `openedFolder`
- `organization`
- `outdent`
- `paragraph`
- `parallelTasks`
- `paste`
- `paypal`
- `pdf`
- `pencil`
- `phone`
- `picture`
- `pieChart`
- `pin3`
- `plus`
- `powerpoint`
- `priceTag`
- `puzzle`
- `qrCode`
- `questionMark`
- `recycling`
- `refresh`
- `removeUser`
- `resizeDiagonal`
- `resizeFourDirections`
- `resizeHorizontal`
- `resizeVertical`
- `rightArrow`
- `rightRound`
- `rightSquared`
- `rotateLeft`
- `rotateRight`
- `rouble`
- `roundedRectangle`
- `roundedRectangleFilled`
- `rupee`
- `search`
- `sensor`
- `services`
- `settings`
- `share`
- `shekel`
- `shoppingCart`
- `shutdown`
- `sort`
- `sortDown`
- `sortLeft`
- `sortRight`
- `sortUp`
- `spy`
- `strikethrough`
- `stripe`
- `student`
- `subscript`
- `superscript`
- `support`
- `tags`
- `tasks`
- `textHeight`
- `textWidth`
- `ticket`
- `timeline`
- `todoList`
- `translation`
- `trash`
- `trophy`
- `turkishLira`
- `umbrella`
- `underline`
- `undo`
- `unlock2`
- `upArrow`
- `upRound`
- `upSquared`
- `upload`
- `upload2`
- `usDollar`
- `userFemale`
- `userMale`
- `videoCall`
- `videoFile`
- `visa`
- `won`
- `word`
- `xls`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddShoppingCartIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddUserIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdventuresIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdvertisingIcon size="20" class="nav-icon" /> Settings</a>
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
<AddShoppingCartIcon
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
    <AddShoppingCartIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddUserIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdventuresIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddShoppingCartIcon size="24" />
   <AddUserIcon size="24" color="#4a90e2" />
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
   <AddShoppingCartIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddShoppingCartIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddShoppingCartIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addShoppingCart } from '@stacksjs/iconify-icons8'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addShoppingCart, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addShoppingCart } from '@stacksjs/iconify-icons8'

// Icons are typed as IconData
const myIcon: IconData = addShoppingCart
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT



## Credits

- **Icons**: Icons8 ([Website](https://github.com/icons8/windows-10-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/icons8/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/icons8/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
