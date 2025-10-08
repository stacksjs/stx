# Lucide Lab

> Lucide Lab icons for stx from Iconify

## Overview

This package provides access to 373 icons from the Lucide Lab collection through the stx iconify integration.

**Collection ID:** `lucide-lab`
**Total Icons:** 373
**Author:** Lucide Contributors ([Website](https://github.com/lucide-icons/lucide-lab))
**License:** ISC ([Details](https://github.com/lucide-icons/lucide-lab/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lucide-lab
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AmpersandSquareIcon height="1em" />
<AmpersandSquareIcon width="1em" height="1em" />
<AmpersandSquareIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AmpersandSquareIcon size="24" />
<AmpersandSquareIcon size="1em" />

<!-- Using width and height -->
<AmpersandSquareIcon width="24" height="32" />

<!-- With color -->
<AmpersandSquareIcon size="24" color="red" />
<AmpersandSquareIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AmpersandSquareIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AmpersandSquareIcon
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
    <AmpersandSquareIcon size="24" />
    <AppleCoreIcon size="24" color="#4a90e2" />
    <ArrowsUpDownSquareIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { ampersandSquare, appleCore, arrowsUpDownSquare } from '@stacksjs/iconify-lucide-lab'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(ampersandSquare, { size: 24 })
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
<AmpersandSquareIcon size="24" color="red" />
<AmpersandSquareIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AmpersandSquareIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AmpersandSquareIcon size="24" class="text-primary" />
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
<AmpersandSquareIcon height="1em" />
<AmpersandSquareIcon width="1em" height="1em" />
<AmpersandSquareIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AmpersandSquareIcon size="24" />
<AmpersandSquareIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.lucideLab-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AmpersandSquareIcon class="lucideLab-icon" />
```

## Available Icons

This package contains **373** icons:

- `ampersandSquare`
- `appleCore`
- `arrowsUpDownSquare`
- `astronautHelmet`
- `atSignCircle`
- `atSignSquare`
- `avocado`
- `babyPacifier`
- `bacon`
- `bagHand`
- `barbecue`
- `barberPole`
- `barn`
- `baseball`
- `baselineSquare`
- `basketball`
- `batBall`
- `bathBubble`
- `beachBall`
- `bearFace`
- `bedBunk`
- `bee`
- `beeHive`
- `beetleScarab`
- `bellConcierge`
- `bellConciergeDot`
- `bellConciergeOff`
- `belt`
- `boldSquare`
- `bottleBaby`
- `bottleChampagne`
- `bottleDispenser`
- `bottlePerfume`
- `bottlePlastic`
- `bottleSpray`
- `bottleToothbrushComb`
- `bowlChopsticks`
- `bowlOverflow`
- `bowling`
- `braSports`
- `briefcasePlus`
- `broom`
- `bucket`
- `bullHead`
- `burger`
- `butterfly`
- `cabin`
- `cabinetFiling`
- `cactus`
- `candleHolder`
- `candleHolderLit`
- `candleTealight`
- `candleTealightLit`
- `candlestick`
- `candlestickBig`
- `candlestickBigLit`
- `candlestickLit`
- `cardCredit`
- `cardSd`
- `cardSim`
- `carton`
- `cartonOff`
- `caseCamel`
- `caseKebab`
- `caseSnake`
- `caseSnakeUpper`
- `catBig`
- `cauldron`
- `cent`
- `centCircle`
- `centSquare`
- `chairsTableParasol`
- `chairsTablePlatter`
- `chameleon`
- `cheese`
- `chest`
- `chevronsLeftRightSquare`
- `chevronsUpDownSquare`
- `cloth`
- `coatHanger`
- `cocktail`
- `coconut`
- `coffeeBean`
- `coffeemaker`
- `coinsExchange`
- `coinsStack`
- `copyCode`
- `copyDown`
- `copyFilePath`
- `copyImage`
- `copyText`
- `copyType`
- `cowHead`
- `cowUdderDroplets`
- `crab`
- `cricketBall`
- `cricketWicket`
- `crossSquare`
- `crosshair2`
- `crosshair2Dot`
- `crosshairPlus`
- `crosshairPlusDot`
- `crosshairSquare`
- `cupSaucer`
- `cupToGo`
- `currencySquare`
- `deskLamp`
- `diaper`
- `dishwasher`
- `dollarSignCircle`
- `dollarSignSquare`
- `doorbellIntercom`
- `dress`
- `eggCup`
- `elephant`
- `elephantFace`
- `escalatorArrowDownLeft`
- `escalatorArrowUpRight`
- `euroCircle`
- `euroSquare`
- `faceAlien`
- `fanHandheld`
- `farm`
- `faucet`
- `featherPlus`
- `featherSquare`
- `featherText`
- `flippers`
- `floorPlan`
- `floppyDisk`
- `floppyDisk2`
- `floppyDiskRear`
- `floppyDisks`
- `floppyDisks2`
- `floppyDisksRear`
- `flowerLotus`
- `flowerPot`
- `flowerRose`
- `flowerRoseSingle`
- `flowerStem`
- `flowerTulip`
- `football`
- `footballGoal`
- `footballHelmet`
- `forkKnife`
- `forkKnifeCrossed`
- `foxFaceTail`
- `frogFace`
- `fruit`
- `garlic`
- `gearbox`
- `gearboxSquare`
- `gemRing`
- `glassesSquare`
- `glassesSun`
- `goalNet`
- `goblet`
- `gobletCrack`
- `golfDriver`
- `grapes`
- `gridLines`
- `gridLinesOffset`
- `hairdryer`
- `hatBaseball`
- `hatBeanie`
- `hatBowler`
- `hatChef`
- `hatHard`
- `hatTop`
- `headingCircle`
- `headingSquare`
- `hedgehog`
- `helmetDiving`
- `hexagons3`
- `hexagons7`
- `highHeel`
- `hockey`
- `hockeyMask`
- `horseHead`
- `hotDog`
- `house`
- `houseManor`
- `houseOff`
- `houseRoof`
- `houseRoofOff`
- `houses`
- `iceHockey`
- `iceSkate`
- `igloo`
- `indianRupeeCircle`
- `indianRupeeSquare`
- `intercom`
- `iron`
- `ironOff`
- `ironingBoard`
- `italicSquare`
- `jacket`
- `jacketSports`
- `japaneseYenCircle`
- `japaneseYenSquare`
- `jar`
- `jug`
- `kebab`
- `kettle`
- `kettleElectric`
- `kiwi`
- `layoutGridMoveHorizontal`
- `layoutGridMoveVertical`
- `layoutGridPlus`
- `layoutListMove`
- `lemon`
- `lifeJacket`
- `ligatureSquare`
- `lightSwitch`
- `lingerie`
- `locateSquare`
- `luggageCabin`
- `lunchBox`
- `mailboxFlag`
- `maskSnorkel`
- `mealBox`
- `mortarPestle`
- `motorRacingHelmet`
- `mug`
- `mugTeabag`
- `mustache`
- `olive`
- `onion`
- `owl`
- `pacMan`
- `pacManGhost`
- `palmtreeIslandSun`
- `pancakes`
- `peace`
- `peach`
- `pear`
- `penguin`
- `pepperChilli`
- `pie`
- `pig`
- `pigHead`
- `pillow`
- `pinSafety`
- `pinSafetyOpen`
- `pineappleRing`
- `planet`
- `pond`
- `poundSterlingCircle`
- `poundSterlingSquare`
- `pram`
- `pretzel`
- `pumpkin`
- `razor`
- `razorBlade`
- `reelThread`
- `refrigeratorFreezer`
- `removeFormattingSquare`
- `rugby`
- `russianRubleCircle`
- `russianRubleSquare`
- `sausage`
- `scarf`
- `scissorsHairComb`
- `shark`
- `shaveFace`
- `shirtFoldedButtons`
- `shirtLongSleeve`
- `shirtT`
- `shirtTRuler`
- `shirtTVNeck`
- `shorts`
- `shortsBoxer`
- `shovelDig`
- `shower`
- `skirt`
- `skis`
- `slotCard`
- `slotCardCredit`
- `slotDisc`
- `sneaker`
- `snowboard`
- `snowman`
- `soapBar`
- `soccerBall`
- `soccerPitch`
- `socketEu`
- `socketUk`
- `socketUsa`
- `socks`
- `spider`
- `spiderWeb`
- `stairs`
- `stairsArch`
- `stairsArrowDownLeft`
- `stairsArrowUpRight`
- `starNorth`
- `steeringWheel`
- `strawberry`
- `strikethroughSquare`
- `stroller`
- `sunloungerParasolSun`
- `sunloungerParasolSunPalmtree`
- `sunloungerParasolTable`
- `surfboard`
- `sushi`
- `sushi2`
- `sushi3`
- `sushiChopsticks`
- `sweater`
- `swissFrancCircle`
- `swissFrancSquare`
- `tab`
- `tabArrowDown`
- `tabArrowUpRight`
- `tabCheck`
- `tabDot`
- `tabPlus`
- `tabSlash`
- `tabText`
- `tabX`
- `targetArrow`
- `tennisBall`
- `tennisRacket`
- `textSquare`
- `tie`
- `tieBow`
- `tieBowRibbon`
- `tire`
- `toast`
- `toaster`
- `toiletRoll`
- `toolbox`
- `toolbox2`
- `topCrop`
- `towelFolded`
- `towelRack`
- `treesForest`
- `triangleStripes`
- `trousers`
- `tuxedo`
- `typeSquare`
- `ufo`
- `underlineSquare`
- `unicornHead`
- `venn`
- `vest`
- `volleyball`
- `waffle`
- `wardrobe`
- `watchActivity`
- `watchAlarm`
- `watchBars`
- `watchCharging`
- `watchCheck`
- `watchLoader`
- `watchMusic`
- `watchSquare`
- `watchSquareAlarm`
- `watchText`
- `watermelon`
- `waveCircle`
- `wavesBirds`
- `wavesSharkFin`
- `whale`
- `whaleNarwhal`
- `wheel`
- `whisk`
- `whiskForkKnife`
- `whisks`
- `windmill`
- `wineGlassBottle`
- `yarnBall`
- `yinYang`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AmpersandSquareIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AppleCoreIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ArrowsUpDownSquareIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AstronautHelmetIcon size="20" class="nav-icon" /> Settings</a>
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
<AmpersandSquareIcon
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
    <AmpersandSquareIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AppleCoreIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ArrowsUpDownSquareIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AmpersandSquareIcon size="24" />
   <AppleCoreIcon size="24" color="#4a90e2" />
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
   <AmpersandSquareIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AmpersandSquareIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AmpersandSquareIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { ampersandSquare } from '@stacksjs/iconify-lucide-lab'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(ampersandSquare, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { ampersandSquare } from '@stacksjs/iconify-lucide-lab'

// Icons are typed as IconData
const myIcon: IconData = ampersandSquare
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

ISC

See [license details](https://github.com/lucide-icons/lucide-lab/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Lucide Contributors ([Website](https://github.com/lucide-icons/lucide-lab))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lucide-lab/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lucide-lab/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
