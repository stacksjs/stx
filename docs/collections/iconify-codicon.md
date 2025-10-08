# Codicons

> Codicons icons for stx from Iconify

## Overview

This package provides access to 501 icons from the Codicons collection through the stx iconify integration.

**Collection ID:** `codicon`
**Total Icons:** 501
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/vscode-codicons))
**License:** CC BY 4.0 ([Details](https://github.com/microsoft/vscode-codicons/blob/main/LICENSE))
**Category:** Programming
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-codicon
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccountIcon, ActivateBreakpointsIcon, AddIcon } from '@stacksjs/iconify-codicon'

// Basic usage
const icon = AccountIcon()

// With size
const sizedIcon = AccountIcon({ size: 24 })

// With color
const coloredIcon = ActivateBreakpointsIcon({ color: 'red' })

// With multiple props
const customIcon = AddIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccountIcon, ActivateBreakpointsIcon, AddIcon } from '@stacksjs/iconify-codicon'

  global.icons = {
    home: AccountIcon({ size: 24 }),
    user: ActivateBreakpointsIcon({ size: 24, color: '#4a90e2' }),
    settings: AddIcon({ size: 32 })
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
import { account, activateBreakpoints, add } from '@stacksjs/iconify-codicon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(account, { size: 24 })
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
const redIcon = AccountIcon({ color: 'red' })
const blueIcon = AccountIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccountIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccountIcon({ class: 'text-primary' })
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
const icon24 = AccountIcon({ size: 24 })
const icon1em = AccountIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccountIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccountIcon({ height: '1em' })
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
const smallIcon = AccountIcon({ class: 'icon-small' })
const largeIcon = AccountIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **501** icons:

- `account`
- `activateBreakpoints`
- `add`
- `archive`
- `arrowBoth`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowSmallDown`
- `arrowSmallLeft`
- `arrowSmallRight`
- `arrowSmallUp`
- `arrowSwap`
- `arrowUp`
- `attach`
- `azure`
- `azureDevops`
- `beaker`
- `beakerStop`
- `bell`
- `bellDot`
- `bellSlash`
- `bellSlashDot`
- `blank`
- `bold`
- `book`
- `bookmark`
- `bracketDot`
- `bracketError`
- `briefcase`
- `broadcast`
- `browser`
- `bug`
- `calendar`
- `callIncoming`
- `callOutgoing`
- `caseSensitive`
- `chatSparkle`
- `chatSparkleError`
- `chatSparkleWarning`
- `check`
- `checkAll`
- `checklist`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chip`
- `chromeClose`
- `chromeMaximize`
- `chromeMinimize`
- `chromeRestore`
- `circle`
- `circleFilled`
- `circleLarge`
- `circleLargeFilled`
- `circleSlash`
- `circleSmall`
- `circleSmallFilled`
- `circuitBoard`
- `clearAll`
- `clippy`
- `close`
- `closeAll`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `code`
- `codeOss`
- `codeReview`
- `coffee`
- `collapseAll`
- `collection`
- `colorMode`
- `combine`
- `comment`
- `commentDiscussion`
- `commentDiscussionSparkle`
- `commentDraft`
- `commentUnresolved`
- `compass`
- `compassActive`
- `compassDot`
- `copilot`
- `copilotBlocked`
- `copilotError`
- `copilotInProgress`
- `copilotLarge`
- `copilotNotConnected`
- `copilotSnooze`
- `copilotSuccess`
- `copilotUnavailable`
- `copilotWarning`
- `copilotWarningLarge`
- `copy`
- `coverage`
- `creditCard`
- `dash`
- `dashboard`
- `database`
- `debug`
- `debugAll`
- `debugAlt`
- `debugAltSmall`
- `debugBreakpointConditional`
- `debugBreakpointConditionalUnverified`
- `debugBreakpointData`
- `debugBreakpointDataUnverified`
- `debugBreakpointFunction`
- `debugBreakpointFunctionUnverified`
- `debugBreakpointLog`
- `debugBreakpointLogUnverified`
- `debugBreakpointUnsupported`
- `debugConsole`
- `debugContinue`
- `debugContinueSmall`
- `debugCoverage`
- `debugDisconnect`
- `debugLineByLine`
- `debugPause`
- `debugRerun`
- `debugRestart`
- `debugRestartFrame`
- `debugReverseContinue`
- `debugStackframe`
- `debugStackframeActive`
- `debugStart`
- `debugStepBack`
- `debugStepInto`
- `debugStepOut`
- `debugStepOver`
- `debugStop`
- `desktopDownload`
- `deviceCamera`
- `deviceCameraVideo`
- `deviceMobile`
- `diff`
- `diffAdded`
- `diffIgnored`
- `diffModified`
- `diffMultiple`
- `diffRemoved`
- `diffRenamed`
- `diffSingle`
- `discard`
- `edit`
- `editSession`
- `editSparkle`
- `editorLayout`
- `ellipsis`
- `emptyWindow`
- `error`
- `errorSmall`
- `exclude`
- `expandAll`
- `export`
- `extensions`
- `extensionsLarge`
- `eye`
- `eyeClosed`
- `feedback`
- `file`
- `fileBinary`
- `fileCode`
- `fileMedia`
- `filePdf`
- `fileSubmodule`
- `fileSymlinkDirectory`
- `fileSymlinkFile`
- `fileZip`
- `files`
- `filter`
- `filterFilled`
- `flag`
- `flame`
- `fold`
- `foldDown`
- `foldUp`
- `folder`
- `folderActive`
- `folderLibrary`
- `folderOpened`
- `game`
- `gear`
- `gift`
- `gist`
- `gistSecret`
- `gitCommit`
- `gitCompare`
- `gitFetch`
- `gitMerge`
- `gitPullRequest`
- `gitPullRequestClosed`
- `gitPullRequestCreate`
- `gitPullRequestDone`
- `gitPullRequestDraft`
- `gitPullRequestGoToChanges`
- `gitPullRequestNewChanges`
- `gitStash`
- `gitStashApply`
- `gitStashPop`
- `github`
- `githubAction`
- `githubAlt`
- `githubInverted`
- `githubProject`
- `globe`
- `goToEditingSession`
- `goToFile`
- `goToSearch`
- `grabber`
- `graph`
- `graphLeft`
- `graphLine`
- `graphScatter`
- `gripper`
- `groupByRefType`
- `heart`
- `heartFilled`
- `history`
- `home`
- `horizontalRule`
- `hubot`
- `inbox`
- `indent`
- `info`
- `insert`
- `inspect`
- `issueClosed`
- `issueDraft`
- `issueReopened`
- `issues`
- `italic`
- `jersey`
- `json`
- `kebabVertical`
- `key`
- `keyboardTab`
- `keyboardTabAbove`
- `keyboardTabBelow`
- `law`
- `layers`
- `layersActive`
- `layersDot`
- `layout`
- `layoutActivitybarLeft`
- `layoutActivitybarRight`
- `layoutCentered`
- `layoutMenubar`
- `layoutPanel`
- `layoutPanelCenter`
- `layoutPanelDock`
- `layoutPanelJustify`
- `layoutPanelLeft`
- `layoutPanelOff`
- `layoutPanelRight`
- `layoutSidebarLeft`
- `layoutSidebarLeftDock`
- `layoutSidebarLeftOff`
- `layoutSidebarRight`
- `layoutSidebarRightDock`
- `layoutSidebarRightOff`
- `layoutStatusbar`
- `library`
- `lightbulb`
- `lightbulbAutofix`
- `lightbulbEmpty`
- `link`
- `linkExternal`
- `listFilter`
- `listFlat`
- `listOrdered`
- `listSelection`
- `listTree`
- `listUnordered`
- `liveShare`
- `loading`
- `location`
- `lock`
- `lockSmall`
- `magnet`
- `mail`
- `mailRead`
- `map`
- `mapFilled`
- `mapVertical`
- `mapVerticalFilled`
- `markdown`
- `mcp`
- `megaphone`
- `mention`
- `menu`
- `merge`
- `mic`
- `micFilled`
- `milestone`
- `mirror`
- `mortarBoard`
- `move`
- `multipleWindows`
- `music`
- `mute`
- `newCollection`
- `newFile`
- `newFolder`
- `newline`
- `noNewline`
- `note`
- `notebook`
- `notebookTemplate`
- `octoface`
- `openPreview`
- `organization`
- `output`
- `package`
- `paintcan`
- `pass`
- `passFilled`
- `percentage`
- `person`
- `personAdd`
- `piano`
- `pieChart`
- `pin`
- `pinned`
- `pinnedDirty`
- `pinnedDirtySmall`
- `pinnedSmall`
- `play`
- `playCircle`
- `plug`
- `preserveCase`
- `preview`
- `primitiveSquare`
- `project`
- `pulse`
- `python`
- `question`
- `quote`
- `radioTower`
- `reactions`
- `record`
- `recordKeys`
- `recordSmall`
- `redo`
- `references`
- `refresh`
- `regex`
- `remote`
- `remoteExplorer`
- `remove`
- `replace`
- `replaceAll`
- `reply`
- `repo`
- `repoClone`
- `repoFetch`
- `repoForcePush`
- `repoForked`
- `repoPinned`
- `repoPull`
- `repoPush`
- `report`
- `requestChanges`
- `robot`
- `rocket`
- `rootFolder`
- `rootFolderOpened`
- `rss`
- `ruby`
- `runAbove`
- `runAll`
- `runAllCoverage`
- `runBelow`
- `runCoverage`
- `runErrors`
- `save`
- `saveAll`
- `saveAs`
- `screenFull`
- `screenNormal`
- `search`
- `searchFuzzy`
- `searchSparkle`
- `searchStop`
- `send`
- `sendToRemoteAgent`
- `server`
- `serverEnvironment`
- `serverProcess`
- `settings`
- `settingsGear`
- `share`
- `shield`
- `signIn`
- `signOut`
- `smiley`
- `snake`
- `sortPrecedence`
- `sourceControl`
- `sparkle`
- `sparkleFilled`
- `splitHorizontal`
- `splitVertical`
- `squirrel`
- `starEmpty`
- `starFull`
- `starHalf`
- `stopCircle`
- `surroundWith`
- `symbolArray`
- `symbolBoolean`
- `symbolClass`
- `symbolColor`
- `symbolConstant`
- `symbolEnum`
- `symbolEnumMember`
- `symbolEvent`
- `symbolField`
- `symbolFile`
- `symbolInterface`
- `symbolKey`
- `symbolKeyword`
- `symbolMethod`
- `symbolMethodArrow`
- `symbolMisc`
- `symbolNamespace`
- `symbolNumeric`
- `symbolOperator`
- `symbolParameter`
- `symbolProperty`
- `symbolRuler`
- `symbolSnippet`
- `symbolString`
- `symbolStructure`
- `symbolVariable`
- `sync`
- `syncIgnored`
- `table`
- `tag`
- `target`
- `tasklist`
- `telescope`
- `terminal`
- `terminalBash`
- `terminalCmd`
- `terminalDebian`
- `terminalLinux`
- `terminalPowershell`
- `terminalTmux`
- `terminalUbuntu`
- `textSize`
- `thinking`
- `threeBars`
- `thumbsdown`
- `thumbsdownFilled`
- `thumbsup`
- `thumbsupFilled`
- `tools`
- `trash`
- `triangleDown`
- `triangleLeft`
- `triangleRight`
- `triangleUp`
- `twitter`
- `typeHierarchy`
- `typeHierarchySub`
- `typeHierarchySuper`
- `unfold`
- `ungroupByRefType`
- `unlock`
- `unmute`
- `unverified`
- `variableGroup`
- `verified`
- `verifiedFilled`
- `versions`
- `vm`
- `vmActive`
- `vmConnect`
- `vmOutline`
- `vmRunning`
- `vr`
- `vscode`
- `vscodeInsiders`
- `wand`
- `warning`
- `watch`
- `whitespace`
- `wholeWord`
- `window`
- `wordWrap`
- `workspaceTrusted`
- `workspaceUnknown`
- `workspaceUntrusted`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccountIcon, ActivateBreakpointsIcon, AddIcon, ArchiveIcon } from '@stacksjs/iconify-codicon'

  global.navIcons = {
    home: AccountIcon({ size: 20, class: 'nav-icon' }),
    about: ActivateBreakpointsIcon({ size: 20, class: 'nav-icon' }),
    contact: AddIcon({ size: 20, class: 'nav-icon' }),
    settings: ArchiveIcon({ size: 20, class: 'nav-icon' })
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
import { AccountIcon } from '@stacksjs/iconify-codicon'

const icon = AccountIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccountIcon, ActivateBreakpointsIcon, AddIcon } from '@stacksjs/iconify-codicon'

const successIcon = AccountIcon({ size: 16, color: '#22c55e' })
const warningIcon = ActivateBreakpointsIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccountIcon, ActivateBreakpointsIcon } from '@stacksjs/iconify-codicon'
   const icon = AccountIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { account, activateBreakpoints } from '@stacksjs/iconify-codicon'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(account, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccountIcon, ActivateBreakpointsIcon } from '@stacksjs/iconify-codicon'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-codicon'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccountIcon } from '@stacksjs/iconify-codicon'
     global.icon = AccountIcon({ size: 24 })
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
   const icon = AccountIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { account } from '@stacksjs/iconify-codicon'

// Icons are typed as IconData
const myIcon: IconData = account
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://github.com/microsoft/vscode-codicons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/vscode-codicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/codicon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/codicon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
