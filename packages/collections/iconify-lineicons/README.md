# @stacksjs/iconify-lineicons

Lineicons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-lineicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-lineicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-lineicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 962 icons from Lineicons.

## License

MIT

License: https://github.com/LineiconsHQ/Lineicons/blob/main/LICENSE.md

## Credits

- Icons: Lineicons (https://github.com/LineiconsHQ/Lineicons)
- Iconify: https://iconify.design/
