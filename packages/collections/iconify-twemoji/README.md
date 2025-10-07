# @stx/iconify-twemoji

Twitter Emoji icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-twemoji
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-twemoji'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-twemoji'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 3849 icons from Twitter Emoji.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Twitter (https://github.com/twitter/twemoji)
- Iconify: https://iconify.design/
