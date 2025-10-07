# @stx/iconify-il

Icalicons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-il
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-il'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-il'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 84 icons from Icalicons.

## License

MIT



## Credits

- Icons: Icalia Labs
- Iconify: https://iconify.design/
