# @stx/iconify-whh

WebHostingHub Glyphs icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-whh
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-whh'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-whh'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2125 icons from WebHostingHub Glyphs.

## License

Open Font License

License: https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL

## Credits

- Icons: WebHostingHub
- Iconify: https://iconify.design/
