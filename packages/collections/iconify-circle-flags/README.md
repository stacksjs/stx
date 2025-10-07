# @stx/iconify-circle-flags

Circle Flags icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-circle-flags
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-circle-flags'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-circle-flags'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 729 icons from Circle Flags.

## License

MIT

License: https://github.com/HatScripts/circle-flags/blob/gh-pages/LICENSE

## Credits

- Icons: HatScripts (https://github.com/HatScripts/circle-flags)
- Iconify: https://iconify.design/
