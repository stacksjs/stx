# @stx/iconify-typcn

Typicons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-typcn
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-typcn'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-typcn'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 336 icons from Typicons.

## License

CC BY-SA 4.0

License: https://creativecommons.org/licenses/by-sa/4.0/

## Credits

- Icons: Stephen Hutchings (https://github.com/stephenhutchings/typicons.font)
- Iconify: https://iconify.design/
