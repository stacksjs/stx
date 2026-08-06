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

  const writeAsset = (filename: string, contents: string): void => {
    if (written.has(filename))
      return
    written.add(filename)
    fs.mkdirSync(assetDir, { recursive: true })
    fs.writeFileSync(path.join(assetDir, filename), contents)
    result.assets++
  }

  for (const file of listHtmlFiles(outDir)) {
    const original = fs.readFileSync(file, 'utf8')
    let html = original

    // The runtime. Matching the opening tag by attribute and taking everything
    // to the first closing tag is safe because script bodies are emitted with
    // their own closing tag escaped (script-emit.ts asserts it).
    html = html.replace(
      /<script\b([^>]*\bdata-stx-runtime\b[^>]*)>([\s\S]*?)<\/script>/gi,
      (whole, attrs: string, body: string) => {
        if (/\bsrc\s*=/.test(attrs) || !body.trim())
          return whole
        const filename = `runtime.${contentHash(body)}.js`
        writeAsset(filename, body)
        result.bytesInlined += body.length
        return `<script data-stx-runtime src="/${EXTERNALIZED_ASSET_DIR}/${filename}"></script>`
      },
    )

    // The router, which ships on EVERY page — including pages with no client
    // script at all, where it is the only large blob present.
    html = html.replace(
      /<script\b([^>]*\bdata-stx-router\b[^>]*)>([\s\S]*?)<\/script>/gi,
      (whole, attrs: string, body: string) => {
        if (/\bsrc\s*=/.test(attrs) || !body.trim())
          return whole
        const filename = `router.${contentHash(body)}.js`
        writeAsset(filename, body)
        result.bytesInlined += body.length
        return `<script data-stx-router src="/${EXTERNALIZED_ASSET_DIR}/${filename}"></script>`
      },
    )

    // The generated stylesheet.
    html = html.replace(
      /<style\b([^>]*\bdata-crosswind=(?:"generated"|'generated')[^>]*)>([\s\S]*?)<\/style>/gi,
      (whole, _attrs: string, css: string) => {
        if (!css.trim())
          return whole
        const filename = `crosswind.${contentHash(css)}.css`
        writeAsset(filename, css)
        result.bytesInlined += css.length
        return `<link data-crosswind="generated" rel="stylesheet" href="/${EXTERNALIZED_ASSET_DIR}/${filename}">`
      },
    )

    if (html !== original) {
      fs.writeFileSync(file, html)
      result.pages++
    }
  }

  return result
}
