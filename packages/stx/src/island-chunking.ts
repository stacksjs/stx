/**
 * Per-island production chunking (stacksjs/stx#1746).
 *
 * Islands (`client="visible|idle|interaction|media:…"` components) ship an inert
 * setup script inline:
 *
 *   <script type="stx/island" data-stx-island="SID" data-stx-scoped>IIFE</script>
 *
 * The runtime executes that IIFE on the hydration trigger. Inlining is fine for
 * dev/SSR, but in a production build the bytes ship up front even though they're
 * only needed when (if) the island hydrates. `extractIslandChunks` is the pure,
 * I/O-free core of the chunking step: it lifts each inline IIFE into a
 * content-hashed chunk and rewrites the tag to reference it via `data-stx-src`,
 * with an empty body. The SSG build (the only caller) writes the chunk files and
 * the rewritten HTML; the runtime loads a chunked island via a real
 * `<script src>` on the trigger (CSP-clean — no `eval`/`new Function`).
 *
 * The function is a no-op for HTML with no island tags and for tags that are
 * already chunked (empty body or an existing `data-stx-src`), so it's safe to
 * run unconditionally and idempotently.
 */

/** One extracted island chunk: a content hash and the IIFE it holds. */
export interface IslandChunk {
  /** Content hash of `code` — the chunk's filename stem (`/_stx/islands/<hash>.js`). */
  hash: string
  /** The island setup IIFE (trimmed) to write to the chunk file. */
  code: string
}

export interface ExtractIslandChunksResult {
  /** HTML with each inline island IIFE replaced by a `data-stx-src` reference. */
  html: string
  /** The unique chunks to write (deduped by content hash within the page). */
  chunks: IslandChunk[]
}

// Matches the exact emit shape from utils.ts renderComponentWithSlot:
//   <script type="stx/island" data-stx-island="SID"<attrs>>BODY</script>
// `attrs` captures `data-stx-scoped` (+ any extra scoped-script attrs); `body`
// is the IIFE. The IIFE never contains a literal `</script>` (it would already
// have broken the inline script), so the non-greedy body match is safe.
const ISLAND_SCRIPT_RE = /<script\s+type="stx\/island"\s+data-stx-island="([^"]+)"([^>]*)>([\s\S]*?)<\/script>/g

/**
 * Content hash for a chunk filename. Uses Bun's native Wyhash (fast,
 * deterministic) — non-cryptographic is fine here: the hash only needs to be
 * stable for identical input and distinct for different input to address chunk
 * files; collision risk across a site's handful of islands is negligible.
 */
function hashChunk(code: string): string {
  return Bun.hash(code).toString(16)
}

/**
 * Lift inline island IIFEs into content-hashed chunks. Pure: no filesystem
 * access — the caller writes `result.chunks` and `result.html`.
 */
export function extractIslandChunks(html: string): ExtractIslandChunksResult {
  // Fast path: nothing to do for pages without island components.
  if (!html.includes('type="stx/island"'))
    return { html, chunks: [] }

  const chunksByHash = new Map<string, string>()

  const rewritten = html.replace(ISLAND_SCRIPT_RE, (full, sid: string, attrs: string, body: string) => {
    const code = body.trim()
    // Empty body → already chunked or nothing to extract; leave untouched.
    if (!code)
      return full
    // Already carries a chunk reference → idempotent re-run; don't double-process.
    if (/\bdata-stx-src=/.test(attrs))
      return full

    const hash = hashChunk(code)
    if (!chunksByHash.has(hash))
      chunksByHash.set(hash, code)

    // Preserve type="stx/island" (browser still skips it at parse) and
    // data-stx-island (the runtime's lookup key), insert data-stx-src, keep the
    // original trailing attrs (data-stx-scoped, …), and empty the body.
    return `<script type="stx/island" data-stx-island="${sid}" data-stx-src="/_stx/islands/${hash}.js"${attrs}></script>`
  })

  const chunks: IslandChunk[] = Array.from(chunksByHash, ([hash, code]) => ({ hash, code }))
  return { html: rewritten, chunks }
}
