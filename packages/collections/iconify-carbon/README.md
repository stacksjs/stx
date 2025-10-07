# @stx/iconify-carbon

Carbon icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-carbon
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-carbon'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-carbon'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2508 icons from Carbon.

## License

Apache 2.0



## Credits

- Icons: IBM (https://github.com/carbon-design-system/carbon/tree/main/packages/icons)
- Iconify: https://iconify.design/
