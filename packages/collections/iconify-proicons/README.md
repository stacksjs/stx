# @stx/iconify-proicons

ProIcons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-proicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-proicons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-proicons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 529 icons from ProIcons.

## License

MIT

License: https://github.com/ProCode-Software/proicons/blob/main/LICENSE

## Credits

- Icons: ProCode (https://github.com/ProCode-Software/proicons)
- Iconify: https://iconify.design/
