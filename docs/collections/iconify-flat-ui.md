# Flat UI Icons

> Flat UI Icons icons for stx from Iconify

## Overview

This package provides access to 100 icons from the Flat UI Icons collection through the stx iconify integration.

**Collection ID:** `flat-ui`
**Total Icons:** 100
**Author:** Designmodo, Inc. ([Website](https://github.com/designmodo/Flat-UI))
**License:** MIT ([Details](https://github.com/designmodo/Flat-UI/blob/master/LICENSE))

**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flat-ui
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AndroidIcon, Android1Icon, AppStoreIcon } from '@stacksjs/iconify-flat-ui'

// Basic usage
const icon = AndroidIcon()

// With size
const sizedIcon = AndroidIcon({ size: 24 })

// With color
const coloredIcon = Android1Icon({ color: 'red' })

// With multiple props
const customIcon = AppStoreIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AndroidIcon, Android1Icon, AppStoreIcon } from '@stacksjs/iconify-flat-ui'

  global.icons = {
    home: AndroidIcon({ size: 24 }),
    user: Android1Icon({ size: 24, color: '#4a90e2' }),
    settings: AppStoreIcon({ size: 32 })
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
import { android, android1, appStore } from '@stacksjs/iconify-flat-ui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(android, { size: 24 })
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

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```typescript
// Via color property
const redIcon = AndroidIcon({ color: 'red' })
const blueIcon = AndroidIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AndroidIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AndroidIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AndroidIcon({ size: 24 })
const icon1em = AndroidIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AndroidIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AndroidIcon({ height: '1em' })
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
const smallIcon = AndroidIcon({ class: 'icon-small' })
const largeIcon = AndroidIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **100** icons:

- `android`
- `android1`
- `appStore`
- `arrow`
- `art`
- `bag`
- `basket`
- `book`
- `bowling`
- `box`
- `brush`
- `building`
- `bulb`
- `button`
- `calculator`
- `calendar`
- `camera`
- `car`
- `card`
- `chair`
- `chat`
- `clipboard`
- `clocks`
- `compas`
- `converse`
- `cup`
- `dj`
- `donut`
- `dude`
- `dynamite`
- `earth`
- `egg`
- `eye`
- `file`
- `fit`
- `flag`
- `flask`
- `flower`
- `games`
- `giftBox`
- `girl`
- `goal`
- `google`
- `graph`
- `icecream`
- `imac`
- `ipad`
- `iphone`
- `key`
- `lettersymbol`
- `lock`
- `loop`
- `macbook`
- `magic`
- `magicmouse`
- `mail`
- `map`
- `medal`
- `mic`
- `money`
- `mortarboard`
- `mountain`
- `news`
- `paperBag`
- `pc`
- `pencil`
- `pencils`
- `picture`
- `pig`
- `pills`
- `play`
- `printer`
- `responsive`
- `retina`
- `ring`
- `rocket`
- `rss`
- `safe`
- `save`
- `search`
- `settings`
- `shield`
- `shirt`
- `skateboard`
- `spray`
- `storage`
- `support`
- `ticket`
- `toiletPaper`
- `touch`
- `trash`
- `tripBag`
- `trunk`
- `ubmrella`
- `userInterface`
- `video`
- `weather`
- `wiFi`
- `wine`
- `yinyang`

## Usage Examples

### Navigation Menu

```html
@js
  import { AndroidIcon, Android1Icon, AppStoreIcon, ArrowIcon } from '@stacksjs/iconify-flat-ui'

  global.navIcons = {
    home: AndroidIcon({ size: 20, class: 'nav-icon' }),
    about: Android1Icon({ size: 20, class: 'nav-icon' }),
    contact: AppStoreIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowIcon({ size: 20, class: 'nav-icon' })
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
import { AndroidIcon } from '@stacksjs/iconify-flat-ui'

const icon = AndroidIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AndroidIcon, Android1Icon, AppStoreIcon } from '@stacksjs/iconify-flat-ui'

const successIcon = AndroidIcon({ size: 16, color: '#22c55e' })
const warningIcon = Android1Icon({ size: 16, color: '#f59e0b' })
const errorIcon = AppStoreIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AndroidIcon, Android1Icon } from '@stacksjs/iconify-flat-ui'
   const icon = AndroidIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { android, android1 } from '@stacksjs/iconify-flat-ui'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(android, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AndroidIcon, Android1Icon } from '@stacksjs/iconify-flat-ui'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-flat-ui'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AndroidIcon } from '@stacksjs/iconify-flat-ui'
     global.icon = AndroidIcon({ size: 24 })
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
   const icon = AndroidIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { android } from '@stacksjs/iconify-flat-ui'

// Icons are typed as IconData
const myIcon: IconData = android
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/designmodo/Flat-UI/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Designmodo, Inc. ([Website](https://github.com/designmodo/Flat-UI))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flat-ui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flat-ui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
