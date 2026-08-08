/**
 * Lift shared inline blobs out of built HTML into content-hashed assets.
 *
 * The static build inlines the whole signals runtime and the whole generated
 * stylesheet into every page. On a 35-page site that is ~118KB of
 * byte-identical runtime per page and a separate copy of the reset in each one,
 * none of it cacheable across a navigation, and `find dist -name '*.js'`
 * returns nothing at all (stacksjs/stx#1865, #1878).
 *
 * Done as a post-pass over the emitted HTML rather than by threading
 * `buildMode` through the renderer, deliberately. The existing `compile` branch
 * emits `/__stx/runtime.__STX_HASH__.js`, a placeholder only the production
 * builder knows how to rewrite, and setting that mode also suppresses the
 * document shell — so reusing it on the SSG path produces pages that reference
 * a 404 and lose their `<html>` wrapper. A post-pass needs neither.
 *
 * Content-addressed, so identical blobs across pages collapse to one file: the
 * runtime is byte-identical everywhere and becomes a single asset, while
 * per-page CSS dedupes only where pages genuinely share a stylesheet.
 *
 * The rewrite itself is `externalizeHtml`, which touches no filesystem. SSR has
 * the same problem in a worse form — a static build inlines the runtime once
 * per page, a server inlines it once per *request* — and it cannot use a
 * post-pass over a directory because there are no files. Sharing the pure
 * function means the two paths cannot drift into rewriting HTML differently.
 *
 * @module build-externalize
 */

import fs from 'node:fs'
import path from 'node:path'

/** Where externalized assets are written, relative to the output directory. */
export const EXTERNALIZED_ASSET_DIR = '_stx'

export interface ExternalizeResult {
  /** HTML files rewritten. */
  pages: number
  /** Distinct asset files written. */
  assets: number
  /** Bytes removed from HTML (before any compression). */
  bytesInlined: number
}

/** Short, stable content hash — same scheme the serve path uses for CSS. */
function contentHash(source: string): string {
  return Bun.hash(source).toString(16).slice(0, 8)
}

function listHtmlFiles(dir: string): string[] {
  const found: string[] = []
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory())
        walk(full)
      else if (entry.isFile() && full.endsWith('.html'))
        found.push(full)
    }
  }
  if (fs.existsSync(dir))
    walk(dir)
  return found
}

/** A blob lifted out of the HTML, ready to be written or served. */
export interface ExternalizedAsset {
  /** Content-addressed filename, e.g. `runtime.1a2b3c4d.js`. */
  filename: string
  contents: string
  /** MIME type, so a server can respond without re-deriving it from the name. */
  contentType: string
}

export interface ExternalizeHtmlResult {
  html: string
  /** Distinct assets this page referenced. Deduped within the page. */
  assets: ExternalizedAsset[]
  /** Bytes removed from the HTML, before any compression. */
  bytesInlined: number
}

interface BlobKind {
  /** Matches the whole tag, capturing attributes then body. */
  pattern: RegExp
  prefix: string
  extension: string
  contentType: string
  replace: (href: string) => string
}

const BLOB_KINDS: BlobKind[] = [
  {
    // Matching the opening tag by attribute and taking everything to the first
    // closing tag is safe because script bodies are emitted with their own
    // closing tag escaped (script-emit.ts asserts it).
    pattern: /<script\b([^>]*\bdata-stx-runtime\b[^>]*)>([\s\S]*?)<\/script>/gi,
    prefix: 'runtime',
    extension: 'js',
    contentType: 'text/javascript; charset=utf-8',
    replace: href => `<script data-stx-runtime src="${href}"></script>`,
  },
  {
    // The router ships on EVERY page — including pages with no client script at
    // all, where it is the only large blob present.
    pattern: /<script\b([^>]*\bdata-stx-router\b[^>]*)>([\s\S]*?)<\/script>/gi,
    prefix: 'router',
    extension: 'js',
    contentType: 'text/javascript; charset=utf-8',
    replace: href => `<script data-stx-router src="${href}"></script>`,
  },
  {
    pattern: /<style\b([^>]*\bdata-crosswind=(?:"generated"|'generated')[^>]*)>([\s\S]*?)<\/style>/gi,
    prefix: 'crosswind',
    extension: 'css',
    contentType: 'text/css; charset=utf-8',
    replace: href => `<link data-crosswind="generated" rel="stylesheet" href="${href}">`,
  },
]

/**
 * Lift the shared blobs out of one HTML document.
 *
 * Pure: returns the rewritten HTML and the assets it extracted, and writes
 * nothing. Callers decide whether those assets become files on disk or entries
 * in a server's cache.
 *
 * Safe to run twice — a tag that is already a `src`/`href` reference has no
 * inline body to match, so a second pass extracts nothing and returns the input
 * unchanged.
 */
export function externalizeHtml(html: string, basePath: string = `/${EXTERNALIZED_ASSET_DIR}`): ExternalizeHtmlResult {
  const assets: ExternalizedAsset[] = []
  const seen = new Set<string>()
  let bytesInlined = 0
  let out = html

  for (const kind of BLOB_KINDS) {
    out = out.replace(kind.pattern, (whole, attrs: string, body: string) => {
      // An already-external tag, or an empty one that is not worth a request.
      if (/\b(?:src|href)\s*=/.test(attrs) || !body.trim())
        return whole

      const filename = `${kind.prefix}.${contentHash(body)}.${kind.extension}`
      if (!seen.has(filename)) {
        seen.add(filename)
        assets.push({ filename, contents: body, contentType: kind.contentType })
      }
      bytesInlined += body.length
      return kind.replace(`${basePath}/${filename}`)
    })
  }

  return { html: out, assets, bytesInlined }
}

/**
 * Rewrite every HTML file under `outDir`, moving the signals runtime and the
 * generated stylesheet into `_stx/` and linking to them.
 *
 * Safe to run twice: a page whose runtime is already a `src=` reference has no
 * inline body to match, so a second pass is a no-op.
 */
export function externalizeSharedAssets(outDir: string): ExternalizeResult {
  const result: ExternalizeResult = { pages: 0, assets: 0, bytesInlined: 0 }
  const assetDir = path.join(outDir, EXTERNALIZED_ASSET_DIR)
  const written = new Set<string>()

  for (const file of listHtmlFiles(outDir)) {
    const original = fs.readFileSync(file, 'utf8')
    const { html, assets, bytesInlined } = externalizeHtml(original)

    if (html === original)
      continue

    for (const asset of assets) {
      // Content-addressed, so the same blob on a second page is the same file
      // and writing it again would be pure work.
      if (written.has(asset.filename))
        continue
      written.add(asset.filename)
      fs.mkdirSync(assetDir, { recursive: true })
      fs.writeFileSync(path.join(assetDir, asset.filename), asset.contents)
      result.assets++
    }

    fs.writeFileSync(file, html)
    result.bytesInlined += bytesInlined
    result.pages++
  }

  return result
}
