import { expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

it('checks useModel types for both module imports and auto-imported globals', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stx-model-types-'))
  const file = join(dir, 'model-types.ts')
  const source = `
import { useModel as importedModel } from '${resolve(import.meta.dir, '../../src/component-model')}'
const count = importedModel('count', { default: 0 })
const number: number = count()
count.set(1)
// @ts-expect-error a numeric model rejects a string
count.set('wrong')
const maybe = importedModel<string>()
const optional: string | undefined = maybe()
// @ts-expect-error no default means the value can be undefined
const required: string = maybe()
const globalCount = useModel('count', { default: 0 })
const globalNumber: number = globalCount()
// @ts-expect-error globals have the same write type
globalCount.set('wrong')
const globalMaybe = useModel<string>()
// @ts-expect-error globals have the same optional read type
const globalRequired: string = globalMaybe()
`
  try {
    await Bun.write(file, source)
    const result = Bun.spawnSync(['bun', '--bun', 'tsc', '--ignoreConfig', '--strict', '--noEmit', '--skipLibCheck', '--target', 'esnext', '--module', 'esnext', '--moduleResolution', 'bundler', '--types', 'bun', file, resolve(import.meta.dir, '../../stx.d.ts')], { stdout: 'pipe', stderr: 'pipe' })
    expect(`${result.stdout.toString()}${result.stderr.toString()}`).toBe('')
    expect(result.exitCode).toBe(0)
  }
  finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
