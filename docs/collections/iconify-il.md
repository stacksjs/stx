# Icalicons

> Icalicons icons for stx from Iconify

## Overview

This package provides access to 84 icons from the Icalicons collection through the stx iconify integration.

**Collection ID:** `il`
**Total Icons:** 84
**Author:** Icalia Labs
**License:** MIT

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-il
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddUserIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-il'

// Basic usage
const icon = AddUserIcon()

// With size
const sizedIcon = AddUserIcon({ size: 24 })

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
  import { AddUserIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-il'

  global.icons = {
    home: AddUserIcon({ size: 24 }),
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
import { addUser, arrowDown, arrowLeft } from '@stacksjs/iconify-il'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addUser, { size: 24 })
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
const redIcon = AddUserIcon({ color: 'red' })
const blueIcon = AddUserIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddUserIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddUserIcon({ class: 'text-primary' })
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
const icon24 = AddUserIcon({ size: 24 })
const icon1em = AddUserIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddUserIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddUserIcon({ height: '1em' })
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
const smallIcon = AddUserIcon({ class: 'icon-small' })
const largeIcon = AddUserIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **84** icons:

- `addUser`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `attachment`
- `basket`
- `behance`
- `bell`
- `book`
- `box`
- `brightness`
- `bucket`
- `calendar`
- `camera`
- `card`
- `cart`
- `clock`
- `cloud`
- `cog`
- `comment`
- `compass`
- `contrast`
- `controls`
- `conversation`
- `cup`
- `dashboard`
- `dialog`
- `dribbble`
- `drop`
- `dropbox`
- `ellipsis`
- `email`
- `envelope`
- `eye`
- `facebook`
- `file`
- `flag`
- `folder`
- `github`
- `googlePlus`
- `grid`
- `heart`
- `house`
- `image`
- `inbox`
- `instagram`
- `layers`
- `linkedin`
- `location`
- `lock`
- `market`
- `menu`
- `mic`
- `mobile`
- `money`
- `moon`
- `music`
- `notification`
- `paypal`
- `pencil`
- `pie`
- `pin`
- `refresh`
- `ribbon`
- `search`
- `select`
- `smallArrowDown`
- `smallArrowLeft`
- `smallArrowRight`
- `smallArrowUp`
- `tablet`
- `tag`
- `thumbs`
- `triangleDown`
- `triangleUp`
- `twitter`
- `unlock`
- `url`
- `user`
- `users`
- `videocamera`
- `world`
- `youtube`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddUserIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from '@stacksjs/iconify-il'

  global.navIcons = {
    home: AddUserIcon({ size: 20, class: 'nav-icon' }),
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
import { AddUserIcon } from '@stacksjs/iconify-il'

const icon = AddUserIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddUserIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-il'

const successIcon = AddUserIcon({ size: 16, color: '#22c55e' })
const warningIcon = ArrowDownIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArrowLeftIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddUserIcon, ArrowDownIcon } from '@stacksjs/iconify-il'
   const icon = AddUserIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addUser, arrowDown } from '@stacksjs/iconify-il'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addUser, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddUserIcon, ArrowDownIcon } from '@stacksjs/iconify-il'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-il'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddUserIcon } from '@stacksjs/iconify-il'
     global.icon = AddUserIcon({ size: 24 })
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
   const icon = AddUserIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addUser } from '@stacksjs/iconify-il'

// Icons are typed as IconData
const myIcon: IconData = addUser
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Icalia Labs
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/il/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/il/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
