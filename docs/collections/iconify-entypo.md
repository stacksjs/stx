# Entypo+

> Entypo+ icons for stx from Iconify

## Overview

This package provides access to 321 icons from the Entypo+ collection through the stx iconify integration.

**Collection ID:** `entypo`
**Total Icons:** 321
**Author:** Daniel Bruce ([Website](https://github.com/chancancode/entypo-plus))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-entypo
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddToListIcon, AddUserIcon, AddressIcon } from '@stacksjs/iconify-entypo'

// Basic usage
const icon = AddToListIcon()

// With size
const sizedIcon = AddToListIcon({ size: 24 })

// With color
const coloredIcon = AddUserIcon({ color: 'red' })

// With multiple props
const customIcon = AddressIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddToListIcon, AddUserIcon, AddressIcon } from '@stacksjs/iconify-entypo'

  global.icons = {
    home: AddToListIcon({ size: 24 }),
    user: AddUserIcon({ size: 24, color: '#4a90e2' }),
    settings: AddressIcon({ size: 32 })
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
import { addToList, addUser, address } from '@stacksjs/iconify-entypo'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addToList, { size: 24 })
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
const redIcon = AddToListIcon({ color: 'red' })
const blueIcon = AddToListIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddToListIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddToListIcon({ class: 'text-primary' })
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
const icon24 = AddToListIcon({ size: 24 })
const icon1em = AddToListIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddToListIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddToListIcon({ height: '1em' })
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
const smallIcon = AddToListIcon({ class: 'icon-small' })
const largeIcon = AddToListIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **321** icons:

- `addToList`
- `addUser`
- `address`
- `adjust`
- `air`
- `aircraft`
- `aircraftLanding`
- `aircraftTakeOff`
- `alignBottom`
- `alignHorizontalMiddle`
- `alignLeft`
- `alignRight`
- `alignTop`
- `alignVerticalMiddle`
- `archive`
- `areaGraph`
- `arrowBoldDown`
- `arrowBoldLeft`
- `arrowBoldRight`
- `arrowBoldUp`
- `arrowDown`
- `arrowLeft`
- `arrowLongDown`
- `arrowLongLeft`
- `arrowLongRight`
- `arrowLongUp`
- `arrowRight`
- `arrowUp`
- `arrowWithCircleDown`
- `arrowWithCircleLeft`
- `arrowWithCircleRight`
- `arrowWithCircleUp`
- `attachment`
- `awarenessRibbon`
- `back`
- `backInTime`
- `barGraph`
- `battery`
- `beamedNote`
- `bell`
- `blackboard`
- `block`
- `book`
- `bookmark`
- `bookmarks`
- `bowl`
- `box`
- `briefcase`
- `browser`
- `brush`
- `bucket`
- `cake`
- `calculator`
- `calendar`
- `camera`
- `ccw`
- `chat`
- `check`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronSmallDown`
- `chevronSmallLeft`
- `chevronSmallRight`
- `chevronSmallUp`
- `chevronThinDown`
- `chevronThinLeft`
- `chevronThinRight`
- `chevronThinUp`
- `chevronUp`
- `chevronWithCircleDown`
- `chevronWithCircleLeft`
- `chevronWithCircleRight`
- `chevronWithCircleUp`
- `circle`
- `circleWithCross`
- `circleWithMinus`
- `circleWithPlus`
- `circularGraph`
- `clapperboard`
- `classicComputer`
- `clipboard`
- `clock`
- `cloud`
- `code`
- `cog`
- `colours`
- `compass`
- `controllerFastBackward`
- `controllerFastForward`
- `controllerJumpToStart`
- `controllerNext`
- `controllerPaus`
- `controllerPlay`
- `controllerRecord`
- `controllerStop`
- `controllerVolume`
- `copy`
- `creativeCommons`
- `creativeCommonsAttribution`
- `creativeCommonsNoderivs`
- `creativeCommonsNoncommercialEu`
- `creativeCommonsNoncommercialUs`
- `creativeCommonsPublicDomain`
- `creativeCommonsRemix`
- `creativeCommonsShare`
- `creativeCommonsSharealike`
- `credit`
- `creditCard`
- `cross`
- `cup`
- `cw`
- `cycle`
- `database`
- `dialPad`
- `direction`
- `document`
- `documentLandscape`
- `documents`
- `dotSingle`
- `dotsThreeHorizontal`
- `dotsThreeVertical`
- `dotsTwoHorizontal`
- `dotsTwoVertical`
- `download`
- `drink`
- `drive`
- `drop`
- `edit`
- `email`
- `emojiFlirt`
- `emojiHappy`
- `emojiNeutral`
- `emojiSad`
- `erase`
- `eraser`
- `export`
- `eye`
- `eyeWithLine`
- `feather`
- `flag`
- `flash`
- `flashlight`
- `flatBrush`
- `flowBranch`
- `flowCascade`
- `flowLine`
- `flowParallel`
- `flowTree`
- `flower`
- `folder`
- `folderImages`
- `folderMusic`
- `folderVideo`
- `forward`
- `funnel`
- `gameController`
- `gauge`
- `globe`
- `graduationCap`
- `grid`
- `hairCross`
- `hand`
- `heart`
- `heartOutlined`
- `help`
- `helpWithCircle`
- `home`
- `hourGlass`
- `image`
- `imageInverted`
- `images`
- `inbox`
- `infinity`
- `info`
- `infoWithCircle`
- `install`
- `key`
- `keyboard`
- `labFlask`
- `landline`
- `language`
- `laptop`
- `layers`
- `leaf`
- `levelDown`
- `levelUp`
- `lifebuoy`
- `lightBulb`
- `lightDown`
- `lightUp`
- `lineGraph`
- `link`
- `list`
- `location`
- `locationPin`
- `lock`
- `lockOpen`
- `logOut`
- `login`
- `loop`
- `magnet`
- `magnifyingGlass`
- `mail`
- `man`
- `map`
- `mask`
- `medal`
- `megaphone`
- `menu`
- `merge`
- `message`
- `mic`
- `minus`
- `mobile`
- `modernMic`
- `moon`
- `mouse`
- `music`
- `network`
- `new`
- `newMessage`
- `news`
- `note`
- `notification`
- `oldMobile`
- `oldPhone`
- `openBook`
- `palette`
- `paperPlane`
- `pencil`
- `phone`
- `pieChart`
- `pin`
- `plus`
- `popup`
- `powerPlug`
- `priceRibbon`
- `priceTag`
- `print`
- `progressEmpty`
- `progressFull`
- `progressOne`
- `progressTwo`
- `publish`
- `quote`
- `radio`
- `removeUser`
- `reply`
- `replyAll`
- `resize100`
- `resizeFullScreen`
- `retweet`
- `rocket`
- `roundBrush`
- `rss`
- `ruler`
- `save`
- `scissors`
- `selectArrows`
- `share`
- `shareAlternitive`
- `shareable`
- `shield`
- `shop`
- `shoppingBag`
- `shoppingBasket`
- `shoppingCart`
- `shuffle`
- `signal`
- `sound`
- `soundMix`
- `soundMute`
- `sportsClub`
- `spreadsheet`
- `squaredCross`
- `squaredMinus`
- `squaredPlus`
- `star`
- `starOutlined`
- `stopwatch`
- `suitcase`
- `swap`
- `sweden`
- `switch`
- `tablet`
- `tag`
- `text`
- `textDocument`
- `textDocumentInverted`
- `thermometer`
- `thumbsDown`
- `thumbsUp`
- `thunderCloud`
- `ticket`
- `timeSlot`
- `tools`
- `trafficCone`
- `trash`
- `tree`
- `triangleDown`
- `triangleLeft`
- `triangleRight`
- `triangleUp`
- `trophy`
- `tv`
- `typing`
- `uninstall`
- `unread`
- `untag`
- `upload`
- `uploadToCloud`
- `user`
- `users`
- `vCard`
- `video`
- `vinyl`
- `voicemail`
- `wallet`
- `warning`
- `water`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddToListIcon, AddUserIcon, AddressIcon, AdjustIcon } from '@stacksjs/iconify-entypo'

  global.navIcons = {
    home: AddToListIcon({ size: 20, class: 'nav-icon' }),
    about: AddUserIcon({ size: 20, class: 'nav-icon' }),
    contact: AddressIcon({ size: 20, class: 'nav-icon' }),
    settings: AdjustIcon({ size: 20, class: 'nav-icon' })
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
import { AddToListIcon } from '@stacksjs/iconify-entypo'

const icon = AddToListIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddToListIcon, AddUserIcon, AddressIcon } from '@stacksjs/iconify-entypo'

const successIcon = AddToListIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddUserIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddressIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddToListIcon, AddUserIcon } from '@stacksjs/iconify-entypo'
   const icon = AddToListIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addToList, addUser } from '@stacksjs/iconify-entypo'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addToList, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddToListIcon, AddUserIcon } from '@stacksjs/iconify-entypo'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-entypo'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddToListIcon } from '@stacksjs/iconify-entypo'
     global.icon = AddToListIcon({ size: 24 })
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
   const icon = AddToListIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addToList } from '@stacksjs/iconify-entypo'

// Icons are typed as IconData
const myIcon: IconData = addToList
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Daniel Bruce ([Website](https://github.com/chancancode/entypo-plus))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/entypo/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/entypo/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
