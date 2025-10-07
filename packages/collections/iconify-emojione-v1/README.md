# @stx/iconify-emojione-v1

Emoji One (v1) icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-emojione-v1
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-emojione-v1'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-emojione-v1'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1262 icons from Emoji One (v1).

## License

CC BY-SA 4.0

License: https://creativecommons.org/licenses/by-sa/4.0/

## Credits

- Icons: Emoji One (https://github.com/joypixels/emojione-legacy)
- Iconify: https://iconify.design/
