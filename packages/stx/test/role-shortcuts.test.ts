/**
 * The role shortcuts generate, and generate from the roles: a primary button
 * is the accent fill, so an app's role answers decide its colour.
 */
import { rmSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { generateCss } from '../src/dev-server/ts-css'
import { roleShortcuts } from '../src/role-shortcuts'
import { createTempDir } from '../src/temp-dir'

const REPO = path.resolve(import.meta.dir, '../../..')
let root = ''

beforeAll(() => {
  root = createTempDir('stx-role-shortcuts-')
  writeFileSync(path.join(root, 'css.config.ts'), `import { roleShortcuts } from ${JSON.stringify(path.join(import.meta.dir, '../src/role-shortcuts'))}\nexport default { shortcuts: { ...roleShortcuts } }\n`)
  symlinkSync(path.join(REPO, 'node_modules'), path.join(root, 'node_modules'))
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('roleShortcuts', () => {
  it('emits a rule for every shortcut', async () => {
    const names = Object.keys(roleShortcuts)
    const css = await generateCss(`<div class="${names.join(' ')}"></div>`, root)
    const missing = names.filter(name => !new RegExp(`(?:^|\\n)\\.${name}\\s*\\{`).test(css))
    expect(missing).toEqual([])
  })

  it('paints a primary button with the accent roles, and sizes it with the element\'s own utilities', async () => {
    const css = await generateCss('<button class="btn-primary min-h-12 px-4"></button>', root)
    const rule = css.slice(css.search(/(?:^|\n)\.btn-primary\s*\{/))
    expect(rule.slice(0, rule.indexOf('}'))).toContain('--stx-accent-solid')
    expect(roleShortcuts['btn-primary']).not.toMatch(/\b(?:min-h|h|px|py|text-(?:xs|sm|base|lg))-/)
  })
})
