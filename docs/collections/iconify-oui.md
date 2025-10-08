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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccessibilityIcon, AddBookmarkIcon, AggregateIcon } from '@stacksjs/iconify-oui'

// Basic usage
const icon = AccessibilityIcon()

// With size
const sizedIcon = AccessibilityIcon({ size: 24 })

// With color
const coloredIcon = AddBookmarkIcon({ color: 'red' })

// With multiple props
const customIcon = AggregateIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccessibilityIcon, AddBookmarkIcon, AggregateIcon } from '@stacksjs/iconify-oui'

  global.icons = {
    home: AccessibilityIcon({ size: 24 }),
    user: AddBookmarkIcon({ size: 24, color: '#4a90e2' }),
    settings: AggregateIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AccessibilityIcon({ color: 'red' })
const blueIcon = AccessibilityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccessibilityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccessibilityIcon({ class: 'text-primary' })
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
const icon24 = AccessibilityIcon({ size: 24 })
const icon1em = AccessibilityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccessibilityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccessibilityIcon({ height: '1em' })
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
const smallIcon = AccessibilityIcon({ class: 'icon-small' })
const largeIcon = AccessibilityIcon({ class: 'icon-large' })
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
@js
  import { AccessibilityIcon, AddBookmarkIcon, AggregateIcon, AlertIcon } from '@stacksjs/iconify-oui'

  global.navIcons = {
    home: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    about: AddBookmarkIcon({ size: 20, class: 'nav-icon' }),
    contact: AggregateIcon({ size: 20, class: 'nav-icon' }),
    settings: AlertIcon({ size: 20, class: 'nav-icon' })
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
import { AccessibilityIcon } from '@stacksjs/iconify-oui'

const icon = AccessibilityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccessibilityIcon, AddBookmarkIcon, AggregateIcon } from '@stacksjs/iconify-oui'

const successIcon = AccessibilityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddBookmarkIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AggregateIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccessibilityIcon, AddBookmarkIcon } from '@stacksjs/iconify-oui'
   const icon = AccessibilityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility, addBookmark } from '@stacksjs/iconify-oui'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccessibilityIcon, AddBookmarkIcon } from '@stacksjs/iconify-oui'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-oui'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccessibilityIcon } from '@stacksjs/iconify-oui'
     global.icon = AccessibilityIcon({ size: 24 })
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
   const icon = AccessibilityIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
