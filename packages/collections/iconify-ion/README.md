# @stx/iconify-ion

IonIcons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-ion
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-ion'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-ion'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2361 icons from IonIcons.

## License

MIT

License: https://github.com/ionic-team/ionicons/blob/main/LICENSE

## Credits

- Icons: Ben Sperry (https://github.com/ionic-team/ionicons)
- Iconify: https://iconify.design/
