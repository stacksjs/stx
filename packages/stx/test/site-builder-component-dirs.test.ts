import { afterEach, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { buildStaticSite, componentDirOptions } from '../src/site-builder/build'

setDefaultTimeout(60000)

/**
 * A build resolves a component name to the file the dev server did.
 *
 * `serve()` takes `componentsDir` and `additionalComponentsDirs`, and a host
 * that layers its own components over a framework's uses them to say which
 * copy of a shared name wins. `buildStaticSite` had no such options, so the
 * same page built with whatever the project config and the conventions found
 * first: a desktop build drew a framework default `<CodeEditor>` in place of
 * the library one the author had been looking at in dev, and nothing said so.
 */
describe('buildStaticSite: component directories', () => {
  let cwd = ''
  let dir = ''
  let counter = 0

  async function write(rel: string, contents: string): Promise<void> {
    const file = path.join(dir, rel)
    await fs.promises.mkdir(path.dirname(file), { recursive: true })
    await Bun.write(file, contents)
  }

  async function build(options: Record<string, unknown>): Promise<string> {
    await buildStaticSite({ name: 'Test', url: 'https://example.com', pagesDir: 'views', outDir: 'dist', ...options } as any)
    return fs.promises.readFile(path.join(dir, 'dist/index.html'), 'utf8')
  }

  beforeEach(async () => {
    cwd = process.cwd()
    dir = path.join(import.meta.dir, `temp-component-dirs-${++counter}`)
    await write('views/index.stx', '<!DOCTYPE html>\n<html><head><title>t</title></head>\n<body>\n<Marker />\n<OnlyLast />\n</body></html>\n')
    await write('kit-a/Marker.stx', '<p data-from="kit-a">a</p>\n')
    await write('kit-b/Marker.stx', '<p data-from="kit-b">b</p>\n')
    await write('kit-c/Marker.stx', '<p data-from="kit-c">c</p>\n')
    await write('kit-c/OnlyLast.stx', '<p data-only="kit-c">c</p>\n')
    process.chdir(dir)
  })

  afterEach(async () => {
    process.chdir(cwd)
    await fs.promises.rm(dir, { recursive: true, force: true })
  })

  test('a name present in two directories resolves to the first', async () => {
    const html = await build({ componentsDir: 'kit-a', additionalComponentsDirs: ['kit-b', 'kit-c'] })

    expect(html).toContain('data-from="kit-a"')
    expect(html).not.toContain('data-from="kit-b"')
    expect(html).not.toContain('data-from="kit-c"')
  })

  test('the order given is the order searched', async () => {
    const html = await build({ componentsDir: 'kit-b', additionalComponentsDirs: ['kit-c', 'kit-a'] })

    expect(html).toContain('data-from="kit-b"')
    expect(html).not.toContain('data-from="kit-a"')
  })

  test('additional directories are searched in order, and supply what the first lacks', async () => {
    const html = await build({ componentsDir: 'kit-a', additionalComponentsDirs: ['kit-b', 'kit-c'] })

    expect(html).toContain('data-only="kit-c"')
  })

  test('with no primary directory, the first additional one that has the name wins', async () => {
    await write('empty/.keep', '')
    const html = await build({ componentsDir: 'empty', additionalComponentsDirs: ['kit-c', 'kit-b'] })

    expect(html).toContain('data-from="kit-c"')
    expect(html).not.toContain('data-from="kit-b"')
  })

  test('directories are resolved against where the build runs, and only those given are passed on', () => {
    expect(componentDirOptions({}, '/app')).toEqual({})
    expect(componentDirOptions({ componentsDir: 'kit', additionalComponentsDirs: ['a', '/abs/b'], fallbackComponentsDir: 'last' }, '/app')).toEqual({
      componentsDir: '/app/kit',
      additionalComponentsDirs: ['/app/a', '/abs/b'],
      fallbackComponentsDir: '/app/last',
    })
  })
})
