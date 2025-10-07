# @stx/iconify-fad

FontAudio icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-fad
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-fad'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-fad'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 155 icons from FontAudio.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: @fefanto (https://github.com/fefanto/fontaudio)
- Iconify: https://iconify.design/
