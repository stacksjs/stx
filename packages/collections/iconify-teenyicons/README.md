# @stacksjs/iconify-teenyicons

Teenyicons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-teenyicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-teenyicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-teenyicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1200 icons from Teenyicons.

## License

MIT

License: https://github.com/teenyicons/teenyicons/blob/master/LICENSE

## Credits

- Icons: smhmd (https://github.com/teenyicons/teenyicons)
- Iconify: https://iconify.design/
