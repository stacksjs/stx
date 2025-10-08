# Nonicons

> Nonicons icons for stx from Iconify

## Overview

This package provides access to 69 icons from the Nonicons collection through the stx iconify integration.

**Collection ID:** `nonicons`
**Total Icons:** 69
**Author:** yamatsum ([Website](https://github.com/yamatsum/nonicons))
**License:** MIT ([Details](https://github.com/yamatsum/nonicons/blob/master/LICENSE))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-nonicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { Angular16Icon, Babel16Icon, Biome16Icon } from '@stacksjs/iconify-nonicons'

// Basic usage
const icon = Angular16Icon()

// With size
const sizedIcon = Angular16Icon({ size: 24 })

// With color
const coloredIcon = Babel16Icon({ color: 'red' })

// With multiple props
const customIcon = Biome16Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { Angular16Icon, Babel16Icon, Biome16Icon } from '@stacksjs/iconify-nonicons'

  global.icons = {
    home: Angular16Icon({ size: 24 }),
    user: Babel16Icon({ size: 24, color: '#4a90e2' }),
    settings: Biome16Icon({ size: 32 })
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
import { angular16, babel16, biome16 } from '@stacksjs/iconify-nonicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(angular16, { size: 24 })
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
const redIcon = Angular16Icon({ color: 'red' })
const blueIcon = Angular16Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = Angular16Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = Angular16Icon({ class: 'text-primary' })
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
const icon24 = Angular16Icon({ size: 24 })
const icon1em = Angular16Icon({ size: '1em' })

// Set individual dimensions
const customIcon = Angular16Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = Angular16Icon({ height: '1em' })
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
const smallIcon = Angular16Icon({ class: 'icon-small' })
const largeIcon = Angular16Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **69** icons:

- `angular16`
- `babel16`
- `biome16`
- `c16`
- `cPlusplus16`
- `cSharp16`
- `capacitor16`
- `class16`
- `constant16`
- `css16`
- `dart16`
- `docker16`
- `elixir16`
- `elm16`
- `error16`
- `eslint16`
- `field16`
- `go16`
- `graphql16`
- `html16`
- `interface16`
- `ionic16`
- `java16`
- `javascript16`
- `json16`
- `keyword16`
- `kotlin16`
- `kubernetes16`
- `layout16`
- `loading16`
- `lua16`
- `next16`
- `nginx16`
- `node16`
- `notFound16`
- `npm16`
- `perl16`
- `php16`
- `prettier16`
- `prisma16`
- `python16`
- `r16`
- `react16`
- `rust16`
- `scala16`
- `snippet16`
- `struct16`
- `svelte16`
- `swift16`
- `template16`
- `terraform16`
- `tmux16`
- `toml16`
- `turborepo16`
- `type16`
- `typescript16`
- `variable16`
- `vim16`
- `vimCommandMode16`
- `vimInsertMode16`
- `vimNormalMode16`
- `vimReplaceMode16`
- `vimSelectMode16`
- `vimTerminalMode16`
- `vimVisualMode16`
- `vscode16`
- `vue16`
- `yaml16`
- `yarn16`

## Usage Examples

### Navigation Menu

```html
@js
  import { Angular16Icon, Babel16Icon, Biome16Icon, C16Icon } from '@stacksjs/iconify-nonicons'

  global.navIcons = {
    home: Angular16Icon({ size: 20, class: 'nav-icon' }),
    about: Babel16Icon({ size: 20, class: 'nav-icon' }),
    contact: Biome16Icon({ size: 20, class: 'nav-icon' }),
    settings: C16Icon({ size: 20, class: 'nav-icon' })
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
import { Angular16Icon } from '@stacksjs/iconify-nonicons'

const icon = Angular16Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { Angular16Icon, Babel16Icon, Biome16Icon } from '@stacksjs/iconify-nonicons'

const successIcon = Angular16Icon({ size: 16, color: '#22c55e' })
const warningIcon = Babel16Icon({ size: 16, color: '#f59e0b' })
const errorIcon = Biome16Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { Angular16Icon, Babel16Icon } from '@stacksjs/iconify-nonicons'
   const icon = Angular16Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { angular16, babel16 } from '@stacksjs/iconify-nonicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(angular16, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { Angular16Icon, Babel16Icon } from '@stacksjs/iconify-nonicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-nonicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { Angular16Icon } from '@stacksjs/iconify-nonicons'
     global.icon = Angular16Icon({ size: 24 })
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
   const icon = Angular16Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { angular16 } from '@stacksjs/iconify-nonicons'

// Icons are typed as IconData
const myIcon: IconData = angular16
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/yamatsum/nonicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: yamatsum ([Website](https://github.com/yamatsum/nonicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/nonicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/nonicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
