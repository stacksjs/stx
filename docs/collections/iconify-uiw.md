# uiw icons

> uiw icons icons for stx from Iconify

## Overview

This package provides access to 214 icons from the uiw icons collection through the stx iconify integration.

**Collection ID:** `uiw`
**Total Icons:** 214
**Author:** liwen0526 ([Website](https://github.com/uiwjs/icons))
**License:** MIT ([Details](https://github.com/uiwjs/icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-uiw
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdobeIcon height="1em" />
<AdobeIcon width="1em" height="1em" />
<AdobeIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdobeIcon size="24" />
<AdobeIcon size="1em" />

<!-- Using width and height -->
<AdobeIcon width="24" height="32" />

<!-- With color -->
<AdobeIcon size="24" color="red" />
<AdobeIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdobeIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdobeIcon
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
    <AdobeIcon size="24" />
    <AlipayIcon size="24" color="#4a90e2" />
    <AliwangwangIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { adobe, alipay, aliwangwang } from '@stacksjs/iconify-uiw'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adobe, { size: 24 })
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
<AdobeIcon size="24" color="red" />
<AdobeIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdobeIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdobeIcon size="24" class="text-primary" />
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
<AdobeIcon height="1em" />
<AdobeIcon width="1em" height="1em" />
<AdobeIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdobeIcon size="24" />
<AdobeIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.uiw-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdobeIcon class="uiw-icon" />
```

## Available Icons

This package contains **214** icons:

- `adobe`
- `alipay`
- `aliwangwang`
- `android`
- `androidO`
- `apple`
- `appstore`
- `appstoreO`
- `areaChart`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `arrowsAlt`
- `asterisk`
- `backward`
- `baidu`
- `barChart`
- `barcode`
- `bell`
- `cameraO`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `check`
- `checkSquare`
- `checkSquareO`
- `chrome`
- `circleCheck`
- `circleCheckO`
- `circleClose`
- `circleCloseO`
- `circleO`
- `close`
- `closeSquare`
- `closeSquareO`
- `cloudDownload`
- `cloudDownloadO`
- `cloudUpload`
- `cloudUploadO`
- `coffee`
- `component`
- `copy`
- `copyright`
- `css3`
- `cut`
- `dArrowLeft`
- `dArrowRight`
- `dCaret`
- `dashboard`
- `date`
- `delete`
- `dingding`
- `dislikeO`
- `document`
- `dotChart`
- `down`
- `downCircle`
- `downCircleO`
- `downSquare`
- `downSquareO`
- `download`
- `edit`
- `enter`
- `environment`
- `environmentO`
- `eye`
- `eyeO`
- `facebook`
- `fileAdd`
- `fileExcel`
- `fileJpg`
- `filePdf`
- `fileText`
- `fileUnknown`
- `filter`
- `firefox`
- `folder`
- `folderAdd`
- `folderOpen`
- `forward`
- `foursquare`
- `frown`
- `frownO`
- `github`
- `githubO`
- `global`
- `heartOff`
- `heartOn`
- `home`
- `html5`
- `ie`
- `inbox`
- `information`
- `informationO`
- `laptop`
- `left`
- `leftCircle`
- `leftCircleO`
- `leftSquare`
- `leftSquareO`
- `likeO`
- `link`
- `linkedin`
- `linux`
- `loading`
- `lock`
- `login`
- `logout`
- `mail`
- `mailO`
- `man`
- `map`
- `meh`
- `mehO`
- `menu`
- `menuFold`
- `menuUnfold`
- `message`
- `minus`
- `minusCircle`
- `minusCircleO`
- `minusSquare`
- `minusSquareO`
- `mobile`
- `more`
- `notification`
- `opera`
- `paperClip`
- `pause`
- `pauseCircle`
- `pauseCircleO`
- `pay`
- `payCircleO`
- `picasa`
- `picture`
- `pieChart`
- `pinterest`
- `playCircle`
- `playCircleO`
- `plus`
- `plusCircle`
- `plusCircleO`
- `plusSquare`
- `plusSquareO`
- `poweroff`
- `printer`
- `qq`
- `qrcode`
- `questionCircle`
- `questionCircleO`
- `reddit`
- `reload`
- `right`
- `rightCircle`
- `rightCircleO`
- `rightSquare`
- `rightSquareO`
- `rollback`
- `safari`
- `safety`
- `save`
- `search`
- `setting`
- `settingO`
- `share`
- `shoppingCart`
- `shrink`
- `smile`
- `smileO`
- `squareO`
- `starOff`
- `starOn`
- `stop`
- `stopO`
- `swap`
- `swapLeft`
- `swapRight`
- `table`
- `tag`
- `tagO`
- `tags`
- `tagsO`
- `taobao`
- `time`
- `timeO`
- `twitter`
- `uiw`
- `unlock`
- `up`
- `upCircle`
- `upCircleO`
- `upSquare`
- `upSquareO`
- `upload`
- `user`
- `userAdd`
- `userDelete`
- `usergroupAdd`
- `usergroupDelete`
- `verification`
- `verticleLeft`
- `verticleRight`
- `videoCamera`
- `warning`
- `warningO`
- `weibo`
- `weixin`
- `wifi`
- `windows`
- `woman`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AdobeIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlipayIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AliwangwangIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AndroidIcon size="20" class="nav-icon" /> Settings</a>
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
<AdobeIcon
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
    <AdobeIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AlipayIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AliwangwangIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdobeIcon size="24" />
   <AlipayIcon size="24" color="#4a90e2" />
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
   <AdobeIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdobeIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdobeIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { adobe } from '@stacksjs/iconify-uiw'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(adobe, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adobe } from '@stacksjs/iconify-uiw'

// Icons are typed as IconData
const myIcon: IconData = adobe
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/uiwjs/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: liwen0526 ([Website](https://github.com/uiwjs/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/uiw/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/uiw/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
