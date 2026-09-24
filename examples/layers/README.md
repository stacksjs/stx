# Two applications, one foundation

From the repository root, run either application:

```sh
bun packages/stx/bin/cli.ts dev examples/layers/app-one
bun packages/stx/bin/cli.ts dev examples/layers/app-two
```

Both use `base/pages`, `base/layouts`, `base/components` and `base/functions`.
App one replaces `LayerHeader.stx` and `/about`; app two uses the foundation
unchanged. Editing the shared header updates both running development servers.
The inheritance model also works with an installed package in `extends`.

See [application layers](../../docs/features/application-layers.md) for precedence,
merge rules, diagnostics, and deployment behavior.
