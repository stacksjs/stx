/**
 * The prelude of a native bundle: the runtime, installed once before any
 * screen script runs, so a script's top level can already call `craft.*`.
 * `bundle.ts` puts the route options on `globalThis` just before this.
 */
import { installRuntime } from './screen'

const g = globalThis as any // eslint-disable-line ts/no-explicit-any
g.__stxNative = installRuntime(g.__stxNativeRuntimeOptions || {})
