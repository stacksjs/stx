# @stx/iconify-el

Elusive Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-el
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-el'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-el'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 304 icons from Elusive Icons.

## License

Open Font License

License: https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL

## Credits

- Icons: Team Redux (https://github.com/dovy/elusive-icons)
- Iconify: https://iconify.design/
