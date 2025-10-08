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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdHocMarkerIcon, BusinessRuleIcon, BusinessRuleTaskIcon } from '@stacksjs/iconify-bpmn'

// Basic usage
const icon = AdHocMarkerIcon()

// With size
const sizedIcon = AdHocMarkerIcon({ size: 24 })

// With color
const coloredIcon = BusinessRuleIcon({ color: 'red' })

// With multiple props
const customIcon = BusinessRuleTaskIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdHocMarkerIcon, BusinessRuleIcon, BusinessRuleTaskIcon } from '@stacksjs/iconify-bpmn'

  global.icons = {
    home: AdHocMarkerIcon({ size: 24 }),
    user: BusinessRuleIcon({ size: 24, color: '#4a90e2' }),
    settings: BusinessRuleTaskIcon({ size: 32 })
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
import { adHocMarker, businessRule, businessRuleTask } from '@stacksjs/iconify-bpmn'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adHocMarker, { size: 24 })
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
const redIcon = AdHocMarkerIcon({ color: 'red' })
const blueIcon = AdHocMarkerIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdHocMarkerIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdHocMarkerIcon({ class: 'text-primary' })
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
const icon24 = AdHocMarkerIcon({ size: 24 })
const icon1em = AdHocMarkerIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdHocMarkerIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdHocMarkerIcon({ height: '1em' })
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
const smallIcon = AdHocMarkerIcon({ class: 'icon-small' })
const largeIcon = AdHocMarkerIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **112** icons:

- `adHocMarker`
- `businessRule`
- `businessRuleTask`
- `callActivity`
- `compensationMarker`
- `conditionalFlow`
- `connection`
- `connectionMulti`
- `dataInput`
- `dataObject`
- `dataOutput`
- `dataStore`
- `defaultFlow`
- `endEvent`
- `endEventCancel`
- `endEventCompensation`
- `endEventError`
- `endEventEscalation`
- `endEventLink`
- `endEventMessage`
- `endEventMultiple`
- `endEventNone`
- `endEventSignal`
- `endEventTerminate`
- `eventSubprocessExpanded`
- `gateway`
- `gatewayComplex`
- `gatewayEventbased`
- `gatewayNone`
- `gatewayOr`
- `gatewayParallel`
- `gatewayXor`
- `group`
- `handTool`
- `intermediateEvent`
- `intermediateEventCatchCancel`
- `intermediateEventCatchCompensation`
- `intermediateEventCatchCondition`
- `intermediateEventCatchError`
- `intermediateEventCatchEscalation`
- `intermediateEventCatchLink`
- `intermediateEventCatchMessage`
- `intermediateEventCatchMultiple`
- `intermediateEventCatchNonInterruptingCondition`
- `intermediateEventCatchNonInterruptingEscalation`
- `intermediateEventCatchNonInterruptingMessage`
- `intermediateEventCatchNonInterruptingMultiple`
- `intermediateEventCatchNonInterruptingParallelMultiple`
- `intermediateEventCatchNonInterruptingSignal`
- `intermediateEventCatchNonInterruptingTimer`
- `intermediateEventCatchParallelMultiple`
- `intermediateEventCatchSignal`
- `intermediateEventCatchTimer`
- `intermediateEventNonInterrupting`
- `intermediateEventNone`
- `intermediateEventThrowCompensation`
- `intermediateEventThrowEscalation`
- `intermediateEventThrowLink`
- `intermediateEventThrowMessage`
- `intermediateEventThrowMultiple`
- `intermediateEventThrowSignal`
- `lane`
- `laneDivideThree`
- `laneDivideTwo`
- `laneInsertAbove`
- `laneInsertBelow`
- `lassoTool`
- `loopMarker`
- `manual`
- `manualTask`
- `parallelMiMarker`
- `participant`
- `receive`
- `receiveTask`
- `screwWrench`
- `script`
- `scriptTask`
- `send`
- `sendTask`
- `sequentialMiMarker`
- `service`
- `serviceTask`
- `spaceTool`
- `startEvent`
- `startEventCompensation`
- `startEventCondition`
- `startEventError`
- `startEventEscalation`
- `startEventMessage`
- `startEventMultiple`
- `startEventNonInterrupting`
- `startEventNonInterruptingCondition`
- `startEventNonInterruptingEscalation`
- `startEventNonInterruptingMessage`
- `startEventNonInterruptingMultiple`
- `startEventNonInterruptingParallelMultiple`
- `startEventNonInterruptingSignal`
- `startEventNonInterruptingTimer`
- `startEventNone`
- `startEventParallelMultiple`
- `startEventSignal`
- `startEventTimer`
- `subProcessMarker`
- `subprocessCollapsed`
- `subprocessExpanded`
- `task`
- `taskNone`
- `textAnnotation`
- `transaction`
- `trash`
- `user`
- `userTask`

## Usage Examples

### Navigation Menu

```html
@js
  import { AdHocMarkerIcon, BusinessRuleIcon, BusinessRuleTaskIcon, CallActivityIcon } from '@stacksjs/iconify-bpmn'

  global.navIcons = {
    home: AdHocMarkerIcon({ size: 20, class: 'nav-icon' }),
    about: BusinessRuleIcon({ size: 20, class: 'nav-icon' }),
    contact: BusinessRuleTaskIcon({ size: 20, class: 'nav-icon' }),
    settings: CallActivityIcon({ size: 20, class: 'nav-icon' })
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
import { AdHocMarkerIcon } from '@stacksjs/iconify-bpmn'

const icon = AdHocMarkerIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdHocMarkerIcon, BusinessRuleIcon, BusinessRuleTaskIcon } from '@stacksjs/iconify-bpmn'

const successIcon = AdHocMarkerIcon({ size: 16, color: '#22c55e' })
const warningIcon = BusinessRuleIcon({ size: 16, color: '#f59e0b' })
const errorIcon = BusinessRuleTaskIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdHocMarkerIcon, BusinessRuleIcon } from '@stacksjs/iconify-bpmn'
   const icon = AdHocMarkerIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { adHocMarker, businessRule } from '@stacksjs/iconify-bpmn'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(adHocMarker, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdHocMarkerIcon, BusinessRuleIcon } from '@stacksjs/iconify-bpmn'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-bpmn'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdHocMarkerIcon } from '@stacksjs/iconify-bpmn'
     global.icon = AdHocMarkerIcon({ size: 24 })
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
   const icon = AdHocMarkerIcon({ class: 'icon' })
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
