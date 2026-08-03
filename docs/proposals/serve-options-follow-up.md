# Serve options follow-up

Recorded while adding application-aware browser opening for Stacks `buddy dev`
on 2026-08-03.

## Remaining work

- Consolidate the two public `ServeOptions` contracts. The `bun-plugin-stx`
  package root currently re-exports `ServeOptions` from `@stacksjs/stx`, while
  `bun-plugin-stx/serve` exposes the separate server options declared in
  `packages/bun-plugin/src/serve.ts`. Consumers should have one unambiguous
  type for the server they import.
- Remove the existing `ts/no-explicit-any` warnings in
  `packages/bun-plugin/src/serve.ts`. Pickier currently reports 21 warnings in
  that module. The new `openPath` implementation does not add any of them.
- Decide how missing Iconify collections should be handled during development.
  A real Postline `buddy dev` run warns that the `lucide` collection is not
  installed and renders those icons as nothing. Consider making collection
  discovery/install guidance actionable before rendering, or providing a
  development fallback that does not silently remove icons.
- Resolve the class-order warnings exposed by Pickier in the refreshed Stacks
  dashboard templates. Postline currently reports three warnings in
  `Dashboard/Content/BlogDashboard.stx` and two in
  `Dashboard/Content/ContentTaxonomyDashboard.stx` after upgrading its vendored
  defaults to Stacks 0.70.252.

## Resolved during this work

- `bun-plugin-stx/serve` now publishes its generated `dist/serve.d.ts` through
  the package export map.
- `ServeOptions.openPath` controls the same-origin URL shown in the dev banner
  and opened by the `o + Enter` shortcut.
