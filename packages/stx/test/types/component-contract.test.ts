import { expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { COMPONENT_CONTRACT_HELPERS, componentContract } from '../../src/component-contract'

it('projects imported types, defaulted props, constructor props and typed events without executing scripts', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stx-contract-'))
  try {
    const types = join(dir, 'types.ts')
    await Bun.write(types, 'export interface Item { id: number }')
    const typed = componentContract(`
import type { Item as Data } from '${types}'
interface Props { item: Data; count: number; title?: string; format?: (n: number) => string }
const props = withDefaults(defineProps<Props>(), { count: 0 })
const emit = defineEmits<{ change: [value: Data] }>()
throw new Error('must never run')
`, '__Typed')
    const runtime = componentContract(`
const props = defineProps({ count: { type: Number, required: true }, title: String, enabled: { type: Boolean, default: false } })
`, '__Runtime')
    const file = join(dir, 'fixture.ts')
    await Bun.write(file, `
declare function defineProps<T = unknown>(options?: any): T
declare function withDefaults<P, D>(props: P, defaults: D): P & D
declare function defineEmits<T>(): T
${COMPONENT_CONTRACT_HELPERS}
${typed.declarations}
${runtime.declarations}
const valid: ${typed.props} = { item: { id: 1 } }
// @ts-expect-error missing required item
const missing: ${typed.props} = {}
// @ts-expect-error imported prop field has a number type
const wrong: ${typed.props} = { item: { id: 'bad' } }
const event: ${typed.events}['change'][0] = { id: 1 }
// @ts-expect-error event payload uses imported type
const wrongEvent: ${typed.events}['change'][0] = { id: 'bad' }
const runtimeValid: ${runtime.props} = { count: 1 }
// @ts-expect-error required runtime prop
const runtimeMissing: ${runtime.props} = {}
// @ts-expect-error runtime numeric type
const runtimeWrong: ${runtime.props} = { count: 'bad' }
`)
    const result = Bun.spawnSync(['bun', '--bun', 'tsc', '--ignoreConfig', '--strict', '--noEmit', '--skipLibCheck', '--allowImportingTsExtensions', '--target', 'esnext', '--module', 'esnext', '--moduleResolution', 'bundler', file], { stdout: 'pipe', stderr: 'pipe' })
    expect(result.stdout.toString() + result.stderr.toString()).toBe('')
    expect(result.exitCode).toBe(0)
  }
  finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

it('does not invent contracts or imports from comments and quoted examples', () => {
  const absent = componentContract(`const example = "defineProps<{ missing: string }>()"`, '__Example')
  expect(absent.props).toBeNull()
  const present = componentContract(`
// import { Ghost } from 'missing-package'
const props = defineProps<{ title: string }>()
`, '__Real')
  expect(present.declarations).not.toContain('import * as')
  expect(present.props).toBe('__Real.__StxProps')
})
