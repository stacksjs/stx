/**
 * Every `import { X } from 'stx'` we write in our own source must actually work.
 *
 * Four features shipped fully implemented and completely unreachable, each found
 * only by someone going looking:
 *
 *   composer / composerPattern  the view-composer registry could never be filled,
 *                               so runComposers ran against an empty map on every
 *                               render (#1860)
 *   defineForm / v              the form primitive had no way in (#1856)
 *   refresh / invalidateRoute   the router had them; the authoring surface did
 *                               not (#1850)
 *   enableDevTools              you could not turn devtools on from the package
 *
 * In every case a docblock in the module told you to write an import that threw.
 * That docblock is a promise, and this test holds us to it: if the example says
 * `from 'stx'`, the name must resolve from the package entry; if the module lives
 * behind a subpath, the example has to say so.
 *
 * This is the same shape as runtime-globals.test.ts, which keeps the client-side
 * authoring surface honest. This one covers the package surface.
 */
import { describe, expect, it } from 'bun:test'
import { Glob } from 'bun'
import * as entry from '../src/index'

interface Promised {
  name: string
  file: string
  specifier: string
}

/**
 * Collect every `import { … } from '<specifier>'` written in source COMMENTS.
 *
 * Real import statements are excluded: a module importing from its own package
 * is not making a promise to a reader, and would resolve through the bundler
 * anyway. Only documentation is a claim about the public surface.
 */
async function collectPromisedImports(): Promise<Promised[]> {
  const found: Promised[] = []
  const glob = new Glob('src/**/*.ts')

  for await (const file of glob.scan({ cwd: new URL('..', import.meta.url).pathname })) {
    const source = await Bun.file(new URL(`../${file}`, import.meta.url)).text()

    // Comment bodies only — block comments and consecutive line comments.
    const comments = [
      ...(source.match(/\/\*[\s\S]*?\*\//g) || []),
      ...(source.match(/^[ \t]*\/\/.*$/gm) || []),
    ].join('\n')

    const re = /import\s*\{([^}]+)\}\s*from\s*['"]((?:@stacksjs\/)?stx(?:\/[\w-]+)*)['"]/g
    let match: RegExpExecArray | null
    while ((match = re.exec(comments)) !== null) {
      const specifier = match[2]
      for (const raw of match[1].split(',')) {
        const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
        if (!name || !/^[A-Za-z_$][\w$]*$/.test(name))
          continue
        found.push({ name, file, specifier })
      }
    }
  }
  return found
}

const promised = await collectPromisedImports()

describe('documented imports resolve (public API reachability)', () => {
  it('finds documented imports to check', () => {
    // A guard on the guard: if the scan silently matched nothing, the rest of
    // this file would pass while asserting nothing at all.
    expect(promised.length).toBeGreaterThan(20)
  })

  it('every name documented as `from \'stx\'` is exported from the package entry', () => {
    const rootPromises = promised.filter(p => p.specifier === 'stx' || p.specifier === '@stacksjs/stx')
    const unreachable = rootPromises
      .filter(p => !(p.name in entry))
      // Deduplicate: one missing export documented in three places is one bug.
      .filter((p, i, all) => all.findIndex(o => o.name === p.name) === i)

    const detail = unreachable
      .map(p => `  ${p.name} — documented in ${p.file}, not exported from src/index.ts`)
      .join('\n')

    expect(unreachable.length, `\n${detail}\n\nEither re-export the name from src/index.ts, or correct the docblock to name the subpath it actually lives behind.\n`).toBe(0)
  })

  it('does not regress the four that shipped unreachable', () => {
    // Named explicitly so the reason these exist is not lost to a refactor.
    for (const name of ['composer', 'composerPattern', 'defineForm', 'v', 'enableDevTools', 'onUpdate'])
      expect(entry).toHaveProperty(name)
  })

  it('a name documented behind a subpath is not required at the root', () => {
    // configureDatabase lives at stx/database and its docblock says so. The
    // guard must not force everything into one entry.
    const subpathPromises = promised.filter(p => p.specifier.includes('/') && p.specifier !== '@stacksjs/stx')
    expect(subpathPromises.length).toBeGreaterThan(0)
  })
})
