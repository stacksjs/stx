# Meteor Icons

> Meteor Icons icons for stx from Iconify

## Overview

This package provides access to 321 icons from the Meteor Icons collection through the stx iconify integration.

**Collection ID:** `meteor-icons`
**Total Icons:** 321
**Author:** zkreations ([Website](https://github.com/zkreations/icons))
**License:** MIT ([Details](https://github.com/zkreations/icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-meteor-icons
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
    <AirplayIcon size="24" color="#4a90e2" />
    <AlarmClockIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { adobe, airplay, alarmClock } from '@stacksjs/iconify-meteor-icons'
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
.meteorIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdobeIcon class="meteorIcons-icon" />
```

## Available Icons

This package contains **321** icons:

- `adobe`
- `airplay`
- `alarmClock`
- `alarmExclamation`
- `alarmMinus`
- `alarmPlus`
- `alarmSnooze`
- `album`
- `algolia`
- `alien`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `amazon`
- `anchor`
- `android`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `anglesDown`
- `anglesLeft`
- `anglesRight`
- `anglesUp`
- `appGallery`
- `appStore`
- `apple`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownLong`
- `arrowDownRight`
- `arrowLeft`
- `arrowLeftLong`
- `arrowRight`
- `arrowRightLong`
- `arrowRotate`
- `arrowTrendDown`
- `arrowTrendUp`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpLong`
- `arrowUpRight`
- `arrowsRotate`
- `at`
- `atom`
- `backward`
- `backwardStep`
- `badgeCheck`
- `bagShopping`
- `bars`
- `barsFilter`
- `barsSort`
- `bilibili`
- `binance`
- `blogger`
- `bluesky`
- `bolt`
- `book`
- `bookOpen`
- `bookmark`
- `bookmarkAlt`
- `boolean`
- `boxArchive`
- `brackets`
- `bracketsAngled`
- `bracketsCurly`
- `bracketsRound`
- `broom`
- `bullhorn`
- `calendar`
- `carrot`
- `cartShopping`
- `cassetteTape`
- `chain`
- `check`
- `checkDouble`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chevronsDown`
- `chevronsLeft`
- `chevronsRight`
- `chevronsUp`
- `chrome`
- `circle`
- `circleCheck`
- `circleExclamation`
- `circleXmark`
- `clock`
- `clockRotate`
- `cloud`
- `clover`
- `code`
- `codepen`
- `codesandbox`
- `coffee`
- `coinbase`
- `columns`
- `columns3`
- `command`
- `comment`
- `commentDots`
- `compactDisc`
- `compress`
- `cookie`
- `copy`
- `copyright`
- `creditCard`
- `cross`
- `cube`
- `desktop`
- `deviantart`
- `devices`
- `dice`
- `disc`
- `discord`
- `disqus`
- `dollar`
- `download`
- `downloadCloud`
- `dribbble`
- `droplet`
- `ellipsis`
- `ellipsisVertical`
- `envelope`
- `equals`
- `eraser`
- `euro`
- `expand`
- `eye`
- `faceAngry`
- `faceFrown`
- `faceLaugh`
- `faceMeh`
- `faceMehBlank`
- `faceSmile`
- `facebook`
- `facebookAlt`
- `feather`
- `figma`
- `file`
- `fileLines`
- `fileMinus`
- `filePlus`
- `fileSearch`
- `film`
- `filter`
- `fingerprint`
- `fire`
- `flipboard`
- `floppyDisk`
- `folder`
- `folderMinus`
- `folderPlus`
- `folderSearch`
- `forward`
- `forwardStep`
- `gamepad`
- `gamepadModern`
- `gear`
- `getPocket`
- `ghost`
- `gift`
- `gitBranch`
- `gitCommit`
- `gitFork`
- `gitMerge`
- `gitPull`
- `github`
- `gitlab`
- `globe`
- `gohugo`
- `google`
- `googleDrive`
- `googlePlay`
- `grid`
- `gridPlus`
- `gripDots`
- `gripDotsVertical`
- `gumroad`
- `headphones`
- `heart`
- `hexagon`
- `home`
- `image`
- `images`
- `indent`
- `instagram`
- `key`
- `keySkeleton`
- `language`
- `laptop`
- `laravel`
- `layout`
- `leaf`
- `link`
- `linkedin`
- `list`
- `listMusic`
- `location`
- `locationCrosshairs`
- `locationDot`
- `lock`
- `map`
- `mapPin`
- `mega`
- `message`
- `messageDots`
- `meta`
- `meteor`
- `microchip`
- `microphone`
- `minus`
- `mobile`
- `moon`
- `music`
- `musicNote`
- `newspaper`
- `objectsColumn`
- `openSource`
- `openai`
- `outdent`
- `paintRoller`
- `palette`
- `paperPlane`
- `paperclip`
- `patreon`
- `pause`
- `paw`
- `paypal`
- `pencil`
- `pexels`
- `pin`
- `pinterest`
- `play`
- `plug`
- `plus`
- `power`
- `quoteLeft`
- `quoteRight`
- `radio`
- `reddit`
- `rhombus`
- `robot`
- `rows`
- `rows3`
- `rss`
- `search`
- `share`
- `shield`
- `shuffle`
- `sidebar`
- `skull`
- `soundcloud`
- `sparkle`
- `sparkles`
- `spotify`
- `square`
- `squareExclamation`
- `star`
- `sterling`
- `sun`
- `tableCells`
- `tableLayout`
- `tableList`
- `tag`
- `telegram`
- `terminal`
- `text`
- `threads`
- `thumbsDown`
- `thumbsUp`
- `tiktok`
- `trash`
- `trashCan`
- `tree`
- `treeDeciduous`
- `trello`
- `triangle`
- `triangleExclamation`
- `tumblr`
- `turnDownLeft`
- `turnDownRight`
- `turnLeftDown`
- `turnLeftUp`
- `turnRightDown`
- `turnRightUp`
- `turnUpLeft`
- `turnUpRight`
- `tv`
- `tvRetro`
- `twitch`
- `twitter`
- `unlink`
- `upload`
- `uploadCloud`
- `usdt`
- `user`
- `vimeo`
- `vinylDisc`
- `visualStudioCode`
- `vk`
- `volumeHigh`
- `volumeLow`
- `volumeOff`
- `volumeXmark`
- `wave`
- `waveLines`
- `wavePulse`
- `waveSquare`
- `waveTriangle`
- `whatsapp`
- `wikipedia`
- `wind`
- `windows`
- `wordpress`
- `x`
- `xAlt`
- `xmark`
- `youtube`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AdobeIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AirplayIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmClockIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlarmExclamationIcon size="20" class="nav-icon" /> Settings</a>
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
    <AirplayIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmClockIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdobeIcon size="24" />
   <AirplayIcon size="24" color="#4a90e2" />
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
     import { adobe } from '@stacksjs/iconify-meteor-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(adobe, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adobe } from '@stacksjs/iconify-meteor-icons'

// Icons are typed as IconData
const myIcon: IconData = adobe
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/zkreations/icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: zkreations ([Website](https://github.com/zkreations/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/meteor-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/meteor-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
