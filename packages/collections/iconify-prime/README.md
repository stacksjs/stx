# @stacksjs/iconify-prime

Prime Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-prime
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-prime'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-prime'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 313 icons from Prime Icons.

## License

MIT

License: https://github.com/primefaces/primeicons/blob/master/LICENSE

## Credits

- Icons: PrimeTek (https://github.com/primefaces/primeicons)
- Iconify: https://iconify.design/
