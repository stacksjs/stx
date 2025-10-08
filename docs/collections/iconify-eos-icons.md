# EOS Icons

> EOS Icons icons for stx from Iconify

## Overview

This package provides access to 253 icons from the EOS Icons collection through the stx iconify integration.

**Collection ID:** `eos-icons`
**Total Icons:** 253
**Author:** SUSE UX/UI team ([Website](https://gitlab.com/SUSE-UIUX/eos-icons))
**License:** MIT ([Details](https://gitlab.com/SUSE-UIUX/eos-icons/-/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-eos-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 3dPrintIcon, AbstractIcon, AbstractIncompleteIcon } from '@stacksjs/iconify-eos-icons'

// Basic usage
const icon = 3dPrintIcon()

// With size
const sizedIcon = 3dPrintIcon({ size: 24 })

// With color
const coloredIcon = AbstractIcon({ color: 'red' })

// With multiple props
const customIcon = AbstractIncompleteIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 3dPrintIcon, AbstractIcon, AbstractIncompleteIcon } from '@stacksjs/iconify-eos-icons'

  global.icons = {
    home: 3dPrintIcon({ size: 24 }),
    user: AbstractIcon({ size: 24, color: '#4a90e2' }),
    settings: AbstractIncompleteIcon({ size: 32 })
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
import { 3dPrint, abstract, abstractIncomplete } from '@stacksjs/iconify-eos-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3dPrint, { size: 24 })
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
const redIcon = 3dPrintIcon({ color: 'red' })
const blueIcon = 3dPrintIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 3dPrintIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 3dPrintIcon({ class: 'text-primary' })
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
const icon24 = 3dPrintIcon({ size: 24 })
const icon1em = 3dPrintIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 3dPrintIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 3dPrintIcon({ height: '1em' })
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
const smallIcon = 3dPrintIcon({ class: 'icon-small' })
const largeIcon = 3dPrintIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **253** icons:

- `3dPrint`
- `abstract`
- `abstractIncomplete`
- `abstractInstance`
- `abstractInstanceOutlined`
- `abstractOutlined`
- `actionChains`
- `actionChainsOutlined`
- `activateSubscriptions`
- `activateSubscriptionsOutlined`
- `admin`
- `adminOutlined`
- `ai`
- `aiHealing`
- `aiHealingOutlined`
- `aiOperator`
- `api`
- `apiOutlined`
- `application`
- `applicationIncomplete`
- `applicationIncompleteOutlined`
- `applicationInstance`
- `applicationInstanceOutlined`
- `applicationOutlined`
- `applicationWindow`
- `applicationWindowOutlined`
- `arrowRotate`
- `atomElectron`
- `augmentedReality`
- `autoinstallation`
- `backgroundTasks`
- `bigData`
- `bigDataOutlined`
- `blockchain`
- `bootstrapping`
- `bootstrappingOutlined`
- `branch`
- `branchOutlined`
- `bubbleLoading`
- `cleanup`
- `cloudComputing`
- `cloudComputingOutlined`
- `cloudControllerManager`
- `cluster`
- `clusterManagement`
- `clusterManagementOutlined`
- `clusterOutlined`
- `clusterRole`
- `clusterRoleBinding`
- `codeDeploy`
- `codeDeployOutlined`
- `collocation`
- `commit`
- `commitOutlined`
- `compareStates`
- `compareStatesOutlined`
- `compass`
- `configMap`
- `configurationFile`
- `configurationFileOutlined`
- `constraint`
- `container`
- `containerOutlined`
- `contentDeleted`
- `contentLifecycleManagement`
- `contentModified`
- `contentNew`
- `counting`
- `criticalBug`
- `criticalBugOutlined`
- `cronjob`
- `csvFile`
- `daemon`
- `daemonOutlined`
- `daemonSet`
- `daemonSetOutlined`
- `dataMining`
- `dataScientist`
- `dataScientistOutlined`
- `database`
- `databaseMigration`
- `databaseMigrationOutlined`
- `databaseOutlined`
- `deploy`
- `diffModified`
- `diffModifiedOutlined`
- `dns`
- `drone`
- `edgeComputing`
- `edgeComputingOutlined`
- `endpoints`
- `endpointsConnected`
- `endpointsDisconnected`
- `enhancement`
- `env`
- `fileSystem`
- `fileSystemOutlined`
- `flask`
- `fork`
- `forkOutlined`
- `genomic`
- `hardwareCircuit`
- `hourglass`
- `inbound`
- `infinity`
- `ingress`
- `initContainer`
- `initContainerOutlined`
- `installing`
- `iot`
- `ip`
- `ipOutlined`
- `job`
- `kubelet`
- `kubeletOutlined`
- `loading`
- `lockedEnv`
- `lockedEnvOutlined`
- `machineLearning`
- `machineLearningOutlined`
- `master`
- `masterOutlined`
- `merge`
- `mergeOutlined`
- `miscellaneous`
- `miscellaneousOutlined`
- `modifiedDate`
- `modifiedDateOutlined`
- `molecules`
- `moleculesOutlined`
- `monitoring`
- `move`
- `multistate`
- `namespace`
- `network`
- `networkFileSystem`
- `networkFileSystemOutlined`
- `networkPolicy`
- `networkPolicyOutlined`
- `neuralNetwork`
- `node`
- `nodeOutlined`
- `organisms`
- `organismsOutlined`
- `organization`
- `organizationOutlined`
- `outbound`
- `package`
- `packageOutlined`
- `packageUpgrade`
- `packageUpgradeOutlined`
- `packages`
- `packagesOutlined`
- `patchFixes`
- `patchFixesOutlined`
- `patterns`
- `patternsOutlined`
- `performance`
- `persistentVolume`
- `pin`
- `pinOutlined`
- `pipeline`
- `pipelineOutlined`
- `pod`
- `podAutoscaler`
- `podAutoscalerOutlined`
- `podOutlined`
- `podSecurity`
- `podSecurityOutlined`
- `primitive`
- `productClasses`
- `productClassesOutlined`
- `productSubscriptions`
- `productSubscriptionsOutlined`
- `products`
- `productsOutlined`
- `project`
- `projectOutlined`
- `proxy`
- `proxyOutlined`
- `pullRequest`
- `pullRequestOutlined`
- `pushPin`
- `pushPinOutlined`
- `quota`
- `quotaOutlined`
- `replica`
- `replicaSet`
- `repositories`
- `roleBinding`
- `roleBindingOutlined`
- `rotatingGear`
- `route`
- `sandbox`
- `sandboxOutlined`
- `satelliteAlt`
- `satelliteAltOutlined`
- `science`
- `scienceOutlined`
- `scientist`
- `scientistOutlined`
- `secret`
- `secretOutlined`
- `secureData`
- `secureDataOutlined`
- `selfHealing`
- `service`
- `serviceInstance`
- `serviceInstanceOutlined`
- `serviceOutlined`
- `servicePlan`
- `servicePlanOutlined`
- `snapshotRollback`
- `software`
- `softwareOutlined`
- `spinner`
- `state`
- `statefulSet`
- `statefulSetOutlined`
- `storageClass`
- `storageClassOutlined`
- `subscriptionManagement`
- `subscriptionsCreated`
- `subscriptionsCreatedOutlined`
- `symlink`
- `symlinkOutlined`
- `systemGroup`
- `systemImage`
- `systemImageOutlined`
- `systemOk`
- `systemOkOutlined`
- `systemReRegistered`
- `systemWarning`
- `templates`
- `templatesOutlined`
- `terminal`
- `terminalOutlined`
- `testTube`
- `threeDotsLoading`
- `timeout`
- `troubleshooting`
- `trustedOrganization`
- `typing`
- `virtualGuest`
- `virtualHostManager`
- `virtualReality`
- `virtualRealityOutlined`
- `virtualSpace`
- `volume`
- `volumeBinding`
- `volumeBindingOutlined`
- `volumeOutlined`
- `workload`

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dPrintIcon, AbstractIcon, AbstractIncompleteIcon, AbstractInstanceIcon } from '@stacksjs/iconify-eos-icons'

  global.navIcons = {
    home: 3dPrintIcon({ size: 20, class: 'nav-icon' }),
    about: AbstractIcon({ size: 20, class: 'nav-icon' }),
    contact: AbstractIncompleteIcon({ size: 20, class: 'nav-icon' }),
    settings: AbstractInstanceIcon({ size: 20, class: 'nav-icon' })
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
import { 3dPrintIcon } from '@stacksjs/iconify-eos-icons'

const icon = 3dPrintIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 3dPrintIcon, AbstractIcon, AbstractIncompleteIcon } from '@stacksjs/iconify-eos-icons'

const successIcon = 3dPrintIcon({ size: 16, color: '#22c55e' })
const warningIcon = AbstractIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AbstractIncompleteIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 3dPrintIcon, AbstractIcon } from '@stacksjs/iconify-eos-icons'
   const icon = 3dPrintIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 3dPrint, abstract } from '@stacksjs/iconify-eos-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(3dPrint, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 3dPrintIcon, AbstractIcon } from '@stacksjs/iconify-eos-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-eos-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dPrintIcon } from '@stacksjs/iconify-eos-icons'
     global.icon = 3dPrintIcon({ size: 24 })
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
   const icon = 3dPrintIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dPrint } from '@stacksjs/iconify-eos-icons'

// Icons are typed as IconData
const myIcon: IconData = 3dPrint
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://gitlab.com/SUSE-UIUX/eos-icons/-/blob/master/LICENSE) for more information.

## Credits

- **Icons**: SUSE UX/UI team ([Website](https://gitlab.com/SUSE-UIUX/eos-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/eos-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/eos-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
