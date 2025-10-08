# Gridicons

> Gridicons icons for stx from Iconify

## Overview

This package provides access to 207 icons from the Gridicons collection through the stx iconify integration.

**Collection ID:** `gridicons`
**Total Icons:** 207
**Author:** Automattic ([Website](https://github.com/Automattic/gridicons))
**License:** GPL 2.0 ([Details](https://github.com/Automattic/gridicons/blob/trunk/LICENSE.md))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gridicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddIcon, AddImageIcon, AddOutlineIcon } from '@stacksjs/iconify-gridicons'

// Basic usage
const icon = AddIcon()

// With size
const sizedIcon = AddIcon({ size: 24 })

// With color
const coloredIcon = AddImageIcon({ color: 'red' })

// With multiple props
const customIcon = AddOutlineIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddIcon, AddImageIcon, AddOutlineIcon } from '@stacksjs/iconify-gridicons'

  global.icons = {
    home: AddIcon({ size: 24 }),
    user: AddImageIcon({ size: 24, color: '#4a90e2' }),
    settings: AddOutlineIcon({ size: 32 })
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
import { add, addImage, addOutline } from '@stacksjs/iconify-gridicons'
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

This package contains **207** icons:

- `add`
- `addImage`
- `addOutline`
- `alignCenter`
- `alignImageCenter`
- `alignImageLeft`
- `alignImageNone`
- `alignImageRight`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `aside`
- `attachment`
- `audio`
- `bell`
- `block`
- `bold`
- `book`
- `bookmark`
- `bookmarkOutline`
- `briefcase`
- `bug`
- `calendar`
- `camera`
- `caption`
- `cart`
- `chat`
- `checkmark`
- `checkmarkCircle`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `clearFormatting`
- `clipboard`
- `cloud`
- `cloudDownload`
- `cloudOutline`
- `cloudUpload`
- `code`
- `cog`
- `comment`
- `computer`
- `coupon`
- `create`
- `creditCard`
- `crop`
- `cross`
- `crossCircle`
- `crossSmall`
- `customPostType`
- `customize`
- `domains`
- `dropdown`
- `ellipsis`
- `ellipsisCircle`
- `external`
- `filter`
- `fire`
- `flag`
- `flipHorizontal`
- `flipVertical`
- `folder`
- `folderMultiple`
- `fullscreen`
- `fullscreenExit`
- `gift`
- `globe`
- `grid`
- `heading`
- `headingH1`
- `headingH2`
- `headingH3`
- `headingH4`
- `headingH5`
- `headingH6`
- `heart`
- `heartOutline`
- `help`
- `helpOutline`
- `history`
- `house`
- `image`
- `imageMultiple`
- `imageRemove`
- `indentLeft`
- `indentRight`
- `info`
- `infoOutline`
- `ink`
- `institution`
- `italic`
- `layout`
- `layoutBlocks`
- `lineGraph`
- `link`
- `linkBreak`
- `listCheckmark`
- `listOrdered`
- `listOrderedRtl`
- `listUnordered`
- `location`
- `lock`
- `mail`
- `mention`
- `menu`
- `menus`
- `microphone`
- `minus`
- `minusSmall`
- `money`
- `multipleUsers`
- `mySites`
- `mySitesHorizon`
- `nametag`
- `nextPage`
- `notVisible`
- `notice`
- `noticeOutline`
- `offline`
- `pages`
- `pause`
- `pencil`
- `phone`
- `pin`
- `plans`
- `play`
- `plugins`
- `plus`
- `plusSmall`
- `popout`
- `posts`
- `print`
- `product`
- `productDownloadable`
- `productExternal`
- `productVirtual`
- `quote`
- `readMore`
- `reader`
- `readerComment`
- `readerExternal`
- `readerFollow`
- `readerFollowConversation`
- `readerFollowing`
- `readerFollowingConversation`
- `readerShare`
- `readerStar`
- `reblog`
- `recent`
- `redo`
- `refresh`
- `refund`
- `reply`
- `resize`
- `rotate`
- `scheduled`
- `science`
- `search`
- `share`
- `shareComputer`
- `shareIos`
- `shipping`
- `shutter`
- `signOut`
- `site`
- `spam`
- `speaker`
- `specialCharacter`
- `star`
- `starOutline`
- `stats`
- `statsAlt`
- `statsAlt2`
- `statsDown`
- `statsDownAlt`
- `statsUp`
- `statsUpAlt`
- `status`
- `story`
- `strikethrough`
- `sync`
- `tablet`
- `tag`
- `textColor`
- `themes`
- `thumbsUp`
- `time`
- `trash`
- `trending`
- `trophy`
- `types`
- `underline`
- `undo`
- `user`
- `userAdd`
- `userCircle`
- `video`
- `videoCamera`
- `videoRemove`
- `visible`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddIcon, AddImageIcon, AddOutlineIcon, AlignCenterIcon } from '@stacksjs/iconify-gridicons'

  global.navIcons = {
    home: AddIcon({ size: 20, class: 'nav-icon' }),
    about: AddImageIcon({ size: 20, class: 'nav-icon' }),
    contact: AddOutlineIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignCenterIcon({ size: 20, class: 'nav-icon' })
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
import { AddIcon } from '@stacksjs/iconify-gridicons'

const icon = AddIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddIcon, AddImageIcon, AddOutlineIcon } from '@stacksjs/iconify-gridicons'

const successIcon = AddIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddImageIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddOutlineIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddIcon, AddImageIcon } from '@stacksjs/iconify-gridicons'
   const icon = AddIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { add, addImage } from '@stacksjs/iconify-gridicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(add, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddIcon, AddImageIcon } from '@stacksjs/iconify-gridicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-gridicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddIcon } from '@stacksjs/iconify-gridicons'
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
import { add } from '@stacksjs/iconify-gridicons'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL 2.0

See [license details](https://github.com/Automattic/gridicons/blob/trunk/LICENSE.md) for more information.

## Credits

- **Icons**: Automattic ([Website](https://github.com/Automattic/gridicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gridicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gridicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
