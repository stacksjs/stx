# BPMN

> BPMN icons for stx from Iconify

## Overview

This package provides access to 112 icons from the BPMN collection through the stx iconify integration.

**Collection ID:** `bpmn`
**Total Icons:** 112
**Author:** Camunda Services GmbH ([Website](https://github.com/bpmn-io/bpmn-font))
**License:** Open Font License ([Details](https://github.com/bpmn-io/bpmn-font/blob/master/LICENSE))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bpmn
```

## Quick Start

### In stx Templates

```html
@js
  import { adHocMarker, businessRule, businessRuleTask } from '@stacksjs/iconify-bpmn'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    adHocMarker: renderIcon(adHocMarker, { size: 24 }),
    businessRule: renderIcon(businessRule, { size: 24, color: '#4a90e2' }),
    businessRuleTask: renderIcon(businessRuleTask, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.adHocMarker !!}
  {!! icons.businessRule !!}
  {!! icons.businessRuleTask !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { adHocMarker, businessRule, businessRuleTask } from '@stacksjs/iconify-bpmn'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(adHocMarker, { size: 24 })

// With custom color
const coloredIcon = renderIcon(businessRule, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(businessRuleTask, {
  size: 24,
  rotate: 90,
  hFlip: true
})
```

## Icon Options

The `renderIcon` function accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `string \| number` | - | Icon size (both width and height) |
| `width` | `string \| number` | - | Icon width |
| `height` | `string \| number` | - | Icon height |
| `color` | `string` | `'currentColor'` | Icon color (hex or CSS color) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation in degrees |
| `class` | `string` | - | Additional CSS classes |
| `style` | `string` | - | Additional inline styles |

## Available Icons

This package contains **112** icons. Here are some examples:

- `adHocMarker`
- `businessRule`
- `businessRuleTask`
- `callActivity`
- `compensationMarker`

...and 102 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/bpmn/).

## Usage Examples

### Navigation Menu

```html
@js
  import { adHocMarker, businessRule, businessRuleTask, callActivity } from '@stacksjs/iconify-bpmn'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    adHocMarker: renderIcon(adHocMarker, { size: 20, class: 'nav-icon' }),
    businessRule: renderIcon(businessRule, { size: 20, class: 'nav-icon' }),
    businessRuleTask: renderIcon(businessRuleTask, { size: 20, class: 'nav-icon' }),
    callActivity: renderIcon(callActivity, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.adHocMarker !!} Home</a>
  <a href="/about">{!! navIcons.businessRule !!} About</a>
  <a href="/contact">{!! navIcons.businessRuleTask !!} Contact</a>
  <a href="/settings">{!! navIcons.callActivity !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { adHocMarker } from '@stacksjs/iconify-bpmn'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(adHocMarker, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-bpmn'
import { renderIcon } from '@stacksjs/iconify-core'

function getIcon(name: string) {
  const iconData = icons[name]
  if (!iconData) return null

  return renderIcon(iconData, { size: 24 })
}
```

## Best Practices

1. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good
   import { adHocMarker, businessRule } from '@stacksjs/iconify-bpmn'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-bpmn'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { adHocMarker } from '@stacksjs/iconify-bpmn'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(adHocMarker, { size: 24 })
   @endjs

   {!! icon !!}
   {!! icon !!}
   ```

3. **Use CSS for Theming**: Apply consistent styling through CSS classes
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

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adHocMarker } from '@stacksjs/iconify-bpmn'

// Icons are typed as IconData
const myIcon: IconData = adHocMarker
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://github.com/bpmn-io/bpmn-font/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Camunda Services GmbH ([Website](https://github.com/bpmn-io/bpmn-font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bpmn/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bpmn/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
