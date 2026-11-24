import { expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderTemplate } from '../../src/render'

it('renders relative server imports when the resolved path needs JavaScript escaping', async () => {
  const root = await mkdtemp(join(tmpdir(), "stx's-server-imports-"))
  const view = join(root, 'views', 'page.stx')
  try {
    await Promise.all([
      Bun.write(join(root, 'data.ts'), 'export default { ready: false }; export const label = "data"'),
      Bun.write(join(root, 'setup.ts'), 'import data from "./data"; data.ready = true'),
      Bun.write(view, `
<script server>
import '../setup'
import data from '../data'
import { label as named } from '../data'
const dynamic = (await import('../data')).label
const rendered = [data.ready, named, dynamic].join(':')
</script>
<p>{{ rendered }}</p>
`),
    ])
    expect(await renderTemplate(view)).toContain('<p>true:data:data</p>')
  }
  finally {
    await rm(root, { recursive: true, force: true })
  }
})
