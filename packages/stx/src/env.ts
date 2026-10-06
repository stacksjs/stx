/*
 * The environment gates, read through a destructure rather than directly off
 * `process.env.NODE_ENV`.
 *
 * This package is built by transforming each source file with `Bun.Transpiler`
 * (see `build.ts`), and the transpiler CONSTANT-FOLDS
 * `process.env.NODE_ENV === 'production'` against the environment it is itself
 * running in. The release machine does not set NODE_ENV, so all three of these
 * shipped as `return !1`: in every installed copy of stx, `isProduction()` and
 * `isTest()` were permanently false and `isDevelopment()` permanently true,
 * whatever the consuming app's NODE_ENV said.
 *
 * Which quietly put every app's renderer in development mode. The visible
 * consequence was the error boundaries: `showBoundaries` in `process.ts` is
 * `!isProduction() && !isTest()`, so a failed `<script server>` or `@include`
 * rendered its red diagnostic -- absolute build-machine paths included -- to
 * end users on a production deploy, which is how it was reported
 * (stacksjs/stx#2035). `app-shell.ts` also always chose its `dev` variant and
 * the error logger always used development verbosity.
 *
 * `process.env['NODE_ENV']` folds in exactly the same way. Destructuring does
 * not, and nor does a computed key; this is the readable one. Pinned by
 * `test/env-gates-survive-the-build.test.ts`, which runs the build's own
 * transpiler over this file -- the source is correct either way, so nothing
 * that reads the source can see the bug.
 */

export function isProduction(): boolean {
  const { NODE_ENV } = process.env
  return NODE_ENV === 'production'
}

export function isDevelopment(): boolean {
  const { STX_DEBUG } = process.env
  return !isProduction() || STX_DEBUG === 'true'
}

export function isTest(): boolean {
  const { NODE_ENV } = process.env
  return NODE_ENV === 'test'
}
