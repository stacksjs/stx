# @stacksjs/iconify-fa

Font Awesome 4 icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-fa
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-fa'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-fa'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 649 icons from Font Awesome 4.

## License

Open Font License

License: https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL

## Credits

- Icons: Dave Gandy (https://github.com/FortAwesome/Font-Awesome/tree/fa-4)
- Iconify: https://iconify.design/
