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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<ActivityIcon height="1em" />
<ActivityIcon width="1em" height="1em" />
<ActivityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<ActivityIcon size="24" />
<ActivityIcon size="1em" />

<!-- Using width and height -->
<ActivityIcon width="24" height="32" />

<!-- With color -->
<ActivityIcon size="24" color="red" />
<ActivityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<ActivityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<ActivityIcon
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
    <ActivityIcon size="24" />
    <AddCartIcon size="24" color="#4a90e2" />
    <AlignBottomIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<ActivityIcon size="24" color="red" />
<ActivityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<ActivityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<ActivityIcon size="24" class="text-primary" />
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
<ActivityIcon height="1em" />
<ActivityIcon width="1em" height="1em" />
<ActivityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<ActivityIcon size="24" />
<ActivityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fe-icon {
  width: 1em;
  height: 1em;
}
```

```html
<ActivityIcon class="fe-icon" />
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
<nav>
  <a href="/"><ActivityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddCartIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignBottomIcon size="20" class="nav-icon" /> Contact</a>
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
<ActivityIcon
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
    <ActivityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddCartIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignBottomIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <ActivityIcon size="24" />
   <AddCartIcon size="24" color="#4a90e2" />
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
   <ActivityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <ActivityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <ActivityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { activity } from '@stacksjs/iconify-fe'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(activity, { size: 24 })
   @endjs

   {!! customIcon !!}
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
