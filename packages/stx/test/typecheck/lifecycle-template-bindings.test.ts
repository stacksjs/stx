import { afterAll, expect, test } from 'bun:test'
import { join } from 'node:path'
import { createTempDir } from '../../src/temp-dir'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'
allowForATypeScriptProgram()
const directory = createTempDir('stx-template-lifecycle-')
afterAll(async () => { await Bun.$`rm -rf ${directory}`.quiet() })
async function check(handler: string) {
  const file = join(directory, `${handler.includes('missing') ? 'invalid' : 'valid'}.stx`)
  await Bun.write(file, `<script client>
let game: { save: () => void } | null = null
onMount(() => { game = { save() {} } })
</script>
<button @click="${handler}">Save</button>
@if(game)
  <p>{{ game.save() }}</p>
@endif`)
  return typecheckStxFiles([file])
}
test('template checks retain the declared type of controllers assigned after mounting', async () => {
  expect((await check('game?.save()')).diagnostics).toEqual([])
})
test('deferred controller bindings still reject unknown methods with source locations', async () => {
  const result = await check('game?.missing()')
  expect(result.diagnostics.some(d => d.code === 2339 && d.message.includes('missing') && d.line === 5)).toBe(true)
})
