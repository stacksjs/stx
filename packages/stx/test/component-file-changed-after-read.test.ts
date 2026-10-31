/**
 * A component file rewritten after the server read it renders the new content.
 *
 * Created as a one-line stub and then overwritten, a component kept rendering
 * the stub until the file was touched again: the content cache was trusted
 * until something cleared it, and a read that fell between the two writes left
 * nothing to say the file had changed.
 */
import { afterEach, beforeEach, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { processDirectives } from '../src/process'
import { createTempDir } from '../src/temp-dir'
import { clearComponentCache } from '../src/utils'

let dir = ''
beforeEach(() => {
  dir = createTempDir('stx-component-rewrite-')
  clearComponentCache()
})
afterEach(() => clearComponentCache())

const render = (): Promise<string> =>
  processDirectives('<main><Note /></main>', {}, path.join(dir, 'page.stx'), { componentsDir: dir, cache: false, autoShell: false } as never, new Set<string>())

it('renders the replacement, not the stub it read first', async () => {
  const file = path.join(dir, 'Note.stx')
  fs.writeFileSync(file, '<p>stub</p>')
  expect(await render()).toContain('stub')

  fs.writeFileSync(file, '<section class="real"><h2>The real note list</h2></section>')
  // The write lands inside the same millisecond the stub was stamped with.
  const before = fs.statSync(file)
  fs.utimesSync(file, before.atime, new Date(Math.floor(before.mtimeMs)))
  const html = await render()

  expect(html).toContain('The real note list')
  expect(html).not.toContain('stub')
})
