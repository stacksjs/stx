# @stacksjs/iconify-vs

Vesper Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-vs
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-vs'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-vs'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 159 icons from Vesper Icons.

## License

Open Font License

License: https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL

## Credits

- Icons: TableCheck (https://github.com/kkvesper/vesper-icons)
- Iconify: https://iconify.design/
