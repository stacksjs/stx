![Social Card of Bun Plugin blade](https://github.com/stacksjs/bun-plugin-stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]
<!-- [![Codecov][codecov-src]][codecov-href] -->

WIP 🚧

# bun-plugin-stx

> Blade is the simple, yet powerful templating engine provided with Stacks.

## Features

- 🦋 Laravel Blade-like
- 🚀 Fast and lightweight
- 📦 Zero config

## Usage

```bash
bun install -d bun-plugin-stx
```

### Bundler

You may now use the plugin now via `Bun.build`:

```ts
// build.ts
import type { UserConfig } from 'blade'
import { plugin as blade } from 'bun-plugin-stx'
// import blade from 'bun-plugin-stx'

Bun.build({
  entrypoints: ['./src/index.html'],
  outdir: './dist',
  plugins: [
    blade,
  ],
})
```

### Server

Additionally, it can also be used in conjunction with HTML imports, via `Bun.serve()`:

```ts
// server.ts
import home from './home.html'

const server = Bun.serve({
  static: {
    // Bundle & route home.html to "/home"
    '/': home,
  },

  async fetch(req) {
    console.log('any other request', req.url)

    // Return 404 for unmatched routes
    return new Response('Not Found', { status: 404 })
  },
})

console.log(`Listening on ${server.url}`)
```

```html
<!-- home.html -->
<!DOCTYPE html>
<html>

<head>
  <title>Home</title>
</head>

<body>
  <div @if="true">Is this shown?</div>
</body>

</html>
```

#### Configuration

For this to work, though, you have to ensure that the plugin is defined in your `bunfig.toml`:

```toml
[serve.static]
plugins = [ "bun-plugin-stx" ]
```

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
