# @stacksjs/iconify-famicons

Famicons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-famicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-famicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-famicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1342 icons from Famicons.

## License

MIT

License: https://github.com/familyjs/famicons/blob/main/LICENSE

## Credits

- Icons: Family (https://github.com/familyjs/famicons)
- Iconify: https://iconify.design/
