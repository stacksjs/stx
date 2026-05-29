/**
 * DOM-runtime shim for driving the signals runtime in tests.
 *
 * The canonical implementation now lives in the public testing surface
 * (`src/testing.ts`, exported as `stx/testing`) so adopters can use it too —
 * see stacksjs/stx#1741. This file re-exports it for the framework's own
 * tests, which import from `../../test-utils/dom-runtime-shim`.
 */
export { flushEffects, installNodeConstants, setupStxTestDom, shimAttributes } from '../src/testing'
