# @stx/iconify-oi

Open Iconic icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-oi
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-oi'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-oi'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 223 icons from Open Iconic.

## License

MIT

License: https://github.com/iconic/open-iconic/blob/master/ICON-LICENSE

## Credits

- Icons: Iconic (https://github.com/iconic/open-iconic)
- Iconify: https://iconify.design/
