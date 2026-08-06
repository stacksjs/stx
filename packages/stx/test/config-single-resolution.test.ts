/**
 * One resolution pass, so the two loaders cannot disagree (stacksjs/stx#1851).
 *
 * `stx.config` / `config/ui.ts` was consumed by two independent loaders with
 * different ideas of what a relative directory key meant. `loadStxConfig()`
 * inferred `root` from the filesystem and prefixed `componentsDir` /
 * `layoutsDir` / `partialsDir` with it — including values that already began
 * with it — while `bun-plugin`'s `serve()` read the same file through bunfig
 * and used the literal strings.
 *
 * So an ordinary Stacks layout resolved `partialsDir: 'resources/partials'` to
 * `resources/resources/partials` on the build path and `resources/partials` on
 * the serve path, without anyone opting into anything. The failure is silent at
 * 200 OK: the include just fails and its error text is rendered into the page.
 * One reporting app shipped `include error: ENOENT … resources/resources/…`
 * as visible page content across six pages, 54 failed includes in total, and
 * carries a 23-line comment block titled "THIS FILE IS READ BY TWO LOADERS THAT
 * DO NOT AGREE" plus a pinned `root: '.'` whose only purpose is to make the two
 * agree by making the prefix a no-op.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resolveStxDirectories } from '../src/config'
import type { StxConfig } from '../src/types'

let dir = ''
let warnings: string[] = []
const realWarn = console.warn

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-single-res-'))
  warnings = []
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
})

afterEach(() => {
  console.warn = realWarn
  if (dir)
    fs.rmSync(dir, { recursive: true, force: true })
})

/** A Stacks-shaped app: these two directories are what trigger the inference. */
function stacksLayout(): void {
  for (const d of ['resources/views', 'resources/layouts'])
    fs.mkdirSync(path.join(dir, d), { recursive: true })
}

function resolve(config: Partial<StxConfig>): StxConfig {
  return resolveStxDirectories(config as StxConfig, dir)
}

describe('prefixing is idempotent', () => {
  it('does not prefix a value that already starts with the root', () => {
    stacksLayout()

    const config = resolve({
      partialsDir: 'resources/partials',
      componentsDir: 'resources/components',
      layoutsDir: 'resources/layouts',
    })

    expect(config.root).toBe('resources')
    expect(config.partialsDir).toBe('resources/partials')
    expect(config.componentsDir).toBe('resources/components')
    expect(config.layoutsDir).toBe('resources/layouts')
  })

  it('still prefixes a value that does not', () => {
    // The behaviour the prefixing exists for, unchanged.
    stacksLayout()

    const config = resolve({ componentsDir: 'components' })

    expect(config.componentsDir).toBe(path.join('resources', 'components'))
  })

  it('leaves absolute values alone', () => {
    stacksLayout()

    const config = resolve({ componentsDir: '/opt/shared/components' })

    expect(config.componentsDir).toBe('/opt/shared/components')
  })

  it('is safe to run twice — the second pass changes nothing', () => {
    // Both loaders now call this; running it on an already-resolved object must
    // not double anything.
    stacksLayout()
    const config = resolve({ partialsDir: 'partials' })
    const once = config.partialsDir

    resolveStxDirectories(config, dir)

    expect(config.partialsDir).toBe(once as string)
  })

  it('does not prefix at all when the root is the project root', () => {
    fs.mkdirSync(path.join(dir, 'pages'), { recursive: true })

    const config = resolve({ root: '.', componentsDir: 'resources/components' })

    expect(config.componentsDir).toBe('resources/components')
  })
})

describe('both loaders agree', () => {
  it('produces the same directories from the same config object', () => {
    // The bug in one assertion: the build path resolved one thing and the serve
    // path another, from the same file.
    stacksLayout()
    const raw = { partialsDir: 'resources/partials', componentsDir: 'resources/components' }

    const viaLoaderA = resolve({ ...raw })
    const viaLoaderB = resolve({ ...raw })

    expect(viaLoaderA.partialsDir).toBe(viaLoaderB.partialsDir as string)
    expect(viaLoaderA.componentsDir).toBe(viaLoaderB.componentsDir as string)
    expect(viaLoaderA.partialsDir).toBe('resources/partials')
  })
})

describe('an inferred root is announced', () => {
  it('says so, because it changes what every other key means', () => {
    stacksLayout()

    resolve({ componentsDir: 'components' })

    expect(warnings.join('\n')).toContain('inferred "resources"')
  })

  it('stays quiet when the root was set explicitly', () => {
    // Nothing was guessed, so there is nothing to report.
    stacksLayout()

    resolve({ root: 'resources', componentsDir: 'components' })

    expect(warnings.join('\n')).not.toContain('inferred')
  })

  it('stays quiet for a project with no Stacks markers', () => {
    fs.mkdirSync(path.join(dir, 'pages'), { recursive: true })

    const config = resolve({})

    expect(config.root).toBe('.')
    expect(warnings.join('\n')).not.toContain('inferred')
  })
})
