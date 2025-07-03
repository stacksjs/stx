<p align="center"><img src="https://github.com/stacksjs/rpx/blob/main/.github/art/cover.jpg?raw=true" alt="Social Card of this repo"></p>

# A Better Developer Experience

> A TypeScript Starter Kit that will help you bootstrap your next project without minimal opinion.

# bun-ts-starter

This is an opinionated TypeScript Starter kit to help kick-start development of your next Bun package.

## Get Started

It's rather simple to get your package development started:

```bash
# you may use this GitHub template or the following command:
bunx degit stacksjs/ts-starter my-pkg
cd my-pkg

 # if you don't have pnpm installed, run `npm i -g pnpm`
bun i # install all deps
bun run build # builds the library for production-ready use

# after you have successfully committed, you may create a "release"
bun run release # automates git commits, versioning, and changelog generations
```

_Check out the package.json scripts for more commands._

### Developer Experience (DX)

This Starter Kit comes pre-configured with the following:

- [Powerful Build Process](https://github.com/oven-sh/bun) - via Bun
- [Fully Typed APIs](https://www.typescriptlang.org/) - via TypeScript
- [Documentation-ready](https://vitepress.dev/) - via VitePress
- [CLI & Binary](https://www.npmjs.com/package/bunx) - via Bun & CAC
- [Be a Good Commitizen](https://www.npmjs.com/package/git-cz) - pre-configured Commitizen & git-cz setup to simplify semantic git commits, versioning, and changelog generations
- [Built With Testing In Mind](https://bun.sh/docs/cli/test) - pre-configured unit-testing powered by [Bun](https://bun.sh/docs/cli/test)
- [Renovate](https://renovatebot.com/) - optimized & automated PR dependency updates
- [ESLint](https://eslint.org/) - for code linting _(and formatting)_
- [GitHub Actions](https://github.com/features/actions) - runs your CI _(fixes code style issues, tags releases & creates its changelogs, runs the test suite, etc.)_

## Changelog

Please see our [releases](https://github.com/stacksjs/stacks/releases) page for more information on what has changed recently.

## Stargazers

[![Stargazers](https://starchart.cc/stacksjs/ts-starter.svg?variant=adaptive)](https://starchart.cc/stacksjs/ts-starter)

## Contributing

Please review the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/stacks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

Two things are true: Stacks OSS will always stay open-source, and we do love to receive postcards from wherever Stacks is used! 🌍 _We also publish them on our website. And thank you, Spatie_

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](https://github.com/stacksjs/rpx/graphs/contributors)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/ts-starter/tree/main/LICENSE.md) for more information.

Made with 💙

<!-- Badges -->

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/rpx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/rpx -->

# Introduction to STX

STX is a modern UI engine that combines the elegance of Laravel Blade with the power of Bun. It's designed to make building user interfaces both enjoyable and efficient, with first-class TypeScript support and powerful features out of the box.

## What is STX?

STX is a UI engine that allows you to:
- Write templates with a clean, familiar syntax
- Use TypeScript directly in your templates
- Create reusable components with props and slots
- Leverage streaming rendering for better performance
- Build type-safe applications with full IDE support

## Key Features

### 🚀 Performance First
Built on Bun, STX delivers exceptional performance:
- Lightning-fast template compilation
- Minimal runtime overhead
- Efficient component rendering
- Smart caching and build optimization

### 💪 Type Safety
First-class TypeScript support:
- Full type checking in templates
- Type-safe props and events
- IDE autocompletion
- Error detection at build time

### 🧩 Component System
Build reusable UI components:
- Props validation
- Slots and named slots
- Component lifecycle hooks
- Scoped styles

### 🔄 Directives
Powerful template directives:
```stx
@if(user.isAdmin)
  <admin-panel />
@else
  <user-panel />
@endif

@foreach(items as item)
  <list-item :data="item" />
@endforeach
```

### 🎨 Styling
Multiple ways to style your components:
```stx
<style>
  .button {
    @apply bg-blue-500 text-white px-4 py-2 rounded;
  }
</style>
```

### 🛠 Developer Tools
Comprehensive tooling support:
- VSCode extension with syntax highlighting and IntelliSense
- DevTools for debugging and performance monitoring
- CLI for project scaffolding and build management

## Quick Example

Here's a simple STX component:

```stx
@ts
interface ButtonProps {
  type?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}
@endts

@component('Button', {
  props: {
    type: 'primary',
    size: 'md',
    disabled: false
  }
})
  <button 
    class="btn btn-{{ type }} btn-{{ size }}"
    :disabled="disabled"
  >
    <slot></slot>
  </button>

  <style>
    .btn {
      @apply rounded font-medium;
    }
    .btn-primary {
      @apply bg-blue-500 text-white;
    }
    .btn-secondary {
      @apply bg-gray-500 text-white;
    }
  </style>
@endcomponent
```

## Why STX?

- **Modern**: Built with modern web development practices in mind
- **Type-Safe**: First-class TypeScript support for better developer experience
- **Fast**: Powered by Bun for exceptional performance
- **Familiar**: Blade-inspired syntax that's easy to learn
- **Tooling**: Great IDE support and developer tools
- **Flexible**: Works with any backend technology

## Getting Started

Ready to start building with STX? Follow these steps:

1. [Installation Guide](/install) - Set up STX in your project
2. [Quick Start](/usage) - Learn the basics in 5 minutes
3. [Examples](/examples) - Explore example components and patterns
4. [API Reference](/api-reference) - Complete API documentation

## Need Help?

- Join our [Discord Community](https://discord.gg/stacksjs)
- Check out the [GitHub Repository](https://github.com/stacksjs/stx)
- Follow us on [Twitter](https://twitter.com/stacksjs)
- Read our [Best Practices Guide](/best-practices)
