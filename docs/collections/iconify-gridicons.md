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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddIcon height="1em" />
<AddIcon width="1em" height="1em" />
<AddIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddIcon size="24" />
<AddIcon size="1em" />

<!-- Using width and height -->
<AddIcon width="24" height="32" />

<!-- With color -->
<AddIcon size="24" color="red" />
<AddIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddIcon
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
    <AddIcon size="24" />
    <AddImageIcon size="24" color="#4a90e2" />
    <AddOutlineIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AddIcon size="24" color="red" />
<AddIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddIcon size="24" class="text-primary" />
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
<AddIcon height="1em" />
<AddIcon width="1em" height="1em" />
<AddIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddIcon size="24" />
<AddIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.gridicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddIcon class="gridicons-icon" />
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
<nav>
  <a href="/"><AddIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddImageIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddOutlineIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignCenterIcon size="20" class="nav-icon" /> Settings</a>
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
<AddIcon
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
    <AddIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddImageIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddOutlineIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddIcon size="24" />
   <AddImageIcon size="24" color="#4a90e2" />
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
   <AddIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { add } from '@stacksjs/iconify-gridicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(add, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
