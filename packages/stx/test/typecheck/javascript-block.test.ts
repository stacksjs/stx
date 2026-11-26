/**
 * A block marked as JavaScript is checked as JavaScript (#2228).
 *
 * Every other client block is compiled as TypeScript before it ships, so it is
 * checked as TypeScript. `<script lang="js">` reaches the browser as written,
 * and checking it as TypeScript ignored its JSDoc while accepting an annotation
 * that would have shipped and broken the page.
 */

import { afterEach, describe, expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'
import { createTempDir } from '../../src/temp-dir'

allowForATypeScriptProgram()

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

// Outside the repo, so this repository's tsconfig cannot reach the fixture.
async function check(pages: Record<string, string>) {
  const dir = createTempDir('stx-js-block-')
  dirs.push(dir)
  const files: string[] = []
  for (const [name, content] of Object.entries(pages)) {
    await Bun.write(join(dir, name), content)
    files.push(join(dir, name))
  }
  const result = await typecheckStxFiles(files)
  expect(result.failure).toBeUndefined()
  return result.diagnostics.filter(d => d.code !== 0).map(d => `${d.file.split('/').pop()}:${d.line}:${d.column} TS${d.code}`)
}

const jsdoc = (attrs: string) => `<script${attrs}>
  (function () {
    /** @param {string} text */
    function a(text) { return text.length }
    function b(text) { return text.length }
    a('x'); b('y')
  })()
</script>`

describe('a <script lang="js"> block', () => {
  it('is typed by its JSDoc', async () => {
    expect(await check({ 'page.stx': jsdoc(' lang="js"') })).toEqual(['page.stx:5:16 TS7006'])
  })

  it('reports an annotation, which would ship to the browser as written', async () => {
    expect(await check({ 'page.stx': `<script lang="js">
  function a(text: string) { return text }
  a('x')
</script>` })).toEqual(['page.stx:2:20 TS8010'])
  })

  it('does not silence the rest of the run when it holds an annotation', async () => {
    expect(await check({
      'a.stx': `<script lang="js">\n  const x = (y: string) => y\n</script>`,
      'b.stx': `<script>\n  const n: number = 'not a number'\n</script>`,
    })).toEqual(['a.stx:2:17 TS8010', 'b.stx:2:9 TS2322'])
  })

  it('still sees server values, typed through an interpolation', async () => {
    expect(await check({ 'page.stx': `<script server>
const count = 3
</script>
<script lang="js">
  const t = {{ count }}
  console.log(t.toFixed(1), t.nope, missingName)
</script>` })).toEqual(['page.stx:6:31 TS2339', 'page.stx:6:37 TS2304'])
  })

  it('keeps its top-level names to itself', async () => {
    expect(await check({
      'a.stx': `<script lang="js">\n  const tip = 1\n  console.log(tip)\n</script>`,
      'b.stx': `<script lang="js">\n  const tip = 'b'\n  console.log(tip)\n</script>`,
    })).toEqual([])
  })

  it('accepts the js attribute too', async () => {
    expect(await check({ 'page.stx': jsdoc(' js') })).toEqual(['page.stx:5:16 TS7006'])
  })
})

describe('a plain <script> block', () => {
  // Compiled as TypeScript before it ships, so an annotation is the fix and
  // JSDoc is not read: the checker matches what the browser receives.
  it('is still checked as TypeScript', async () => {
    expect(await check({ 'page.stx': jsdoc('') })).toEqual(['page.stx:4:16 TS7006', 'page.stx:5:16 TS7006'])
  })
})
