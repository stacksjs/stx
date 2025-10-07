# @stx/iconify-gravity-ui

Gravity UI Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-gravity-ui
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-gravity-ui'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-gravity-ui'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 744 icons from Gravity UI Icons.

## License

MIT

License: https://github.com/gravity-ui/icons/blob/main/LICENSE

## Credits

- Icons: YANDEX LLC (https://github.com/gravity-ui/icons/)
- Iconify: https://iconify.design/
