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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdobeIcon, AirplayIcon, AlarmClockIcon } from '@stacksjs/iconify-meteor-icons'

// Basic usage
const icon = AdobeIcon()

// With size
const sizedIcon = AdobeIcon({ size: 24 })

// With color
const coloredIcon = AirplayIcon({ color: 'red' })

// With multiple props
const customIcon = AlarmClockIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdobeIcon, AirplayIcon, AlarmClockIcon } from '@stacksjs/iconify-meteor-icons'

  global.icons = {
    home: AdobeIcon({ size: 24 }),
    user: AirplayIcon({ size: 24, color: '#4a90e2' }),
    settings: AlarmClockIcon({ size: 32 })
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
@js
  import { AdobeIcon, AirplayIcon, AlarmClockIcon, AlarmExclamationIcon } from '@stacksjs/iconify-meteor-icons'

  global.navIcons = {
    home: AdobeIcon({ size: 20, class: 'nav-icon' }),
    about: AirplayIcon({ size: 20, class: 'nav-icon' }),
    contact: AlarmClockIcon({ size: 20, class: 'nav-icon' }),
    settings: AlarmExclamationIcon({ size: 20, class: 'nav-icon' })
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
import { AdobeIcon } from '@stacksjs/iconify-meteor-icons'

const icon = AdobeIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdobeIcon, AirplayIcon, AlarmClockIcon } from '@stacksjs/iconify-meteor-icons'

const successIcon = AdobeIcon({ size: 16, color: '#22c55e' })
const warningIcon = AirplayIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlarmClockIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdobeIcon, AirplayIcon } from '@stacksjs/iconify-meteor-icons'
   const icon = AdobeIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { adobe, airplay } from '@stacksjs/iconify-meteor-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(adobe, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdobeIcon, AirplayIcon } from '@stacksjs/iconify-meteor-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-meteor-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdobeIcon } from '@stacksjs/iconify-meteor-icons'
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
import { adobe } from '@stacksjs/iconify-meteor-icons'

// Icons are typed as IconData
const myIcon: IconData = adobe
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
