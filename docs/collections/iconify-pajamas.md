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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbuseIcon, AccessibilityIcon, AccountIcon } from '@stacksjs/iconify-pajamas'

// Basic usage
const icon = AbuseIcon()

// With size
const sizedIcon = AbuseIcon({ size: 24 })

// With color
const coloredIcon = AccessibilityIcon({ color: 'red' })

// With multiple props
const customIcon = AccountIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbuseIcon, AccessibilityIcon, AccountIcon } from '@stacksjs/iconify-pajamas'

  global.icons = {
    home: AbuseIcon({ size: 24 }),
    user: AccessibilityIcon({ size: 24, color: '#4a90e2' }),
    settings: AccountIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AbuseIcon({ color: 'red' })
const blueIcon = AbuseIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbuseIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbuseIcon({ class: 'text-primary' })
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
const icon24 = AbuseIcon({ size: 24 })
const icon1em = AbuseIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbuseIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbuseIcon({ height: '1em' })
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
const smallIcon = AbuseIcon({ class: 'icon-small' })
const largeIcon = AbuseIcon({ class: 'icon-large' })
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
@js
  import { AbuseIcon, AccessibilityIcon, AccountIcon, AdminIcon } from '@stacksjs/iconify-pajamas'

  global.navIcons = {
    home: AbuseIcon({ size: 20, class: 'nav-icon' }),
    about: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    contact: AccountIcon({ size: 20, class: 'nav-icon' }),
    settings: AdminIcon({ size: 20, class: 'nav-icon' })
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
import { AbuseIcon } from '@stacksjs/iconify-pajamas'

const icon = AbuseIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbuseIcon, AccessibilityIcon, AccountIcon } from '@stacksjs/iconify-pajamas'

const successIcon = AbuseIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccessibilityIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccountIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbuseIcon, AccessibilityIcon } from '@stacksjs/iconify-pajamas'
   const icon = AbuseIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abuse, accessibility } from '@stacksjs/iconify-pajamas'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abuse, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbuseIcon, AccessibilityIcon } from '@stacksjs/iconify-pajamas'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-pajamas'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbuseIcon } from '@stacksjs/iconify-pajamas'
     global.icon = AbuseIcon({ size: 24 })
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
   const icon = AbuseIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
