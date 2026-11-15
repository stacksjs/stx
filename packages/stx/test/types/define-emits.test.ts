import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createTempDir } from '../../src/temp-dir'

// This checks the public module type contract, not compiler string output.
test('defineEmits types match documented tuples, overloads and payload maps', async () => {
  const root = createTempDir('stx-emits-types-')
  try {
    const module = new URL('../../src/composition-api.ts', import.meta.url).pathname
    await Bun.write(join(root, 'consumer.ts'), `import { defineEmits } from ${JSON.stringify(module)}
const tuple = defineEmits<{ change: [value: string]; pair: [id: number, value: string]; close: [] }>()
tuple('change', 'value'); tuple('pair', 7, 'value'); tuple('close')
// @ts-expect-error Tuple payload is checked.
tuple('change', 1)
// @ts-expect-error Required arguments are checked.
tuple('pair', 7)
interface Events { (event: 'change', value: string): void; (event: 'close'): void }
const overload = defineEmits<Events>()
overload('change', 'value'); overload('close')
// @ts-expect-error Overload payload is checked.
overload('change', 1)
const payload = defineEmits<{ select: { id: string }; delete: string }>()
payload('select', { id: 'one' }); payload('delete', 'one')
// @ts-expect-error Payload maps retain object shapes.
payload('select', { id: 1 })
const runtime = defineEmits(['change', 'close'])
runtime('change', 'value'); runtime('close')
// @ts-expect-error Runtime event names are checked.
runtime('absent')
`)
    await Bun.write(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: false, target: 'esnext', lib: ['esnext', 'dom'], module: 'esnext', moduleResolution: 'bundler', types: [], allowImportingTsExtensions: true }, files: ['consumer.ts'] }))
    const compiler = Bun.spawn(['bun', 'x', '--bun', 'tsc', '-p', join(root, 'tsconfig.json'), '--pretty', 'false'], { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe' })
    const [code, stdout, stderr] = await Promise.all([compiler.exited, new Response(compiler.stdout).text(), new Response(compiler.stderr).text()])
    expect(code, stdout + stderr).toBe(0)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30000)
