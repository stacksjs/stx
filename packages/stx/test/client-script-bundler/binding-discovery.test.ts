import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

/**
 * Which top-level bindings a client script publishes back to its template.
 *
 * The bundler adds a catch-all `export` so Bun's tree-shake cannot remove a
 * declaration the template still refers to, then re-binds those names around
 * the bundle IIFE. Every case here is one where that scan used to come back
 * short, and a short scan is invisible: the page renders, and every expression
 * that needed the missing name silently evaluates against `undefined`.
 */

const TMP = path.join(import.meta.dir, 'temp-binding-discovery')

describe('client-script-bundler binding discovery', () => {
  let projectRoot: string

  beforeEach(async () => {
    projectRoot = path.join(TMP, `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    await fs.promises.mkdir(projectRoot, { recursive: true })
    await Bun.write(
      path.join(projectRoot, 'composable.ts'),
      'export function useThing() { return { board: 1, loading: false, extra: 2 } }\nexport const LABEL = \'thing\'\n',
    )
  })

  afterEach(async () => {
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('finds declarations that are indented, as every template script is', async () => {
    // Not every call path dedents the script before bundling, so anchoring the
    // scan at column 0 lost the whole page.
    const output = await bundleClientScript(
      [
        `  import { LABEL } from './composable'`,
        ``,
        `  const heading = LABEL`,
        `  function shout() { return heading.toUpperCase() }`,
      ].join('\n'),
      path.join(projectRoot, 'Indented.stx'),
      { projectRoot },
    )

    expect(output).toContain('var heading = undefined')
    expect(output).toContain('heading = __stxBundle_')
    expect(output).toContain('var shout = undefined')
    expect(output).toContain('shout = __stxBundle_')
  })

  it('publishes the local name of a renamed destructure, not the key', async () => {
    // `{ board: recordBoard }` binds `recordBoard`. Exporting `board` names
    // something that does not exist, and Bun then emits no export list at all.
    const output = await bundleClientScript(
      `import { useThing } from './composable'\nconst { board: recordBoard, loading: isLoading } = useThing()`,
      path.join(projectRoot, 'Renamed.stx'),
      { projectRoot },
    )

    expect(output).toContain('var recordBoard = undefined')
    expect(output).toContain('recordBoard = __stxBundle_')
    expect(output).toContain('var isLoading = undefined')
    expect(output).not.toContain('var board = undefined')
  })

  it('handles defaults, rest elements, and plain entries in one pattern', async () => {
    const output = await bundleClientScript(
      `import { useThing } from './composable'\nconst { board, loading: busy = true, ...rest } = useThing()`,
      path.join(projectRoot, 'Mixed.stx'),
      { projectRoot },
    )

    expect(output).toContain('var board = undefined')
    expect(output).toContain('var busy = undefined')
    expect(output).toContain('var rest = undefined')
  })

  it('still publishes an unindented script, the case that always worked', async () => {
    const output = await bundleClientScript(
      `import { LABEL } from './composable'\nconst title = LABEL`,
      path.join(projectRoot, 'Flat.stx'),
      { projectRoot },
    )

    expect(output).toContain('var title = undefined')
    expect(output).toContain('title = __stxBundle_')
  })

  it('leaves an already-exported declaration alone rather than re-exporting it', async () => {
    const output = await bundleClientScript(
      `import { LABEL } from './composable'\n  export const shared = LABEL`,
      path.join(projectRoot, 'AlreadyExported.stx'),
      { projectRoot },
    )

    // The point is that the bundle builds at all: re-exporting a name Bun has
    // already exported fails with "Multiple exports with the same name".
    expect(output).not.toContain('Multiple exports')
  })
})
