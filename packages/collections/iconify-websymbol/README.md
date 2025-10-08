# @stacksjs/iconify-websymbol

Web Symbols Liga icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-websymbol
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-websymbol'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-websymbol'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 85 icons from Web Symbols Liga.

## License

Open Font License

License: https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL

## Credits

- Icons: Just Be Nice studio
- Iconify: https://iconify.design/
