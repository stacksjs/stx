# @stx/iconify-fe

Feather Icon icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-fe
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-fe'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-fe'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 255 icons from Feather Icon.

## License

MIT

License: https://github.com/feathericon/feathericon/blob/master/LICENSE

## Credits

- Icons: Megumi Hano (https://github.com/feathericon/feathericon)
- Iconify: https://iconify.design/
