/**
 * Lift inline blobs that repeat across pages, whatever they are.
 *
 * `build-externalize` handles the three blobs stx knows by name — the signals
 * runtime, the router, and the generated stylesheet. Everything else it emits
 * inline stays inline, and on a real multi-page site that is where the bytes
 * actually are: the ts-cloud dashboard ships 54 pages at 12.5MB, of which
 * 10.3MB is byte-identical `<script data-stx-scoped>` and unattributed
 * `<style>` blocks repeated page after page. None of it is cacheable across a
 * navigation, and it is 4x the size of the three named blobs combined.
 *
 * The rule here needs no allowlist: a blob that appears byte-for-byte on two
 * or more pages is shared by construction, so hoisting it into one
 * content-addressed file is a pure win — every page that referenced it now
 * downloads it once for the whole site instead of once per page. A blob that
 * appears on exactly one page is left alone, because turning it into a second
 * request would make that page slower, not smaller.
 *
 * Requires the whole output directory, which is why it is a separate pass from
 * the pure per-document `externalizeHtml`: "does this appear elsewhere" is not
 * a question one document can answer, and SSR (which shares that function) has
 * no elsewhere to look at.
 *
 * @module build-externalize-repeated
 */

import fs from 'node:fs'
import path from 'node:path'
import { EXTERNALIZED_ASSET_DIR, type ExternalizedAsset, type ExternalizeResult } from './build-externalize'

/**
 * Smallest blob worth its own request.
 *
 * Below this an extra round trip costs more than the bytes it saves, even
 * repeated across every page of the site.
 */
const MIN_BLOB_BYTES = 1024

/** Matches an inline `<script>` or `<style>` with its attributes and body. */
const INLINE_BLOB = /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi

/**
 * `type` values that are really JavaScript.
 *
 * A `<script type="application/ld+json">` is structured data, not code: giving
 * it a `src` would stop search engines reading it, since they parse the
 * document, not its subresources. Same for import maps and speculation rules,
 * which the browser only honours inline. Anything not on this list stays put.
 */
const JS_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript', 'module/javascript'])

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

function attrValue(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  if (!match)
    return undefined
  return match[2] ?? match[3] ?? match[4] ?? ''
}

/**
 * Whether this tag may be replaced by a reference to an external file.
 *
 * Conservative on purpose: the pass runs over every page of every stx build,
 * so a wrong "yes" here is a silently broken site, while a wrong "no" only
 * leaves bytes on the table.
 */
function isExternalizable(tag: string, attrs: string, body: string): boolean {
  // Critical CSS and preferences must remain available before the first paint.
  if (/(?:^|\s)stx-inline(?:\s|=|$)|\bdata-stx-(?:color-mode-boot|appearance-bootstrap|theme-guard)\b/i.test(attrs))
    return false
  if (body.length < MIN_BLOB_BYTES)
    return false

  // Already a reference, so there is no inline body to lift.
  if (/\b(?:src|href)\s*=/i.test(attrs))
    return false

  if (tag.toLowerCase() === 'script') {
    if (!JS_TYPES.has((attrValue(attrs, 'type') ?? '').trim().toLowerCase()))
      return false

    // A closing tag inside a string literal is written `<\/script>` by the
    // emitter; anything else that contains the sequence would have terminated
    // the tag early and the body we captured would be a fragment.
    return true
  }

  // `<style>` inside `<template>` or a web component's shadow markup is part
  // of that subtree, not the document, and a `<link>` in its place would apply
  // to the whole page instead. Those never repeat across pages anyway.
  return true
}

/** Ranges of the document covered by `<template>` elements. */
function templateRanges(html: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  for (const match of html.matchAll(/<template\b[^>]*>[\s\S]*?<\/template>/gi))
    ranges.push([match.index, match.index + match[0].length])
  return ranges
}

interface Occurrence {
  file: string
  /** Whole matched tag, used as the literal to replace. */
  whole: string
  tag: string
  attrs: string
  body: string
}

/**
 * Hoist every inline script/style body that appears on more than one page.
 *
 * Runs after {@link externalizeSharedAssets}, over the same directory, and is
 * equally safe to run twice: the second pass sees `src`/`href` references with
 * no inline body and matches nothing.
 */
export function externalizeRepeatedAssets(outDir: string): ExternalizeResult {
  const result: ExternalizeResult = { pages: 0, assets: 0, bytesInlined: 0 }
  const files = listHtmlFiles(outDir)
  if (files.length < 2)
    return result

  const sources = new Map<string, string>()
  const occurrences = new Map<string, Occurrence[]>()

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8')
    sources.set(file, html)
    const templates = templateRanges(html)

    for (const match of html.matchAll(INLINE_BLOB)) {
      const [whole, tag, attrs, body] = match
      if (!isExternalizable(tag, attrs, body))
        continue
      if (templates.some(([start, end]) => match.index >= start && match.index < end))
        continue

      const key = `${tag.toLowerCase()}\u0000${body}`
      const list = occurrences.get(key)
      if (list)
        list.push({ file, whole, tag, attrs, body })
      else
        occurrences.set(key, [{ file, whole, tag, attrs, body }])
    }
  }

  // Only blobs on two or more distinct pages. A blob repeated twice within one
  // page is already one download.
  const shared = [...occurrences.values()].filter(list => new Set(list.map(o => o.file)).size > 1)
  if (shared.length === 0)
    return result

  const assetDir = path.join(outDir, EXTERNALIZED_ASSET_DIR)
  const rewrites = new Map<string, string>(sources)
  const bytesPerFile = new Map<string, number>()
  const assets: ExternalizedAsset[] = []

  for (const list of shared) {
    const { tag, body } = list[0]
    const isScript = tag.toLowerCase() === 'script'
    const filename = `${isScript ? 'chunk' : 'style'}.${contentHash(body)}.${isScript ? 'js' : 'css'}`
    assets.push({
      filename,
      contents: body,
      contentType: isScript ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8',
    })

    const href = `/${EXTERNALIZED_ASSET_DIR}/${filename}`
    for (const occurrence of list) {
      // Attributes are carried over verbatim: `type="module"`, `defer`, and
      // stx's own `data-*` markers all change how the tag behaves, and a
      // reference that drops them is not the same tag.
      const replacement = isScript
        ? `<script${occurrence.attrs} src="${href}"></script>`
        : `<link${occurrence.attrs} rel="stylesheet" href="${href}">`

      // Function form, not a string: attributes can contain `$`, and a string
      // replacement would read `$&` and friends as substitution patterns.
      const current = rewrites.get(occurrence.file)!
      const next = current.replace(occurrence.whole, () => replacement)
      if (next === current)
        continue
      rewrites.set(occurrence.file, next)
      bytesPerFile.set(occurrence.file, (bytesPerFile.get(occurrence.file) ?? 0) + occurrence.body.length)
    }
  }

  fs.mkdirSync(assetDir, { recursive: true })
  for (const asset of assets) {
    fs.writeFileSync(path.join(assetDir, asset.filename), asset.contents)
    result.assets++
  }

  for (const [file, html] of rewrites) {
    if (html === sources.get(file))
      continue
    fs.writeFileSync(file, html)
    result.pages++
    result.bytesInlined += bytesPerFile.get(file) ?? 0
  }

  return result
}
