# @stacksjs/iconify-mdi-light

Material Design Light icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-mdi-light
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-mdi-light'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-mdi-light'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 304 icons from Material Design Light.

## License

Open Font License

License: https://github.com/Templarian/MaterialDesignLight/blob/master/LICENSE.md

## Credits

- Icons: Pictogrammers (https://github.com/Templarian/MaterialDesignLight)
- Iconify: https://iconify.design/
