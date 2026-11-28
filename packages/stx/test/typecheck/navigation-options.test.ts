import { afterAll, expect, test } from 'bun:test'
import { join } from 'node:path'
import { createTempDir } from '../../src/temp-dir'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()
const dir = createTempDir('stx-navigation-types-')
afterAll(async () => { await Bun.$`rm -rf ${dir}`.quiet() })

test('template navigation accepts a boolean instant option', async () => {
  const valid = join(dir, 'valid.stx')
  const invalid = join(dir, 'invalid.stx')
  await Bun.write(valid, `<script client>
navigate('/dashboard', { instant: true, replace: true })
</script>`)
  await Bun.write(invalid, `<script client>
navigate('/dashboard', { instant: 'true' })
</script>`)

  const result = await typecheckStxFiles([valid, invalid], { templates: false })
  expect(result.diagnostics.filter(diagnostic => diagnostic.file === valid)).toEqual([])
  expect(result.diagnostics.filter(diagnostic => diagnostic.file === invalid).map(diagnostic => diagnostic.code)).toEqual([2322])
})
