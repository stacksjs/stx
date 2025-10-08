# @stacksjs/iconify-academicons

Academicons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-academicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-academicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-academicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 158 icons from Academicons.

## License

Open Font License

License: https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL

## Credits

- Icons: James Walsh (https://github.com/jpswalsh/academicons)
- Iconify: https://iconify.design/
