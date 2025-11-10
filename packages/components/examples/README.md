# Examples

This directory contains example applications demonstrating the usage of @stacksjs/components.

## Running the Examples

### Using STX CLI

```bash
# From the stx root directory
./packages/stx/bin/stx dev packages/components/examples/demo.stx
```

### Using Bun

```bash
# From the components package
cd packages/components
bun run stx dev examples/demo.stx
```

## Available Examples

### demo.stx

A comprehensive demo showcasing all available components:
- Button variants and sizes
- Switch component in different states
- Code highlighting with CodeBlock
- Installation instructions
- Hero and Footer components

## Creating Your Own Examples

To create a new example:

1. Create a new `.stx` file in this directory
2. Import components from `@stacksjs/components`
3. Use the STX CLI to run it

Example:

```stx
<script>
import { Button } from '@stacksjs/components'

function handleClick() {
  console.log('Clicked!')
}

module.exports = { handleClick }
</script>

<div class="p-8">
  @component('Button', { variant: 'primary', onClick: handleClick })
    My Button
  @endcomponent
</div>
```
