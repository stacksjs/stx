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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dPrintIcon height="1em" />
<3dPrintIcon width="1em" height="1em" />
<3dPrintIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dPrintIcon size="24" />
<3dPrintIcon size="1em" />

<!-- Using width and height -->
<3dPrintIcon width="24" height="32" />

<!-- With color -->
<3dPrintIcon size="24" color="red" />
<3dPrintIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dPrintIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dPrintIcon
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
    <3dPrintIcon size="24" />
    <AbstractIcon size="24" color="#4a90e2" />
    <AbstractIncompleteIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<3dPrintIcon size="24" color="red" />
<3dPrintIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dPrintIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dPrintIcon size="24" class="text-primary" />
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
<3dPrintIcon height="1em" />
<3dPrintIcon width="1em" height="1em" />
<3dPrintIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dPrintIcon size="24" />
<3dPrintIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.eosIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dPrintIcon class="eosIcons-icon" />
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
<nav>
  <a href="/"><3dPrintIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AbstractIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AbstractIncompleteIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AbstractInstanceIcon size="20" class="nav-icon" /> Settings</a>
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
<3dPrintIcon
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
    <3dPrintIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AbstractIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AbstractIncompleteIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dPrintIcon size="24" />
   <AbstractIcon size="24" color="#4a90e2" />
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
   <3dPrintIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dPrintIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dPrintIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3dPrint } from '@stacksjs/iconify-eos-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dPrint, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
