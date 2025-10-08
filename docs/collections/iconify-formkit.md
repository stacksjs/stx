# FormKit Icons

> FormKit Icons icons for stx from Iconify

## Overview

This package provides access to 144 icons from the FormKit Icons collection through the stx iconify integration.

**Collection ID:** `formkit`
**Total Icons:** 144
**Author:** FormKit, Inc ([Website](https://github.com/formkit/formkit/tree/master/packages/icons))
**License:** MIT ([Details](https://github.com/formkit/formkit/blob/master/packages/icons/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-formkit
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddIcon, AmexIcon, AndroidIcon } from '@stacksjs/iconify-formkit'

// Basic usage
const icon = AddIcon()

// With size
const sizedIcon = AddIcon({ size: 24 })

// With color
const coloredIcon = AmexIcon({ color: 'red' })

// With multiple props
const customIcon = AndroidIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddIcon, AmexIcon, AndroidIcon } from '@stacksjs/iconify-formkit'

  global.icons = {
    home: AddIcon({ size: 24 }),
    user: AmexIcon({ size: 24, color: '#4a90e2' }),
    settings: AndroidIcon({ size: 32 })
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
import { add, amex, android } from '@stacksjs/iconify-formkit'
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

This package contains **144** icons:

- `add`
- `amex`
- `android`
- `apple`
- `arrowdown`
- `arrowleft`
- `arrowright`
- `arrowup`
- `avatarman`
- `avatarwoman`
- `bitcoin`
- `bnb`
- `bookmark`
- `button`
- `cardano`
- `caretdown`
- `caretleft`
- `caretright`
- `caretup`
- `check`
- `checkbox`
- `circle`
- `close`
- `color`
- `compress`
- `currency`
- `date`
- `datetime`
- `discover`
- `dogecoin`
- `dollar`
- `down`
- `download`
- `downloadcloud`
- `draghandle`
- `email`
- `ethereum`
- `euro`
- `expand`
- `export`
- `eye`
- `eyeclosed`
- `facebook`
- `fastforward`
- `file`
- `fileaudio`
- `filedoc`
- `fileimage`
- `filepdf`
- `filevideo`
- `flag`
- `folder`
- `franc`
- `github`
- `google`
- `group`
- `happy`
- `heart`
- `help`
- `hidden`
- `info`
- `instagram`
- `krona`
- `left`
- `link`
- `linkedin`
- `linkexternal`
- `lira`
- `list`
- `mastercard`
- `medium`
- `megaphone`
- `minimize`
- `month`
- `multicurrency`
- `number`
- `open`
- `password`
- `pause`
- `paypal`
- `people`
- `peso`
- `pinterest`
- `play`
- `playcircle`
- `pound`
- `radio`
- `range`
- `reddit`
- `refresh`
- `reorder`
- `repeater`
- `reply`
- `rewind`
- `right`
- `ruble`
- `rupee`
- `sad`
- `search`
- `select`
- `settings`
- `share`
- `shekel`
- `skype`
- `snapchat`
- `solana`
- `spinner`
- `star`
- `start`
- `stepback`
- `stepforward`
- `stop`
- `stripe`
- `submit`
- `table`
- `tag`
- `telephone`
- `tether`
- `text`
- `textarea`
- `tiktok`
- `time`
- `tools`
- `trash`
- `twitter`
- `unit`
- `up`
- `upload`
- `uploadcloud`
- `url`
- `usdc`
- `vimeo`
- `visa`
- `volumedown`
- `volumeup`
- `warning`
- `week`
- `whatsapp`
- `won`
- `wordpress`
- `yen`
- `youtube`
- `yuan`
- `zip`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddIcon, AmexIcon, AndroidIcon, AppleIcon } from '@stacksjs/iconify-formkit'

  global.navIcons = {
    home: AddIcon({ size: 20, class: 'nav-icon' }),
    about: AmexIcon({ size: 20, class: 'nav-icon' }),
    contact: AndroidIcon({ size: 20, class: 'nav-icon' }),
    settings: AppleIcon({ size: 20, class: 'nav-icon' })
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
import { AddIcon } from '@stacksjs/iconify-formkit'

const icon = AddIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddIcon, AmexIcon, AndroidIcon } from '@stacksjs/iconify-formkit'

const successIcon = AddIcon({ size: 16, color: '#22c55e' })
const warningIcon = AmexIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AndroidIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddIcon, AmexIcon } from '@stacksjs/iconify-formkit'
   const icon = AddIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { add, amex } from '@stacksjs/iconify-formkit'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(add, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddIcon, AmexIcon } from '@stacksjs/iconify-formkit'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-formkit'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddIcon } from '@stacksjs/iconify-formkit'
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
import { add } from '@stacksjs/iconify-formkit'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/formkit/formkit/blob/master/packages/icons/LICENSE) for more information.

## Credits

- **Icons**: FormKit, Inc ([Website](https://github.com/formkit/formkit/tree/master/packages/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/formkit/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/formkit/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
