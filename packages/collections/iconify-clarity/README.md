# @stx/iconify-clarity

Clarity icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-clarity
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-clarity'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-clarity'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1105 icons from Clarity.

## License

MIT

License: https://github.com/vmware/clarity-assets/blob/master/LICENSE

## Credits

- Icons: VMware (https://github.com/vmware/clarity)
- Iconify: https://iconify.design/
