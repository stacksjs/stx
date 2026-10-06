/**
 * The environment gates still read the environment after the build.
 *
 * `build.ts` emits this package by transforming each source file with
 * `Bun.Transpiler`, and the transpiler CONSTANT-FOLDS
 * `process.env.NODE_ENV === 'production'` against the environment it is itself
 * running in. The release machine does not set NODE_ENV, so `env.ts` shipped as
 *
 *     export function isProduction() { return !1; }
 *     export function isTest() { return !1; }
 *
 * in every published version. `isProduction()` and `isTest()` were therefore
 * permanently false in every installed copy of stx, and `isDevelopment()`
 * permanently true, whatever the consuming app set NODE_ENV to.
 *
 * That put every app's renderer in development mode. The visible consequence
 * was `showBoundaries` in process.ts -- `!isProduction() && !isTest()` -- so a
 * failed `<script server>` or `@include` rendered its red diagnostic, absolute
 * build-machine paths included, to end users of a production deploy. That is
 * how it was reported (stacksjs/stx#2035), as a banner printing a filesystem
 * path to visitors, which read as the boundary being misdesigned rather than as
 * its gate being welded shut.
 *
 * Nothing that reads the source could catch it: the source is correct, and
 * `bun test` runs the source. So this test runs the BUILD's transform and
 * checks what comes out the other side, which is the only place the bug exists.
 */
import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { isDevelopment, isProduction, isTest } from '../src/env'

const SRC = path.resolve(import.meta.dir, '..', 'src')

/** The transform `build.ts` applies to every source file, with its options. */
async function built(file: string): Promise<string> {
  const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'bun' })
  return transpiler.transform(await Bun.file(path.join(SRC, file)).text())
}

describe('the env gates survive the build', () => {
  it('still reads NODE_ENV after transpiling env.ts', async () => {
    const output = await built('env.ts')

    // The comparison has to still be in there. `return !1` is the shape that
    // shipped: a gate folded to a constant.
    expect(output).toContain('NODE_ENV')
    expect(output).toContain('"production"')
  })

  it('leaves no gate folded to a constant', async () => {
    const output = await built('env.ts')
    const folded = [...output.matchAll(/function (\w+)\([^)]*\)\s*\{\s*return\s*(!?\d|true|false)\s*;?\s*\}/g)]

    expect(folded.map(match => match[1])).toEqual([])
  })

  it('keeps the test gate reading the environment too', async () => {
    // `isTest()` folds the same way and is half of `showBoundaries`.
    const output = await built('env.ts')
    const isTestBody = output.slice(output.indexOf('function isTest'))

    expect(isTestBody).toContain('NODE_ENV')
    expect(isTestBody).toContain('"test"')
  })

  it('keeps the generated service worker asking at generation time', async () => {
    /*
     * The third instance of the same fold, and the one that reached users'
     * browsers. `pwa/workbox.ts` builds the service worker as a template
     * literal and interpolated `process.env.NODE_ENV !== 'production'` into it,
     * so the comparison ran when the string was BUILT -- and the transpiler
     * folded it first. Every published copy emitted `debug: true`, so Workbox
     * logged in every app's production service worker and no NODE_ENV the app
     * set could change it.
     */
    const output = await built('pwa/workbox.ts')

    expect(output).toContain('isProduction()')
    expect(output).not.toContain('debug: true }')
  })

  it('does not fold the prop validation gate either', async () => {
    // Same comparison, same fold, written inline in props.ts: a development
    // only warning path, permanently on in every published copy.
    const output = await built('props.ts')

    expect(output).not.toMatch(/if\s*\(\s*!?\s*(!1|!0|true|false)\s*\)\s*\{\s*const error = validateProp/)
  })
})

describe('the gates answer the environment they are asked in', () => {
  /*
   * The runtime half of the same statement. Restoring NODE_ENV in a finally so
   * a failure here cannot change the environment the rest of the suite runs in.
   */
  async function withNodeEnv<T>(value: string | undefined, body: () => T): Promise<T> {
    const before = process.env.NODE_ENV
    if (value === undefined)
      delete process.env.NODE_ENV
    else
      process.env.NODE_ENV = value
    try {
      return body()
    }
    finally {
      if (before === undefined)
        delete process.env.NODE_ENV
      else
        process.env.NODE_ENV = before
    }
  }

  it('reports production under NODE_ENV=production', async () => {
    expect(await withNodeEnv('production', () => [isProduction(), isTest(), isDevelopment()]))
      .toEqual([true, false, false])
  })

  it('reports test under NODE_ENV=test', async () => {
    expect(await withNodeEnv('test', () => [isProduction(), isTest(), isDevelopment()]))
      .toEqual([false, true, true])
  })

  it('reports development when NODE_ENV is unset', async () => {
    expect(await withNodeEnv(undefined, () => [isProduction(), isTest(), isDevelopment()]))
      .toEqual([false, false, true])
  })
})
