# @stacksjs/iconify-bpmn

BPMN icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-bpmn
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-bpmn'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-bpmn'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 112 icons from BPMN.

## License

Open Font License

License: https://github.com/bpmn-io/bpmn-font/blob/master/LICENSE

## Credits

- Icons: Camunda Services GmbH (https://github.com/bpmn-io/bpmn-font)
- Iconify: https://iconify.design/
