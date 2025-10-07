# @stx/iconify-icon-park-twotone

IconPark TwoTone icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-icon-park-twotone
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-icon-park-twotone'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-icon-park-twotone'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1947 icons from IconPark TwoTone.

## License

Apache 2.0

License: https://github.com/bytedance/IconPark/blob/master/LICENSE

## Credits

- Icons: ByteDance (https://github.com/bytedance/IconPark)
- Iconify: https://iconify.design/
