/**
 * A `{{-- --}}` comment inside a script block (#2226).
 *
 * The engine strips template comments from the whole file before anything else
 * runs, so one inside a `<script>` never ships. The checker read it as code: a
 * run of syntax errors, which also held back type checking for every other file.
 */

import { afterEach, describe, expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { extractScriptBlocks } from '../../src/stx-virtual-ts'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'
import { createTempDir } from '../../src/temp-dir'

allowForATypeScriptProgram()

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

async function check(pages: Record<string, string>) {
  const dir = createTempDir('stx-template-comment-')
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

describe('a {{-- --}} comment inside a script block', () => {
  it.each(['', ' client', ' server'])('is not read as code in <script%s>', async (attrs) => {
    expect(await check({ 'page.stx': `<script${attrs}>
  const n = 1
  {{-- a template comment, stripped before render --}}
  console.log(n)
</script>` })).toEqual([])
  })

  it('keeps the lines after a multi-line comment where they are', async () => {
    expect(await check({ 'page.stx': `<script>
  {{--
    Explains the block.
  --}}
  const n: number = 'not a number'
</script>` })).toEqual(['page.stx:5:9 TS2322'])
  })

  it('no longer holds back checking for the other files in the run', async () => {
    expect(await check({
      'a.stx': `<script>\n  {{-- note --}}\n  const a = 1\n</script>`,
      'b.stx': `<script>\n  const b: string = 2\n</script>`,
    })).toEqual(['b.stx:2:9 TS2322'])
  })

  it('is blanked in the extracted body, which keeps its length and lines', () => {
    const source = `<script>\n  {{-- a\n  b --}}\n  go()\n</script>`
    const [block] = extractScriptBlocks(source)
    expect(block!.code).not.toContain('{{--')
    expect(block!.code.length).toBe(source.indexOf('</script>') - source.indexOf('>') - 1)
    expect(block!.code.split('\n').length).toBe(5)
    expect(block!.code).toContain('go()')
  })
})
