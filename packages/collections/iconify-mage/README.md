# @stx/iconify-mage

Mage Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-mage
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-mage'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-mage'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1042 icons from Mage Icons.

## License

Apache 2.0

License: https://github.com/Mage-Icons/mage-icons/blob/main/License.txt

## Credits

- Icons: MageIcons (https://github.com/Mage-Icons/mage-icons)
- Iconify: https://iconify.design/
