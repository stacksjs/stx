/**
 * Every bundled copy of the signals runtime is the same vintage
 * (stacksjs/stx#1814).
 *
 * `bun run build` bundles, so several dist entries each end up with their OWN
 * inlined copy of the runtime generator:
 *
 *   dist/{signals,ssg,cli,pwa,craft}.js
 *
 * `getCachedSignalsRuntime` does `await import('./signals')`, but an SSG build
 * runs through `dist/ssg.js`, which calls its own copy. So patching
 * `dist/signals.js` — a completely reasonable thing to do when verifying a
 * fix — silently does nothing for the SSG, CLI, PWA and Craft paths.
 *
 * That produced a build which succeeded, reported 24/24 pages, and shipped a
 * months-old runtime. Diagnosing it took three separate experiments (renaming an
 * identifier, adding a marker attribute, and finally making the generator
 * throw — the build still passed) because every one of them looked like proof
 * that the SSG resolves a different package. It doesn't; it resolves a different
 * COPY inside the same package.
 *
 * This turns that into a failed test. It asserts the copies agree on markers
 * rather than byte-comparing the whole runtime: the entries legitimately differ
 * (cli.js bundles the dev runtime too), so equality would be false precision.
 */
import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve(import.meta.dir, '..', 'dist')

/** dist entries that carry their own bundled copy of the runtime generator. */
function entriesWithRuntime(): string[] {
  if (!fs.existsSync(distDir))
    return []
  return fs.readdirSync(distDir)
    .filter(f => f.endsWith('.js'))
    .filter(f => fs.readFileSync(path.join(distDir, f), 'utf8').includes('signals runtime loading'))
    .sort()
}

/**
 * Markers that only exist in a current runtime.
 *
 * Chosen to be recent and structural rather than cosmetic, so a stale copy
 * cannot accidentally satisfy them.
 */
const MARKERS = [
  'function isDerived', //  #1804
  'setSelectionRange', //   #1799
  'function watchMultiple', // #1804
  '__stx_if_pending', //    #1773
]

describe('bundled runtime copies agree', () => {
  const entries = entriesWithRuntime()

  it('finds the bundled entries at all', () => {
    // If dist has not been built this suite cannot say anything, and silently
    // passing would be the same failure mode the issue describes.
    if (entries.length === 0) {
      console.warn('[stx] dist/ not built — skipping bundled-runtime comparison')
      return
    }
    expect(entries.length).toBeGreaterThan(1)
    expect(entries).toContain('signals.js')
  })

  it('every copy carries every current marker', () => {
    if (entries.length === 0)
      return

    const stale: string[] = []
    for (const entry of entries) {
      const src = fs.readFileSync(path.join(distDir, entry), 'utf8')
      for (const marker of MARKERS) {
        if (!src.includes(marker))
          stale.push(`${entry} is missing "${marker}"`)
      }
    }

    // A miss here means one entry was rebuilt and another was not, so a build
    // will succeed while shipping stale runtime code on whichever path uses the
    // stale copy. Rebuild with `bun run build` rather than editing dist by hand.
    expect(stale).toEqual([])
  })
})
