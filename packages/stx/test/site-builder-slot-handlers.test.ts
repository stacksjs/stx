import { afterEach, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { buildStaticSite } from '../src/site-builder/build'

setDefaultTimeout(60000)

/**
 * Handlers authored in a page keep the page's scope when they sit in a slot
 * (stacksjs/stx#2139).
 *
 * `<DialogPanel>` is a component with its own client script, so its template is
 * processed on its own. A slotted `<button @click="pageFunction()">` carries no
 * reactive binding of its own, and in 0.2.719 the component pass decided there
 * was no reactive context, stripped the attribute and rebound it imperatively
 * to the bare name. The name lives in the page's setup closure, so every click
 * threw `ReferenceError`. The page's own signal script has to own the handler,
 * exactly as it does outside a component.
 *
 * Asserting the built HTML is the only form of this test that sees it: the
 * markup keeps `@click` for the runtime, and no id-keyed imperative binding
 * is generated for the panel.
 */
describe('buildStaticSite: handlers in component slots', () => {
  let cwd = ''
  let dir = ''
  let counter = 0

  beforeEach(async () => {
    cwd = process.cwd()
    dir = path.join(import.meta.dir, `temp-slot-handlers-${++counter}`)
    await fs.promises.mkdir(path.join(dir, 'views'), { recursive: true })
    await Bun.write(
      path.join(dir, 'views/index.stx'),
      `<script client>
const target = state<string | null>('x')
function cancelTarget(): void { target.set(null) }
</script>
<!DOCTYPE html>
<html><head><title>t</title></head>
<body>
<Dialog :open="target() !== null" @close="cancelTarget()">
  <DialogBackdrop />
  <DialogPanel :flush="true" variant="center">
    <DialogTitle as="h2">Tear down {{ target() }}?</DialogTitle>
    <button type="button" class="keep" autofocus @click="cancelTarget()">Keep</button>
  </DialogPanel>
</Dialog>
</body></html>\n`,
    )
    process.chdir(dir)
  })

  afterEach(async () => {
    process.chdir(cwd)
    await fs.promises.rm(dir, { recursive: true, force: true })
  })

  test('a slotted @click stays with the page runtime instead of a bare-name binding', async () => {
    await buildStaticSite({ name: 'Test', url: 'https://example.com', pagesDir: 'views', outDir: 'dist' } as any)

    const html = await fs.promises.readFile(path.join(dir, 'dist/index.html'), 'utf8')
    const keep = html.match(/<button[^>]*class="keep"[^>]*>/)?.[0] ?? ''

    expect(keep).toContain('@click="cancelTarget()"')
    expect(html).not.toContain('__stx_evt_stx_dialog_panel')
  })
})
