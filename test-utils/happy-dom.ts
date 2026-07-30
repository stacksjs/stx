/**
 * Workspace-level VeryHappyDOM preload.
 *
 * `packages/desktop`, `packages/bun-plugin` and `packages/devtools` all point
 * their `bun test --preload` at `../../test-utils/happy-dom.ts`, which resolves
 * here. The file was missing, so `bun run test` in those three packages failed
 * to start with "preload not found" — the suites only ran when a preload path
 * was passed by hand.
 *
 * The actual DOM setup lives with the package that owns it; this is the shared
 * entry point that keeps every package on one configuration.
 */
import '../packages/stx/test-utils/happy-dom'
