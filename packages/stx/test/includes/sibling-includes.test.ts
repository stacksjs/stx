import { expect, it } from 'bun:test'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { processIncludes } from '../../src/includes'
import { createTempDir } from '../../src/temp-dir'

it('expands sibling and nested includes in order without moving surrounding markup', async () => {
  const dir = createTempDir('stx-include-batching-')
  const card = join(dir, 'card.stx')
  const label = join(dir, 'label.stx')
  await writeFile(card, '<article>@include("label", { value: title })</article>')
  await writeFile(label, '<b>{{ value }}</b>')
  const template = '<main>@include("card", { title: "First" })<hr>@include("card", { title: "Second" })</main>'
  const dependencies = new Set<string>()
  const html = await processIncludes(template, {}, join(dir, 'page.stx'), { partialsDir: dir }, dependencies)

  expect(html).toBe('<main><article><b>First</b></article><hr><article><b>Second</b></article></main>')
  expect(dependencies).toEqual(new Set([card, label]))
})
