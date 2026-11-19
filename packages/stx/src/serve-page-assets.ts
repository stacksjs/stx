import { registerServeModuleBundle } from './caching'
import { deferScripts } from './build-defer-scripts'
import { extractIslandChunks, injectIslandChunkPrefetch } from './island-chunking'

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
