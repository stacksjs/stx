import { describe, expect, it, setDefaultTimeout } from 'bun:test'

// Increase timeout for CI environments where Bun.build() can be slow
setDefaultTimeout(30000)
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import stxPlugin from '../src/index'
import { bundleBrowserAsset } from '../src/serve'

const TEST_DIR = import.meta.dir
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures')

describe('bun-plugin-stx serving', () => {
  it('should build a single .stx file', async () => {
    const result = await Bun.build({
      entrypoints: [path.join(FIXTURES_DIR, 'basic.stx')],
      outdir: './test/dist',
      plugins: [stxPlugin()],
    })

    expect(result.success).toBe(true)
    expect(result.outputs.length).toBeGreaterThan(0)
  })

  it('should process stx directives correctly', async () => {
    const result = await Bun.build({
      entrypoints: [path.join(FIXTURES_DIR, 'basic.stx')],
      outdir: './test/dist',
      plugins: [stxPlugin()],
    })

    expect(result.success).toBe(true)

    // Check that the output contains processed content
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    expect(htmlOutput).toBeDefined()

    if (htmlOutput) {
      const content = await htmlOutput.text()

      // Check that template variables were replaced
      expect(content).toContain('Hello from stx Plugin!')

      // Check that @foreach was processed (should contain list items)
      expect(content).toContain('<li>Apple</li>')
      expect(content).toContain('<li>Banana</li>')
      expect(content).toContain('<li>Cherry</li>')
      expect(content).toContain('<li>Date</li>')

      // Check that @if was processed (footer should be included)
      expect(content).toContain('This is a conditional footer')

      // Check that the directive syntax is removed
      expect(content).not.toContain('@foreach')
      expect(content).not.toContain('@endforeach')
      expect(content).not.toContain('@if')
      expect(content).not.toContain('@endif')
    }
  })

  it('should build multiple .stx files', async () => {
    const result = await Bun.build({
      entrypoints: [path.join(FIXTURES_DIR, 'basic.stx'), path.join(FIXTURES_DIR, 'about.stx')],
      outdir: './test/dist',
      plugins: [stxPlugin()],
    })

    expect(result.success).toBe(true)
    expect(result.outputs.length).toBeGreaterThan(1)
  })

  it('should process team list in about page', async () => {
    const result = await Bun.build({
      entrypoints: [path.join(FIXTURES_DIR, 'about.stx')],
      outdir: './test/dist',
      plugins: [stxPlugin()],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    expect(htmlOutput).toBeDefined()

    if (htmlOutput) {
      const content = await htmlOutput.text()

      // Check that page title was replaced
      expect(content).toContain('About Us')

      // Check that team members were rendered
      expect(content).toContain('Alice')
      expect(content).toContain('Developer')
      expect(content).toContain('Bob')
      expect(content).toContain('Designer')
      expect(content).toContain('Charlie')
      expect(content).toContain('Manager')
    }
  })

  it('should add SEO meta tags automatically', async () => {
    const result = await Bun.build({
      entrypoints: [path.join(FIXTURES_DIR, 'basic.stx')],
      outdir: './test/dist',
      plugins: [stxPlugin()],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    if (htmlOutput) {
      const content = await htmlOutput.text()

      // Check for SEO meta tags
      expect(content).toContain('<!-- stx SEO Tags -->')
      expect(content).toContain('<meta name="title"')
      expect(content).toContain('<meta property="og:title"')
      expect(content).toContain('<meta name="twitter:card"')
    }
  })

  it('should bundle TypeScript assets for browser modules', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'stx-asset-'))

    try {
      const helperPath = path.join(dir, 'helper.ts')
      const entryPath = path.join(dir, 'analytics.ts')

      await writeFile(helperPath, 'export const label = "bundled asset"\n')
      await writeFile(entryPath, [
        'import { label } from "./helper"',
        '',
        'const target = document.querySelector("[data-chart]")',
        'if (target) target.textContent = label',
      ].join('\n'))

      const response = await bundleBrowserAsset(entryPath)
      const code = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/javascript')
      expect(code).toContain('bundled asset')
      expect(code).not.toContain('from "./helper"')
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
