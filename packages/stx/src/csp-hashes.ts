import { createHash } from 'node:crypto'
import { parseAttributes } from './component-processing'
import { addNonceToInlineContent, generateCspHeader, generateCspMetaTag } from './csp'
import { scanHtmlScriptElements, scanHtmlTags } from './html-masking'
import type { CspConfig, CspDirectives } from './types'

/** Hash the text the HTML parser sees, including its newline normalization. */
function hash(text: string): string {
  return `'sha256-${createHash('sha256').update(text.replace(/\r\n?/g, '\n').replace(/\0/g, '\uFFFD')).digest('base64')}'`
}

export function collectCspHashes(html: string): { scripts: string[], styles: string[] } {
  const scripts = new Set<string>()
  const styles = new Set<string>()
  for (const script of scanHtmlScriptElements(html)) {
    const attrs = Object.fromEntries(parseAttributes(script.attrs).map(attr => [attr.name.toLowerCase(), attr.value]))
    const type = typeof attrs.type === 'string' ? attrs.type.toLowerCase().trim() : ''
    if (!('src' in attrs) && ['', 'module', 'text/javascript', 'application/javascript'].includes(type)) scripts.add(hash(html.slice(script.bodyStart, script.bodyEnd)))
  }
  const tags = scanHtmlTags(html)
  for (let i = 0; i < tags.length - 1; i++) {
    if (tags[i].name.toLowerCase() === 'style' && !tags[i].closing && tags[i + 1].closing) styles.add(hash(html.slice(tags[i].end, tags[i + 1].start)))
  }
  return { scripts: [...scripts], styles: [...styles] }
}

/** Retain the caller's source policy; add hashes without permitting eval. */
export function hashedCspDirectives(html: string, directives: CspDirectives): CspDirectives {
  const { scripts, styles } = collectCspHashes(html)
  const result = { ...directives }
  const add = (key: 'script-src' | 'style-src', hashes: string[]): void => {
    const sources = result[key] ?? result['default-src'] ?? []
    // CSP ignores unsafe-inline when hashes are present. Do not accidentally
    // revoke a caller's explicit permission for runtime-generated styles.
    if (key === 'style-src' && sources.includes("'unsafe-inline'")) return
    result[key] = [...new Set([...sources.filter(source => source !== "'none'"), ...hashes])]
  }
  add('script-src', scripts)
  add('style-src', styles)
  // When element-specific directives exist, they override their base source.
  for (const [key, hashes] of [['script-src-elem', scripts], ['style-src-elem', styles]] as const) {
    const sources = (result as Record<string, unknown>)[key]
    if (Array.isArray(sources) && !(key === 'style-src-elem' && sources.includes("'unsafe-inline'"))) (result as Record<string, unknown>)[key] = [...new Set([...sources.filter(source => source !== "'none'"), ...hashes])]
  }
  return result
}

export function finalizeCspHashes(html: string, config: Partial<CspConfig>, shared?: CspDirectives): string {
  if (!config.enabled || !config.useHashes) return html
  if (config.useNonce) throw new Error('CSP useHashes and useNonce are mutually exclusive')
  const placeholder = '<!--stx:csp-hashes-->'
  let hasDirective = html.includes(placeholder)
  for (const tag of scanHtmlTags(html).reverse()) {
    if (tag.name.toLowerCase() === 'meta' && parseAttributes(tag.attributes).some(attr => attr.name === 'data-stx-csp-policy')) {
      hasDirective = true
      html = html.slice(0, tag.start) + html.slice(tag.end)
    }
  }
  html = html.replaceAll(placeholder, '')
  if ((!config.addMetaTag && !hasDirective) || config.reportOnly) return html
  const meta = generateCspMetaTag(shared ?? hashedCspDirectives(html, config.directives ?? {})).replace('<meta ', '<meta data-stx-csp-policy ')
  const head = /<head\b[^>]*>/i.exec(html)
  if (!head) return html
  const charset = /^\s*<meta\b[^>]*\bcharset\s*=[^>]*>/i.exec(html.slice(head.index + head[0].length))
  const at = head.index + head[0].length + (charset?.[0].length ?? 0)
  return html.slice(0, at) + meta + html.slice(at)
}

export function hashedCspHeader(html: string, config: Partial<CspConfig>): string {
  return generateCspHeader(hashedCspDirectives(html, config.directives ?? {}))
}

/** Reconcile compiler authorization after a server adds router/asset scripts. */
export function finalizeCspDocument(html: string, config?: Partial<CspConfig>): string {
  if (!config?.enabled) return html
  if (config.useNonce) {
    const scripts = scanHtmlScriptElements(html).map(script => Object.fromEntries(parseAttributes(script.attrs).map(attr => [attr.name, attr.value])))
    const owned = scripts.find(attrs => 'data-stx-csp' in attrs && typeof attrs.nonce === 'string')
      ?? scripts.find(attrs => 'data-stx-runtime' in attrs && typeof attrs.nonce === 'string')
    if (typeof owned?.nonce === 'string') html = addNonceToInlineContent(html, owned.nonce)
  }
  return finalizeCspHashes(html, config)
}
