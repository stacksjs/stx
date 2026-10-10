/**
 * A failed `<script server>` import names the app's file, not stx's.
 *
 * The loader puts the importing file on a resolution error, and for a server
 * script that file is always stx itself -- the script is compiled and imported
 * from `variable-extractor.ts`. So the message read
 *
 *   Cannot find module './lib/data' imported from /…/packages/stx/src/variable-extractor.ts
 *
 * and the only path in it that looks like an answer points at the framework,
 * while the file the reader has to go and edit is not in there at all. That is
 * the detour stacksjs/stx#2035 was reported as: the referrer was quoted in the
 * report as `node_modules/@stacksjs/stx/dist/chunk-…` and read as an stx bug.
 *
 * `ssg.ts` already stripped it for the error that fails a build. The console
 * warning did not -- and on a SERVED page that warning is the only signal
 * there is, in production the only one at all. So the two halves of the same
 * failure disagreed, and the half more people see was the misleading one. It
 * also put the build machine's absolute path into production logs.
 *
 * Stripped where the message is built now, so the warning, the dev error
 * boundary, the `onFailure` payload and the failed build all say the same
 * thing.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { extractVariables, withoutStxReferrer } from '../src/variable-extractor'

let warnings: string[]
let originalWarn: typeof console.warn

beforeEach(() => {
  warnings = []
  originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(' '))
  }
})

afterEach(() => {
  console.warn = originalWarn
})

describe('withoutStxReferrer', () => {
  it('drops a referrer inside stx checked out as a monorepo', () => {
    expect(withoutStxReferrer(
      `Cannot find module './lib/data' imported from /Users/me/Projects/stx/packages/stx/src/variable-extractor.ts`,
    )).toBe(`Cannot find module './lib/data'`)
  })

  it('drops a referrer inside stx installed from npm', () => {
    expect(withoutStxReferrer(
      `Cannot find package 'bunfig' imported from /app/node_modules/@stacksjs/stx/dist/chunk-abc123.js`,
    )).toBe(`Cannot find package 'bunfig'`)
  })

  for (const importer of [
    '/Users/me/My Projects/stx/packages/stx/src/variable-extractor.ts',
    '/app/node_modules/@stacksjs/stx/dist/variable-extractor.js',
    'C:\\Projects\\stx\\packages\\stx\\src\\variable-extractor.ts',
  ]) {
    for (const quote of ["'", '"']) {
      it(`drops Bun's ${quote}-quoted stx referrer: ${importer}`, () => {
        expect(withoutStxReferrer(`Cannot find module './missing' from ${quote}${importer}${quote}`))
          .toBe(`Cannot find module './missing'`)
      })
    }
  }

  it('keeps Bun referrers belonging to the application', () => {
    const message = `Cannot find module './missing' from '/app/My Views/dashboard.stx'`
    expect(withoutStxReferrer(message)).toBe(message)
  })

  it('keeps a referrer that is the app\'s own file', () => {
    // The useful half of the message: here the importer really is the file to
    // go and edit, so removing it would throw away the answer.
    const message = `Cannot find module './missing' imported from /app/resources/views/dashboard.stx`
    expect(withoutStxReferrer(message)).toBe(message)
  })

  it('leaves a message with no referrer alone', () => {
    expect(withoutStxReferrer('user is not defined')).toBe('user is not defined')
  })
})

describe('a server script importing a path that does not resolve', () => {
  const script = `import { data } from './does-not-exist'\nconst title = data.title`

  it('reports a cause that does not mention stx', async () => {
    const failures: Array<{ kind: string, message: string }> = []
    const filePath = `/tmp/stx-referrer-${crypto.randomUUID()}/Page.stx`

    await extractVariables(script, {}, filePath, {
      onFailure: failure => failures.push({ kind: failure.kind, message: failure.message }),
    })

    expect(failures).toHaveLength(1)
    expect(failures[0].kind).toBe('module-resolution')
    expect(failures[0].message).toContain('does-not-exist')
    expect(failures[0].message).not.toContain('variable-extractor')
    expect(failures[0].message).not.toContain('imported from')
  })

  it('warns without naming an stx file', async () => {
    const filePath = `/tmp/stx-referrer-${crypto.randomUUID()}/Page.stx`

    await extractVariables(script, {}, filePath, {})

    const warning = warnings.find(w => w.includes('imports a module that does not resolve'))
    expect(warning).toBeDefined()
    // The app's own file is still named -- that is the half worth keeping.
    expect(warning).toContain(filePath)
    expect(warning).not.toContain('variable-extractor')
    expect(warning).not.toContain('@stacksjs/stx')
  })
})
