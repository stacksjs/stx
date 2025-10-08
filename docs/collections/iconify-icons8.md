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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddShoppingCartIcon, AddUserIcon, AdventuresIcon } from '@stacksjs/iconify-icons8'

// Basic usage
const icon = AddShoppingCartIcon()

// With size
const sizedIcon = AddShoppingCartIcon({ size: 24 })

// With color
const coloredIcon = AddUserIcon({ color: 'red' })

// With multiple props
const customIcon = AdventuresIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddShoppingCartIcon, AddUserIcon, AdventuresIcon } from '@stacksjs/iconify-icons8'

  global.icons = {
    home: AddShoppingCartIcon({ size: 24 }),
    user: AddUserIcon({ size: 24, color: '#4a90e2' }),
    settings: AdventuresIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AddShoppingCartIcon({ color: 'red' })
const blueIcon = AddShoppingCartIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddShoppingCartIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddShoppingCartIcon({ class: 'text-primary' })
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
const icon24 = AddShoppingCartIcon({ size: 24 })
const icon1em = AddShoppingCartIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddShoppingCartIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddShoppingCartIcon({ height: '1em' })
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
const smallIcon = AddShoppingCartIcon({ class: 'icon-small' })
const largeIcon = AddShoppingCartIcon({ class: 'icon-large' })
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
@js
  import { AddShoppingCartIcon, AddUserIcon, AdventuresIcon, AdvertisingIcon } from '@stacksjs/iconify-icons8'

  global.navIcons = {
    home: AddShoppingCartIcon({ size: 20, class: 'nav-icon' }),
    about: AddUserIcon({ size: 20, class: 'nav-icon' }),
    contact: AdventuresIcon({ size: 20, class: 'nav-icon' }),
    settings: AdvertisingIcon({ size: 20, class: 'nav-icon' })
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
import { AddShoppingCartIcon } from '@stacksjs/iconify-icons8'

const icon = AddShoppingCartIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddShoppingCartIcon, AddUserIcon, AdventuresIcon } from '@stacksjs/iconify-icons8'

const successIcon = AddShoppingCartIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddUserIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdventuresIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddShoppingCartIcon, AddUserIcon } from '@stacksjs/iconify-icons8'
   const icon = AddShoppingCartIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addShoppingCart, addUser } from '@stacksjs/iconify-icons8'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addShoppingCart, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddShoppingCartIcon, AddUserIcon } from '@stacksjs/iconify-icons8'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-icons8'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddShoppingCartIcon } from '@stacksjs/iconify-icons8'
     global.icon = AddShoppingCartIcon({ size: 24 })
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
   const icon = AddShoppingCartIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
