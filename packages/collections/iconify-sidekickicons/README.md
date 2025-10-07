# @stx/iconify-sidekickicons

SidekickIcons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-sidekickicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-sidekickicons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-sidekickicons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 224 icons from SidekickIcons.

## License

MIT

License: https://github.com/ndri/sidekickicons/blob/master/LICENSE

## Credits

- Icons: Andri Soone (https://github.com/ndri/sidekickicons)
- Iconify: https://iconify.design/
