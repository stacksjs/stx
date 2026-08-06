/**
 * A wrong layout name is a type error (stacksjs/stx#1879 ask 3).
 *
 * Now that `definePageMeta({ layout })` actually selects a layout, the name is
 * load-bearing — and a typo produces exactly the same unlayouted render as a
 * correct name pointing at a missing file. Nuxt types `layout` as a union of
 * the files on disk for this reason.
 *
 * The trap this file guards against: the existing route-type generator emits
 * `declare module "stx/routes" { interface RouteMap … }`, and nothing in the
 * source tree declares or imports `stx/routes` — so that map cannot make
 * anything a type error. It is the same "typed and never read" shape #1879 is
 * about, one level up. A unit test over the emitted STRING would pass just as
 * happily for that dangling version, so the decisive test here runs real `tsc`
 * over a real project and asserts the error actually fires.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { discoverLayoutNames, generateLayoutTypes, LAYOUT_TYPES_FILE, renderLayoutTypes } from '../src/layout-types'

let dir = ''

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-layout-types-'))
  fs.mkdirSync(path.join(dir, 'layouts'), { recursive: true })
})

afterEach(() => {
  if (dir)
    fs.rmSync(dir, { recursive: true, force: true })
})

function layout(name: string): void {
  const file = path.join(dir, 'layouts', `${name}.stx`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `<div>@yield('content')</div>\n`)
}

describe('discovering layouts', () => {
  it('lists the .stx files by name', () => {
    layout('app')
    layout('marketing')

    expect(discoverLayoutNames(path.join(dir, 'layouts'))).toEqual(['app', 'marketing'])
  })

  it('keeps the path for nested layouts, which the resolver accepts', () => {
    layout('admin/settings')

    expect(discoverLayoutNames(path.join(dir, 'layouts'))).toEqual(['admin/settings'])
  })

  it('excludes _layout.stx, which is applied by position and never named', () => {
    layout('app')
    fs.writeFileSync(path.join(dir, 'layouts', '_layout.stx'), '<div></div>\n')

    expect(discoverLayoutNames(path.join(dir, 'layouts'))).toEqual(['app'])
  })

  it('returns nothing for a directory that does not exist', () => {
    expect(discoverLayoutNames(path.join(dir, 'nope'))).toEqual([])
  })
})

describe('the emitted declaration', () => {
  it('augments the real package, not a synthetic specifier', () => {
    // `declare module "stx/routes"` is why the route map constrains nothing.
    const text = renderLayoutTypes(['app'])

    expect(text).toContain(`declare module '@stacksjs/stx'`)
    expect(text).toContain('interface KnownLayouts')
    expect(text).toContain(`'app': true`)
  })

  it('constrains nothing when there are no layouts, and says so', () => {
    // An empty interface leaves `keyof KnownLayouts` as `never`, which widens
    // back to `string` — emitting it silently would look like a constraint.
    const text = renderLayoutTypes([])

    expect(text).not.toContain('KnownLayouts')
    expect(text).toContain('stays typed as')
  })

  it('writes the file and rewrites only on change', () => {
    layout('app')
    const target = path.join(dir, '.stx', LAYOUT_TYPES_FILE)

    generateLayoutTypes(path.join(dir, 'layouts'), path.join(dir, '.stx'))
    const firstMtime = fs.statSync(target).mtimeMs

    generateLayoutTypes(path.join(dir, 'layouts'), path.join(dir, '.stx'))

    // An unchanged rewrite would make every render look like an edit to a
    // watcher.
    expect(fs.statSync(target).mtimeMs).toBe(firstMtime)
  })

  it('does not throw when there is no layouts directory configured', () => {
    expect(() => generateLayoutTypes(undefined, path.join(dir, '.stx'))).not.toThrow()
  })
})

// The decisive test: a string-shaped assertion above would pass for a dangling
// declaration too. This compiles a real project against the real package.
describe('type checking a real project', () => {
  let project = ''
  let linkError = ''

  beforeAll(() => {
    project = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-layout-tsc-'))
    fs.mkdirSync(path.join(project, 'layouts'), { recursive: true })
    fs.writeFileSync(path.join(project, 'layouts', 'app.stx'), '<div></div>\n')
    fs.writeFileSync(path.join(project, 'layouts', 'marketing.stx'), '<div></div>\n')

    // Point @stacksjs/stx at this checkout.
    const modules = path.join(project, 'node_modules', '@stacksjs')
    fs.mkdirSync(modules, { recursive: true })
    try {
      fs.symlinkSync(path.resolve(import.meta.dir, '..'), path.join(modules, 'stx'), 'dir')
    }
    catch (e) {
      // Recorded, not swallowed. A silent skip here would leave the only test
      // that can catch a dangling declaration passing because it ran nothing.
      linkError = String(e)
    }

    generateLayoutTypes(path.join(project, 'layouts'), path.join(project, '.stx'))

    fs.writeFileSync(path.join(project, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        moduleResolution: 'bundler',
        module: 'esnext',
        target: 'esnext',
        skipLibCheck: true,
      },
      include: ['*.ts', '.stx/*.d.ts'],
    }))
  })

  afterAll(() => {
    if (project)
      fs.rmSync(project, { recursive: true, force: true })
  })

  async function check(source: string): Promise<string> {
    fs.writeFileSync(path.join(project, 'page.ts'), source)
    const proc = Bun.spawn(['bunx', '--bun', 'tsc', '--noEmit', '-p', 'tsconfig.json'], {
      cwd: project,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
    await proc.exited
    return out + err
  }

  it('rejects a layout name with no layout behind it', async () => {
    expect(linkError).toBe('')

    const output = await check(
      `import { definePageMeta } from '@stacksjs/stx'\ndefinePageMeta({ layout: 'aap' })\n`,
    )

    expect(output).toContain('aap')
    expect(output).toMatch(/error TS/)
  }, 120_000)

  it('accepts a layout that exists, and false', async () => {
    expect(linkError).toBe('')

    const output = await check(
      `import { definePageMeta } from '@stacksjs/stx'\n`
      + `definePageMeta({ layout: 'app' })\n`
      + `definePageMeta({ layout: 'marketing' })\n`
      + `definePageMeta({ layout: false })\n`,
    )

    expect(output).not.toMatch(/error TS/)
  }, 120_000)
})
