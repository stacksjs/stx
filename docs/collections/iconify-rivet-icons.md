# Rivet Icons

> Rivet Icons icons for stx from Iconify

## Overview

This package provides access to 210 icons from the Rivet Icons collection through the stx iconify integration.

**Collection ID:** `rivet-icons`
**Total Icons:** 210
**Author:** Indiana University ([Website](https://github.com/indiana-university/rivet-icons))
**License:** BSD 3-Clause ([Details](https://github.com/indiana-university/rivet-icons/blob/develop/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-rivet-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AlarmIcon height="1em" />
<AlarmIcon width="1em" height="1em" />
<AlarmIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AlarmIcon size="24" />
<AlarmIcon size="1em" />

<!-- Using width and height -->
<AlarmIcon width="24" height="32" />

<!-- With color -->
<AlarmIcon size="24" color="red" />
<AlarmIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AlarmIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AlarmIcon
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
    <AlarmIcon size="24" />
    <AlarmSolidIcon size="24" color="#4a90e2" />
    <ArrowAnchorDownLeftIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { alarm, alarmSolid, arrowAnchorDownLeft } from '@stacksjs/iconify-rivet-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(alarm, { size: 24 })
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
<AlarmIcon size="24" color="red" />
<AlarmIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AlarmIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AlarmIcon size="24" class="text-primary" />
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
<AlarmIcon height="1em" />
<AlarmIcon width="1em" height="1em" />
<AlarmIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AlarmIcon size="24" />
<AlarmIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.rivetIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AlarmIcon class="rivetIcons-icon" />
```

## Available Icons

This package contains **210** icons:

- `alarm`
- `alarmSolid`
- `arrowAnchorDownLeft`
- `arrowAnchorDownRight`
- `arrowAnchorUpLeft`
- `arrowAnchorUpRight`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpRight`
- `audio`
- `audioOff`
- `audioOffSolid`
- `audioSolid`
- `ban`
- `banSolid`
- `bell`
- `bellSolid`
- `bookmark`
- `bookmarkSolid`
- `browserWindow`
- `browserWindowSolid`
- `building`
- `buildingSolid`
- `bus`
- `calendar`
- `calendarSolid`
- `caution`
- `cautionSolid`
- `chat`
- `chatSolid`
- `check`
- `checkAll`
- `checkCircle`
- `checkCircleBreakout`
- `checkCircleSolid`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chevronsLeft`
- `chevronsRight`
- `circle`
- `circleSolid`
- `clipboard`
- `clipboardSolid`
- `clock`
- `clockSolid`
- `close`
- `closeCircle`
- `closeCircleSolid`
- `code`
- `collapse`
- `copy`
- `copySolid`
- `creditCard`
- `creditCardSolid`
- `css`
- `data`
- `dataSolid`
- `device`
- `deviceSolid`
- `download`
- `ellipsis`
- `ellipsisVertical`
- `envelope`
- `envelopeSolid`
- `exclamationMark`
- `exclamationMarkCircle`
- `exclamationMarkCircleSolid`
- `expand`
- `eye`
- `eyeOff`
- `eyeOffSolid`
- `eyeSolid`
- `file`
- `fileSolid`
- `filter`
- `filterSolid`
- `flag`
- `flagSolid`
- `gear`
- `gearSolid`
- `gears`
- `globe`
- `globeSolid`
- `grid`
- `gridHorizontal`
- `gridSolid`
- `gridVertical`
- `happy`
- `happySolid`
- `headphones`
- `headphonesSolid`
- `heart`
- `heartSolid`
- `home`
- `homeSolid`
- `image`
- `imageSolid`
- `inbox`
- `inboxComplete`
- `inboxCompleteSolid`
- `inboxSolid`
- `infoCircle`
- `infoCircleSolid`
- `laptop`
- `laptopSolid`
- `lightning`
- `lightningBox`
- `lightningBoxSolid`
- `link`
- `linkExternal`
- `list`
- `lockClosed`
- `lockClosedSolid`
- `lockOpen`
- `lockOpenSolid`
- `magnifyingGlass`
- `mapPin`
- `mapPinSolid`
- `megaphone`
- `megaphoneSolid`
- `menu`
- `microphone`
- `microphoneOff`
- `microphoneOffSolid`
- `microphoneSolid`
- `minus`
- `minusCircle`
- `minusCircleSolid`
- `money`
- `neutral`
- `neutralSolid`
- `newspaper`
- `newspaperSolid`
- `note`
- `noteSolid`
- `orderedList`
- `pageBottom`
- `pageTop`
- `parking`
- `parkingSolid`
- `pause`
- `pencil`
- `pencilSolid`
- `phone`
- `phoneMobile`
- `phoneMobileSolid`
- `pin`
- `pinSolid`
- `plane`
- `planeSolid`
- `play`
- `playSolid`
- `plus`
- `plusCircle`
- `plusCircleSolid`
- `printer`
- `printerSolid`
- `questionMark`
- `questionMarkSolid`
- `redo`
- `rss`
- `sad`
- `sadSolid`
- `save`
- `saveSolid`
- `settings`
- `share`
- `shareSolid`
- `shirt`
- `shirtSolid`
- `shoppingBag`
- `shoppingBagSolid`
- `shoppingCart`
- `shoppingCartSolid`
- `sidebyside`
- `sidebysideSolid`
- `star`
- `starSolid`
- `sync`
- `thumbsDown`
- `thumbsDownSolid`
- `thumbsUp`
- `thumbsUpSolid`
- `transfer`
- `transferAlt`
- `trash`
- `trashSolid`
- `undo`
- `upload`
- `user`
- `userAdd`
- `userAddSolid`
- `userGroup`
- `userGroupSolid`
- `userRemove`
- `userRemoveSolid`
- `userSolid`
- `utensils`
- `utensilsSolid`
- `video`
- `videoOff`
- `videoOffSolid`
- `videoSolid`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AlarmIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlarmSolidIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ArrowAnchorDownLeftIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrowAnchorDownRightIcon size="20" class="nav-icon" /> Settings</a>
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
<AlarmIcon
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
    <AlarmIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AlarmSolidIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ArrowAnchorDownLeftIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AlarmIcon size="24" />
   <AlarmSolidIcon size="24" color="#4a90e2" />
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
   <AlarmIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AlarmIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AlarmIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { alarm } from '@stacksjs/iconify-rivet-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(alarm, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { alarm } from '@stacksjs/iconify-rivet-icons'

// Icons are typed as IconData
const myIcon: IconData = alarm
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

BSD 3-Clause

See [license details](https://github.com/indiana-university/rivet-icons/blob/develop/LICENSE) for more information.

## Credits

- **Icons**: Indiana University ([Website](https://github.com/indiana-university/rivet-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/rivet-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/rivet-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
