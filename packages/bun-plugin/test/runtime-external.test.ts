/**
 * Guard for stacksjs/stx#1735 — bun-plugin must NOT bundle a private copy
 * of the @stacksjs/stx signals runtime (the browser x-if/x-for/x-else
 * engine).
 *
 * Background: bun-plugin's serve path injects the client signals runtime.
 * If bun-plugin bundles its own copy at build time (Bun inlining it from
 * @stacksjs/stx), that copy is a snapshot frozen at bun-plugin's last
 * build — so runtime changes in @stacksjs/stx (e.g. #1734's reactive
 * x-else) silently never reach consumers using `bun-plugin-stx/serve`,
 * even after they upgrade @stacksjs/stx. The two packages can be mutually
 * stale at the SAME version, and `bun install` won't fix it.
 *
 * The fix (in place since 2026-01-13) is `external: ['@stacksjs/stx']` in
 * build.ts: the runtime stays a runtime-resolved import, so a stx version
 * bump reaches consumers without rebuilding bun-plugin. These tests lock
 * that contract so a future edit to build.ts can't silently reintroduce
 * the stale-copy bug.
 *
 * Layer 1 (static): build.ts keeps @stacksjs/stx external. Instant; catches
 * removal of the flag directly.
 * Layer 2 (behavioral): a fresh build's dist references @stacksjs/stx as an
 * import and contains none of the runtime's identifying markers. Catches
 * the bug even if it's introduced some other way (a second non-external
 * entrypoint, a subpath import that bypasses the exact-match external,
 * etc.).
 */
import { beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

setDefaultTimeout(30000)

const PKG_DIR = path.resolve(import.meta.dir, '..')
const DIST_DIR = path.join(PKG_DIR, 'dist')
const BUILD_TS = path.join(PKG_DIR, 'build.ts')

// Identifiers/strings that exist ONLY inside the @stacksjs/stx signals
// runtime. If any appears in bun-plugin's dist, the runtime was inlined.
// Mix of function names (survive bun-plugin's non-minified build) and
// string literals (survive even minification).
const RUNTIME_MARKERS = [
  'generateSignalsRuntime',
  'createAutoUnwrapProxy',
  'function bindIf',
  'bindIfChain',
  'stx-if-chain', // placeholder comment text unique to bindIfChain (#1734)
]

describe('bun-plugin keeps the stx signals runtime external (#1735)', () => {
  describe('static: build.ts contract', () => {
    const buildSrc = fs.readFileSync(BUILD_TS, 'utf8')

    it('marks @stacksjs/stx as external in the Bun.build config', () => {
      // The external array must include @stacksjs/stx. Without it, Bun
      // inlines a private (stale-able) copy of the runtime.
      expect(buildSrc).toMatch(/external:\s*\[[^\]]*['"]@stacksjs\/stx['"]/)
    })
  })

  describe('behavioral: a fresh build does not inline the runtime', () => {
    let distJs = ''

    beforeAll(() => {
      // Build from the package's own build.ts so we test exactly what
      // `prepublishOnly` (bun run build) produces and ships to npm.
      const res = Bun.spawnSync(['bun', '--bun', 'build.ts'], {
        cwd: PKG_DIR,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      if (res.exitCode !== 0)
        throw new Error(`bun-plugin build failed:\n${res.stderr.toString()}`)

      distJs = fs.readdirSync(DIST_DIR)
        .filter(f => f.endsWith('.js'))
        .map(f => fs.readFileSync(path.join(DIST_DIR, f), 'utf8'))
        .join('\n')
    })

    it('references @stacksjs/stx as an external import (not inlined source)', () => {
      expect(distJs).toContain('@stacksjs/stx')
      // The reference is an import/require of the module, not a re-declaration.
      expect(distJs).toMatch(/(?:import|require|import\s*\()[^\n;]*@stacksjs\/stx/)
    })

    it('contains none of the signals-runtime markers', () => {
      const found = RUNTIME_MARKERS.filter(m => distJs.includes(m))
      expect(found).toEqual([])
    })
  })
})
