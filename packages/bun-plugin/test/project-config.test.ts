import { afterEach, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { stxPlugin } from '../src/index'

setDefaultTimeout(30000)

/**
 * A directory per test. `loadStxConfig` caches per project directory for the
 * life of the process, so reusing one path would serve the first test's config
 * to every later one.
 */
let TEMP_DIR = ''
let tempCounter = 0

/**
 * The plugin used to build its options as `{...defaultConfig, ...userOptions}`
 * and never read the project's own stx config — only the dev server did. So
 * one app rendered two ways: `stx dev` honoured `root`/`componentsDir`, and a
 * bundled build did not.
 *
 * The symptom in production was not a build failure. Components silently
 * resolved to "[Error loading component]" text, and because nothing was left
 * on the page carrying reactive syntax, the signals runtime was never injected
 * either — while the store bundle still was, so the page died on the first
 * `defineStore(...)` call. A build that exits 0 and ships a broken page is
 * exactly the failure a test has to cover.
 */
describe('BUN-PLUGIN: project stx config', () => {
  let cwd: string

  beforeEach(async () => {
    cwd = process.cwd()
    TEMP_DIR = path.join(import.meta.dir, `temp-project-config-${++tempCounter}`)
    await fs.promises.mkdir(path.join(TEMP_DIR, 'resources/components'), { recursive: true })
    await fs.promises.mkdir(path.join(TEMP_DIR, 'resources/views'), { recursive: true })
    await fs.promises.mkdir(path.join(TEMP_DIR, 'dist'), { recursive: true })
  })

  afterEach(async () => {
    process.chdir(cwd)
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  /**
   * A Stacks-shaped project: components live under `resources/`, which the
   * conventional search paths only reach when `root` is honoured.
   */
  async function scaffold(): Promise<void> {
    await Bun.write(
      path.join(TEMP_DIR, 'stx.config.ts'),
      `export default {
        root: 'resources',
        pagesDir: 'views',
        componentsDir: 'components',
        layoutsDir: 'layouts',
      }\n`,
    )
    await Bun.write(
      path.join(TEMP_DIR, 'resources/components/Banner.stx'),
      `<div class="banner">banner-rendered</div>\n`,
    )
    await Bun.write(
      path.join(TEMP_DIR, 'resources/views/index.stx'),
      `<!DOCTYPE html>
<html><head><title>t</title></head>
<body><Banner /></body>
</html>\n`,
    )
  }

  async function buildIndex(): Promise<string> {
    process.chdir(TEMP_DIR)
    await Bun.build({
      entrypoints: ['resources/views/index.stx'],
      outdir: 'dist',
      plugins: [stxPlugin()],
      naming: { entry: '[name].[ext]' },
    })
    return fs.promises.readFile(path.join(TEMP_DIR, 'dist/index.html'), 'utf8')
  }

  test('resolves a component from the configured root', async () => {
    await scaffold()
    const html = await buildIndex()

    expect(html).toContain('banner-rendered')
    expect(html).not.toContain('Error loading component')
  })

  test('explicit options still win over the project config', async () => {
    await scaffold()
    await fs.promises.mkdir(path.join(TEMP_DIR, 'override'), { recursive: true })
    await Bun.write(
      path.join(TEMP_DIR, 'override/Banner.stx'),
      `<div class="banner">override-rendered</div>\n`,
    )

    process.chdir(TEMP_DIR)
    await Bun.build({
      entrypoints: ['resources/views/index.stx'],
      outdir: 'dist',
      plugins: [stxPlugin({ componentsDir: path.join(TEMP_DIR, 'override') })],
      naming: { entry: '[name].[ext]' },
    })
    const html = await fs.promises.readFile(path.join(TEMP_DIR, 'dist/index.html'), 'utf8')

    expect(html).toContain('override-rendered')
  })

  test('a project with no stx config builds as before', async () => {
    await fs.promises.mkdir(path.join(TEMP_DIR, 'components'), { recursive: true })
    await Bun.write(
      path.join(TEMP_DIR, 'components/Banner.stx'),
      `<div class="banner">default-rendered</div>\n`,
    )
    await Bun.write(
      path.join(TEMP_DIR, 'resources/views/index.stx'),
      `<!DOCTYPE html>
<html><head><title>t</title></head>
<body><Banner /></body>
</html>\n`,
    )

    const html = await buildIndex()
    expect(html).toContain('default-rendered')
  })
})
