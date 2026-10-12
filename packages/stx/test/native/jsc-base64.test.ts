/**
 * atob and btoa on a native screen. JavaScriptCore has neither (web APIs),
 * and a session handoff shared with the web pages decodes with them, so a
 * native sign-in failed to read the session it was handed. Each case is
 * checked against Bun's own, which follow the HTML standard.
 */
import { describe, expect, it } from 'bun:test'
import { installJSCGlobals, nativeAtob, nativeBtoa } from '../../src/native/runtime/jsc-globals'

describe('atob and btoa in JSC', () => {
  it('encode as a browser does', () => {
    for (const text of ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar', '{"token":"handoff-code"}', 'ÿþ\u0000\u0080', 'é'])
      expect(nativeBtoa(text)).toBe(btoa(text))
  })

  it('decode as a browser does, whitespace and missing padding included', () => {
    for (const text of ['', 'Zg==', 'Zm8=', 'Zm9v', 'Zg', 'Zm8', ' Zm9v\nYmFy ', 'eyJ0b2tlbiI6ImhhbmRvZmYtY29kZSJ9', '//79AIA='])
      expect(nativeAtob(text)).toBe(atob(text))
  })

  it('refuse what a browser refuses', () => {
    for (const text of ['Z', 'Zm9v!', 'Zg=a', 'Zg===']) {
      expect(() => atob(text)).toThrow()
      expect(() => nativeAtob(text)).toThrow()
    }
    expect(() => btoa('Ā')).toThrow()
    expect(() => nativeBtoa('Ā')).toThrow()
  })

  it('are installed for a native screen, and leave ones already there alone', () => {
    const target: Record<string, any> = { setTimeout, clearTimeout }
    installJSCGlobals(target)
    expect(target.atob(target.btoa('hq'))).toBe('hq')
    const own = () => 'own'
    const host: Record<string, any> = { setTimeout, clearTimeout, atob: own }
    installJSCGlobals(host)
    expect(host.atob).toBe(own)
  })
})
