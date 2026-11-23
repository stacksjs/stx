import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { generateCspHeader } from './csp'
import { collectCspHashes, finalizeCspHashes, hashedCspDirectives } from './csp-hashes'
import type { CspConfig } from './types'

/** Run last: extraction, fingerprinting and HTML minification change hashes. */
export function finalizeStaticCsp(outDir: string, config?: Partial<CspConfig>): void {
  if (!config?.enabled || !config.useHashes || !existsSync(outDir)) return
  const pages = new Map<string, string>()
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const filename = join(dir, entry.name)
      if (entry.isDirectory()) walk(filename)
      else if (entry.isFile() && filename.endsWith('.html')) pages.set(filename, readFileSync(filename, 'utf8'))
    }
  }
  walk(outDir)
  // A document policy cannot be relaxed after an SPA navigation. Every entry
  // page authorizes the site's complete finite set of compiled script bytes.
  const scripts = new Set<string>()
  const styles = new Set<string>()
  for (const html of pages.values()) {
    const hashes = collectCspHashes(html)
    for (const hash of hashes.scripts) scripts.add(hash)
    for (const hash of hashes.styles) styles.add(hash)
  }
  const directives = hashedCspDirectives('', config.directives ?? {})
  directives['script-src'] = [...new Set([...(directives['script-src'] ?? []), ...scripts])]
  if (!directives['style-src']?.includes("'unsafe-inline'")) directives['style-src'] = [...new Set([...(directives['style-src'] ?? []), ...styles])]
  for (const [key, hashes] of [['script-src-elem', scripts], ['style-src-elem', styles]] as const) {
    const extra = (directives as Record<string, unknown>)[key]
    if (Array.isArray(extra) && !(key === 'style-src-elem' && extra.includes("'unsafe-inline'"))) (directives as Record<string, unknown>)[key] = [...new Set([...extra, ...hashes])]
  }
  const manifestPages: Record<string, ReturnType<typeof collectCspHashes>> = {}
  for (const [filename, html] of pages) {
    const final = finalizeCspHashes(html, config, directives)
    writeFileSync(filename, final)
    manifestPages['/' + relative(outDir, filename).replaceAll('\\', '/')] = collectCspHashes(final)
  }
  mkdirSync(join(outDir, '_stx'), { recursive: true })
  writeFileSync(join(outDir, '_stx', 'csp-manifest.json'), JSON.stringify({ version: 1, headerName: config.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', header: generateCspHeader(directives), pages: manifestPages }, null, 2) + '\n')
}
