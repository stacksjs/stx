import { expect, it } from 'bun:test'
import { extractScriptBlocks, formatTypecheckDiagnostics, typecheckStxFiles } from '../../src/typecheck'
import { stxReactivityDiagnostics } from '../../src/reactivity-diagnostics'
import { createTempDir } from '../../src/temp-dir'

it('reports a direct setup snapshot in a real stx typecheck at its authored line and column', async () => {
  const file = `${createTempDir('stx-reactivity-diagnostic-')}/Counter.stx`
  const source = `<script client>
import { state as signal } from 'stx'
const count = signal(0)
const label = count()
</script>
<div x-text="label"></div>`
  await Bun.write(file, source)
  const result = await typecheckStxFiles([file])
  expect(result.failure).toBeUndefined()
  const [warning] = result.diagnostics.filter(diagnostic => diagnostic.diagnosticId === 'STX_UNTRACKED_SETUP_READ')
  expect(warning).toMatchObject({ file, line: 4, column: 15, category: 'warning', blockKind: 'client' })
  expect(formatTypecheckDiagnostics([warning])).toContain(':4:15  warning STX_UNTRACKED_SETUP_READ')
})

it('handles ref reads on the opening line and ignores intentional, shadowed, and deferred reads', () => {
  const source = `<script client>const count = ref(0), snapshot = count.value
const intentional = peek(() => count.value)
const deferred = () => count.value
const label = derived(() => count.value)
const unused = count.value
const handlerOnly = count.value
</script>
<p>{{ snapshot }} {{ intentional }} {{ deferred() }} {{ label }}</p>
<button @click="console.log(handlerOnly)">Click</button>
<script client>
import { state } from './other'
const other = state(0)
const value = other()
</script>
<p>{{ value }}</p>`
  const warnings = stxReactivityDiagnostics('Example.stx', source, extractScriptBlocks(source))
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({ line: 1, column: 49 })
  expect(warnings[0].message).toContain('"snapshot" reads "count"')
})
