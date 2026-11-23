import { registerServeModuleBundle } from './caching'
import { deferScripts } from './build-defer-scripts'
import { extractIslandChunks, injectIslandChunkPrefetch } from './island-chunking'
import { lazyIslandRuntime } from './lazy-island-runtime'

/** Use the native immutable asset registry for SSR hydration and island code. */
export function prepareServePageAssets(html: string): string {
  const islands = extractIslandChunks(html, { minify: true })
  let output = islands.html
  for (const chunk of islands.chunks)
    output = output.replaceAll(`/_stx/islands/${chunk.hash}.js`, registerServeModuleBundle(chunk.code))
  const deferred = deferScripts(output)
  output = deferred.html
  for (const asset of deferred.assets)
    output = output.replaceAll(`/_stx/${asset.filename}`, registerServeModuleBundle(asset.contents))
  return injectIslandChunkPrefetch(output)
}

/**
 * Let an island-only document wait for its first island before it loads the
 * runtime (see {@link lazyIslandRuntime}). Inline bundles the loader has to
 * fetch by URL join the same immutable asset registry. A document that needs
 * the runtime at once comes back unchanged.
 */
export function prepareLazyIslandRuntime(html: string): string {
  const lazy = lazyIslandRuntime(html)
  if (!lazy.applied) return html
  let output = lazy.html
  for (const asset of lazy.assets)
    output = output.replaceAll(`/_stx/${asset.filename}`, registerServeModuleBundle(asset.contents))
  // An island's setup is as unused before its trigger as the runtime is:
  // serve it as a cached file the runtime fetches then, not as inline text
  // every visitor downloads with the page.
  const islands = extractIslandChunks(output, { minify: true })
  output = islands.html
  for (const chunk of islands.chunks)
    output = output.replaceAll(`/_stx/islands/${chunk.hash}.js`, registerServeModuleBundle(chunk.code))
  return output
}
