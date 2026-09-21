/**
 * Only TOP-LEVEL declarations are exported from a bundle entry (stacksjs/stx#1959).
 *
 * To stop Bun tree-shaking a script's bindings, the bundler appends
 * `export { … }` for every declaration it finds. The scan allowed indentation,
 * because script bodies arrive indented inside templates, and indentation cannot
 * tell a top-level declaration from a local inside a callback. So the ordinary
 *
 *   import { greet } from './functions/greet'
 *   onMount(async () => {
 *     const data = greet()
 *   })
 *
 * put `data` in the export list. Bun exposes nothing for a nested local, the
 * build was then read as having "dropped every binding", the unbundled source
 * was served, and the browser rejected the whole script on its raw `import`:
 * `Cannot use import statement outside a module`.
 */
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

function project(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'stx-1959-'))
  mkdirSync(path.join(dir, 'functions'), { recursive: true })
  writeFileSync(path.join(dir, 'functions', 'greet.ts'), 'export function greet() { return "hi" }\n')
  return dir
}

const IMPORT = `import { greet } from './functions/greet'\n`
const hasRawImport = (out: string): boolean => /^\s*import\s/m.test(out)

let warn: ReturnType<typeof spyOn> | undefined
afterEach(() => warn?.mockRestore())

/** Bundle in both modes; fail if either fell back to the unbundled source. */
async function bundleBothWays(code: string): Promise<{ registry: string, inline: string }> {
  const dir = project()
  warn = spyOn(console, 'warn')
  const registry = await bundleClientScript(code, path.join(dir, 'page.stx'), { projectRoot: dir })
  const inline = await bundleClientScript(code, path.join(dir, 'page.stx'), { projectRoot: dir, externalizeUserModules: false })
  const fellBack = warn.mock.calls.some(call => String(call[0]).includes('dropped every binding'))
  expect(fellBack).toBe(false)
  return { registry, inline }
}

describe('nested declarations are not exported (#1959)', () => {
  it('bundles the onMount shape that used to be served raw', async () => {
    const { registry, inline } = await bundleBothWays(`${IMPORT}onMount(async () => {\n  const data = greet()\n  console.info(data)\n})`)

    expect(hasRawImport(registry)).toBe(false)
    expect(hasRawImport(inline)).toBe(false)
    // Inlined mode really inlined the module rather than giving up.
    expect(inline).toContain('"hi"')
  })

  it('bundles a var on its own line inside a function callback', async () => {
    const { registry, inline } = await bundleBothWays(`${IMPORT}setTimeout(function () {\n  var msg = greet()\n  console.info(msg)\n}, 0)`)

    expect(hasRawImport(registry)).toBe(false)
    expect(hasRawImport(inline)).toBe(false)
  })

  it('still exposes top-level bindings, and only those', async () => {
    const { inline } = await bundleBothWays([
      IMPORT.trimEnd(),
      'const shown = greet()',
      'function helper() {',
      '  const hidden = shown',
      '  return hidden',
      '}',
    ].join('\n'))

    expect(inline).toContain('var shown = undefined')
    expect(inline).toContain('var helper = undefined')
    expect(inline).not.toContain('var hidden = undefined')
  })

  it('keeps a real top-level binding when a regex brace makes depth untrustworthy', async () => {
    // The stripper does not recognise regex literals, so /\{/ leaves a brace
    // behind and every later depth reads one too deep. Trusting it would drop
    // `shown` from the exports and Bun would tree-shake it; the fallback keeps
    // every match instead, which is what the scan did before #1959.
    const { inline } = await bundleBothWays([
      IMPORT.trimEnd(),
      'const pattern = /\\{/',
      'const shown = greet()',
    ].join('\n'))

    expect(inline).toContain('var shown = undefined')
    expect(inline).toContain('var pattern = undefined')
  })
})
