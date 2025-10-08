# Gitlab SVGs

> Gitlab SVGs icons for stx from Iconify

## Overview

This package provides access to 414 icons from the Gitlab SVGs collection through the stx iconify integration.

**Collection ID:** `pajamas`
**Total Icons:** 414
**Author:** GitLab B.V. ([Website](https://gitlab.com/gitlab-org/gitlab-svgs/-/tree/main))
**License:** MIT ([Details](https://gitlab.com/gitlab-org/gitlab-svgs/-/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pajamas
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AbuseIcon height="1em" />
<AbuseIcon width="1em" height="1em" />
<AbuseIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AbuseIcon size="24" />
<AbuseIcon size="1em" />

<!-- Using width and height -->
<AbuseIcon width="24" height="32" />

<!-- With color -->
<AbuseIcon size="24" color="red" />
<AbuseIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AbuseIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AbuseIcon
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
    <AbuseIcon size="24" />
    <AccessibilityIcon size="24" color="#4a90e2" />
    <AccountIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { abuse, accessibility, account } from '@stacksjs/iconify-pajamas'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abuse, { size: 24 })
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
<AbuseIcon size="24" color="red" />
<AbuseIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AbuseIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AbuseIcon size="24" class="text-primary" />
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
<AbuseIcon height="1em" />
<AbuseIcon width="1em" height="1em" />
<AbuseIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AbuseIcon size="24" />
<AbuseIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.pajamas-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AbuseIcon class="pajamas-icon" />
```

## Available Icons

This package contains **414** icons:

- `abuse`
- `accessibility`
- `account`
- `admin`
- `agentAi`
- `api`
- `appearance`
- `applications`
- `approval`
- `approvalSolid`
- `archive`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `assignee`
- `at`
- `attention`
- `attentionSolid`
- `attentionSolidSm`
- `autoplay`
- `bitbucket`
- `bold`
- `book`
- `bookmark`
- `branch`
- `branchDeleted`
- `brandZoom`
- `bug`
- `building`
- `bulb`
- `bullhorn`
- `calendar`
- `calendarOverdue`
- `cancel`
- `canceledCircle`
- `car`
- `catalogCheckmark`
- `chart`
- `check`
- `checkCircle`
- `checkCircleDashed`
- `checkCircleFilled`
- `checkSm`
- `checkXs`
- `cherryPickCommit`
- `chevronDoubleLgLeft`
- `chevronDoubleLgRight`
- `chevronDown`
- `chevronLeft`
- `chevronLgDown`
- `chevronLgLeft`
- `chevronLgRight`
- `chevronLgUp`
- `chevronRight`
- `chevronUp`
- `clear`
- `clearAll`
- `clock`
- `close`
- `closeXs`
- `cloudGear`
- `cloudPod`
- `cloudTerminal`
- `code`
- `collapse`
- `collapseLeft`
- `collapseRight`
- `collapseSolid`
- `comment`
- `commentDots`
- `commentLines`
- `commentNext`
- `comments`
- `commit`
- `comparison`
- `compass`
- `connected`
- `containerImage`
- `copyToClipboard`
- `creditCard`
- `dash`
- `dashCircle`
- `dashboard`
- `deployments`
- `detailsBlock`
- `diagram`
- `discord`
- `disk`
- `docChanges`
- `docChart`
- `docCode`
- `docCompressed`
- `docExpand`
- `docImage`
- `docNew`
- `docSymlink`
- `docText`
- `docVersions`
- `document`
- `documents`
- `dotGrid`
- `download`
- `drag`
- `dragHorizontal`
- `dragVertical`
- `dumbbell`
- `duoAgenticChat`
- `duoChat`
- `duoChatNew`
- `duoChatOff`
- `duplicate`
- `earth`
- `ellipsisH`
- `ellipsisV`
- `entityBlocked`
- `entityBlocking`
- `environment`
- `epic`
- `epicClosed`
- `error`
- `expand`
- `expandDown`
- `expandLeft`
- `expandRight`
- `expandUp`
- `expire`
- `export`
- `externalLink`
- `eye`
- `eyeSlash`
- `faceNeutral`
- `faceUnhappy`
- `falsePositive`
- `featureFlag`
- `featureFlagDisabled`
- `fileAddition`
- `fileAdditionSolid`
- `fileDeletion`
- `fileDeletionSolid`
- `fileModified`
- `fileModifiedSolid`
- `fileTree`
- `filter`
- `fire`
- `firstContribution`
- `flag`
- `flowAi`
- `folder`
- `folderNew`
- `folderO`
- `folderOpen`
- `food`
- `fork`
- `formula`
- `git`
- `gitMerge`
- `gitea`
- `github`
- `goBack`
- `google`
- `grip`
- `group`
- `hamburger`
- `hash`
- `heading`
- `heart`
- `highlight`
- `history`
- `home`
- `hook`
- `hourglass`
- `imageCommentDark`
- `imageCommentLight`
- `import`
- `incognito`
- `information`
- `informationO`
- `infrastructureRegistry`
- `insert`
- `issueBlock`
- `issueClose`
- `issueClosed`
- `issueNew`
- `issueOpenM`
- `issueTypeEnhancement`
- `issueTypeFeature`
- `issueTypeFeatureFlag`
- `issueTypeIncident`
- `issueTypeIssue`
- `issueTypeKeyresult`
- `issueTypeMaintenance`
- `issueTypeObjective`
- `issueTypeRequirements`
- `issueTypeTask`
- `issueTypeTestCase`
- `issueTypeTicket`
- `issueUpdate`
- `issues`
- `italic`
- `iteration`
- `key`
- `keyboard`
- `kind`
- `kubernetes`
- `kubernetesAgent`
- `label`
- `labels`
- `leave`
- `levelUp`
- `license`
- `licenseSm`
- `link`
- `linkedin`
- `listBulleted`
- `listIndent`
- `listNumbered`
- `listOutdent`
- `listTask`
- `livePreview`
- `liveStream`
- `location`
- `locationDot`
- `lock`
- `lockOpen`
- `log`
- `longArrow`
- `machineLearning`
- `mail`
- `markdownMark`
- `markdownMarkSolid`
- `marqueeSelection`
- `mastodon`
- `maximize`
- `media`
- `mediaBroken`
- `merge`
- `mergeRequest`
- `mergeRequestClose`
- `mergeRequestCloseM`
- `mergeRequestOpen`
- `messages`
- `milestone`
- `minimize`
- `mobile`
- `mobileIssueClose`
- `monitor`
- `monitorLines`
- `monitorO`
- `multipleChoice`
- `namespace`
- `nature`
- `notifications`
- `notificationsOff`
- `object`
- `organization`
- `overview`
- `package`
- `paperAirplane`
- `paperclip`
- `partnerVerified`
- `pause`
- `pencil`
- `pencilSquare`
- `pipeline`
- `planning`
- `play`
- `plus`
- `plusSquare`
- `plusSquareO`
- `pod`
- `podcast`
- `power`
- `preferences`
- `profile`
- `progress`
- `project`
- `pushRules`
- `question`
- `questionO`
- `quickActions`
- `quota`
- `quote`
- `recipe`
- `redo`
- `regularExpression`
- `remove`
- `removeAll`
- `repeat`
- `reply`
- `requirements`
- `resize`
- `retry`
- `reviewCheckmark`
- `reviewList`
- `reviewWarning`
- `rocket`
- `rocketLaunch`
- `rss`
- `scale`
- `scrollDown`
- `scrollHandle`
- `scrollUp`
- `search`
- `searchDot`
- `searchMinus`
- `searchPlus`
- `searchResults`
- `searchSm`
- `sessionAi`
- `settings`
- `severityCritical`
- `severityHigh`
- `severityInfo`
- `severityLow`
- `severityMedium`
- `severityUnknown`
- `share`
- `shield`
- `sidebar`
- `sidebarRight`
- `skype`
- `slightFrown`
- `slightSmile`
- `smartCard`
- `smile`
- `smiley`
- `snippet`
- `softUnwrap`
- `softWrap`
- `sortHighest`
- `sortLowest`
- `spam`
- `stageAll`
- `star`
- `starO`
- `status`
- `statusActive`
- `statusAlert`
- `statusCancelled`
- `statusClosed`
- `statusHealth`
- `statusNeutral`
- `statusPaused`
- `statusPreparingBorderless`
- `statusStopped`
- `statusWaiting`
- `stop`
- `strikethrough`
- `subgroup`
- `subscript`
- `substitute`
- `suggestionAi`
- `superscript`
- `symlink`
- `table`
- `tablet`
- `tachometer`
- `tag`
- `tanuki`
- `tanukiAi`
- `tanukiAiOff`
- `tanukiVerified`
- `taskDone`
- `template`
- `terminal`
- `terraform`
- `textDescription`
- `thumbDown`
- `thumbUp`
- `thumbtack`
- `thumbtackSolid`
- `timeOut`
- `timer`
- `title`
- `todoAdd`
- `todoDone`
- `token`
- `trendDown`
- `trendStatic`
- `trendUp`
- `triggerSource`
- `unapproval`
- `unassignee`
- `underline`
- `unlink`
- `unstageAll`
- `upgrade`
- `upload`
- `user`
- `users`
- `volumeUp`
- `warning`
- `warningSolid`
- `weight`
- `work`
- `workItemChild`
- `workItemEnhancement`
- `workItemEpic`
- `workItemFeature`
- `workItemFeatureFlag`
- `workItemIncident`
- `workItemIssue`
- `workItemKeyresult`
- `workItemMaintenance`
- `workItemNew`
- `workItemObjective`
- `workItemParent`
- `workItemRequirement`
- `workItemTask`
- `workItemTestCase`
- `workItemTicket`
- `workItems`
- `x`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AbuseIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccessibilityIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccountIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdminIcon size="20" class="nav-icon" /> Settings</a>
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
<AbuseIcon
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
    <AbuseIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccessibilityIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccountIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AbuseIcon size="24" />
   <AccessibilityIcon size="24" color="#4a90e2" />
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
   <AbuseIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AbuseIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AbuseIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { abuse } from '@stacksjs/iconify-pajamas'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(abuse, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abuse } from '@stacksjs/iconify-pajamas'

// Icons are typed as IconData
const myIcon: IconData = abuse
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://gitlab.com/gitlab-org/gitlab-svgs/-/blob/main/LICENSE) for more information.

## Credits

- **Icons**: GitLab B.V. ([Website](https://gitlab.com/gitlab-org/gitlab-svgs/-/tree/main))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pajamas/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pajamas/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
