# Elegant

> Elegant icons for stx from Iconify

## Overview

This package provides access to 100 icons from the Elegant collection through the stx iconify integration.

**Collection ID:** `et`
**Total Icons:** 100
**Author:** Kenny Sing ([Website](https://github.com/pprince/etlinefont-bower))
**License:** GPL 3.0 ([Details](https://www.gnu.org/licenses/gpl.html))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-et
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdjustmentsIcon, AlarmclockIcon, AnchorIcon } from '@stacksjs/iconify-et'

// Basic usage
const icon = AdjustmentsIcon()

// With size
const sizedIcon = AdjustmentsIcon({ size: 24 })

// With color
const coloredIcon = AlarmclockIcon({ color: 'red' })

// With multiple props
const customIcon = AnchorIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdjustmentsIcon, AlarmclockIcon, AnchorIcon } from '@stacksjs/iconify-et'

  global.icons = {
    home: AdjustmentsIcon({ size: 24 }),
    user: AlarmclockIcon({ size: 24, color: '#4a90e2' }),
    settings: AnchorIcon({ size: 32 })
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
import { adjustments, alarmclock, anchor } from '@stacksjs/iconify-et'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adjustments, { size: 24 })
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
const redIcon = AdjustmentsIcon({ color: 'red' })
const blueIcon = AdjustmentsIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdjustmentsIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdjustmentsIcon({ class: 'text-primary' })
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
const icon24 = AdjustmentsIcon({ size: 24 })
const icon1em = AdjustmentsIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdjustmentsIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdjustmentsIcon({ height: '1em' })
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
const smallIcon = AdjustmentsIcon({ class: 'icon-small' })
const largeIcon = AdjustmentsIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **100** icons:

- `adjustments`
- `alarmclock`
- `anchor`
- `aperture`
- `attachments`
- `bargraph`
- `basket`
- `beaker`
- `bike`
- `bookOpen`
- `briefcase`
- `browser`
- `calendar`
- `camera`
- `caution`
- `chat`
- `circleCompass`
- `clipboard`
- `clock`
- `cloud`
- `compass`
- `desktop`
- `dial`
- `document`
- `documents`
- `download`
- `dribbble`
- `edit`
- `envelope`
- `expand`
- `facebook`
- `flag`
- `focus`
- `gears`
- `genius`
- `gift`
- `global`
- `globe`
- `googleplus`
- `grid`
- `happy`
- `hazardous`
- `heart`
- `hotairballoon`
- `hourglass`
- `key`
- `laptop`
- `layers`
- `lifesaver`
- `lightbulb`
- `linegraph`
- `linkedin`
- `lock`
- `magnifyingGlass`
- `map`
- `mapPin`
- `megaphone`
- `mic`
- `mobile`
- `newspaper`
- `notebook`
- `paintbrush`
- `paperclip`
- `pencil`
- `phone`
- `picture`
- `pictures`
- `piechart`
- `presentation`
- `pricetags`
- `printer`
- `profileFemale`
- `profileMale`
- `puzzle`
- `quote`
- `recycle`
- `refresh`
- `ribbon`
- `rss`
- `sad`
- `scissors`
- `scope`
- `search`
- `shield`
- `speedometer`
- `strategy`
- `streetsign`
- `tablet`
- `telescope`
- `toolbox`
- `tools`
- `tools2`
- `traget`
- `trophy`
- `tumblr`
- `twitter`
- `upload`
- `video`
- `wallet`
- `wine`

## Usage Examples

### Navigation Menu

```html
@js
  import { AdjustmentsIcon, AlarmclockIcon, AnchorIcon, ApertureIcon } from '@stacksjs/iconify-et'

  global.navIcons = {
    home: AdjustmentsIcon({ size: 20, class: 'nav-icon' }),
    about: AlarmclockIcon({ size: 20, class: 'nav-icon' }),
    contact: AnchorIcon({ size: 20, class: 'nav-icon' }),
    settings: ApertureIcon({ size: 20, class: 'nav-icon' })
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
import { AdjustmentsIcon } from '@stacksjs/iconify-et'

const icon = AdjustmentsIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdjustmentsIcon, AlarmclockIcon, AnchorIcon } from '@stacksjs/iconify-et'

const successIcon = AdjustmentsIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlarmclockIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AnchorIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdjustmentsIcon, AlarmclockIcon } from '@stacksjs/iconify-et'
   const icon = AdjustmentsIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { adjustments, alarmclock } from '@stacksjs/iconify-et'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(adjustments, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdjustmentsIcon, AlarmclockIcon } from '@stacksjs/iconify-et'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-et'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdjustmentsIcon } from '@stacksjs/iconify-et'
     global.icon = AdjustmentsIcon({ size: 24 })
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
   const icon = AdjustmentsIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adjustments } from '@stacksjs/iconify-et'

// Icons are typed as IconData
const myIcon: IconData = adjustments
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL 3.0

See [license details](https://www.gnu.org/licenses/gpl.html) for more information.

## Credits

- **Icons**: Kenny Sing ([Website](https://github.com/pprince/etlinefont-bower))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/et/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/et/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
