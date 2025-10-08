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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdobeIcon, AlipayIcon, AliwangwangIcon } from '@stacksjs/iconify-uiw'

// Basic usage
const icon = AdobeIcon()

// With size
const sizedIcon = AdobeIcon({ size: 24 })

// With color
const coloredIcon = AlipayIcon({ color: 'red' })

// With multiple props
const customIcon = AliwangwangIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdobeIcon, AlipayIcon, AliwangwangIcon } from '@stacksjs/iconify-uiw'

  global.icons = {
    home: AdobeIcon({ size: 24 }),
    user: AlipayIcon({ size: 24, color: '#4a90e2' }),
    settings: AliwangwangIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AdobeIcon({ color: 'red' })
const blueIcon = AdobeIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdobeIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdobeIcon({ class: 'text-primary' })
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
const icon24 = AdobeIcon({ size: 24 })
const icon1em = AdobeIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdobeIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdobeIcon({ height: '1em' })
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
const smallIcon = AdobeIcon({ class: 'icon-small' })
const largeIcon = AdobeIcon({ class: 'icon-large' })
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
@js
  import { AdobeIcon, AlipayIcon, AliwangwangIcon, AndroidIcon } from '@stacksjs/iconify-uiw'

  global.navIcons = {
    home: AdobeIcon({ size: 20, class: 'nav-icon' }),
    about: AlipayIcon({ size: 20, class: 'nav-icon' }),
    contact: AliwangwangIcon({ size: 20, class: 'nav-icon' }),
    settings: AndroidIcon({ size: 20, class: 'nav-icon' })
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
import { AdobeIcon } from '@stacksjs/iconify-uiw'

const icon = AdobeIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdobeIcon, AlipayIcon, AliwangwangIcon } from '@stacksjs/iconify-uiw'

const successIcon = AdobeIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlipayIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AliwangwangIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdobeIcon, AlipayIcon } from '@stacksjs/iconify-uiw'
   const icon = AdobeIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { adobe, alipay } from '@stacksjs/iconify-uiw'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(adobe, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdobeIcon, AlipayIcon } from '@stacksjs/iconify-uiw'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-uiw'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdobeIcon } from '@stacksjs/iconify-uiw'
     global.icon = AdobeIcon({ size: 24 })
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
   const icon = AdobeIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
