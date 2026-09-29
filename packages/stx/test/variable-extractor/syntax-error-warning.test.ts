import { describe, expect, it } from 'bun:test'
import { extractVariables } from '../../src/variable-extractor'

/**
 * A server script that does not parse.
 *
 * The same category as an unresolvable import or a missing name: never the
 * legitimate client-only case the quiet fallback exists for, and it takes
 * every binding in the script with it. An apostrophe left unescaped in a
 * single-quoted string (`'Uplink's dashboard'`) emptied a whole privacy page:
 * its `@foreach(sections)` rendered nothing, and the one warning printed was
 * about the loop, naming a symptom rather than the line that caused it.
 */
async function warningsFor(script: string): Promise<string[]> {
  const warnings: string[] = []
  const original = console.warn
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')) }
  try {
    await extractVariables(script, {}, '/app/resources/views/privacy.stx')
  }
  finally {
    console.warn = original
  }
  return warnings
}

describe('a server script that does not parse', () => {
  it('is reported, naming the file', async () => {
    const warnings = await warningsFor(`const sections = [{ body: 'See it in Uplink's dashboard.' }]\n`)

    const warning = warnings.find(w => w.includes('does not parse'))
    expect(warning).toBeDefined()
    expect(warning).toContain('privacy.stx')
  })

  it('stays quiet for a script that only fails on a browser global', async () => {
    const warnings = await warningsFor(`const width = window.innerWidth\n`)

    expect(warnings.some(w => w.includes('does not parse'))).toBe(false)
  })
})
