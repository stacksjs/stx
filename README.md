![Social Card of Bun Plugin blade](https://github.com/stacksjs/bun-plugin-stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]
<!-- [![Codecov][codecov-src]][codecov-href] -->

WIP 🚧

# bun-plugin-stx

A Bun plugin that enables Laravel Blade-like syntax in `.stx` files. This plugin allows you to write templates with dynamic content using a simple yet powerful syntax.

## Installation

```bash
bun add bun-plugin-stx --dev
```

## Setup

Add the plugin to your `bunfig.toml`:

```toml
[plugins]
stx = "bun-plugin-stx"
```

Or register the plugin in your build script:

```ts
import { build } from 'bun'
import stxPlugin from 'bun-plugin-stx'

await build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [stxPlugin],
})
```

## Usage

Create `.stx` files with a syntax similar to Laravel Blade templates. Variables in your script tags must be exported using a module.exports pattern:

```html
<!DOCTYPE html>
<html>
<head>
  <title>STX Example</title>
  <script>
    // Define your data by exporting from the script tag
    module.exports = {
      title: "Hello World",
      items: ["Apple", "Banana", "Cherry"],
      showFooter: true
    };
  </script>
</head>
<body>
  <h1>{{ title }}</h1>

  <ul>
    @foreach (items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>

  @if (showFooter)
    <footer>Copyright 2023</footer>
  @endif
</body>
</html>
```

## Supported Directives

### Conditionals

```html
@if (condition)
  <!-- content -->
@elseif (anotherCondition)
  <!-- content -->
@else
  <!-- content -->
@endif
```

### Loops

```html
<!-- Foreach loop -->
@foreach (array as item)
  <!-- content -->
@endforeach

<!-- For loop -->
@for (let i = 0; i < 5; i++)
  <!-- content -->
@endfor
```

### Displaying Data

```html
<!-- Escaped output -->
{{ variable }}

<!-- Raw output (unescaped) -->
{!! rawHtml !!}
```

## Example Server

Run a development server with your STX templates:

```ts
// serve.ts
import home from './home.stx'

const server = Bun.serve({
  routes: {
    '/': home,
  },
  development: true,

  fetch(req) {
    return new Response('Not Found', { status: 404 })
  },
})

console.log(`Listening on ${server.url}`)
```

## Testing This Plugin

To test the plugin with the included examples:

1. Build the test file:

```bash
bun run test-build.ts
```

2. Run the test server:

```bash
bun run serve-test.ts
```

3. Open your browser to the displayed URL (typically `http://localhost:3000`).

## How It Works

The plugin works by:

1. Extracting script tags from .stx files
2. Creating an execution context with variables from the script
3. Processing Blade-like directives (@if, @foreach, etc.) into HTML
4. Processing variable tags ({{ var }}) with their values
5. Returning the processed HTML content

## Features

- 🦋 Laravel Blade-like syntax
- 🚀 Fast and lightweight
- 📦 Zero config

## License

MIT

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stacksjs/bun-plugin-stx/releases) page for more information on what has changed recently.

## Contributing

Please review the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/stacks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

You will always be free to use any of the Stacks OSS software. We would also love to see which parts of the world Stacks ends up in. _Receiving postcards makes us happy—and we will publish them on our website._

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

Many thanks to the following core technologies & people who have contributed to this package:

- [Laravel](https://laravel.com)
- [Anthony Fu](https://github.com/antfu)
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/bun-plugin-stx/tree/main/LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: <https://img.shields.io/npm/v/bun-plugin-stx?style=flat-square>
[npm-version-href]: <https://npmjs.com/package/bun-plugin-stx>
[npm-downloads-src]: <https://img.shields.io/npm/dm/bun-plugin-stx?style=flat-square>
[npm-downloads-href]: <https://npmjs.com/package/bun-plugin-stx>
[github-actions-src]: <https://img.shields.io/github/actions/workflow/status/stacksjs/bun-plugin-stx/ci.yml?style=flat-square&branch=main>
[github-actions-href]: <https://github.com/stacksjs/bun-plugin-stx/actions?query=workflow%3Aci>

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/bun-plugin-stx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/bun-plugin-stx -->
