# WeUI Icon

> WeUI Icon icons for stx from Iconify

## Overview

This package provides access to 162 icons from the WeUI Icon collection through the stx iconify integration.

**Collection ID:** `weui`
**Total Icons:** 162
**Author:** WeUI ([Website](https://github.com/weui/weui-icon))
**License:** MIT
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-weui
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddFilledIcon height="1em" />
<AddFilledIcon width="1em" height="1em" />
<AddFilledIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddFilledIcon size="24" />
<AddFilledIcon size="1em" />

<!-- Using width and height -->
<AddFilledIcon width="24" height="32" />

<!-- With color -->
<AddFilledIcon size="24" color="red" />
<AddFilledIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddFilledIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddFilledIcon
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
    <AddFilledIcon size="24" />
    <AddFriendsFilledIcon size="24" color="#4a90e2" />
    <AddFriendsOutlinedIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addFilled, addFriendsFilled, addFriendsOutlined } from '@stacksjs/iconify-weui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addFilled, { size: 24 })
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
<AddFilledIcon size="24" color="red" />
<AddFilledIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddFilledIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddFilledIcon size="24" class="text-primary" />
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
<AddFilledIcon height="1em" />
<AddFilledIcon width="1em" height="1em" />
<AddFilledIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddFilledIcon size="24" />
<AddFilledIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.weui-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddFilledIcon class="weui-icon" />
```

## Available Icons

This package contains **162** icons:

- `addFilled`
- `addFriendsFilled`
- `addFriendsOutlined`
- `addOutlined`
- `add2Filled`
- `add2Outlined`
- `albumFilled`
- `albumOutlined`
- `arrowFilled`
- `arrowOutlined`
- `atFilled`
- `atOutlined`
- `backFilled`
- `backOutlined`
- `back2Filled`
- `back2Outlined`
- `bellringOffFilled`
- `bellringOffOutlined`
- `bellringOnFilled`
- `bellringOnOutlined`
- `cameraFilled`
- `cameraOutlined`
- `cellphoneFilled`
- `cellphoneOutlined`
- `clipFilled`
- `clipOutlined`
- `closeFilled`
- `closeOutlined`
- `close2Filled`
- `close2Outlined`
- `commentFilled`
- `commentOutlined`
- `contactsFilled`
- `contactsOutlined`
- `copyFilled`
- `copyOutlined`
- `deleteFilled`
- `deleteOnFilled`
- `deleteOnOutlined`
- `deleteOutlined`
- `discoverFilled`
- `discoverOutlined`
- `displayFilled`
- `displayOutlined`
- `doneFilled`
- `doneOutlined`
- `done2Filled`
- `done2Outlined`
- `downloadFilled`
- `downloadOutlined`
- `emailFilled`
- `emailOutlined`
- `errorFilled`
- `errorOutlined`
- `eyesOffFilled`
- `eyesOffOutlined`
- `eyesOnFilled`
- `eyesOnOutlined`
- `folderFilled`
- `folderOutlined`
- `groupDetailFilled`
- `groupDetailOutlined`
- `helpFilled`
- `helpOutlined`
- `homeFilled`
- `homeOutlined`
- `imacFilled`
- `imacOutlined`
- `infoFilled`
- `infoOutlined`
- `keyboardFilled`
- `keyboardOutlined`
- `likeFilled`
- `likeOutlined`
- `linkFilled`
- `linkOutlined`
- `locationFilled`
- `locationOutlined`
- `lockFilled`
- `lockOutlined`
- `maxWindowFilled`
- `maxWindowOutlined`
- `meFilled`
- `meOutlined`
- `mikeFilled`
- `mikeOutlined`
- `mike2Filled`
- `mike2Outlined`
- `mobileContactsFilled`
- `mobileContactsOutlined`
- `moreFilled`
- `moreOutlined`
- `more2Filled`
- `more2Outlined`
- `mosaicFilled`
- `mosaicOutlined`
- `musicFilled`
- `musicOffFilled`
- `musicOffOutlined`
- `musicOutlined`
- `noteFilled`
- `noteOutlined`
- `padFilled`
- `padOutlined`
- `pauseFilled`
- `pauseOutlined`
- `pencilFilled`
- `pencilOutlined`
- `photoWallFilled`
- `photoWallOutlined`
- `playFilled`
- `playOutlined`
- `play2Filled`
- `play2Outlined`
- `previousFilled`
- `previousOutlined`
- `previous2Filled`
- `previous2Outlined`
- `qrCodeFilled`
- `qrCodeOutlined`
- `refreshFilled`
- `refreshOutlined`
- `reportProblemFilled`
- `reportProblemOutlined`
- `searchFilled`
- `searchOutlined`
- `sendingFilled`
- `sendingOutlined`
- `settingFilled`
- `settingOutlined`
- `shareFilled`
- `shareOutlined`
- `shopFilled`
- `shopOutlined`
- `starFilled`
- `starOutlined`
- `stickerFilled`
- `stickerOutlined`
- `tagFilled`
- `tagOutlined`
- `textFilled`
- `textOutlined`
- `timeFilled`
- `timeOutlined`
- `transferFilled`
- `transferOutlined`
- `transferTextFilled`
- `transferTextOutlined`
- `transfer2Filled`
- `transfer2Outlined`
- `tvFilled`
- `tvOutlined`
- `videoCallFilled`
- `videoCallOutlined`
- `voiceFilled`
- `voiceOutlined`
- `volumeDownFilled`
- `volumeDownOutlined`
- `volumeOffFilled`
- `volumeOffOutlined`
- `volumeUpFilled`
- `volumeUpOutlined`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddFilledIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddFriendsFilledIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddFriendsOutlinedIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddOutlinedIcon size="20" class="nav-icon" /> Settings</a>
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
<AddFilledIcon
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
    <AddFilledIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddFriendsFilledIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddFriendsOutlinedIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddFilledIcon size="24" />
   <AddFriendsFilledIcon size="24" color="#4a90e2" />
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
   <AddFilledIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddFilledIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddFilledIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addFilled } from '@stacksjs/iconify-weui'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addFilled, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addFilled } from '@stacksjs/iconify-weui'

// Icons are typed as IconData
const myIcon: IconData = addFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: WeUI ([Website](https://github.com/weui/weui-icon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/weui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/weui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
