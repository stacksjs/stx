/**
 * The exported overlay API reaches the runtime's stack (stacksjs/stx#2057),
 * and does nothing at all where there is no runtime, so code shared with the
 * server can call it without a guard.
 */
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { bundleClientScript } from '../../stx/src/client-script-bundler'
import { closeOverlay, isTopOverlay, openOverlay, openOverlays } from '../src'

const calls: unknown[][] = []
const g = globalThis as any

afterEach(() => {
  calls.length = 0
  delete g.stx
})

describe('the overlay API', () => {
  it('is a no-op with no runtime on the page', () => {
    expect(() => openOverlay('a', { panel: null })).not.toThrow()
    expect(() => closeOverlay('a')).not.toThrow()
    expect(isTopOverlay('a')).toBe(false)
    expect(openOverlays()).toEqual([])
  })

  it('forwards to window.stx.overlays', () => {
    g.stx = {
      overlays: {
        open: (...args: unknown[]) => calls.push(['open', ...args]),
        close: (...args: unknown[]) => calls.push(['close', ...args]),
        isTop: (id: string) => id === 'a',
        list: () => ['a'],
      },
    }
    const options = { panel: null, onEscape: () => {} }
    openOverlay('a', options)
    closeOverlay('a')
    expect(calls).toEqual([['open', 'a', options], ['close', 'a']])
    expect(isTopOverlay('a')).toBe(true)
    expect(openOverlays()).toEqual(['a'])
  })
})

/**
 * The entry a page imports the stack from.
 *
 * The package root also reaches the syntax highlighter, which imports Node's
 * `stream/promises`; a `<script client>` importing the stack from the root
 * made the page's whole module registry fail to bundle, and every module on
 * the page with it. `@stacksjs/components/overlays` is the stack alone.
 */
describe('the published browser entry', () => {
  const root = path.resolve(import.meta.dir, '..')

  it('bundles for a page, with nothing of the highlighter in it', async () => {
    const build = Bun.spawnSync(['bun', 'run', 'build.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
    expect(build.exitCode).toBe(0)

    const entry = (await Bun.file(path.join(root, 'package.json')).json()).exports['./overlays']
    for (const file of [entry.types, entry.bun, entry.import])
      expect(await Bun.file(path.join(root, file)).exists()).toBe(true)

    const source = `import { closeOverlay, openOverlay } from '../${entry.import.slice(2)}'\nopenOverlay('panel', { panel: '#panel' })\ncloseOverlay('panel')`
    const bundle = await bundleClientScript(source, path.join(root, 'test', 'overlays-browser.ts'), { projectRoot: root, externalizeUserModules: false, throwOnFailure: true })
    expect(bundle).toContain('function openOverlay')
    expect(bundle).not.toContain('stream/promises')
    expect(bundle).not.toContain('ts-syntax-highlighter')
  })
})
