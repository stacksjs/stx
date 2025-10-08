# Mono Icons

> Mono Icons icons for stx from Iconify

## Overview

This package provides access to 180 icons from the Mono Icons collection through the stx iconify integration.

**Collection ID:** `mi`
**Total Icons:** 180
**Author:** Mono ([Website](https://github.com/mono-company/mono-icons))
**License:** MIT ([Details](https://github.com/mono-company/mono-icons/blob/master/LICENSE.md))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-mi
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddIcon, ArchiveIcon, ArrowDownIcon } from '@stacksjs/iconify-mi'

// Basic usage
const icon = AddIcon()

// With size
const sizedIcon = AddIcon({ size: 24 })

// With color
const coloredIcon = ArchiveIcon({ color: 'red' })

// With multiple props
const customIcon = ArrowDownIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddIcon, ArchiveIcon, ArrowDownIcon } from '@stacksjs/iconify-mi'

  global.icons = {
    home: AddIcon({ size: 24 }),
    user: ArchiveIcon({ size: 24, color: '#4a90e2' }),
    settings: ArrowDownIcon({ size: 32 })
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
import { add, archive, arrowDown } from '@stacksjs/iconify-mi'
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

This package contains **180** icons:

- `add`
- `archive`
- `arrowDown`
- `arrowLeft`
- `arrowLeftDown`
- `arrowLeftUp`
- `arrowRight`
- `arrowRightDown`
- `arrowRightUp`
- `arrowUp`
- `attachment`
- `backspace`
- `ban`
- `barChart`
- `barChartAlt`
- `board`
- `bold`
- `book`
- `bookmark`
- `calendar`
- `call`
- `camera`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `check`
- `chevronDoubleDown`
- `chevronDoubleLeft`
- `chevronDoubleRight`
- `chevronDoubleUp`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `circle`
- `circleAdd`
- `circleArrowDown`
- `circleArrowLeft`
- `circleArrowRight`
- `circleArrowUp`
- `circleCheck`
- `circleError`
- `circleHelp`
- `circleInformation`
- `circleRemove`
- `circleWarning`
- `clipboard`
- `clipboardCheck`
- `clipboardList`
- `clock`
- `close`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `cloudy`
- `comment`
- `compass`
- `computer`
- `copy`
- `creditCard`
- `database`
- `delete`
- `deleteAlt`
- `document`
- `documentAdd`
- `documentCheck`
- `documentDownload`
- `documentEmpty`
- `documentRemove`
- `download`
- `drag`
- `drop`
- `edit`
- `editAlt`
- `email`
- `enter`
- `expand`
- `export`
- `externalLink`
- `eye`
- `eyeOff`
- `favorite`
- `filter`
- `filter1`
- `filterAlt`
- `flag`
- `fog`
- `folder`
- `folderAdd`
- `folderCheck`
- `folderDownload`
- `folderRemove`
- `grid`
- `heart`
- `home`
- `image`
- `inbox`
- `italic`
- `laptop`
- `layers`
- `layout`
- `link`
- `linkAlt`
- `list`
- `location`
- `lock`
- `logIn`
- `logOut`
- `map`
- `megaphone`
- `menu`
- `message`
- `messageAlt`
- `minimize`
- `mobile`
- `moon`
- `next`
- `notification`
- `notificationOff`
- `optionsHorizontal`
- `optionsVertical`
- `pause`
- `pen`
- `percentage`
- `pin`
- `play`
- `previous`
- `print`
- `rain`
- `refresh`
- `remove`
- `reorder`
- `reorderAlt`
- `repeat`
- `save`
- `search`
- `select`
- `send`
- `settings`
- `share`
- `shoppingCart`
- `shoppingCartAdd`
- `shuffle`
- `snow`
- `snowflake`
- `sort`
- `speakers`
- `stop`
- `storm`
- `strikethrough`
- `sun`
- `sunrise`
- `sunriseAlt`
- `sunset`
- `switch`
- `table`
- `tablet`
- `tag`
- `temperature`
- `text`
- `threeRows`
- `twoColumns`
- `twoRows`
- `underline`
- `undo`
- `unlock`
- `user`
- `userAdd`
- `userCheck`
- `userRemove`
- `users`
- `volumeOff`
- `volumeUp`
- `warning`
- `webcam`
- `wind`
- `window`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddIcon, ArchiveIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-mi'

  global.navIcons = {
    home: AddIcon({ size: 20, class: 'nav-icon' }),
    about: ArchiveIcon({ size: 20, class: 'nav-icon' }),
    contact: ArrowDownIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowLeftIcon({ size: 20, class: 'nav-icon' })
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
import { AddIcon } from '@stacksjs/iconify-mi'

const icon = AddIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddIcon, ArchiveIcon, ArrowDownIcon } from '@stacksjs/iconify-mi'

const successIcon = AddIcon({ size: 16, color: '#22c55e' })
const warningIcon = ArchiveIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArrowDownIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddIcon, ArchiveIcon } from '@stacksjs/iconify-mi'
   const icon = AddIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { add, archive } from '@stacksjs/iconify-mi'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(add, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddIcon, ArchiveIcon } from '@stacksjs/iconify-mi'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-mi'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddIcon } from '@stacksjs/iconify-mi'
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
import { add } from '@stacksjs/iconify-mi'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/mono-company/mono-icons/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: Mono ([Website](https://github.com/mono-company/mono-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/mi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/mi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
