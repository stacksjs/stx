import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

/**
 * A name declared twice in one script must not destroy the page.
 *
 * The bundler appends a catch-all `export { … }` so Bun's tree-shake cannot
 * remove a declaration the template still refers to. The scan that builds that
 * list is a line-anchored regex, and it has to allow indentation — a
 * `<script client>` body is indented inside its template and not every call
 * path dedents it. That means it also matches declarations INSIDE functions,
 * so a local in a callback and a top-level binding of the same name both land
 * in the list, and Bun rejects the duplicate with "Multiple exports with the
 * same name".
 *
 * The cost is not a warning. A failed bundle leaves the raw `import` in the
 * inline script, the browser throws "Cannot use import statement outside a
 * module", and the entire page renders blank — which is what a shipped
 * wildloop deploy did over one `const owner`.
 */

const TMP = path.join(import.meta.dir, 'temp-duplicate-export-names')

describe('duplicate declaration names', () => {
  let projectRoot: string
  let pageFile: string

  beforeEach(async () => {
    projectRoot = path.join(TMP, `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    await fs.promises.mkdir(projectRoot, { recursive: true })
    await Bun.write(
      path.join(projectRoot, 'helper.ts'),
      'export function useHelper() { return { ok: true } }\n',
    )
    pageFile = path.join(projectRoot, 'page.stx')
  })

  afterEach(async () => {
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('survives the same name at top level and inside a callback', async () => {
    // The exact shape that broke the territory page.
    const output = await bundleClientScript(
      [
        `import { useHelper } from './helper'`,
        `const owner = useHelper()`,
        `function describe() {`,
        `  const owner = 'someone else'`,
        `  return owner`,
        `}`,
      ].join('\n'),
      pageFile,
      { projectRoot },
    )

    expect(output).not.toContain('import { useHelper }')
    expect(output).toContain('ok')
  })

  it('emits each name once, however many times it is declared', async () => {
    const output = await bundleClientScript(
      [
        `import { useHelper } from './helper'`,
        `const value = useHelper()`,
        `function a() { const value = 1; return value }`,
        `function b() { const value = 2; return value }`,
      ].join('\n'),
      pageFile,
      { projectRoot },
    )

    // A surviving `import` means the bundle failed and the raw source came
    // back — the failure mode that blanks the page.
    expect(output).not.toContain(`from './helper'`)
    expect(output).toContain('ok')

    // The catch-all export must name it once, not once per declaration.
    const exportLine = output.match(/export \{[^}]*\}/)?.[0] ?? ''
    expect((exportLine.match(/\bvalue\b/g) ?? []).length).toBeLessThanOrEqual(1)
  })

  it('still exposes a name that is only declared once', async () => {
    const output = await bundleClientScript(
      [
        `import { useHelper } from './helper'`,
        `const solo = useHelper()`,
      ].join('\n'),
      pageFile,
      { projectRoot },
    )

    expect(output).not.toContain(`from './helper'`)
    expect(output).toContain('solo')
    expect(output).toContain('ok')
  })
})
