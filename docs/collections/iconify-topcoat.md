# TopCoat Icons

> TopCoat Icons icons for stx from Iconify

## Overview

This package provides access to 89 icons from the TopCoat Icons collection through the stx iconify integration.

**Collection ID:** `topcoat`
**Total Icons:** 89
**Author:** TopCoat ([Website](https://github.com/topcoat/icons))
**License:** Apache 2.0 ([Details](https://github.com/topcoat/icons/blob/master/LICENSE))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-topcoat
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AlertIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-topcoat'

// Basic usage
const icon = AlertIcon()

// With size
const sizedIcon = AlertIcon({ size: 24 })

// With color
const coloredIcon = ArrowDownIcon({ color: 'red' })

// With multiple props
const customIcon = ArrowLeftIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AlertIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-topcoat'

  global.icons = {
    home: AlertIcon({ size: 24 }),
    user: ArrowDownIcon({ size: 24, color: '#4a90e2' }),
    settings: ArrowLeftIcon({ size: 32 })
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
import { alert, arrowDown, arrowLeft } from '@stacksjs/iconify-topcoat'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(alert, { size: 24 })
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
const redIcon = AlertIcon({ color: 'red' })
const blueIcon = AlertIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AlertIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AlertIcon({ class: 'text-primary' })
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
const icon24 = AlertIcon({ size: 24 })
const icon1em = AlertIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AlertIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AlertIcon({ height: '1em' })
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
const smallIcon = AlertIcon({ class: 'icon-small' })
const largeIcon = AlertIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **89** icons:

- `alert`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `attachment`
- `audio`
- `audiooff`
- `back`
- `backLight`
- `behance`
- `bookmark`
- `brush`
- `build`
- `calendar`
- `call`
- `camera`
- `cancel`
- `cart`
- `chat`
- `checkmark`
- `circle`
- `circleOutline`
- `cloud`
- `collapse`
- `comment`
- `computer`
- `delete`
- `download`
- `dribble`
- `email`
- `error`
- `expand`
- `facebook`
- `favorite`
- `feedback`
- `flickr`
- `folder`
- `github`
- `githubText`
- `googleplus`
- `group`
- `home`
- `image`
- `imageOutline`
- `instagram`
- `like`
- `linkedin`
- `listview`
- `location`
- `lock`
- `minus`
- `next`
- `nextLight`
- `page`
- `path`
- `pencil`
- `phone`
- `picasa`
- `pinterest`
- `plugin`
- `plus`
- `preview`
- `print`
- `question`
- `rectangle`
- `rectangleOutline`
- `refresh`
- `retweet`
- `roundedrectangle`
- `roundedrectangleOutline`
- `rss`
- `save`
- `search`
- `settings`
- `share`
- `tablet`
- `text`
- `tileview`
- `tumblr`
- `twitter`
- `unlock`
- `user`
- `videocamera`
- `view`
- `vimeo`
- `w3c`
- `wifi`
- `wordpress`

## Usage Examples

### Navigation Menu

```html
@js
  import { AlertIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from '@stacksjs/iconify-topcoat'

  global.navIcons = {
    home: AlertIcon({ size: 20, class: 'nav-icon' }),
    about: ArrowDownIcon({ size: 20, class: 'nav-icon' }),
    contact: ArrowLeftIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowRightIcon({ size: 20, class: 'nav-icon' })
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
import { AlertIcon } from '@stacksjs/iconify-topcoat'

const icon = AlertIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AlertIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-topcoat'

const successIcon = AlertIcon({ size: 16, color: '#22c55e' })
const warningIcon = ArrowDownIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArrowLeftIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AlertIcon, ArrowDownIcon } from '@stacksjs/iconify-topcoat'
   const icon = AlertIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { alert, arrowDown } from '@stacksjs/iconify-topcoat'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(alert, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AlertIcon, ArrowDownIcon } from '@stacksjs/iconify-topcoat'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-topcoat'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AlertIcon } from '@stacksjs/iconify-topcoat'
     global.icon = AlertIcon({ size: 24 })
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
   const icon = AlertIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { alert } from '@stacksjs/iconify-topcoat'

// Icons are typed as IconData
const myIcon: IconData = alert
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/topcoat/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: TopCoat ([Website](https://github.com/topcoat/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/topcoat/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/topcoat/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
