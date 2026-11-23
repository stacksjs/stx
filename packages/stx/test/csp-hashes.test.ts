import { describe, expect, it } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { collectCspHashes, finalizeCspHashes, hashedCspHeader } from '../src/csp-hashes'
import { finalizeStaticCsp } from '../src/csp-build'
import { addNonceToInlineContent } from '../src/csp'

const config = { enabled: true, precompile: true, useHashes: true, addMetaTag: true, directives: { 'default-src': ["'self'"], 'script-src': ["'self'"] } }
const sha = (text: string) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`

describe('CSP hashes and static artifacts', () => {
  it('adds nonces only to real elements, without rewriting script bodies, comments or attributes', () => {
    const body = `const markup = '<script title="x">text<\\/script>'; const css = '<style>text</style>'`
    const html = `<!--<script>comment</script>--><p title='<script>attribute</script>'>text</p><script>${body}</script><style>b{color:red}</style><script src="/external.js"></script>`
    const output = addNonceToInlineContent(html, 'safe')
    expect(output).toContain(`<script nonce="safe">${body}</script>`)
    expect(output).toContain('<style nonce="safe">b{color:red}</style>')
    expect(output).toContain(`title='<script>attribute</script>'`)
    expect(output).toContain('<!--<script>comment</script>-->')
    expect(output).toContain('<script src="/external.js"></script>')
    expect(addNonceToInlineContent(output, 'other')).toBe(output)
  })
  it('uses SHA-256 over parser-normalized exact bytes, deduplicating executable scripts and styles', () => {
    const html = `<!--<script>fake</script>--><p title="<script>fake</script>">safe</p><script>one\r\ntwo\rthree</script><script>one\ntwo\nthree</script><script src="/external.js"></script><script type="application/json">{"x":1}</script><script type="stx/island">inert</script><script type="module">export {}</script><style>p{color:red}</style>`
    expect(collectCspHashes(html)).toEqual({ scripts: [sha('one\ntwo\nthree'), sha('export {}')], styles: [sha('p{color:red}')] })
  })
  it('does not authorize eval or alter an authored policy, and keeps its own meta before scripts', () => {
    const source = `<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="object-src 'none'"><script>window.test=1</script></head></html>`
    const html = finalizeCspHashes(source, config)
    expect(html).toContain(`content="object-src 'none'"`)
    expect(html.indexOf('data-stx-csp-policy')).toBeLessThan(html.indexOf('<script>'))
    expect(finalizeCspHashes(html, config)).toBe(html)
    expect(hashedCspHeader(html, config)).not.toContain('unsafe-eval')
    expect(() => finalizeCspHashes(html, { ...config, useNonce: true })).toThrow('mutually exclusive')
  })
  it('emits one site-wide policy and a manifest using final artifacts, so navigation cannot outgrow the initial policy', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-csp-build-'))
    try {
      writeFileSync(join(dir, 'index.html'), '<html><head></head><body><script>one()</script></body></html>')
      writeFileSync(join(dir, 'next.html'), '<html><head></head><body><script>two()</script><style>b{color:red}</style></body></html>')
      finalizeStaticCsp(dir, config)
      const manifest = JSON.parse(readFileSync(join(dir, '_stx/csp-manifest.json'), 'utf8'))
      expect(manifest.header).toContain(sha('one()'))
      expect(manifest.header).toContain(sha('two()'))
      expect(manifest.header).not.toMatch(/unsafe-eval|nonce-/)
      for (const page of ['index.html', 'next.html']) {
        const html = readFileSync(join(dir, page), 'utf8')
        expect(html).toContain(sha('one()'))
        expect(html).toContain(sha('two()'))
        expect(manifest.pages['/' + page]).toEqual(collectCspHashes(html))
      }
      const first = readFileSync(join(dir, '_stx/csp-manifest.json'), 'utf8')
      finalizeStaticCsp(dir, config)
      expect(readFileSync(join(dir, '_stx/csp-manifest.json'), 'utf8')).toBe(first)
    }
    finally { rmSync(dir, { recursive: true, force: true }) }
  })
})
