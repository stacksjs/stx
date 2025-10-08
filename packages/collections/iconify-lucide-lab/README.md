# @stacksjs/iconify-lucide-lab

Lucide Lab icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-lucide-lab
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-lucide-lab'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-lucide-lab'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 373 icons from Lucide Lab.

## License

ISC

License: https://github.com/lucide-icons/lucide-lab/blob/main/LICENSE

## Credits

- Icons: Lucide Contributors (https://github.com/lucide-icons/lucide-lab)
- Iconify: https://iconify.design/
