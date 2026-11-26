import { createHash } from 'node:crypto'
import type { ExternalizeHtmlResult } from './build-externalize'

/**
 * Defer a document's classic scripts together, retaining their execution order.
 * Deferring only the runtime breaks inline component setup that depends on it.
 * Extracting setup too lets the parser reach SSR content while scripts download.
 *
 * Run after other asset extraction passes. Write the returned content-addressed
 * assets alongside STX's other assets. Data scripts, modules, templates, async
 * scripts and explicit pre-paint scripts keep their existing semantics. Authored
 * scripts that must execute during parsing opt out with `stx-inline`.
 */
export function deferScripts(html: string, basePath = '/_stx'): ExternalizeHtmlResult {
  const assets: ExternalizeHtmlResult['assets'] = []
  const seen = new Set<string>()
  const templates: [number, number][] = []
  let depth = 0
  let start = 0
  // Runtime source and HTML comments can mention <template> without opening
  // an inert subtree. Consume raw-text elements before counting real tags.
  for (const match of html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->|<\/?template\b[^>]*>/gi)) {
    if (!/^<\/?template\b/i.test(match[0])) continue
    if (match[0].startsWith('</')) {
      if (depth > 0 && --depth === 0) templates.push([start, match.index! + match[0].length])
    }
    else if (depth++ === 0) start = match.index!
  }
  if (depth > 0) templates.push([start, html.length])
  let bytesInlined = 0
  const output = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrs: string, body: string, index: number) => {
    if (templates.some(([start, end]) => index >= start && index < end)) return whole
    if (/(?:^|\s)(?:async|defer|stx-inline)(?:\s|=|$)|\bdata-stx-(?:color-mode-boot|appearance-bootstrap|theme-guard)\b/i.test(attrs)) return whole
    const type = /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs)
    if (type && !['', 'text/javascript', 'application/javascript'].includes((type[1] ?? type[2] ?? type[3] ?? '').toLowerCase().trim())) return whole
    if (/(?:^|\s)src\s*=/i.test(attrs)) return `<script${attrs} defer>${body}</script>`
    if (!body.trim()) return whole
    const filename = `modules.${createHash('sha256').update(body).digest('hex').slice(0, 16)}.js`
    if (!seen.has(filename)) {
      seen.add(filename)
      assets.push({ filename, contents: body, contentType: 'text/javascript; charset=utf-8' })
    }
    bytesInlined += body.length
    return `<script${attrs} defer src="${basePath}/${filename}"></script>`
  })
  return { html: output, assets, bytesInlined }
}
