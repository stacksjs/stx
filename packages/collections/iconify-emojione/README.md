# @stx/iconify-emojione

Emoji One (Colored) icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-emojione
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-emojione'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-emojione'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1834 icons from Emoji One (Colored).

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Emoji One (https://github.com/EmojiTwo/emojitwo)
- Iconify: https://iconify.design/
