# Memory Icons

> Memory Icons icons for stx from Iconify

## Overview

This package provides access to 651 icons from the Memory Icons collection through the stx iconify integration.

**Collection ID:** `memory`
**Total Icons:** 651
**Author:** Pictogrammers ([Website](https://github.com/Pictogrammers/Memory))
**License:** Apache 2.0 ([Details](https://github.com/Pictogrammers/Memory/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-memory
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
    <AccountBoxIcon size="24" color="#4a90e2" />
    <AlertIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { account, accountBox, alert } from '@stacksjs/iconify-memory'
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
.memory-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccountIcon class="memory-icon" />
```

## Available Icons

This package contains **651** icons:

- `account`
- `accountBox`
- `alert`
- `alertBox`
- `alertBoxFill`
- `alertCircle`
- `alertCircleFill`
- `alertHexagon`
- `alertHexagonFill`
- `alertOctagon`
- `alertRhombus`
- `alertRhombusFill`
- `alignHorizontalCenter`
- `alignHorizontalDistribute`
- `alignHorizontalLeft`
- `alignHorizontalRight`
- `alignVerticalBottom`
- `alignVerticalCenter`
- `alignVerticalDistribute`
- `alignVerticalTop`
- `alphaA`
- `alphaAFill`
- `alphaB`
- `alphaBFill`
- `alphaC`
- `alphaCFill`
- `alphaD`
- `alphaDFill`
- `alphaE`
- `alphaEFill`
- `alphaF`
- `alphaFFill`
- `alphaG`
- `alphaGFill`
- `alphaH`
- `alphaHFill`
- `alphaI`
- `alphaIFill`
- `alphaJ`
- `alphaJFill`
- `alphaK`
- `alphaKFill`
- `alphaL`
- `alphaLFill`
- `alphaM`
- `alphaMFill`
- `alphaN`
- `alphaNFill`
- `alphaO`
- `alphaOFill`
- `alphaP`
- `alphaPFill`
- `alphaQ`
- `alphaQFill`
- `alphaR`
- `alphaRFill`
- `alphaS`
- `alphaSFill`
- `alphaT`
- `alphaTFill`
- `alphaU`
- `alphaUFill`
- `alphaV`
- `alphaVFill`
- `alphaW`
- `alphaWFill`
- `alphaX`
- `alphaXFill`
- `alphaY`
- `alphaYFill`
- `alphaZ`
- `alphaZFill`
- `anvil`
- `application`
- `applicationCode`
- `apps`
- `appsBox`
- `appsBoxFill`
- `archive`
- `arrow`
- `arrowBottomLeft`
- `arrowBottomLeftCircle`
- `arrowBottomRight`
- `arrowBottomRightCircle`
- `arrowDown`
- `arrowDownBold`
- `arrowDownBox`
- `arrowDownCircle`
- `arrowDownLeft`
- `arrowDownLeftBox`
- `arrowDownRight`
- `arrowDownRightBox`
- `arrowLeft`
- `arrowLeftBold`
- `arrowLeftBox`
- `arrowLeftCircle`
- `arrowLeftDown`
- `arrowLeftRight`
- `arrowLeftUp`
- `arrowRight`
- `arrowRightBold`
- `arrowRightBox`
- `arrowRightCircle`
- `arrowRightDown`
- `arrowRightUp`
- `arrowTopLeft`
- `arrowTopLeftCircle`
- `arrowTopRight`
- `arrowTopRightCircle`
- `arrowUp`
- `arrowUpBold`
- `arrowUpBox`
- `arrowUpCircle`
- `arrowUpDown`
- `arrowUpLeft`
- `arrowUpLeftBox`
- `arrowUpRight`
- `arrowUpRightBox`
- `aspectRatio`
- `axe`
- `bagPersonal`
- `bagPersonalFill`
- `bank`
- `barcode`
- `battery0`
- `battery100`
- `battery25`
- `battery50`
- `battery75`
- `battleAxe`
- `beer`
- `bell`
- `blood`
- `book`
- `bookmark`
- `borderBottom`
- `borderBottomLeft`
- `borderBottomLeftRight`
- `borderBottomRight`
- `borderInside`
- `borderLeft`
- `borderLeftRight`
- `borderNone`
- `borderOutside`
- `borderRight`
- `borderTop`
- `borderTopBottom`
- `borderTopLeft`
- `borderTopLeftBottom`
- `borderTopLeftRight`
- `borderTopRight`
- `borderTopRightBottom`
- `bow`
- `bowArrow`
- `box`
- `boxLightDashedDownLeft`
- `boxLightDashedDownRight`
- `boxLightDashedHorizontal`
- `boxLightDashedUpLeft`
- `boxLightDashedUpRight`
- `boxLightDashedVertical`
- `boxLightDashedVerticalHorizontal`
- `boxLightDoubleDownLeft`
- `boxLightDoubleDownRight`
- `boxLightDoubleHorizontal`
- `boxLightDoubleHorizontalDown`
- `boxLightDoubleHorizontalLightDown`
- `boxLightDoubleHorizontalLightUp`
- `boxLightDoubleHorizontalUp`
- `boxLightDoubleRoundDownLeft`
- `boxLightDoubleRoundDownRight`
- `boxLightDoubleRoundUpLeft`
- `boxLightDoubleRoundUpRight`
- `boxLightDoubleUpLeft`
- `boxLightDoubleUpRight`
- `boxLightDoubleVertical`
- `boxLightDoubleVerticalHorizontal`
- `boxLightDoubleVerticalLeft`
- `boxLightDoubleVerticalLightLeft`
- `boxLightDoubleVerticalLightRight`
- `boxLightDoubleVerticalRight`
- `boxLightDownLeft`
- `boxLightDownLeftCircle`
- `boxLightDownLeftStipple`
- `boxLightDownLeftStippleInner`
- `boxLightDownLeftStippleOuter`
- `boxLightDownRight`
- `boxLightDownRightCircle`
- `boxLightDownRightStipple`
- `boxLightDownRightStippleInner`
- `boxLightDownRightStippleOuter`
- `boxLightFoldDownLeft`
- `boxLightFoldDownRight`
- `boxLightFoldUpLeft`
- `boxLightFoldUpRight`
- `boxLightHorizontal`
- `boxLightHorizontalCircle`
- `boxLightHorizontalDown`
- `boxLightHorizontalDownStipple`
- `boxLightHorizontalDownStippleDown`
- `boxLightHorizontalDownStippleDownLeft`
- `boxLightHorizontalDownStippleDownRight`
- `boxLightHorizontalMenuDown`
- `boxLightHorizontalMenuLeft`
- `boxLightHorizontalMenuRight`
- `boxLightHorizontalMenuUp`
- `boxLightHorizontalStipple`
- `boxLightHorizontalStippleDown`
- `boxLightHorizontalStippleUp`
- `boxLightHorizontalUp`
- `boxLightHorizontalUpStipple`
- `boxLightHorizontalUpStippleDown`
- `boxLightHorizontalUpStippleUp`
- `boxLightHorizontalUpStippleUpLeft`
- `boxLightHorizontalUpStippleUpRight`
- `boxLightRoundDownLeft`
- `boxLightRoundDownLeftStipple`
- `boxLightRoundDownLeftStippleInner`
- `boxLightRoundDownLeftStippleOuter`
- `boxLightRoundDownRight`
- `boxLightRoundDownRightStipple`
- `boxLightRoundDownRightStippleInner`
- `boxLightRoundDownRightStippleOuter`
- `boxLightRoundUpLeft`
- `boxLightRoundUpLeftStipple`
- `boxLightRoundUpLeftStippleInner`
- `boxLightRoundUpLeftStippleOuter`
- `boxLightRoundUpRight`
- `boxLightRoundUpRightStipple`
- `boxLightRoundUpRightStippleInner`
- `boxLightRoundUpRightStippleOuter`
- `boxLightUpLeft`
- `boxLightUpLeftCircle`
- `boxLightUpLeftStipple`
- `boxLightUpLeftStippleInner`
- `boxLightUpLeftStippleOuter`
- `boxLightUpRight`
- `boxLightUpRightCircle`
- `boxLightUpRightStipple`
- `boxLightUpRightStippleInner`
- `boxLightUpRightStippleOuter`
- `boxLightVertical`
- `boxLightVerticalCircle`
- `boxLightVerticalHorizontal`
- `boxLightVerticalHorizontalStipple`
- `boxLightVerticalHorizontalStippleDown`
- `boxLightVerticalHorizontalStippleDownLeft`
- `boxLightVerticalHorizontalStippleDownRight`
- `boxLightVerticalHorizontalStippleLeft`
- `boxLightVerticalHorizontalStippleLeftDownRight`
- `boxLightVerticalHorizontalStippleLeftUpRight`
- `boxLightVerticalHorizontalStippleRight`
- `boxLightVerticalHorizontalStippleRightDownLeft`
- `boxLightVerticalHorizontalStippleRightUpLeft`
- `boxLightVerticalHorizontalStippleUp`
- `boxLightVerticalHorizontalStippleUpLeft`
- `boxLightVerticalHorizontalStippleUpRight`
- `boxLightVerticalLeft`
- `boxLightVerticalLeftStipple`
- `boxLightVerticalLeftStippleDownLeft`
- `boxLightVerticalLeftStippleLeft`
- `boxLightVerticalLeftStippleUpLeft`
- `boxLightVerticalMenuDown`
- `boxLightVerticalMenuLeft`
- `boxLightVerticalMenuRight`
- `boxLightVerticalMenuUp`
- `boxLightVerticalRight`
- `boxLightVerticalRightStipple`
- `boxLightVerticalRightStippleDownRight`
- `boxLightVerticalRightStippleLeft`
- `boxLightVerticalRightStippleRight`
- `boxLightVerticalRightStippleUpRight`
- `boxLightVerticalStipple`
- `boxLightVerticalStippleLeft`
- `boxLightVerticalStippleRight`
- `boxOuterLightAll`
- `boxOuterLightDashedAll`
- `boxOuterLightDashedDown`
- `boxOuterLightDashedDownLeft`
- `boxOuterLightDashedDownLeftRight`
- `boxOuterLightDashedDownRight`
- `boxOuterLightDashedFoldDownLeft`
- `boxOuterLightDashedFoldDownRight`
- `boxOuterLightDashedFoldUpLeft`
- `boxOuterLightDashedFoldUpRight`
- `boxOuterLightDashedLeft`
- `boxOuterLightDashedLeftRight`
- `boxOuterLightDashedRight`
- `boxOuterLightDashedUp`
- `boxOuterLightDashedUpDown`
- `boxOuterLightDashedUpDownLeft`
- `boxOuterLightDashedUpDownRight`
- `boxOuterLightDashedUpLeft`
- `boxOuterLightDashedUpLeftRight`
- `boxOuterLightDashedUpRight`
- `boxOuterLightDown`
- `boxOuterLightDownLeft`
- `boxOuterLightDownLeftRight`
- `boxOuterLightDownLeftStipple`
- `boxOuterLightDownRight`
- `boxOuterLightDownRightStipple`
- `boxOuterLightDownStipple`
- `boxOuterLightDownVerticalStipple`
- `boxOuterLightDownVerticalStippleLeft`
- `boxOuterLightDownVerticalStippleRight`
- `boxOuterLightLeft`
- `boxOuterLightLeftHorizontalStipple`
- `boxOuterLightLeftHorizontalStippleDown`
- `boxOuterLightLeftHorizontalStippleUp`
- `boxOuterLightLeftRight`
- `boxOuterLightLeftRightStipple`
- `boxOuterLightLeftStipple`
- `boxOuterLightRight`
- `boxOuterLightRightHorizontalStipple`
- `boxOuterLightRightHorizontalStippleDown`
- `boxOuterLightRightHorizontalStippleUp`
- `boxOuterLightRightStipple`
- `boxOuterLightRoundDownLeft`
- `boxOuterLightRoundDownRight`
- `boxOuterLightRoundUpLeft`
- `boxOuterLightRoundUpRight`
- `boxOuterLightUp`
- `boxOuterLightUpDown`
- `boxOuterLightUpDownLeft`
- `boxOuterLightUpDownRight`
- `boxOuterLightUpDownStipple`
- `boxOuterLightUpLeft`
- `boxOuterLightUpLeftRight`
- `boxOuterLightUpLeftStipple`
- `boxOuterLightUpRight`
- `boxOuterLightUpRightStipple`
- `boxOuterLightUpStipple`
- `boxOuterLightUpVerticalStipple`
- `boxOuterLightUpVerticalStippleLeft`
- `boxOuterLightUpVerticalStippleRight`
- `briefcase`
- `broadcast`
- `bug`
- `bugFill`
- `calculator`
- `calendar`
- `calendarImport`
- `calendarMonth`
- `cancel`
- `card`
- `cardText`
- `cart`
- `cash`
- `cast`
- `castle`
- `chartBar`
- `chat`
- `chatProcessing`
- `check`
- `checkboxBlank`
- `checkboxCross`
- `checkboxIntermediate`
- `checkboxIntermediateVariant`
- `checkboxMarked`
- `checkerLarge`
- `checkerMedium`
- `checkerSmall`
- `checkerboard`
- `chest`
- `chestFill`
- `chevronDown`
- `chevronDownCircle`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronRight`
- `chevronRightCircle`
- `chevronUp`
- `chevronUpCircle`
- `circle`
- `clipboard`
- `clock`
- `clockFill`
- `close`
- `closeOutline`
- `cloud`
- `cloudDown`
- `cloudUp`
- `coffee`
- `coinCopper`
- `coinElectrum`
- `coinGold`
- `coinPlatinum`
- `coinSilver`
- `comment`
- `commentText`
- `commentUser`
- `compass`
- `compassEastArrow`
- `compassNorthArrow`
- `compassNorthEast`
- `compassNorthWest`
- `compassSouthArrow`
- `compassSouthEast`
- `compassSouthWest`
- `compassWestArrow`
- `creditCard`
- `crossbow`
- `crown`
- `cube`
- `cubeUnfolded`
- `dagger`
- `database`
- `device`
- `diamond`
- `division`
- `door`
- `doorBox`
- `doorOpen`
- `dotHexagon`
- `dotHexagonFill`
- `dotOctagon`
- `dotOctagonFill`
- `download`
- `email`
- `eye`
- `eyeFill`
- `file`
- `fill`
- `filter`
- `fire`
- `flask`
- `flaskEmpty`
- `flaskRoundBottom`
- `flaskRoundBottomEmpty`
- `floppyDisk`
- `folder`
- `folderOpen`
- `formatAlignBottom`
- `formatAlignCenter`
- `formatAlignJustify`
- `formatAlignLeft`
- `formatAlignRight`
- `formatAlignTop`
- `formatBold`
- `formatFloatLeft`
- `formatFloatRight`
- `formatHorizontalAlignCenter`
- `formatItalic`
- `formatLineSpacing`
- `formatText`
- `formatTextMultiline`
- `formatTextSingleLine`
- `formatVerticalAlignCenter`
- `gamepad`
- `gamepadCenter`
- `gamepadCenterFill`
- `gamepadDown`
- `gamepadDownFill`
- `gamepadDownLeft`
- `gamepadDownLeftFill`
- `gamepadDownRight`
- `gamepadDownRightFill`
- `gamepadFill`
- `gamepadLeft`
- `gamepadLeftFill`
- `gamepadRight`
- `gamepadRightFill`
- `gamepadUp`
- `gamepadUpFill`
- `gamepadUpLeft`
- `gamepadUpLeftFill`
- `gamepadUpRight`
- `gamepadUpRightFill`
- `glaive`
- `glasses`
- `halberd`
- `heart`
- `heartBroken`
- `help`
- `helpBox`
- `helpBoxFill`
- `hexagon`
- `homeThatched`
- `image`
- `javalin`
- `journal`
- `key`
- `label`
- `labelVariant`
- `lance`
- `led`
- `lightbulb`
- `linen`
- `lock`
- `lockOpen`
- `login`
- `logout`
- `magnifyMinus`
- `magnifyPlus`
- `map`
- `menuBottomLeft`
- `menuBottomRight`
- `menuDown`
- `menuDownFill`
- `menuLeft`
- `menuLeftFill`
- `menuLeftRight`
- `menuRight`
- `menuRightFill`
- `menuTopLeft`
- `menuTopRight`
- `menuUp`
- `menuUpDown`
- `menuUpFill`
- `message`
- `messageProcessing`
- `messageText`
- `messageUser`
- `microphone`
- `minus`
- `minusBox`
- `minusBoxFill`
- `minusCircle`
- `minusCircleFill`
- `monitor`
- `monitorImage`
- `multiply`
- `musicNote`
- `necklace`
- `note`
- `noteNailed`
- `notebook`
- `notification`
- `number`
- `octagon`
- `paperclip`
- `pause`
- `peace`
- `pencil`
- `pickaxe`
- `pictogrammers`
- `pike`
- `play`
- `plus`
- `plusBox`
- `plusBoxFill`
- `plusCircle`
- `plusCircleFill`
- `poll`
- `pound`
- `quarterstaff`
- `radiobox`
- `radioboxMarked`
- `range`
- `relativeScale`
- `removeCircle`
- `ring`
- `rotateClockwise`
- `rotateCounterclockwise`
- `scimitar`
- `script`
- `search`
- `shield`
- `shovel`
- `skull`
- `sliderEnd`
- `sliderRight`
- `speaker`
- `spear`
- `stool`
- `stop`
- `sword`
- `tableTopDoorHorizontal`
- `tableTopDoorOneWayDown`
- `tableTopDoorOneWayLeft`
- `tableTopDoorOneWayRight`
- `tableTopDoorOneWayUp`
- `tableTopDoorSecretHorizontal`
- `tableTopDoorSecretVertical`
- `tableTopDoorVertical`
- `tableTopHorizontalRotateClockwise`
- `tableTopHorizontalRotateCounterclockwise`
- `tableTopHorizontalStairsAscendLeft`
- `tableTopHorizontalStairsAscendRight`
- `tableTopHorizontalStairsDescendDown`
- `tableTopHorizontalStairsDescendLeft`
- `tableTopHorizontalStairsDescendRight`
- `tableTopHorizontalStairsDescendUp`
- `tableTopSpiralStairsDown`
- `tableTopSpiralStairsLeft`
- `tableTopSpiralStairsRight`
- `tableTopSpiralStairsRoundDown`
- `tableTopSpiralStairsRoundLeft`
- `tableTopSpiralStairsRoundRight`
- `tableTopSpiralStairsRoundUp`
- `tableTopSpiralStairsUp`
- `tableTopStairsDown`
- `tableTopStairsLeft`
- `tableTopStairsRight`
- `tableTopStairsUp`
- `tableTopVerticalRotateClockwise`
- `tableTopVerticalRotateCounterclockwise`
- `tableTopVerticalStairsAscendDown`
- `tableTopVerticalStairsAscendUp`
- `tag`
- `tagText`
- `target`
- `tent`
- `terminal`
- `textBox`
- `textImage`
- `tileCautionHeavy`
- `tileCautionThin`
- `tileDiamondHex`
- `timeSand`
- `toggleSwitchOff`
- `toggleSwitchOn`
- `toolbox`
- `tooltipAbove`
- `tooltipAboveAlert`
- `tooltipAboveHelp`
- `tooltipAboveText`
- `tooltipBelow`
- `tooltipBelowAlert`
- `tooltipBelowHelp`
- `tooltipBelowText`
- `tooltipEnd`
- `tooltipEndAlert`
- `tooltipEndHelp`
- `tooltipEndText`
- `tooltipStart`
- `tooltipStartAlert`
- `tooltipStartHelp`
- `tooltipStartText`
- `torch`
- `toyBrick`
- `trash`
- `trident`
- `umbrella`
- `upload`
- `volumeHigh`
- `volumeLow`
- `volumeMedium`
- `volumeMute`
- `wall`
- `wallFill`
- `wallFront`
- `wallFrontDamaged`
- `wallFrontGate`
- `water`
- `waterFill`
- `weight`
- `weightFill`
- `well`
- `whip`
- `wind`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccountIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccountBoxIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlertIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlertBoxIcon size="20" class="nav-icon" /> Settings</a>
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
    <AccountBoxIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlertIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccountIcon size="24" />
   <AccountBoxIcon size="24" color="#4a90e2" />
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
     import { account } from '@stacksjs/iconify-memory'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(account, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { account } from '@stacksjs/iconify-memory'

// Icons are typed as IconData
const myIcon: IconData = account
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Pictogrammers/Memory/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Pictogrammers ([Website](https://github.com/Pictogrammers/Memory))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/memory/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/memory/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
