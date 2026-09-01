/**
 * A page whose signals are declared in a module it imports.
 *
 * Every signal decision in the pipeline was a syntactic scan of the script's
 * own text, so factoring the declarations out made the page look static:
 *
 * ```stx
 * <script client>
 *   import { makeProbe } from '../functions/probe-factory'
 *   const { signal } = makeProbe()   // names no signal API
 * </script>
 * ```
 *
 * `{{ signal() }}` was then evaluated server-side (undefined, so empty), no
 * `__stx_setup_` function was generated, and `<body>` got no `data-stx` for the
 * runtime to invoke. Nothing logged at any layer. stacksjs/stacks#2394.
 *
 * The gate follows the import statically (imported-signals.ts); the setup pass
 * additionally bundles and re-tests, so it can only ever be more permissive
 * than the gate - the reverse would leave a literal mustache on the page.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { importsSignalDeclarations } from '../../src/imported-signals'
import { processDirectives } from '../../src/process'
import { usesSignalsInScript } from '../../src/expressions'

const DIR = path.join(import.meta.dir, 'temp-imported-signals')

describe('signals declared in an imported module', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(DIR, { recursive: true })
    await Bun.write(
      path.join(DIR, 'probe-factory.ts'),
      `import { state } from 'stx'\n\nexport function makeProbe() {\n  const signal = state(7)\n  return { signal }\n}\n`,
    )
    await Bun.write(
      path.join(DIR, 'plain-helpers.ts'),
      `export function shout(text: string): string {\n  return text.toUpperCase()\n}\n`,
    )
    // A barrel re-exporting the real module: one hop, not a dead end.
    await Bun.write(path.join(DIR, 'barrel.ts'), `export * from './probe-factory'\n`)
  })

  afterAll(async () => {
    await fs.promises.rm(DIR, { recursive: true, force: true })
  })

  const pageFile = path.join(DIR, 'page.stx')

  it('follows a relative import to the module that declares the signal', () => {
    const script = `import { makeProbe } from './probe-factory'\nconst { signal } = makeProbe()`
    expect(importsSignalDeclarations(script, pageFile)).toBe(true)
  })

  it('follows a barrel re-export one hop further', () => {
    const script = `import { makeProbe } from './barrel'\nconst { signal } = makeProbe()`
    expect(importsSignalDeclarations(script, pageFile)).toBe(true)
  })

  it('does not claim signals for a module that has none', () => {
    const script = `import { shout } from './plain-helpers'\nconst loud = shout('hi')`
    expect(importsSignalDeclarations(script, pageFile)).toBe(false)
  })

  it('reports nothing without a file to resolve against, as before', () => {
    const script = `import { makeProbe } from './probe-factory'`
    expect(importsSignalDeclarations(script, undefined)).toBe(false)
  })

  it('opens the {{ }} preservation gate for such a page', () => {
    const template = `<script client>\n  import { makeProbe } from './probe-factory'\n  const { signal } = makeProbe()\n</script>\n<p>{{ signal() }}</p>`

    expect(usesSignalsInScript(template)).toBe(false) // text-only, as before
    expect(usesSignalsInScript(template, pageFile)).toBe(true)
  })

  it('generates a setup function and stamps it onto <body>', async () => {
    const template = `<script client>\n  import { makeProbe } from './probe-factory'\n  const { signal } = makeProbe()\n</script>\n`
      + `<!DOCTYPE html>\n<html><body>\n<p id="v">{{ signal() }}</p>\n</body></html>\n`

    const html = await processDirectives(template, {}, pageFile, { debug: false } as any, new Set())

    const setupName = html.match(/function (__stx_setup_\w+)\(/)?.[1]
    expect(setupName).toBeTruthy()

    // Without the attribute the runtime never invokes the setup, so the
    // function ships, parses, and every binding on the page stays inert.
    const body = html.match(/<body\b[^>]*>/)?.[0] ?? ''
    expect(body).toContain(`data-stx="${setupName}"`)

    // The binding must survive to the client rather than being evaluated to ''.
    expect(html).toContain('{{ signal() }}')
  })
})
