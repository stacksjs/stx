/**
 * A page renders the same client scripts from any copy of the project.
 *
 * A deploy unpacks every release into a new directory. Scope ids were seeded
 * from a hash of the page's absolute path, and they are written into the
 * page's client scripts, which key the bundle cache: so the next release's
 * scripts differed byte for byte from the last one's, and every page rebuilt
 * its bundles - one build at a time - although nothing in it had changed.
 *
 * Rendered as production runs, from the project root (a release's working
 * directory), two copies of one project must produce the same ids and share
 * every cache entry.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { clearRenderMemos } from '../../src/render-memo'
import { createTempDir } from '../../src/temp-dir'

const FILES: Record<string, string> = {
  'functions/format.ts': 'export function formatPrice(n: number) { return `$${n}` }\n',
  // Reactive, so its script carries its scope id, as most components' do.
  'components/PriceTag.stx': `<span class="price" :text="label"></span>
<script client>
import { formatPrice } from '../functions/format'
const label = state(formatPrice(10))
</script>`,
  'page.stx': `<main><PriceTag /><PriceTag /></main>
<script client>
import { formatPrice } from './functions/format'
const total = formatPrice(20)
</script>`,
}

const original = { cwd: process.cwd(), cache: process.env.STX_BUNDLE_CACHE_DIR }
const dirs: string[] = []

afterEach(() => {
  process.chdir(original.cwd)
  if (original.cache === undefined)
    delete process.env.STX_BUNDLE_CACHE_DIR
  else
    process.env.STX_BUNDLE_CACHE_DIR = original.cache
  clearRenderMemos()
  for (const dir of dirs.splice(0))
    fs.rmSync(dir, { recursive: true, force: true })
})

function release(): string {
  // Real path: a release directory is reached without a symlink in front of
  // it, and a temp dir on macOS is not (/var -> /private/var).
  const dir = fs.realpathSync(createTempDir('stx-release-'))
  dirs.push(dir)
  for (const [file, content] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    fs.writeFileSync(path.join(dir, file), content)
  }
  return dir
}

/** Render `page.stx` as the production server does: from the release's own root. */
async function render(dir: string): Promise<string> {
  process.chdir(dir)
  clearRenderMemos()
  return processDirectives(
    FILES['page.stx'],
    {},
    path.join(dir, 'page.stx'),
    { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve' },
    new Set<string>(),
  )
}

const scopeIds = (html: string) => [...new Set(html.match(/stx_[A-Za-z0-9_]+_\d+_[a-z0-9]+/g) ?? [])].sort()
const cacheEntries = (dir: string) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(name => name.endsWith('.js')).sort() : []

describe('rendering from another copy of the project', () => {
  it('writes the same scope ids into the page', async () => {
    const first = scopeIds(await render(release()))
    const second = scopeIds(await render(release()))
    expect(first.length).toBeGreaterThan(0)
    expect(second).toEqual(first)
  })

  it('finds every client bundle the previous copy built', async () => {
    const cache = createTempDir('stx-shared-bundles-')
    dirs.push(cache)
    process.env.STX_BUNDLE_CACHE_DIR = cache

    await render(release())
    const built = cacheEntries(cache)
    expect(built.length).toBeGreaterThan(0)

    await render(release())
    expect(cacheEntries(cache)).toEqual(built)
  })
})
