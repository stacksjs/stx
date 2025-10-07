# @stx/iconify-octicon

Octicons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-octicon
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-octicon'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-octicon'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 846 icons from Octicons.

## License

MIT

License: https://github.com/primer/octicons/blob/main/LICENSE

## Credits

- Icons: GitHub (https://github.com/primer/octicons/)
- Iconify: https://iconify.design/
