# Client runtime fragments

This directory contains the source fragments assembled by `../signals.ts` into the STX browser/native signals runtime.

Use the owning `signals-*-runtime.ts` module for runtime changes instead of adding implementation code back to `signals.ts`. Keep `signals.ts` limited to imports, runtime assembly, production log stripping/minification, and its public generator exports.

When moving code between fragments:

1. Preserve the emitted development runtime byte-for-byte when the change is refactor-only.
2. Verify the production runtime independently because minification and console stripping are separate assembly steps.
3. Add or update a `*-runtime-boundary.test.ts` test under `packages/stx/test/signals/`.
4. Run the signals, reactivity, devtools, browser, native, SPA, component, and lifecycle coverage appropriate to the boundary.

The grouped ownership map and dependency rules live in [Signals Runtime Architecture](../../../../docs/advanced/signals-runtime-architecture.md).

