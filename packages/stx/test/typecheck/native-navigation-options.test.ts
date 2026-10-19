import { afterAll, expect, test } from 'bun:test'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { createTempDir } from '../../src/temp-dir'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()
const dir = createTempDir('stx-native-navigation-types-')
afterAll(async () => { await Bun.$`rm -rf ${dir}`.quiet() })

test('native screen chrome options accept booleans and reject string values', async () => {
  const good = join(dir, 'auth.stx')
  const bad = join(dir, 'invalid.stx')
  const header = `import type { NativeCraft } from '@stacksjs/stx/native'
const craft = (globalThis as typeof globalThis & { craft: NativeCraft }).craft`
  await Bun.write(good, `<script client>
${header}
craft.navigation.setOptions({ hidden: true, tabBarHidden: true, swipeBack: false })
craft.navigation.open('/feed')
craft.navigation.setOptions({ hidden: false, tabBarHidden: false, swipeBack: true })
</script>`)
  await Bun.write(bad, `<script client>
${header}
craft.navigation.setOptions({ tabBarHidden: 'true' })
craft.navigation.setOptions({ swipeBack: 'false' })
</script>`)
  const result = await typecheckStxFiles([good, bad], { templates: false })
  expect(result.diagnostics.filter(d => d.file === good)).toEqual([])
  expect(result.diagnostics.filter(d => d.file === bad && d.code === 2322)).toHaveLength(2)
})
