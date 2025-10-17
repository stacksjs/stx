# OpenSearch UI

> OpenSearch UI icons for stx from Iconify

## Overview

This package provides access to 444 icons from the OpenSearch UI collection through the stx iconify integration.

**Collection ID:** `oui`
**Total Icons:** 444
**Author:** OpenSearch Contributors ([Website](https://github.com/opensearch-project/oui))
**License:** Apache 2.0 ([Details](https://github.com/opensearch-project/oui/blob/main/LICENSE.txt))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-oui
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />

<!-- Using width and height -->
<AccessibilityIcon width="24" height="32" />

<!-- With color -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccessibilityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccessibilityIcon
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
    <AccessibilityIcon size="24" />
    <AddBookmarkIcon size="24" color="#4a90e2" />
    <AggregateIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accessibility, addBookmark, aggregate } from '@stacksjs/iconify-oui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility, { size: 24 })
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
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccessibilityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccessibilityIcon size="24" class="text-primary" />
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
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.oui-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccessibilityIcon class="oui-icon" />
```

## Available Icons

This package contains **444** icons:

- `accessibility`
- `addBookmark`
- `aggregate`
- `alert`
- `analyzeEvent`
- `annotation`
- `anomalyDetection`
- `apmTrace`
- `appAddData`
- `appAdvancedSettings`
- `appApm`
- `appAppSearch`
- `appAuditbeat`
- `appCanvas`
- `appCode`
- `appConsole`
- `appCrossClusterReplication`
- `appDashboard`
- `appDevtools`
- `appDiscover`
- `appEms`
- `appFilebeat`
- `appGis`
- `appGraph`
- `appGrok`
- `appHeartbeat`
- `appIndexManagement`
- `appIndexPattern`
- `appIndexRollup`
- `appLens`
- `appLogs`
- `appManagement`
- `appMetricbeat`
- `appMetrics`
- `appMl`
- `appMonitoring`
- `appNotebook`
- `appPacketbeat`
- `appPipeline`
- `appRecentlyViewed`
- `appReporting`
- `appSavedObjects`
- `appSearchProfiler`
- `appSecurity`
- `appSecurityAnalytics`
- `appSpaces`
- `appSql`
- `appTimelion`
- `appUpgradeAssistant`
- `appUptime`
- `appUsersRoles`
- `appVisualize`
- `appWatches`
- `appWorkplaceSearch`
- `apps`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `asterisk`
- `beaker`
- `bell`
- `bellSlash`
- `bolt`
- `bookOpen`
- `boxesHorizontal`
- `boxesVertical`
- `branch`
- `broom`
- `brush`
- `bug`
- `bullseye`
- `calendar`
- `chatLeft`
- `chatRight`
- `check`
- `checkInCircleEmpty`
- `checkInCircleFilled`
- `cheer`
- `clock`
- `cloudDrizzle`
- `cloudStormy`
- `cloudSunny`
- `color`
- `compass`
- `compute`
- `console`
- `continuityAbove`
- `continuityAboveBelow`
- `continuityBelow`
- `continuityWithin`
- `controlsHorizontal`
- `controlsVertical`
- `copy`
- `copyClipboard`
- `cross`
- `crossInCircleEmpty`
- `crossInCircleFilled`
- `crosshairs`
- `currency`
- `cut`
- `dashboard`
- `database`
- `dockedBottom`
- `dockedDetached`
- `dockedLeft`
- `dockedRight`
- `dockedTakeover`
- `dockedTop`
- `document`
- `documentEdit`
- `documentation`
- `documents`
- `dot`
- `download`
- `editorAlignCenter`
- `editorAlignLeft`
- `editorAlignRight`
- `editorBold`
- `editorCodeBlock`
- `editorComment`
- `editorDistributeHorizontal`
- `editorDistributeVertical`
- `editorHeading`
- `editorItalic`
- `editorItemAlignBottom`
- `editorItemAlignCenter`
- `editorItemAlignLeft`
- `editorItemAlignMiddle`
- `editorItemAlignRight`
- `editorItemAlignTop`
- `editorLink`
- `editorOrderedList`
- `editorPositionBottomLeft`
- `editorPositionBottomRight`
- `editorPositionTopLeft`
- `editorPositionTopRight`
- `editorRedo`
- `editorStrike`
- `editorTable`
- `editorUnderline`
- `editorUndo`
- `editorUnorderedList`
- `email`
- `empty`
- `eql`
- `eraser`
- `exit`
- `expand`
- `expandMini`
- `export`
- `eye`
- `eyeClosed`
- `faceHappy`
- `faceNeutral`
- `faceSad`
- `filter`
- `flag`
- `fold`
- `folderCheck`
- `folderClosed`
- `folderExclamation`
- `folderOpen`
- `fullScreen`
- `fullScreenExit`
- `function`
- `functionAdd`
- `gear`
- `generate`
- `generateContent`
- `glasses`
- `globe`
- `grab`
- `grabHorizontal`
- `grid`
- `heart`
- `heatmap`
- `help`
- `history`
- `home`
- `iInCircle`
- `image`
- `import`
- `indexClose`
- `indexEdit`
- `indexFlush`
- `indexMapping`
- `indexOpen`
- `indexRuntime`
- `indexSettings`
- `inputOutput`
- `inspect`
- `integrationGeneral`
- `integrationObservability`
- `integrationSearch`
- `integrationSecurity`
- `invert`
- `ip`
- `keyboardShortcut`
- `kqlField`
- `kqlFunction`
- `kqlOperand`
- `kqlSelector`
- `kqlValue`
- `layers`
- `lineChart`
- `link`
- `list`
- `listAdd`
- `lock`
- `lockOpen`
- `logstashFilter`
- `logstashIf`
- `logstashInput`
- `logstashOutput`
- `logstashQueue`
- `magnet`
- `magnifyWithMinus`
- `magnifyWithPlus`
- `mapMarker`
- `memory`
- `menu`
- `menuDown`
- `menuLeft`
- `menuRight`
- `menuUp`
- `merge`
- `minimize`
- `minus`
- `minusInCircle`
- `minusInCircleFilled`
- `mlClassificationJob`
- `mlCreateAdvancedJob`
- `mlCreateMultiMetricJob`
- `mlCreatePopulationJob`
- `mlCreateSingleMetricJob`
- `mlDataVisualizer`
- `mlOutlierDetectionJob`
- `mlRegressionJob`
- `mobile`
- `moon`
- `navAdministration`
- `navAiFlow`
- `navAlerting`
- `navAnomalyDetection`
- `navDashboards`
- `navData`
- `navDetectionRules`
- `navDevtools`
- `navDiscover`
- `navExperiments`
- `navGetStarted`
- `navInfo`
- `navInfra`
- `navIntegrations`
- `navJudgements`
- `navManage`
- `navMaps`
- `navModels`
- `navNotebooks`
- `navNotifications`
- `navOverview`
- `navQuerySets`
- `navReports`
- `navSearchConfigurationsln`
- `navSecurityCases`
- `navSecurityFindings`
- `navServiceMap`
- `navServices`
- `navSlos`
- `navThreatIntel`
- `navTicketing`
- `navUi`
- `nested`
- `node`
- `number`
- `offline`
- `online`
- `package`
- `pageSelect`
- `pagesSelect`
- `paint`
- `paperClip`
- `partial`
- `pause`
- `pencil`
- `percent`
- `pin`
- `pinFilled`
- `play`
- `playFilled`
- `plus`
- `plusInCircle`
- `plusInCircleFilled`
- `polygon`
- `popout`
- `power`
- `pulse`
- `push`
- `questionInCircle`
- `quote`
- `radar`
- `radius`
- `redeploy`
- `refresh`
- `reporter`
- `returnKey`
- `rocket`
- `save`
- `scale`
- `search`
- `securitySignal`
- `securitySignalDetected`
- `securitySignalResolved`
- `shard`
- `share`
- `snowflake`
- `sortDown`
- `sortLeft`
- `sortRight`
- `sortUp`
- `sortable`
- `sparkleFilled`
- `starEmpty`
- `starEmptySpace`
- `starFilled`
- `starFilledSpace`
- `starMinusEmpty`
- `starMinusFilled`
- `starPlusEmpty`
- `starPlusFilled`
- `stats`
- `stop`
- `stopFilled`
- `stopSlash`
- `storage`
- `string`
- `submodule`
- `swatchInput`
- `symlink`
- `tableDensityCompact`
- `tableDensityExpanded`
- `tableDensityNormal`
- `tableOfContents`
- `tag`
- `tear`
- `temperature`
- `thumbsDown`
- `thumbsUp`
- `timeline`
- `timeslider`
- `tokenAlias`
- `tokenAnnotation`
- `tokenArray`
- `tokenBinary`
- `tokenBoolean`
- `tokenClass`
- `tokenCompletionSuggester`
- `tokenConstant`
- `tokenDate`
- `tokenDenseVector`
- `tokenElement`
- `tokenEnum`
- `tokenEnumMember`
- `tokenEvent`
- `tokenException`
- `tokenField`
- `tokenFile`
- `tokenFlattened`
- `tokenFunction`
- `tokenGeo`
- `tokenHistogram`
- `tokenInterface`
- `tokenIp`
- `tokenJoin`
- `tokenKey`
- `tokenKeyword`
- `tokenMethod`
- `tokenModule`
- `tokenNamespace`
- `tokenNested`
- `tokenNull`
- `tokenNumber`
- `tokenObject`
- `tokenOperator`
- `tokenPackage`
- `tokenParameter`
- `tokenPercolator`
- `tokenProperty`
- `tokenRange`
- `tokenRankFeature`
- `tokenRankFeatures`
- `tokenRepo`
- `tokenSearchType`
- `tokenShape`
- `tokenString`
- `tokenStruct`
- `tokenSymbol`
- `tokenText`
- `tokenTokenCount`
- `tokenVariable`
- `training`
- `trash`
- `undeploy`
- `unfold`
- `unlink`
- `user`
- `users`
- `vector`
- `videoPlayer`
- `visArea`
- `visAreaStacked`
- `visBarHorizontal`
- `visBarHorizontalStacked`
- `visBarVertical`
- `visBarVerticalStacked`
- `visBuilder`
- `visBuilderSavedObject`
- `visGauge`
- `visGoal`
- `visLine`
- `visMapCoordinate`
- `visMapRegion`
- `visMetric`
- `visPie`
- `visQueryDql`
- `visQueryPpl`
- `visQueryPromql`
- `visQuerySql`
- `visTable`
- `visTagCloud`
- `visText`
- `visTimelion`
- `visVega`
- `visVisualBuilder`
- `wordWrap`
- `wordWrapDisabled`
- `wrench`
- `wsAnalytics`
- `wsEssentials`
- `wsObservability`
- `wsSearch`
- `wsSecurityAnalytics`
- `wsSelector`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccessibilityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddBookmarkIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AggregateIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlertIcon size="20" class="nav-icon" /> Settings</a>
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
<AccessibilityIcon
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
    <AccessibilityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddBookmarkIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AggregateIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccessibilityIcon size="24" />
   <AddBookmarkIcon size="24" color="#4a90e2" />
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
   <AccessibilityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccessibilityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccessibilityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-oui'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessibility, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility } from '@stacksjs/iconify-oui'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Apache 2.0

See [license details](https://github.com/opensearch-project/oui/blob/main/LICENSE.txt) for more information.

## Credits

- **Icons**: OpenSearch Contributors ([Website](https://github.com/opensearch-project/oui))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/oui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/oui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
