/**
 * `strict: { bundlerFallback: 'error' }` (stacksjs/stx#1884 ask 3).
 *
 * When a `<script client>` block will not bundle, the bundler ships the
 * ORIGINAL, unbundled source so the page still renders. That is the right
 * default for a dev server — a server you cannot load is worse than one showing
 * you the error — but it is degradation, and degradation should be something you
 * can turn off rather than something you have to know about.
 *
 * The other two halves of #1884 make the failure visible: `stx build` exits
 * non-zero, and the dev server draws an overlay. This is for anyone who would
 * rather nothing rendered at all than a page whose bindings quietly do nothing.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  bundleClientScript,
  clearBundleFailures,
  getBundleFailures,
  resolveBundlerFallback,
  setBundlerFallbackMode,
} from '../../src/client-script-bundler'
import { config } from '../../src/config'

let dir = ''
let file = ''

/** A client script whose USER import cannot resolve — bundling is opt-in on those. */
const BROKEN = `import { missing } from './does-not-exist'\nconst n = missing(1)\nconsole.warn(n)\n`

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-fallback-'))
  file = path.join(dir, 'page.stx')
  await Bun.write(file, '<main>x</main>\n')
  clearBundleFailures()
  setBundlerFallbackMode(undefined)
})

afterEach(async () => {
  setBundlerFallbackMode(undefined)
  delete (config as { strict?: unknown }).strict
  clearBundleFailures()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

describe('the default', () => {
  it('is warn — the page still renders', async () => {
    expect(resolveBundlerFallback()).toBe('warn')

    const result = await bundleClientScript(BROKEN, file, { projectRoot: dir })

    // The original source, handed back so the dev server stays usable.
    expect(result).toBe(BROKEN)
  })

  it('records the failure even though it returned', async () => {
    // This is what lets `stx build` exit non-zero and the overlay appear;
    // returning quietly with nothing recorded was the original bug.
    await bundleClientScript(BROKEN, file, { projectRoot: dir })

    const failures = getBundleFailures()
    expect(failures).toHaveLength(1)
    expect(failures[0].filePath).toBe(file)
    expect(failures[0].message).toMatch(/does-not-exist/)
  })

  it('carries the failure position for an overlay to draw', async () => {
    await bundleClientScript(BROKEN, file, { projectRoot: dir })

    expect(getBundleFailures()[0].details?.length).toBeGreaterThan(0)
  })
})

describe('strict.bundlerFallback = error', () => {
  it('refuses instead of shipping unbundled source', async () => {
    config.strict = { bundlerFallback: 'error' }
    expect(resolveBundlerFallback()).toBe('error')

    await expect(bundleClientScript(BROKEN, file, { projectRoot: dir })).rejects.toThrow()
  })

  it('still records the failure before throwing', async () => {
    // The throw must not cost the diagnostics — whoever catches it upstream
    // should still be able to say which file and why.
    config.strict = { bundlerFallback: 'error' }

    await bundleClientScript(BROKEN, file, { projectRoot: dir }).catch(() => {})

    expect(getBundleFailures()).toHaveLength(1)
  })

  it('is read per call, not captured at import time', async () => {
    // Config loads after this module is first imported, so a value captured at
    // import time is always the default and the setting would never apply.
    expect(resolveBundlerFallback()).toBe('warn')
    config.strict = { bundlerFallback: 'error' }
    expect(resolveBundlerFallback()).toBe('error')
    delete (config as { strict?: unknown }).strict
    expect(resolveBundlerFallback()).toBe('warn')
  })
})

describe('the override', () => {
  it('wins over config, for tests and embedders', () => {
    config.strict = { bundlerFallback: 'warn' }
    setBundlerFallbackMode('error')

    expect(resolveBundlerFallback()).toBe('error')
  })

  it('goes back to config when cleared', () => {
    config.strict = { bundlerFallback: 'error' }
    setBundlerFallbackMode('warn')
    setBundlerFallbackMode(undefined)

    expect(resolveBundlerFallback()).toBe('error')
  })
})
