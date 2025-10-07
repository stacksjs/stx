# @stx/iconify-f7

Framework7 Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-f7
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-f7'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-f7'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1253 icons from Framework7 Icons.

## License

MIT

License: https://github.com/framework7io/framework7-icons/blob/master/LICENSE

## Credits

- Icons: Vladimir Kharlampidi (https://github.com/framework7io/framework7-icons)
- Iconify: https://iconify.design/
