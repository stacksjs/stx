# @stx/iconify-subway

Subway Icon Set icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-subway
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-subway'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-subway'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 306 icons from Subway Icon Set.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Mariusz Ostrowski (https://github.com/mariuszostrowski/subway)
- Iconify: https://iconify.design/
