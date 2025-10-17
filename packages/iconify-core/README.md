# @stacksjs/iconify-core

Core utilities for using Iconify icons in stx templates.

## Installation

```bash
bun add @stacksjs/iconify-core
```

## Usage

This package provides the core utilities for rendering icons. You'll typically use it alongside a specific icon collection package like `@stacksjs/iconify-lucide` or `@stacksjs/iconify-mdi`.

```typescript
import { renderIcon } from '@stacksjs/iconify-core'
import type { IconData, IconProps } from '@stacksjs/iconify-core'

const iconData: IconData = {
  body: '<path fill="currentColor" d="..."/>',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24'
}

const svg = renderIcon(iconData, {
  size: 32,
  color: '#4a90e2'
})
```

## API

### `renderIcon(iconData: IconData, props?: IconProps): string`

Renders an icon to an SVG string.

#### Parameters

- `iconData`: Icon data object containing SVG body and dimensions
- `props`: Optional rendering options

#### Icon Props

```typescript
interface IconProps {
  size?: string | number          // Icon size (width and height)
  width?: string | number          // Icon width
  height?: string | number         // Icon height
  color?: string                   // Icon color (default: 'currentColor')
  hFlip?: boolean                  // Flip horizontally
  vFlip?: boolean                  // Flip vertically
  rotate?: 0 | 90 | 180 | 270     // Rotation in degrees
  class?: string                   // Additional CSS classes
  style?: string                   // Additional inline styles
}
```

## Example

```typescript
import { home } from '@stacksjs/iconify-lucide'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const icon1 = renderIcon(home, { size: 24 })

// With color
const icon2 = renderIcon(home, { size: 24, color: '#ff0000' })

// With transformations
const icon3 = renderIcon(home, {
  size: 24,
  rotate: 90,
  hFlip: true
})

// With custom classes and styles
const icon4 = renderIcon(home, {
  size: 24,
  class: 'my-icon',
  style: 'opacity: 0.8;'
})
```

## License

MIT
