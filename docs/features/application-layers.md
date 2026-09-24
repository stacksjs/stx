# Application layers

Share an application foundation without copying its pages, layouts, components,
partials, composables, or configuration:

```ts
export default {
  extends: ['../brand', '@company/stx-foundation'],
  app: { head: { title: 'My application' } },
}
```

Each layer is a directory containing `stx.config.ts` (or a supported JS config),
or an explicit local config-file path. Installed packages may declare
`"stx": { "layer": "layer.config.ts" }` in `package.json`; otherwise their root
`stx.config.ts` is used. Packages must already be installed. No remote fetching
is performed. Layers execute trusted server-side configuration, just like plugins.

## Precedence and merging

Precedence is **app first, then depth-first traversal of `extends`, left to right**.
For app → `[brand, other]` and brand → `[foundation]`, the order is
app > brand > foundation > other. Repeated layers participate once, at their first
position. Cycles fail with the full config-file chain.

- Objects merge recursively. The higher-priority leaf wins.
- Arrays replace, including head tags and custom directives.
- `middleware` and `plugins` arrays concatenate in execution order: lowest priority
  first, app last. Middleware hooks all run; a function-valued config property
  outside these arrays is replaced, not implicitly composed.
- Named resources use the first matching file. A local component or layout can
  replace a shared one without copying the shared pages that use it.
- Composables override by relative `.ts` filename, not individual exported symbol.
  Keep exported names unique across different files, as with ordinary composables.
- Pages override by URL shape, including equivalent dynamic parameter names.
  Ambiguous pages within one root fail with both filenames.
- Explicit component imports and explicitly relative partial paths remain local
  references; use named resources to allow application overrides.

The router and plugin/component systems remain the existing stx implementations.
Plugins can still supply resources; application-layer named components precede
plugin defaults. Relative plugin entries resolve from the declaring layer, not
the process working directory.

## Paths and supported resources

Each layer’s `root` positions its own resources. `pagesDir`, `layoutsDir`,
`componentsDir`, `partialsDir`, and `composablesDir` resolve against that root.
Defaults are `pages/`, `layouts/`, `components/`, `partials/`, and `functions/`.
An app’s directory settings do not relocate a parent layer’s files. Configs under
`.config/` still use the containing project as their resource root.

String CSS-config paths, plugin paths and server API directories are anchored to
the declaring project. Server API configuration is one inherited setting, not a
merged endpoint tree. Public assets, output/cache/state directories belong to the
app; layers do not merge these directories. Other feature-specific configuration
keeps its existing behavior. This first version does not introduce store, asset,
or server-endpoint override trees.

## Development and build diagnostics

`.stx/layers.json` records the resolved graph, config dependencies, and every
same-path resource override with its winning and shadowed file. Config/resource
changes invalidate layered config and component/partial caches. Local imports
used by layer configs participate in invalidation too.

The app dev server watches external layer roots and refreshes its route table on
changes, including newly added pages. Programmatic `serve()` checks layer
dependencies before serving cached pages. Changes to server startup settings
(port, root, server API enablement, plugins with long-lived external state) still
require restarting the server. Installed dependency upgrades should also restart
the process so package-module caches are fresh.

Production builds write `.output/server/layers.json`: ordered provenance with
relative file paths and SHA-256 content hashes, not config values or absolute
machine paths. Lockfiles and installed-layer package metadata are tracked. The
compiled production server does not load or merge layers at request time.

See the [two-app example](../../examples/layers/README.md). Test changes through
both development and production builds, since a layer should not depend on the
working directory from which its app was launched.
