import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { generateStaticSite } from '../../src/ssg'
import { readStaticPaths } from '../../src/ssg-static-paths'
import { createTempDir } from '../../src/temp-dir'

const originalCwd = process.cwd()
const cli = path.resolve(import.meta.dir, '../../bin/cli.ts')
let root = ''
let warnings: string[] = []
let info: string[] = []
let warn: ReturnType<typeof spyOn>
let inform: ReturnType<typeof spyOn>

beforeEach(async () => {
  root = createTempDir('stx-static-paths-')
  warnings = []
  info = []
  warn = spyOn(console, 'warn').mockImplementation((...args) => { warnings.push(args.join(' ')) })
  inform = spyOn(console, 'info').mockImplementation((...args) => { info.push(args.join(' ')) })
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default { ssr: false, plugins: [] }')
  await Bun.write(path.join(root, 'views/index.stx'), '<main>Home</main>')
  process.chdir(root)
})

afterEach(async () => {
  process.chdir(originalCwd)
  warn.mockRestore()
  inform.mockRestore()
  await rm(root, { recursive: true, force: true })
})

async function page(script: string, server = true) {
  const file = path.join(root, 'views/posts/[id].stx')
  await Bun.write(file, `${server ? `<script server>${script}</script>` : script}<main>Post</main>`)
  return file
}

async function build() {
  const failures: Array<{ error: Error, route?: string }> = []
  const result = await generateStaticSite({
    pagesDir: 'views', outputDir: 'dist', domain: 'https://ssg.test',
    sitemap: false, robots: false, cache: false, minify: false, generate404: false,
    hooks: { onError(error, route) { failures.push({ error, route }) } },
  })
  return { result, failures }
}

describe('getStaticPaths failures (#2116)', () => {
  it.each([
    'export function getStaticPaths() {\nthrow new Error("ERR_MYSQL_CONNECTION_REFUSED")\n}',
    'export async function getStaticPaths() {\nawait Promise.reject(new Error("ERR_MYSQL_CONNECTION_REFUSED"))\n}',
  ])('records a thrown/rejected hook as a route failure rather than a missing hook', async (script) => {
    const file = await page(script)
    const { result, failures } = await build()
    expect(result.failedCount).toBe(1)
    expect(result.successCount).toBe(1)
    expect(result.totalPages).toBe(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].route).toBe('/posts/:id')
    expect(result.errors[0].error.message).toContain('ERR_MYSQL_CONNECTION_REFUSED')
    expect(result.errors[0].error.message).toContain(file)
    expect(result.errors[0].error.message).toContain('getStaticPaths')
    expect(failures).toHaveLength(1)
    expect(failures[0].route).toBe('/posts/:id')
    expect(warnings.join('\n')).not.toContain('has no getStaticPaths')
    expect(existsSync(path.join(root, 'dist/index.html'))).toBe(true)
  })

  it('reports a syntax/extraction failure with its file instead of pretending the hook is absent', async () => {
    const file = await page('export function getStaticPaths() { return { paths: [] };')
    const { result } = await build()
    expect(result.failedCount).toBe(1)
    expect(result.errors[0].error.message).toContain(file)
    expect(result.errors[0].error.message).toMatch(/parse|extract/i)
    expect(warnings.join('\n')).not.toContain('has no getStaticPaths')
  })

  it.each(['null', '{}', '{ paths: "bad" }', '{ paths: [null] }', '{ paths: [{}] }'])('rejects malformed hook results: %s', async (value) => {
    await page(`export function getStaticPaths() { return ${value}; }`)
    const { result } = await build()
    expect(result.failedCount).toBe(1)
    expect(result.errors[0].error.message).toMatch(/return|paths|params/i)
    expect(warnings.join('\n')).not.toContain('has no getStaticPaths')
  })

  it.each(['<main>No server block</main>', '<script server>const note = "getStaticPaths" // function getStaticPaths() {}\n</script>'])('warns only when the hook really is absent', async (source) => {
    await page(source, false)
    const { result } = await build()
    expect(result.failedCount).toBe(0)
    expect(result.errors).toEqual([])
    expect(warnings.join('\n')).toContain('has no getStaticPaths')
  })

  it.each(['{ paths: [] }', '[]'])('treats an intentional empty result as distinct from absence: %s', async (value) => {
    await page(`export function getStaticPaths() { return ${value}; }`)
    const { result } = await build()
    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(1)
    expect(warnings.join('\n')).not.toContain('has no getStaticPaths')
    expect(info.join('\n')).toMatch(/getStaticPaths.*(?:empty|no paths)/i)
  })

  it.each([
    'export function getStaticPaths() { return { paths: [{ params: { id: "ok" } }] }; }',
    `export async function getStaticPaths() {
      const rows = [{ id: 'ok' }]
      if (!rows.length) {
        return { paths: [] }
      }
      return { paths: rows.map(row => ({ params: { id: row.id } })) }
    }`,
    'export const getStaticPaths = async () => ({ paths: [{ params: { id: "ok" } }] })',
    `import { defineStaticPaths } from ${JSON.stringify(path.resolve(import.meta.dir, '../../src/ssg.ts'))}\nexport const getStaticPaths = defineStaticPaths(() => [{ params: { id: "ok" } }])`,
  ])('generates paths from supported declarations without truncating nested bodies', async (script) => {
    await page(script)
    const { result } = await build()
    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(2)
    expect(existsSync(path.join(root, 'dist/posts/ok.html'))).toBe(true)
  })

  it('handles TypeScript and braces in comments, regex and nested template strings', async () => {
    const file = await page(`export async function getStaticPaths(): Promise<{ paths: { params: { id: string } }[] }> {
      // } not the end of this function
      const matches: boolean = /[{}]/.test('}')
      const text = \`brace } \${matches ? '}' : '{'}\`
      if (text) { /* } */ return { paths: [{ params: { id: 'lexical' } }] } }
      return { paths: [] }
    }`)
    expect(await readStaticPaths(file)).toEqual({ kind: 'ok', value: { paths: [{ params: { id: 'lexical' } }] } })
  })

  it('finds the hook in a later server block without running unrelated page setup', async () => {
    const file = await page('<script server>throw new Error("page-only setup")</script><script server>export function getStaticPaths() { return { paths: [] } }</script>', false)
    expect(await readStaticPaths(file)).toEqual({ kind: 'ok', value: { paths: [] } })
  })

  it('preserves case-insensitive explicit server attributes', async () => {
    const file = await page('<SCRIPT SERVER type="module">export function getStaticPaths() { return { paths: [] } }</SCRIPT>', false)
    expect(await readStaticPaths(file)).toEqual({ kind: 'ok', value: { paths: [] } })
  })

  it('does not confuse data attributes or quoted values with an explicit server marker', async () => {
    const file = await page('<script data-server data-note="hello server world">function getStaticPaths() { throw new Error("not server code") }</script>', false)
    expect(await readStaticPaths(file)).toEqual({ kind: 'absent' })
  })

  it('reports unsupported extraction separately instead of treating a present export as absent', async () => {
    await page('const other = () => ({ paths: [] }); export { other as getStaticPaths }')
    const { result } = await build()
    expect(result.failedCount).toBe(1)
    expect(result.errors[0].error.message).toContain('Could not extract getStaticPaths')
    expect(warnings.join('\n')).not.toContain('has no getStaticPaths')
  })

  it('retains file-read failures as errors', async () => {
    const result = await readStaticPaths(path.join(root, 'missing.stx'))
    expect(result.kind).toBe('error')
    if (result.kind !== 'error') throw new Error('expected a read failure')
    expect(result.phase).toBe('read')
    expect(result.error.message).toContain('ENOENT')
  })

  it('does not silently substitute the builtin for a module-local factory', async () => {
    await page('function defineStaticPaths() { throw new Error("CUSTOM_FACTORY_FAILED") }; export const getStaticPaths = defineStaticPaths(() => [])')
    const { result } = await build()
    expect(result.failedCount).toBe(1)
    expect(result.errors[0].error.message).toContain('module-local defineStaticPaths')
  })

  it.each([
    { script: 'export function getStaticPaths() {\nthrow new Error("DB_OFFLINE")\n}', failure: true },
    { script: 'export function getStaticPaths() { return { paths: [] };', failure: true },
    { script: 'export function getStaticPaths() { return { paths: [] }; }', failure: false },
  ])('the actual build CLI has the correct exit status (failure=$failure)', async ({ script, failure }) => {
    await page(script)
    const proc = Bun.spawn(['bun', cli, 'build', '--pages', 'views', '--out', 'dist', '--no-cache', '--no-sitemap', '--no-minify'], {
      cwd: root, stdout: 'pipe', stderr: 'pipe',
    })
    const [status, stdout, stderr] = await Promise.all([proc.exited, new Response(proc.stdout).text(), new Response(proc.stderr).text()])
    expect(status === 0).toBe(!failure)
    if (failure) {
      expect(stdout + stderr).toContain('getStaticPaths')
      expect(stdout + stderr).toContain('[id].stx')
    }
  }, 30_000)
})
