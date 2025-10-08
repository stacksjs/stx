# Feather Icon

> Feather Icon icons for stx from Iconify

## Overview

This package provides access to 255 icons from the Feather Icon collection through the stx iconify integration.

**Collection ID:** `fe`
**Total Icons:** 255
**Author:** Megumi Hano ([Website](https://github.com/feathericon/feathericon))
**License:** MIT ([Details](https://github.com/feathericon/feathericon/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fe
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ActivityIcon, AddCartIcon, AlignBottomIcon } from '@stacksjs/iconify-fe'

// Basic usage
const icon = ActivityIcon()

// With size
const sizedIcon = ActivityIcon({ size: 24 })

// With color
const coloredIcon = AddCartIcon({ color: 'red' })

// With multiple props
const customIcon = AlignBottomIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ActivityIcon, AddCartIcon, AlignBottomIcon } from '@stacksjs/iconify-fe'

  global.icons = {
    home: ActivityIcon({ size: 24 }),
    user: AddCartIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignBottomIcon({ size: 32 })
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
import { activity, addCart, alignBottom } from '@stacksjs/iconify-fe'
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

This package contains **255** icons:

- `activity`
- `addCart`
- `alignBottom`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `alignTop`
- `alignVertically`
- `angry`
- `appMenu`
- `apron`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `artboard`
- `audioPlayer`
- `backward`
- `bar`
- `barChart`
- `beer`
- `beginner`
- `bell`
- `birthdayCake`
- `bold`
- `bolt`
- `book`
- `bookmark`
- `bread`
- `browser`
- `brush`
- `bug`
- `building`
- `bus`
- `cage`
- `calendar`
- `camera`
- `car`
- `cart`
- `check`
- `checkCircle`
- `checkCircleO`
- `checkVerified`
- `clock`
- `close`
- `cloud`
- `cocktail`
- `code`
- `codepen`
- `coffee`
- `columns`
- `comment`
- `commentO`
- `commenting`
- `comments`
- `compress`
- `creditCard`
- `crop`
- `cry`
- `cutlery`
- `deleteLink`
- `desktop`
- `diamond`
- `difference`
- `disabled`
- `disappointed`
- `distributeHorizontally`
- `distributeVertically`
- `document`
- `donut`
- `download`
- `dropDown`
- `dropLeft`
- `dropRight`
- `dropUp`
- `edit`
- `eject`
- `elipsisH`
- `elipsisV`
- `equalizer`
- `eraser`
- `expand`
- `export`
- `eye`
- `facebook`
- `fastBackward`
- `fastForward`
- `feather`
- `feed`
- `file`
- `fileAudio`
- `fileExcel`
- `fileImage`
- `fileMovie`
- `filePowerpoint`
- `fileWord`
- `fileZip`
- `filter`
- `flag`
- `folder`
- `folderOpen`
- `fork`
- `forward`
- `frowing`
- `fryingPan`
- `gamepad`
- `gear`
- `gift`
- `git`
- `github`
- `githubAlt`
- `globe`
- `google`
- `googlePlus`
- `hash`
- `headphone`
- `heart`
- `heartO`
- `home`
- `import`
- `info`
- `insertLink`
- `instagram`
- `intersect`
- `italic`
- `key`
- `keyboard`
- `kitchenCooker`
- `laptop`
- `layer`
- `layout`
- `lineChart`
- `link`
- `linkExternal`
- `listBullet`
- `listOrder`
- `listTask`
- `location`
- `lock`
- `login`
- `logout`
- `loop`
- `magic`
- `mail`
- `map`
- `mask`
- `medal`
- `megaphone`
- `mention`
- `messanger`
- `minus`
- `mitarashiDango`
- `mobile`
- `money`
- `moon`
- `mouse`
- `music`
- `noticeActive`
- `noticeOff`
- `noticeOn`
- `noticePush`
- `octpus`
- `openMouth`
- `palette`
- `paperPlane`
- `pause`
- `pencil`
- `phone`
- `picture`
- `pictureSquare`
- `pieChart`
- `pinterest`
- `pizza`
- `play`
- `plug`
- `plus`
- `pocket`
- `pot`
- `print`
- `prototype`
- `question`
- `quoteLeft`
- `quoteRight`
- `rage`
- `random`
- `removeCart`
- `riceCracker`
- `rocket`
- `scale`
- `search`
- `searchMinus`
- `searchPlus`
- `share`
- `shield`
- `shoppingBag`
- `sitemap`
- `smile`
- `smileAlt`
- `smileHeart`
- `smilePlus`
- `speaker`
- `squid`
- `star`
- `starO`
- `stepBackward`
- `stepForward`
- `stop`
- `subtract`
- `sunnyO`
- `sunrise`
- `sync`
- `table`
- `tablet`
- `tag`
- `target`
- `taxi`
- `terminal`
- `textAlignCenter`
- `textAlignJustify`
- `textAlignLeft`
- `textAlignRight`
- `textSize`
- `ticket`
- `tiled`
- `timeline`
- `tired`
- `train`
- `trash`
- `trophy`
- `truck`
- `tumblerGlass`
- `twitter`
- `umbrella`
- `underline`
- `union`
- `unlock`
- `upload`
- `usb`
- `user`
- `userMinus`
- `userPlus`
- `users`
- `vector`
- `video`
- `vr`
- `wallet`
- `warning`
- `watch`
- `watchAlt`
- `wineGlass`
- `wordpress`
- `wordpressAlt`
- `wrench`
- `yakiDango`
- `youtube`

## Usage Examples

### Navigation Menu

```html
@js
  import { ActivityIcon, AddCartIcon, AlignBottomIcon, AlignCenterIcon } from '@stacksjs/iconify-fe'

  global.navIcons = {
    home: ActivityIcon({ size: 20, class: 'nav-icon' }),
    about: AddCartIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignBottomIcon({ size: 20, class: 'nav-icon' }),
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
import { ActivityIcon } from '@stacksjs/iconify-fe'

const icon = ActivityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ActivityIcon, AddCartIcon, AlignBottomIcon } from '@stacksjs/iconify-fe'

const successIcon = ActivityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddCartIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignBottomIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ActivityIcon, AddCartIcon } from '@stacksjs/iconify-fe'
   const icon = ActivityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { activity, addCart } from '@stacksjs/iconify-fe'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(activity, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ActivityIcon, AddCartIcon } from '@stacksjs/iconify-fe'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fe'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ActivityIcon } from '@stacksjs/iconify-fe'
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
import { activity } from '@stacksjs/iconify-fe'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/feathericon/feathericon/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Megumi Hano ([Website](https://github.com/feathericon/feathericon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fe/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fe/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
