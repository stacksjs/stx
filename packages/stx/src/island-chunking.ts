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
import { createHash } from 'node:crypto'

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

export interface ExtractIslandChunksOptions {
  /**
   * Stamp `data-stx-integrity="sha384-…"` (Subresource Integrity) on each
   * chunked tag so the runtime can pin the chunk against tampering and a strict
   * CSP can require SRI. Default `false` — only enable when chunks are served
   * byte-for-byte unchanged (no CDN/proxy transform), else the hash won't match
   * and the island silently won't hydrate.
   */
  integrity?: boolean
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
export function extractIslandChunks(html: string, options: ExtractIslandChunksOptions = {}): ExtractIslandChunksResult {
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

    // Optional SRI: a sha384 of the exact chunk bytes the runtime will load.
    const integrityAttr = options.integrity
      ? ` data-stx-integrity="sha384-${createHash('sha384').update(code).digest('base64')}"`
      : ''

    // Preserve type="stx/island" (browser still skips it at parse) and
    // data-stx-island (the runtime's lookup key), insert data-stx-src (+ optional
    // integrity), keep the original trailing attrs (data-stx-scoped, …), empty body.
    return `<script type="stx/island" data-stx-island="${sid}" data-stx-src="/_stx/islands/${hash}.js"${integrityAttr}${attrs}></script>`
  })

  const chunks: IslandChunk[] = Array.from(chunksByHash, ([hash, code]) => ({ hash, code }))
  return { html: rewritten, chunks }
}

// Triggers whose island is likely to hydrate, so warming its chunk pays off.
// `interaction` / `media:` may never fire, so we don't fetch their chunks early.
const PREFETCH_TRIGGERS = new Set(['visible', 'idle'])

/**
 * Warm the chunks of islands likely to hydrate soon (`visible` / `idle`
 * triggers) with `<link rel="prefetch" as="script">` in the document head, so
 * the chunk is already cached when the trigger fires — instant hydration with no
 * inline JS. Pure and idempotent; operates on already-chunked HTML (it reads the
 * `data-stx-src` the emitter added) and is a no-op when there's no `<head>`, no
 * chunked island, or no island with an eligible trigger.
 *
 * `prefetch` (not `preload`) is deliberate: it's low-priority/idle, so it never
 * competes with the critical render path, and it avoids the "preloaded resource
 * not used within N seconds" console warning for below-the-fold islands.
 */
export function injectIslandChunkPrefetch(html: string): string {
  if (!html.includes('data-stx-src='))
    return html

  // Host scope id → hydration trigger. utils.ts emits `data-stx-scope` before
  // `stx-hydrate` on the same element; a `>` inside a serialized prop value
  // would stop the match early, in which case the island is simply not
  // prefetched (safe degradation, never breakage).
  const triggerBySid = new Map<string, string>()
  const hostRe = /data-stx-scope="([^"]+)"[^>]*?stx-hydrate="([^"]+)"/g
  let h: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((h = hostRe.exec(html)) !== null)
    triggerBySid.set(h[1], h[2])

  // Chunked island tag: scope id → chunk url. Keep only eligible triggers.
  const urls = new Set<string>()
  const tagRe = /data-stx-island="([^"]+)"[^>]*?data-stx-src="([^"]+)"/g
  let t: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((t = tagRe.exec(html)) !== null) {
    if (PREFETCH_TRIGGERS.has(triggerBySid.get(t[1]) || ''))
      urls.add(t[2])
  }

  const headEnd = html.lastIndexOf('</head>')
  if (urls.size === 0 || headEnd === -1)
    return html

  const links = Array.from(urls)
    // Idempotent: don't add a prefetch link that's already present.
    .filter(url => !html.includes(`rel="prefetch" href="${url}"`))
    .map(url => `<link rel="prefetch" href="${url}" as="script">`)
    .join('')
  if (!links)
    return html

  return html.slice(0, headEnd) + links + html.slice(headEnd)
}
