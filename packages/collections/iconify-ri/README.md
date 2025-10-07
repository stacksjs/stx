# @stx/iconify-ri

Remix Icon icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-ri
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-ri'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-ri'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 3058 icons from Remix Icon.

## License

Apache 2.0

License: https://github.com/Remix-Design/RemixIcon/blob/master/License

## Credits

- Icons: Remix Design (https://github.com/Remix-Design/RemixIcon)
- Iconify: https://iconify.design/
