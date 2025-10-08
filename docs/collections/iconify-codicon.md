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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccountIcon height="1em" />
<AccountIcon width="1em" height="1em" />
<AccountIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccountIcon size="24" />
<AccountIcon size="1em" />

<!-- Using width and height -->
<AccountIcon width="24" height="32" />

<!-- With color -->
<AccountIcon size="24" color="red" />
<AccountIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccountIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccountIcon
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
    <AccountIcon size="24" />
    <ActivateBreakpointsIcon size="24" color="#4a90e2" />
    <AddIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AccountIcon size="24" color="red" />
<AccountIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccountIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccountIcon size="24" class="text-primary" />
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
<AccountIcon height="1em" />
<AccountIcon width="1em" height="1em" />
<AccountIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccountIcon size="24" />
<AccountIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.codicon-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccountIcon class="codicon-icon" />
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
<nav>
  <a href="/"><AccountIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><ActivateBreakpointsIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArchiveIcon size="20" class="nav-icon" /> Settings</a>
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
<AccountIcon
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
    <AccountIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <ActivateBreakpointsIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccountIcon size="24" />
   <ActivateBreakpointsIcon size="24" color="#4a90e2" />
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
   <AccountIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccountIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccountIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { account } from '@stacksjs/iconify-codicon'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(account, { size: 24 })
   @endjs

   {!! customIcon !!}
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
