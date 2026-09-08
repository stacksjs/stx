import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'

/**
 * The utility-CSS engine has shipped under three package names: it now lives
 * at the `engine` subpath of `@stacksjs/ts-css`, which absorbed it, and before
 * that it was standalone as `@cwcss/crosswind` and `@stacksjs/crosswind`.
 *
 * The loader probes a fixed table of paths, so a wrong entry fails the way a
 * missing engine does — silently, with every utility class compiling to
 * nothing — rather than by throwing. These tests plant a real package layout
 * on disk and check the loader actually finds it.
 */

const LOADER = path.join(import.meta.dir, '..', 'src', 'dev-server', 'crosswind.ts')

const cwd = process.cwd()
const created: string[] = []

afterEach(async () => {
  process.chdir(cwd)
  for (const dir of created.splice(0))
    await rm(dir, { recursive: true, force: true })
})

/** A project whose store holds an engine at `relPath`, marked with `marker`. */
async function projectWithEngine(relPath: string[], marker: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-engine-'))
  created.push(dir)
  const file = path.join(dir, 'node_modules', ...relPath)
  mkdirSync(path.dirname(file), { recursive: true })
  await writeFile(
    file,
    `export class CSSGenerator { marker = ${JSON.stringify(marker)}; generate() {} toCSS() { return '' } }\n`
    + `export const config = { marker: ${JSON.stringify(marker)} }\n`,
  )
  return dir
}

/** Fresh module instance — the loader memoises its result per module. */
async function freshLoader(): Promise<any> {
  return import(`${LOADER}?resolution-test=${Math.random()}`)
}

describe('engine resolution', () => {
  test('finds the engine at the @stacksjs/ts-css subpath', async () => {
    const dir = await projectWithEngine(['@stacksjs', 'ts-css', 'dist', 'engine', 'index.js'], 'ts-css-engine')
    process.chdir(dir)

    const { loadCrosswind } = await freshLoader()
    const mod = await loadCrosswind()

    expect(mod).not.toBeNull()
    expect(new mod.CSSGenerator({}).marker).toBe('ts-css-engine')
  })

  test('still finds a project on the standalone @cwcss/crosswind', async () => {
    const dir = await projectWithEngine(['@cwcss', 'crosswind', 'dist', 'index.js'], 'cwcss')
    process.chdir(dir)

    const { loadCrosswind } = await freshLoader()
    const mod = await loadCrosswind()

    expect(mod).not.toBeNull()
    expect(new mod.CSSGenerator({}).marker).toBe('cwcss')
  })

  test('prefers @stacksjs/ts-css when a project has both installed', async () => {
    const dir = await projectWithEngine(['@stacksjs', 'ts-css', 'dist', 'engine', 'index.js'], 'ts-css-engine')
    const legacy = path.join(dir, 'node_modules', '@cwcss', 'crosswind', 'dist', 'index.js')
    mkdirSync(path.dirname(legacy), { recursive: true })
    await writeFile(legacy, 'export class CSSGenerator { marker = \'cwcss\' }\nexport const config = {}\n')
    process.chdir(dir)

    const { loadCrosswind } = await freshLoader()
    const mod = await loadCrosswind()

    // An app that has upgraded must get the engine it declares, not the
    // leftover it has not removed yet.
    expect(new mod.CSSGenerator({}).marker).toBe('ts-css-engine')
  })
})
