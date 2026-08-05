/**
 * Framework composables bundle from a BUILT package, not just from source
 * (stacksjs/stx#1832).
 *
 * The directory scan globbed `*.ts` next to itself. That finds the sources when
 * stx runs from `src/` — and running from `src/` is the one configuration that
 * never ships. A released package runs from `dist/`, where the composables
 * directory holds 37 `.js` and 37 `.d.ts` files and not one plain `.ts`. Every
 * file the bundler opened was therefore type-only, nothing was ever emitted,
 * and every requested name came back as unbundlable with a warning telling the
 * user their code would throw.
 *
 * Two details compounded it:
 *
 *  - `'index.d.ts'.endsWith('index.ts')` is false, so the barrel — the single
 *    file the filter existed to skip — was the one file it let through.
 *  - Being a barrel of `export { … } from './x'`, it was also the one shape the
 *    export-prefix strip cannot survive: it leaves `{ … } from './x'`, which
 *    does not parse, so the file threw and the names were reported as missing
 *    rather than as failed.
 *
 * The whole class was invisible here because every existing test runs from
 * source. These fixtures are shaped like `dist/` on purpose.
 */
import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  clearFrameworkComposableCache,
  getFrameworkComposableScript,
  selectComposableFiles,
} from '../src/framework-composables'

/** `notify` is in the server-only set, so a page calling it requests a bundle. */
const PAGE = `<script client>\nonMount(() => { notify('hi') })\n</script>`

describe('selectComposableFiles', () => {
  const dist = [
    '/pkg/dist/composables/index.js',
    '/pkg/dist/composables/index.d.ts',
    '/pkg/dist/composables/use-thing.js',
    '/pkg/dist/composables/use-thing.d.ts',
  ]

  it('takes the runtime files out of a built layout', () => {
    expect(selectComposableFiles(dist)).toEqual(['/pkg/dist/composables/use-thing.js'])
  })

  it('never selects a declaration file', () => {
    // A .d.ts cannot contribute runtime code, so opening one is always waste —
    // and every file in a built package matched the old glob.
    expect(selectComposableFiles(dist).some(f => f.endsWith('.d.ts'))).toBe(false)
  })

  it('excludes the barrel by any extension', () => {
    // The exclusion compared endsWith('index.ts'), which index.d.ts and
    // index.js both slip past.
    const picked = selectComposableFiles([...dist, '/pkg/dist/composables/index.mjs'])
    expect(picked.some(f => /[/\\]index\./.test(f))).toBe(false)
  })

  it('still works on a source layout', () => {
    expect(selectComposableFiles([
      '/pkg/src/composables/index.ts',
      '/pkg/src/composables/use-thing.ts',
    ])).toEqual(['/pkg/src/composables/use-thing.ts'])
  })

  it('prefers source over build when a directory holds both', () => {
    expect(selectComposableFiles([
      '/pkg/composables/use-thing.js',
      '/pkg/composables/use-thing.ts',
    ])).toEqual(['/pkg/composables/use-thing.ts'])
  })
})

describe('bundling from a dist-shaped directory', () => {
  let dir = ''

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'stx-composables-dist-'))

    // Exactly the shape a built package has: compiled JS beside declarations,
    // and a barrel that only exists as a declaration file.
    await Bun.write(path.join(dir, 'use-notify.js'), `
export function notify(message) {
  return { message, shown: true };
}
`)
    await Bun.write(path.join(dir, 'use-notify.d.ts'), `
export declare function notify(message: string): { message: string, shown: boolean };
`)
    await Bun.write(path.join(dir, 'index.js'), `export { notify } from './use-notify.js';\n`)
    await Bun.write(path.join(dir, 'index.d.ts'), `
export {
  notify,
  type NotifyOptions,
} from './use-notify'
`)
  })

  afterAll(async () => {
    if (dir)
      await rm(dir, { recursive: true, force: true })
  })

  it('emits the composable', async () => {
    clearFrameworkComposableCache()
    const script = await getFrameworkComposableScript(PAGE, dir)

    expect(script).not.toBeNull()
    expect(script).toContain('function notify')
  })

  it('does not warn that the name will throw', async () => {
    // The user-facing symptom: a confident warning that working code is broken.
    clearFrameworkComposableCache()
    const spy = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await getFrameworkComposableScript(PAGE, dir)
      expect(spy.mock.calls.map(c => String(c[0])).join('\n')).not.toContain('could not bundle')
    }
    finally {
      spy.mockRestore()
    }
  })

  it('is not derailed by the declaration barrel', async () => {
    // index.d.ts is the file that used to be processed and used to throw
    // "Expected ; but found NotifyOptions", taking the whole bundle with it.
    clearFrameworkComposableCache()
    const spy = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const script = await getFrameworkComposableScript(PAGE, dir)
      expect(spy.mock.calls.map(c => String(c[0])).join('\n')).not.toContain('index')
      expect(script).toContain('function notify')
    }
    finally {
      spy.mockRestore()
    }
  })
})

describe('the missing-name warning', () => {
  let dir = ''

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'stx-composables-empty-'))
  })

  afterAll(async () => {
    if (dir)
      await rm(dir, { recursive: true, force: true })
  })

  it('stays quiet about a name the page defines itself', async () => {
    // A local definition shadows the auto-import, so the warning was a
    // confident claim about working code (#1815).
    const spy = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      clearFrameworkComposableCache()
      await getFrameworkComposableScript(
        `<script client>\nconst notify = (m) => console.log(m)\nonMount(() => notify('hi'))\n</script>`,
        dir,
      )
      expect(spy.mock.calls.map(c => String(c[0])).join('\n')).not.toContain('could not bundle')
    }
    finally {
      spy.mockRestore()
    }
  })

  it('still warns when the name really is unavailable', async () => {
    const spy = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      clearFrameworkComposableCache()
      await getFrameworkComposableScript(PAGE, dir)
      expect(spy.mock.calls.map(c => String(c[0])).join('\n')).toContain('could not bundle')
    }
    finally {
      spy.mockRestore()
    }
  })
})
