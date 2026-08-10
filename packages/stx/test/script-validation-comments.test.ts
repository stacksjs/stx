/**
 * Strict mode reads code, not prose (stacksjs/stx#1911).
 *
 * `validateClientScript` scanned the script body as raw text, so a prohibited
 * API named in a comment was reported as a use of it. Measured on a real app
 * with strict mode on: 11 violations, 9 pointing at a comment.
 *
 * And every one of those comments documented that the file uses the stx
 * primitive INSTEAD; they exist because someone did the migration and wrote
 * down why. So the rule fired hardest on the code that had already complied,
 * and `failOnViolation` could not be turned on at all. That is the same shape
 * as #1905 in the codemod, reached through a different scanner.
 */

import { describe, expect, it } from 'bun:test'
import { validateClientScript } from '../src/script-validation'

const strict = { enabled: true, failOnViolation: true }

/** Whether strict mode rejects this script. */
function violates(code: string): boolean {
  try {
    validateClientScript(code, 'page.stx', strict)
    return false
  }
  catch {
    return true
  }
}

describe('a prohibited API named in a comment', () => {
  it('is not a violation in a line comment', () => {
    expect(violates(`// useLocalStorage rather than a raw read: localStorage is prohibited\nconst a = 1`)).toBe(false)
  })

  it('is not a violation in a block comment', () => {
    expect(violates(`/*\n * This used to be window.location.replace(url).\n */\nconst a = 1`)).toBe(false)
  })

  it('is not a violation in an stx template comment', () => {
    // `{{-- … --}}` is equally prose, and was equally matched.
    expect(violates(`{{-- localStorage is prohibited here --}}\nconst a = 1`)).toBe(false)
  })

  it('is not a violation inside a string', () => {
    expect(violates(`const help = 'we do not use localStorage directly'`)).toBe(false)
  })
})

describe('real use is still a violation', () => {
  it('catches the raw read the comment was explaining', () => {
    expect(violates(`const v = localStorage.getItem('k')`)).toBe(true)
  })

  it('catches it on the line after a comment that mentions it', () => {
    // The blanking is position-preserving, so the scanner still sees the code
    // below a comment rather than losing the line to it.
    expect(violates(`// localStorage is prohibited\nconst v = localStorage.getItem('k')`)).toBe(true)
  })
})
