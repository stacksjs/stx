# Quill Icons

> Quill Icons icons for stx from Iconify

## Overview

This package provides access to 141 icons from the Quill Icons collection through the stx iconify integration.

**Collection ID:** `quill`
**Total Icons:** 141
**Author:** Casper Lourens ([Website](https://www.figma.com/community/file/1034432054377533052/Quill-Iconset))
**License:** MIT ([Details](https://github.com/yourtempo/tempo-quill-icons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-quill
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ActivityIcon, AddIcon, AlarmIcon } from '@stacksjs/iconify-quill'

// Basic usage
const icon = ActivityIcon()

// With size
const sizedIcon = ActivityIcon({ size: 24 })

// With color
const coloredIcon = AddIcon({ color: 'red' })

// With multiple props
const customIcon = AlarmIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ActivityIcon, AddIcon, AlarmIcon } from '@stacksjs/iconify-quill'

  global.icons = {
    home: ActivityIcon({ size: 24 }),
    user: AddIcon({ size: 24, color: '#4a90e2' }),
    settings: AlarmIcon({ size: 32 })
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
import { activity, add, alarm } from '@stacksjs/iconify-quill'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(activity, { size: 24 })
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
const redIcon = ActivityIcon({ color: 'red' })
const blueIcon = ActivityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ActivityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ActivityIcon({ class: 'text-primary' })
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
const icon24 = ActivityIcon({ size: 24 })
const icon1em = ActivityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ActivityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ActivityIcon({ height: '1em' })
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
const smallIcon = ActivityIcon({ class: 'icon-small' })
const largeIcon = ActivityIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **141** icons:

- `activity`
- `add`
- `alarm`
- `alt`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `at`
- `attachment`
- `breather`
- `broadcast`
- `calendar`
- `calendarAdd`
- `calendarMore`
- `calendarSomeday`
- `catchup`
- `chat`
- `checkmark`
- `checkmarkDouble`
- `checkmarkTodo`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `clock`
- `cloudia`
- `cog`
- `cogAlt`
- `collapse`
- `command`
- `compose`
- `creditcard`
- `desktop`
- `discard`
- `download`
- `earth`
- `escape`
- `expand`
- `eye`
- `eyeClosed`
- `filter`
- `focus`
- `folder`
- `folderAdd`
- `folderArchive`
- `folderDownload`
- `folderDrafts`
- `folderList`
- `folderOpen`
- `folderPut`
- `folderSpam`
- `folderTodo`
- `folderTrash`
- `forceBatch`
- `forcebatch`
- `formatting`
- `forward`
- `fullscreen`
- `gift`
- `hamburger`
- `hamburgerSidebar`
- `inbox`
- `inboxAdd`
- `inboxDouble`
- `inboxList`
- `inboxNewsletter`
- `info`
- `inlineDown`
- `inlineLeft`
- `inlineRight`
- `inlineUp`
- `jump`
- `jumpAlt`
- `label`
- `labelMini`
- `link`
- `linkOut`
- `list`
- `loadingSpin`
- `lock`
- `lockWindow`
- `mail`
- `mailList`
- `mailOpen`
- `mailPlus`
- `mailSubbed`
- `mailUnsub`
- `markdown`
- `meatballsH`
- `meatballsV`
- `moon`
- `mute`
- `notifications`
- `nuclear`
- `off`
- `outbox`
- `paper`
- `pause`
- `phone`
- `pin`
- `play`
- `printAlt`
- `printer`
- `queue`
- `remind`
- `reply`
- `replyAll`
- `search`
- `searchAlt`
- `send`
- `sendCancelled`
- `sendLater`
- `sendStop`
- `share`
- `sign`
- `signature`
- `skip`
- `snoozeMonth`
- `snoozeTomorrow`
- `snoozeWeek`
- `snoozeWeekend`
- `sort`
- `sortAlt`
- `sound`
- `stack`
- `stackAlt`
- `star`
- `stopwatch`
- `sun`
- `textCenter`
- `textJustify`
- `textLeft`
- `textRight`
- `toDo`
- `userHappy`
- `userNeutral`
- `userSad`
- `vip`
- `warning`
- `warningAlt`

## Usage Examples

### Navigation Menu

```html
@js
  import { ActivityIcon, AddIcon, AlarmIcon, AltIcon } from '@stacksjs/iconify-quill'

  global.navIcons = {
    home: ActivityIcon({ size: 20, class: 'nav-icon' }),
    about: AddIcon({ size: 20, class: 'nav-icon' }),
    contact: AlarmIcon({ size: 20, class: 'nav-icon' }),
    settings: AltIcon({ size: 20, class: 'nav-icon' })
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
import { ActivityIcon } from '@stacksjs/iconify-quill'

const icon = ActivityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ActivityIcon, AddIcon, AlarmIcon } from '@stacksjs/iconify-quill'

const successIcon = ActivityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlarmIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ActivityIcon, AddIcon } from '@stacksjs/iconify-quill'
   const icon = ActivityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { activity, add } from '@stacksjs/iconify-quill'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(activity, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ActivityIcon, AddIcon } from '@stacksjs/iconify-quill'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-quill'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ActivityIcon } from '@stacksjs/iconify-quill'
     global.icon = ActivityIcon({ size: 24 })
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
   const icon = ActivityIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { activity } from '@stacksjs/iconify-quill'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/yourtempo/tempo-quill-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Casper Lourens ([Website](https://www.figma.com/community/file/1034432054377533052/Quill-Iconset))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/quill/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/quill/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
