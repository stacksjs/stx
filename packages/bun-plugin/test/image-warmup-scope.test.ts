import { afterAll, describe, expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import type { StxOptions } from '@stacksjs/stx'
import { createTempDir } from '../../stx/src/temp-dir'
import { projectUsesImageBuiltins } from '../src/serve'

const dirs: string[] = []
afterAll(async () => {
  await Promise.all(dirs.map(dir => rm(dir, { recursive: true, force: true })))
})

async function detect(files: Record<string, string>, options: Partial<StxOptions> = {}, pages = ['views/index.stx']): Promise<boolean> {
  const root = createTempDir('stx-image-scope-')
  dirs.push(root)
  for (const [name, source] of Object.entries(files))
    await Bun.write(path.join(root, name), source)
  return projectUsesImageBuiltins(root, {
    pages,
    options: {
      root,
      componentsDir: path.join(root, 'components'),
      layoutsDir: path.join(root, 'layouts'),
      partialsDir: path.join(root, 'partials'),
      ...Object.fromEntries(Object.entries(options).map(([key, value]) => [key, typeof value === 'string' ? path.resolve(root, value) : value])),
    },
  })
}

describe('served image template scope (#2113)', () => {
  it('ignores unserved defaults, excluded pages, and unused resources', async () => {
    expect(await detect({
      'views/index.stx': '<img src="/atlas.png">',
      'views/excluded.stx': '<StxImage src="/hero.jpg" />',
      'storage/framework/defaults/resources/views/index.stx': '<StxImage src="/hero.jpg" />',
      'layouts/unused.stx': '@image("/hero.jpg")',
      'partials/unused.stx': '<StxImage src="/hero.jpg" />',
    })).toBe(false)
  })

  it('counts discovered entries outside cwd and non-stx pages', async () => {
    expect(await detect({ 'pages/start.html': '@image("/hero.jpg")' }, {}, ['pages/start.html'])).toBe(true)
  })

  it('still follows a page excluded from routing when it is explicitly included', async () => {
    expect(await detect({
      'views/index.stx': '@include("./excluded")',
      'views/excluded.stx': '<StxImage src="/hero.jpg" />',
    })).toBe(true)
  })

  it('follows a selected layout and nested relative partials without executing scripts', async () => {
    expect(await detect({
      'views/index.stx': '@extends("shell")',
      'layouts/shell.stx': '@include("card")',
      'partials/card.stx': '<script server>throw new Error("must not execute")</script>@include("./photo")',
      'partials/photo.stx': '<StxImage src="/hero.jpg" />',
    })).toBe(true)
  })

  it('follows fallback layouts but lets the app override them', async () => {
    const files = {
      'views/index.stx': '@layout("layouts/shell")',
      'defaults/layouts/shell.stx': '<StxImage src="/hero.jpg" />',
    }
    expect(await detect(files, { fallbackLayoutsDir: 'defaults/layouts' })).toBe(true)
    expect(await detect({ ...files, 'layouts/shell.stx': '<main>app</main>' }, { fallbackLayoutsDir: 'defaults/layouts' })).toBe(false)
  })

  it('follows used nested wrappers in configured fallback component directories', async () => {
    const files = {
      'views/index.stx': '<Hero />',
      'defaults/ui/cards/Hero.stx': '<hero-photo />',
      'defaults/ui/cards/HeroPhoto.stx': '<StxImage src="/hero.jpg" />',
    }
    expect(await detect(files, { fallbackComponentsDir: 'defaults/ui' })).toBe(true)
    expect(await detect({ ...files, 'views/index.stx': '<img src="/atlas.png">' }, { fallbackComponentsDir: 'defaults/ui' })).toBe(false)
    expect(await detect({ ...files, 'components/Hero.stx': '<main>app</main>' }, { fallbackComponentsDir: 'defaults/ui' })).toBe(false)
  })

  it('follows explicit component imports and component directives', async () => {
    expect(await detect({
      'views/index.stx': '@import("./cards/photo")<Photo />',
      'views/cards/photo.stx': '<StxImage src="/hero.jpg" />',
    })).toBe(true)
    expect(await detect({
      'views/index.stx': '@component("./cards/photo")@endcomponent',
      'views/cards/photo.stx': '@image("/hero.jpg")',
    })).toBe(true)
    expect(await detect({
      'views/index.stx': '@import("./cards/photo")<main>unused import</main>',
      'views/cards/photo.stx': '<StxImage src="/hero.jpg" />',
    })).toBe(false)
  })

  it('checks conditional includes conservatively and terminates cycles', async () => {
    expect(await detect({
      'views/index.stx': '@includeWhen(check(a, "b,c"), "photo", { caption: "x,y" })',
      'partials/photo.stx': '<StxImage src="/hero.jpg" />',
    })).toBe(true)
    expect(await detect({
      'views/index.stx': '@includeFirst(["missing", "a"])',
      'partials/a.stx': '@include("b")',
      'partials/b.stx': '@include("a")<img src="/atlas.png">',
    })).toBe(false)
    expect(await detect({
      'views/index.stx': '@includeFirst(["plain", "photo"])',
      'partials/plain.stx': '<main>first match</main>',
      'partials/photo.stx': '<StxImage src="/hero.jpg" />',
    })).toBe(false)
  })

  it('checks only used components from explicitly configured plugin directories', async () => {
    const root = createTempDir('stx-image-plugin-')
    dirs.push(root)
    const pages = ['views/index.stx']
    const pluginComponentDirs = [path.join(root, 'node_modules/test-ui/dist')]
    await Bun.write(path.join(root, 'node_modules/test-ui/dist/Hero.stx'), '<StxImage src="/hero.jpg" />')
    await Bun.write(path.join(root, pages[0]), '<Hero />')
    expect(await projectUsesImageBuiltins(root, { pages, options: {}, pluginComponentDirs })).toBe(true)
    await Bun.write(path.join(root, pages[0]), '<main>unused</main>')
    expect(await projectUsesImageBuiltins(root, { pages, options: {}, pluginComponentDirs })).toBe(false)
  })
})
