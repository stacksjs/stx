# @stx/iconify-map

Map Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-map
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-map'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-map'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 167 icons from Map Icons.

## License

Open Font License

License: https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL

## Credits

- Icons: Scott de Jonge (https://github.com/scottdejonge/map-icons)
- Iconify: https://iconify.design/
