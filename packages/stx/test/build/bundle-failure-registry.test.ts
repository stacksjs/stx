/**
 * #1884: a `<script client>` bundle failure was a console.warn and nothing else.
 *
 * The bundler falls back to shipping the ORIGINAL, unbundled source so the page
 * still renders — reasonable for a dev server, wrong for a build. Because the
 * fallback returns a string like nothing happened, the failure never reached
 * ssg.failedCount (which only ever saw render-time throws), so `stx build`
 * exited 0 and published a page whose imports never resolve and whose bindings
 * silently do nothing.
 *
 * These cover the registry the build's exit path reads. The CLI wiring itself
 * (bin/cli.ts) is asserted by source contract, since running a full build in a
 * unit test would be far slower than the thing it proves.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import {
  bundleClientScript,
  clearBundleFailures,
  getBundleFailures,
  recordBundleFailure,
} from '../../src/client-script-bundler'

describe('client-script bundle failure registry (#1884)', () => {
  beforeEach(() => {
    clearBundleFailures()
  })

  it('starts empty', () => {
    expect(getBundleFailures()).toEqual([])
  })

  it('records a failure with its file and message', () => {
    recordBundleFailure('resources/views/a.stx', 'Could not resolve "./missing"')
    const failures = getBundleFailures()
    expect(failures.length).toBe(1)
    expect(failures[0].filePath).toBe('resources/views/a.stx')
    expect(failures[0].message).toContain('Could not resolve')
  })

  it('labels an inline script that has no file path', () => {
    recordBundleFailure('', 'boom')
    expect(getBundleFailures()[0].filePath).toBe('<inline>')
  })

  it('hands back a copy, so a caller cannot mutate the registry', () => {
    recordBundleFailure('a.stx', 'x')
    getBundleFailures().push({ filePath: 'b.stx', message: 'y' })
    expect(getBundleFailures().length).toBe(1)
  })

  it('clears', () => {
    recordBundleFailure('a.stx', 'x')
    clearBundleFailures()
    expect(getBundleFailures()).toEqual([])
  })

  it('records a real bundle failure while still returning usable source', async () => {
    // An unresolvable import is the canonical case from the issue.
    const code = `import { nope } from './definitely-does-not-exist-${Date.now()}'\nconsole.warn(nope)`
    const out = await bundleClientScript(code, 'resources/views/broken.stx')

    // The fallback still returns something, so the dev server keeps working...
    expect(typeof out).toBe('string')
    expect(out.length).toBeGreaterThan(0)
    // ...but the build can now see that it failed.
    const failures = getBundleFailures()
    expect(failures.length).toBeGreaterThan(0)
    expect(failures.some(f => f.filePath.includes('broken.stx'))).toBe(true)
  })
})

describe('build exit path reads the registry (#1884)', () => {
  it('the CLI fails the build when a client script did not bundle', async () => {
    const cli = await Bun.file(new URL('../../bin/cli.ts', import.meta.url)).text()
    expect(cli).toContain('getBundleFailures()')
    // Cleared before the build so a long-lived process cannot carry failures in.
    expect(cli).toContain('clearBundleFailures()')
    // And it must actually be fatal, not another warning.
    const block = cli.slice(cli.indexOf('const bundleFailures = getBundleFailures()'))
    expect(block.slice(0, 800)).toContain('process.exit(1)')
  })
})
