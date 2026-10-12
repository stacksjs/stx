import { describe, expect, it } from 'bun:test'
import { installJSCGlobals } from '../../src/native/runtime/jsc-globals'

/**
 * `TextEncoder` and `TextDecoder` on a native screen, where JavaScriptCore
 * has neither: code shared with a page hashes a sign-in's nonce with
 * `new TextEncoder().encode(...)`.
 */
function codecs() {
  const scope: Record<string, any> = {}
  installJSCGlobals(scope)
  return { encoder: new scope.TextEncoder(), decoder: new scope.TextDecoder() }
}

describe('text codecs on a native screen', () => {
  it('encodes UTF-8 as a browser does, including characters outside the BMP', () => {
    const { encoder } = codecs()
    for (const text of ['', 'abc', 'Grüße', 'café ☕', 'run 🏃 → 🏁', 'Привет'])
      expect(Array.from(encoder.encode(text))).toEqual(Array.from(new TextEncoder().encode(text)))
  })

  it('writes a lone surrogate as U+FFFD, as the web does', () => {
    const { encoder } = codecs()
    expect(Array.from(encoder.encode('a\uD800b'))).toEqual(Array.from(new TextEncoder().encode('a\uD800b')))
  })

  it('decodes what it encodes, and a broken sequence as U+FFFD', () => {
    const { encoder, decoder } = codecs()
    for (const text of ['Grüße', 'run 🏃 → 🏁', ''])
      expect(decoder.decode(encoder.encode(text))).toBe(text)
    expect(decoder.decode(new Uint8Array([0x61, 0xE2, 0x82]))).toBe('a��')
    expect(decoder.decode(new Uint8Array([0x61, 0xFF, 0x62]).buffer)).toBe('a�b')
  })

  it('keeps a host\'s own codecs', () => {
    const scope: Record<string, any> = { TextEncoder: 'host' }
    installJSCGlobals(scope)
    expect(scope.TextEncoder).toBe('host')
  })
})
