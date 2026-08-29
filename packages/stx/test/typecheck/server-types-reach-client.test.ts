/**
 * A type declared in `<script server>` is nameable in `<script client>`
 * (stacksjs/stx#1924).
 *
 * The payload projection wraps the whole server body in a scope function so the
 * checker can infer each published VALUE's type from real code. That works for
 * values and traps types: an `interface AutofixState` declared beside the value
 * it describes lives inside that function, so a client block annotating with it
 * got `Cannot find name 'AutofixState'` — an error about code that is correct
 * and runs.
 *
 * The two blocks are one file and authors write them as one unit. A type is not
 * data: it does not cross the bridge at runtime and needs no payload entry, so
 * there was nothing the author could add to make it resolve.
 *
 * This mattered beyond the noise. It was reported as "single-file mode
 * over-reports", offered as the reason single-file checking is not a usable
 * fallback — which, combined with the glob run reporting nothing at all, left
 * no configuration that answered "does this project typecheck".
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { extractTypeDeclarations } from '../../src/stx-virtual-ts'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const dir = join(tmpdir(), `stx-server-types-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, source: string): Promise<Awaited<ReturnType<typeof typecheckStxFiles>>> {
  const file = join(dir, name)
  await Bun.write(file, source)
  return typecheckStxFiles([file], { templates: false })
}

describe('a type declared in the server block', () => {
  it('is nameable in the client block', async () => {
    const result = await check('payload.stx', `<script server>
interface AutofixRun { id: string }
interface AutofixState { runs: AutofixRun[] }
const state: AutofixState = { runs: [] }
defineClientPayload({ state })
</script>
<script client>
const local: AutofixState = state
const first: AutofixRun | undefined = local.runs[0]
</script>
<main>x</main>`)

    expect(result.diagnostics.map(d => d.code)).not.toContain(2304)
    expect(result.diagnostics).toHaveLength(0)
  })

  it('is nameable without a declared payload too', async () => {
    // The scraping bridge path. The type is just as absent there, and the
    // author has even less to reach for.
    const result = await check('scraped.stx', `<script server>
type Row = { id: string }
const rows: Row[] = []
</script>
<script client>
const first: Row | undefined = rows[0]
</script>
<main>x</main>`)

    expect(result.diagnostics.map(d => d.code)).not.toContain(2304)
  })

  it('does not stop the client block reporting its own errors', async () => {
    // The point is to remove an invented error, not to stop checking.
    const result = await check('still-checked.stx', `<script server>
interface Shape { id: string }
const shape: Shape = { id: 'a' }
defineClientPayload({ shape })
</script>
<script client>
const bad: number = "definitely not a number"
const wrong: Shape = { id: 42 }
</script>
<main>x</main>`)

    expect(result.diagnostics.map(d => d.code)).toContain(2322)
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(2)
  })

  it('lets the client block win when it declares the same name', async () => {
    // A local definition shadows rather than collides with the one lifted over
    // it — otherwise carrying types across would introduce TS2300.
    const result = await check('shadowed.stx', `<script server>
interface Conflict { fromServer: string }
const value: Conflict = { fromServer: 'a' }
defineClientPayload({ value })
</script>
<script client>
interface Conflict { fromClient: number }
const mine: Conflict = { fromClient: 1 }
</script>
<main>x</main>`)

    expect(result.diagnostics.map(d => d.code)).not.toContain(2300)
    expect(result.diagnostics.map(d => d.code)).not.toContain(2304)
  })
})

describe('extractTypeDeclarations', () => {
  it('finds an interface with its body, and a multi-line union', () => {
    const found = extractTypeDeclarations([
      'interface Run { id: string, nested: { deep: boolean } }',
      'export type Status =',
      "  | 'idle'",
      "  | 'busy'",
      'const notAType = 1',
    ].join('\n'))

    expect(found.map(f => f.name)).toEqual(['Run', 'Status'])
    expect(found[0].text).toContain('nested: { deep: boolean }')
    expect(found[1].text).toContain("'busy'")
    // `export` is dropped: these are spliced into a buffer, not re-exported.
    expect(found[1].text.startsWith('type ')).toBe(true)
  })

  it('ignores a type declared inside a function', () => {
    // Depth-zero only. Lifting a helper's local type out of the scope it
    // belongs to would change what the name means.
    const found = extractTypeDeclarations('function helper() {\n  interface Local { a: string }\n  return 1\n}')

    expect(found).toEqual([])
  })

  it('ignores type-shaped text in a comment or a string', () => {
    const found = extractTypeDeclarations([
      '// interface Commented { a: string }',
      'const sql = "interface Quoted { a: string }"',
    ].join('\n'))

    expect(found).toEqual([])
  })
})
