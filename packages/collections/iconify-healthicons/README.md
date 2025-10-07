# @stx/iconify-healthicons

Health Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-healthicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-healthicons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-healthicons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2691 icons from Health Icons.

## License

MIT

License: https://github.com/resolvetosavelives/healthicons/blob/main/LICENSE

## Credits

- Icons: Resolve to Save Lives (https://github.com/resolvetosavelives/healthicons)
- Iconify: https://iconify.design/
