/**
 * A prop read through `{{ }}` in a client script is typed as the prop
 * (stacksjs/stx#2180).
 *
 * The renderer resolves a script interpolation against the component's props
 * and writes the JSON literal in, wherever those props were declared -- and
 * they are usually declared in a bare `<script>`, which is not a server block.
 * Interpolations were inferred in the server block's scope only, so
 *
 *   const { issueId } = defineProps<Props>()     // <script>
 *   const autofixIssueId = {{ issueId }}         // <script client>
 *
 * failed the gate with "Cannot find name 'issueId'" on code that renders
 * correctly, and projects answered with a type-only `declare const` beside the
 * mustache or by muting the gate.
 *
 * Both directions are checked, because the fix that only removes the error is
 * the wrong one: the value has to arrive TYPED, so a wrong use is still
 * caught, and only the props binding crosses over -- a bare script is client
 * code, and its own signals are not something an interpolation can read.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { extractPropsDeclarations } from '../../src/stx-virtual-ts'
import { createTempDir } from '../../src/temp-dir'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()
const root = createTempDir('stx-props-interpolation-')
afterAll(() => rmSync(root, { recursive: true, force: true }))

async function check(name: string, source: string): Promise<string[]> {
  const file = join(root, name)
  await Bun.write(file, source)
  const result = await typecheckStxFiles([file])
  return result.diagnostics.map(d => `${d.line}:${d.column} TS${d.code} ${d.message}`)
}

describe('a prop interpolated into a client script', () => {
  it('checks clean in the reported shape', async () => {
    expect(await check('AutofixPanel.stx', `<script>
interface Props { issueId: string, projectId: string }
const { issueId, projectId } = defineProps<Props>()
</script>

<script client>
const autofixIssueId = {{ issueId }}
const autofixProjectId = {{ projectId }}
const upper: string = autofixIssueId.toUpperCase()
</script>
<div>{{ issueId }}</div>
`)).toEqual([])
  })

  it('arrives typed, so a wrong use of it is still an error', async () => {
    const diagnostics = await check('Wrong.stx', `<script>
interface Props { issueId: string }
const { issueId } = defineProps<Props>()
</script>
<script client>
const count: number = {{ issueId }}
</script>
<div>{{ issueId }}</div>
`)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toContain('TS2322')
    expect(diagnostics[0]).toMatch(/^6:/)
  })

  it('does not make the client names of the bare script readable', async () => {
    const diagnostics = await check('ClientOnly.stx', `<script>
interface Props { issueId: string }
const { issueId } = defineProps<Props>()
const draft = state('')
</script>
<script client>
const fromProp = {{ issueId }}
const fromSignal = {{ draft }}
</script>
<div>{{ issueId }}</div>
`)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toContain('TS2304')
    expect(diagnostics[0]).toContain('draft')
  })

  it('takes a multi-line withDefaults binding whole', async () => {
    expect(await check('Defaults.stx', `<script>
interface Props { issueId: string, retries?: number }
const { issueId, retries } = withDefaults(defineProps<Props>(), {
  retries: 3,
})
</script>
<script client>
const id: string = {{ issueId }}
const attempts = {{ retries }}
</script>
<div>{{ issueId }}</div>
`)).toEqual([])
  })
})

describe('extractPropsDeclarations', () => {
  it('lifts only the statement that binds props', () => {
    expect(extractPropsDeclarations(`interface Props { a: string }
const { a } = defineProps<Props>()
const draft = state('')
function helper() { const inner = defineProps<Props>(); return inner }
`)).toEqual(['const { a } = defineProps<Props>()'])
  })

  it('reads through comments and strings that mention the call', () => {
    expect(extractPropsDeclarations(`// const fake = defineProps<Props>()
const label = 'defineProps<Props>()'
`)).toEqual([])
  })
})
