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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddToListIcon height="1em" />
<AddToListIcon width="1em" height="1em" />
<AddToListIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddToListIcon size="24" />
<AddToListIcon size="1em" />

<!-- Using width and height -->
<AddToListIcon width="24" height="32" />

<!-- With color -->
<AddToListIcon size="24" color="red" />
<AddToListIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddToListIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddToListIcon
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
    <AddToListIcon size="24" />
    <AddUserIcon size="24" color="#4a90e2" />
    <AddressIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AddToListIcon size="24" color="red" />
<AddToListIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddToListIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddToListIcon size="24" class="text-primary" />
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
<AddToListIcon height="1em" />
<AddToListIcon width="1em" height="1em" />
<AddToListIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddToListIcon size="24" />
<AddToListIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.entypo-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddToListIcon class="entypo-icon" />
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
<nav>
  <a href="/"><AddToListIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddUserIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddressIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdjustIcon size="20" class="nav-icon" /> Settings</a>
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
<AddToListIcon
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
    <AddToListIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddUserIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddressIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddToListIcon size="24" />
   <AddUserIcon size="24" color="#4a90e2" />
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
   <AddToListIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddToListIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddToListIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addToList } from '@stacksjs/iconify-entypo'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addToList, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
