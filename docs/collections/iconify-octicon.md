# Octicons

> Octicons icons for stx from Iconify

## Overview

This package provides access to 846 icons from the Octicons collection through the stx iconify integration.

**Collection ID:** `octicon`
**Total Icons:** 846
**Author:** GitHub ([Website](https://github.com/primer/octicons/))
**License:** MIT ([Details](https://github.com/primer/octicons/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-octicon
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<Accessibility16Icon height="1em" />
<Accessibility16Icon width="1em" height="1em" />
<Accessibility16Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<Accessibility16Icon size="24" />
<Accessibility16Icon size="1em" />

<!-- Using width and height -->
<Accessibility16Icon width="24" height="32" />

<!-- With color -->
<Accessibility16Icon size="24" color="red" />
<Accessibility16Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<Accessibility16Icon size="24" class="icon-primary" />

<!-- With all properties -->
<Accessibility16Icon
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
    <Accessibility16Icon size="24" />
    <Accessibility24Icon size="24" color="#4a90e2" />
    <AccessibilityInset16Icon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accessibility16, accessibility24, accessibilityInset16 } from '@stacksjs/iconify-octicon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility16, { size: 24 })
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
<Accessibility16Icon size="24" color="red" />
<Accessibility16Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<Accessibility16Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<Accessibility16Icon size="24" class="text-primary" />
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
<Accessibility16Icon height="1em" />
<Accessibility16Icon width="1em" height="1em" />
<Accessibility16Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<Accessibility16Icon size="24" />
<Accessibility16Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.octicon-icon {
  width: 1em;
  height: 1em;
}
```

```html
<Accessibility16Icon class="octicon-icon" />
```

## Available Icons

This package contains **846** icons:

- `accessibility16`
- `accessibility24`
- `accessibilityInset16`
- `accessibilityInset24`
- `agent16`
- `agent24`
- `aiModel16`
- `aiModel24`
- `alert`
- `alert16`
- `alert24`
- `alertFill12`
- `alertFill16`
- `alertFill24`
- `apps16`
- `apps24`
- `archive`
- `archive16`
- `archive24`
- `arrowBoth`
- `arrowBoth16`
- `arrowBoth24`
- `arrowDown`
- `arrowDown16`
- `arrowDown24`
- `arrowDownLeft16`
- `arrowDownLeft24`
- `arrowDownRight16`
- `arrowDownRight24`
- `arrowLeft`
- `arrowLeft16`
- `arrowLeft24`
- `arrowRight`
- `arrowRight16`
- `arrowRight24`
- `arrowSmallDown`
- `arrowSmallLeft`
- `arrowSmallRight`
- `arrowSmallUp`
- `arrowSwitch16`
- `arrowSwitch24`
- `arrowUp`
- `arrowUp16`
- `arrowUp24`
- `arrowUpLeft16`
- `arrowUpLeft24`
- `arrowUpRight16`
- `arrowUpRight24`
- `beaker`
- `beaker16`
- `beaker24`
- `bell`
- `bell16`
- `bell24`
- `bellFill16`
- `bellFill24`
- `bellSlash16`
- `bellSlash24`
- `blocked16`
- `blocked24`
- `bold`
- `bold16`
- `bold24`
- `book`
- `book16`
- `book24`
- `bookmark`
- `bookmark16`
- `bookmark24`
- `bookmarkFill24`
- `bookmarkFilled16`
- `bookmarkSlash16`
- `bookmarkSlash24`
- `bookmarkSlashFill16`
- `bookmarkSlashFill24`
- `briefcase`
- `briefcase16`
- `briefcase24`
- `broadcast`
- `broadcast16`
- `broadcast24`
- `browser`
- `browser16`
- `browser24`
- `bug16`
- `bug24`
- `cache16`
- `cache24`
- `calendar`
- `calendar16`
- `calendar24`
- `check`
- `check16`
- `check24`
- `checkCircle16`
- `checkCircle24`
- `checkCircleFill12`
- `checkCircleFill16`
- `checkCircleFill24`
- `checkbox16`
- `checkbox24`
- `checkboxFill16`
- `checkboxFill24`
- `checklist`
- `checklist16`
- `checklist24`
- `chevronDown`
- `chevronDown12`
- `chevronDown16`
- `chevronDown24`
- `chevronLeft`
- `chevronLeft12`
- `chevronLeft16`
- `chevronLeft24`
- `chevronRight`
- `chevronRight12`
- `chevronRight16`
- `chevronRight24`
- `chevronUp`
- `chevronUp12`
- `chevronUp16`
- `chevronUp24`
- `circle16`
- `circle24`
- `circleSlash`
- `circleSlash16`
- `circleSlash24`
- `circuitBoard`
- `clippy`
- `clock`
- `clock16`
- `clock24`
- `clockFill16`
- `clockFill24`
- `cloud16`
- `cloud24`
- `cloudDownload`
- `cloudOffline16`
- `cloudOffline24`
- `cloudUpload`
- `code`
- `code16`
- `code24`
- `codeOfConduct16`
- `codeOfConduct24`
- `codeReview16`
- `codeReview24`
- `codeSquare16`
- `codeSquare24`
- `codescan16`
- `codescan24`
- `codescanCheckmark16`
- `codescanCheckmark24`
- `codespaces16`
- `codespaces24`
- `columns16`
- `columns24`
- `commandPalette16`
- `commandPalette24`
- `comment`
- `comment16`
- `comment24`
- `commentDiscussion`
- `commentDiscussion16`
- `commentDiscussion24`
- `commit24`
- `container16`
- `container24`
- `copilot16`
- `copilot24`
- `copilot48`
- `copilot96`
- `copilotError16`
- `copilotWarning16`
- `copy16`
- `copy24`
- `cpu16`
- `cpu24`
- `creditCard`
- `creditCard16`
- `creditCard24`
- `crossReference16`
- `crossReference24`
- `dash`
- `dash16`
- `dash24`
- `dashboard`
- `database`
- `database16`
- `database24`
- `dependabot16`
- `dependabot24`
- `desktopDownload`
- `desktopDownload16`
- `desktopDownload24`
- `deviceCamera16`
- `deviceCamera24`
- `deviceCameraVideo`
- `deviceCameraVideo16`
- `deviceCameraVideo24`
- `deviceDesktop`
- `deviceDesktop16`
- `deviceDesktop24`
- `deviceMobile`
- `deviceMobile16`
- `deviceMobile24`
- `devices16`
- `devices24`
- `diamond16`
- `diamond24`
- `diff`
- `diff16`
- `diff24`
- `diffAdded`
- `diffAdded16`
- `diffAdded24`
- `diffIgnored`
- `diffIgnored16`
- `diffIgnored24`
- `diffModified`
- `diffModified16`
- `diffModified24`
- `diffRemoved`
- `diffRemoved16`
- `diffRemoved24`
- `diffRenamed`
- `diffRenamed16`
- `diffRenamed24`
- `discussionClosed16`
- `discussionClosed24`
- `discussionDuplicate16`
- `discussionDuplicate24`
- `discussionOutdated16`
- `discussionOutdated24`
- `dot16`
- `dot24`
- `dotFill16`
- `dotFill24`
- `download16`
- `download24`
- `duplicate16`
- `duplicate24`
- `ellipsis`
- `ellipsis16`
- `ellipsis24`
- `eye`
- `eye16`
- `eye24`
- `eyeClosed`
- `eyeClosed16`
- `eyeClosed24`
- `feedDiscussion16`
- `feedForked16`
- `feedHeart16`
- `feedIssueClosed16`
- `feedIssueDraft16`
- `feedIssueOpen16`
- `feedIssueReopen16`
- `feedMerged16`
- `feedPerson16`
- `feedPlus16`
- `feedPublic16`
- `feedPullRequestClosed16`
- `feedPullRequestDraft16`
- `feedPullRequestOpen16`
- `feedRepo16`
- `feedRocket16`
- `feedStar16`
- `feedTag16`
- `feedTrophy16`
- `file`
- `file16`
- `file24`
- `fileAdded16`
- `fileAdded24`
- `fileBadge16`
- `fileBadge24`
- `fileBinary`
- `fileBinary16`
- `fileBinary24`
- `fileCode`
- `fileCode16`
- `fileCode24`
- `fileDiff16`
- `fileDiff24`
- `fileDirectory`
- `fileDirectory16`
- `fileDirectory24`
- `fileDirectoryFill16`
- `fileDirectoryFill24`
- `fileDirectoryOpenFill16`
- `fileDirectoryOpenFill24`
- `fileDirectorySymlink16`
- `fileDirectorySymlink24`
- `fileMedia`
- `fileMedia16`
- `fileMedia24`
- `fileMoved16`
- `fileMoved24`
- `filePdf`
- `fileRemoved16`
- `fileRemoved24`
- `fileSubmodule`
- `fileSubmodule16`
- `fileSubmodule24`
- `fileSymlinkDirectory`
- `fileSymlinkFile`
- `fileSymlinkFile16`
- `fileSymlinkFile24`
- `fileZip`
- `fileZip16`
- `fileZip24`
- `filter16`
- `filter24`
- `filterRemove16`
- `filterRemove24`
- `fiscalHost16`
- `fiscalHost24`
- `flame`
- `flame16`
- `flame24`
- `fold`
- `fold16`
- `fold24`
- `foldDown`
- `foldDown16`
- `foldDown24`
- `foldUp`
- `foldUp16`
- `foldUp24`
- `gear`
- `gear16`
- `gear24`
- `gift`
- `gift16`
- `gift24`
- `gist`
- `gistSecret`
- `gitBranch`
- `gitBranch16`
- `gitBranch24`
- `gitCommit`
- `gitCommit16`
- `gitCommit24`
- `gitCompare`
- `gitCompare16`
- `gitCompare24`
- `gitMerge`
- `gitMerge16`
- `gitMerge24`
- `gitMergeQueue16`
- `gitMergeQueue24`
- `gitPullRequest`
- `gitPullRequest16`
- `gitPullRequest24`
- `gitPullRequestClosed16`
- `gitPullRequestClosed24`
- `gitPullRequestDraft16`
- `gitPullRequestDraft24`
- `githubAction`
- `globe`
- `globe16`
- `globe24`
- `goal16`
- `goal24`
- `grabber`
- `grabber16`
- `grabber24`
- `graph`
- `graph16`
- `graph24`
- `hash16`
- `hash24`
- `heading16`
- `heading24`
- `heart`
- `heart16`
- `heart24`
- `heartFill16`
- `heartFill24`
- `history`
- `history16`
- `history24`
- `home`
- `home16`
- `home24`
- `homeFill16`
- `homeFill24`
- `horizontalRule`
- `horizontalRule16`
- `horizontalRule24`
- `hourglass16`
- `hourglass24`
- `hubot`
- `hubot16`
- `hubot24`
- `idBadge16`
- `idBadge24`
- `image16`
- `image24`
- `inbox`
- `inbox16`
- `inbox24`
- `infinity16`
- `infinity24`
- `info`
- `info16`
- `info24`
- `insights24`
- `issueClosed`
- `issueClosed16`
- `issueClosed24`
- `issueDraft16`
- `issueDraft24`
- `issueOpened`
- `issueOpened16`
- `issueOpened24`
- `issueReopened`
- `issueReopened16`
- `issueReopened24`
- `issueTrackedBy16`
- `issueTrackedBy24`
- `issueTracks16`
- `issueTracks24`
- `italic`
- `italic16`
- `italic24`
- `iterations16`
- `iterations24`
- `jersey`
- `kebabHorizontal`
- `kebabHorizontal16`
- `kebabHorizontal24`
- `kebabVertical`
- `key`
- `key16`
- `key24`
- `keyAsterisk16`
- `keyAsterisk24`
- `keyboard`
- `law`
- `law16`
- `law24`
- `lightBulb`
- `lightBulb16`
- `lightBulb24`
- `link`
- `link16`
- `link24`
- `linkExternal`
- `linkExternal16`
- `linkExternal24`
- `listOrdered`
- `listOrdered16`
- `listOrdered24`
- `listUnordered`
- `listUnordered16`
- `listUnordered24`
- `location`
- `location16`
- `location24`
- `lock`
- `lock16`
- `lock24`
- `log16`
- `log24`
- `logoGist16`
- `logoGist24`
- `logoGithub16`
- `logoGithub24`
- `loop16`
- `loop24`
- `mail`
- `mail16`
- `mail24`
- `mailRead`
- `markGithub16`
- `markGithub24`
- `markdown16`
- `markdown24`
- `maximize16`
- `maximize24`
- `mcp16`
- `mcp24`
- `megaphone`
- `megaphone16`
- `megaphone24`
- `mention`
- `mention16`
- `mention24`
- `meter16`
- `meter24`
- `milestone`
- `milestone16`
- `milestone24`
- `minimize16`
- `minimize24`
- `mirror`
- `mirror16`
- `mirror24`
- `moon16`
- `moon24`
- `mortarBoard`
- `mortarBoard16`
- `mortarBoard24`
- `moveToBottom16`
- `moveToBottom24`
- `moveToEnd16`
- `moveToEnd24`
- `moveToStart16`
- `moveToStart24`
- `moveToTop16`
- `moveToTop24`
- `multiSelect16`
- `multiSelect24`
- `mute`
- `mute16`
- `mute24`
- `noEntry16`
- `noEntry24`
- `noEntryFill12`
- `noNewline`
- `northStar16`
- `northStar24`
- `note`
- `note16`
- `note24`
- `number16`
- `number24`
- `octoface`
- `octoface16`
- `octoface24`
- `organization`
- `organization16`
- `organization24`
- `package`
- `package16`
- `package24`
- `packageDependencies16`
- `packageDependencies24`
- `packageDependents16`
- `packageDependents24`
- `paintbrush16`
- `paintbrush24`
- `paintcan`
- `paperAirplane16`
- `paperAirplane24`
- `paperclip16`
- `paperclip24`
- `passkeyFill16`
- `passkeyFill24`
- `paste16`
- `paste24`
- `pause16`
- `pause24`
- `pencil`
- `pencil16`
- `pencil24`
- `people16`
- `people24`
- `person`
- `person16`
- `person24`
- `personAdd16`
- `personAdd24`
- `personFill16`
- `personFill24`
- `pin`
- `pin16`
- `pin24`
- `pinSlash16`
- `pinSlash24`
- `pivotColumn16`
- `pivotColumn24`
- `play`
- `play16`
- `play24`
- `plug`
- `plug16`
- `plug24`
- `plus`
- `plus16`
- `plus24`
- `plusCircle16`
- `plusCircle24`
- `plusSmall`
- `primitiveDot`
- `primitiveSquare`
- `project`
- `project16`
- `project24`
- `projectRoadmap16`
- `projectRoadmap24`
- `projectSymlink16`
- `projectSymlink24`
- `projectTemplate16`
- `projectTemplate24`
- `pulse`
- `pulse16`
- `pulse24`
- `question`
- `question16`
- `question24`
- `quote`
- `quote16`
- `quote24`
- `radioTower`
- `read16`
- `read24`
- `redo16`
- `redo24`
- `relFilePath16`
- `relFilePath24`
- `reply`
- `reply16`
- `reply24`
- `repo`
- `repo16`
- `repo24`
- `repoClone16`
- `repoClone24`
- `repoDelete24`
- `repoDeleted16`
- `repoForcePush`
- `repoForked`
- `repoForked16`
- `repoForked24`
- `repoLocked16`
- `repoLocked24`
- `repoPull16`
- `repoPull24`
- `repoPush`
- `repoPush16`
- `repoPush24`
- `repoTemplate16`
- `repoTemplate24`
- `report`
- `report16`
- `report24`
- `requestChanges`
- `rocket`
- `rocket16`
- `rocket24`
- `rows16`
- `rows24`
- `rss`
- `rss16`
- `rss24`
- `ruby`
- `ruby16`
- `ruby24`
- `screenFull`
- `screenFull16`
- `screenFull24`
- `screenNormal`
- `screenNormal16`
- `screenNormal24`
- `search`
- `search16`
- `search24`
- `server`
- `server16`
- `server24`
- `settings`
- `settings24`
- `share16`
- `share24`
- `shareAndroid16`
- `shareAndroid24`
- `shield`
- `shield16`
- `shield24`
- `shieldCheck16`
- `shieldCheck24`
- `shieldLock16`
- `shieldLock24`
- `shieldSlash16`
- `shieldSlash24`
- `shieldX16`
- `shieldX24`
- `sidebarCollapse16`
- `sidebarCollapse24`
- `sidebarExpand16`
- `sidebarExpand24`
- `signIn`
- `signIn16`
- `signIn24`
- `signOut`
- `signOut16`
- `signOut24`
- `singleSelect16`
- `singleSelect24`
- `skip16`
- `skip24`
- `skipFill16`
- `skipFill24`
- `sliders16`
- `sliders24`
- `smiley`
- `smiley16`
- `smiley24`
- `sortAsc16`
- `sortAsc24`
- `sortDesc16`
- `sortDesc24`
- `space16`
- `space24`
- `sparkle16`
- `sparkle24`
- `sparkleFill16`
- `sparkleFill24`
- `sparklesFill16`
- `sparklesFill24`
- `sponsorTiers16`
- `sponsorTiers24`
- `square16`
- `square24`
- `squareCircle16`
- `squareCircle24`
- `squareFill16`
- `squareFill24`
- `squirrel`
- `squirrel16`
- `squirrel24`
- `stack16`
- `stack24`
- `star`
- `star16`
- `star24`
- `starFill16`
- `starFill24`
- `stop`
- `stop16`
- `stop24`
- `stopwatch16`
- `stopwatch24`
- `strikethrough16`
- `strikethrough24`
- `sun16`
- `sun24`
- `sync`
- `sync16`
- `sync24`
- `tab16`
- `tab24`
- `tabExternal16`
- `tabExternal24`
- `table16`
- `table24`
- `tag`
- `tag16`
- `tag24`
- `tasklist`
- `tasklist16`
- `tasklist24`
- `telescope`
- `telescope16`
- `telescope24`
- `telescopeFill16`
- `telescopeFill24`
- `terminal`
- `terminal16`
- `terminal24`
- `textSize`
- `threeBars`
- `threeBars16`
- `threeBars24`
- `thumbsdown`
- `thumbsdown16`
- `thumbsdown24`
- `thumbsup`
- `thumbsup16`
- `thumbsup24`
- `tools`
- `tools16`
- `tools24`
- `trackedByClosedCompleted16`
- `trackedByClosedCompleted24`
- `trackedByClosedNotPlanned16`
- `trackedByClosedNotPlanned24`
- `trash16`
- `trash24`
- `trashcan`
- `triangleDown`
- `triangleDown16`
- `triangleDown24`
- `triangleLeft`
- `triangleLeft16`
- `triangleLeft24`
- `triangleRight`
- `triangleRight16`
- `triangleRight24`
- `triangleUp`
- `triangleUp16`
- `triangleUp24`
- `trophy16`
- `trophy24`
- `typography16`
- `typography24`
- `undo16`
- `undo24`
- `unfold`
- `unfold16`
- `unfold24`
- `unlink16`
- `unlink24`
- `unlock16`
- `unlock24`
- `unmute`
- `unmute16`
- `unmute24`
- `unread16`
- `unread24`
- `unverified`
- `unverified16`
- `unverified24`
- `upload16`
- `upload24`
- `verified`
- `verified16`
- `verified24`
- `versions`
- `versions16`
- `versions24`
- `video16`
- `video24`
- `watch`
- `webhook16`
- `workflow16`
- `workflow24`
- `x`
- `x12`
- `x16`
- `x24`
- `xCircle16`
- `xCircle24`
- `xCircleFill12`
- `xCircleFill16`
- `xCircleFill24`
- `zap`
- `zap16`
- `zap24`
- `zoomIn16`
- `zoomIn24`
- `zoomOut16`
- `zoomOut24`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><Accessibility16Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><Accessibility24Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccessibilityInset16Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccessibilityInset24Icon size="20" class="nav-icon" /> Settings</a>
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
<Accessibility16Icon
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
    <Accessibility16Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <Accessibility24Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccessibilityInset16Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <Accessibility16Icon size="24" />
   <Accessibility24Icon size="24" color="#4a90e2" />
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
   <Accessibility16Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <Accessibility16Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <Accessibility16Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessibility16 } from '@stacksjs/iconify-octicon'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessibility16, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility16 } from '@stacksjs/iconify-octicon'

// Icons are typed as IconData
const myIcon: IconData = accessibility16
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/primer/octicons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: GitHub ([Website](https://github.com/primer/octicons/))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/octicon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/octicon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
