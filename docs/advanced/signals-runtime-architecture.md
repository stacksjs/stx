# Signals Runtime Architecture

The browser and native signals runtime is assembled by `packages/stx/src/signals.ts` from focused fragments in `packages/stx/src/client/`. `signals.ts` owns the public development and production generators; runtime behavior belongs to the fragment that owns that behavior.

The generated development and production strings are compatibility contracts. A refactor should compare their length and SHA-256 output before and after the change, then run the browser, native, SPA, lifecycle, and reactivity suites. Boundary tests under `packages/stx/test/signals/*-runtime-boundary.test.ts` pin each extracted seam.

## Module map

| Area | Modules |
|---|---|
| Assembly and bootstrap | `signals-bootstrap-runtime.ts`, `signals-reactive-core-bootstrap-runtime.ts`, `signals-globals-runtime.ts`, `signals-dom-ready-runtime.ts`, `signals-public-api-runtime.ts` |
| Reactive core | `signals-state-runtime.ts`, `signals-effect-runtime.ts`, `signals-proxy-runtime.ts`, `signals-lifecycle-runtime.ts`, `signals-reactive-runtime.ts` |
| Expressions and handlers | `signals-expression-compiler-runtime.ts`, `signals-expression-runtime.ts`, `signals-pipe-runtime.ts`, `signals-handler-runtime.ts`, `signals-event-shorthand-runtime.ts` |
| Element and attribute bindings | `signals-process-element-runtime.ts`, `signals-binding-utils-runtime.ts`, `signals-class-runtime.ts`, `signals-style-runtime.ts`, `signals-model-runtime.ts`, `signals-show-runtime.ts`, `signals-ref-runtime.ts` |
| Structural directives | `signals-for-runtime.ts`, `signals-loop-row-runtime.ts`, `signals-loop-conditional-runtime.ts`, `signals-if-runtime.ts`, `signals-if-chain-runtime.ts`, `signals-conditional-chain-runtime.ts`, `signals-suspense-runtime.ts`, `signals-transition-group-runtime.ts` |
| Components and scopes | `signals-component-api-runtime.ts`, `signals-component-props-runtime.ts`, `signals-component-hydration-runtime.ts`, `signals-conditional-component-runtime.ts`, `signals-loop-component-remap-runtime.ts`, `signals-context-runtime.ts`, `signals-mount-runtime.ts` |
| Hydration and SPA lifecycle | `signals-hydration-runtime.ts`, `signals-lazy-hydration-runtime.ts`, `signals-manifest-hydration-runtime.ts`, `signals-hydration-audit-runtime.ts`, `signals-scope-disposal-runtime.ts`, `signals-scope-traversal-runtime.ts`, `signals-container-cleanup-runtime.ts`, `signals-spa-load-control-runtime.ts`, `signals-spa-load-runtime.ts` |
| Data, storage, and stores | `signals-fetch-transport-runtime.ts`, `signals-fetch-runtime.ts`, `signals-query-runtime.ts`, `signals-optimistic-runtime.ts`, `signals-storage-runtime.ts`, `signals-cookie-runtime.ts`, `signals-kept-runtime.ts`, `signals-store-registry-runtime.ts` |
| Browser and UI integrations | `signals-navigation-runtime.ts`, `signals-websocket-runtime.ts`, `signals-head-runtime.ts`, `signals-appearance-runtime.ts`, `signals-timer-runtime.ts`, `signals-toast-runtime.ts`, `signals-overlay-runtime.ts`, `signals-dialog-runtime.ts`, `signals-drawer-runtime.ts`, `signals-tooltip-runtime.ts` |
| Host and tooling | `signals-host-runtime.ts`, `signals-authoring-runtime.ts`, `signals-devtools-runtime.ts`, `signals-helpers-runtime.ts` |

## Dependency rules

- Fragments emit source text; they do not create a second reactive implementation.
- Composition helpers accept generated fragments or serialized helper functions as arguments instead of importing runtime state.
- Runtime declaration order remains explicit in `generateSignalsRuntimeDev()` because later fragments depend on names declared by earlier fragments.
- Keep browser and native behavior behind the shared host adapter rather than branching the reactive implementation.
- Never add an unescaped backtick inside a runtime template literal, including comments.

