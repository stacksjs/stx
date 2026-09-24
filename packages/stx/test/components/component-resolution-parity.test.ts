import { afterEach, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ComponentRegistry } from '../../src/component-registry'
import { resolveComponentFileSync } from '../../src/component-resolution'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true })
})

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'stx-lookup-'))
  directories.push(dir)
  return { dir, page: join(dir, 'pages/page.stx'), components: join(dir, 'global') }
}

it('shares rendering precedence, including original-page context and nested folders', async () => {
  const { dir, page, components } = fixture()
  const registry = new ComponentRegistry()
  const original = join(dir, 'original/components/ValueCard.stx')
  const global = join(components, 'nested/ValueCard.stx')
  const local = join(dir, 'pages/components/ValueCard.stx')
  for (const file of [original, global, local])
    await Bun.write(file, '<div></div>')
  const options = { componentsDir: components }
  const context = { __originalFilePath: join(dir, 'original/page.stx') }
  expect(resolveComponentFileSync('value-card', page, options, context)).toBe(original)
  expect(await registry.resolveFile('value-card', page, options, context)).toBe(original)
  expect(resolveComponentFileSync('ValueCard', page, options)).toBe(global)
  expect(await registry.resolveFile('ValueCard', page, options)).toBe(global)
  expect(resolveComponentFileSync('ValueCard', page)).toBe(local)
  expect(await registry.resolveFile('ValueCard', page, {})).toBe(local)
})

it('shares explicit aliases, relative paths, extensions, and missing-file behavior', async () => {
  const { dir, page, components } = fixture()
  const registry = new ComponentRegistry()
  const file = join(dir, 'shared/Counter.stx')
  await Bun.write(file, '<div></div>')
  const context = { __importedComponents: new Map([['my-counter', file]]) }
  for (const [name, ctx] of [['MyCounter', context], ['../shared/Counter', undefined], ['../shared/Counter.stx', undefined]] as const) {
    expect(resolveComponentFileSync(name, page, { componentsDir: components }, ctx)).toBe(file)
    expect(await registry.resolveFile(name, page, { componentsDir: components }, ctx)).toBe(file)
  }
  expect(resolveComponentFileSync('Missing', page)).toBeNull()
  expect(await registry.resolveFile('Missing', page, {})).toBeNull()
})

it('does not retain a stale missing-file result when a component is created', async () => {
  const { page, components } = fixture()
  expect(resolveComponentFileSync('NewCard', page, { componentsDir: components })).toBeNull()
  const file = join(components, 'NewCard.stx')
  await Bun.write(file, '<div></div>')
  expect(resolveComponentFileSync('NewCard', page, { componentsDir: components })).toBe(file)
})
