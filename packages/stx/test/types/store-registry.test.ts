import { expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createTempDir } from '../../src/temp-dir'

// `useStore(name)` came back as `any` (ambient) or `unknown` (module), so none
// of a store's API was checked in a `.stx` file or in another store. An app
// names its stores once, by augmenting the registry, and every `useStore('id')`
// is then typed; an id the registry does not name keeps the old behaviour.
it('types useStore by id for module imports and auto-imported globals', async () => {
  const dir = createTempDir('stx-store-registry-')
  const file = join(dir, 'registry-types.ts')
  const source = `
import { useStore as importedStore } from '${resolve(import.meta.dir, '../../src/state-management')}'

interface Tasks { open: () => number[], add: (n: number) => void }
declare module '${resolve(import.meta.dir, '../../src/state-management')}' {
  interface StoreRegistry { tasks: Tasks }
}
declare global {
  interface StxStoreRegistry { tasks: Tasks }
}

const tasks = importedStore('tasks')
const first: number | undefined = tasks.open()[0]
tasks.add(1)
// @ts-expect-error the registered store rejects a string
tasks.add('wrong')

const globalTasks = useStore('tasks')
globalTasks.add(2)
// @ts-expect-error the registered store rejects a string
globalTasks.add('wrong')

// An id the registry does not name still works, as the type it is given.
const other = importedStore<{ n: number }>('other')
const n: number = other.n
const looseGlobal = useStore('unregistered')
looseGlobal.anything.goes()
void first; void n
`
  try {
    await Bun.write(file, source)
    const result = Bun.spawnSync(['bun', '--bun', join(Bun.resolveSync('typescript', import.meta.dir), '..', '..', 'bin', 'tsc'), '--ignoreConfig', '--strict', '--noEmit', '--skipLibCheck', '--target', 'esnext', '--module', 'esnext', '--moduleResolution', 'bundler', '--types', 'bun', file, resolve(import.meta.dir, '../../stx.d.ts')], { stdout: 'pipe', stderr: 'pipe' })
    expect(`${result.stdout.toString()}${result.stderr.toString()}`).toBe('')
    expect(result.exitCode).toBe(0)
  }
  finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
