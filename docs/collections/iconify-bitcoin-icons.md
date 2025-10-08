# Bitcoin Icons

> Bitcoin Icons icons for stx from Iconify

## Overview

This package provides access to 250 icons from the Bitcoin Icons collection through the stx iconify integration.

**Collection ID:** `bitcoin-icons`
**Total Icons:** 250
**Author:** Bitcoin Design Community ([Website](https://github.com/BitcoinDesign/Bitcoin-Icons))
**License:** MIT ([Details](https://github.com/BitcoinDesign/Bitcoin-Icons/blob/main/LICENSE-MIT))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bitcoin-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddressBookFilledIcon height="1em" />
<AddressBookFilledIcon width="1em" height="1em" />
<AddressBookFilledIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddressBookFilledIcon size="24" />
<AddressBookFilledIcon size="1em" />

<!-- Using width and height -->
<AddressBookFilledIcon width="24" height="32" />

<!-- With color -->
<AddressBookFilledIcon size="24" color="red" />
<AddressBookFilledIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddressBookFilledIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddressBookFilledIcon
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
    <AddressBookFilledIcon size="24" />
    <AddressBookOutlineIcon size="24" color="#4a90e2" />
    <AlertCircleFilledIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addressBookFilled, addressBookOutline, alertCircleFilled } from '@stacksjs/iconify-bitcoin-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addressBookFilled, { size: 24 })
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
<AddressBookFilledIcon size="24" color="red" />
<AddressBookFilledIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddressBookFilledIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddressBookFilledIcon size="24" class="text-primary" />
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
<AddressBookFilledIcon height="1em" />
<AddressBookFilledIcon width="1em" height="1em" />
<AddressBookFilledIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddressBookFilledIcon size="24" />
<AddressBookFilledIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.bitcoinIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddressBookFilledIcon class="bitcoinIcons-icon" />
```

## Available Icons

This package contains **250** icons:

- `addressBookFilled`
- `addressBookOutline`
- `alertCircleFilled`
- `alertCircleOutline`
- `alertFilled`
- `alertOutline`
- `arrowDownFilled`
- `arrowDownOutline`
- `arrowLeftFilled`
- `arrowLeftOutline`
- `arrowRightFilled`
- `arrowRightOutline`
- `arrowUpFilled`
- `arrowUpOutline`
- `bellFilled`
- `bellOutline`
- `bitcoinCircleFilled`
- `bitcoinCircleOutline`
- `bitcoinFilled`
- `bitcoinOutline`
- `blockFilled`
- `blockOutline`
- `brushFilled`
- `brushOutline`
- `buoyFilled`
- `buoyOutline`
- `calendarFilled`
- `calendarOutline`
- `carFilled`
- `carOutline`
- `caretDownFilled`
- `caretDownOutline`
- `caretLeftFilled`
- `caretLeftOutline`
- `caretRightFilled`
- `caretRightOutline`
- `caretUpFilled`
- `caretUpOutline`
- `cartFilled`
- `cartOutline`
- `channelFilled`
- `channelOutline`
- `channelsFilled`
- `channelsOutline`
- `checkFilled`
- `checkOutline`
- `clearCharacterFilled`
- `clearCharacterOutline`
- `clockFilled`
- `clockOutline`
- `cloudFilled`
- `cloudOutline`
- `codeFilled`
- `codeOutline`
- `coinsFilled`
- `coinsOutline`
- `confirmations0Filled`
- `confirmations0Outline`
- `confirmations1Filled`
- `confirmations1Outline`
- `confirmations2Filled`
- `confirmations2Outline`
- `confirmations3Filled`
- `confirmations3Outline`
- `confirmations4Filled`
- `confirmations4Outline`
- `confirmations5Filled`
- `confirmations5Outline`
- `confirmations6Filled`
- `confirmations6Outline`
- `consoleFilled`
- `consoleOutline`
- `contactsFilled`
- `contactsOutline`
- `copyFilled`
- `copyOutline`
- `creditCardFilled`
- `creditCardOutline`
- `crossFilled`
- `crossOutline`
- `devicesFilled`
- `devicesOutline`
- `editFilled`
- `editOutline`
- `ellipsisFilled`
- `ellipsisOutline`
- `exchangeFilled`
- `exchangeOutline`
- `exitFilled`
- `exitOutline`
- `exportFilled`
- `exportOutline`
- `fileFilled`
- `fileOutline`
- `flipHorizontalFilled`
- `flipHorizontalOutline`
- `flipVerticalFilled`
- `flipVerticalOutline`
- `gearFilled`
- `gearOutline`
- `globeFilled`
- `globeOutline`
- `graphFilled`
- `graphOutline`
- `gridFilled`
- `gridOutline`
- `hiddenFilled`
- `hiddenOutline`
- `homeFilled`
- `homeOutline`
- `infoCircleFilled`
- `infoCircleOutline`
- `infoFilled`
- `infoOutline`
- `invoiceFilled`
- `invoiceOutline`
- `keyFilled`
- `keyOutline`
- `lightningCircleFilled`
- `lightningCircleOutline`
- `lightningFilled`
- `lightningOutline`
- `linkFilled`
- `linkOutline`
- `linuxTerminalFilled`
- `linuxTerminalOutline`
- `lockFilled`
- `lockOutline`
- `magicWandFilled`
- `magicWandOutline`
- `menuFilled`
- `menuOutline`
- `messageFilled`
- `messageOutline`
- `milkFilled`
- `milkOutline`
- `minerFilled`
- `minerOutline`
- `miningDeviceFilled`
- `miningDeviceOutline`
- `miningFilled`
- `miningOutline`
- `minusFilled`
- `minusOutline`
- `mixedFilled`
- `mixedOutline`
- `mnemonicFilled`
- `mnemonicOutline`
- `moonFilled`
- `moonOutline`
- `noDollarsFilled`
- `noDollarsOutline`
- `node0ConnectionsFilled`
- `node0ConnectionsOutline`
- `node1ConnectionFilled`
- `node1ConnectionOutline`
- `node2ConnectionsFilled`
- `node2ConnectionsOutline`
- `node3ConnectionsFilled`
- `node3ConnectionsOutline`
- `nodeFilled`
- `nodeHardwareFilled`
- `nodeHardwareOutline`
- `nodeOutline`
- `pantheonFilled`
- `pantheonOutline`
- `passwordFilled`
- `passwordOutline`
- `photoFilled`
- `photoOutline`
- `pieChartFilled`
- `pieChartOutline`
- `plusFilled`
- `plusOutline`
- `podcastFilled`
- `podcastOutline`
- `pointOfSaleFilled`
- `pointOfSaleOutline`
- `proxyFilled`
- `proxyOutline`
- `qrCodeFilled`
- `qrCodeOutline`
- `questionCircleFilled`
- `questionCircleOutline`
- `questionFilled`
- `questionOutline`
- `receiveFilled`
- `receiveOutline`
- `refreshFilled`
- `refreshOutline`
- `relayFilled`
- `relayOutline`
- `rocketFilled`
- `rocketOutline`
- `safeFilled`
- `safeOutline`
- `satoshiV1Filled`
- `satoshiV1Outline`
- `satoshiV2Filled`
- `satoshiV2Outline`
- `satoshiV3Filled`
- `satoshiV3Outline`
- `scanFilled`
- `scanOutline`
- `sdCardFilled`
- `sdCardOutline`
- `searchFilled`
- `searchOutline`
- `sendFilled`
- `sendOutline`
- `shareFilled`
- `shareOutline`
- `sharedWalletFilled`
- `sharedWalletOutline`
- `shieldFilled`
- `shieldOutline`
- `signFilled`
- `signOutline`
- `snowflakeFilled`
- `snowflakeOutline`
- `sofaFilled`
- `sofaOutline`
- `starFilled`
- `starOutline`
- `sunFilled`
- `sunOutline`
- `tagFilled`
- `tagOutline`
- `tipJarFilled`
- `tipJarOutline`
- `transactionsFilled`
- `transactionsOutline`
- `transferFilled`
- `transferOutline`
- `trashFilled`
- `trashOutline`
- `twoKeysFilled`
- `twoKeysOutline`
- `unlockFilled`
- `unlockOutline`
- `unmixedFilled`
- `unmixedOutline`
- `usbFilled`
- `usbOutline`
- `verifyFilled`
- `verifyOutline`
- `visibleFilled`
- `visibleOutline`
- `walletFilled`
- `walletOutline`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddressBookFilledIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddressBookOutlineIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlertCircleFilledIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlertCircleOutlineIcon size="20" class="nav-icon" /> Settings</a>
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
<AddressBookFilledIcon
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
    <AddressBookFilledIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddressBookOutlineIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlertCircleFilledIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddressBookFilledIcon size="24" />
   <AddressBookOutlineIcon size="24" color="#4a90e2" />
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
   <AddressBookFilledIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddressBookFilledIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddressBookFilledIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addressBookFilled } from '@stacksjs/iconify-bitcoin-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addressBookFilled, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addressBookFilled } from '@stacksjs/iconify-bitcoin-icons'

// Icons are typed as IconData
const myIcon: IconData = addressBookFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/BitcoinDesign/Bitcoin-Icons/blob/main/LICENSE-MIT) for more information.

## Credits

- **Icons**: Bitcoin Design Community ([Website](https://github.com/BitcoinDesign/Bitcoin-Icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bitcoin-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bitcoin-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
