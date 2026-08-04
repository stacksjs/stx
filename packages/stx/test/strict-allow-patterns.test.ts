/**
 * `allowPatterns` cannot silently disable the whole validator
 * (stacksjs/stx#1792, P3).
 *
 * It was matched against the human message AND the regex SOURCE, so an entry
 * that looked like it named one rule could disable many. `['(']` disabled
 * almost every rule, because a paren appears in nearly every regex source.
 *
 * Nobody writes `['(']` deliberately — but a value like `['\\.']` or `['\\s']`,
 * which reads as escaping something in a filename, silently switched the
 * validator off wholesale. An allowlist whose blast radius cannot be read off
 * the rule list is worse than no allowlist.
 *
 * Matching the message keeps the documented ergonomic and makes the effect
 * knowable.
 */
import { describe, expect, it, spyOn } from 'bun:test'
import { validateClientScript } from '../src/script-validation'

/** Validate and return the emitted warning text, or '' when silent. */
function warningFor(code: string, allowPatterns?: string[]): string {
  const spy = spyOn(console, 'warn').mockImplementation(() => {})
  try {
    validateClientScript(code, 'test.stx', { enabled: true, ...(allowPatterns && { allowPatterns }) })
    return spy.mock.calls.length > 0 ? String(spy.mock.calls[0][0]) : ''
  }
  finally {
    spy.mockRestore()
  }
}

describe('allowPatterns', () => {
  it('still allows a rule named by its message', () => {
    // The documented ergonomic must keep working.
    expect(warningFor('document.querySelector(".x")', ['querySelector'])).toBe('')
  })

  it('does not disable every rule via a regex metacharacter', () => {
    // `(` appears in nearly every pattern SOURCE and in no message.
    const warning = warningFor('document.querySelector(".x")', ['('])
    expect(warning).toContain('querySelector')
  })

  it('is not fooled by an escape sequence either', () => {
    for (const entry of ['\\.', '\\s', '\\b', '[', '?'])
      expect(warningFor('document.querySelector(".x")', [entry])).toContain('querySelector')
  })

  it('still catches rules the author did not name', () => {
    const warning = warningFor('document.querySelector(".x")\nwindow.alert("hi")', ['querySelector'])
    expect(warning).toContain('alert')
    expect(warning).not.toContain('querySelector')
  })

  it('warns for a bare localStorage, not just window.localStorage', () => {
    // The most-hit gap: a theme-boot snippet duplicated across files reads
    // localStorage directly, and useColorMode replaces it outright.
    expect(warningFor('localStorage.getItem("theme")')).toContain('localStorage')
  })

  it('still warns for the window-qualified form', () => {
    expect(warningFor('window.localStorage.getItem("t")')).toContain('localStorage')
  })

  it('stays silent for clean code', () => {
    expect(warningFor('const n = state(0)\nonMount(() => n.set(1))')).toBe('')
  })
})
