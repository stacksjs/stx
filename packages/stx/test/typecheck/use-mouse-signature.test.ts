import { afterAll, expect, test } from 'bun:test'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { createTempDir } from '../../src/temp-dir'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()
const dir = createTempDir('stx-mouse-types-')
afterAll(async () => { await Bun.$`rm -rf ${dir}`.quiet() })

test('demand-bundled mouse options and subscription state use their owning implementation types', async () => {
  const good = join(dir, 'card.stx')
  const bad = join(dir, 'invalid.stx')
  await Bun.write(good, `<script client>
const mouse = useMouse({ target: document.body, touch: false, resetOnLeave: true })
const stop = mouse.subscribe(({ clientX, clientY, isInside }) => {
  const x: number = clientX
  const y: number = clientY
  const inside: boolean = isInside
  console.log(x, y, inside)
})
stop()
mouse.stop()
</script>`)
  await Bun.write(bad, `<script client>
useMouse({ touch: 'yes' })
useMouse().subscribe(point => console.log(point.clientX.toUpperCase(), point.nonexistent))
</script>`)
  const result = await typecheckStxFiles([good, bad], { templates: false })
  expect(result.diagnostics.filter(d => d.file === good)).toEqual([])
  const invalid = result.diagnostics.filter(d => d.file === bad)
  expect(invalid.some(d => d.code === 2322)).toBe(true)
  expect(invalid.filter(d => d.code === 2339)).toHaveLength(2)
})
