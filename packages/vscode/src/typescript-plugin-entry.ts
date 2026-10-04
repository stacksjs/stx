/**
 * The entry tsserver loads. It `require()`s a plugin and calls what it gets
 * back, without unwrapping `default`: a bundle of `export default init` hands
 * it `{ default: init }`, which it skips as "did not expose a proper factory
 * function". build.ts bundles this file, so `module.exports` is the factory.
 */
import init from './typescript-stx-plugin'

module.exports = init
